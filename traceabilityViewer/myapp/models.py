"""Python module for the models that are used to create the database with Neomodel"""
from functools import cached_property
from neomodel import StructuredNode, StringProperty, RelationshipTo, StructuredRel, BooleanProperty


class Rel(StructuredRel):
    """Class that represents the relationships between the nodes in the database"""

    type = StringProperty(required=True)
    color = StringProperty()


class DocumentItem(StructuredNode):
    """Class that represents a node in the database"""

    hide = BooleanProperty(default=False)
    name = StringProperty(unique_index=True, required=True)
    properties = StringProperty(default="")
    layer_group = StringProperty(default="")
    color = StringProperty(default="")
    legend_group = StringProperty(default="others")
    url = StringProperty(default="")
    relations = RelationshipTo("DocumentItem", "REL", model=Rel)

    @cached_property
    def links(self):
        links = []
        for rel in self.relations:
            relation = self.relations.relationship(rel)
            links.append(
                {
                    "source": relation.start_node().name,
                    "target": relation.end_node().name,
                    "type": relation.type,
                    "color": relation.color,
                }
            )
        return links

    def to_json(self):
        """dict: Return the node data as a dictionary"""
        return {
            "name": self.name,
            "properties": self.properties,
            "url": self.url,
            "layer_group": self.layer_group,
            "legend_group": self.legend_group,
            "color": self.color,
            "hide": self.hide,
        }


