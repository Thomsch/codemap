"use strict";

function visualizeHierachy(container, hierarchy) {
  const width = container.node().clientWidth;
  const height = container.node().clientHeight;
  const centerX = width / 2;
  const centerY = height / 2;

  let root = d3.stratify()
    .id(function(d) { return d.name; })
    .parentId(function(d) { return d.parent; })
    (hierarchy);

  const svg = d3.select(`#${containerId}`).append("svg");
}

function visualizeMethods(container, data, classes) {
  const width = container.node().clientWidth;
  const height = container.node().clientHeight;
  const centerX = width / 2;
  const centerY = height / 2;

  let centerNodeIndex = Math.floor(Math.random() * data.nodes.length)
  let centerNode = data.nodes[centerNodeIndex];
  centerNode.fx = centerX;
  centerNode.fy = centerY;

  var color = d3.scaleOrdinal()
    .domain(classes)
    .range(d3.schemeSet3);

  const svg = container
    .append("svg")
    .attr("width", width)
    .attr("height", height);

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
    .classed("center", d => d.id === centerNode.id)
    .classed("fixed", d => d.fx !== undefined);

  const centerNodeSelection = svg.select(".center")
    .classed("fixed", true)
    .attr("r", 20);

  const tooltip = svg.append('text')
  .attr('x', 10)
  .attr('y', height - 10);

  const simulation = d3
    .forceSimulation()
    .nodes(data.nodes)
    .force("charge", d3.forceManyBody().strength((d,i) => i === centerNodeIndex ? -300 : -30))
    .force("center", d3.forceCenter(centerX, centerY))
    .force("link", d3.forceLink(data.links))
    .on("tick", tick);

    node.on('mouseover', function(e, d) {
      tooltip.text(d.name)
    })
    .on('mouseout', function() {
      tooltip.text("")
    });

  const drag = d3
    .drag()
    .on("start", dragstart)
    .on("drag", dragged);

  node.filter(d => d.id != centerNode.id).call(drag).on("click", click);

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
    d.fx = event.x;
    d.fy = event.y;
    simulation.alpha(1).restart();
  }
}

// References
// https://observablehq.com/@d3/sticky-force-layout?collection=@d3/d3-force