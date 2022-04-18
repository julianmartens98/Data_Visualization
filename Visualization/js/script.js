// set the dimensions and margin_c1s of the graph
var margin_c1 = { top: 20, right: 30, bottom: 30, left: 60 },
    width_c1 = $('#canvas1').width() - margin_c1.left - margin_c1.right,
    height_c1 = $('#canvas1').height() - margin_c1.top - margin_c1.bottom;

var margin_c2 = { top: 20, bottom: 30, inner: 60, outer: 40 },
    width_c2 = $('#canvas2').width() - margin_c2.outer,
    height_c2 = $('#canvas2').height() - margin_c2.top - margin_c2.bottom;

const margin_c3 = { top: 70, right: 20, bottom: 20, left: 150 },
    width_c3 = $('#canvas3').width() - margin_c3.left - margin_c3.right,
    height_c3 = $('#canvas3').height() - margin_c3.top - margin_c3.bottom;

var x_pc,
    y_pc = {},
    dimensions,
    dragging = {},
    background,
    foreground;

// append the svg object to the body of the page
var c1 = d3.select("#canvas1")
    .append("g")
    .attr("transform",
        "translate(" + margin_c1.left + "," + margin_c1.top + ")");

var c2 = d3.select("#canvas2")
    .append("g")
    .attr("transform",
        "translate(" + margin_c2.outer / 2 + "," + margin_c2.top + ")");

var c3 = d3.select("#canvas3")
    .append("g")
    .attr("transform",
        "translate(" + margin_c3.left + "," + margin_c3.top + ")");

const y2Domain = ['Slight', 'Serious', 'Fatal']
let youCluster = "profile 1"
let selectCluster = "profile 2"
let storeCluster
const youColor = 'green'
const selectColor = 'red'
const nonselectColor = 'lightgrey'


    // Parse the Data
    d3.csv("data/profiles.csv").then(function (data) {
        data.map(d => {
            const keys = Object.keys(d);
            keys.forEach((key, index) => {
                d[key] = Number(d[key]);
            });
            d['Cluster Labels'] = `profile ${(Number(d['Cluster Labels']) + 1)}`
        }
        )

        let selectData = data.filter(d => d['Cluster Labels'] === selectCluster).map(d => { return [d['casualty_severity_name+' + y2Domain[0]], d['casualty_severity_name+' + y2Domain[1]], d['casualty_severity_name+' + y2Domain[2]]] })[0]
        let youData = data.filter(d => d['Cluster Labels'] === youCluster).map(d => { return [d['casualty_severity_name+' + y2Domain[0]], d['casualty_severity_name+' + y2Domain[1]], d['casualty_severity_name+' + y2Domain[2]]] })[0]

        // Add X axis
        var x = d3.scaleLinear()
            .domain([0, d3.max(data.map(d => d['risk_score']))])
            .range([0, width_c1]);
        c1.append("g")
            .attr("transform", "translate(0," + height_c1 + ")")
            .call(d3.axisBottom(x)
                .tickValues(data.map(d => d['risk_score']))
                .tickFormat(d => d3.format('0.0%')(d / d3.max(data.map(d => d['risk_score']))))
            )
            .selectAll("text")
            .attr("transform", "translate(0,0)rotate(0)")
            .style("text-anchor", "middle");

        // Y axis
        var y = d3.scaleBand()
            .range([0, height_c1])
            .domain(data.map(function (d) { return d['Cluster Labels']; }))
            .padding(.1);
        c1.append("g")
            .call(d3.axisLeft(y))

        //Bars
        c1.selectAll("myRect")
            .data(data)
            .enter()
            .append("rect")
            .classed('c1-rect', true)
            .attr("x", x(0))
            .attr("y", function (d) { return y(d['Cluster Labels']); })
            .attr("width", function (d) { return x(d['risk_score']); })
            .attr("height", y.bandwidth())
            .attr("fill", d => d['Cluster Labels'] === youCluster ? youColor : d['Cluster Labels'] === selectCluster ? selectColor : nonselectColor)
            .on('mouseenter', function(event, d) {
                storeCluster = selectCluster
                selectCluster = d['Cluster Labels']
                hover()
            })
            .on('mouseleave', function(event, d) {
                selectCluster = storeCluster
                hover()
            })

        
        biBar(selectData, youData)

        // Extract the list of dimensions as keys and create a y_pc scale for each.
        dimensions = Object.keys(data[0]).filter(function (key) {
            if (key !== "") {
                y_pc[key] = d3.scaleLinear()
                    .domain(d3.extent(data, function (d) { return +d[key]; }))
                    .range([height_c3, 0]);
                return key;
            };
        }).slice(1);
        dimensions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(x => dimensions[x])
        // console.log(dimensions);
        // Creata a x_pc scale for each dimension
        x_pc = d3.scalePoint()
            .domain(dimensions)
            .range([0, width_c3]);

        // Add grey background lines for context.
        background = c3.append("g")
            .attr("class", "background")
            .selectAll("path")
            .data(data)
            .enter().append("path")
            .attr("d", line)
            .style('stroke', nonselectColor);

        // Add blue foreground lines for focus.
        foreground = c3.append("g")
            .attr("class", "foreground")
            .selectAll("path")
            .data(data)
            .enter().append("path")
            .classed('c3-line', true)
            .attr("d", line)
            .style('stroke', d => d['Cluster Labels'] === youCluster ? youColor : d['Cluster Labels'] === selectCluster ? selectColor : nonselectColor);

        // Add a group element for each dimension.
        var g = c3.selectAll(".dimension")
            .data(dimensions)
            .enter().append("g")
            .attr("class", "dimension")
            .attr("transform", function (d) { return "translate(" + x_pc(d) + ")"; })
            .call(d3.drag()
                .on("start", function (event, d) {
                    dragging[d] = x_pc(d);
                    background.attr("visibility", "hidden");
                })
                .on("drag", function (event, d) {
                    dragging[d] = Math.min(width_c3, Math.max(0, event.x));
                    foreground.attr("d", line);
                    dimensions.sort(function (a, b) { return position(a) - position(b); });
                    x_pc.domain(dimensions);
                    g.attr("transform", function (d) { return "translate(" + position(d) + ")"; })
                })
                .on("end", function (event, d) {
                    delete dragging[d];
                    transition(d3.select(this)).attr("transform", "translate(" + x_pc(d) + ")");
                    transition(foreground).attr("d", line);
                    background
                        .attr("d", line)
                        .transition()
                        .delay(500)
                        .duration(0)
                        .attr("visibility", null);
                }));

        // Add an axis and title.
        g.append("g")
            .attr("class", "axis")
            .each(function (d) { d3.select(this).call(d3.axisLeft().scale(y_pc[d])); })
            .append("text")
            .style("text-anchor", "end")
            .attr('transform', 'translate(0,-5) rotate(10)')
            .attr("fill", "black")
            .attr("font-size", "12")
            .attr("y_pc", -9)
            .text(function (d) { return d; });

    })

