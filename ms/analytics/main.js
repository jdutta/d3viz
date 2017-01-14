$(document).ready(function () {

    var slideUsageData;
    var userActivityData;
    var userInteractionData;
    var slideCommentsData;
    var userCommentsViewData;
    var userCommentsPostData;
    var $chartModalEl = $('#chart-modal');
    var urlPrefix = 'http://prez.dialedin.io/assignments/98/presentation?child_index=';
    var commonChartConfig = {
        width: 600,
        gRootXY: [50, 20],
        tooltipTopAdj: -40
    };

    function fetchSlideUsageHistogramData(callback) {
        d3.json('data/slides_index_frequency.json', function (json) {
            slideUsageData = json;
            callback();
        });
    }

    function fetchUserInteractionScatterplotData(callback) {
        d3.json('data/all_users_presentation_time.json', function (json) {
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

    function fetchUserActivityHistogramData(callback) {
        d3.csv('data/user_view_activity_distribution.csv', function (json) {
            userActivityData = json.map(function (o) {
                return {
                    user_id: o.user_id,
                    count: +o.count
                };
            });
            callback();
        });
    }

    function fetchSlideCommentsUsersHistogramData(callback) {
        d3.csv('data/slide_comments_users.csv', function (json) {
            var slideFreq = {};
            var userFreq = {};
            json.forEach(function (o) {
                if (!slideFreq[o.slide_index]) {
                    slideFreq[o.slide_index] = 1;
                } else {
                    slideFreq[o.slide_index]++;
                }
                if (!userFreq[o.user_id]) {
                    userFreq[o.user_id] = 1;
                } else {
                    userFreq[o.user_id]++;
                }
            });

            slideCommentsData = Object.keys(slideFreq).map(function (k) {
                return {
                    slide_index: k,
                    frequency: slideFreq[k]
                }
            }).sort(function (a, b) {
                return a.frequency === b.frequency ? 0 : (a.frequency > b.frequency ? -1 : 1);
            });

            userCommentsPostData = Object.keys(userFreq).map(function (k) {
                return {
                    user_id: k,
                    frequency: userFreq[k]
                }
            }).sort(function (a, b) {
                return a.frequency === b.frequency ? 0 : (a.frequency > b.frequency ? -1 : 1);
            });

            callback();
        });
    }

    function fetchUserCommentsViewHistogramData(callback) {
        d3.csv('data/view_comments_users.csv', function (json) {
            var userFreq = {};
            json.forEach(function (o) {
                if (!userFreq[o.user_id]) {
                    userFreq[o.user_id] = 1;
                } else {
                    userFreq[o.user_id]++;
                }
            });

            userCommentsViewData = Object.keys(userFreq).map(function (k) {
                return {
                    user_id: k,
                    frequency: userFreq[k]
                }
            }).sort(function (a, b) {
                return a.frequency === b.frequency ? 0 : (a.frequency > b.frequency ? -1 : 1);
            });

            callback();
        });
    }

    function openSlideInNewTab(slideIndex) {
        var url = urlPrefix + slideIndex;
        console.log(url);
        window.open(url);
    }

    function removeAllFromSvg(svgSelector) {
        d3.select(svgSelector+'>*').remove();
        d3.select('.tooltip').style('opacity', 0);
    }

    function drawSlideUsageHistogram() {
        drawHistogram({
            svgSelector: 'svg.chart1',
            data: slideUsageData,
            caption: 'Chart: Usage of slides by all users',
            xKey: 'slide_index',
            yKey: 'frequency',
            onBarClick: openSlideInNewTab
        });
    }

    function drawUserActivityHistogram() {
        function onBarClick(userId) {
            drawUserInteractionScatterplotForUser(userId);
        }
        drawHistogram({
            svgSelector: 'svg.chart2',
            data: userActivityData,
            caption: 'Chart: User activity',
            xKey: 'user_id',
            yKey: 'count',
            onBarClick: onBarClick
        });
    }

    function drawSlideCommentsHistogram() {
        drawHistogram({
            svgSelector: 'svg.chart4',
            data: slideCommentsData,
            caption: 'Chart: Which slides are getting most comments?',
            xKey: 'slide_index',
            yKey: 'frequency',
            onBarClick: openSlideInNewTab
        });
    }

    function drawUserCommentsViewHistogram() {
        drawHistogram({
            svgSelector: 'svg.chart5',
            data: userCommentsViewData,
            caption: 'Chart: Which users are viewing most comments?',
            xKey: 'user_id',
            yKey: 'frequency',
            onBarClick: null
        });
    }

    function drawUserCommentsPostHistogram() {
        drawHistogram({
            svgSelector: 'svg.chart6',
            data: userCommentsPostData,
            caption: 'Chart: Which users are posting most comments?',
            xKey: 'user_id',
            yKey: 'frequency',
            onBarClick: null
        });
    }

    function drawHistogram(params) {
        var svgSelector = params.svgSelector;
        var data = params.data;
        var caption = params.caption;
        var xKey = params.xKey;
        var yKey = params.yKey;
        var onBarClick = params.onBarClick;
        console.log(caption);
        removeAllFromSvg(svgSelector);

        var config = $.extend(commonChartConfig, {
            height: 200,
            colorRange: [d3.rgb("#A1CFFF"), d3.rgb('#0D4285')],
            mouseoverFillColor: 'red'
        });

        function drawChart() {
            function getX(d) { return d[xKey]; }
            function getY(d) { return d[yKey]; }
            var svg = d3.select(svgSelector);
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
                .text(caption);

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
                    },
                    cursor: function (d) {
                        if (onBarClick) {
                            return 'pointer';
                        }
                    }
                })
                .on('mouseover', function (d) {
                    d3.select(this).style('fill', config.mouseoverFillColor);
                    d3.select('.tooltip')
                        .style('left', config.gRootXY[0] + xScale(getX(d)) + 'px')
                        .style('top', ($(svgSelector).offset().top + config.tooltipTopAdj) + 'px')
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
                    onBarClick(getX(d));
                });
        }
        drawChart();
    }

    function drawUserInteractionScatterplotForUser(userId) {
        var params = {
            svgSelector: 'svg.chart3',
            userId: userId,
            data: userInteractionData[userId],
            caption: 'Chart: Interaction of slides by user {userId}',
            xKey: 'delta_time_elpased',
            yKey: 'slide_index',
            onBubbleClick: openSlideInNewTab
        };
        drawUserInteractionScatterplot(params);
        $chartModalEl.modal('show');
    }

    function drawUserInteractionScatterplot(params) {
        var svgSelector = params.svgSelector;
        var userId = params.userId;
        var data = params.data;
        var caption = params.caption.replace('{userId}', userId);
        var xKey = params.xKey;
        var yKey = params.yKey;
        var onBubbleClick = params.onBubbleClick;
        console.log(caption);
        removeAllFromSvg(svgSelector);

        var config = $.extend(commonChartConfig, {
            height: 400,
            bubbleFillColor: '#0D4285',
            dotSize: 4,
            dotR: 2.5,
            mouseoverOutlineColor: 'red'
        });

        function drawChart() {
            function getX(d) { return d[xKey]; }
            function getY(d) { return d[yKey]; }
            var svg = d3.select(svgSelector);
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
                .text(caption);

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
                    fill: config.bubbleFillColor,
                    cursor: function (d) {
                        if (onBubbleClick) {
                            return 'pointer';
                        }
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
                    onBubbleClick(getY(d));
                });

        }
        drawChart();
    }

    fetchSlideUsageHistogramData(function () {
        drawSlideUsageHistogram();
    });
    fetchUserInteractionScatterplotData(function () {});
    fetchUserActivityHistogramData(function () {
        drawUserActivityHistogram();
    });
    fetchSlideCommentsUsersHistogramData(function () {
        drawSlideCommentsHistogram();
        drawUserCommentsPostHistogram();
    });
    fetchUserCommentsViewHistogramData(function () {
        drawUserCommentsViewHistogram();
    });
});
