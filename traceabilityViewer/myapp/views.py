from django.shortcuts import render
from .models import DocumentItem
from neomodel import db, clear_neo4j_database
from ruamel.yaml import YAML
import json 


def define_color(dictionary, key):
    fallback_color = dictionary["others"]
    dict((k.lower(), v) for k,v in dictionary.items())
    return dictionary.get(key.lower(), fallback_color)
    
def define_group(groups, string):
    upper_case_groups = set(k.upper() for k in groups)
    group = None
    for g in upper_case_groups:
        if string.upper().startswith(g):
            group = g
    if group == None:
        group = "others"
    return group
    
def create_database():
    """Create a Neo4j database"""
    # yaml = YAML(typ="safe", pure=True)
    # configuration = yaml.load("../config.yml")
    with open("../config.yml", "r", encoding="utf-8") as open_file:
        configuration = YAML().load(open_file)

    path = ""
    data = {}
    for i in configuration["json_folder"]:
        path += str(i)

    with open(path, encoding="utf-8") as json_file:
        data = json.load(json_file)
    clear_neo4j_database(db, clear_constraints=True, clear_indexes=True)
    nodes_made = []
    for item in data:
        targets = item["targets"]
        attr = item["attributes"]
        props = {}
        props = item
        del props["targets"]
        del props["attributes"]
        source = item["id"]
        if source not in nodes_made:
            source_group = define_group(configuration["filters"], source)
            source_color = define_color(configuration["group_colors"], source_group)
            source_object = DocumentItem(name = source, 
                                        properties = props, 
                                        attributes = attr, 
                                        group = source_group, 
                                        color = source_color
                                        ).save()
            nodes_made.append(source)
        else:
            source_object = DocumentItem.nodes.get(name=source)
            source_object.properties = props
            source_object.attributes = attr
            source_object.save()

        for rel in targets:
            if rel not in configuration["backwards_relationships"]:
                link_color = define_color(configuration["link_colors"], rel)
                for target in targets[rel]:
                    if target  not in nodes_made:
                        target_group = define_group(configuration["filters"], target)
                        target_color = define_color(configuration["group_colors"], target_group)
                        target_object = DocumentItem(name = target,
                                                    group = target_group, 
                                                    color = target_color
                                                    ).save()
                        nodes_made.append(target)
                        relation_object = source_object.relations.connect(target_object, {"type": rel, 
                                                                                          "color": link_color})
                        relation_object.save()
                    else:
                        target_object = DocumentItem.nodes.get(name=target)
                        relation_object = source_object.relations.connect(target_object, {"type": rel,
                                                                                          "color": link_color})
                        relation_object.save()
                    
                    # if target not in nodes_made:
                    #     session.execute_write(self.add_item, target)
                    #     # TODO : groep toevoegen
                    #     nodes_made.append(target)
                    # if rel in list(configuration["link_colors"].keys()):
                    #     source_object.add_relation(rel)
                    # else:
                    #     session.execute_write(self.add_relationship, source, target, rel, "#808080")

create_database()

def index(request):
    return render(request, "myapp/index.html")
