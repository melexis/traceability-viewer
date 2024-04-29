/**
 * Returns true if object is in list of objects, false otherwise
 * @param {Object} obj The object to search in the list
 * @param {Array} list The list of objects
 * @returns {Boolean}
 */
function containsObject(obj, list) {
  var i;
  for (i = 0; i < list.length; i++) {
    if (list[i] === obj) {
      return true;
    }
  }

  return false;
}

/**
 * Returns max value of attribute 'x' in array.
 * @param {object} arr Array of objects
 * @returns {number} Number of the maximum x value
 */
function maxX(arr) {
  let node = arr.reduce((prev, curr) => (prev.x > curr.x ? prev : curr));
  return node.x;
}

/**
 * Returns max value of attribute 'y' in array.
 * @param {object} arr Array of objects
 * @returns {number} Number of the maximum y value
 */
function maxY(arr) {
  let node = arr.reduce((prev, curr) => (prev.y > curr.y ? prev : curr));
  return node.y;
}

/**
 * Returns min value of attribute 'x' in array.
 * @param {object} arr Array of objects
 * @returns {number} Number of the minimum x value
 */
function minX(arr) {
  let node = arr.reduce((prev, curr) => (prev.x < curr.x ? prev : curr));
  return node.x;
}

/**
 * Returns min value of attribute 'y' in array.
 * @param {object} arr Array of objects
 * @returns {number} Number of the minimum y value.
 */
function minY(arr) {
  let node = arr.reduce((prev, curr) => (prev.y < curr.y ? prev : curr));
  return node.y;
}

