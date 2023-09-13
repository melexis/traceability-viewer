/**
 * @fileoverview This file contains the main build for the graph of the html files
 * It uses d3.js for making the simulation of the forcegraph.
 * Canvas is uses to draw everything.
 */

/**
 * When the checkbox with id 'text' is changed,
 * the function simulationUpdate will run and update the graph.
 */
d3.select("#text").on("change", function(){
  simulationUpdate();
});

/**
 * When the mouse moves, the position will check wether it hovers over a node.
 * When the mouse hovers a node, a tooltip will pop up with the ID of that node.
 */
d3.select("canvas").on("mousemove", function(event){
  let p = d3.pointer(event, this);
  p[0] = p[0];
  p[1] = p[1];
  let transform = d3.zoomTransform(d3.select(context.canvas).node());
  let p1 = transform.invert(p);
  x = p1[0];
  y = p1[1];
  const node = findNode(graph.nodes, x, y, nodeRadius);
  if (node) {
    if(!node.hide){
        d3.select('#tooltip')
          .style('opacity', 0.9)
          .style('top', (event.pageY) + 5 + 'px')
          .style('left', (event.pageX) + 5 + 'px')
          .html(node.id);
    }
  } else {
    d3.select('#tooltip')
      .style('opacity', 0);
  }
})

let context = graphCanvas.node().getContext('2d');

let transform = d3.zoomIdentity;

let row1 = 0, row2 = 300, row3 = 600, row4 = 900;

/**
 * A scale that gives y positions for each group.
 */
let y_scale = d3.scaleOrdinal()
  .domain(config["filters"])
  .range([row1,row2,row3,row4, row2 ,row3 ,row4 ]);


/**
 * For each node, the globalAlpha is set to 1 and the nodes of groups will get a corresponding y position.
 * When setting globalAlpha to 1, it means that the node is not transparent.
 */
graph.nodes.forEach(node => {
  node.globalAlpha = 1;

  for (let [key,value] of Object.entries(config["group_colours"])){
    if (node.id.startsWith(key)) {
      node.y = y_scale(key)
    }
  }
});

/**
 * The links will also not be transparent,].
 */
graph.links.forEach(link => {
  link.globalAlpha = 1;
});

/**
 * The forceSimulation of d3.js will be used to calculate the positions of the nodes.
 * ForceManyBody is used for making elements attract or repel one another.
 * ForceCollide is used to prevent elements from overlapping.
 */
let simulation = d3.forceSimulation()
  .force("link", d3.forceLink().id(function(d) {return d.id; }))
  .force("charge", d3.forceManyBody().strength(-50))
  .force("collide", d3.forceCollide().radius(nodeRadius+5))
  // .force("center", d3.forceCenter(width / 2, height / 2));

/**
 * Add the nodes and links to the simulation.
 */
simulation
  .nodes(graph.nodes)
  .force('forceY', d3.forceY(function(d){
    if (d.group !== "Others"){
      return y_scale(d.group);
    }
    else {
      let y = undefined;
      for (link in graph.links){
        if (graph.links[link].target === d.id){
          if (config["filters"].some(filter => graph.links[link].source.startsWith(filter))){
            let nodeID = graph.links[link].source;
            let node = graph.nodes.find(x => x.id === nodeID);
            y = y_scale(node.group);
          }
        }
      }
      if (y == undefined){
        y = height/2;
      }
      return y;
    }
    }).strength(3))
  .force('forceX', d3.forceX().strength(0.01).x(width/2))
  .on("tick", simulationUpdate);

simulation.force("link")
  .links(graph.links);


let ticksPerRender = 3;

/**
 * For faster animation.
 */
requestAnimationFrame(function render() {
  for (let i = 0; i < ticksPerRender; i++) {
    simulation.tick();
  }
  if (simulation.alpha() > 0) {
    requestAnimationFrame(render);
  }
});

/**
 * D3.js zoom to make zooming possible. The minimum and maximum scale extent are given,
 * so unending zooming is impossible.
 */
