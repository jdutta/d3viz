// Custom viz for people and projects
// Show projects in the middle and teams/people on either side

// Configurable params
// Click on the number and see a magic slider appears to tweak it.
var config = {
    width: 800,
    height: 800,
    categoryRectWidth: 150,
    categoryRectHeight: 30,
    personRectWidth: 120,
    personRectHeight: 20,
    personRectGap: 25,
    imageSize: 40,
    paddingForImage: 50,
    leftColLocation: 'sjc',
    defaultImgUrl: 'https://assets3.assembla.com/assets/avatars/big/8-b25e82266d6568a6bcd262c5630fe562.png'
};

d3.json('data.json', function (error, json) {
    processDataForViz(json, config);
    visualize(json);
});

function isLeftColPerson(p) {
    return (p.locid === config.leftColLocation);
}

function processDataForViz(data, config) {
    var catList = [];
    Object.keys(data.categoriesMap).forEach(function (k, i) {
        var cat = data.categoriesMap[k];
        cat.id = k;
        cat.index = i;
        cat.x = config.width / 2 - config.categoryRectWidth / 2;
        cat.y = i * (config.categoryRectHeight + 5);
        catList.push(cat);
    });

    var locList = [];
    Object.keys(data.locationsMap).forEach(function (k) {
        var loc = data.locationsMap[k];
        loc.id = k;
        locList.push(loc);
    });

    var links = [];
    var indexForLoc = {};
    data.people.forEach(function (p, i) {
        p.index = i;
        indexForLoc[p.locid] = indexForLoc[p.locid] || 0;
        p.x = config.paddingForImage;
        if (!isLeftColPerson(p)) {
            p.x = config.width - config.personRectWidth - config.paddingForImage;
        }
        p.y = indexForLoc[p.locid] * (config.personRectHeight + config.personRectGap);
        indexForLoc[p.locid]++;

        p.cats.forEach(function (catId) {
            var cat = data.categoriesMap[catId];
            // link connection points at the edge of person nodes (rectangles)
            var source = {
                index: p.index,
                x: isLeftColPerson(p) ? p.x + config.personRectWidth : p.x,
                y: p.y + config.personRectHeight / 2
            };
            var target = {
                index: cat.index,
                x: isLeftColPerson(p) ? cat.x : cat.x + config.categoryRectWidth,
                y: cat.y + config.categoryRectHeight / 2
            };
            links.push({source: source, target: target});
        });
    });

    data.categoriesList = catList;
    data.locationsList = locList;
    data.links = links;
}

function visualize(data) {

    var svg = d3.select('svg');
    var gRoot = svg.append('svg:g')
        .attr('transform', 'translate(20, 100)');

    var diagonal = d3.svg.diagonal();

    var gCat = gRoot.selectAll('.category-node')
        .data(data.categoriesList)
        .enter()
        .append('svg:g')
        .attr('class', function (d) {
            return 'category-node category-'+d.index;
        })
        .attr('transform', function (d, i) {
            return 'translate('+[d.x, d.y]+')';
        })
        .on('mouseenter', function (d) {
            d3.select(this).classed('active', true);
            d3.selectAll('path.link-to-' + d.index)
                .classed('active', true)
                .moveToFront();
            data.links.forEach(function (link) {
                if (link.target.index === d.index) {
                    d3.select('.person-'+link.source.index).classed('active', true);
                }
            });
        })
        .on('mouseleave', function (d) {
            d3.selectAll('.person-node').classed('active', false);
            d3.selectAll('.category-node').classed('active', false);
            d3.selectAll('path.link-to-' + d.index)
                .classed('active', false)
                .moveToFront();
        });

    gCat
        .append('svg:rect')
        .attr('width', config.categoryRectWidth)
        .attr('height', config.categoryRectHeight);

    gCat
        .append('svg:text')
        .attr('x', 5)
        .attr('y', 16)
        .text(function (d) {
            return d.name;
        });

    var gPerson = gRoot.selectAll('.person-node')
        .data(data.people)
        .enter()
        .append('svg:g')
        .attr('class', function (d) {
            return 'person-node person-'+d.index;
        })
        .attr('transform', function (d, i) {
            return 'translate('+[d.x, d.y]+')';
        })
        .on('mouseenter', function (d) {
            d3.select(this).classed('active', true);
            d3.selectAll('path.link-from-' + d.index).classed('active', true);
            data.links.forEach(function (link) {
                if (link.source.index === d.index) {
                    d3.select('.category-'+link.target.index).classed('active', true);
                }
            });
        })
        .on('mouseleave', function (d) {
            d3.selectAll('.person-node').classed('active', false);
            d3.selectAll('.category-node').classed('active', false);
            d3.selectAll('path.link-from-' + d.index).classed('active', false);
        });

    gPerson
        .append('svg:rect')
        .attr('width', config.personRectWidth)
        .attr('height', config.personRectHeight);

    gPerson
        .append('svg:text')
        .attr('x', 5)
        .attr('y', 11)
        .text(function (d) {
            return d.name;
        });

    gPerson.append('svg:image')
        .attr('xlink:href', function (d) {
            return d.imgUrl || config.defaultImgUrl
        })
        .attr('x', function (d) {
            return isLeftColPerson(d) ? -config.imageSize - 3 : config.personRectWidth + 3;
        })
        .attr('y', -(config.imageSize - config.personRectHeight)/2)
        .attr('width', config.imageSize)
        .attr('height', config.imageSize)

    var gLink = gRoot.selectAll('.link')
        .data(data.links)
        .enter()
        .append('svg:path')
        .attr('d', diagonal)
        .attr('class', function (d) {
            return 'link link-from-' + d.source.index + ' link-to-' + d.target.index;
        });
}

d3.selection.prototype.moveToFront = function() {
    return this.each(function() {
        this.parentNode.appendChild(this);
    });
};

