$(document).ready(function () {

    var slideUsageData;
    var userInteractionData;
    var $actionHistogramEl = $('.action-histogram');
    var $userIdButtonsContainerEl = $('.user-id-buttons-container');
    var urlPrefix = 'http://prez.dialedin.io/assignments/98/presentation?child_index=';

    function fetchSlideUsageHistogramData(callback) {
        d3.json('slides_index_frequency.json', function (json) {
            slideUsageData = json;
            callback();
        });
    }

    function fetchUserInteractionScatterplotData(callback) {
        d3.json('all_users_presentation_time.json', function (json) {
            userInteractionData = json;

            // sanitize
            var userIdToInteractionDataMap = {};
            userInteractionData.forEach(function (arr) {
                arr.forEach(function (o) {
                    var uid = o.user_id;
                    if (!userIdToInteractionDataMap[uid]) {
                        userIdToInteractionDataMap[uid] = [];
                    }
                    userIdToInteractionDataMap[uid].push(o);
                });
            });
            userInteractionData = userIdToInteractionDataMap;
            callback();
        });
    }

    function removeAllFromSvg() {
        d3.select('svg>*').remove();
    }

    function drawSlideUsageHistogram(data) {
        console.log('Drawing slide usage histogram');
        removeAllFromSvg();

        var config = {
            width: 600,
            height: 200,
            gRootXY: [50, 50],
            colorRange: [d3.rgb("#eee"), d3.rgb('#222')],
            mouseoverFillColor: 'red'
        };

        function drawChart(data, xKey, yKey) {
            function getX(d) { return d[xKey]; }
            function getY(d) { return d[yKey]; }
            var svg = d3.select('svg');
            var gRoot = svg.append('svg:g')
                .attr('transform', 'translate('+config.gRootXY+')');

            var yMax = d3.max(data, function (d) { return getY(d); });
            var xScale = d3.scale.ordinal()
                .domain(data.map(function (d) { return getX(d); }))
                .rangeRoundBands([0, config.width], 0.1);
            var yScale = d3.scale.linear()
                .domain([yMax, 0])
                .rangeRound([0, config.height]);

            var colorScale = d3.scale.linear()
                .domain([0, yMax])
                .interpolate(d3.interpolateLab)
                .range(config.colorRange);

            // draw axes
            var xAxis = d3.svg.axis()
                .ticks(10)
                .tickValues(xScale.domain().filter(function(d, i) { return !(i % 2); }))
                .scale(xScale);
            var yAxis = d3.svg.axis()
                .orient('left')
                .scale(yScale);

            gRoot.append('svg:g')
                .classed('axis', true)
                .attr('transform', 'translate('+[0, config.height]+')')
                .call(xAxis)
                .append('svg:text')
                .attr('x', config.width/2)
                .attr('y', 30)
                .style('text-anchor', 'middle')
                .text(xKey);
            gRoot.append('svg:g')
                .classed('axis', true)
                .attr('transform', 'translate('+[0, 0]+')')
                .call(yAxis)
                .append('svg:text')
                .attr('transform', 'rotate(-90)')
                .attr('x', -config.height/2)
                .attr('y', -config.gRootXY[0]+20)
                //.attr('dy', '.71em')
                .style('text-anchor', 'middle')
                .text(yKey);

            // caption
            gRoot.append('svg:text')
                .classed('caption', true)
                .attr('x', config.width/2)
                .attr('y', config.height + 50)
                .style('text-anchor', 'middle')
                .text('Chart: Usage of slides by all users');

            var histoEnter = gRoot.selectAll('.histo-bar')
                .data(data)
                .enter()
                .append('svg:rect')
                .classed('histo-bar', true);

            histoEnter
                .attr({
                    x: function (d) {
                        return xScale(getX(d));
                    },
                    y: function (d) {
                        return yScale(getY(d));
                    },
                    width: xScale.rangeBand(),
                    height: function (d) {
                        return config.height - yScale(getY(d));
                    }
                })
                .style({
                    fill: function (d) {
                        return colorScale(getY(d));
                    }
                })
                .on('mouseover', function (d) {
                    d3.select(this).style('fill', config.mouseoverFillColor);
                    d3.select('.tooltip')
                        .style('left', config.gRootXY[0] + xScale(getX(d)) + 'px')
                        .style('top', config.gRootXY[1] + 'px')
                        .style('opacity', 1)
                        .text(xKey + ': ' + getX(d) + ', ' + yKey + ': ' + getY(d));
                })
                .on('mouseout', function () {
                    d3.select(this).style('fill', function (d) {
                        return colorScale(getY(d));
                    });
                    d3.select('.tooltip')
                        .style('opacity', 0);
                })
                .on('click', function (d) {
                    var url = urlPrefix + getX(d);
                    console.log('Url: ', url);
                    window.open(url);
                });
        }
        drawChart(data, 'slide_index', 'frequency');
    }

    function drawUserInteractionScatterplot(userId, data) {
        console.log('Drawing user interaction scatterplot for userId', userId);
        removeAllFromSvg();

        var config = {
            width: 600,
            height: 350,
            colorRange: [d3.rgb("#111"), d3.rgb('#111')],
            gRootXY: [50, 50],
            dotSize: 4,
            dotR: 2.5,
            mouseoverOutlineColor: 'red'
        };

        function drawChart(data, xKey, yKey) {
            function getX(d) { return d[xKey]; }
            function getY(d) { return d[yKey]; }
            var svg = d3.select('svg');
            var gRoot = svg.append('svg:g')
                .classed('user-interaction-scatterplot', true)
                .attr('transform', 'translate('+config.gRootXY+')');

            var yMax = d3.max(data, function (d) { return getY(d); });
            var xScale = d3.scale.linear()
                .domain([0, d3.max(data, function (d) {return +getX(d);})])
                .rangeRound([0, config.width]);
            var yScale = d3.scale.linear()
                .domain([yMax, 0])
                .rangeRound([0, config.height]);

            var colorScale = d3.scale.linear()
                .domain([0, yMax])
                .interpolate(d3.interpolateLab)
                .range(config.colorRange);

            var xAxis = d3.svg.axis()
                .ticks(10)
                .scale(xScale);
            var yAxis = d3.svg.axis()
                .orient('left')
                .scale(yScale);

            gRoot.append('svg:g')
                .classed('axis', true)
                .attr('transform', 'translate('+[0, config.height]+')')
                .call(xAxis)
                .append('svg:text')
                .attr('x', config.width/2)
                .attr('y', 30)
                .style('text-anchor', 'middle')
                .text(xKey);
            gRoot.append('svg:g')
                .classed('axis', true)
                .attr('transform', 'translate('+[0, 0]+')')
                .call(yAxis)
                .append('svg:text')
                .attr('transform', 'rotate(-90)')
                .attr('x', -config.height/2)
                .attr('y', -config.gRootXY[0]+20)
                //.attr('dy', '.71em')
                .style('text-anchor', 'middle')
                .text(yKey);

            // caption
            gRoot.append('svg:text')
                .classed('caption', true)
                .attr('x', config.width/2)
                .attr('y', config.height + 50)
                .style('text-anchor', 'middle')
                .text('Chart: Interaction of slides by user ' + userId);

            var chartEnter = gRoot.selectAll('.g-item')
                .data(data)
                .enter()
                .append('svg:g')
                .classed('g-item', true)
                .attr({
                    transform: function (d) {
                        var x = xScale(+getX(d));
                        var y = yScale(getY(d));
                        return 'translate(' + [x, y] +')';
                    }
                });

            chartEnter
                .append('svg:circle')
                .attr({
                    cx: 0,
                    cy: 0,
                    r: config.dotR
                })
                .style({
                    fill: function (d) {
                        return colorScale(getY(d));
                    }
                })
                .on('mouseover', function (d) {
                    d3.select(this).style('stroke', config.mouseoverOutlineColor);
                    d3.select('.tooltip')
                        .style('left', config.gRootXY[0] + 'px')
                        .style('top', config.gRootXY[1] + 'px')
                        .style('opacity', 1)
                        .text(xKey + ': ' + getX(d) + ', ' + yKey + ': ' + getY(d));
                })
                .on('mouseout', function () {
                    d3.select(this).style('stroke', '');
                    d3.select('.tooltip')
                        .style('opacity', 0);
                })
                .on('click', function (d) {
                    var url = urlPrefix + getY(d);
                    console.log('Url: ', url);
                    window.open(url);
                });

        }
        drawChart(data, 'delta_time_elpased', 'slide_index');
    }

    $actionHistogramEl.click(function () {
        drawSlideUsageHistogram(slideUsageData);
    });

    $userIdButtonsContainerEl.click(function ($evt) {
        var userId = $evt.target.getAttribute('__data__');
        drawUserInteractionScatterplot(userId, userInteractionData[userId]);
    });

    fetchSlideUsageHistogramData(function () {
        drawSlideUsageHistogram(slideUsageData);
    });
    fetchUserInteractionScatterplotData(function () {
        var ids = Object.keys(userInteractionData);
        var buttonHtml = ids.map(function (id) {
            return '<button __data__="'+id+'">' + id + '</button>';
        });
        $userIdButtonsContainerEl.html(buttonHtml);
    });
});
