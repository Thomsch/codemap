"use strict";

function visualizeHierachy(container, legend, hierarchy, classes) {
  const width = container.node().clientWidth;
  const height = container.node().clientHeight;
  const accentColor = "aquamarine"

  let currentClassName = classes[Math.floor(Math.random() * classes.length)]

  let data = d3.stratify()
    .id(function(d) { return d.name; })
    .parentId(function(d) { return d.parent; })
    (hierarchy);

  var depthColor = d3.scaleSequential()
    .domain([0, data.height])
    .range([0.0, 0.5]);

  var borderScale = d3.scaleSequential()
    .domain([data.height, 0])
    .range([1,5]);

  // Using a linear scale for the font size causes performance issues when zooming.
  // let fontScale = d3.scaleLinear().domain([0, 1]).range([9, 20]).clamp(true);
  
  var seededGenerator = new Math.seedrandom(data);
  
  var voronoiTreemap = d3.voronoiTreemap()
    .clip([
      [0, 0],
      [0, height],
      [width, height],
      [width, 0],
    ])
    .prng(seededGenerator);

  var hierarchy = d3.hierarchy(data).sum(function(d){ return d.data.weight; });
  voronoiTreemap(hierarchy); // compute tesselation.
  
  var svg = container
    .append("svg")
    .attr("width", width)
    .attr("height", height);
    
  var drawingArea = svg.append("g")
    .classed("drawingArea", true);
    
  var treemapContainer = drawingArea.append("g")
    .classed("treemap-container", true);

  const legendWidth = legend.node().clientWidth;
  const legendHeight = legend.node().clientHeight;

  const classLegend = legend.append("div")
  const packageLegend = legend.append("div")

  classLegend.append("div")
    .style("display", "inline")
    .append("b")
    .text("Class: ")

  const classTooltip = classLegend.append("div")
    .style("display", "inline")
    .text("Hover on a class to obtain details about it.")

  packageLegend.append("div")
    .style("display", "inline")
    .append("b")
    .text("Package: ")

  const packageTooltip = packageLegend.append("div")
    .style("display", "inline")

  drawingArea.call(d3.zoom()
    .scaleExtent([1, 8])
    .translateExtent([[0, 0], [width, height]])
    .on("zoom", zoomed));

  drawTreemap(hierarchy);
  
  function zoomed({transform}) {
    drawingArea.attr("transform", transform);
  }

  function drawTreemap(hierarchy) {
    var leaves = hierarchy.leaves();
    let nodes = hierarchy.descendants();
    
    var cells = treemapContainer.append("g")
      .classed('cells', true)
      .selectAll(".cell")
      .data(leaves)
      .join("path")
      .classed("cell", true)
      .classed("current", d => d.data.data.name === currentClassName)
      .attr('d',  d => d3.line()(d.polygon) + 'z')
      .style("fill", function(d){
        if(d.data.data.name === currentClassName) {
          return accentColor
        } else {
          return d3.interpolateGreys(depthColor(d.depth));
        }
      })
      ;

    let packages = treemapContainer.append("g")
      .selectAll(".package")
      .data(nodes)
      .join("path")
      .filter((d) => {
        return d.depth > 0 && 'children' in d;
      })
      .attr("d", d => d3.line()(d.polygon) + "z")
      .attr("stroke-width", d => borderScale(d.depth)) // Dynamic depth
      .classed("package", true)
    
    var labels = treemapContainer.append("g")
      .classed('labels', true)
      .selectAll(".label")
      .data(leaves)
      .join("g")
          .classed("label", true)
          .attr("transform", function(d){
            return "translate("+[d.polygon.site.x, d.polygon.site.y]+")";
          })
          .style("font-size", function(d){ 
            if(d.data.data.weight < 0.3){
              return 4;
            } else if(d.data.data.weight < 0.6){
              return 6;
            } else {
              return 8;
            }
           });
    
    labels.append("text")
      .classed("name", true)
      .html(function(d){
        return d.data.data.code;
      });
    
    var hoverers = treemapContainer.append("g")
      .classed('hoverers', true)
      .selectAll(".hoverer")
      .data(leaves)
      .join("path")
          .classed("hoverer", true)
          .classed("current", d => d.data.data.name === currentClassName)
          .attr("d", d => d3.line()(d.polygon) + "z");

    hoverers.on('mouseover', function(e, d) {
      const {code, parent} = d.data.data
      classTooltip.text(code)
      packageTooltip.text(parent)
    })
    .on('mouseout', function() {
      classTooltip.text("")
      packageTooltip.text("")
    });
  }

  function drawLegend(legend) {

  }
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
      tooltip.text(d.id)
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