(function () {

    var chartConfig = {
        width: 200,
        height: 200,
        hasBottomLabel: true,
        bottomMarginForLabel: 30,
        color: d3.scale.category10(),
        renderHalfDonut: false,
        // See margin convention: http://bl.ocks.org/mbostock/3019563
        margin: {
            top: 5,
            right: 5,
            bottom: 5,
            left: 5
        }
    };

    function makeRandomData() {
        return {
            centerLabel: 'hello',
            bottomLabel: 'world',
            values: [
                {label: 'x', value: Math.random() * 3},
                {label: 'y', value: Math.random() * 10}
            ]
        };
    }

    function init() {
        var chartData = makeRandomData(),
            chartId = 'thin-donut-chart',
            d3ChartEl = d3.select('#' + chartId);
        chartConfig.width = parseInt(d3ChartEl.style('width')) || chartConfig.width;
        chartConfig.height = parseInt(d3ChartEl.style('height')) || chartConfig.height;
        drawChart(chartId, chartData, chartConfig);
    }

    function drawChart(chartId, chartData, chartConfig) {
        var width = chartConfig.width,
            height = chartConfig.height,
            margin = chartConfig.margin,
            radius;

        // Add a bottom margin if there is a label for the bottom
        if (!!chartConfig.hasBottomLabel) {
            margin.bottom = chartConfig.bottomMarginForLabel;
        }

        // Adjust for margins
        width = width - margin.left - margin.right;
        height = height - margin.top - margin.bottom;

        if (chartConfig.renderHalfDonut) {
            radius = Math.min(width / 2, height);
        } else {
            radius = Math.min(width, height) / 2;
        }

        var thickness = chartConfig.thickness || Math.floor(radius / 5);

        var arc = d3.svg.arc()
            .outerRadius(radius)
            .innerRadius(radius - thickness);

        var pieFn = d3.layout.pie()
            .sort(null)
            .value(function (d) {
                return d.value;
            });

        if (chartConfig.renderHalfDonut) {
            pieFn.startAngle(-Math.PI / 2).endAngle(Math.PI / 2);
        }

        var centerLabel = (!!chartData.centerLabel) ? chartData.centerLabel : '',
            bottomLabel = (!!chartData.bottomLabel) ? chartData.bottomLabel : '';

        var d3ChartEl = d3.select('#' + chartId);

        // Clear any previous chart
        d3ChartEl.select('svg').remove();

        var gRoot = d3ChartEl.append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g');

        if (chartConfig.renderHalfDonut) {
            gRoot.attr('class', 'half-donut');
            gRoot.attr('transform', 'translate(' + (width / 2 + margin.left) + ',' + (height + margin.top) + ')');
        } else {
            gRoot.attr('transform', 'translate(' + (width / 2 + margin.left) + ',' + (height / 2 + margin.top) + ')');
        }

        var middleCircle = gRoot.append('svg:circle')
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', radius)
            .style('fill', '#fff');

        var g = gRoot.selectAll('g.arc')
            .data(pieFn(chartData.values))
            .enter()
            .append('g')
            .attr('class', 'arc');

        g.append('svg:path')
            .attr('d', arc)
            .style('fill', function (d) {
                return chartConfig.color(d.data.label);
            })
            .attr('data-arc-data', function (d) {
                return d.data.value;
            });

        gRoot.append('svg:text')
            .attr('class', 'center-label')
            .text(centerLabel);

        if (chartConfig.hasBottomLabel) {
            gRoot.append('svg:text')
                .attr('class', 'bottom-label')
                .attr('transform', function (d) {
                    return 'translate(0, ' + (height / 2 + margin.bottom / 2) + ')';
                })
                .text(bottomLabel);
        }
    }

    init();
})();