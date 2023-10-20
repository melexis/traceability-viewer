from django.shortcuts import render
from neo4j import GraphDatabase
from ruamel.yaml import YAML
from .models import DocumentItem
import json


def create_database():
    """Create a Neo4j database"""

    with open("myapp/config.yml", "r", encoding="utf-8") as open_file:
        configuration = YAML().load(open_file)

    path = ""
    data = {}
    for item in configuration["json_folder"]:
        path += str(item)

    with open(path, encoding="utf-8") as json_file:
        data = json.load(json_file)


# Create your views here.
def index(request):
    # context = {
    #     "filters": [{"SYSRQT": "#fc851c"},
    #                 {"SWRQT": "#FF33CC"},
    #                 {"SWARCH": "#7777FF"},
    #                 {"SWDESIGN": "#cf5402"},
    #                 {"SWQTEST": "#00FF00"},
    #                 {"SWITEST": "#00FF00"},
    #                 {"SWUTEST": "#00FF00"}]
    # }
    context = {
        "filters": [
            {
                "SYSRQT": "#fc851c",
                "SWRQT": "#FF33CC",
                "SWARCH": "#7777FF",
                "SWDESIGN": "#cf5402",
                "SWQTEST": "#00FF00",
                "SWITEST": "#00FF00",
                "SWUTEST": "#00FF00",
            }
        ]
    }
    return render(request, "index.html", context)


def filter(request):
    URI = "bolt://localhost:7687"
    group = request.GET[id]
    # ensure that a working connection is established
    with GraphDatabase.driver(URI) as graphdb:
        graphdb.verify_connectivity()

    with graphdb.session() as session:
        # First is the all_items.html file. This will give an example to start with.
        nodes = []
        links = []
        result = session.run(f"MATCH (n)<-[r]->(m) WHERE n.group = {group} RETURN n,r,m")

        for record in result:
            if record["n"]:
                if record["n"]._properties not in nodes:
                    nodes.append(record["n"]._properties)

            if record["r"]:
                prop = record["r"]._properties
                prop["label"] = record["r"].type
                links.append(prop)

            if record["m"]:
                if record["m"]._properties not in nodes:
                    nodes.append(record["m"]._properties)

    graph = {"nodes": nodes, "links": links}
    return render(request, "index.html", graph)
