"""Django views"""

from os import getenv
import json
from pathlib import PurePath
from ruamel.yaml import YAML

from rest_framework.decorators import api_view
from rest_framework.response import Response

from django.shortcuts import render

# from traceabilityViewer.scripts.create_database import unique_groups, configuration
from .models import DocumentItem

config_path = getenv("CONFIG_FILE")
with open(config_path, "r", encoding="utf-8") as open_file:
    configuration = YAML().load(open_file)

groups_list = list(configuration["layers"]) + list(configuration["layers"].values())
unique_groups = list(dict.fromkeys(groups_list))


def index(request):
    """The page index page will be loaded when starting the app"""
    # create_database()
    return render(request, "myapp/index.html", {"groups": json.dumps(unique_groups), "config": configuration})


@api_view(["GET"])
def initialize(request):
    """Initialize data with data from first group"""
    nodes = []
    links = []
    item = DocumentItem.nodes.all()[0]
    node = item.to_json()
    nodes.append(node)
    for rel in node["relations"]:
        links.append(rel)
        target = DocumentItem.nodes.get(name=rel["target"])
        if target not in nodes:
            nodes.append(target.to_json())
    return Response({"nodes": nodes, "links": links})


@api_view(["GET"])
def filter_group(request, filtergroup):
    """Get the data according to the filter"""
    nodes_ids = []
    nodes = []
    links = []
    for item in DocumentItem.nodes.filter(group=filtergroup):
        node = item.to_json()
        if node["name"] not in nodes_ids:
            nodes_ids.append(node["name"])
            nodes.append(node)
            for rel in node["relations"]:
                links.append(rel)
                target = DocumentItem.nodes.get(name=rel["target"]).to_json()
                if target["name"] not in nodes_ids:
                    nodes_ids.append(target["name"])
                    nodes.append(target)
    return Response({"nodes": nodes, "links": links})


@api_view(["GET"])
def config(request):
    """Get the configuration"""
    print(type(configuration))
    # config = serializers.serialize('json', configuration)
    return Response({"config": configuration, "groups": unique_groups})


@api_view(["GET"])
def autocomplete(request):
    """
    Request autocompletion words. One is for the query input field that contains all node IDs,
    links and words that are often used in a Cypher query. The second one is for the search input field.
    This contains all the node IDs where the group is a main group of the V model (not the group "Others").
    """
    # words will contain the autocomplete words for the query input field.
    words = set()
    # search_ids will contain the node IDs for in the search input field.
    search_ids = set()
    for item in DocumentItem.nodes.filter(group__in=unique_groups).all():
        node = item.to_json()
        words.add(node["name"])
        search_ids.add(node["name"])
        for rel in node["relations"]:
            label = rel["type"]
            words.add(label)
    # add the words of a query that are used the most.
    words.update(["MATCH", "STARTS WITH", "CONTAINS", "WHERE", "RETURN"])
    return Response({"words": words, "searchIds": search_ids})


@api_view(["GET"])
def node_url(request, node_name):
    """Request the url of the selected node."""
    PRODUCT = getenv("PRODUCT")
    BASE_URL = getenv("BASE_URL")
    node = DocumentItem.nodes.get(name=node_name)
    node = node.to_json()
    url = None
    if node["properties"]:
        properties = json.loads(node["properties"])
        node_name = node["name"]
        document = properties["document"]
        url = PurePath(BASE_URL).joinpath(PRODUCT, "latest", "flash", "html", f"{document}.html#{node_name}")
        print(url)

    return Response(str(url))


@api_view(["GET"])
def layers(request):
    """Request the y values depending on the layers in the configuration file."""
    y_scale = {}

    if isinstance(configuration["layers"], list):
        y = 0
        for group in configuration["layers"]:
            y_scale[group] = y
            y += 200

    if isinstance(configuration["layers"], dict):
        y = 0
        for group1, group2 in configuration["layers"].items():
            print(group1)
            y_scale[group1] = y
            print(group2)
            y_scale[group2] = y
            y += 300

    return Response(y_scale)
