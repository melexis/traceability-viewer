"""Python module to create the database using the config file"""

import os
import re
import json
from string import Template
from pathlib import Path, PurePath
from ruamel.yaml import YAML
from neomodel import db, clear_neo4j_database, remove_all_labels, install_labels
from myapp.models import DocumentItem, Rel

remove_all_labels()
install_labels(DocumentItem)
install_labels(Rel)

CONFIG_PATH = Path(__file__).parent.parent.parent / "config.yml"


def validate_keyword(config, keyword, expected_types, required=False):
    """Validate a keyword of the configuration file if it exists and it is the expected type"""
    if required:
        if keyword not in config:
            raise ValueError(f"Failed to find mandatory parameter {keyword!r} in the configuration file")
        if not isinstance(config[keyword], expected_types):
            part_of_config = config[keyword]
            raise TypeError(
                f"Expected the {keyword} in the configuration file to be a {expected_types}; "
                f"got {type(part_of_config)}"
            )
    else:
        if keyword in config:
            if not isinstance(config[keyword], expected_types):
                part_of_config = config[keyword]
                raise TypeError(
                    f"Expected the {keyword} in the configuration file to be a {expected_types}; "
                    f"got {type(part_of_config)}"
                )


def validate():
    """Validate the configuration file. Variable substitution is done where needed."""
    yaml = YAML()
    with open(CONFIG_PATH, "r", encoding="utf-8") as open_file:
        config = yaml.load(open_file)

    validate_keyword(config, "variables", dict)

    validate_keyword(config, "layered", bool, True)
    if config["layered"]:
        validate_keyword(config, "layers", (dict, list), True)

    file_changed = False
    for keyword in ["item_colors", "link_colors"]:
        validate_keyword(config, keyword, dict)
        if config.get(keyword) is None:
            config[keyword] = {"others": "black"}
            file_changed = True
        else:
            if config[keyword].get("others") is None:
                config[keyword]["others"] = "black"
                file_changed = True

    if file_changed:
        with open(CONFIG_PATH, "w", encoding="utf-8") as config_file:
            yaml.dump(config, config_file)

    validate_keyword(config, "traceability_export", str, True)
    validate_keyword(config, "html_documentation_root", str)

    for variable_name in ["traceability_export", "html_documentation_root"]:
        template = config.get(variable_name, "")
        try:
            variable_value = Template(template).substitute(os.environ)
            config[variable_name] = variable_value
        except KeyError as error:
            raise ValueError(
                f"The configuration for {variable_name} contains an undefined environment variable: {error}"
            ) from error

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


def get_legend_group_and_color(item_colors, item_id):
    """str: Get the value by a regex"""
    for regex in item_colors:
        if re.match(regex, item_id):
            return regex, item_colors[regex]
    return "others", item_colors["others"]


def run():
    """Create a Neo4j database"""

    configuration = validate()
    if "layers" in configuration:
        groups_list = list(configuration["layers"]) + list(configuration["layers"].values())
        unique_groups = list(dict.fromkeys(groups_list))
    data = {}
    path = configuration["traceability_export"]
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
        source = item["name"]
        del props["targets"]
        del props["attributes"]
        del props["id"]
        del props["name"]
        if source not in node_objects:
            if "layered":
                source_layer_group = define_group(source, unique_groups)
            source_legend_group, source_color = get_legend_group_and_color(configuration["item_colors"], source)
            url = ""
            if props["document"] and configuration["html_documentation_root"] != "":
                document = props["document"]
                url += str(PurePath(configuration["html_documentation_root"]).joinpath(f"{document}.html#{source}"))
            node_objects[source] = DocumentItem(
                name=source,
                layer_group=source_layer_group,
                color=source_color,
                legend_group=source_legend_group,
                url=url,
            )
        source_object = node_objects[source]
        source_object.props = json.dumps(props)
        source_object.attributes = attributes

        for link, targets in targets_per_relationship.items():
            if link in configuration["backwards_relationships"].keys():
                continue  # skip backwards relationships
            link_color = define_linkcolor(configuration["link_colors"], link)
            for target in targets:
                if target not in node_objects:
                    if "layers" in configuration:
                        target_layer_group = define_group(target, unique_groups)
                    target_legend_group, target_color = get_legend_group_and_color(configuration["item_colors"], target)
                    node_objects[target] = DocumentItem(
                        name=target,
                        layer_group=target_layer_group,
                        color=target_color,
                        legend_group=target_legend_group,
                    )
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
