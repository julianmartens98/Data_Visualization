// declaring the color map 
const colorMap = {
    'profile 1': '#e41a1c',
    'profile 2': '#377eb8',
    'profile 3': '#4daf4a',
    'profile 4': '#984ea3',
    'profile 5': '#ff7f00'
}

// declaring some support variables for the profile composition component
let x_pc,
    y_pc = {},
    dimensions,
    dragging = {},
    background,
    foreground,
    noFeatures = 10

// declaring some support variables for the associated risk distribution component
const y2Domain = ['Slight', 'Serious', 'Fatal']

// declaring some support variables for general interaction orchestration
let youCluster = "profile 3" // dummy profile assignment for initial rendering
let selectCluster = "profile 5" // dummy profile selection for initial rendering
let storeCluster

// start defining margins for the different components based on the screen/window size
var margin_c1 = { top: 60, right: 35, bottom: 30, left: 70 },
    width_c1 = $('#canvas1').width() - margin_c1.left - margin_c1.right,
    height_c1 = $('#canvas1').height() - margin_c1.top - margin_c1.bottom;

var margin_c2 = { top: 60, bottom: 30, inner: 60, outer: 45 },
    width_c2 = $('#canvas2').width() - margin_c2.outer,
    height_c2 = $('#canvas2').height() - margin_c2.top - margin_c2.bottom;

const margin_c3 = { top: 90, right: 100, bottom: 25, left: 100 },
    width_c3 = $('#canvas3').width() - margin_c3.left - margin_c3.right,
    height_c3 = $('#canvas3').height() - margin_c3.top - margin_c3.bottom;
// end defining margins for the different components based on the screen/window size

// start initializing upper left risk profiles component
var c1 = d3.select("#canvas1")
    .append("g")
    .attr("transform",
        "translate(" + margin_c1.left + "," + margin_c1.top + ")");

d3.select("#canvas1")
    .append('text')
    .attr('id', 'canvas-title')
    .text('Risk Profiles')
    .attr("transform", "translate(" + $('#canvas1').width() / 2 + "," + ((margin_c1.top / 2) - 10) + ")")

d3.select("#canvas1")
    .append('text')
    .attr('id', 'canvas-sub-title')
    .text('(risk scores calculated as a weighted sum over the associated risk distribution)')
    .attr("transform", "translate(" + $('#canvas1').width() / 2 + "," + ((margin_c1.top / 2) + 10) + ")")
// end initializing upper left risk profiles component

// start initializing upper right associated risk distribution component
var c2 = d3.select("#canvas2")
    .append("g")
    .attr("transform",
        "translate(" + margin_c2.outer / 2 + "," + margin_c2.top + ")");

d3.select("#canvas2")
    .append('text')
    .attr('id', 'canvas-title')
    .text('Associated Risk Distribution')
    .attr("transform", "translate(" + $('#canvas2').width() / 2 + "," + ((margin_c2.top / 2) - 10) + ")").append('text')

d3.select("#canvas2")
    .append('text')
    .attr('id', 'canvas-sub-title')
    .text('(number of casualties observed in 2020 for selected profiles)')
    .attr("transform", "translate(" + $('#canvas2').width() / 2 + "," + ((margin_c2.top / 2) + 10) + ")").append('text')
// end initializing upper right associated risk distribution component

// start initializing lower profile composition component
var c3 = d3.select("#canvas3")
    .append("g")
    .attr("transform",
        "translate(" + margin_c3.left + "," + margin_c3.top + ")");

d3.select("#canvas3")
    .append('text')
    .attr('id', 'canvas-title')
    .text('Profile Compositions')
    .attr("transform", "translate(" + $('#canvas3').width() / 2 + "," + ((margin_c3.top / 2) - 20) + ")")

d3.select("#canvas3")
    .append('text')
    .attr('id', 'canvas-sub-title')
    .text('(most contrastive attributes for selected profiles)')
    .attr("transform", "translate(" + $('#canvas3').width() / 2 + "," + ((margin_c3.top / 2) - 0) + ")")
// start initializing lower profile composition component

