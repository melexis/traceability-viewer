"""Django views"""

from os import getenv
import json
from pathlib import PurePath
from ruamel.yaml import YAML

from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.views.decorators.cache import cache_page

from django.shortcuts import render
from neomodel import db, NeomodelPath
from neo4j.exceptions import CypherSyntaxError


# from traceabilityViewer.scripts.create_database import unique_groups, configuration
from .models import DocumentItem,Rel

config_path = getenv("CONFIG_FILE")
with open(config_path, "r", encoding="utf-8") as open_file:
    configuration = YAML().load(open_file)

if "layers" in configuration:
    groups_list = list(configuration["layers"]) + list(configuration["layers"].values())
    unique_groups = list(dict.fromkeys(groups_list))


def index(request):
    """The page index page will be loaded when starting the app"""
    # create_database()
    return render(request, "myapp/index.html")


# @cache_page(None)
@api_view(["GET"])
def initialize(request):
    """Initialize data for the 'home' button"""
    nodes_made = []
    nodes = []
    links = []
    items = DocumentItem.nodes.all()
    for item in items:
        node = item.to_json()
        if node["name"] not in nodes_made:
            nodes.append(node)
            nodes_made.append(node["name"])
        for rel in node["relations"]:
            links.append(rel)
            target = DocumentItem.nodes.get(name=rel["target"]).to_json()
            if target["name"] not in nodes_made:
                    nodes_made.append(target["name"])
                    nodes.append(target)
    return Response({"nodes": nodes, "links": links})


# @cache_page(None)
@api_view(["GET"])
def filter_group(request, filtergroup):
    """Get the data according to the filter"""
    nodes = []
    links = []
    query = ""
    if "layers" in configuration:
        query = f"MATCH (n)-[r]-(m) WHERE n.layer_group = '{filtergroup}' RETURN n,r,m"
    else:
        query = f"MATCH (n)-[r]-(m) WHERE n.legend_group = '{filtergroup}' RETURN n,r,m"

    try:
        results, _ = db.cypher_query(query, resolve_objects=True)
        nodes_made = []
        for result in results:
            for element in result:
                if isinstance(element, DocumentItem):
                    node = element.to_json()
                    if node["name"] not in nodes_made:
                        nodes.append(node)
                        nodes_made.append(node["name"])

                elif isinstance(element, Rel):
                    link = {"source": element.start_node().name,
                            "target": element.end_node().name,
                            "type": element.type,
                            "color": element.color}
                    if link not in links:
                        links.append(link)
                else:
                    error = TypeError(f"Expected Node or Relationship types to be returned from the query; "
                                      f"got {type(element)}")
                    return Response(error)
        return Response({"nodes": nodes, "links": links})
    except CypherSyntaxError as error:
        return Response(error.message)


@api_view(["GET"])
def config(request):
    """Get the configuration"""
    print(configuration["item_colors"].keys())
    if "layers" in configuration:
        return Response({"config": configuration, "groups": unique_groups})
    else:
        return Response({"config": configuration, "groups": configuration["item_colors"].keys()})


# @cache_page(None)
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
    if "layers" in configuration:
        for item in DocumentItem.nodes.filter(layer_group__in=unique_groups):
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
            y_scale[group1] = y
            y_scale[group2] = y
            y += 300

    return Response(y_scale)


@api_view(["POST"])
def query(request):
    """Return the result of nodes and links depending on the query."""
    query = request.body.decode('utf-8')
    error = ""
    nodes = []
    links = []
    try:
        results, _ = db.cypher_query(query, resolve_objects=True)
        nodes_made = []
        for result in results:
            for element in result:
                if isinstance(element, DocumentItem):
                    node = element.to_json()
                    if node["name"] not in nodes_made:
                        nodes.append(node)
                        nodes_made.append(node["name"])

                elif isinstance(element, Rel):
                    link = {"source": element.start_node().name,
                            "target": element.end_node().name,
                            "type": element.type,
                            "color": element.color}
                    if link not in links:
                        links.append(link)

                elif isinstance(element, NeomodelPath):
                    for path_element in element:
                        if isinstance(path_element, DocumentItem):
                            node = path_element.to_json()
                            if node["name"] not in nodes_made:
                                nodes.append(node)
                                nodes_made.append(node["name"])
                        elif isinstance(path_element, Rel):
                            link = {"source": path_element.start_node().name,
                                    "target": path_element.end_node().name,
                                    "type": path_element.type,
                                    "color": path_element.color}
                            if link not in links:
                                links.append(link)
                            for node_name in [path_element.start_node().name, path_element.end_node().name]:
                                node = DocumentItem.nodes.get(name=node_name)
                                node = node.to_json()
                                if node["name"] not in nodes_made:
                                    nodes.append(node)
                                    nodes_made.append(node["name"])

                        else:
                            error = TypeError(f"Expected Node or Relationship types to be returned from the query; "
                                              f"got {type(element)}")
                            return Response(error)

                else:
                    error = TypeError(f"Expected Node or Relationship types to be returned from the query; "
                                    f"got {type(element)}")
                    return Response(error)

        return Response({"nodes": nodes, "links": links})
    except CypherSyntaxError as error:
        return Response(error.message)
    except BufferError as error:
        return Response(error)
    except:
        return Response({"nodes": nodes, "links": links})


@api_view(["POST"])
def search(request):
    """Return the connected nodes or the layers that are connected to the node with the requested node name."""
    search_name = request.body.decode('utf-8')
    nodes_made = []
    nodes = []
    links = []
    search_node = DocumentItem.nodes.get(name = search_name)
    node = search_node.to_json()
    nodes_made.append(node["name"])
    nodes.append(node)
    links = node["relations"]
    for relation in node["relations"]:
        if relation["target"] not in nodes_made:
            target_node = DocumentItem.nodes.get(name = relation["target"])
            target = target_node.to_json()
            nodes.append(target)
            nodes_made.append(target)
    return Response({"nodes": nodes, "links": links})


@api_view(["POST"])
def searchConnectedNodes(request):
    """Return the connected nodes of the requested node name."""
    search_name = request.body.decode('utf-8')
    nodes = []
    links = []
    try:
        results, _ = db.cypher_query(f"MATCH (n)-[r]-(m) where n.name = '{search_name}' return n,r,m",
                                     resolve_objects=True)
        nodes_made = []
        for result in results:
            for element in result:
                if isinstance(element, DocumentItem):
                    node = element.to_json()
                    if node["name"] not in nodes_made:
                        nodes.append(node)
                        nodes_made.append(node["name"])

                elif isinstance(element, Rel):
                    link = {"source": element.start_node().name,
                            "target": element.end_node().name,
                            "type": element.type,
                            "color": element.color}
                    if link not in links:
                        links.append(link)
                # else:
                    # TODO: Error element is not an instance of DocumentItem or Rel
        return Response({"nodes": nodes, "links": links})
    except CypherSyntaxError as error:
        return Response(error.message)
    except BufferError as error:
        return Response(error)
    except:
        return Response({"nodes": nodes, "links": links})
