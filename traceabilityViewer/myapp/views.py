"""Django views"""

import cProfile, pstats, io
from pstats import SortKey
import logging
import traceback

from ruamel.yaml import YAML
from pathlib import Path

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from django.views.decorators.cache import cache_page
from django.shortcuts import render

from neomodel import db, NeomodelPath, Traversal, match
from neo4j.exceptions import CypherSyntaxError

# from traceabilityViewer.scripts.create_database import unique_groups, configuration
from .models import DocumentItem, Rel

LOGGER = logging.getLogger(__name__)
LOGGER.setLevel(logging.INFO)

CONFIG_PATH = Path(__file__).parent.parent / "config.yml"
with open(CONFIG_PATH, "r", encoding="utf-8") as open_file:
    configuration = YAML().load(open_file)

search_ids = set()

if "layers" in configuration:
    groups_list = list(configuration["layers"]) + list(configuration["layers"].values())
    unique_groups = list(dict.fromkeys(groups_list))


def error_handling(title):
    def decorator(func):
        def inner_function(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except Exception as error:  # pylint: disable=broad-exception-caught
                LOGGER.error(repr(error))
                error_status = status.HTTP_400_BAD_REQUEST
                data = {
                    "identifier": id(error),
                    "title": title,
                    "message": f"An error occurred in function {func.__name__}:",
                }
                if isinstance(error, (BufferError, TypeError, ValueError)):
                    data["message"] += f"\n{traceback.format_exc()}"
                else:
                    data["message"] += f"\n{error}"
                return Response(status=error_status, data=data)
        return inner_function
    return decorator


def index(request):
    """The page index page will be loaded when starting the app"""
    # create_database()
    return render(request, "myapp/index.html")


@cache_page(None)
@api_view(["GET"])
@error_handling(title="An error occured in the data initialization of the home button.")
def initialize(request):
    """Initialize data for the 'home' button"""
    nodes_made = []
    nodes = []
    links = []
    items = DocumentItem.nodes.all()
    for item in items:
        node = item.node_data
        if node["name"] not in nodes_made:
            nodes.append(node)
            nodes_made.append(node["name"])
        for rel in node["relations"]:
            links.append(rel)
            target = DocumentItem.nodes.get(name=rel["target"]).node_data
            if target["name"] not in nodes_made:
                nodes_made.append(target["name"])
                nodes.append(target)
    return Response(data={"nodes": nodes, "links": links})


@cache_page(None)
@api_view(["GET"])
@error_handling(title="An error occured in the data initialization of a filter button.")
def filter_group(request, filtergroup):
    """Get the data according to the filter"""
    # pr = cProfile.Profile()
    # pr.enable()
    nodes = set()
    links = set()
    if configuration["layered"]:
        all_filter_nodes = DocumentItem.nodes.filter(layer_group=filtergroup)
    else:
        all_filter_nodes = DocumentItem.nodes.filter(legend_group=filtergroup)

    # serializers.serialize() of django does not apply here.
    # This is meant for models.Models of Django. These have an attribute '_meta'.

    definition = dict(node_class=DocumentItem, direction=match.EITHER, relation_type=None, model=Rel)
    traversal_nodes = Traversal(all_filter_nodes, DocumentItem.__label__, definition).all()
    all_source_nodes = all_filter_nodes.all()

    for node in traversal_nodes:
        nodes.add(node.node_data)
        links.update(node.links)
    for node in all_source_nodes:
        nodes.add(node.node_data)
        links.update(node.links)

    serialized_nodes_per_name = {node.name: node._asdict() for node in nodes}
    filtered_links_as_dict = filter_links(links, serialized_nodes_per_name.keys())

    # pr.disable()
    # s = io.StringIO()
    # ps = pstats.Stats(pr, stream=s).sort_stats(SortKey.CUMULATIVE)
    # ps.print_stats()
    # with open(f"stat_{filtergroup}.txt", "w+") as file:
    #     file.write(s.getvalue())

    return Response(data={"nodes": iter(serialized_nodes_per_name.values()), "links": list(filtered_links_as_dict)})

def filter_links(links, node_names):
    for link in links:
        if getattr(link,"target") in node_names:
            yield link._asdict()


@api_view(["GET"])
@error_handling(title="An error occured when loading the configuration and groups.")
def config(request):
    """Get the configuration"""
    if "layers" in configuration:
        return Response(data={"config": configuration, "groups": unique_groups})
    else:
        return Response(data={"config": configuration, "groups": configuration.get("item_colors", {}).keys()})


@cache_page(None)
@api_view(["GET"])
@error_handling(title="An error occured when loading the autocompletion words.")
def autocomplete(request):
    """
    Request autocompletion words. One is for the query input field that contains all node IDs,
    links and words that are often used in a Cypher query. The second one is for the search input field.
    This contains all the node IDs where the group is a main group of the V model (not the group "Others").
    """
    query_keywords = ["MATCH", "STARTS WITH", "CONTAINS", "WHERE", "RETURN"]
    link_types = configuration["backwards_relationships"].values()

    if "layers" in configuration:
        for item in DocumentItem.nodes.filter(layer_group__in=unique_groups):
            search_ids.add(item.name)

    return Response(data={"words": query_keywords, "searchIds": search_ids, "link_types": link_types})


@api_view(["GET"])
@error_handling(title="An error occured when specifying the y-scale of nodes.")
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


@api_view(['GET'])
@error_handling(title="Please enter a valid cypher query.")
def query(request, cypher_query):
    """Return the result of nodes and links depending on the query."""
    nodes, links = get_data_with_cypher_query(cypher_query)
    return Response(data={"nodes": nodes, "links": links})


def search_nodes_recursively(source_node, groups, nodes, links, unwanted_link_name=""):
    """Search for nodes that are connected to one requested node recursively.

    Args:
        source_node (DocumentItem): The requested node
        groups (set): The groups that are processed already
        nodes (dict): The nodes that consist of the requested node, where the target nodes are added every cycle
        links (list): A list of all the links of the target nodes.
        unwanted_link_name (string): The link names that are filtered out of the Traversal
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
                nodes[target_node.name] = target_node.node_data

                search_nodes_recursively(target_node, groups, nodes, links, unwanted_link_name)  #TODO: unwanted_link_name
    # return nodes, links


@api_view(['GET'])
@error_handling(title="An error occured while getting data of the node name equal to search input.")
def search(request, node_name):
    """Return the connected nodes or the layers that are connected to the node with the requested node name."""
    if node_name == "":
        ValueError(f"Invalid name. The search field is empty. The valid names are {search_ids}")
    if node_name not in search_ids:
        ValueError(f"Invalid name. The valid names are {search_ids}")
    nodes = {}
    links = []
    print(configuration["layered"])
    search_node = DocumentItem.nodes.get(name=node_name)
    nodes[search_node.name] = search_node.node_data
    search_nodes_recursively(search_node, {search_node.legend_group}, nodes, links)

    return Response(data={"nodes": nodes.values(), "links": links})



@api_view(['GET'])
@error_handling(title="An error occured while getting the connected nodes of the requested node name.")
def search_connected_nodes(request, node_name):
    """Return the connected nodes of the requested node name."""
    nodes, links = get_data_with_cypher_query(f"MATCH (n)-[r]-(m) where n.name = '{node_name}' return n,r,m")
    return Response(data={"nodes": nodes, "links": links})


def get_data_with_cypher_query(cypher_query):
    invalidWords = ["SET", "CREATE", "DELETE", "MERGE", "REMOVE"]
    query_words = cypher_query.split()
    query_words = [word.upper() for word in query_words]
    if cypher_query == "":
        raise ValueError("The input is empty. Please enter a Cypher query.")
    elif any(word in query_words for word in invalidWords):
        raise ValueError("SET, CREATE, DELETE, MERGE or REMOVE cannot be used!")
    nodes = []
    links = []
    results, _ = db.cypher_query(cypher_query, resolve_objects=True)
    nodes_made = []
    for result in results:
        for element in result:
            if isinstance(element, DocumentItem):
                node = element.node_data
                if node.name not in nodes_made:
                    nodes.append(node)
                    nodes_made.append(node.name)

            elif isinstance(element, Rel):
                link = element.link_data
                if link not in links:
                    links.append(link)

            elif isinstance(element, NeomodelPath):
                for path_element in element:
                    if isinstance(path_element, DocumentItem):
                        node = path_element.node_data
                        if node.name not in nodes_made:
                            nodes.append(node)
                            nodes_made.append(node.name)
                    elif isinstance(path_element, Rel):
                        link = path_element.link_data
                        if link not in links:
                            links.append(link)
                        for node_name in [link.source, link.target]:
                            node = DocumentItem.nodes.get(name=node_name)
                            node = node.node_data
                            if node.name not in nodes_made:
                                nodes.append(node)
                                nodes_made.append(node.name)

                    else:
                        raise TypeError(
                            f"Expected Node or Relationship types to be returned from the query; "
                            f"got {type(element)}"
                        )

            else:
                raise TypeError(
                    f"Expected Node or Relationship types to be returned from the query; " f"got {type(element)}"
                )
    return nodes, links
