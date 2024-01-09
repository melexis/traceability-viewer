"""Python module for the models that are used to create the database with Neomodel"""
from collections import namedtuple

from functools import cached_property
from neomodel import StructuredNode, StringProperty, RelationshipTo, StructuredRel, BooleanProperty


Link = namedtuple("Link", "source target type color")
Node = namedtuple("Node", "name properties url layer_group legend_group color hide")

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
        """list[Link]: the node data without relationships"""
        links = set()
        for rel in self.relations:
            relation = self.relations.relationship(rel)
            link = Link(
                source=relation.start_node().name,
                target=relation.end_node().name,
                type=relation.type,
                color=relation.color)
            links.add(link)
        return links

    @property
    def node_data(self):
        """Node: the node data without relationships"""
        return Node(
            name=self.name,
            properties=self.properties,
            url=self.url,
            layer_group=self.layer_group,
            legend_group=self.legend_group,
            color=self.color,
            hide=self.hide,
        )

