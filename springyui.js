
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
        var nodeSelected = params.nodeSelected || null;

        var canvas = this[0];
        var ctx = canvas.getContext("2d");

        var data = params.data;




        var myVar;
        var year = 1660;

        var addedPeople = new Array();

        var myVar = setInterval(function () { myTimer() }, 3000);

        function myTimer() {

            $('#map_year').html(year);

            var genIdx = 0;

            while (genIdx < 8) {

                var personIdx = 0;
                var genArray = new Array();


                while (personIdx < data.Generations[genIdx].length) {

                    var currentPerson = data.Generations[genIdx][personIdx];

                    if (!currentPerson.IsHtmlLink) {
                        var descriptor = '.'; // currentPerson.DOB + ' ' + currentPerson.Name;


                        // add the person to the graph if he/she was born in the current time period
                        var _dob = data.Generations[genIdx][personIdx].DOB;
                        if (_dob == (year - 4) || _dob == (year - 3) || _dob == (year - 2) || _dob == (year - 1) || _dob == year) {

                            var personPresent = false;
                            addedPeople.forEach(function (entry) {
                                if (entry == data.Generations[genIdx][personIdx].PersonId) {
                                    personPresent = true;

                                }
                            });

                            if (!personPresent) {
                                if (data.Generations[genIdx][personIdx].nodeLink == undefined || data.Generations[genIdx][personIdx].nodeLink == null) {



                                    addedPeople.push(data.Generations[genIdx][personIdx].PersonId);

                                    data.Generations[genIdx][personIdx].nodeLink = graph.newNode({ label: descriptor, person: data.Generations[genIdx][personIdx] });
                                }


                                if (genIdx > 0) {
                                    var fatherNode = data.Generations[genIdx - 1][currentPerson.FatherIdx].nodeLink;
                                    graph.newEdge(fatherNode, currentPerson.nodeLink, { type: 'person', color: '#99CCFF' });
                                }

                            }
                            else {
                                console.log('person present');
                            }
                        }


                        // count how many desendants this person has in the diagram already.
                        if (data.Generations[genIdx][personIdx].nodeLink != undefined
                         && data.Generations[genIdx][personIdx].nodeLink.data.person != undefined)
                            data.Generations[genIdx][personIdx].nodeLink.data.person.currentDescendantCount = countDescendants(data, genIdx, personIdx);
                    }

                    personIdx++;
                }

                genIdx++;
            }



            // compute current number of descendants









            year += 5;


            if (year == '2000') myStopFunction();
        }


        function countDescendants(data, genidx, personidx) {

            //   var genIdx = 0;

            var stack = new Array();
            var count = 0;
            stack.push(data.Generations[genidx][personidx]);


            while (stack.length > 0) {

                var current = stack.pop();
                count++;
                var personIdx = 0;

                var nextGen = current.GenerationIdx + 1;

                if (nextGen < data.Generations.length) {

                    while (personIdx < data.Generations[nextGen].length) {
                        if (data.Generations[nextGen][personIdx].FatherId == current.PersonId &&
                        data.Generations[nextGen][personIdx].nodeLink != undefined)
                            stack.push(data.Generations[nextGen][personIdx]);

                        personIdx++;
                    }

                }
                //  genIdx++;
            }

            return count;
        }

        function myStopFunction() {
            clearInterval(myVar);
        }


        var layout = this.layout = new Layout.ForceDirected(graph, stiffness, repulsion, damping);

        // calculate bounding box of graph layout.. with ease-in
        //     var currentBB = layout.getBoundingBox();
        var targetBB = { bottomleft: new Vector(-2, -2), topright: new Vector(2, 2) };
        var mouseup = true;
        var _dir = '';




        var fdMapHandler = new mapHandler(layout);

        // auto adjusting bounding box
        Layout.requestAnimationFrame(function adjust() {
            targetBB = layout.getBoundingBox();

            // current gets 20% closer to target every iteration
            fdMapHandler.zoomCurrentBB(targetBB, 10);

            while (fdMapHandler.mouseQueue.length > 0) {
                var _point = fdMapHandler.mouseQueue.shift();
                fdMapHandler.SetCentrePoint(_point[0], _point[1]);
            }

            fdMapHandler.UpdatePosition(_dir);

            // iterate through on screen nodes
            // and add information 

            fdMapHandler.onscreenNodes(20);


            Layout.requestAnimationFrame(adjust);
        });

        // convert to/from screen coordinates


        // half-assed drag and drop
        var selected = null;
        var nearest = null;
        var dragged = null;

        jQuery(canvas).mousedown(function (e) {
            jQuery('.actions').hide();

            var pos = jQuery(this).offset();

            mouseup = false;

            var p = fdMapHandler.currentPositionFromScreen(pos, e);    // fromScreen({ x: (e.pageX - centrePoint) - pos.left, y: (e.pageY - centreVerticalPoint) - pos.top });

            selected = nearest = dragged = layout.nearest(p);

            if (selected.node !== null) {
                dragged.point.m = 10000.0;

                if (nodeSelected) {
                    nodeSelected(selected.node);
                }
            }

            renderer.start();

        }).mouseup(function () {
            mouseup = true;
            fdMapHandler.addToMouseQueue(1000000, 1000000);
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
            var pos = jQuery(this).offset();
            var p = fdMapHandler.currentPositionFromScreen(pos, e);

            if (!mouseup && selected.node === null) {
                fdMapHandler.addToMouseQueue(e.clientX, e.clientY);
            }

            nearest = layout.nearest(p);

            if (dragged !== null && dragged.node !== null) {
                dragged.point.p.x = p.x;
                dragged.point.p.y = p.y;
            }

            renderer.start();
        });

        jQuery(window).bind('mouseup', function (e) {
            dragged = null;
        });

        Node.prototype.getWidth = function () {
            var text = typeof (this.data.label) !== 'undefined' ? this.data.label : this.id;
            if (this._width && this._width[text])
                return this._width[text];

            ctx.save();
            ctx.font = "16px Verdana, sans-serif";
            var width = ctx.measureText(text).width + 10;
            ctx.restore();

            this._width || (this._width = {});
            this._width[text] = width;

            return width;
        };

        Node.prototype.getHeight = function () {
            return 20;
        };




        var renderer = new Renderer(1, fdMapHandler, layout,
            function () {
                var map = this.map;
                ctx.clearRect(0, 0, map.graph_width, map.graph_height);
            },


            function (edge, p1, p2) {


                var map = this.map;
                var _utils = new Utils(this.map.currentBB, map.graph_width, map.graph_height);

                var x1 = map.mapOffset(_utils.toScreen(p1)).x;
                var y1 = map.mapOffset(_utils.toScreen(p1)).y;

                var x2 = map.mapOffset(_utils.toScreen(p2)).x;
                var y2 = map.mapOffset(_utils.toScreen(p2)).y;


                if (!map.validToDraw(x1, y1)) return;
                if (!map.validToDraw(x2, y2)) return;


                var direction = new Vector(x2 - x1, y2 - y1);
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


                var boxWidth = edge.target.getWidth();
                var boxHeight = edge.target.getHeight();

                var intersection = _utils.intersect_line_box(s1, s2, { x: x2 - boxWidth / 2.0, y: y2 - boxHeight / 2.0 }, boxWidth, boxHeight);

                if (!intersection) {
                    intersection = s2;
                }



                var arrowWidth;
                var arrowLength;

                var weight = typeof (edge.data.weight) !== 'undefined' ? edge.data.weight : 1.0;

                ctx.lineWidth = Math.max(weight * 2, 0.1);
                arrowWidth = 1 + ctx.lineWidth;
                arrowLength = 8;

                var directional = typeof (edge.data.directional) !== 'undefined' ? edge.data.directional : true;

                // line
                var lineEnd;
                if (directional) {
                    lineEnd = intersection.subtract(direction.normalise().multiply(arrowLength * 0.5));
                } else {
                    lineEnd = s2;
                }


                if (edge.data.type == 'data') {

                    var stroke = typeof (edge.data.color) !== 'undefined' ? edge.data.color : '#000000';

                    ctx.strokeStyle = stroke;
                }
                else {
                    var grad = ctx.createLinearGradient(s1.x, s1.y, lineEnd.x, lineEnd.y);
                    grad.addColorStop(0, "#0066FF");
                    grad.addColorStop(1, "white");

                    ctx.strokeStyle = grad;
                }

                ctx.beginPath();
                ctx.moveTo(s1.x, s1.y);
                ctx.lineTo(lineEnd.x, lineEnd.y);
                ctx.stroke();

                // arrow
                if (directional) {
                    ctx.save();
                    ctx.fillStyle = stroke;
                    ctx.translate(intersection.x, intersection.y);
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

                // label
                if (typeof (edge.data.label) !== 'undefined') {
                    var text = edge.data.label
                    ctx.save();
                    ctx.textAlign = "center";
                    ctx.textBaseline = "top";
                    ctx.font = "10px Helvetica, sans-serif";
                    ctx.fillStyle = "#5BA6EC";
                    ctx.fillText(text, (x1 + x2) / 2, (y1 + y2) / 2);
                    ctx.restore();
                }

            },

            function (node, p) {

                var map = this.map;
                var _utils = new Utils(this.map.currentBB, map.graph_width, map.graph_height);

                var x1 = map.mapOffset(_utils.toScreen(p)).x;
                var y1 = map.mapOffset(_utils.toScreen(p)).y;

                if (!map.validToDraw(x1, y1)) return;

                var s = map.mapOffset(_utils.toScreen(p));

                ctx.save();

                var boxWidth = 20; // node.getWidth();
                var boxHeight = 20; // node.getHeight();


                if (node.data.type != undefined && node.data.type == 'infonode') {
                    boxWidth = node.getWidth();
                    boxHeight = node.getHeight();
                    ctx.clearRect(s.x - boxWidth / 2, s.y - 10, boxWidth, 20);

                    // fill background
                    if (selected !== null && selected.node !== null && nearest.node !== null && selected.node.id === node.id) {
                        ctx.fillStyle = "Red";
                    } else if (nearest !== null && nearest.node !== null && nearest.node.id === node.id) {
                        ctx.fillStyle = "Green";
                    } else {
                        ctx.fillStyle = "#000000";
                    }


                    ctx.fillRect(s.x - boxWidth / 2, s.y - 10, boxWidth, 20);


                    ctx.textAlign = "left";
                    ctx.textBaseline = "top";
                    ctx.font = "16px Verdana, sans-serif";
                    ctx.fillStyle = "green";
                    ctx.font = "16px Verdana, sans-serif";

                    var text = typeof (node.data.label) !== 'undefined' ? node.data.label : node.id;


                    ctx.fillText(text, s.x - boxWidth / 2 + 5, s.y - 8);

                }
                else {




                    var radgrad = ctx.createRadialGradient(s.x + 2, s.y + 3, 1, s.x + 5, s.y + 5, 5);

                    radgrad.addColorStop(0, '#A7D30C');
                    radgrad.addColorStop(0.9, '#019F62');
                    radgrad.addColorStop(1, 'rgba(1,159,98,0)');



                    ctx.fillStyle = radgrad;
                    ctx.fillRect(s.x - boxWidth / 2, s.y - 10, boxWidth, 20);

                    var displayText = '';
                    if (node.data.person != undefined) {
                        if (node.data.person.DescendentCount > 10) {
                            displayText = node.data.person.Name + ' ' + node.data.person.currentDescendantCount;

                            ctx.textAlign = "left";
                            ctx.textBaseline = "top";
                            ctx.font = "16px Verdana, sans-serif";
                            ctx.fillStyle = "green";
                            ctx.font = "16px Verdana, sans-serif";

                            var text = displayText;

                            var width = ctx.measureText(text).width + 10;


                            ctx.fillText(text, s.x - width / 2 + 5, s.y - 8);

                        }



                    }


                }






                ctx.restore();
            }



        );

        renderer.start();






        // helpers for figuring out where to draw arrows

        return this;
    }



})();
