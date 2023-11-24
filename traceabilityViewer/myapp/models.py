"""Python module for the models that are used to create the database with Neomodel"""

from neomodel import StructuredNode, StringProperty, RelationshipTo, install_labels, StructuredRel, BooleanProperty


class Rel(StructuredRel):
    """Class that represents the relationships between the nodes in the database"""

    type = StringProperty(required=True)
    color = StringProperty()


class DocumentItem(StructuredNode):
    """Class that represents a node in the database"""

    # uid = UniqueIdProperty()
    hide = BooleanProperty(default=True)
    name = StringProperty(required=True)
    props = StringProperty()
    attributes = StringProperty()
    group = StringProperty()
    color = StringProperty()
    # serialized_data = JSONProperty()
    relations = RelationshipTo("DocumentItem", "REL", model=Rel)

    def to_json(self):
        """dict: Return the node data as a dictionary"""
        links = []
        for rel in self.relations:
            links.append(
                {
                    "source": self.relations.relationship(rel).start_node().name,
                    "target": self.relations.relationship(rel).end_node().name,
                    "type": self.relations.relationship(rel).type,
                }
            )
        return {
            "name": self.name,
            "properties": self.props,
            "attributes": self.attributes,
            "group": self.group,
            "color": self.color,
            "relations": links,
            "hide": self.hide,
        }


install_labels(DocumentItem)
install_labels(Rel)
