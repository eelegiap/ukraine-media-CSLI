


function draw(topicID, jsonData) {

  // set the dimensions and margins of the graph
  var margin = { top: 10, right: 30, bottom: 30, left: 40 },
    width = 1000 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

  $('#histogram').empty()
  // append the svg object to the body of the page
  var svg = d3.select("#histogram")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
      "translate(" + margin.left + "," + margin.top + ")");


  var data = jsonData.filter(d => ['russian', 'western'].includes(d.category))
    // .filter(d => d.majorityTopic == topicID)
    .map(function (d) { return { 'type': d.category, 'value': d.fkscore } })
  // console.log(data)
  // X axis: scale and draw:
  var x = d3.scaleLinear()
    .domain([1, 25])     // can use this instead of 1000 to have the max of data: d3.max(data, function(d) { return +d.price })
    .range([0, width]);
  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).ticks(26));

  // set the parameters for the histogram
  var histogram = d3.histogram()
    .value(function (d) { return +d.value; })   // I need to give the vector of value
    .domain(x.domain())  // then the domain of the graphic
    .thresholds(x.ticks(40)); // then the numbers of bins

  // And apply twice this function to data to get the bins.
  var bins1 = histogram(data.filter(function (d) { return d.type === "western" }));
  var bins2 = histogram(data.filter(function (d) { return d.type === "russian" }));

  var westernLength = data.filter(d => d.type == 'western').length
  var russianLength = data.filter(d => d.type == 'russian').length

  var maxHeight = d3.max([d3.max(bins1, function (d) { return d.length / westernLength; }), d3.max(bins2, function (d) { return d.length / russianLength; })])

  // Y axis: scale and draw:
  var y = d3.scaleLinear()
    .range([height, 0]);
  y.domain([0, maxHeight]);   // d3.hist has to be called before the Y axis obviously
  svg.append("g")
    .call(d3.axisLeft(y));


  // append the bars for series 1
  svg.selectAll("rect")
    .data(bins1)
    .enter()
    .append("rect")
    .attr("x", 1)
    .attr("transform", function (d) { return "translate(" + x(d.x0) + "," + y(d.length / westernLength) + ")"; })
    .attr("width", function (d) { return x(d.x1) - x(d.x0) - 1; })
    .attr("height", function (d) { return height - y(d.length / westernLength); })
    .style("fill", "teal")
    .style("opacity", 0.6)

  // append the bars for series 2
  svg.selectAll("rect2")
    .data(bins2)
    .enter()
    .append("rect")
    .attr("x", 1)
    .attr("transform", function (d) { return "translate(" + x(d.x0) + "," + y(d.length / russianLength) + ")"; })
    .attr("width", function (d) { return x(d.x1) - x(d.x0) - 1; })
    .attr("height", function (d) { return height - y(d.length / russianLength); })
    .style("fill", "tomato")
    .style("opacity", 0.6)

  // Handmade legend
  svg.append("circle").attr("cx",width-200).attr("cy",30).attr("r", 6).style("fill", "teal")
  svg.append("circle").attr("cx",width-200).attr("cy",60).attr("r", 6).style("fill", "tomato")
  svg.append("text").attr("x", width-185).attr("y", 35).text("Western Media").style("font-size", "15px").attr("alignment-baseline","middle")
  svg.append("text").attr("x", width-185).attr("y", 65).text("Russian State Media").style("font-size", "15px").attr("alignment-baseline","middle")

}

$(document).ready(function () {
  console.log("ready!");

  // initialize dtopics
  d3.tsv('topics.tsv', function (topicData) {
    d3.select("#topic")
      .selectAll('myOptions')
      .data(topicData.slice(1,))
      .enter()
      .append('option')
      .text(function (d, i) { return d.description; }) // text showed in the menu
      .attr("value", function (d, i) { return i }) // corresponding value returned by the button

    d3.select('#topic').property('value', 14);
  })

  // initialize graph
  d3.json("reading_scores_8-4.json", function (jsonData) {
    draw(14, jsonData)

    // change category
    d3.select('#topic').on('change', function (d) {
      console.log('dropdown changed')
      draw(d3.select(this).node().value, jsonData)
    })
  })

});