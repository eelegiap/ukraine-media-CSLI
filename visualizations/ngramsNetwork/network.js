// https://github.com/d3/d3-scale-chromatic#schemeRdBu
// https://d3-legend-v3.susielu.com/#size

function draw(category) {

    d3.selectAll('svg').remove()

    var width = screen.width,
        height = screen.height * 1.25;

    var color = d3.scale.category20();
    var origLinkOpacity = .75
    var force = d3.layout.force()
        .charge(-20)
        .linkDistance(150)
        .size([width, height]);

    var x = d3.scale.linear()
        .domain([0, 500])
        .range([500, 100])
        .clamp(true);

    var brush = d3.svg.brush()
        .y(x)
        .extent([0, 0]);

    var svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height);

    var links_g = svg.append("g");

    var nodes_g = svg.append("g");

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(" + (width - 200) + ",0)")
        .call(d3.svg.axis()
            .scale(x)
            .orient("left")
            .tickFormat(function (d) { return d; })
            .tickSize(3)
            .tickPadding(12))
        .select(".domain")
        .select(function () { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "halo");

    var slider = svg.append("g")
        .attr("class", "slider")
        .call(brush);

    slider.selectAll(".extent,.resize")
        .remove();

    var handle = slider.append("circle")
        .attr("class", "handle")
        .attr("transform", "translate(" + (width - 200) + ",0)")
        .attr("r", 5);

    svg.append("text")
        .attr("x", width - 195)
        .attr("y", 60)
        .attr("text-anchor", "end")
        .style("opacity", 1)
        .text("co-occurrence threshold")
    svg.append('text')
        .attr("x", width - 195)
        .attr("y", 80)
        .attr("text-anchor", "end")
        .style("opacity", 0.75)
        .text("(# of windows of co-occurrence)")


    var n = 5;
    d3.select('#n').text(n)
    console.log('category',category)
    console.log('n',n)
    
    d3.json(`${category}ngramNet${n}_8-4_w_polarity.json`, function (error, graph) {
        if (error) throw error;

        graph.links.forEach(function (d, i) { d.i = i; });

        function brushed() {
            var value = brush.extent()[0];

            if (d3.event.sourceEvent) {
                value = x.invert(d3.mouse(this)[1]);
                brush.extent([value, value]);
            }
            handle.attr("cy", x(value));
            var threshold = value;

            var thresholded_links = graph.links.filter(function (d) { return (d.value > threshold); });

            force
                .links(thresholded_links);

            var link = links_g.selectAll(".link")
                .data(thresholded_links, function (d) { return d.i; });

            const posPolarity = d3.scale.pow().exponent(.3).domain([0, 1]).range(["#777", "green"])
            const negPolarity = d3.scale.pow().exponent(.3).domain([-1, 0]).range(["tomato", "#777"])
            // 
            svg.append('text')
                .attr('x',25)
                .attr('y',37)
                .style("opacity", 0.75)
                .text('Polarity (-1 to 1)')
            var greenLegend = d3.legend.color()
                .labelFormat(d3.format(".0f"))
                .scale(posPolarity)
                .cells([0,.001,.005, .01,.05,.1,1])
                .shapePadding(8)
                .shapeWidth(25)
                .shapeHeight(20)
                .labelOffset(12)
                .orient('horizontal')
            svg.append("g")
                .attr("transform", `translate(${348}, ${25})`)
                .call(greenLegend);
            
            var redLegend = d3.legend.color()
                .labelFormat(d3.format(".0f"))
                .scale(negPolarity)
                .cells([-1,-.1,-.05,-.01,-.005,-.001,0])
                .shapePadding(8)
                .shapeWidth(25)
                .shapeHeight(20)
                .labelOffset(12)
                .orient('horizontal')
            svg.append("g")
                .attr("transform", `translate(${150}, ${25})`)
                .call(redLegend);


            function linkColor(polarity) {
                if (polarity > 0) {
                    return posPolarity(polarity)
                } else if (polarity < 0) {
                    return negPolarity(polarity)
                } else {
                    return "#777"
                }
            }
            function strokeSize(val) {
                return Math.sqrt(Math.sqrt(val))
            }
            link.enter().append("line")
                .attr("class", "link")
                .style('stroke', d => linkColor(+d.polarityScore))
                .style('stroke-opacity', origLinkOpacity)
                .style("stroke-width", function (d) { return 5 });
                // .style("stroke-width", function (d) { return d.value });

            // var lineSize = d3.scale.linear().domain([0,10]).range([2, 10]);
            // svg.append('text')
            // .attr('x',550)
            // .attr('y',30)
            // .text('Stroke')
            // svg.append("g")
            //     .attr("class", "legendSizeLine")
            //     .attr("transform", "translate(600, 30)");
            
            // var legendSizeLine = d3.legend.size()
            //         .scale(lineSize)
            //         .shape("line")
            //         .orient("horizontal")
            //         //otherwise labels would have displayed:
            //         // 0, 2.5, 5, 10
            //         .labels(["tiny", "small", "medium", "large", "grand"])
            //         .shapeWidth(40)
            //         .labelAlign("start")
            //         .shapePadding(10);
            
            // svg.select(".legendSizeLine")
            //     .call(legendSizeLine);
                       

            link.exit().remove();

            force.on("tick", function () {
                link.attr("x1", function (d) { return d.source.x; })
                    .attr("y1", function (d) { return d.source.y; })
                    .attr("x2", function (d) { return d.target.x; })
                    .attr("y2", function (d) { return d.target.y; });

                node.attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });
                // .attr("cx", function (d) { return d.x; })
                // .attr("cy", function (d) { return d.y; });
            });
            force.start();

            // get thresholded nodes
            var validIDs = []
            thresholded_links.forEach(function (tl) {
                var sourceID = tl.source.id
                var targetID = tl.target.id
                validIDs.push(sourceID)
                validIDs.push(targetID)
            })
            // go through all nodes, remove if not connected to thresholded link
            d3.selectAll('.node').each(function (n) {
                var thisNode = d3.select(this)
                var nodeID = thisNode.attr('id')
                if (!validIDs.includes(nodeID)) {

                    thisNode.transition(200).style('opacity', 0)
                    thisNode.classed('hide', true)
                } else {
                    thisNode.transition(200).style('opacity', 1)
                    thisNode.transition(250).style('pointer-events', 'all')
                    thisNode.classed('hide', false)
                }
            })
        }

        force
            .nodes(graph.nodes);

        var node = nodes_g.selectAll(".node")
            .data(graph.nodes)
            .enter()
            .append("g")
            .attr("class", "node")
            .attr('id', d => d.id)
            .each(function (d) {
                d3.select(this)
                    .append("circle")
                    .attr("r", function (d) {
                        return 8;
                        return Math.log(d.occurrences)
                    })
                    .style("fill", function (d) {
                        return '#777'
                    }).style('opacity', 1)
                d3.select(this)
                    .append("text").text(d.id)
                    .attr("dy", 5 + 10)
                    .style("text-anchor", "middle");
            })
            .call(force.drag);

        d3.selectAll('.node').on('mouseover', function (d, i) {
            var nodeID = d.id
            var connectedIDs = new Set()
            connectedIDs.add(nodeID)
            // highlight/unhighlight links
            d3.selectAll('.link').each(function (l) {
                var thisLink = d3.select(this)
                var sourceID = l.source.id
                var targetID = l.target.id
                if (nodeID == sourceID || nodeID == targetID) {
                    thisLink.transition().style('stroke-opacity', origLinkOpacity)
                    connectedIDs.add(sourceID)
                    connectedIDs.add(targetID)
                } else {
                    thisLink.transition().style('stroke-opacity', .1)
                }
            })
            // highlight/unhighlight circle and text
            d3.selectAll('.node').each(function () {
                var thisNode = d3.select(this)
                var thisNodeID = d3.select(this).attr('id')
                var thisNodeClasses = thisNode.attr('class')
                if (connectedIDs.has(thisNodeID)) {
                    if (!thisNodeClasses.includes('hide')) {
                        thisNode.transition().style('opacity', 1)
                    }
                } else {
                    thisNode.transition().style('opacity', .1)
                }
            })
        }).on('mouseout', function () {
            d3.selectAll('.link').transition().style('stroke-opacity', origLinkOpacity)
            d3.selectAll('.node').transition().style('opacity', 1)
        })


        brush.on("brush", brushed);

        slider
            .call(brush.extent([100, 100]))
            .call(brush.event);
    });
}

$(document).ready(function () {
    console.log("ready!");
    // initialize graph
    draw('western')

    // change category
    d3.select('#category').on('change', function (d) {
        console.log('dropdown changed')
        draw(d3.select(this).node().value)
    })
    // $('#toggle').change(function () {
    //     console.log($(this).prop('checked'))
    //     if ($(this).prop('checked')) {
    //         draw('notPEN')
    //     } else {
    //         draw('PEN')
    //     }
    // })
});