/**
 * @fileoverview This file contains variables that are needed for the traceability viewer.
 * These variables will be used in the other js files.
 */

// path to the html file that is in use
let path = window.location.pathname;
// get which page is used (it is equal to the filter button)
let page = path.split("/").pop().split(".")[0];
console.log(page);

// variables for the width and height
let width = window.innerWidth - 20;
let height = window.innerHeight - 120;

// the links that will be visible
let filtered_links = ["impacts_on", "fulfilled_by", "validates", "configurable_by", "realized_by", "passed_by",
 "guaranteed_by", "ext_polarion_reference", "test_setup_used", "is_attribute_of"];

// variables for the legend
let legend_groups = [];
let legend_colours = [];
let legend_links_colours = []
let legend_links_labels = [];

// The group and corresponding colors for the legend
for (let [key,value] of Object.entries(config["group_colours"])){
  legend_groups.push(key);
  legend_colours.push(value);
}

// Nodes that are not grouped to one of the groups in group_colors of the config file are grouped as "Others"
// and get a black color
legend_groups.push("Others");
legend_colours.push("#000000");

// the types of links
let types = Array.from(new Set(graph.links.map(d => d.label)));

// uri of the neo4j database
const URI = "bolt://localhost:7687";
let driver;

// check is the connections is established
try {
    driver = neo4j.driver(URI);  // with password: neo4j.auth.basic(USER, PASSWORD)
    driver.verifyConnectivity();
    console.log('Connection established');
  } catch(err) {
    alert(`Connection error\n${err}\nCause: ${err.cause}`)
    driver.close();
  }

// The link types with the corresponding colors for the legend
for (let [key,value] of Object.entries(config["link_colours"])){
  if (types.includes(key) && filtered_links.includes(key)){
    legend_links_labels.push(key);
    legend_links_colours.push(value);
  }
}

// The radius of a normal node
let nodeRadius = 6;

// the filters
let filter_groups = [].concat(config["filters"]);

// adds all_items to the beginning of filter_groups
filter_groups.unshift("all_items");

// if node is selected of not
let node_selected = false;

// the ID of the selected node
let selectedNodeID;

// toggle for showing connected nodes
let toggle = false;

// used for finding connecting nodes
let linkedByIndex = {};

// the labels of nodes are not visible in the beginning
d3.select("#text").property("checked", false);

// make the canvas
let graphCanvas = d3.select('#graphviz').append('canvas')
    .classed("mainCanvas", true)
    .attr('width', width + 'px')
    .attr('height', height + 'px')
    .attr('id', "canvas");

// the canvas
let canvas = document.querySelector("canvas");

// the buttons for filtering
d3.select("#buttons")
        .selectAll("button")
        .data(filter_groups)
        .enter()
        .append("button")
        .html(function(d) {let string = "<a class='button' href='" + d + ".html'>" + d + "</a>";
        return string;})
        .attr("type", "button")
        .attr("name", function(d) {return d;})
        .attr("id", function(d) {return d;})
        .attr("value", function(d) {return d;})
        .style("background-color", function(d){
          if (config["group_colours"].hasOwnProperty(d)){
            return config["group_colours"][d];
          }
          else {
            return "#c2c2c2";
          }
        })
        .style("border-radius", "4px")
        .style("border", function(d) {
          if (d == page){
            return "2px solid #000000"
          }
          else {
            return "2px solid #ffffff"
          }
        });
