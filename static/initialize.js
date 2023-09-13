/**
 * @fileoverview This file contains variables that are needed for the traceablility vieuwer.
 */

let path = window.location.pathname;
let page = path.split("/").pop().split(".")[0];
console.log(page);

let width = window.innerWidth - 20;
let height = window.innerHeight - 120;
let filtered_links = ["impacts_on", "fulfilled_by", "validates", "configurable_by", "realized_by", "passed_by",
 "guaranteed_by", "ext_polarion_reference", "test_setup_used", "is_attribute_of"];

let legend_groups = [];
let legend_colours = [];
let legend_links_colours = []
let legend_links_labels = [];

let types = Array.from(new Set(graph.links.map(d => d.label)));

const URI = "bolt://localhost:7687";
let driver;

try {
    driver = neo4j.driver(URI);  // with password: neo4j.auth.basic(USER, PASSWORD)
    driver.verifyConnectivity();
    console.log('Connection established');
  } catch(err) {
    alert(`Connection error\n${err}\nCause: ${err.cause}`)
    driver.close();
  }

for (let [key,value] of Object.entries(config["group_colours"])){
    legend_groups.push(key);
    legend_colours.push(value);
}

legend_groups.push("Others");
legend_colours.push("#000000");

// for (let [key,value] of Object.entries(config["link_colours"])){
//   if (types.includes(key) && filtered_links.includes(key)){
//     legend_links_labels.push(key);
//     legend_links_colours.push(value);
//   }
// }
console.log(graph.nodes);
console.log(graph.links);
types = Array.from(new Set(graph.links.map(d => d.label)));
console.log(types);
for (let [key,value] of Object.entries(config["link_colours"])){
  if (types.includes(key) && filtered_links.includes(key)){
    legend_links_labels.push(key);
    legend_links_colours.push(value);
  }
}

let nodeRadius = 6;
let filter_groups = [].concat(config["filters"]);
filter_groups.unshift("all_items"); // adds elements to the beginning of an array
let node_selected = false;
let selectedNodeID;
let closeNode;
let toggle = false;
let linkedByIndex = {};
d3.select("#text").property("checked", false);
d3.select("#blackToggle").property("checked", true);

let graphCanvas = d3.select('#graphviz').append('canvas')
    .classed("mainCanvas", true)
    .attr('width', width + 'px')
    .attr('height', height + 'px')
    .attr('id', "canvas");
let canvas = document.querySelector("canvas");

function Node(id, name, colour, group){
  this.id = id;
  this.name = name;
  this.colour = colour;
  this.group = group;
}

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
