"""Django views"""

import logging
import traceback

from ruamel.yaml import YAML
from pathlib import Path

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import APIException
from django.views.decorators.cache import cache_page

from django.shortcuts import render
from neomodel import db, NeomodelPath, Traversal, match, NodeSet
from neo4j.exceptions import CypherSyntaxError


# from traceabilityViewer.scripts.create_database import unique_groups, configuration
from .models import DocumentItem, Rel

LOGGER = logging.getLogger(__name__)
LOGGER.setLevel(logging.INFO)

CONFIG_PATH = Path(__file__).parent.parent / "config.yml"
with open(CONFIG_PATH, "r", encoding="utf-8") as open_file:
    configuration = YAML().load(open_file)

if "layers" in configuration:
    groups_list = list(configuration["layers"]) + list(configuration["layers"].values())
    unique_groups = list(dict.fromkeys(groups_list))

def error_handling(func):
    def inner_function(*args, **kwargs):
        try:
            func(*args, **kwargs)
        except ValueError as error:
            return Response(status=status.HTTP_400_BAD_REQUEST, data=f"An error occured in function {func.__name__}.\n{error}")
        except TypeError as error:
            return Response(status=status.HTTP_400_BAD_REQUEST, data=f"An error occured in function {func.__name__}.\n{error}")
        except Exception as error:
            return Response(status=status.HTTP_400_BAD_REQUEST, data=f"Something went wrongin function {func.__name__}.\n{error}")

    return inner_function


def index(request):
    """The page index page will be loaded when starting the app"""
    # create_database()
    return render(request, "myapp/index.html")


@cache_page(None)
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
    return Response(data={"nodes": nodes, "links": links})


@cache_page(None)
@api_view(["GET"])
def filter_group(request, filtergroup):
    """Get the data according to the filter"""
    nodes = {}
    links = set()
    if configuration["layered"]:
        all_filter_nodes = DocumentItem.nodes.filter(layer_group=filtergroup)
    else:
        all_filter_nodes = DocumentItem.nodes.filter(legend_group=filtergroup)
    all_links = []
    try:
        definition = dict(node_class=DocumentItem, direction=match.EITHER, relation_type=None, model=Rel)
        traversal_nodes = Traversal(all_filter_nodes, DocumentItem.__label__, definition)
        all_relations = traversal_nodes.all()
        for node in all_relations:
            nodes[node.name] = node.to_json()
            all_links.extend(node.links)
        for node in all_filter_nodes.all():
            nodes[node.name] = node.to_json()
            all_links.extend(node.links)
        # for link in all_links:
            # if link["source"] in nodes and link["target"] in nodes:
                # links[f'{link["source"]}{link["type"]}{link["target"]}'] = link
        links.update(all_links)  #TODO: links hashable maken of met dict werken
        return Response(data={"nodes": nodes.values(), "links": links})
    except ValueError as error:
        return Response(status=status.HTTP_400_BAD_REQUEST, data=str(error))
    except TypeError as error:
        return Response(status=status.HTTP_400_BAD_REQUEST, data=str(error))
    except:
        return Response(status=status.HTTP_400_BAD_REQUEST, data="Something went wrong")


@api_view(["GET"])
def config(request):
    """Get the configuration"""
    if "layers" in configuration:
        return Response(data={"config": configuration, "groups": unique_groups})
    else:
        return Response(data={"config": configuration, "groups": configuration.get("item_colors", {}).keys()})


@cache_page(None)
@api_view(["GET"])
def autocomplete(request):
    """
    Request autocompletion words. One is for the query input field that contains all node IDs,
    links and words that are often used in a Cypher query. The second one is for the search input field.
    This contains all the node IDs where the group is a main group of the V model (not the group "Others").
    """
    query_keywords = ["MATCH", "STARTS WITH", "CONTAINS", "WHERE", "RETURN"]
    link_types = configuration["backwards_relationships"].values()
    search_ids = set()
    if "layers" in configuration:
        for item in DocumentItem.nodes.filter(layer_group__in=unique_groups):
            search_ids.add(item.name)

    return Response(data={"words": query_keywords, "searchIds": search_ids, "link_types": link_types})


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

    return Response(data=y_scale)


@api_view(["POST"])
def query(request):
    """Return the result of nodes and links depending on the query."""
    query = request.body.decode("utf-8")
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
                    link = {
                        "source": element.start_node().name,
                        "target": element.end_node().name,
                        "type": element.type,
                        "color": element.color,
                    }
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
                            link = {
                                "source": path_element.start_node().name,
                                "target": path_element.end_node().name,
                                "type": path_element.type,
                                "color": path_element.color,
                            }
                            if link not in links:
                                links.append(link)
                            for node_name in [path_element.start_node().name, path_element.end_node().name]:
                                node = DocumentItem.nodes.get(name=node_name)
                                node = node.to_json()
                                if node["name"] not in nodes_made:
                                    nodes.append(node)
                                    nodes_made.append(node["name"])

                        else:
                            raise TypeError(
                                f"Expected Node or Relationship types to be returned from the query; "
                                f"got {type(element)}"
                            )

                else:
                    raise TypeError(
                        f"Expected Node or Relationship types to be returned from the query; " f"got {type(element)}"
                    )

        return Response(data={"nodes": nodes, "links": links})
    except CypherSyntaxError as error:
        return Response(status=status.HTTP_400_BAD_REQUEST, data=str(error))  #TODO: error
    except (Exception, BufferError, TypeError) as error:
        LOGGER.error(repr(error))
        return Response(status=status.HTTP_400_BAD_REQUEST, data=traceback.format_exc() +
                        "\nType: " + str(type(error)) +
                        "\nLine: " + repr(error)
                        )

