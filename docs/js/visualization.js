"use strict";


var container = document.getElementById("method-level");
console.log(`Parent dimensions (WxH) are ${container.clientWidth}x${container.clientHeight}px`)

main();

async function main() {
  const jsonData = await d3.json("./data/args4j.json");  
  let classes = jsonData.classNames
  let data = processMethodData(jsonData);
  // let data = sampleData;

  console.log({data})

  // Pick a center node for the visualization which will represent the local context.
  let centerNodeIndex = Math.floor(Math.random() * data.nodes.length)
  let centerNodeId = data.nodes[centerNodeIndex];

  var width = container.clientWidth;
  var height = container.clientHeight; 
  var width = 2000;
  var height = 2000; 


  var color = d3.scaleOrdinal()
    .domain(classes)
    .range(d3.schemeSet3);

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
    .attr("r", 6)
    .attr("fill", d => color(d.class))
    .classed("node", true)
    .classed("fixed", d => d.fx !== undefined);

    const centerNode = node
    .filter(function(d) {
      return d.id === centerNodeId.id})
    .classed("fixed", true)
    .attr("x", 0)
    .attr("y", 0)
    .attr("r", 20);

  const tooltip = svg.append('text')
  .attr('x', 10)
  .attr('y', height - 10);

  const simulation = d3
    .forceSimulation()
    .nodes(data.nodes)
    // .force("charge", d3.forceManyBody())
    .force("charge", d3.forceManyBody().strength((d,i) => i === centerNodeIndex ? -500 : -10))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("link", d3.forceLink(data.links))
    .on("tick", tick);

    node.on('mouseover', function(e, d) {
      tooltip
        .text(d.name)
    })
    .on('mouseout', function() {
      tooltip.text("")
    });

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
    // simulation.alpha(1).restart();
  }

  function clamp(x, lo, hi) {
    return x < lo ? lo : x > hi ? hi : x;
  }
}

// Template code from https://observablehq.com/@d3/sticky-force-layout?collection=@d3/d3-force