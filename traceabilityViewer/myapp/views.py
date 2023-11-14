"""Django views"""

import json
from ruamel.yaml import YAML

from rest_framework.decorators import api_view
from rest_framework.response import Response

from django.http import JsonResponse
from django.views.generic.base import TemplateView
from django.shortcuts import render, redirect, HttpResponse

# from traceabilityViewer.scripts.create_database import unique_groups, configuration
from .models import DocumentItem

with open("../config.yml", "r", encoding="utf-8") as open_file:
    configuration = YAML().load(open_file)

groups_list = list(configuration["layers"]) + list(configuration["layers"].values())
unique_groups = list(dict.fromkeys(groups_list))


def index(request):
    """The page index page will be loaded when starting the app"""
    # create_database()
    return render(request, "myapp/index.html", {"groups": json.dumps(unique_groups), "config": configuration})


# @api_view(["GET"])
# def initialize(request):
#     """"""
#     # create_database()
#     nodes = []
#     links = []

#     for item in DocumentItem.nodes.filter(group=unique_groups[0]):
#         node = item.to_json()
#         nodes.append(node)
#         # breakpoint()
#         for rel in node["relations"]:
#             links.append(rel)
#             target = DocumentItem.nodes.get(name=rel["target"])
#             if target not in nodes:
#                 nodes.append(target.to_json())
#     data = {"nodes": nodes, "links": links}
#     print(data)
#     # serializer = serializers.serialize('json', data)
#     return Response({"data": data})


@api_view(["GET"])
def filter_group(request, filtergroup):
    """Get the data according to the filter"""
    nodes = []
    links = []
    for item in DocumentItem.nodes.filter(group=filtergroup):
        node = item.to_json()
        nodes.append(node)
        for rel in node["relations"]:
            links.append(rel)
            target = DocumentItem.nodes.get(name=rel["target"])
            if target not in nodes:
                nodes.append(target.to_json())
    data = {"nodes": nodes, "links": links}
    return Response([{"nodes": data}])


@api_view(["GET"])
def config(request):
    """Get the configuration"""
    print(type(configuration))
    # config = serializers.serialize('json', configuration)
    return Response([{"config": configuration, "groups": unique_groups}])


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
    breakpoint()
    return Response([{"words": words, "searchIds": search_ids}])
