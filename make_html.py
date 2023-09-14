"""
Python module to make the html files of the traceability tool with the accompanying data to start with.
Copyright (c) 2022 Melexis
"""

from autocomplete import graphdb, words, search_ids, config, config_dict

with graphdb.session() as session:
    # First is the all_items.html file. This will give an example to start with.
    nodes = []
    links = []
    result = session.run("MATCH (n)<-[r]->(m) WHERE n.id CONTAINS 'MEMORY' RETURN n,r,m")

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

    html = f"""
    <!DOCTYPE html>
    <html>
        <head>
            <link rel="shortcut icon" href="#">
            <script src="https://d3js.org/d3.v7.min.js"></script>
            <script src="https://d3js.org/d3-scale-chromatic.v1.min.js"></script>
            <script src="https://unpkg.com/neo4j-driver"></script>
            <link rel="stylesheet" href="vis_D3.css">
        </head>
        <body>
            <!-- <select id="selectButton"></select> -->
            <div id="buttons"></div>
            <div id="checkboxes">
            <input type="checkbox" id="text"><label for="text"> Nodes with labels </label>
            </div>
            <!-- <input type="checkbox" id="drag"><label for="drag"> Drag nodes </label> -->
            <br>
            <label>Cypher query: </label>
            <div class="autocomplete" style="width:100%;">
                <input placeholder="MATCH (source)<-[rel]->(target) WHERE source.id = 'string_id' RETURN source, rel, target" type="text" id="query" value="MATCH (source)<-[rel]->(target) WHERE source.id CONTAINS 'MEMORY' RETURN source,rel,target">
                <button class="btn" id="query_button">Submit query</button>
            </div>
            <!-- <input placeholder="MATCH (source)-[rel]->(target) WHERE source.id = 'string_id' RETURN source, rel, target" margin-left="100px" size="80%" type="text" id="query" value="MATCH (source)-[rel]->(target) WHERE source.id CONTAINS 'MEMORY' RETURN source,rel,target"> -->
            <br>
            <label>Search: </label>
            <div class="autocomplete" style="width:100%;">
                <input placeholder="SWARCH_" type="text" id="search">
                <button class="btn" id="search_button">Submit</button>
            </div>
            <div id="legend"></div>
            <div id="legend_links"></div>

            <button id="zoom_in">+</button>
            <button id="zoom_out">-</button>
            <button id="zoom_fit">Zoom fit</button>
            <button id="show_connected_nodes" hidden="hidden" >&#x1F441;</button>
            <button id="search_connected_nodes" hidden="hidden" >&#x2747;</button>
            <br>
            <div id="info"></div>
            <div id="graphviz"> </div>
            <div id="tooltip"></div>

            <script>
                // Fetch the data from Python
                var graph = {graph};
                var config = {config_dict};
                var words = {words};
                var searchIDs = {search_ids};
            </script>
            <script type = "text/javascript" src = "initialize.js" defer></script>
            <script type = "text/javascript" src = "legend.js" defer></script>
            <script type = "text/javascript" src = "loader.js" defer></script>
            <script type = "text/javascript" src = "forcegraph.js" defer></script>
            <script type = "text/javascript" src = "search.js" defer></script>
            <script type = "text/javascript" src = "autocomplete.js" defer></script>
        </body>
    </html>
    """
    FILE_NAME = "static/all_items.html"
    # Save the HTML code to a file
    with open(FILE_NAME, "w", encoding="utf-8") as file:
        file.write(html)

    for f in config["filters"]:
        # Next, the HTML files of the filtered groups. These will give the items connected to nodes with that filter.
        filter_string = '"' + f + '"'
        query = "MATCH (n)<-[r]->(m) WHERE n.group = " + filter_string + " RETURN n,r,m"
        result = session.run(query)

        nodes = []
        links = []
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

        filter_string = '"' + f + '"'

        html = f"""
        <!DOCTYPE html>
        <html>
            <head>
                <link rel="shortcut icon" href="#">
                <script src="https://d3js.org/d3.v7.min.js"></script>
                <script src="https://d3js.org/d3-scale-chromatic.v1.min.js"></script>
                <script src="https://unpkg.com/neo4j-driver"></script>
                <link rel="stylesheet" href="vis_D3.css">
            </head>
            <body>
                <!-- <select id="selectButton"></select> -->
                <div id="buttons"></div>
                <input type="checkbox" id="text"><label for="text"> Nodes with labels </label>
                <!-- <input type="checkbox" id="drag"><label for="drag"> Drag nodes </label> -->
                <div id="legend"></div>
                <div id="legend_links"></div>

                <button id="zoom_in">+</button>
                <button id="zoom_out">-</button>
                <button id="zoom_fit">Zoom fit</button>
                <button id="show_connected_nodes" hidden="hidden" >&#x1F441;</button>
                <button id="search_connected_nodes" hidden="hidden" >&#x2747;</button>
                <br>
                <div id="info"></div>
                <div id="graphviz"> </div>
                <div id="tooltip"></div>

                <script>
                    // Fetch the data from Python
                    var filter = {filter_string};
                    var graph = {graph};
                    var config = {config_dict};
                </script>
                <script type = "text/javascript" src = "initialize.js" defer></script>
                <script type = "text/javascript" src = "legend.js" defer></script>
                <script type = "text/javascript" src = "loader.js" defer></script>
                <script type = "text/javascript" src = "forcegraph.js" defer></script>
            </body>
        </html>
        """

        FILE_NAME = "static/" + f + ".html"
        # Save the HTML code to a file
        with open(FILE_NAME, "w", encoding="utf-8") as file:
            file.write(html)

session.close()
graphdb.close()
