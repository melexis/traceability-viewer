"""
Python module to make the neo4j database with the exported json file of all items.
"""

import json
from neo4j import GraphDatabase
from ruamel.yaml import YAML


class Database:
    """A Neo4j database will be made with a Bolt connection specified in the uri variable.
    The normal steps you take after initialization are:
    - verify_connectivity()"""

    def __init__(self, uri):
        """Initialization of the database.
        Args:
            uri (str): Bolt URI"""
        self.driver = GraphDatabase.driver(uri)
        self.config_dict = {}
        self.groups = []
        self.data = {}

    def close(self):
        """Close the session."""
        self.driver.close()

    def verify_connectivity(self):
        """Verify the connectivity."""
        self.driver.verify_connectivity()

    def read_config(self):
        """Read and store the config file as a dictionary."""
        with open("config.yml", "r", encoding="utf-8") as open_file:
            config = YAML().load(open_file)

        self.config_dict = json.loads(json.dumps(config))
        self.groups = list(self.config_dict["group_colors"].keys())

    def get_data(self):
        """Get the data from the JSON file."""
        path = ""
        for item in self.config_dict["json_folder"]:
            path += str(item)

        with open(path, encoding="utf-8") as json_file:
            self.data = json.load(json_file)

    def make_db(self):
        """Make the Neo4j database."""
        with self.driver.session() as session:
            session.run(
                """MATCH (n)
                            DETACH DELETE n"""
            )
            nodes_made = []
            for i, item in enumerate(self.data):
                targets = item["targets"]
                attr = item["attributes"]
                props = {}
                props = item
                id1 = item["id"]
                if id1 not in nodes_made:
                    session.execute_write(self.add_item, id1)
                    nodes_made.append(id1)

                if targets != {}:
                    for rel in targets:
                        for id2 in targets[rel]:
                            if id2 not in nodes_made:
                                session.execute_write(self.add_item, id2)
                                nodes_made.append(id2)
                            if rel in list(self.config_dict["link_colors"].keys()):
                                session.execute_write(
                                    self.add_relationship, id1, id2, rel, self.config_dict["link_colors"][rel]
                                )
                            else:
                                session.execute_write(self.add_relationship, id1, id2, rel, "#808080")
                del props["targets"]
                session.execute_write(self.add_attributes, id1, json.dumps(attr))
                del props["attributes"]
                session.execute_write(self.add_properties, id1, props)

                if id1.startswith(self.groups[0]):
                    session.execute_write(
                        self.add_group_and_color, id1, self.groups[0], self.config_dict["group_colors"][self.groups[0]]
                    )
                elif id1.startswith(self.groups[1]):
                    session.execute_write(
                        self.add_group_and_color, id1, self.groups[1], self.config_dict["group_colors"][self.groups[1]]
                    )
                elif id1.startswith(self.groups[2]):
                    session.execute_write(
                        self.add_group_and_color, id1, self.groups[2], self.config_dict["group_colors"][self.groups[2]]
                    )
                elif id1.startswith(self.groups[3]):
                    session.execute_write(
                        self.add_group_and_color, id1, self.groups[3], self.config_dict["group_colors"][self.groups[3]]
                    )
                elif id1.startswith(self.groups[4]):
                    session.execute_write(
                        self.add_group_and_color, id1, self.groups[4], self.config_dict["group_colors"][self.groups[4]]
                    )
                elif id1.startswith(self.groups[5]):
                    session.execute_write(
                        self.add_group_and_color, id1, self.groups[5], self.config_dict["group_colors"][self.groups[5]]
                    )
                elif id1.startswith(self.groups[6]):
                    session.execute_write(
                        self.add_group_and_color, id1, self.groups[6], self.config_dict["group_colors"][self.groups[6]]
                    )
                else:
                    session.execute_write(self.add_group_and_color, id1, "Others", "#000000")

    @staticmethod
    def add_item(tx, id_item):
        """Add document item to the graph database.
        Args:
            id_item (str): ID of document item
        """
        tx.run("CREATE (n:DocItem {id: $id}) ", id=id_item)

    @staticmethod
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

    @staticmethod
    def add_attributes(tx, id_item, attributes):
        """Add the attributes of the document item in the graph database.
        Args:
            id_item (str): ID of the document item
            attributes (str): JSON string of the attributes of the document item
        """
        tx.run(
            """MATCH (n:DocItem)
            WHERE n.id = $id
            SET n.attributes = $attr""",
            id=id_item,
            attr=attributes,
        )

    @staticmethod
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

    @staticmethod
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


def main():
    """Set up the driver to make a connection with Bolt to the Neo4j database.
    First the connection will be verified. Next, the config file will be read.
    After that, data of the JSON file will be obtained to make the Neo4j graph database.
    Finally, the session will be closed."""
    neo4j_db = Database("bolt://localhost:7687")
    neo4j_db.verify_connectivity()
    neo4j_db.read_config()
    neo4j_db.get_data()
    neo4j_db.make_db()
    neo4j_db.close()


if __name__ == "__main__":
    main()
