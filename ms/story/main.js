$(document).ready(function () {

    var config = {
        width: 600,
        height: 500,
        nBubbles: 400,
        gRootXY: [60, 0],
        bubbleR: 5,
        bubbleRadiusRange: [3, 10],
        bubbleUserColor: '#444',
        bubbleCategoryColor: d3.scale.category10(),
        bubbleFillColor: '#ddd',
        bubbleStrokeColor: '#ccc',
        bubbleStrokeWidthMax: 2,
        slideIconSize: 5
    };
    var rScale;
    var catToGravityCenterScale;
    var force;
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
        catToGravityCenterScale = d3.scale.ordinal()
            .domain(d3.range(nCats))
            .rangeRoundPoints([0, config.width], 0.7);
        var data = d3.range(n).map(function (i) {
            return {
                id: i,
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

        force = d3.layout.force()
            .nodes(data.data, function (d) { return d.id; })
            .links([])
            .size([config.width, config.height])
            .gravity(0.1)
            .charge(function (d, i) {
                return -30;
            })
            .on('tick', tick)
            .start();

        var bubbles = gRoot.selectAll('.bubble')
            .data(data.data, function (d) { return d.id; })
            .enter()
            .append('svg:g')
            .classed('bubble', true)
            .attr({
                transform: function (d) {
                    return 'translate(' + [d.x, d.y] + ')';
                }
            })
            .call(force.drag);

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

        /*
        if (params.reset) {
            circle.style({
                stroke: config.bubbleStrokeColor,
                'stroke-width': 1
            });
            return;
        }
        */

        // filter data first
        var data = params.data.data.filter(function (d) {
            return (d.user === params.userId);
        });
        params.data.dataForUser = data;
        var updateSel = gRoot.selectAll('.bubble')
            .data(data, function (d) { return d.id; });
        var nItemsRemoved = params.data.data.length - data.length;

        updateSel
            .select('circle')
            .transition()
            .duration(300)
            .delay(function (d, i) {
                return i*3;
            })
            .style({
                stroke: config.bubbleUserColor,
                'stroke-width': config.bubbleStrokeWidthMax
            });

        updateSel
            .exit()
            .transition()
            .duration(100)
            .delay(function (d, i) {
                return 500+i*3;
            })
            .style({
                opacity: 0
            })
            .remove()
            .each('end', function () {
                nItemsRemoved--;
                if (!nItemsRemoved) {
                    force.nodes(data, function (d) {
                        return d.id;
                    });
                    force.start();
                }
            });
    }

    function showBubbleCategoriesForUser(params) {
        var gRoot = d3.select('svg > g');
        var circle = gRoot.selectAll('.bubble circle');
        var data = params.data.dataForUser || params.data.data;
        var nItems = data.length;
        var updateSel = gRoot.selectAll('.bubble')
            .data(data, function (d) { return d.id; });

        // See: https://bl.ocks.org/mbostock/1804919
        function tick(e) {
            if (e.alpha < 0.001) {
                force.stop();
                return;
            }

            updateSel
                .each(gravity(.2 * e.alpha))
                //.each(collide(.5))
                .attr('transform', function (d) { return 'translate('+[d.x, d.y] +')'; });
        }

        // Move nodes toward cluster focus.
        function gravity(alpha) {
            return function(d) {
                d.y += (config.height/2 - d.y) * alpha;
                d.x += (catToGravityCenterScale(d.cat) - d.x) * alpha;
            };
        }

        /*
        if (params.reset) {
            circle.style({
                fill: config.bubbleFillColor
            });
            return;
        }
        */

        updateSel
            .select('circle')
            .transition()
            .duration(300)
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
            })
            .each('end', function () {
                nItems--;
                if (!nItems) {
                    force
                        .charge(-100)
                        .on('tick', tick)
                        .start();
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
            showBubbleCategoriesForUser({userId: 1, data: data});
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