let zoom = d3.zoom();
zoom.scaleExtent([1 / 10, 8]).on("zoom", zoomed);


/**
 * This function is used for zooming. After transforming, simulationUpdate will draw the graph.
 * @param {object} event The zooming event
 */
function zoomed(event) {
  transform = event.transform;
  simulationUpdate();
}

/**
 * When the button zoom in is clicked, it will zoom in.
 */
d3.select("#zoom_in").on("click", function() {
  zoom.scaleBy(d3.select(context.canvas).transition().duration(750), 1.2);
});
/**
 * When the button zoom out is clicked, it will zoom out.
 */
d3.select("#zoom_out").on("click", function() {
  zoom.scaleBy(d3.select(context.canvas).transition().duration(750), 0.8);
});
/**
 * When the button zoom fit is clicked, it will zoom to fit the graph content.
 */
d3.select("#zoom_fit").on("click", function() {
  zoomToFit();
});
/**
 * When the button with the eye emoticon is clicked, the nodes to the selected node will be visible.
 * The rest of the nodes will be more transparent on the background.
 */
d3.select("#show_connected_nodes").on("click", function() {
  connectedNodes(selectedNodeID);
});
/**
 * When the button with the connected nodes emoticon is clicked,
 * it will search for every node that is connected to the selected node in the database.
 * It will add the nodes and links connected to the selected node, so also the ones that where not there yet.
 */
d3.select("#search_connected_nodes").on("click", function() {
  add_node_and_links(selectedNodeID);
});

/**
 * This will make dragging possible.
 */
d3.select(context.canvas)
    .call(d3.drag()
        .container(context.canvas)
        .subject(dragSubject)
        .on('start', dragStarted)
        .on('drag', dragged)
        .on('end', dragEnded));

// d3.select("canvas").on("click", function(event){
//   let p = d3.pointer(event);
//   let transform = d3.zoomTransform(d3.select(context.canvas).node());
//   let p1 = transform.invert(p);
//   x = p1[0];
//   y = p1[1];
//   const node = findNode(graph.nodes, x, y, nodeRadius);
//   if (node) {
//     node_clicked(node);
//   }
// })


/**
 * When a node is clicked, the appearance will change to a bigger node with black border.
 * The info of that node will also be visible.
 * @param {object} node The node that is selected
 */
function node_clicked(node){
  d3.select("#show_connected_nodes").attr("hidden", null);
  d3.select("#search_connected_nodes").attr("hidden", null);
  // Create an array logging what is connected to what
  linkedByIndex = {};
  graph.nodes.forEach(function(d){
    linkedByIndex[d.id + "," + d.id] = 1;
  });
  graph.links.forEach(function(d) {
    // console.log(d.source.id + "," + d.target.id);
    linkedByIndex[d.source.id + "," + d.target.id] = 1;
    // if (d.source.id == node.id || d.target.id == node.id){
    //   console.log(d);
    // }
  });
  // console.log(linkedByIndex);
  graph.nodes.forEach(el => {
      el.strokeStyle = "white";
  });
  node.strokeStyle = "black";
  selectedNodeID = node.id;

  let text = new String();
  if (node.document){
    let url = "";
    for (item in config["URL"]){
      url += config["URL"][item];
    }
    url = url.replace("document", node.document);
    url = url.replace("id", node.id);
    if (node.caption != undefined) {
      text += node.caption + "<br>";
    }
    if (node.attributes != "{}"){
      let attr = JSON.parse(node.attributes);
      text += "<b>Attributes: </b><br>";
      for (item in attr){
        text += " &emsp; <i>" + item + "</i>";
        if (attr[item]){
          text += ": " + attr[item] + "<br>";
        }
        else {
          text += "<br>";
        }
      }
    }
    d3.select("#info")
      .html("<a target='_blank' href='" + url + "'><b>" + node.id + "</b></a><br>" + text)
      .style("background-color", "#c2c2c2e4");
  }
  else {
    if (node.caption != undefined) {
      text += node.caption;
    }
    d3.select("#info")
      .html("<b>" + node.id + "</b><br>" + text);
  }
  simulationUpdate();
}


