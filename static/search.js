/**
 * @fileoverview This file contains what happens when clicking on the query or search buttons.
 */

/**
 * When the button of the query search is clicked, it will check if there are any words that are not allowed or
 * if it is empty. If the query is correct it will show the result.
 */
d3.select("#query_button").on("click", function() {
  d3.select("#info")
      .html("")
      .style("background-color", null);
  context.save();
  context.clearRect(0, 0, width, height);
  load = window.setInterval(loading, 1000 / 30);
  console.log("query_button");
  var query = d3.select("#query").property("value");

  if (["SET ", "CREATE ", "DELETE", "MERGE ", "REMOVE"].some(substring=>query.toUpperCase().includes(substring))){
    alert("SET, CREATE, DELETE, MERGE or REMOVE cannot be used!");
    clearInterval(load);
  }
  else if (query === ""){
    alert("Please enter a Cypher query.")
    clearInterval(load);
  }
  else {
    query_update(query);
  }
});

/**
 * When the search button is clicked, it will check if it is empty or not.
 * If the query is correct it will show the result.
 */
d3.select("#search_button").on("click", function() {
  d3.select("#info")
      .html("")
      .style("background-color", null);
  context.save();
  context.clearRect(0, 0, width, height);
  load = window.setInterval(loading, 1000 / 30);
  console.log("search_button");
  var search = d3.select("#search").property("value");

  if (search === ""){
    alert("The search input field is empty.")
    clearInterval(load);
  }
  else {
    search_update(search);
  }
});

/**
 * This function defines a query for showing the V-model of the given ID.
 * @param {string} search The search ID
 */
