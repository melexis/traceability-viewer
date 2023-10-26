from neomodel import StructuredNode, StringProperty, RelationshipTo, install_labels, StructuredRel
from ruamel.yaml import YAML

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

install_labels(DocumentItem)
install_labels(Rel)