/**
 * This will disable zooming on double click.
 * When the mouse goes out of the canvas, the tooltip will be hidden.
 */
d3.select(context.canvas).call(zoom)
        .on("dblclick.zoom", null)
    .on("mouseout", () => {
      hideTooltip();
    });

let clickDate = new Date();
let difference_ms;

/**
 * Find the node that was clicked, if any, and return it.
 * @param {object} event The dragging event
 */
function dragSubject(event) {
    const x = transform.invertX(event.x),
          y = transform.invertY(event.y);
    const node = findNode(graph.nodes, x, y, nodeRadius);
    if (node) {
      node.x =  transform.applyX(node.x);
      node.y = transform.applyY(node.y);
      return node;
    }
    // else: No node selected, drag container
}

/**
 * Description
 * @param {Array} nodes The array of node objects that exists in the graph.
 * @param {number} x The x value
 * @param {number} y The y value
 * @param {number} radius The node radius
 * @returns {object} The node object if the pointer is on a node, else it will return undefined.
 */
function findNode(nodes, x, y, radius) {
    const rSq = radius * radius;
    let i;
    for (i = 0; i < nodes.length; i++) {
      const node = nodes[i],
            dx = x - node.x,
            dy = y - node.y,
            distSq = (dx * dx) + (dy * dy);
      if (distSq < rSq) {
        return node;
      }
    }
    // No node selected
    return undefined;
}

/**
 * When the dragging starts it will take the node and move it.
 * @param {object} event The dragging event
 */
function dragStarted(event) {
  // difference_ms = (new Date()).getTime() - clickDate.getTime();
  // clickDate = new Date();
  node_clicked(event.subject);
  console.log(event.subject);
  if (!event.active) {
    simulation.alphaTarget(0.3).restart();
  }
  event.subject.fx = transform.invertX(event.x);
  event.subject.fy = transform.invertY(event.y);
}

/**
 * While dragging the node will follow your pointer.
 * @param {object} event The dragging event
 */
function dragged(event) {
  event.subject.fx = transform.invertX(event.x);
  event.subject.fy = transform.invertY(event.y);
}

/**
 * When the dragging end the node is released.
 * @param {object} event The dragging event
 * @returns {any}
 */
function dragEnded(event) {
    if (!event.active) {
      simulation.alphaTarget(0);
    }

    event.subject.fx = null;
    event.subject.fy = null;
}

/**
 * The existing nodes that are connected to the selected node will be visible and the rest of the nodes will be
 * transparent on the background.
 * @param {string} node_id The ID of the selected node
 */
function connectedNodes(node_id) {
  toggle = !toggle;
  if (toggle) {
    //Reduce the opacity of all but the neighbouring nodes
    graph.nodes.forEach(function(o) {
      if (linkedByIndex[node_id + "," + o.id] || linkedByIndex[o.id + "," + node_id]){
        o.globalAlpha = 1;
      }
      else {
        o.globalAlpha = 0.05;
      }
    });
    graph.links.forEach(function(o) {
      if (node_id == o.source.id || node_id == o.target.id){
        o.globalAlpha = 1;
      }
      else {
        o.globalAlpha = 0.05;
      }
    });
    //Reduce the op
    // toggle = !toggle;
  } else {
    //Put them back to opacity=1
    graph.nodes.forEach(o => o.globalAlpha = 1);
    graph.links.forEach(o => o.globalAlpha = 1);
    // toggle = !toggle;
  }
  simulationUpdate();
}

/**
 * This function will search for all connected nodes to the selected node in de database.
 * If the connected node(s) do(es) not exist, they will also be drawn.
 * @param {any} node_id
 * @returns {any}
 */
