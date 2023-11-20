"""Python module to create the database using the config file"""

from os import getenv
import re
import json
from pathlib import Path
from ruamel.yaml import YAML
from neomodel import db, clear_neo4j_database
from myapp.models import DocumentItem


def validate_keyword(config, keyword, expected_type, required=True):
    """Validate a keyword of the configuration file if it exists and it is the expected type"""
    if required:
        if keyword not in config:
            raise ValueError(f"Failed to find mandatory parameter {keyword!r} in the configuration file")
        if not isinstance(config[keyword], expected_type):
            part_of_config = config[keyword]
            raise TypeError(
                f"Expected the {keyword} in the configuration file to be a {expected_type}; "
                f"got {type(part_of_config)}"
            )
    else:
        if keyword in config:
            if not isinstance(config[keyword], expected_type):
                part_of_config = config[keyword]
                raise TypeError(
                    f"Expected the {keyword} in the configuration file to be a {expected_type}; "
                    f"got {type(part_of_config)}"
                )


def validate():
    """Validate the igiguration file"""
    config_path = getenv("CONFIG_FILE")
    if config_path is None:
        raise ValueError("No configuration path is given")

    yaml = YAML()
    with open(config_path, "r", encoding="utf-8") as open_file:
        config = yaml.load(open_file)

    validate_keyword(config, "variables", dict)
    # validate_keyword(config["variables"], "BASE_URL", str)
    # variables = conf["variables"]
    # if variables.get("BASE_URL") is None:
    #     raise TypeError(f"Expected 'BASE_URL' to be in 'variables' of the configuration file; got 'None'")
    # elif not isinstance(variables, dict):
    #     raise TypeError(f"Expected the 'variables' in the configuration file to be a dict; got {type(variables)} ")

    # validate_keyword(config, "database_path", list)
    # validate_keyword(config, "html_dir", list, required=False)
    validate_keyword(config, "layered", bool)
    if config["layered"]:
        validate_keyword(config, "layers", dict)

    file_changed = False
    for keyword in ["item_colors", "link_colors"]:
        validate_keyword(config, keyword, dict)
        if config[keyword].get("others") is None:
            config[keyword]["others"] = "black"
            file_changed = True

    if file_changed:
        with open(config_path, "w", encoding="utf-8") as config_file:
            yaml.dump(config, config_file)

    return config


def define_linkcolor(link_colors, rel):
    """str: Define the color of the link as configured in the configuration"""
    fallback_color = link_colors["others"]
    return link_colors.get(rel, fallback_color)


def define_group(item_id, unique_groups):
    """str: Define the group depending on the name of the node"""
    for regex in unique_groups:
        if re.match(regex, item_id):
            return regex
    return "others"


def get_value_by_regex(item_colors, item_id):
    """str: Get the value by a regex"""
    for regex in item_colors:
        if re.match(regex, item_id):
            return item_colors[regex]
    return item_colors["others"]


def run():
    """Create a Neo4j database"""

    configuration = validate()
    groups_list = list(configuration["layers"]) + list(configuration["layers"].values())
    unique_groups = list(dict.fromkeys(groups_list))
    data = {}
    path = getenv("JSON_EXPORT")
    print(path)
    with open(path, encoding="utf-8") as json_file:
        data = json.load(json_file)
    clear_neo4j_database(db, clear_constraints=True, clear_indexes=True)
    node_objects = {}
    relationships = []
    for item in data:
        targets_per_relationship = item["targets"]
        attributes = item["attributes"]
        props = {}
        props = item
        source = item["id"]
        del props["targets"]
        del props["attributes"]
        del props["id"]
        del props["name"]
        if source not in node_objects:
            source_group = define_group(source, unique_groups)
            source_color = get_value_by_regex(configuration["item_colors"], source)
            node_objects[source] = DocumentItem(name=source, group=source_group, color=source_color)
        source_object = node_objects[source]
        source_object.props = props
        source_object.attributes = attributes

        for link, targets in targets_per_relationship.items():
            if link in configuration["backwards_relationships"].keys():
                continue  # skip backwards relationships
            link_color = define_linkcolor(configuration["link_colors"], link)
            for target in targets:
                if target not in node_objects:
                    target_group = define_group(target, unique_groups)
                    target_color = get_value_by_regex(configuration["item_colors"], target)
                    node_objects[target] = DocumentItem(name=target, group=target_group, color=target_color)
                relationships.append(
                    {
                        "source": source_object,
                        "target": node_objects[target],
                        "type": link,
                        "link_color": link_color,
                    }
                )

    for node_object in node_objects.values():
        node_object.save()
    for link in relationships:
        source_object = link["source"]
        link_properties = {"type": link["type"], "color": link["link_color"]}
        relation_object = source_object.relations.connect(link["target"], link_properties)
        relation_object.save()
    for node_object in node_objects.values():
        node_object.save()
