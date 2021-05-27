// Import data
let data = sampleData;

console.log({data})

// Visualization configuration

var accent = d3.scaleSequential(d3.schemeAccent);

console.log(accent(1))
console.log(accent)
var container = document.getElementById("method-level");
console.log(`Parent dimensions (WxH) are ${container.clientWidth}x${container.clientHeight}px`)

var width = 500;
var height = 500; 

const svg = d3.select("#method-level")
  .append("svg")
  .attr("width", container.clientWidth)
  .attr("height", container.clientHeight)
  .attr("viewBox", [0, 0, width, height]);

const link = svg
  .selectAll(".link")
  .data(data.links)
  .join("line")
  .classed("link", true);

const node = svg
  .selectAll(".node")
  .data(data.nodes)
  .join("circle")
  .attr("r", 12)
  // .attr("fill", d => 'red')
  .classed("node", true)
. classed("fixed", d => d.fx !== undefined);

const simulation = d3
  .forceSimulation()
  .nodes(data.nodes)
  .force("charge", d3.forceManyBody())
  .force("center", d3.forceCenter(width / 2, height / 2))
  .force("link", d3.forceLink(data.links))
  .on("tick", tick);

const drag = d3
  .drag()
  .on("start", dragstart)
  .on("drag", dragged);

node.call(drag).on("click", click);

function tick() {
  link
    .attr("x1", d => d.source.x)
    .attr("y1", d => d.source.y)
    .attr("x2", d => d.target.x)
    .attr("y2", d => d.target.y);

  node
    .attr("cx", d => d.x)
    .attr("cy", d => d.y);
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