function search_update(search){
  graph.nodes = [];
  graph.links = [];
  selectedNodeID = search;

  let group;
  for (let [key,value] of Object.entries(config["group_colours"])){
    if (search.startsWith(key)) {
      group = key;
    }
  }
  var rel = "";
  filtered_links.forEach(function(el){
    rel +=  el + "|";
  })
  rel = rel.substring(0,rel.length - 1); // remove last |

  if (group == legend_groups[0]){
    //SYSRQT
    query = `
    MATCH p = (n {id: '` + search + `'})<-[:` + rel + `]->(t {group: '` + legend_groups[1] + `'})
    RETURN p as paths
    UNION
    MATCH p = (n {id: '` + search + `'})<-[:` + rel + `]->(t {group: '` + legend_groups[0] + `'})
    RETURN p as paths
    UNION
    MATCH p = allShortestPaths((n {id: '` + search + `'})<-[:` + rel + `*1..2]->(t {group: '` + legend_groups[4] + `'}))
    RETURN p as paths
    UNION
    MATCH p = allShortestPaths((n {id: '` + search + `'})<-[:` + rel + `*1..3]->(t {group: '` + legend_groups[5] + `'}))
    RETURN p as paths
    UNION
    MATCH p = allShortestPaths((n {id: '` + search + `'})<-[:` + rel + `*1..2]->(t {group: '` + legend_groups[2] + `'}))
    RETURN p as paths
    UNION
    MATCH p = allShortestPaths((n {id: '` + search + `'})<-[:` + rel + `*1..3]->(swdes {group: '` + legend_groups[3] + `'}))
    RETURN p as paths
    UNION
    MATCH p = allShortestPaths((n {id: '` + search + `'})<-[:` + rel + `*1..4]->(swdes {group: '` + legend_groups[6] + `'}))
    RETURN p as paths
    `
    console.log(query);
    addConnectedNodes(query);

  }
  else if (group == legend_groups[1]){
    //SWRQT
    query = `
    MATCH p = (n {id: '` + search + `'})<-[:` + rel + `]->(m)
    RETURN p as paths
    UNION
    MATCH p = allShortestPaths((n {id: '` + search + `'})<-[:` + rel + `*1..2]->(t {group: '` + legend_groups[3] + `'}))
    RETURN p as paths
    UNION
    MATCH p = allShortestPaths((n {id: '` + search + `'})<-[:` + rel + `*1..2]->(swdes {group: '` + legend_groups[5] + `'}))
    RETURN p as paths
    UNION
    MATCH p = allShortestPaths((n {id: '` + search + `'})<-[:` + rel + `*1..3]->(swdes {group: '` + legend_groups[6] + `'}))
    RETURN p as paths
    `
    console.log(query);
    addConnectedNodes(query);
  }
  else if (group == legend_groups[2]){
    // SWARCH
    query = `
    MATCH o=(n {id: '` + search + `'})<-[:` + rel + `]->(m)
    RETURN o as paths
    UNION
    MATCH p=allShortestPaths((n {id: '` + search + `'})<-[:` + rel + `*1..2]->(t {group: '` + legend_groups[6] + `'}))
    RETURN p AS paths
    UNION
    MATCH p=allShortestPaths((n {id: '` + search + `'})<-[:` + rel + `*1..2]->(t {group: '` + legend_groups[4] + `'}))
    RETURN p AS paths
    UNION
    MATCH p=allShortestPaths((n {id: '` + search + `'})<-[:` + rel + `*1..2]->(t {group: '` + legend_groups[0] + `'}))
    RETURN p AS paths`
    console.log(query);
    addConnectedNodes(query);
  }
  else if (group == legend_groups[3]){
    // SWDES
    query = `
    MATCH o=(n {id: '` + search + `'})<-[:` + rel + `]->(m)
    RETURN o as paths
    UNION
    MATCH p=allShortestPaths((n {id: '` + search + `'})<-[:` + rel + `*1..2]->(t {group: '` + legend_groups[5] + `'}))
    RETURN p AS paths
    UNION
    MATCH p=allShortestPaths((n {id: '` + search + `'})<-[:` + rel + `*1..2]->(t {group: '` + legend_groups[1] + `'}))
    RETURN p AS paths
    UNION
    MATCH p=allShortestPaths((n {id: '` + search + `'})<-[:` + rel + `*1..3]->(t {group: '` + legend_groups[4] + `'}))
    RETURN p AS paths
    UNION
    MATCH p=allShortestPaths((n {id: '` + search + `'})<-[:` + rel + `*1..3]->(t {group: '` + legend_groups[0] + `'}))
    RETURN p AS paths`
    console.log(query);
    addConnectedNodes(query);
  }
  else {
    clearInterval(load);
    alert("For this item, this feature is not implemented.\nTry another item.")
  }
}

/**
 * This function will give the result of the query that is defined for the search input.
 * @param {string} query The defined query
 */
