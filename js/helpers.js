function hover() { // implementing the linked highlighting
    c1.selectAll('.c1-rect')
        .transition()
        .style('opacity', d => d['Cluster Labels'] === youCluster || d['Cluster Labels'] === selectCluster || d['Cluster Labels'] === storeCluster ? 1 : 0.20)
    c3.selectAll('.c3-line')
        .transition()
        .style('opacity', d => d['Cluster Labels'] === youCluster || d['Cluster Labels'] === selectCluster || d['Cluster Labels'] === storeCluster ? 1 : 0.20)
        .style('stroke-width', d => d['Cluster Labels'] === youCluster || d['Cluster Labels'] === selectCluster || d['Cluster Labels'] === storeCluster ? 4 : 2)
}

function position(d) { // function used for draging the profile composition dimensions
    var v = dragging[d];
    return v == null ? x_pc(d) : v;
}

function transition(g) { // animation
    return g.transition().duration(500);
}

function line(d) { // function that draws the line segments to create a full line in the profile composition component
    return d3.line()(dimensions.map(function (key) { return [x_pc(key), y_pc[key](d[key])]; }));
}

function digits(value) { // function used for dynamic formating of the profile composition y axes labels
    
    value = "" + value;

    var res = 0;

    for ( var i = 0, len = value.length; i < len; i++ ) {
        if (value[i] === "e") break;
        if (+value[i] >= 0)
            res++;
}
    return res;
};