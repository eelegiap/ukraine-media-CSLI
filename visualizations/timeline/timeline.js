// https://bl.ocks.org/larsenmtl/e3b8b7c2ca4787f77d78f58d41c3da91
function draw(separated, topicsOfInterest, topicData) {
    var freq_bool = true
    var checkboxes = d3.selectAll('#checkboxDiv input')

    checkboxes.each(function (d, i) {
        if (d3.select(this).property('checked')) {
            topicsOfInterest.push(i)
        }
    })
    topicsOfInterest.sort(function(a, b) {
        return a - b;
      });      

    var margin = {
        top: 20,
        right: 200,
        bottom: 30,
        left: 50
    },
        width = $('#timelineParent').width() - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom;

    var parseDate = d3.time.format("%Y%m%d").parse;

    var x = d3.time.scale()
        .range([0, width]);

    var y = d3.scale.linear()
        .range([height, 0]);

    var color;
    if (separated) {
        color = d3.scale.category20();
    } else {
        color = d3.scale.category10();
    }


    // time stuff
    var ticks = [
    // '20211001',
    '20211016',
    '20211101',
    '20211116',
    '20211201',
    '20211216',
    '20220101',
    '20220116',
    '20220201',
    '20220216']
    var formattedTicks = ticks.map(d => parseDate(d))
    var formatDate = d3.time.format("%b-%e-%y")

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .tickValues(formattedTicks)
        .tickFormat(formatDate)
        

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .tickFormat(yAxisFormat(freq_bool))

    var line = d3.svg.line()
        // .interpolate("basis")
        .x(function (d) {
            return x(d.date);
        })
        .y(function (d) {
            return y(d.temperature);
        });

    $('#timeline').empty()

    var svg = d3.select("#timeline").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    d3.json('freq_data_8-3.json', function (jsonData) {
        jsonData = jsonData.slice(1,)
        var freq_str = ''
        if (freq_bool) {
            freq_str = 'freq_'
        }
        var data = jsonData.map(function (d) {
            var datumObj = Object()
            datumObj['date'] = d.date;
            topicsOfInterest.map(function (t) {
                // datumObj[topicData[t+1].description] = d[`topic_${t}`]
                if (separated) {
                    datumObj[`${topicData[t + 1].description} (Russian)`] = d[`russian_${freq_str}topic_${t}`]
                    datumObj[`${topicData[t + 1].description} (Western)`] = d[`western_${freq_str}topic_${t}`]
                } else {
                    datumObj[`${topicData[t + 1].description} (Both)`] = d[`total_${freq_str}topic_${t}`]
                }
            })
            return datumObj
        })

        color.domain(d3.keys(data[0]).filter(function (key) {
            return key !== "date";
        }));

        data.forEach(function (d) {
            d.date = parseDate(d.date);
        });

        var cities = color.domain().map(function (name) {
            return {
                name: name,
                values: data.map(function (d) {
                    return {
                        date: d.date,
                        temperature: +d[name]
                    };
                })
            };
        });

        x.domain(d3.extent(data, function (d) {
            return d.date;
        }));

        y.domain([
            d3.min(cities, function (c) {
                return d3.min(c.values, function (v) {
                    return v.temperature;
                });
            }),
            d3.max(cities, function (c) {
                return d3.max(c.values, function (v) {
                    return v.temperature;
                });
            })
        ]);

        var legend = svg.selectAll('g')
            .data(cities)
            .enter()
            .append('g')
            .attr('class', 'legend');

        legend.append('rect')
            .attr('x', 50)
            .attr('y', function (d, i) {
                return i * 20;
            })
            .attr('width', 10)
            .attr('height', 10)
            .style('fill', function (d) {
                return color(d.name);
            });

        legend.append('text')
            .attr('x', 66)
            .attr('y', function (d, i) {
                return (i * 20) + 9;
            })
            .text(function (d) {
                return d.name;
            }).attr('font-size', '12px');

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text(function() {
                if (freq_bool) { return "Frequency of sentences in topic" } 
                return "Count of sentences in topic" 
            })

        var city = svg.selectAll(".city")
            .data(cities)
            .enter().append("g")
            .attr("class", "city");

        city.append("path")
            .attr("class", "line")
            .attr("d", function (d) {
                return line(d.values);
            })
            .style("stroke", function (d) {
                return color(d.name);
            });

        city.append("text")
        .attr('class','sideLabel')
            .datum(function (d) {
                return {
                    name: d.name,
                    value: d.values[d.values.length - 1]
                };
            })
            .attr("transform", function (d) {
                return "translate(" + x(d.value.date) + "," + y(d.value.temperature) + ")";
            })
            .attr("x", 3)
            .attr("dy", ".35em")
            .text(function (d) {
                return d.name;
            })

        var mouseG = svg.append("g")
            .attr("class", "mouse-over-effects");

        mouseG.append("path") // this is the black vertical line to follow mouse
            .attr("class", "mouse-line")
            .style("stroke", "black")
            .style("stroke-width", "1px")
            .style("opacity", "0");

        var lines = document.getElementsByClassName('line');

        var mousePerLine = mouseG.selectAll('.mouse-per-line')
            .data(cities)
            .enter()
            .append("g")
            .attr("class", "mouse-per-line");

        mousePerLine.append("circle")
            .attr("r", 7)
            .style("stroke", function (d) {
                return color(d.name);
            })
            .style("fill", "none")
            .style("stroke-width", "1px")
            .style("opacity", "0");

        mousePerLine.append("text")
            .attr("transform", "translate(10,3)");

        mouseG.append('svg:rect') // append a rect to catch mouse movements on canvas
            .attr('width', width) // can't catch mouse events on a g element
            .attr('height', height)
            .attr('fill', 'none')
            .attr('pointer-events', 'all')
            .on('mouseout', function () { // on mouse out hide line, circles and text
                d3.select(".mouse-line")
                    .style("opacity", "0");
                d3.selectAll(".mouse-per-line circle")
                    .style("opacity", "0");
                d3.selectAll(".mouse-per-line text")
                    .style("opacity", "0");
            })
            .on('mouseover', function () { // on mouse in show line, circles and text
                d3.select(".mouse-line")
                    .style("opacity", "1");
                d3.selectAll(".mouse-per-line circle")
                    .style("opacity", "1");
                d3.selectAll(".mouse-per-line text")
                    .style("opacity", "1");
            })
            .on('mousemove', function () { // mouse moving over canvas
                var mouse = d3.mouse(this);
                d3.select(".mouse-line")
                    .attr("d", function () {
                        var d = "M" + mouse[0] + "," + height;
                        d += " " + mouse[0] + "," + 0;
                        return d;
                    });

                d3.selectAll(".mouse-per-line")
                    .attr("transform", function (d, i) {
                        // console.log(width / mouse[0])
                        var xDate = x.invert(mouse[0]),
                            bisect = d3.bisector(function (d) { return d.date; }).right;
                        idx = bisect(d.values, xDate);

                        var beginning = 0,
                            end = lines[i].getTotalLength(),
                            target = null;

                        while (true) {
                            target = Math.floor((beginning + end) / 2);
                            pos = lines[i].getPointAtLength(target);
                            if ((target === end || target === beginning) && pos.x !== mouse[0]) {
                                break;
                            }
                            if (pos.x > mouse[0]) end = target;
                            else if (pos.x < mouse[0]) beginning = target;
                            else break; //position found
                        }

                        d3.select(this).select('text')
                            .text(yAxisFormat(freq_bool)(y.invert(pos.y)));

                        return "translate(" + mouse[0] + "," + pos.y + ")";
                    });
            });
    })
    function yAxisFormat(freq_bool) {
        if (freq_bool) {
            return d3.format(".01%")
        } else {
            return d3.format("00")
        }
    }
}

