from django.db import models
from neomodel import StructuredNode, StringProperty, RelationshipTo, install_labels, StructuredRel
from ruamel.yaml import YAML
import json

# Create your models here.
# config.DATABASE_URL = 'bolt://localhost:7687'
with open("myapp/config.yml", "r", encoding="utf-8") as open_file:
    configuration = YAML().load(open_file)


class Rel(StructuredRel):
    type = StringProperty(required=True)

    def __init__(self):
        self.color = configuration["link_colors"][self.type]


class DocumentItem(StructuredNode):
    name = StringProperty(unique_index=True, required=True)
    properties = StringProperty()
    attributes = StringProperty()
    group = StringProperty(required=True)
    color = StringProperty(required=True)
    relations = RelationshipTo("DocumentItem", StringProperty(), model=Rel)
    # def add_relation(self, relation_type):
    #     """Add a relation between two document items.

    #     Args:
    #         relation_type (str): The type of the relationship
    #     """
    #     self.relations = RelationshipTo("DocumentItem", relation_type, model=Rel)


install_labels(DocumentItem)
