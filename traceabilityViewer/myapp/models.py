from neomodel import StructuredNode, StringProperty, RelationshipTo, install_labels, StructuredRel
from django_neomodel import DjangoNode
import json

class Rel(StructuredRel):
    type = StringProperty(required = True)
    color = StringProperty()

class DocumentItem(StructuredNode):
    # uid = UniqueIdProperty()
    name = StringProperty(required=True)
    properties = StringProperty()
    attributes = StringProperty()
    group = StringProperty()
    color = StringProperty()
    relations = RelationshipTo("DocumentItem", "REL", model=Rel)

    @property
    def serialize(self):
        links = []
        for rel in self.relations:
            links.append({ 
                "source": self.relations.relationship(rel).start_node().name, 
                "target": self.relations.relationship(rel).end_node().name, 
                "type": self.relations.relationship(rel).type})
        return {
            "name": self.name,
            "properties": self.properties,
            "attributes": self.attributes,
            "group": self.group,
            "color": self.color,
            "relations": links
        }

install_labels(DocumentItem)
install_labels(Rel)
