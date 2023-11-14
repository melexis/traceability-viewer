import re
from ruamel.yaml import YAML
from neomodel import db, clear_neo4j_database
from myapp.models import DocumentItem
import json


def run():
    """Create a Neo4j database"""
    with open("../config.yml", "r", encoding="utf-8") as open_file:
        configuration = YAML().load(open_file)

    def validate(configuration):
        # layers: dict
        # layered = true
        # layers: empty
        # layered = false

        # colors: others?

        pass

    validate(configuration)

    groups_list = list(configuration["layers"]) + list(configuration["layers"].values())
    unique_groups = list(dict.fromkeys(groups_list))

    def define_linkcolor(link_colors, rel):
        fallback_color = link_colors["others"]
        return link_colors.get(rel, fallback_color)

    def define_group(item_id):
        for regex in unique_groups:
            if re.match(regex, item_id):
                return regex
        return "others"

    def get_value_by_regex(item_colors, item_id):
        for regex in item_colors:
            if re.match(regex, item_id):
                return item_colors[regex]
        return item_colors["others"]

    path = ""
    data = {}
    for i in configuration["json_folder"]:
        path += str(i)

    with open(path, encoding="utf-8") as json_file:
        data = json.load(json_file)
    clear_neo4j_database(db, clear_constraints=True, clear_indexes=True)
    node_objects = {}
    relationships = []
    for item in data:
        targets_per_relationship = item["targets"]
        attr = item["attributes"]
        props = {}
        props = item
        source = item["id"]
        del props["targets"]
        del props["attributes"]
        del props["id"]
        del props["name"]
        if source not in node_objects:
            source_group = define_group(source)
            source_color = get_value_by_regex(configuration["item_colors"], source)
            node_objects[source] = DocumentItem(name=source, group=source_group, color=source_color)
        source_object = node_objects[source]
        source_object.props = props
        source_object.attributes = attr

        for link, targets in targets_per_relationship.items():
            if link in configuration["backwards_relationships"].keys():
                continue  # skip backwards relationships
            link_color = define_linkcolor(configuration["link_colors"], link)
            for target in targets:
                if target not in node_objects:
                    target_group = define_group(target)
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
