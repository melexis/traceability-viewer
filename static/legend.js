/**
 * @fileoverview This file will make the legend for the groups and links.
 */

let heightGroups = 40;
let legend = d3.select("#legend").append('svg')
  .attr("width", width)
  .attr("height", heightGroups);

let heightLinks = 40;

let legend_links = d3.select("#legend_links")
  .append('svg')
  .attr("width", width)
  .attr("height", heightLinks);

let color_legend = d3.scaleOrdinal()
  .domain(legend_groups)
  .range(legend_colors);

let color_links = d3.scaleOrdinal()
  .domain(legend_links_labels)
  .range(legend_links_colors);

let legendItemSize = 20;
let legendSpacing = 5;
let yOffset = 10;

let x_color_group = 0;
let y_color_group = yOffset;

// legend for groups
legend.selectAll("legend")
  .data(legend_groups)
  .enter()
  .append("rect")
  .attr('transform', function (d, i) {
    let translate
    if (x_color_group >= Math.min(1000, window.innerWidth - 150)) {
      heightGroups = heightGroups + legendItemSize + legendSpacing;
      d3.select("#legend").select("svg").attr("height", heightGroups);
      x_color_group = 0;
      y_color_group = yOffset + legendItemSize + legendSpacing;
      translate = `translate(${x_color_group}, ${y_color_group})`;
      x_color_group = x_color_group + (d.length * 11) + legendItemSize + legendSpacing;
    }
    else {
      translate = `translate(${x_color_group}, ${y_color_group})`;
      x_color_group = x_color_group + (d.length * 11) + legendItemSize + legendSpacing;
    }
    return translate;
  })
  .attr("width", legendItemSize)
  .attr("height", legendItemSize)
  .attr("cursor", "pointer")
  .attr("group", function (d) {
    return d
  })
  .attr("show", true)
  .style("fill", function (d) {
    return color_legend(d)
  })
  .on('click', function (e, d) {

    let show = legend.select("rect[group='" + d + "']").attr("show");

    if (show === "true") {
      // hide this group
      legend.select("text[group='" + d + "']").attr("fill-opacity", 0.4);
      legend.select("rect[group='" + d + "']").attr("fill-opacity", 0.4).attr("show", false);
      hideNodesOfGroup(d);
    }
    else {
      // show this group
      legend.select("text[group='" + d + "']").attr("fill-opacity", 1);
      legend.select("rect[group='" + d + "']").attr("fill-opacity", 1).attr("show", true);
      showNodesOfGroup(d);
    }
  });

let x_label_group = legendItemSize + legendSpacing;
let y_label_group = yOffset + legendItemSize - 5;

// Add labels to the group colors.
legend.selectAll("legend_labels")
  .data(legend_groups)
  .enter()
  .append("text")
  .style("fill", "black")
  .attr("transform", function (d, i) {
    let translate;
    if (x_label_group - legendSpacing - legendItemSize >= Math.min(1000, window.innerWidth - 200)) {
      y_label_group = y_label_group + legendItemSize + legendSpacing;
      x_label_group = legendItemSize + legendSpacing;
      translate = `translate(${x_label_group}, ${y_label_group})`;
      x_label_group = x_label_group + (d.length * 11) + legendItemSize + legendSpacing;
    }
    else {
      translate = `translate(${x_label_group}, ${y_label_group})`;
      x_label_group = x_label_group + (d.length * 11) + legendItemSize + legendSpacing;
    }
    return translate;
  })
  .attr("group", function (d) {
    return d
  })
  .text(function (d) {
    return d
  })

let x_color = 0;
let y_color = yOffset;
// add color for each link
legend_links.selectAll("links_color")
  .data(legend_links_labels)
  .enter()
  .append("rect")
  .attr('transform', function (d, i) {
    let translate
    if (x_color >= Math.min(1000, window.innerWidth - 200)) {
      heightLinks = heightLinks + legendItemSize + legendSpacing;
      d3.select("#legend_links").select("svg").attr("height", heightLinks);
      // next line
      x_color = 0;
      y_color = y_color + legendItemSize + legendSpacing;
      translate = `translate(${x_color}, ${y_color})`;
      x_color = x_color + (d.length * 11) + legendItemSize + legendSpacing;
    }
    else {
      translate = `translate(${x_color}, ${y_color})`;
      x_color = x_color + (d.length * 11) + legendItemSize + legendSpacing;
    }
    return translate;
  })
  .attr("width", legendItemSize)
  .attr("height", legendItemSize)
  .style("fill", function (d) {
    return color_links(d)
  });

