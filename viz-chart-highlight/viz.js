// Configurable params
// Click on the number and see a magic slider appears to tweak it.
var config = {
    width: 4000,
    height: 380,
    origin: [75, 76],
    textFontSize: 11,
    inactiveBarHeight: 2,
    activityBarWidth: 6,
    anomalyLineThickness: 8
};

// If the data file is foo.csv, then use tributary.foo to read that csv.
// Note: please have no space around comma in the csv file.
// Uncomment this when in tributary
// visualize(tributary.chart_data);

// Comment this when in tributary
d3.csv('chart-data.csv', function (error, json) {
    visualize(json);
});

function visualize(data) {
    // shortening data for debugging
    data = data.slice(0, 500);

    // manage the mapping of facility -> seq nums
    var seqNumSeen = {};

    var maxChartHeight = 0;

    // do some processing of the data
    data.forEach(function (d) {
        d.created_timestamp_epoch = new Date(d.created_timestamp).getTime();
    });

    var tsMinMax = d3.extent(data.map(function (d) {
        return d.created_timestamp_epoch;
    }));

    var xScale = d3.scale.linear()
        .domain(tsMinMax)
        .rangeRound([0, config.width])
        .clamp(true);

    // more processing of the data which needs xScale
    data.forEach(function (d) {
        if (!isNaN(+d.seq_numbers)) {
            var seqNum = d.seq_numbers;
            var service = d.facility;
            if (!seqNumSeen[service]) {
                seqNumSeen[service] = {};
            }
            if (!seqNumSeen[service][seqNum]) {
                seqNumSeen[service][seqNum] = {
                    x1: xScale(d.created_timestamp_epoch),
                    x2: xScale(d.created_timestamp_epoch) + config.activityBarWidth
                };
                return 's' + seqNum + service;
            } else {
                seqNumSeen[service][seqNum].x2 = xScale(d.created_timestamp_epoch) + config.activityBarWidth;
            }

            return '';
        }
    });

    function isValidActivityTypeToShow(d) {
        return d.Activity_type === 'Download';
    }

    var svg = d3.select('svg');

    // Container will scroll if svg is wider
    svg.attr({
        width: config.width
    });

    var gRoot = svg.append('svg:g')
        .attr('transform', 'translate(' + config.origin + ')');

    var maxValue = d3.max(data, function (d) {
        return +d.File_Size;
    });

    var valueScale = d3.scale.linear()
        .domain([0, maxValue])
        .range([0, config.height]);

    var colorScale = d3.scale.linear()
        .domain([0, maxValue])
        .interpolate(d3.interpolateRgb)
        .range(['#0fff53', '#ff3f0a']);


    var barEnter = gRoot.selectAll('.bar')
        .data(data)
        .enter();

    barEnter
        .append('svg:rect')
        .classed('bar', true)
        .attr({
            y: function (d) {
                if (isValidActivityTypeToShow(d)) {
                    return config.height - valueScale(+d.File_Size);
                }
                return config.height - config.inactiveBarHeight;
            },
            x: function (d, i) {
                return xScale(d.created_timestamp_epoch);
            },
            height: 0,
            width: function (d) {
                return config.activityBarWidth;
            },
            fill: function (d) {
                if (isValidActivityTypeToShow(d)) {
                    return colorScale(+d.File_Size);
                }
                return '#777777';
            }

        })
        .attr({
            height: function (d, i) {
                if (isValidActivityTypeToShow(d)) {
                    return valueScale(+d.File_Size);
                }
                return config.inactiveBarHeight;
            }
        })
        .style({
            opacity: 0.6
        });

    //console.log('seqnumseen', seqNumSeen);

    Object.keys(seqNumSeen).forEach(function (service, serviceIndex) {
        var yPos = config.height + 10 + serviceIndex * 20;
        maxChartHeight = yPos;
        var oneSeqLineG = gRoot.append('svg:g')
            .classed('anomaly-seq', true);

        // service name as label at the start of the sequence line
        oneSeqLineG
            .append('svg:text')
            .attr({
                x: 0,
                y: yPos + 4
            })
            .style({
                'font-size': config.textFontSize,
                'text-anchor': 'end'
            })
            .text(service);

        // background line behind the bands
        oneSeqLineG.append('svg:line')
            .attr({
                x1: 0,
                y1: yPos,
                x2: config.width,
                y2: yPos
            })
            .style({
                stroke: '#eee',
                'stroke-width': config.anomalyLineThickness,
                'stroke-opacity': 0.9
            });

        Object.keys(seqNumSeen[service]).forEach(function (key) {
            var lineData = seqNumSeen[service][key];

            // one segment
            oneSeqLineG.append('svg:line')
                .attr({
                    x1: lineData.x1,
                    y1: yPos,
                    x2: lineData.x2,
                    y2: yPos
                })
                .style({
                    stroke: '#1aaafd',
                    'stroke-width': config.anomalyLineThickness,
                    'stroke-opacity': 0.6
                });

            // seq number below the segment
            oneSeqLineG.append('svg:text')
                .attr({
                    x: lineData.x1,
                    y: yPos + config.anomalyLineThickness + 3
                })
                .style({
                    'font-size': 9,
                    'text-anchor': 'start'
                })
                .text(key);
        });
    });

    // vertical scanner line that moves with mouse
    var scannerLine = gRoot.append('svg:g');
    scannerLine
        .append('svg:line')
        .attr({
            x1: 0,
            y1: 0,
            x2: 0,
            y2: maxChartHeight + 30
        })
        .style({
            stroke: '#aaa',
            'stroke-width': 1,
            'stroke-opacity': 0.6
        });
    var scannerLineLabel = scannerLine.append('svg:text')
        .attr({
            x: 5,
            y: maxChartHeight + 30
        });

    function updateScannerLineLabel(mouseX) {
        var scannedBarsInfo = {};
        var bars = gRoot.selectAll('.bar');
        bars.each(function (d) {
            if (!isValidActivityTypeToShow(d)) {
                return;
            }
            var x = xScale(d.created_timestamp_epoch);
            if (mouseX >= x && mouseX <= x + config.activityBarWidth) {
                if (Object.keys(scannedBarsInfo).indexOf(d.facility) === -1) {
                    scannedBarsInfo[d.facility] = {d: +d.File_Size, s: +d.seq_numbers};
                }
                d3.select(this)
                    .style({
                        stroke: '#000',
                        'stroke-width': 3
                    });
            } else {
                d3.select(this)
                    .style({
                        'stroke-width': 0
                    });
            }
        });
        scannerLineLabel.text(JSON.stringify(scannedBarsInfo));
    }

    var mouseMoveThrottleTimer = null;
    svg.on('mousemove', function () {
        var coords = d3.mouse(this);
        var mouseX = coords[0] - config.origin[0];
        scannerLine.attr('transform', 'translate('+ mouseX + ',0)');

        clearTimeout(mouseMoveThrottleTimer);
        mouseMoveThrottleTimer= setTimeout(updateScannerLineLabel.bind(null, mouseX), 30);
    });
}