function addConnectedNodes(query){
  var nodes_made = [];
  var links_made = [];
  const session = driver.session({database:"neo4j"});
  session.run(query)
        .then(function(result){
          // console.log(result);
          for (var i = 0; i < result.records.length; i++){
            var types = result.records[i]._fields //node array node
            for (var type in types){
              // console.log(types[type]);
              if (types[type]){
                if (types[type].__isNode__){
                  if (!nodes_made.includes(types[type].properties["id"])){
                    graph.nodes.push(types[type].properties);
                    nodes_made.push(types[type].properties["id"]);
                  }
                }
                if (types[type].__isRelationship__){
                  if (!links_made.includes(types[type].properties.source.id + "," + types[type].properties.target.id )){
                    graph.links.push({source: types[type].properties.source, target: types[type].properties.target, label: types[type].type, colour: types[type].properties.colour});
                    links_made.push(types[type].properties.source.id + "," + types[type].properties.target.id);
                  }
                }
                if (types[type].__isPath__){
                  // console.log("path")
                  for (var pathsegment in types[type].segments){
                    // console.log(pathsegment);
                    if (types[type].segments[pathsegment]){
                      for (var t in types[type].segments[pathsegment]){
                        // console.log(t);
                        if (types[type].segments[pathsegment][t].__isNode__){
                          if (!nodes_made.includes(types[type].segments[pathsegment][t].properties["id"])){
                            graph.nodes.push(types[type].segments[pathsegment][t].properties);
                            nodes_made.push(types[type].segments[pathsegment][t].properties["id"]);
                          }
                        }
                        if (types[type].segments[pathsegment][t].__isRelationship__){
                          if (!links_made.includes(types[type].segments[pathsegment][t].properties.source + "," + types[type].segments[pathsegment][t].properties.target)){
                            graph.links.push({source: types[type].segments[pathsegment][t].properties.source, target: types[type].segments[pathsegment][t].properties.target, label: types[type].segments[pathsegment][t].type, colour: types[type].segments[pathsegment][t].properties.colour})
                            links_made.push(types[type].segments[pathsegment][t].properties.source + "," + types[type].segments[pathsegment][t].properties.target);
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          if (graph.nodes.length === 0 && links.length === 0){
            alert("This query returns no data. Try another query. \nNote that names are case sensitive.");
          }

          update();
        }).catch(function(err){
          alert("Error:" + err);
          clearInterval(load);
        });
}

/**
 * This function will give the result of the input query.
 * @param {string} query The input cypher query
 */
function query_update(query) {
  // MATCH (a)-[b]->(c)-[d]->(e)-[f]->(g) WHERE a.id = 'SWARCH_MEMORY-ARCHITECTURE_DIAGRAM' RETURN a,b,c,d,e,f,g
  graph.nodes = [];
  graph.links = [];
  selectedNodeID = undefined;
  const session = driver.session({database:"neo4j"});
  session.run(query)
        .then(function(result){
          var nodes_made = [];
          for (var i = 0; i < result.records.length; i++){
            var types = result.records[i]._fields; //node relation node
            for (var type in types){
              if (types[type].__isNode__){
                if (!nodes_made.includes(types[type].properties["id"])){
                  graph.nodes.push(types[type].properties);
                  nodes_made.push(types[type].properties["id"]);
                }
              }
              if (types[type].__isRelationship__){
                graph.links.push({source: types[type].properties.source, target: types[type].properties.target, label: types[type].type, colour: types[type].properties.colour})
              }
              if (types[type].__isPath__){
                console.log("path")
                for (var pathsegment in types[type].segments){
                  for (var t in types[type].segments[pathsegment]){
                    if (types[type].segments[pathsegment][t].__isNode__){
                      if (!nodes_made.includes(types[type].segments[pathsegment][t].properties["id"])){
                        graph.nodes.push(types[type].segments[pathsegment][t].properties);
                        nodes_made.push(types[type].segments[pathsegment][t].properties["id"]);
                      }
                    }
                    if (types[type].segments[pathsegment][t].__isRelationship__){
                      graph.links.push({source: types[type].segments[pathsegment][t].properties.source, target: types[type].segments[pathsegment][t].properties.target, label: types[type].segments[pathsegment][t].type, colour: types[type].segments[pathsegment][t].properties.colour})
                    }
                  }
                }
              }
            }
          }
          if (graph.nodes.length === 0 && graph.links.length === 0){
            alert("This query gives empty data. Try another query. \nNote that names are case sensitive.");
          }
          console.log("data loaded");
          update();
        })
        .catch(function(err){
          alert("Error:" + err);
          clearInterval(load);
        });
}



/**
 * This function will update the graph with the new nodes and links. It will restart the simulation.
 */
function update() {
  updateLegend()
  console.log(graph.links);
  console.log(graph.nodes);
  graph.nodes.forEach(node => {
    node.strokeStyle = "white";
    node.globalAlpha = 1;
  });

  graph.links.forEach(link => {
    link.globalAlpha = 1;
  });
  clearInterval(load);
  simulation.nodes(graph.nodes);
  simulation.force("link").links(graph.links);
  simulation.alpha(1).restart();
  simulationUpdate();
}