def search_nodes_recursively(source_node, groups, nodes, links, unwanted_link_name=""):
    """_summary_

    Args:
        source_node (_type_): _description_
        groups (_type_): _description_
        nodes (_type_): _description_
        links (_type_): _description_
        unwanted_link_name (string):
    """
    # LOGGER.info(f"search_nodes_recursively() function is called, {source_node}")
    print(f"search_nodes_recursively() function is called, {source_node.name}")
    definition = dict(node_class=DocumentItem, direction=match.EITHER, relation_type=None, model=Rel)
    traversal_nodes = Traversal(source_node, DocumentItem.__label__, definition)
    target_nodes = traversal_nodes.all()
    if target_nodes:
        for target_node in target_nodes:
            # breakpoint()
            group = target_node.legend_group
            if group != source_node.legend_group and group in groups:
                continue
            groups.add(target_node.legend_group)
            for link in target_node.links:
                if (link["target"] == source_node.name) or (link["source"] == source_node.name):
                    links.append(link)
                    link_name = link["type"]
                    for link_type in configuration["backwards_relationships"].values():
                        unwanted_link_name =  configuration["backwards_relationships"]
                    break
            else:
                for link in source_node.links:
                    if (link["target"] == target_node.name) or (link["source"] == target_node.name):
                        links.append(link)
                        break
            if target_node.name not in nodes:
                nodes[target_node.name] = target_node.to_json()

                search_nodes_recursively(target_node, groups, nodes, links, unwanted_link_name)  #TODO: unwanted_link_name
    # return nodes, links

@api_view(["POST"])
def search(request):
    """Return the connected nodes or the layers that are connected to the node with the requested node name."""
    search_name = request.body.decode("utf-8")
    nodes = {}
    links = []
    print(configuration["layered"])
    try:
        search_node = DocumentItem.nodes.get(name=search_name)
        nodes[search_node.name] = search_node.to_json()
        search_nodes_recursively(search_node, {search_node.legend_group}, nodes, links)

        return Response(data={"nodes": nodes.values(), "links": links})
    except (Exception, BufferError, TypeError) as error:
        LOGGER.error(repr(error))
        return Response(status=status.HTTP_400_BAD_REQUEST, data=traceback.format_exc() +
                        "\nType: " + str(type(error)) +
                        "\nLine: " + repr(error)
                        )

@api_view(["POST"])
def searchConnectedNodes(request):
    """Return the connected nodes of the requested node name."""
    search_name = request.body.decode("utf-8")
    nodes = []
    links = []
    try:
        results, _ = db.cypher_query(
            f"MATCH (n)-[r]-(m) where n.name = '{search_name}' return n,r,m", resolve_objects=True
        )
        nodes_made = []
        for result in results:
            for element in result:
                if isinstance(element, DocumentItem):
                    node = element.to_json()
                    if node["name"] not in nodes_made:
                        nodes.append(node)
                        nodes_made.append(node["name"])

                elif isinstance(element, Rel):
                    link = {
                        "source": element.start_node().name,
                        "target": element.end_node().name,
                        "type": element.type,
                        "color": element.color,
                    }
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
                            link = {
                                "source": path_element.start_node().name,
                                "target": path_element.end_node().name,
                                "type": path_element.type,
                                "color": path_element.color,
                            }
                            if link not in links:
                                links.append(link)
                            for node_name in [path_element.start_node().name, path_element.end_node().name]:
                                node = DocumentItem.nodes.get(name=node_name)
                                node = node.to_json()
                                if node["name"] not in nodes_made:
                                    nodes.append(node)
                                    nodes_made.append(node["name"])

                        else:
                            error = TypeError(
                                f"Expected Node or Relationship types to be returned from the query; "
                                f"got {type(element)}"
                            )
                            return Response(data=error)

                else:
                    error = TypeError(
                        f"Expected Node or Relationship types to be returned from the query; " f"got {type(element)}"
                    )
                    return Response(data=error)
        return Response(data={"nodes": nodes, "links": links})
    except CypherSyntaxError as error:
        return Response(status=status.HTTP_400_BAD_REQUEST, data=str(error))  #TODO: decorator for error
    except (Exception, BufferError, TypeError) as error:
        LOGGER.error(repr(error))
        return Response(status=status.HTTP_400_BAD_REQUEST, data=traceback.format_exc() +
                        "\nType: " + str(type(error)) +
                        "\nLine: " + repr(error)
                        )