function hover() {
    c1.selectAll('.c1-rect')
        .transition()
        .attr('fill', d => d['Cluster Labels'] === youCluster ? youColor : d['Cluster Labels'] === selectCluster ? selectColor : nonselectColor)
    c3.selectAll('.c3-line')
        .transition()
        .style('stroke', d => d['Cluster Labels'] === youCluster ? youColor : d['Cluster Labels'] === selectCluster ? selectColor : nonselectColor)
}

function biBar(selectData, youData) {
        const selectedMax = d3.max(selectData.concat(youData))
        // Add X axis
        var x = d3.scaleLinear()
            .domain([0, selectedMax])
            .range([0, width_c2 - ((width_c2 / 2) + (margin_c2.inner / 2))]);
        c2.append("g")
            .attr("transform", `translate(${(width_c2 / 2) + (margin_c2.inner / 2)}, ${height_c2})`)
            .call(d3.axisBottom(x)
                .tickValues(selectData)
                .tickFormat(d => d3.format('.2s')(d))
            )
            .selectAll("text")
            .attr("transform", "translate(0,0)rotate(0)")
            .style("text-anchor", "middle");

        // Y axis
        var y = d3.scaleBand()
            .range([0, height_c2])
            .domain(y2Domain)
            .padding(.1);
        c2.append("g")
            .call(d3.axisLeft(y))
            .attr('transform', `translate(${(width_c2 / 2) + (margin_c2.inner / 2)}, 0)`)
            .selectAll("text")
            .attr("transform", `translate(${-21.5},0)rotate(0)`)
            .style("text-anchor", "middle");

        //Bars
        const selectRisk = c2.selectAll(".c2-rect-select")
            .data(selectData)
            .enter()
            .append("rect")
            .classed('c2-rect-select', true)
            .attr("x", x(0))
            .attr("y", function (d, i) { return y(y2Domain[i]); })
            .attr("width", function (d) { return x(d); })
            .attr("height", y.bandwidth())
            .attr("fill", selectColor)
            .attr('transform', `translate(${(width_c2 / 2) + (margin_c2.inner / 2)}, 0)`)


        // Add X axis
        var x = d3.scaleLinear()
            .domain([selectedMax, 0])
            .range([0, width_c2 - ((width_c2 / 2) + (margin_c2.inner / 2))]);
        c2.append("g")
            .attr("transform", `translate(${0}, ${height_c2})`)
            .call(d3.axisBottom(x)
                .tickValues(youData)
                .tickFormat(d => d3.format('.2s')(d))
            )
            .selectAll("text")
            .attr("transform", "translate(0,0)rotate(0)")
            .style("text-anchor", "center");

        // Y axis
        var y = d3.scaleBand()
            .range([0, height_c2])
            .domain(y2Domain)
            .padding(.1);
        c2.append("g")
            .call(d3.axisRight(y)
                .tickFormat(''))
            .attr('transform', `translate(${width_c2 - ((width_c2 / 2) + (margin_c2.inner / 2))}, 0)`)

        //Bars
        c2.selectAll(".c2-rect-you")
            .data(youData)
            .enter()
            .append("rect")
            .classed('c2-rect-you', true)
            .attr("x", d => x(d))
            .attr("y", function (d, i) { return y(y2Domain[i]); })
            .attr("width", function (d) { return x(0) - x(d); })
            .attr("height", y.bandwidth())
            .attr("fill", youColor)
            .attr('transform', `translate(${0}, 0)`)
}

function position(d) {
    var v = dragging[d];
    return v == null ? x_pc(d) : v;
}

function transition(g) {
    return g.transition().duration(500);
}

// Take a row of the csv as input, and return x_pc and y_pc coordinates of the line to draw for this raw.
function line(d) {
    return d3.line()(dimensions.map(function (key) { return [x_pc(key), y_pc[key](d[key])]; }));
}



