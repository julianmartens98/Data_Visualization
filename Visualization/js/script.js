// set the dimensions and margin_c1s of the graph
var margin_c1 = { top: 20, right: 30, bottom: 30, left: 60 },
    width_c1 = $('#canvas1').width() - margin_c1.left - margin_c1.right
height_c1 = $('#canvas1').height() - margin_c1.top - margin_c1.bottom;

var margin_c2 = { top: 20, bottom: 30, inner: 60, outer: 40 },
    width_c2 = $('#canvas2').width() - margin_c2.outer
height_c2 = $('#canvas2').height() - margin_c2.top - margin_c2.bottom;

// append the svg object to the body of the page
var c1 = d3.select("#canvas1")
    .append("g")
    .attr("transform",
        "translate(" + margin_c1.left + "," + margin_c1.top + ")");

var c2 = d3.select("#canvas2")
    .append("g")
    .attr("transform",
        "translate(" + margin_c2.outer / 2 + "," + margin_c2.top + ")");

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


    console.log(data)
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
        .attr("x", x(0))
        .attr("y", function (d) { return y(d['Cluster Labels']); })
        .attr("width", function (d) { return x(d['risk_score']); })
        .attr("height", y.bandwidth())
        .attr("fill", "#69b3a2")

    const y2Domain = ['Slight', 'Serious', 'Fatal']
    const data2 = data.filter(d => d['Cluster Labels'] === 'profile 2').map(d => { return [d['casualty_severity_name+' + y2Domain[0]], d['casualty_severity_name+' + y2Domain[1]], d['casualty_severity_name+' + y2Domain[2]]] })[0]
    const data3 = data.filter(d => d['Cluster Labels'] === 'profile 3').map(d => { return [d['casualty_severity_name+' + y2Domain[0]], d['casualty_severity_name+' + y2Domain[1]], d['casualty_severity_name+' + y2Domain[2]]] })[0]
    const selectedMax = d3.max(data2.concat(data3))
    // Add X axis
    var x = d3.scaleLinear()
        .domain([0, selectedMax])
        .range([0, width_c2 - ((width_c2 / 2) + (margin_c2.inner / 2))]);
    c2.append("g")
        .attr("transform", `translate(${(width_c2 / 2) + (margin_c2.inner / 2)}, ${height_c2})`)
        .call(d3.axisBottom(x)
            .tickValues(data2)
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
    c2.selectAll("myRect")
        .data(data2)
        .enter()
        .append("rect")
        .attr("x", x(0))
        .attr("y", function (d, i) { return y(y2Domain[i]); })
        .attr("width", function (d) { return x(d); })
        .attr("height", y.bandwidth())
        .attr("fill", "#69b3a2")
        .attr('transform', `translate(${(width_c2 / 2) + (margin_c2.inner / 2)}, 0)`)


    // Add X axis
    var x = d3.scaleLinear()
        .domain([selectedMax, 0])
        .range([0, width_c2 - ((width_c2 / 2) + (margin_c2.inner / 2))]);
    c2.append("g")
        .attr("transform", `translate(${0}, ${height_c2})`)
        .call(d3.axisBottom(x)
            .tickValues(data3)
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
    c2.selectAll("myRect")
        .data(data3)
        .enter()
        .append("rect")
        .attr("x", d => x(d))
        .attr("y", function (d, i) { return y(y2Domain[i]); })
        .attr("width", function (d) { return x(0) - x(d); })
        .attr("height", y.bandwidth())
        .attr("fill", "#69b3a2")
        .attr('transform', `translate(${0}, 0)`)

})