# Traceability Viewer

## Getting Started

Firstly, install the python packages with command:

`pip install -r py-requirements.txt`

Next, run the next command to set up a Neo4j database environment:

`docker-compose up`

If docker-compose is not istalled yet, install it with the `sudo apt install docker-compose` command.
To fix issues with permission, run the code below:
`sudo chmod 666 /var/run/docker.sock`
`sudo setfacl --modify user::rw /var/run/docker.sock`

Change the `BASE_URL` in the `config.yml` file to the correct path on your computer.
This is the path to the JSON database of a local build (doc folder) of a Melexis product.

Next, run the `make_neo4j_db.py` file to make the database.
When completed, run the `make_html.py` file to generate the HTML files.

Finally, you can open one of the HTML files and start having fun.

## What?

This tool is made to see the relationships between textual items. They are layered as the V-model except for the test items.

## Configuration

The configuration takes the form of a YAML file.

# Variables

The product number and the BASE_URL contains the path to the build/doc folder of that product.

# Location of Traceability Export

The path to the exported database.json file. This is the BASE_URL followed by the product number, ending with /database.json.

# URL

The path to the HTML documentation. Depending on the file structure, the ending could be changed to `/rom/html/document.html#id` in case of ROM.

# Filters

The groups of the V-model. This is in order, starting on the left side of the V-model: from top to bottom and the right
side (the test side) also from top to bottom.
These groups are also the filters.

# Group Colors

The groups with their corresponding colors.

# Link Colors

The colors of the links, i.e., the arrows. The default color is gray.