// start implementing + and - button for manual attribute filtering in profile composition component
d3.select("#canvas3")
    .append('text')
    .attr('id', 'canvas-title')
    .text('+')
    .attr("transform", "translate(" + ($('#canvas3').width() - margin_c3.bottom) + "," + ((margin_c3.top / 2) - 20) + ")")
    .style('text-anchor', 'end')
    .style('font-size', '30')
    .style('cursor', 'pointer')
    .on('click', function () {
        noFeatures++
        redrawDashboard()
    })

d3.select("#canvas3")
    .append('text')
    .attr('id', 'canvas-title')
    .text('-')
    .attr("transform", "translate(" + ($('#canvas3').width() - margin_c3.bottom - 30) + "," + ((margin_c3.top / 2) - 20) + ")")
    .style('text-anchor', 'end')
    .style('font-size', '30')
    .style('cursor', 'pointer')
    .on('click', function () {
        noFeatures--
        redrawDashboard()
    })
// end implementing + and - button for manual attribute filtering in profile composition component

d3.csv('data/predictions.csv').then(function (data) { // loading the precalculated model dataset

    // start implementation of the settings/questionnaire window
    const areas = [
        { column: 'sex_of_casualty', id: '#sex-select' },
        { column: 'age_band_of_casualty', id: "#age-select" },
        { column: 'casualty_home_area_type', id: "#home-type-select" },
        { column: 'vehicle_type', id: "#vehicle-type-select" },
        { column: 'journey_purpose_of_driver', id: "#journey-select" },
        { column: 'engine_capacity_cc', id: "#engine-capacity-select" },
        { column: 'propulsion_code', id: "#propulsion-select" },
        { column: 'age_of_vehicle', id: "#vehicle-age-select" },
        { column: 'generic_make_model', id: "#model-select" },
    ]

    areas.forEach(area => {
        let cats = [...new Set(data.map(d => d[area.column]))]
        let caseSelect = d3.select(area.id).node(),
            option,
            i = 0,
            il = cats.length

        // dynamically populating the html option elements based on the data
        for (; i < il; i += 1) {
            option = document.createElement('option');
            option.setAttribute('value', cats[i]);
            option.appendChild(document.createTextNode(cats[i]));
            caseSelect.appendChild(option);
        }
    })

    d3.select('#apply-settings').on('click', function () {
        const filter = {}
        areas.forEach(area => filter[area.column] = $(area.id).val())
        let filtered = data.filter(i => // assigning a risk profile to the user based on their input and the precalculated model output
            Object.entries(filter).every(([k, v]) => i[k] === v))
        youCluster = `profile ${Number(filtered[0].profile) + 1}`
        youCluster === 'profile 1' ? selectCluster = 'profile 2' : selectCluster = 'profile 1'
        redrawDashboard() // drawing the components based on the user input in the questionnaire
    })
    // end implementation of the settings/questionnaire window

})

