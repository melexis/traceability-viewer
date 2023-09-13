# traceability-viewer

## Get started

Firstly, install the python packages with command:

`pip install -r py-requirements.txt`

Next, run the next command to set up a Neo4j database environment:

`docker-compose up`

Change the `BASE_URL` in the `config.yml` file to the correct path on you're computer.
This is the path to the JSON database of a local build (doc folder) of a Melexis product.

Next, run the `make_neo4j_db.py` file to make the database, when completed, run the `make_html.py` file to make the html.

Finally, you can open one of the html files and start having fun.

## What?

This tool is made to see the relationships between textual items. They are layered as the V-model except for the test items.