function add_node_and_links(node_id) {
  // MATCH (a)-[b]->(c)-[d]->(e)-[f]->(g) WHERE a.id = 'SWARCH_MEMORY-ARCHITECTURE_DIAGRAM' RETURN a,b,c,d,e,f,g
    let query = "MATCH (n)<-[r]->(m) WHERE n.id = '" + node_id + "' RETURN n, r, m"
    const session = driver.session({database:"neo4j"});
    let existing_nodes = [];
    graph.nodes.forEach(element => {
        existing_nodes.push(element.id);
    });

    session.run(query)
          .then(function(result){
            for (let i = 0; i < result.records.length; i++){
              let types = result.records[i]._fields;
              for (let type in types){
                if (types[type].__isNode__){
                  if (!existing_nodes.includes(types[type].properties.id)){
                    graph.nodes.push(types[type].properties);
                    existing_nodes.push(types[type].properties.id);
                  }
                }
                if (types[type].__isRelationship__){
                  let rel = {source: types[type].properties.source, target: types[type].properties.target,
                    label: types[type].type, colour: types[type].properties.colour};
                  if (!graph.links.includes(rel)){
                    console.log(rel);
                    graph.links.push(rel);
                  }
                }
              }
            }
            types = Array.from(new Set(graph.links.map(d => d.label)));
            graph.nodes.forEach(node => {
              node.strokeStyle = "white";
              node.globalAlpha = 1;
            });
            updateLegend();
          //Create an array logging what is connected to what
          linkedByIndex = {};
          graph.nodes.forEach(function(d){
            linkedByIndex[d.id + "," + d.id] = 1;
            d.globalAlpha = 1;
          });
          graph.links.forEach(function(d) {
            linkedByIndex[d.source.id + "," + d.target.id] = 1;
            d.globalAlpha = 1;
          });

          if (toggle) {
            toggle = !toggle;
          }
          simulation.nodes(graph.nodes);
          simulation.force("link").links(graph.links);
          simulation.alpha(1).restart();
          simulationUpdate();
          })
          .catch(function(err){
            alert("Error:" + err);
          });
}

/**
 * The tooltip will be hidden.
 */
function hideTooltip() {
  d3.select('.canvas-tooltip')
    .style('opacity', 0)
    .style('z-index', -1);
}

/**
 * This function will draw all elements on their position according to the forceSimulation.
 */
function simulationUpdate() {
    context.save();

    context.clearRect(0, 0, width, height);
    context.translate(transform.x, transform.y);
    context.scale(transform.k, transform.k);

    // Draw edges
    graph.links.forEach(link => {
      if ((!link.source.hide) && (!link.target.hide)){
        if (filtered_links.includes(link.label)){
          drawLine(link)
        }
      }
    })

    // Draw nodes
    graph.nodes.forEach(node => {
      if (!node.hide){
        drawNode(node);
      }
    })

    if(d3.select("#text").property("checked")){
      graph.nodes.forEach(function(d){
        if (!d.hide){
          showLabel(d);
        }
      })
    }

    context.restore();
  }


/**
 * The IDs of the nodes will be visible.
 * @param {object} node A node where the ID needs to be visible
 */
function showLabel(node){
  context.globalAlpha = node.globalAlpha;
  context.font = 'bolt 7pt Verdana';
  context.fillStyle = 'black';
  context.strokeStyle = 'white';
  context.lineWidth = 0.1;
  context.fillText(node.id, node.x + nodeRadius + 2, node.y + nodeRadius/2);
  context.strokeText(node.id, node.x + nodeRadius + 2, node.y + nodeRadius/2);
  context.stroke();
  context.fill();
}

/**
 * A node will be drawn in the canvas.
 * @param {object} d the node object
 */
function drawNode(d){
  context.globalAlpha = d.globalAlpha;
  context.beginPath();

  if (d.id == selectedNodeID){
    context.arc(d.x, d.y, nodeRadius + 3, 0, 2 * Math.PI);
    context.strokeStyle = "black";
  }
  else {
    context.arc(d.x, d.y, nodeRadius, 0, 2 * Math.PI);
    context.strokeStyle = "white";
  }
  if (d.colour == undefined){
    context.fillStyle = "black";
  }
  else {
    context.fillStyle = d.colour;
  }

  context.closePath();
  context.lineWidth = "3";
  context.stroke();
  context.fill();
}

