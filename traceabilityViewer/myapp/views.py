from django.shortcuts import render, redirect, HttpResponse
from .models import DocumentItem, Rel
from neomodel import db, clear_neo4j_database
from ruamel.yaml import YAML
import json
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.http import JsonResponse
from django.views.generic.base import TemplateView
import re

with open("../config.yml", "r", encoding="utf-8") as open_file:
        configuration = YAML().load(open_file)

def validate(configuration):
    # layers: dict
    # layered = true
    # layers: empty
    # layered = false
    
    # colors: others?
    
    pass

validate(configuration)

groups_list = list(configuration["layers"]) + list(configuration["layers"].values())
unique_groups = list(dict.fromkeys(groups_list))

def define_linkcolor(link_colors, rel):
    fallback_color = link_colors["others"]
    return link_colors.get(rel, fallback_color)

def define_group(item_id):
    for regex in unique_groups:
        if re.match(regex, item_id):
            return regex
    return "others"

def get_value_by_regex(item_colors, item_id):
    for regex in item_colors:
        if re.match(regex, item_id):
            return item_colors[regex]
    return item_colors["others"]

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
    node_objects = {}
    relationships = []
    for item in data:
        targets_per_relationship = item["targets"]
        attr = item["attributes"]
        props = {}
        props = item
        source = item["id"]
        del props["targets"]
        del props["attributes"]
        del props["id"]
        del props["name"]
        if source not in node_objects:
            source_group = define_group(source)
            source_color = get_value_by_regex(configuration["item_colors"], source)
            node_objects[source] = DocumentItem(name=source, group=source_group, color=source_color)
        source_object = node_objects[source]
        source_object.properties = props
        source_object.attributes = attr

        for link, targets in targets_per_relationship.items():
            if link in configuration["backwards_relationships"].keys():
                continue  # skip backwards relationships
            link_color = define_linkcolor(configuration["link_colors"], link)
            for target in targets:
                if target not in node_objects:
                    target_group = define_group(target)
                    target_color = get_value_by_regex(configuration["item_colors"], target)
                    node_objects[target] = DocumentItem(name=target, group=target_group, color=target_color)
                relationships.append({
                    "source": source_object, 
                    "target": node_objects[target], 
                    "type": link, 
                    "link_color": link_color,
                    })
                    
    for node_object in node_objects.values():
        node_object.save()
    for link in relationships:
        source_object = link["source"]
        link_properties = {"type": link["type"], "color": link["link_color"]}
        relation_object = source_object.relations.connect(link["target"], link_properties)
        relation_object.save()
    for node_object in node_objects.values():
        node_object.serialize()
        node_object.save()

def index(request):
    create_database()
    breakpoint()
    return render(request, "myapp/index.html", {"loading": "false", "groups": unique_groups, "config": configuration})

@api_view(["GET"])
def initialize(request):
    # create_database()
    nodes = []
    links = []
    
    for item in DocumentItem.nodes.filter(group = unique_groups[0]):
        node = item.serialized_data
        nodes.append(node)
        breakpoint()
        for rel in node["relations"]:
            links.append(rel)
            target = DocumentItem.nodes.get(name = rel["target"])
            if target not in nodes:
                nodes.append(target.serialized_data)
    data = {"nodes": nodes, "links": links}
    print(data)
	# serializer = serializers.serialize('json', data)
    return Response({"data": data})

@api_view(["GET"])
def filter(request, filtergroup):
    nodes = []
    links = []
    for item in DocumentItem.nodes.filter(group = filtergroup):
        node = item.serialized_data
        nodes.append(node)
        for rel in node["relations"]:
            links.append(rel)
            target = DocumentItem.nodes.get(name = rel["target"])
            if target not in nodes:
                nodes.append(target.serialized_data)
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
    link_types = [] # weg
    # TODO: make set
    for item in DocumentItem.nodes.filter(group__in = unique_groups):
        node = item.serialized_data
        words.append(node["name"])
        search_ids.append(node["name"])
        for rel in node["relations"]:
            label = rel["type"]
            if label not in link_types:
                link_types.append(label)
    
    # add the words of a query that are used the most.
    words.extend(["MATCH", "STARTS WITH", "CONTAINS", "WHERE", "RETURN"])
    words.extend(link_types)
    
    return Response([{"words": words, "searchIds": search_ids}])
