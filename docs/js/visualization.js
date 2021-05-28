"use strict";


var container = document.getElementById("method-level");
console.log(`Parent dimensions (WxH) are ${container.clientWidth}x${container.clientHeight}px`)

main();

async function main() {
  const jsonData = await d3.json("./data/args4j.json");  
  var args4jData = processJson(jsonData);

  // Import data
let data = args4jData;

let classes = args4jData.classNames;

console.log({args4jData})
console.log({data})

// Pick a center node for the visualization which will represent the local context.
let centerNode = data.nodes[Math.floor(Math.random() * data.nodes.length)];
console.log(centerNode)

// Visualization configuration


// var width = 500;
// var height = 500; 
var width = container.clientWidth;
var height = container.clientHeight; 


var color = d3.scaleOrdinal()
  .domain(classes)
  .range(d3.schemeSet3);

const svg = d3.select("#method-level")
  .append("svg")
  .attr("width", container.clientWidth)
  .attr("height", container.clientHeight)
  // .attr("viewBox", [0, 0, width, height]);

// const link = svg
//   .selectAll(".link")
//   .data(data.links)
//   .join("line")
//     .classed("link", true);

const node = svg
  .selectAll(".node")
  .data(data.nodes)
  .join("circle")
    .attr("r", 6)
    .attr("fill", d => color(d.class))
    .classed("node", true)
    .classed("fixed", d => d.fx !== undefined);


node
  .on('mouseover', function(e, d) {
    tooltip
      .text(d.name)
      .attr('x', e.x)
      .attr('y', e.y - 50) // Why -50?
  })
  .on('mouseout', function() {
    tooltip.text("")
  });

const tooltip = svg.append('text')
.attr('x', 10)
.attr('y', height - 10);

const simulation = d3
  .forceSimulation()
  .nodes(data.nodes)
  .force("center", d3.forceCenter(width / 2, height / 2))
  // .force("cluster", forceCluster())
  // .force("charge", d3.forceManyBody().strength(-1 ))
  // .force("link", d3.forceLink(data.links))
  .on("tick", tick);

const drag = d3
  .drag()
  .on("start", dragstart)
  .on("drag", dragged);

node.call(drag).on("click", click);

function tick() {
  // link
  //   .attr("x1", d => d.source.x)
  //   .attr("y1", d => d.source.y)
  //   .attr("x2", d => d.target.x)
  //   .attr("y2", d => d.target.y);

  node
    .attr("cx", d => d.x)
    .attr("cy", d => d.y);
}

function forceCluster() {
  //  Credits to https://observablehq.com/@d3/clustered-bubbles

  const strength = 0.2;
  let nodes;

  function force(alpha) {

    const centroids = d3.rollup(nodes, centroid, d => d.class);
    const l = alpha * strength;
    for (const d of nodes) {
      const {x: cx, y: cy} = centroids.get(d.class);
      d.vx -= (d.x - cx) * l;
      d.vy -= (d.y - cy) * l;
    }
  }

  force.initialize = _ => nodes = _;

  return force;
}

function centroid(nodes) {
  let x = 0;
  let y = 0;
  let z = 0;
  for (const d of nodes) {
    let k = d.r ** 2;
    x += d.x * k;
    y += d.y * k;
    z += k;
  }
  return {x: x / z, y: y / z};
}

function click(event, d) {
  delete d.fx;
  delete d.fy;
  d3.select(this).classed("fixed", false);
  simulation.alpha(1).restart();
}

function dragstart() {
  d3.select(this).classed("fixed", true);
}

function dragged(event, d) {
  d.fx = clamp(event.x, 0, width);
  d.fy = clamp(event.y, 0, height);
  simulation.alpha(1).restart();
}

function clamp(x, lo, hi) {
  return x < lo ? lo : x > hi ? hi : x;
}

// Template code from https://observablehq.com/@d3/sticky-force-layout?collection=@d3/d3-force
}

