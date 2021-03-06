var d3 = d3 || alert("d3 ist not loaded, thus you are doomed to fail...");

window.onorientationchange = function () { window.location.reload(); };
window.onresize = function () { window.location.reload(); };

var log = {
  DEBUG: true,
  debug: function (d) {if (this.DEBUG) { console.log(d)} }
}

function plotFairShares (error, data) {

  var settings = {
  	width: document.innerWidth || document.documentElement.clientWidth || document.getElementsByTagName('body')[0].clientWidth || 900,
  	height: 350
  }

  var
  margin = {top: 10, right: 50, bottom: 30, left: 20},
  width = settings.width - margin.left - margin.right,
  height = settings.height  - margin.top - margin.bottom;

  // plotting the canvas
  var svg = plotCanvas(width, height, margin, "#chartId");
  log.debug (">>> ",svg)

  var x = d3.scaleTime().range([0, width]),
  y = d3.scaleLinear().range([height, 0]),
  z = d3.scaleOrdinal(d3.schemeCategory20b);

  var stack = d3.stack();

  var area = d3.area()
  .x(function(d, i) { return x(d.data.date); })
  .y0(function(d) {  return y(d[0]/100) || 0; })
  .y1(function(d) {  return y(d[1]/100) || 0; });

  var g = svg.append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  if (error) throw error;
  data = normalizeData (data);

  var keys = Object.keys(data[0]);

  x.domain(d3.extent(data, function(d) { return d.date; }));
  z.domain(keys);
  stack.keys(keys.slice(1)) // get rid of the first "date" column

  var layer = g.selectAll(".layer")
  .data(stack(data))
  .enter().append("g")
  .attr("class", "layer");

  layer.append("path")
  .attr("class", "area")
  .style("fill", function(d) { return z(d.key); })
  .attr("opacity", "1")
  .attr("d", area);

  // handle mouse and touch events
  layer.on("mousemove"||"touchstart"||"touchmove", function (d) { plotLine(x, y, height, width, layer, d, margin)} );
  layer.call( function (d) { plotLine(x, y, height, width, layer, d, margin)} );

  g.append("g")
  .attr("class", "axis axis--x")
  .attr("transform", "translate(0," + height + ")")
  .call(d3.axisBottom(x));

  g.append("g")
  .attr("class", "axis axis--y")
  .call(d3.axisLeft(y).ticks(10, "%"));
}


// take care for years, where not all the stakeholders in the data appear,
// i.e. Ralfs leaving or Katjas later entry...
function normalizeData (data) {
  newData = [];
  keys = [];
  for (i in data) {
    var row = data[i];
    Object.keys(row).map (function (key) {
      if (keys.indexOf (key) == -1) {
        keys.push(key);
      }
    })
  }
  // now I have all possible keys
  for (i in data) {
    newData[i] = {};
    for (key in keys) {
      newData[i][keys[key]] = data [i][keys[key]] || 0;
    }
  }
  return newData;
}


function plotLine(x, y, height, width, chart, d, margin) {
  //
  // draw a red crosshair at the mouse position
  //
  if (d3.event && d3.mouse(d3.event.currentTarget) ) {
    var mx = d3.mouse(d3.event.currentTarget)[0] ;
    var my = d3.mouse(d3.event.currentTarget)[1]  ;
  } else {
    var mx = width;
    var my = 0;
  }
  getXind = function  (x, width,  intervals) { return Math.trunc(x*(intervals-1)/(width) ); }

  chart.selectAll(".indexLine")
  .remove();

  chart.append("path").attr("class", "indexLine").attr("stroke", "white")
  .attr("d", "M " + (mx) + "," + 0 + ",L " + (mx) + "," + (my ) + " Z");
  chart.append("path").attr("class", "indexLine").attr("stroke", "white")
  .attr("d", "M " + (mx) + "," + height + ",L " + (mx) + "," + (my ) + " Z");

  chart.filter(function(d) { return d[getXind (mx, width, d.length)][1] - d[getXind (mx, width, d.length)][0] > 0.01; })
  .append("text")
  .attr("class", "indexLine")
  .text( function (d) {
    return d.key+": "
    +Math.round(10*(d[getXind (mx+20, width, d.length)][1]-d[getXind (mx+20, width, d.length)][0]))/10 + "%";
  })
  .attr("x", mx - 2)
  .attr("y", function(d) { return y((d[getXind (mx, width, d.length)][0] + d[getXind (mx, width, d.length)][1]) / 200); })
  .attr("dy", ".75em")
  .attr("fill", "white")
  .attr("text-anchor", "end")
  .style("font", "12px sans-serif");

  chart.append("text")
  .attr("class", "indexLine")
  .attr("x", mx + 2)
  .attr("y", height-2)
  .attr("fill", "white")
  .text( x.invert(mx ).getFullYear() + "-" +  (x.invert(mx ).getMonth()+1) ) ;
}

function plotCanvas(width, height, margin, targetDiv) {
  var targetDiv = targetDiv || "body";
	log.debug("defining svg canvas...");
  d3.select(targetDiv).selectAll("svg").remove();
	var svg = d3.select(targetDiv).append("svg")
		.attr("class", "chart")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	return svg;
}