app.component("graphviz", {
  delimiters: ["[[", "]]"],
  template:
    /*html*/
    `
    <!-- Checkboxes -->
    <div id="checkboxes">
        <input type="checkbox" id="text" @click="drawUpdate"><label class="ms-1" for="text"> Nodes with labels </label>
    </div>
    <!-- Legend -->
    <item-legend :items="itemColors" @hidden-items="updateHiddenGroups"></item-legend>
    <item-legend :items="linkColors" @hidden-items="updateHiddenLinks"></item-legend>
    <!-- Buttons -->
    <div class="mt-1 btn-group">
        <button id="zoom_in" class="btn btn-light border-dark" @click="zoomIn">+</button>
        <button id="zoom_out" class="btn btn-light border-dark" @click="zoomOut">-</button>
        <button id="zoom_fit" class="btn btn-light border-dark" @click="zoomToFit">Zoom to fit</button>
        <button v-if="!selectedNodeName == ''"
                id="show_connected_nodes"
                class="btn btn-light border-dark"
                @click="showConnectedNodes"
                :class="{active: toggle}"
        >
            &#x1F441;
        </button>
        <button v-if="!selectedNodeName == ''"
                id="search_connected_nodes"
                class="btn btn-light border-dark"
                @click="searchConnectedNodes"
        >
            Add/show connecting nodes
        </button>
    </div>
    <!-- Info node -->
    <div v-if="showInfo" v-html="info" id="info" class="m-2 p-2 rounded position-absolute bg-body-secondary"></div>
    <!-- Graph -->
    <div id="loading" class="d-flex justify-content-center" :class="{'visually-hidden': !loading}">
        <strong role="status" class="m-5">Loading...</strong>
        <div class="spinner-border m-5"></div>
    </div>
    <canvas ref="canvas" @mousemove="mouseMove($event)" @click="clicked($event)" :height="height" :width="width">
    </canvas>
    <div id="tooltip"></div>
    `,
  props: {
    loading: {
      type: Boolean,
      default: true,
    },
    config: {
      type: Object,
      default: {},
    },
    nodes: {
      type: Array,
      default: [],
    },
    links: {
      type: Array,
      default: [],
    },
    searchNode: {
      type: Object,
      default: null,
    },
  },
  setup(props) {
    // ref canvas
    var canvas = Vue.ref(null);

    // The context of the canvas
    let ctx = Vue.ref(null);

    // variables for the width and height
    const width = Vue.ref(window.innerWidth - 20);
    const height = Vue.ref(window.innerHeight - 200);

    // data nodes and links from the parent component
    var nodes = Vue.toRef(props, "nodes");
    var links = Vue.toRef(props, "links");

    // If loading = true, a loading screen is displayed
    var loading = Vue.toRef(props, "loading");

    // The groups with corresponding colors depending on the nodes in the graph
    let itemColors = Vue.ref([]);

    // The links with corresponding colors depending on the links in the graph
    let linkColors = Vue.ref([]);

    // The links that are hidden (corresponding to the legend of links)
    let hiddenLinks = Vue.ref([]);

    // The nodes that are connected to the selected node
    let linkedByIndex = {};

    // Toggle to show connected nodes
    let toggle = Vue.ref(false);

    // The radius of a normal node
    let nodeRadius = 6;

    // The y scale for the layers
    let yScale = null;

    let nodesNames;

    // The name of the selected node
    let selectedNodeName = Vue.ref("");
    // The selected node object
    let selectedNode = Vue.ref(null);

    let searchNode = Vue.toRef(props, "searchNode");

    Vue.watch(searchNode, (searchNode) => {

      selectedNode.value = searchNode
      if (searchNode){
        selectedNodeName.value = searchNode.name
      }
      else {
        selectedNodeName.value = ""
      }
    });

    // The identity transform where k=1, tx=ty=0
    let transform = d3.zoomIdentity;

    // A zoom behavior
    let zoom = d3.zoom();
    // The minimum scale factor is 1/10 and the maximum scale factor is 8.
    // After a change to the zoom transform, the function zoomed() is called.
    zoom.scaleExtent([1 / 10, 8]).on("zoom", zoomed);

    // The simulation with specified array of nodes (later) and forces that are specified.
    let simulation = d3
      .forceSimulation()
      .force(
        "link",
        d3.forceLink().id(function (d) {
          return d.name;
        })
      )
      .force("charge", d3.forceManyBody().strength(-50))
      .force("collide", d3.forceCollide().radius(nodeRadius + 5));

    /**
     * Controlls the div for the info when a node is clicked
     * @returns {bool} True when info may be showed, false otherwise
     */
    let showInfo = Vue.computed(() => {
      if (selectedNode.value != null) {
        return !selectedNode.value.hide;
      }
      return false;
    });

    /**
     * The info showed when clicking a node.
     * @returns {string} The string that contains html for the info of the node
     */
    let info = Vue.computed(() =>  {
      let text = "";
      if (selectedNode.value) {
        let url = selectedNode.value.url
        if (!url) {
          // url was empty string, false, 0, null, undefined, ...
          text += "<b>" + selectedNode.value.name + "</b>";
        }
        else {
          text +=
            "<a target='_blank' class='link-primary link-offset-2 link-underline-opacity-0 link-underline-opacity-100-hover'" +
            "href='" +
            url +
            "'><b>" +
            selectedNode.value.name +
            "</b></a>";
        }
        if (selectedNode.value.properties) {
          properties = JSON.parse(
            selectedNode.value.properties
          );
          for (propertyName of props.config["visualised_properties"]){
            if (propertyName in properties){
              let propertyValue = properties[propertyName];
              if (propertyValue){
                if(typeof propertyValue === "object"){
                  if (Object.keys(propertyValue).length !== 0){
                    text += "<br><b>" + propertyName + ": </b>"
                    for (const [key, value] of Object.entries(propertyValue)){
                      if (value){
                        text += "<br>&emsp; " + key + ": <i>" + value + "</i>";
                      }
                    }
                  }
                }
                else {
                  text += "<br><b>" + propertyName + ": </b>"
                  text += propertyValue;
                }

              }
            }
          }
        }
        return text;
      }
      return text;
    })

    Vue.watch(loading, (newLoading) => {
      if (newLoading) {
        ctx.value.save();
        ctx.value.clearRect(0, 0, width.value, height.value);
        ctx.value.restore();
      }
    });

    /**
     * Update the hide attribute of the nodes corresponding to the legend of the node groups.
     * The graph will be updated.
     * @param {Array} hiddenItems The array of the hidden items
     */
    function updateHiddenGroups(hiddenItems) {
      nodes.value.forEach((node) => {
        node.hide = false;
        if (node["name"] == selectedNodeName.value){
          selectedNodeName.value = "";
          selectedNode.value = null;
        }
        if (hiddenItems.includes("others") && node["legend_group"] == "others") {
          node.hide = true;
        } else {
          for (hiddenGroup of hiddenItems) {
            if (node["legend_group"] == hiddenGroup) {
              node.hide = true;
            }
          }
        }
      });
      drawUpdate();
    }

    /**
     * Update the hidden links corresponding to the legend of the node groups. The graph will be updated.
     * @param {Array} hiddenItems The array of the hidden items
     */
    function updateHiddenLinks(hiddenItems) {
      hiddenLinks.value = hiddenItems;
      drawUpdate();
    }

    /**
     * Function used for zooming. After transforming, the graph will be updated.
     * @param {object} event The zooming event
     */
    function zoomed(event) {
      transform = event.transform;
      drawUpdate();
    }

    /**
     * Zoom in when the button zoom in is clicked.
     */
    function zoomIn() {
      zoom.scaleBy(d3.select(ctx.value.canvas).transition().duration(750), 1.2);
    }

    /**
     * Zoom out when the button zoom out is clicked.
     */
    function zoomOut() {
      zoom.scaleBy(d3.select(ctx.value.canvas).transition().duration(750), 0.8);
    }

    /**
     * Zoom to fit the content of the graph when the button zoom to fit is clicked.
     */
    function zoomToFit() {
      if (nodes.value.length > 0) {
        let minx = minX(nodes.value);
        let miny = minY(nodes.value);
        let dataWidth = maxX(nodes.value) - minx;
        let dataHeight = maxY(nodes.value) - miny;
        let scale =
          0.8 * Math.min(width.value / dataWidth, height.value / dataHeight);
        transform = d3.zoomIdentity
          .translate(
            width.value / 2 - (dataWidth / 2 + minx) * scale,
            height.value / 2 - (dataHeight / 2 + miny) * scale
          )
          .scale(scale);
        d3.select(ctx.value.canvas)
          .transition()
          .duration(750)
          .call(zoom.transform, transform);
      }
    }

    /**
     * Clear the graph and draw all nodes and links (again).
     */
    function drawUpdate() {
      ctx.value.save();
      ctx.value.clearRect(0, 0, width.value, height.value);
      ctx.value.translate(transform.x, transform.y);
      ctx.value.scale(transform.k, transform.k);

      // Draw edges
      links.value.forEach((link) => {
        if (
          !hiddenLinks.value.includes(link.type) &&
          !link.source.hide &&
          !link.target.hide
        ) {
          if (toggle.value) {
            if (
              link.source.name == selectedNodeName.value ||
              link.target.name == selectedNodeName.value
            ) {
              ctx.value.globalAlpha = 1;
            } else {
              ctx.value.globalAlpha = 0.05;
            }
          } else {
            ctx.value.globalAlpha = 1;
          }
          drawLine(link);
        }
      });
      // Draw nodes
      nodes.value.forEach((node) => {
        if (!node.hide) {
          if (toggle.value) {
            if (
              linkedByIndex[selectedNodeName.value + "," + node.name] ||
              linkedByIndex[node.name + "," + selectedNodeName.value]
            ) {
              ctx.value.globalAlpha = 1;
              drawNode(node);
            } else {
              ctx.value.globalAlpha = 0.05;
              drawNode(node);
            }
          } else {
            ctx.value.globalAlpha = 1;
            drawNode(node);
          }
        }
      });

      showLabels();

      ctx.value.restore();
    }

    function showLabels() {
      if (d3.select("#text").property("checked")) {
        nodes.value.forEach((node) => {
          if (!node.hide) {
            if (toggle.value) {
              if (
                linkedByIndex[selectedNodeName.value + "," + node.name] ||
                linkedByIndex[node.name + "," + selectedNodeName.value]
              ) {
                showLabel(node);
              }
            } else {
              showLabel(node);
            }
          }
        });
      }
    }

    /**
     * The name of a specific node will be visible.
     * @param {object} node The node where the name needs to be visible
     */
    function showLabel(node) {
      ctx.value.globalAlpha = 1;
      ctx.value.font = "bolt 7pt Verdana";
      ctx.value.fillStyle = "black";
      ctx.value.strokeStyle = "white";
      ctx.value.lineWidth = 0.1;
      if (node.name == selectedNodeName.value) {
        ctx.value.fillText(
          node.name,
          node.x + nodeRadius + 6,
          node.y + nodeRadius / 2
        );
        ctx.value.strokeText(
          node.name,
          node.x + nodeRadius + 6,
          node.y + nodeRadius / 2
        );
      } else {
        ctx.value.fillText(
          node.name,
          node.x + nodeRadius + 2,
          node.y + nodeRadius / 2
        );
        ctx.value.strokeText(
          node.name,
          node.x + nodeRadius + 2,
          node.y + nodeRadius / 2
        );
      }
      ctx.value.stroke();
      ctx.value.fill();
    }

    /**
     * Draw the node in the canvas.
     * @param {object} node the node object
     */
    function drawNode(node) {
      ctx.value.beginPath();
      if (node.name == selectedNodeName.value) {
        ctx.value.arc(node.x, node.y, nodeRadius + 3, 0, 2 * Math.PI);
        ctx.value.strokeStyle = "black";
      } else {
        ctx.value.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
        ctx.value.strokeStyle = "white";
      }
      ctx.value.fillStyle = node.color;
      ctx.value.closePath();
      ctx.value.lineWidth = "3";
      ctx.value.stroke();
      ctx.value.fill();
    }

    /**
     * Draw the link in the canvas.
     * @param {object} link the link object
     */
    function drawLine(link) {
      const line = new Path2D();
      let targetX;
      let targetY;
      // ctx.value.globalAlpha = link.globalAlpha;
      let slope = Math.atan2(
        link.target.y - link.source.y,
        link.target.x - link.source.x
      );
      let arrowWidth = 7;
      line.moveTo(link.source.x, link.source.y);
      line.lineTo(link.target.x, link.target.y);
      line.lineWidth = 1.5;
      ctx.value.strokeStyle = link.color;
      ctx.value.stroke(line);
      const arrow = new Path2D();
      if (link.target.name == selectedNodeName.value) {
        targetX = link.target.x - (nodeRadius + 4) * Math.cos(slope);
        targetY = link.target.y - (nodeRadius + 4) * Math.sin(slope);
      } else {
        targetX = link.target.x - (nodeRadius + 1) * Math.cos(slope);
        targetY = link.target.y - (nodeRadius + 1) * Math.sin(slope);
      }
      arrow.moveTo(targetX, targetY);
      arrow.lineTo(
        targetX - arrowWidth * Math.cos(slope - Math.PI / 7),
        targetY - arrowWidth * Math.sin(slope - Math.PI / 7)
      );
      arrow.lineTo(
        targetX - arrowWidth * Math.cos(slope + Math.PI / 7),
        targetY - arrowWidth * Math.sin(slope + Math.PI / 7)
      );
      arrow.closePath();
      ctx.value.fillStyle = link.color;
      ctx.value.globalAlpha = link.globalAlpha;
      ctx.value.stroke(arrow);
      ctx.value.fill(arrow);
    }

    /**
     * Description
     * @param {Array} nodes The array of node objects that exists in the graph.
     * @param {number} x The x value
     * @param {number} y The y value
     * @param {number} radius The node radius
     * @returns {object} The node object if the pointer is on a node, else it will return undefined.
     */
    function findNode(x, y, radius) {
      if (nodes.value.length > 0) {
        const rSq = radius * radius;
        for (const node of nodes.value) {
          const dx = x - node.x,
            dy = y - node.y,
            distSq = dx * dx + dy * dy;
          if (distSq < rSq) {
            return node;
          }
        }
      }
      // No node selected
      return undefined;
    }

    /**
     * When the mouse moves, the position will check wether it hovers over a node.
     * When the mouse hovers a node, a tooltip will pop up with the name of that node.
     * @param {object} event the mouse event
     */
    function mouseMove(event) {
      x = transform.invert(d3.pointer(event))[0];
      y = transform.invert(d3.pointer(event))[1];
      const node = findNode(x, y, nodeRadius);
      if (node) {
        if (!node.hide) {
          if (toggle.value){
            if (
              linkedByIndex[selectedNodeName.value + "," + node.name] ||
              linkedByIndex[node.name + "," + selectedNodeName.value]
            ) {
              d3.select("#tooltip")
              .style("opacity", 0.9)
              .style("top", event.pageY + 10 + "px")
              .style("left", event.pageX + 10 + "px")
              .html(node.name);
            }
          }
          else {
            d3.select("#tooltip")
              .style("opacity", 0.9)
              .style("top", event.pageY + 10 + "px")
              .style("left", event.pageX + 10 + "px")
              .html(node.name);
          }
        }
      } else {
        d3.select("#tooltip").style("opacity", 0);
      }
    }

    /**
     * When clicked in the canvas, it will check whether a node is clicked.
     * If a node is clicked, it will be selected and interactive buttons will be visible.
     */
    function clicked(event) {
      x = transform.invert(d3.pointer(event))[0];
      y = transform.invert(d3.pointer(event))[1];
      const node = findNode(x, y, nodeRadius);
      if (node) {
        if (!node.hide) {
          linkedByIndex[
            selectedNodeName.value + "," + selectedNodeName.value
          ] = 0;
          selectedNode.value = node;
          selectedNodeName.value = node.name;
          linkedByIndex[node.name + "," + node.name] = 1;
          drawUpdate();
        }
      }
    }

    /**
     * Find the node that was clicked, if any, and return it.
     * @param {object} event The dragging event
     */
    function dragSubject(event) {
      const x = transform.invert(d3.pointer(event))[0];
      const y = transform.invert(d3.pointer(event))[1];
      const node = findNode(x, y, nodeRadius);
      if (node) {
        if (!node.hide) {
          node.x = transform.applyX(node.x);
          node.y = transform.applyY(node.y);
          return node;
        }
      }
      // else: No node selected, drag container
    }

    /**
     * Start dragging the node
     * @param {object} event The dragging event
     */
    function dragStart(event) {
      event.subject.x = transform.invertX(event.x);
      event.subject.y = transform.invertY(event.y);
      drawUpdate();
    }

    /**
     * While dragging, the node will follow your pointer.
     * @param {object} event The dragging event
     */
    function dragged(event) {
      event.subject.x = transform.invertX(event.x);
      event.subject.y = transform.invertY(event.y);
      drawUpdate();
    }

    /**
     * When the dragging end the node is released.
     * @param {object} event The dragging event
     */
    function dragStop(event) {
      drawUpdate();
    }

    /**
     * Update the data nodes and links
     * @param {Array} nodes
     * @param {Array} links
     */
    function updateData(newNodes, newLinks) {
      nodes.value = newNodes;
      links.value = newLinks;
    }

    function onResize() {
      let doit;
      clearTimeout(doit);
      width.value = window.innerWidth - 20;
      height.value = window.innerHeight - 200;
      doit = setTimeout(drawUpdate, 100);
    }

    function showConnectedNodes() {
      toggle.value = !toggle.value;
      drawUpdate();
    }

    async function searchConnectedNodes() {
      newData = await dataRequest("/search_connected_nodes/" + selectedNodeName.value);
      console.log(newData.data);
      newNodes = newData.data.nodes;
      newLinks = newData.data.links;

      for (newNode of newNodes) {
        if (!nodesNames.includes(newNode.name)) {
          nodes.value.push(newNode);
          nodesNames.push(newNode["name"]);
          itemColors.value[newNode.legend_group] = newNode.color;
        }
      }
      for (newLink of newLinks) {
        if (!containsObject(newLink, links.value)) {
          links.value.push(newLink);
          // update the nodes that are connected to the selected node
          linkedByIndex[newLink["source"] + "," + newLink["target"]] = 1;
          linkColors.value[newLink["type"]] =
            props.config["link_colors"][newLink["type"]];
        }
      }
      simulation.nodes(nodes.value);
      simulation.force("link").links(links.value);
      simulation.alpha(0.3).restart();
      drawUpdate();
    }

    Vue.onMounted(async function () {
      layersData = await dataRequest("/layers");
      yScale = layersData.data;
      ctx.value = canvas.value.getContext("2d");

      /**
       * Make dragging of nodes possible.
       */
      d3.select(ctx.value.canvas).call(
        d3
          .drag()
          .container(ctx.value.canvas)
          .subject(dragSubject)
          .on("start", dragStart)
          .on("drag", dragged)
          .on("end", dragStop)
      );
      /**
       * Make zooming with mouseweel possible.
       * Disable zooming on double click.
       */
      d3.select(ctx.value.canvas).call(zoom).on("dblclick.zoom", null);

      window.addEventListener("resize", onResize);
      onResize();

      /**
       * When the nodes and links change, the graph will be updated
       * @param {Array} newNodes The new nodes
       * @param {Array} newLinks The new links
       * @returns {Array, Array} The new nodes and links
       */
      Vue.watch([nodes, links], ([newNodes, newLinks]) => {
        selectedNode.value = null
        selectedNodeName.value = ""
        toggle.value = false;
        ctx.value.save();
        ctx.value.clearRect(0, 0, width.value, height.value);
        ctx.value.restore();

        newLinks.forEach(function (l) {
          linkedByIndex[l["source"] + "," + l["target"]] = 1;
        });
        if (props.config["layered"]) {
          simulation
            .nodes(newNodes)
            .force(
              "forceY",
              d3
                .forceY(function (n) {
                  for (group of Object.keys(yScale)) {
                    if (n.layer_group == group) {
                      return yScale[group];
                    }
                  }
                  return height.value / 2;
                })
                .strength(3)
            )
            .force(
              "forceX",
              d3
                .forceX()
                .strength(0.01)
                .x(width.value / 2)
            );
        } else {
          simulation
            .nodes(newNodes)
            .force(
              "forceY",
              d3
                .forceY()
                .strength(0.01)
                .y(height.value / 2)
            )
            .force(
              "forceX",
              d3
                .forceX()
                .strength(0.01)
                .x(width.value / 2)
            );
        }
        simulation.on("tick", drawUpdate);
        simulation.force("link").links(newLinks);
        // simulation.stop();

        simulation.alpha(0.3).restart();
        for (var i = 0; i < 4; ++i) simulation.tick(); // 300
        // simulation.tick(100)
        // drawUpdate();
        // itemColors.value = updateLegendData(newNodes, "group", "item_colors")
        itemColors.value = {};
        for (node of newNodes) {
          itemColors.value[node.legend_group] = node.color;
        }
        linkColors.value = updateLegendData(newLinks, "type", "link_colors");

        nodesNames = nodes.value.map((obj) => obj.name);
        zoomToFit();
      });
    });

    /**
     * Updates the data of the legend corresponding to the new data.
     * @param {Array} newData The new data (nodes or links)
     * @param {string} key The key of that is used of an element of the new data
     * @param {string} configKey The key of the configuration where the colors are specified
     * @returns {Object} The new legend object
     */
    function updateLegendData(newData, key, configKey) {
      var newSet = new Set();
      var newLegend = {};
      for (element in newData) {
        newSet.add(newData[element][key]);
      }
      for (const element of newSet) {
        newLegend[element] = props.config[configKey][element];
      }
      return newLegend;
    }

    Vue.onUnmounted(() => {
      window.removeEventListener("resize", onResize);
      onResize();
    });

    return {
      canvas,
      width,
      height,
      itemColors,
      linkColors,
      zoom,
      ctx,
      nodes,
      links,
      searchNode,
      transform,
      selectedNode,
      selectedNodeName,
      hiddenLinks,
      showInfo,
      info,
      toggle,
      zoomed,
      zoomIn,
      zoomOut,
      zoomToFit,
      drawUpdate,
      clicked,
      updateData,
      mouseMove,
      dragSubject,
      dragStart,
      dragged,
      dragStop,
      updateHiddenGroups,
      updateHiddenLinks,
      showConnectedNodes,
      searchConnectedNodes,
      showLabels,
    };
  }
});