function redrawDashboard() {
    d3.csv("data/profiles.csv").then(function (data) { // loading the profiles dataset

        // cleaning and transforming the data
        const canvases = [c1, c2, c3]
        canvases.forEach(c => c.selectAll('*').remove())

        data.map(d => {
            const keys = Object.keys(d);
            keys.forEach((key, index) => {
                d[key] = Number(d[key]);
            });
            d['Cluster Labels'] = `profile ${(Number(d['Cluster Labels']) + 1)}`
        }
        )

        // retreiving the data on the assinged and selected profiles
        let selectData = data.filter(d => d['Cluster Labels'] === selectCluster).map(d => { return [d['casualty_severity_name+' + y2Domain[0]], d['casualty_severity_name+' + y2Domain[1]], d['casualty_severity_name+' + y2Domain[2]]] })[0]
        let youData = data.filter(d => d['Cluster Labels'] === youCluster).map(d => { return [d['casualty_severity_name+' + y2Domain[0]], d['casualty_severity_name+' + y2Domain[1]], d['casualty_severity_name+' + y2Domain[2]]] })[0]

        // start implementing the upper left risk profiles component
        // implementing the x axis
        var x = d3.scaleLinear()
            .domain([0, d3.max(data.map(d => d['risk_score']))])
            .range([0, width_c1]);
        c1.append("g")
            .attr("transform", "translate(0," + height_c1 + ")")
            .call(d3.axisBottom(x)
                .tickValues(data.map(d => d['risk_score']))
                .tickFormat((d, i) => i === 0 ? 'MAX' : d3.format('0.0%')(d / d3.max(data.map(d => d['risk_score']))))
            )
            .selectAll("text")
            .attr("transform", "translate(0,0)rotate(0)")
            .style("text-anchor", "middle");

        // implementing the y axis
        var y = d3.scaleBand()
            .range([0, height_c1])
            .domain(data.map(function (d) { return d['Cluster Labels']; }))
            .paddingInner(.1)
            .paddingOuter(.0);
        c1.append("g")
            .call(d3.axisLeft(y))

        // implementing the bars
        c1.selectAll("myRect")
            .data(data)
            .enter()
            .append("rect")
            .classed('c1-rect', true)
            .attr("x", x(0))
            .attr("y", function (d) { return y(d['Cluster Labels']); })
            .attr("width", function (d) { return x(d['risk_score']); })
            .attr("height", y.bandwidth())
            .attr("fill", d => colorMap[d['Cluster Labels']])
            .style('opacity', d => d['Cluster Labels'] === youCluster || d['Cluster Labels'] === selectCluster ? 1 : 0.20) // opacity dependent on wheter or not a profile is selected or assinged ()
            .on('mouseenter', function (event, d) {
                storeCluster = selectCluster
                selectCluster = d['Cluster Labels']
                hover()
            })
            .on('mouseleave', function (event, d) { // implementing the hover interaction
                selectCluster = storeCluster
                hover()
            })
            .on('click', function (event, d) { // implementing the selection interaction
                storeCluster = d['Cluster Labels']
                selectCluster = d['Cluster Labels']
                redrawDashboard()
            })

        // implementing the assigned risk profile indicator
        c1.append('text')
            .attr('x', x(data.filter(d => d['Cluster Labels'] === youCluster)[0].risk_score) - 15)
            .attr('y', y(youCluster) + y.bandwidth() / 2)
            .text('YOU')
            .style('text-anchor', 'end')
            .style('dominant-baseline', 'central')
            .style('font-family', "'Work Sans', sans-serif")
            .style('font-size', '20')
            .style('fill', '#282828')
        // end implementing the upper left risk profiles component

        // start implementing the upper right associated risk distribution component
        const selectedMax = d3.max(selectData.concat(youData))

        // implementing the right side (the selected profile distribution)
        // implementing the right x axis
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

        // implementing the shared y axis
        var y = d3.scaleBand()
            .range([0, height_c2])
            .domain(y2Domain)
            .paddingInner(.1)
            .paddingOuter(.0);
        c2.append("g")
            .call(d3.axisLeft(y))
            .attr('transform', `translate(${(width_c2 / 2) + (margin_c2.inner / 2)}, 0)`)
            .selectAll("text")
            .attr("transform", `translate(${-21.5},0)rotate(0)`)
            .style("text-anchor", "middle");

        // implementing the right bars
        const selectRisk = c2.selectAll(".c2-rect-select")
            .data(selectData)
            .enter()
            .append("rect")
            .classed('c2-rect-select', true)
            .attr("x", x(0))
            .attr("y", function (d, i) { return y(y2Domain[i]); })
            .attr("width", function (d) { return x(d); })
            .attr("height", y.bandwidth())
            .attr("fill", colorMap[selectCluster])
            .attr('transform', `translate(${(width_c2 / 2) + (margin_c2.inner / 2)}, 0)`)

        // implementing the left side (assigned risk distribution)
        // implementing the left x axis
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

        // implementing the shared y axis
        var y = d3.scaleBand()
            .range([0, height_c2])
            .domain(y2Domain)
            .paddingInner(.1)
            .paddingOuter(.0);
        c2.append("g")
            .call(d3.axisRight(y)
                .tickFormat('')) // removing the ticks as they are already implemented on the right side
            .attr('transform', `translate(${width_c2 - ((width_c2 / 2) + (margin_c2.inner / 2))}, 0)`)

        // implementing the left bars
        c2.selectAll(".c2-rect-you")
            .data(youData)
            .enter()
            .append("rect")
            .classed('c2-rect-you', true)
            .attr("x", d => x(d))
            .attr("y", function (d, i) { return y(y2Domain[i]); })
            .attr("width", function (d) { return x(0) - x(d); })
            .attr("height", y.bandwidth())
            .attr("fill", colorMap[youCluster])
            .attr('transform', `translate(${0}, 0)`)
        // end implementing the upper right associated risk distribution component

        // start implementing the lower profile composition component
        let datas = data.filter(d => d['Cluster Labels'] === youCluster || d['Cluster Labels'] === selectCluster)

        let sim = []
        for (let i = 1; i < Object.keys(datas[0]).length; i++) {
            if ([ // making sure these attributes are never selected for visualization (non-characteristic information)
                'risk_score',
                'count',
                'casualty_severity_name+Slight',
                'casualty_severity_name+Serious',
                'casualty_severity_name+Fatal'
            ].includes(Object.keys(datas[0])[i])) {
                continue
            }
            sim.push({ index: i, value: Math.abs(datas[0][Object.keys(datas[0])[i]] - datas[1][Object.keys(datas[1])[i]]) }) // calculating constrastiveness as the absolute value difference
        }

        // Extracting the list of dimensions as keys and create a y_pc scale for attribute.
        dimensions = Object.keys(data[0]).filter(function (key) {
            if (key !== "") {
                y_pc[key] = d3.scaleLinear()
                    .domain(d3.extent(data, function (d) { return +d[key]; }))
                    .range([height_c3, 0]);
                return key;
            };
        });

        // sorting the dimenions based on contrastiveness
        dimensions = sim.sort((a, b) => b.value - a.value).slice(0, noFeatures).map(d => d.index).map(x => dimensions[x])
        
        // defining an x axis for each dimension
        x_pc = d3.scalePoint()
            .domain(dimensions)
            .range([0, width_c3]);

        // implementing the lines for the profiles
        foreground = c3.append("g")
            .attr("class", "foreground")
            .selectAll("path")
            .data(data)
            .enter().append("path")
            .classed('c3-line', true)
            .attr("d", line)
            .style('stroke', d => colorMap[d['Cluster Labels']])
            .style('stroke-width', d => d['Cluster Labels'] === youCluster || d['Cluster Labels'] === selectCluster ? 4 : 2) // stroke-width dependent on wheter or not a profile is selected or assinged ()
            .style('opacity', d => d['Cluster Labels'] === youCluster || d['Cluster Labels'] === selectCluster ? 1 : 0.20) // opacity dependent on wheter or not a profile is selected or assinged ()
            .on('mouseenter', function (event, d) { // implementing the hover interaction
                storeCluster = selectCluster
                selectCluster = d['Cluster Labels']
                hover()
            })
            .on('mouseleave', function (event, d) { // implementing the hover interaction
                selectCluster = storeCluster
                hover()
            })
            .on('click', function (event, d) { // implementing the selection interaction
                storeCluster = d['Cluster Labels']
                selectCluster = d['Cluster Labels']
                redrawDashboard()
            });

        // implementing the dragging interaction to relocate the dimensions
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

        // implementing the axes and title
        g.append("g")
            .attr("class", "axis")
            .each(function (d) { d3.select(this).call(d3.axisLeft().scale(y_pc[d]).tickFormat(d => (digits(d) < 4 ? d3.format(',.0%')(d) : d3.format(',.1%')(d)))) })
            .append("text")
            .style("text-anchor", "middle")
            .style('dominant-baseline', 'central')
            .attr('id', 'pc-label')
            .attr('transform', 'rotate(0)')
            .attr("fill", "black")
            .style("font-size", "10")
            .attr("y", -20)
            .text(function (d) { // cleaning some variable names
                return d.split('+')[0]
                    .replaceAll('_', ' ')
                    .replace(' of casualty', '')
                    .replace(' of driver', '')
                    .replace('generic make ', '')
                    .replace('casualty ', '')
                    .replace('home area type', 'home area')
                    .replace(' code', '')
                    .replace('age of vehicle', 'vehicle age')
                    .replace('age band', 'age') + ': '
            }).append('tspan')
            .text(function (d) { return d.split('+')[1] })
            .style('font-weight', 'bold')
            .style('font-size', '12')

        c3.select('.foreground').raise()
        // end implementing the lower profile composition component
    })
}

redrawDashboard() // inital rendering of the dashboard

// making sure the user questionnaire is shown immediately on page load
var myModal = new bootstrap.Modal(document.getElementById('exampleModal'), {})
myModal.show()
