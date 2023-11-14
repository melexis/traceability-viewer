from neomodel import JSONProperty, StructuredNode, StringProperty, RelationshipTo, install_labels, StructuredRel
from django_neomodel import DjangoNode
import json


class Rel(StructuredRel):
    type = StringProperty(required=True)
    color = StringProperty()


class DocumentItem(StructuredNode):
    # uid = UniqueIdProperty()
    name = StringProperty(required=True)
    props = StringProperty()
    attributes = StringProperty()
    group = StringProperty()
    color = StringProperty()
    # serialized_data = JSONProperty()
    relations = RelationshipTo("DocumentItem", "REL", model=Rel)

    def to_json(self):
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
        }

    # def serialize(self):
    #     links = []
    #     for rel in self.relations:
    #         links.append({
    #             "source": self.relations.relationship(rel).start_node().name,
    #             "target": self.relations.relationship(rel).end_node().name,
    #             "type": self.relations.relationship(rel).type})
    #     self.serialized_data = {
    #         "name": self.name,
    #         "properties": self.props,
    #         "attributes": self.attributes,
    #         "group": self.group,
    #         "color": self.color,
    #         "relations": links
    #     }


install_labels(DocumentItem)
install_labels(Rel)
