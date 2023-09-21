"""
Python module to make the neo4j database with the exported json file of all items.
"""

import json
from neo4j import GraphDatabase
from ruamel.yaml import YAML

URI = "bolt://localhost:7687"

with open("config.yml", "r", encoding="utf-8") as open_file:
    config = YAML().load(open_file)

config_dict = json.loads(json.dumps(config))

groups = list(config_dict["group_colors"].keys())

# ensure that a working connection is established
with GraphDatabase.driver(URI, encrypted=False) as graphdb:
    graphdb.verify_connectivity()

PATH = ""
for item in config_dict["json_folder"]:
    PATH += str(item)

with open(PATH, encoding="utf-8") as json_file:
    data = json.load(json_file)


def add_item(tx, id_item):
    """Add document item to the graph database.
    Args:
        id_item (str): ID of document item
    """
    tx.run("CREATE (n:DocItem {id: $id}) ", id=id_item)


def add_properties(tx, id_item, properties):
    """Add properties of the document item in the graph database.
    Args:
        id_item (str): ID of the document item
        properties (dict): Dictionary of the properties of the document item
    """
    tx.run(
        """MATCH (n:DocItem)
           WHERE n.id = $id
           SET n += $props""",
        id=id_item,
        props=properties,
    )


def add_attributes(tx, id_item, attributes):
    """Add the attributes of the document item in the graph database.
    Args:
        id_item (str): ID of the document item
        attributes (json): JSON string of the attributes of the document item
    """
    tx.run(
        """MATCH (n:DocItem)
           WHERE n.id = $id
           SET n.attributes = $attr""",
        id=id_item,
        attr=attributes,
    )


def add_group_and_color(tx, id_item, group, color):
    """Add the group and color of that group to the document item in the graph database.
    Args:
        id_item (str): ID of the document item
        group (str): The group where the document item belongs to.
        color (str): The color of that group.
    """
    tx.run(
        """MATCH (n:DocItem)
           WHERE n.id = $id
           SET n.group = $group,
               n.color = $color""",
        id=id_item,
        group=group,
        color=color,
    )


def add_relationship(tx, source_id, target_id, relation_type, color):
    """Add relationship between two document items in the graph database.
    Args:
        source_id (str): ID of the source
        target_id (str): ID of the target
        relation_type (str): The type of relationship between those document items
        color (str): The color of that type of relationship
    """
    query = (
        "MATCH (a:DocItem), (b:DocItem) WHERE a.id = '"
        + source_id
        + "' AND b.id = '"
        + target_id
        + "' CREATE (a)-[:"
        + relation_type
        + " {source: '"
        + source_id
        + "', target: '"
        + target_id
        + "', color: '"
        + color
        + "'}]->(b)"
    )
    tx.run(query)


# run the query in a session
with graphdb.session() as session:
    session.run(
        """MATCH (n)
                DETACH DELETE n"""
    )
    nodes_made = []
    for i, item in enumerate(data):
        targets = item["targets"]
        attr = item["attributes"]
        props = {}
        props = item
        id1 = item["id"]
        if id1 not in nodes_made:
            session.execute_write(add_item, id1)
            nodes_made.append(id1)

        if targets != {}:
            for rel in targets:
                rel_targets = {}
                for id2 in targets[rel]:
                    if id2 not in nodes_made:
                        session.execute_write(add_item, id2)
                        nodes_made.append(id2)
                    if rel in list(config_dict["link_colors"].keys()):
                        session.execute_write(add_relationship, id1, id2, rel, config_dict["link_colors"][rel])
                    else:
                        session.execute_write(add_relationship, id1, id2, rel, "#808080")
        del props["targets"]
        session.execute_write(add_attributes, id1, json.dumps(attr))
        del props["attributes"]
        session.execute_write(add_properties, id1, props)

        if id1.startswith(groups[0]):
            session.execute_write(add_group_and_color, id1, groups[0], config_dict["group_colors"][groups[0]])
        elif id1.startswith(groups[1]):
            session.execute_write(add_group_and_color, id1, groups[1], config_dict["group_colors"][groups[1]])
        elif id1.startswith(groups[2]):
            session.execute_write(add_group_and_color, id1, groups[2], config_dict["group_colors"][groups[2]])
        elif id1.startswith(groups[3]):
            session.execute_write(add_group_and_color, id1, groups[3], config_dict["group_colors"][groups[3]])
        elif id1.startswith(groups[4]):
            session.execute_write(add_group_and_color, id1, groups[4], config_dict["group_colors"][groups[4]])
        elif id1.startswith(groups[5]):
            session.execute_write(add_group_and_color, id1, groups[5], config_dict["group_colors"][groups[5]])
        elif id1.startswith(groups[6]):
            session.execute_write(add_group_and_color, id1, groups[6], config_dict["group_colors"][groups[6]])
        else:
            session.execute_write(add_group_and_color, id1, "Others", "#000000")
