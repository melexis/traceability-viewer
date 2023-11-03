from django.shortcuts import render, redirect, HttpResponse
from .models import DocumentItem, Rel
from neomodel import db, clear_neo4j_database
from ruamel.yaml import YAML
import json
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.http import JsonResponse
from django.views.generic.base import TemplateView
import string
import re
import exrex

with open("../config.yml", "r", encoding="utf-8") as open_file:
        configuration = YAML().load(open_file)

groups = set()
for item,value in dict(configuration["groups"]).items():
    groups.update(list(exrex.generate(item)))
    groups.update(list(exrex.generate(value)))

def define_color(dictionary, key):
    fallback_color = dictionary["others"]
    dictionary = dict((k.lower(), v) for k,v in dictionary.items())
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

# @api_view(["POST"])
def create_database():
    """Create a Neo4j database"""
    # yaml = YAML(typ="safe", pure=True)
    # configuration = yaml.load("../config.yml")
    

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
        source = item["id"]
        del props["targets"]
        del props["attributes"]
        del props["id"]
        del props["name"]
        if source not in nodes_made:
            source_group = define_group(configuration["groups"], source)
            source_color = define_color(configuration["item_colors"], source_group)
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
                        target_group = define_group(configuration["groups"], target)
                        target_color = define_color(configuration["item_colors"], target_group)
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
    # serializer = TaskSerializer(data = DocumentItem.nodes.all())
    # if serializer.is_valid():
    #     serializer.save()
    #     return Response(serializer.data)
    # else:
    #     return HttpResponse('Some Error Occured')
    # nodes = []
    # links = []
    # for item in DocumentItem.nodes.all():
    #     nodes.append(json.dumps(item.__properties__))
    #     for rel in item.relations:
    #         links.append(json.dumps(item.relations.relationship(rel).__properties__))
    # return {"nodes": nodes, "links": links}
    

# class BaseView(TemplateView):
#     template_name = "myapp/index.html"
    
#     def get(self, request, **kwargs):
#         create_database()
#         nodes = []
#         links = []
#         groups = dict(configuration["group_colors"])
#         groups.popitem()
#         for item in DocumentItem.nodes.all():
#             node = item.serialize
#             nodes.append(node)
#             for rel in node["relations"]:
#                 links.append(rel)
#         # length = len(nodes)
#         context = {"loading": "false", "groups": groups, "nodes": nodes, "links": links}
#         return render(request, "myapp/index.html", context)
    
#     def get_filter_data(self, **kwargs):
#         context = super().get_context_data(**kwargs)
#         data = create_database()
#         # for item in DocumentItem.nodes.all():
#         #     if item.group == filtergroup:
#         #         nodes.append(json.dumps(item.__properties__))
#         #         for rel in item.relations:
#         #             links.append(json.dumps(item.relations.relationship(rel).__properties__))
#         context["data"] = [data]
#         return context
        

def index(request):
    return render(request, "myapp/index.html", {"loading": "false", "groups": groups, "config": configuration})

@api_view(["GET"])
def initialize(request):
    # create_database()
    nodes = []
    links = []
    node = DocumentItem.nodes[0]
    nodes.append(node)
    for rel in node["relations"]:
        links.append(rel)
        target = DocumentItem.nodes.get(name = rel["target"])
        if target not in nodes:
            nodes.append(target)
    data = {"nodes": nodes, "links": links}
	# serializer = serializers.serialize('json', data)
    return Response({"data": data})

@api_view(["GET"])
def filter(request, filtergroup):
    nodes = []
    links = []
    for item in DocumentItem.nodes.filter(group = filtergroup):
        node = item.serialize
        nodes.append(node)
        for rel in node["relations"]:
            links.append(rel)
            target = DocumentItem.nodes.get(name = rel["target"])
            if target not in nodes:
                nodes.append(target)
    data = {"nodes": nodes, "links": links}
    return Response([{"nodes": data}])

@api_view(["GET"])
def config(request):
    print(type(configuration))
    # config = serializers.serialize('json', configuration)
    return Response([{"config": configuration}])

@api_view(["GET"])
def autocomplete(request):
    """
    Request autocompletion words. One is for the query input field that contains all node IDs,
    links and words that are often used in a Cypher query. The second one is for the search input field.
    This contains all the node IDs where the group is a main group of the V model (not the group "Others").
    """
    # words will contain the autocomplete words for the query input field.
    words = []
    # search_ids will contain the node IDs for in the search input field.
    search_ids = []
    # link_types is used to check if a link type already exists and will in the end be added to words.
    link_types = []
    
    for item in DocumentItem.nodes.filter(group__in = groups):
        node = item.serialize
        words.append(node.name)
        search_ids.append(node.name)
        for rel in node["relations"]:
            label = rel.type
            if label not in link_types:
                link_types.append(label)
    
    # add the words of a query that are used the most.
    words.extend(["MATCH", "STARTS WITH", "CONTAINS", "WHERE", "RETURN"])
    words.extend(link_types)
    
    return Response([{"words": words, "searchIds": search_ids, "linkTypes": link_types}])