let x_label = legendItemSize + legendSpacing;
let y_label = yOffset + legendItemSize - 5;

// Add legend labels.
legend_links.selectAll("link_labels")
  .data(legend_links_labels)
  .enter()
  .append("text")
  .style("fill", "black")
  .attr("transform", function (d, i) {
    let translate;
    if (x_label - legendSpacing - legendItemSize >= Math.min(1000, window.innerWidth - 200)) {
      y_label = y_label + legendItemSize + legendSpacing;
      x_label = legendItemSize + legendSpacing;
      translate = `translate(${x_label}, ${y_label})`;
      x_label = x_label + (d.length * 11) + legendItemSize + legendSpacing;
    }
    else {
      translate = `translate(${x_label}, ${y_label})`;
      x_label = x_label + (d.length * 11) + legendItemSize + legendSpacing;
    }
    return translate;
  })
  .text(function (d) {
    return d.replace("_", " ")
  })


/**
 * Updates the legend according to the existing nodes and links
 */
function updateLegend() {
  // back to original height
  heightLinks = 40;
  d3.select("#legend_links").select("svg").attr("height", heightLinks);
  legend_links_labels = [];
  legend_links_colors = [];
  x_label = legendItemSize + legendSpacing;
  y_label = yOffset + legendItemSize - 5;
  x_color = 0;
  y_color = yOffset;
  types = Array.from(new Set(graph.links.map(d => d.label)));
  for (let [key, value] of Object.entries(config["link_colors"])) {
    if (types.includes(key) && filtered_links.includes(key)) {
      legend_links_labels.push(key);
      legend_links_colors.push(value);
    }
  }
  color_links = d3.scaleOrdinal()
    .domain(legend_links_labels)
    .range(legend_links_colors);

  d3.select("#legend_links").select("svg").remove();
  for (let prop in legend_links) delete legend_links[prop];

  legend_links = d3.select("#legend_links").attr("width", 400)
    .append('svg')
    .attr("height", 40)
    .attr("width", "1300")
    .attr("viewBox", "0 0 1300 40")
    .style("overflow-x", "scroll");

  legend_links.selectAll("links_color")
    .data(legend_links_labels)
    .enter()
    .append("rect")
    .attr('transform', function (d, i) {
      let translate
      if (x_color >= Math.min(1000, window.innerWidth - 200)) {
        heightLinks = heightLinks + legendItemSize + legendSpacing;
        d3.select("#legend_links").select("svg").attr("height", heightLinks);
        // next line
        x_color = 0;
        y_color = y_color + legendItemSize + legendSpacing;
        translate = `translate(${x_color}, ${y_color})`;
        x_color = x_color + (d.length * 11) + legendItemSize + legendSpacing;
      }
      else {
        translate = `translate(${x_color}, ${y_color})`;
        x_color = x_color + (d.length * 11) + legendItemSize + legendSpacing;
      }
      return translate;
    })
    .attr("width", legendItemSize)
    .attr("height", legendItemSize)
    .style("fill", function (d) {
      return color_links(d)
    });

  // Add one dot in the legend for each name.
  legend_links.selectAll("link_labels")
    .data(legend_links_labels)
    .enter()
    .append("text")
    .style("fill", "black")
    .attr("transform", function (d, i) {
      let translate;
      if (x_label - legendSpacing - legendItemSize >= Math.min(1000, window.innerWidth - 200)) {
        y_label = y_label + legendItemSize + legendSpacing;
        x_label = legendItemSize + legendSpacing;
        translate = `translate(${x_label}, ${y_label})`;
        x_label = x_label + (d.length * 11) + legendItemSize + legendSpacing;
      }
      else {
        translate = `translate(${x_label}, ${y_label})`;
        x_label = x_label + (d.length * 11) + legendItemSize + legendSpacing;
      }
      return translate;
    })
    .text(function (d) {
      return d.replace("_", " ")
    })
}
