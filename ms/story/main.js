$(document).ready(function () {

    var config = {
        width: 600,
        height: 500,
        nBubbles: 300,
        gRootXY: [60, 0],
        bubbleR: 5,
        bubbleRadiusRange: [5, 8],
        bubbleUserColor: '#444',
        bubbleCategoryColor: d3.scale.category10(),
        bubbleFillColor: '#ddd',
        bubbleStrokeColor: '#ccc',
        bubbleStrokeWidthMax: 2,
        slideIconSize: 5
    };
    var rScale;
    var tooltipSelector = '.tooltip';
    var data;

    function removeAllFromSvg() {
        d3.select('svg>*').remove();
        d3.select(tooltipSelector).style({display: 'none'});
    }

    function createData(n, slidesFrac, nUsers, nCats) {
        slidesFrac = slidesFrac || 0.5;
        nUsers = nUsers || 3;
        nCats = nCats || 3;
        var data = d3.range(n).map(function () {
            return {
                slide: (Math.random() < slidesFrac),
                user: getRandom(nUsers),
                cat: getRandom(nCats)
            };
        });
        return {
            meta: {
                nUsers: nUsers,
                nCats: nCats
            },
            data: data
        };
    }

    function getRandom(n) {
        return Math.floor(Math.random() * n)
    }

    function drawBubbles(data) {
        removeAllFromSvg();

        var svg = d3.select('svg');
        var gRoot = svg.append('svg:g')
            .attr('transform', 'translate('+config.gRootXY+')');

        rScale = d3.scale.linear()
            .domain([0, data.meta.nCats - 1])
            .rangeRound(config.bubbleRadiusRange);

        var force = d3.layout.force()
            .nodes(data.data)
            .links([])
            .size([config.width, config.height])
            .gravity(0.1)
            .charge(function (d, i) {
                return -30;
            })
            .on('tick', tick)
            .start();

        var bubbles = gRoot.selectAll('.bubble')
            .data(data.data)
            .enter()
            .append('svg:g')
            .classed('bubble', true)
            .attr({
                transform: function (d, i) {
                    return 'translate(' + [d.x, d.y] + ')';
                }
            });

        bubbles
            .append('svg:circle')
            .attr({
                cx: 0,
                cy: 0,
                r: function (d) {
                    return rScale(d.cat);
                }
            })
            .style({
                fill: config.bubbleFillColor,
                stroke: config.bubbleStrokeColor
            });

        function tick(e) {
            if (e.alpha < 0.001) {
                force.stop();
                return;
            }

            bubbles.attr('transform', function (d) { return 'translate('+[d.x, d.y] +')'; });
        }
    }

    function showBubblesForUser(params) {
        var gRoot = d3.select('svg > g');
        var circle = gRoot.selectAll('.bubble circle');

        if (params.reset) {
            circle.style({
                stroke: config.bubbleStrokeColor,
                'stroke-width': 1
            });
            return;
        }

        /*
        // filter data first
        var data = params.data.data.filter(function (d) {
            return (d.user === params.userId);
        });
        gRoot.selectAll('.bubble')
            .data(data)
            .select('circle')
            .style({
                stroke: config.bubbleUserColor,
                'stroke-width': config.bubbleStrokeWidthMax
            });

        return;
        //*/

        circle
            .transition()
            .duration(100)
            .delay(function (d, i) {
                return i*3;
            })
            .style({
                stroke: function (d) {
                    if (d.user === params.userId) {
                        return config.bubbleUserColor;
                    }
                    return config.bubbleStrokeColor;
                },
                'stroke-width': function (d) {
                    return (d.user === params.userId) ? config.bubbleStrokeWidthMax : 1;
                }
            });
    }

    function showBubbleCategoriesForUser(params) {
        var gRoot = d3.select('svg > g');
        var circle = gRoot.selectAll('.bubble circle');

        if (params.reset) {
            circle.style({
                fill: config.bubbleFillColor
            });
            return;
        }

        circle
            .transition()
            .duration(100)
            .delay(function (d, i) {
                return i*3;
            })
            .style({
                fill: function (d) {
                    if (d.user === params.userId) {
                        return config.bubbleCategoryColor(d.cat);
                    }
                    return config.bubbleFillColor;
                }
            });
    }

    function showSlideTypeIcon(params) {
        var gRoot = d3.select('svg > g');
        var gBubble = gRoot.selectAll('.bubble');

        gBubble
            .append('svg:rect')
            .classed('type-slide', true)
            .classed('hide', function (d) {
                return !d.slide; // todo consider removing element
            })
            .attr({
                x: function (d) {
                    return rScale(d.cat)+config.bubbleStrokeWidthMax;
                },
                y: function (d) {
                    return -config.slideIconSize/2;
                },
                width: function (d) {
                    return d.slide ? config.slideIconSize : 0;
                },
                height: function (d) {
                    return d.slide ? config.slideIconSize : 0;
                }
            })
            .on('click', function (d) {
                d3.select(tooltipSelector)
                    .style('left', (config.width/2 - 200) + 'px')
                    .style('top', (config.height/2 - 100) + 'px')
                    .style({
                        left: (config.width/2 - 200) + 'px',
                        top: (config.height/2 - 150) + 'px',
                        width: 400,
                        height: 300,
                        opacity: 1, // why?
                        display: 'block'
                    })
                    .html('<img src="assets/img/classroom.png" />');
            });

    }

    function setUpActionHandlers() {
        $(tooltipSelector).click(function () {
            $(tooltipSelector).hide();
        });
        $('.action-1').click(function () {
            showBubblesForUser({userId: 1, data: data});
        });
        $('.action-2').click(function () {
            showBubbleCategoriesForUser({userId: 1});
        });
        $('.action-3').click(function () {
            showSlideTypeIcon({});
        });
    }

    data = createData(config.nBubbles);
    console.log(data);
    setUpActionHandlers();
    drawBubbles(data);
});