/**
 * A link will be drawn in the canvas.
 * @param {object} d the link object
 */
function drawLine(d){
  const link = new Path2D();
  let targetX;
  let targetY;
  context.globalAlpha = d.globalAlpha;
  let slope = Math.atan2(d.target.y - d.source.y, d.target.x - d.source.x);
  let arrowWidth = 7;
  link.moveTo(d.source.x , d.source.y);
  link.lineTo(d.target.x, d.target.y);
  link.lineWidth = 1.5;
  context.strokeStyle = d.colour;
  context.stroke(link);
  const arrow = new Path2D();
  if (d.target.id == selectedNodeID){
    targetX = d.target.x - (nodeRadius + 4) * Math.cos(slope);
    targetY = d.target.y - (nodeRadius + 4) * Math.sin(slope);
  }
  else {
    targetX = d.target.x - (nodeRadius + 1) * Math.cos(slope);
    targetY = d.target.y - (nodeRadius + 1) * Math.sin(slope);
  }
  arrow.moveTo(targetX, targetY);
  arrow.lineTo(targetX - arrowWidth * Math.cos(slope - Math.PI/7),
               targetY - arrowWidth * Math.sin(slope - Math.PI/7));
  arrow.lineTo(targetX - arrowWidth * Math.cos(slope + Math.PI/7),
               targetY - arrowWidth * Math.sin(slope + Math.PI/7));
  arrow.closePath();
  context.fillStyle = d.colour;
  context.globalAlpha = d.globalAlpha;
  context.stroke(arrow);
  context.fill(arrow);
}


/**
 * Zoom to fit the content of the graph.
 */
function zoomToFit(){
  // https://stackoverflow.com/questions/38354488/zoom-to-fit-canvas-javascript
  let minx = minX(graph.nodes);
  let miny = minY(graph.nodes);
  let dataWidth = maxX(graph.nodes)-minx;
  let dataHeight = maxY(graph.nodes)-miny;

  let scale = 0.95*Math.min(width/dataWidth, height/dataHeight);

  let translate = [
    (width / 2) - ((dataWidth / 2) + minx) * scale,
    (height / 2) - ((dataHeight / 2) + miny) * scale
  ];

  let transform = d3.zoomIdentity
    .translate(translate[0], translate[1])
    .scale(scale);

  d3.select(context.canvas).transition().duration(750).call(zoom.transform, transform)
}

/**
 * Returns max value of attribute 'x' in array.
 * @param {object} arr Array of objects
 * @returns {number} Number of the maximum x value
 */
function maxX(arr) {
  let node = arr.reduce((prev, curr) => prev.x > curr.x ? prev : curr);
  return node.x;
}

/**
 * Returns max value of attribute 'y' in array.
 * @param {object} arr Array of objects
 * @returns {number} Number of the maximum y value
 */
function maxY(arr) {
  let node = arr.reduce((prev, curr) => prev.y > curr.y ? prev : curr);
  return node.y;
}

/**
 * Returns min value of attribute 'x' in array.
 * @param {object} arr Array of objects
 * @returns {number} Number of the minimum x value
 */
function minX(arr) {
  let node = arr.reduce((prev, curr) => prev.x < curr.x ? prev : curr);
  return node.x;
}

/**
 * Returns min value of attribute 'y' in array.
 * @param {object} arr Array of objects
 * @returns {number} Number of the minimum y value.
 */
function minY(arr) {
  let node = arr.reduce((prev, curr) => prev.y < curr.y ? prev : curr);
  return node.y;
}

/**
 * Hides all nodes of the specified group.
 * @param {string} group The group name
 */
function hideNodesOfGroup(group) {
  graph.nodes.forEach(node => {
    if (node.group == group){
      node.hide = true;
    }
  })
  simulationUpdate();
}

/**
 * Shows all nodes of the specified group.
 * @param {string} group The group name
 */
function showNodesOfGroup(group) {
  graph.nodes.forEach(node => {
    if (node.group == group){
      node.hide = false;
    }
  })
  simulationUpdate();
}
