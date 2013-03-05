
/**
Copyright (c) 2010 Dennis Hotson
Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:
The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
*/
(function () {

    //var Vector, Renderer, Layout, Graph, mapHandler;





    jQuery.fn.springy = function (params) {
        var graph = this.graph = params.graph || new Graph();

        var stiffness = params.stiffness || 400.0;
        var repulsion = params.repulsion || 500.0;
        var damping = params.damping || 0.5;

        var colourScheme = params.colourScheme;

        var canvas = this[0];
        var ctx = canvas.getContext("2d");

        var tree = params.data;

        var year = 1660;


        var clearFunction = function (map) {
            // var map = this.map;
            ctx.clearRect(0, 0, map.graph_width, map.graph_height);
        };

        var drawEdges = function (map, edge, p1, p2) {

            //  var map = this.map;
            var _utils = new Utils(map.currentBB, map.graph_width, map.graph_height);

            var x1 = map.mapOffset(_utils.toScreen(p1)).x;
            var y1 = map.mapOffset(_utils.toScreen(p1)).y;

            var x2 = map.mapOffset(_utils.toScreen(p2)).x;
            var y2 = map.mapOffset(_utils.toScreen(p2)).y;


            if (!map.validToDraw(x1, y1)) return;
            if (!map.validToDraw(x2, y2)) return;


            var direction = new Vector(x2 - x1, y2 - y1);

            // negate y
            var normal = direction.normal().normalise();

            var from = graph.getEdges(edge.source, edge.target);
            var to = graph.getEdges(edge.target, edge.source);

            var total = from.length + to.length;

            // Figure out edge's position in relation to other edges between the same nodes
            var n = 0;
            for (var i = 0; i < from.length; i++) {
                if (from[i].id === edge.id) {
                    n = i;
                }
            }

            var spacing = 6.0;

            // Figure out how far off center the line should be drawn
            var offset = normal.multiply(-((total - 1) * spacing) / 2.0 + (n * spacing));



            var s1 = map.mapOffset(_utils.toScreen(p1).add(offset));
            var s2 = map.mapOffset(_utils.toScreen(p2).add(offset));


            var boxWidth = edge.target.getWidth(ctx);
            var boxHeight = edge.target.getHeight(ctx);

            var intersection = _utils.intersect_line_box(s1, s2, { x: x2 - boxWidth / 2.0, y: y2 - boxHeight / 2.0 }, boxWidth, boxHeight);

            if (!intersection) {
                intersection = s2;
            }

            var arrowWidth;
            var arrowLength;

            var weight = typeof (edge.data.weight) !== 'undefined' ? edge.data.weight : 1.0;

            ctx.lineWidth = Math.max(weight * 2, 0.1);
            arrowWidth = 10 + ctx.lineWidth;
            arrowLength = 10;


            var stroke = '';
            if (edge.data.type == 'data') {
                stroke = map.colourScheme.infoLineColour;
            }
            else {
                var averagedesc = (edge.source.data.person.currentDescendantCount + edge.target.data.person.currentDescendantCount) / 2;
                stroke = _utils.getLevel(300, averagedesc, map.colourScheme.normalLineGradient);
            }

            ctx.strokeStyle = stroke;
            ctx.beginPath();
            ctx.moveTo(s1.x, s1.y);
            ctx.lineTo(s2.x, s2.y);
            ctx.stroke();

            // arrow
            var distance = s1.distance(s2);
            var directional = typeof (edge.data.directional) !== 'undefined' ? edge.data.directional : true;
            if (directional && distance > 75) {
                ctx.save();
                ctx.fillStyle = stroke;

                ctx.translate((intersection.x + s1.x) / 2, (intersection.y + s1.y) / 2);

                ctx.rotate(Math.atan2(y2 - y1, x2 - x1));
                ctx.beginPath();
                ctx.moveTo(-arrowLength, arrowWidth);
                ctx.lineTo(0, 0);
                ctx.lineTo(-arrowLength, -arrowWidth);
                ctx.lineTo(-arrowLength * 0.8, -0);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }



        };

        var drawNodes = function (map, node, p) {

            //       if (node.data.type != undefined && node.data.type == 'infonode') return;

            //  var map = this.map;
            var _utils = new Utils(map.currentBB, map.graph_width, map.graph_height);

            var x1 = map.mapOffset(_utils.toScreen(p)).x;
            var y1 = map.mapOffset(_utils.toScreen(p)).y;

            if (!map.validToDraw(x1, y1)) return;

            var s = map.mapOffset(_utils.toScreen(p));

            ctx.save();

            if (node.data.type != undefined && node.data.type == 'infonode') {
                _utils.drawText(map, ctx, s.x, s.y, node.data.label, node.data.type, this.layout.getSelection(node));

            }
            else {



                _utils.star(map, ctx, s.x, s.y, 10, 5, 0.4, false, node.data.type, this.layout.getSelection(node));

                if (node.data.person != undefined) {
                    if (node.data.person.DescendentCount > 10 && _utils.validDisplayPeriod(node.data.person.DOB, year, 20)) {
                        _utils.drawText(map, ctx, s.x, s.y, node.data.person.Name + ' ' + node.data.person.currentDescendantCount, node.data.type, this.layout.getSelection(node));
                    }
                }

            }

            ctx.restore();
        };





        var myVar = setInterval(function () { myTimer() }, 3000);

        var layoutList = new Array();

        var added = false;

        function myTimer() {

            $('#map_year').html(year);


            tree.populateGraph(year, graph);

            if (tree.data.Generations[1][0].nodeLink) {
                if(!added)
                    layoutList.push({ layout: createSubLayout(tree.data.Generations[1][0].nodeLink), edges: drawEdges, nodes: drawNodes });

                added = true;
            }

             
            year += 5;
            if (year == '2000') myStopFunction();
        }


        function myStopFunction() {
            clearInterval(myVar);
        }



        $('body').css("background-color", colourScheme.mapbackgroundColour);



        var _layout = this.layout = new Layout.ForceDirected(graph, new mapHandler(colourScheme, 1500, 1000), stiffness, repulsion, damping);

        //layoutList.push(layout);

        layoutList.push({ layout: _layout, edges: drawEdges, nodes: drawNodes });

        var createSubLayout = function (entry) {

            var infoGraph = new Graph();

            if (entry.data.person.Name != '') {
                var nameNode = infoGraph.newNode({
                    label: 'Name:' + entry.data.person.Name,
                    parentId: entry.data.person.PersonId,
                    type: 'infonode'
                });

                infoGraph.newEdge(entry, nameNode, { type: 'data', directional: false });
            }

            if (entry.data.person.DOB != '') {
                var dobNode = infoGraph.newNode({
                    label: 'DOB:' + entry.data.person.DOB,
                    parentId: entry.data.person.PersonId,
                    type: 'infonode'
                });

                infoGraph.newEdge(entry, dobNode, { type: 'data', directional: false });
            }

            if (entry.data.person.DOD != '') {
                var dodNode = infoGraph.newNode({
                    label: 'DOD:' + entry.data.person.DOD,
                    parentId: entry.data.person.PersonId,
                    type: 'infonode'
                });

                infoGraph.newEdge(entry, dodNode, { type: 'data', directional: false });
            }

            if (entry.data.person.BirthLocation != '') {
                var blocNode = infoGraph.newNode({
                    label: 'Birth Location:' + entry.data.person.BirthLocation,
                    parentId: entry.data.person.PersonId,
                    type: 'infonode'
                });

                infoGraph.newEdge(entry, blocNode, { type: 'data', directional: false });
            }

            if (entry.data.person.DeathLocation != '') {
                var dlocNode = infoGraph.newNode({
                    label: 'Death Location:' + entry.data.person.DeathLocation,
                    parentId: entry.data.person.PersonId,
                    type: 'infonode'
                });

                infoGraph.newEdge(entry, dlocNode, { type: 'data', directional: false });
            }

            return new Layout.ForceDirected(infoGraph, new mapHandler(colourScheme, 400, 400), stiffness, repulsion, damping, entry);


        };



        var _dir = '';

        // auto adjusting bounding box
        Layout.requestAnimationFrame(function adjust() {
            layoutList.forEach(function (value, index, ar) {
                value.layout.mapHandler.adjustPosition(_dir);
            });
            Layout.requestAnimationFrame(adjust);
        });


        jQuery(canvas).mousedown(function (e) {
             
            layoutList.forEach(function (value, index, ar) {
                $.proxy(value.layout.mouseDown(e), value);
            });


            combinedRenderer.start();
        }).mouseup(function () {
            
            layoutList.forEach(function (value, index, ar) {
                value.layout.mouseUp();
            });
        });

        $(".button_box").mousedown(function (evt) {
            console.log('button mouse down');

            //mouseup = false;

            if (evt.target.id == "up") _dir = 'UP';
            if (evt.target.id == "dn") _dir = 'DOWN';
            if (evt.target.id == "we") _dir = 'WEST';
            if (evt.target.id == "no") _dir = 'NORTH';
            if (evt.target.id == "es") _dir = 'EAST';
            if (evt.target.id == "so") _dir = 'SOUTH';
            if (evt.target.id == "de") _dir = 'DEBUG';

        }).mouseup(function () {
            //mouseup = true;
            _dir = '';
        });


        jQuery(canvas).mousemove(function (e) {
         
            layoutList.forEach(function (value, index, ar) {
                $.proxy(value.layout.mouseMove(e), value);
            });
            combinedRenderer.start();
        });

        var combinedRenderer = new CombinedRenderer(clearFunction, layoutList);

        combinedRenderer.start();

        return this;
    }



})();
