"""
Python module that is needed for the autocompletion. One is for the query input field that contains all node IDs,
links and words that are often used in a Cypher query. The second one is for the search input field.
This contains all the node IDs where the group is a main group of the V model (not the group "Others").
"""

import json
from neo4j import GraphDatabase
from ruamel.yaml import YAML

# open the config file
with open("config.yml", "r", encoding="utf-8") as open_file:
    config = YAML().load(open_file)

# make a dict of the config file
config_dict = json.loads(json.dumps(config))

# search_groups will contain all filters that are in the config file
search_groups = []

# add the filters
for i in range(4):
    search_groups.append(config_dict["filters"][i])

URI = "bolt://localhost:7687"

# words will contain the autocomplete words for the query input field.
words = []
# search_ids will contain the node IDs for in the search input field.
search_ids = []
# link_types is used to check if a link type already exists and will in the end be added to words.
link_types = []

# ensure that a working connection is established
with GraphDatabase.driver(URI) as graphdb:
    graphdb.verify_connectivity()

# search for nodes that are connected to other nodes
with graphdb.session() as session:
    result = session.run("MATCH (n)<-[r]->(m) RETURN n,r,m")
    for record in result:
        # save the node IDs
        if record["n"] or record["m"]:
            if record["n"]._properties["id"] not in words:
                words.append(record["n"]._properties["id"])
                # only when a node group is in the search_groups, the ID will be safed.
                # No nodes of group "Others" can be searched for in the search input field.
                for group in search_groups:
                    if record["n"]._properties["id"].startswith(group):
                        search_ids.append(record["n"]._properties["id"])
        # save the types of links
        if record["r"]:
            if record["r"].type not in link_types:
                link_types.append(record["r"].type)

# add the words of a query that are used the most.
for w in ["MATCH", "STARTS WITH", "CONTAINS", "WHERE", "RETURN"]:
    words.append(w)

for l in link_types:
    words.append(l)