$(document).ready(function () {
    console.log("ready!");

    var topicsOfInterest = [14,13,12]

    d3.tsv('topics.tsv', function (topicData) {

        var checkboxes = d3.select("#checkboxDiv").selectAll("input")
            .data(topicData.slice(1,))
            .enter().append('p').append("label").attr('class', 'cbLabel')
            .text(function (d) { return d.description; })
            .append("input")
            .attr("checked", false)
            .attr("type", "checkbox")
            .attr("id", function (d, i) { return i; })
            .attr("for", function (d, i) { return i; });
        checkboxes.each(function (d, i) {
            if (topicsOfInterest.includes(i)) {
                d3.select(this).property('checked', true);
            } else {
                d3.select(this).property('checked', false);
            }
        })
        var separated = false
        // initialize graph
        draw(separated, topicsOfInterest, topicData)

        // on dropdown change
        d3.select('#mediasource').on('change', function (d) {
            console.log('dropdown changed')
            var separated = (d3.select(this).node().value === 'separated') ? true : false;

            draw(separated, [], topicData)
        })
        d3.selectAll('#checkboxDiv input').on('change', function (d,i) {
            var separated = (d3.select('#mediasource').node().value === 'separated') ? true : false;
            draw(separated, [], topicData)
            // var ischecked = d3.select(this).property('checked')
            // console.log(d3.select(this).attr('id'), ischecked
    })

    //     if ($(this).prop('checked')) {
    //         draw('notPEN')
    //     } else {
    //         draw('PEN')
    //     }
    })
});