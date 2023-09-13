"""
Python module that is needed for the autocompletion.
Copyright (c) 2022 Melexis
"""

from neo4j import GraphDatabase
import json
from ruamel.yaml import YAML

with open("config.yml", "r", encoding="utf-8") as open_file:
    config = YAML().load(open_file)

config_dict = json.loads(json.dumps(config))

search_groups = []

for i in range(4):
    search_groups.append(config_dict["filters"][i])

URI = "bolt://localhost:7687"

words = []
search_ids = []
link_types = []

# ensure that a working connection is established
with GraphDatabase.driver(URI) as graphdb:
    graphdb.verify_connectivity()

with graphdb.session() as session:
    result = session.run("MATCH (n)<-[r]->(m) RETURN n,r,m")

    for record in result:
        if record["n"] or record["m"]:
            if record["n"]._properties["id"] not in words:
                words.append(record["n"]._properties["id"])
                for group in search_groups:
                    if record["n"]._properties["id"].startswith(group):
                        search_ids.append(record["n"]._properties["id"])

        if record["r"]:
            if record["r"].type not in link_types:
                link_types.append(record["r"].type)

words.append(["MATCH", "STARTS WITH", "CONTAINS", "WHERE", "RETURN"])
words.append(link_types)
