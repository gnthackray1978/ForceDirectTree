
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

        var layout = this.layout = new Layout.ForceDirected(graph, stiffness, repulsion, damping);

        // calculate bounding box of graph layout.. with ease-in
   //     var currentBB = layout.getBoundingBox();
        var targetBB = { bottomleft: new Vector(-2, -2), topright: new Vector(2, 2) };
        var mouseup = true;
        var _dir = '';


        var fdMapHandler = new mapHandler(layout.getBoundingBox(), graph);

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

                var stroke = typeof (edge.data.color) !== 'undefined' ? edge.data.color : '#000000';

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

                ctx.strokeStyle = stroke;
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

                // clear background
                //		    ctx.clearRect(s.x - boxWidth / 2, s.y - 10, boxWidth, 20);



                //		    // fill background
                //		    if (selected !== null && selected.node !== null && nearest.node !== null && selected.node.id === node.id) {
                //		        ctx.fillStyle = "Red";
                //		    } else if (nearest !== null && nearest.node !== null && nearest.node.id === node.id) {
                //		        ctx.fillStyle = "Green";
                //		    } else {
                //		        ctx.fillStyle = "#FFFFFF";
                //		    }


                //		    ctx.fillRect(s.x - boxWidth / 2, s.y - 10, boxWidth, 20);


                var radgrad = ctx.createRadialGradient(s.x + 2, s.y + 3, 1, s.x + 5, s.y + 5, 5);

                radgrad.addColorStop(0, '#A7D30C');
                radgrad.addColorStop(0.9, '#019F62');
                radgrad.addColorStop(1, 'rgba(1,159,98,0)');



                ctx.fillStyle = radgrad;
                ctx.fillRect(s.x - boxWidth / 2, s.y - 10, boxWidth, 20);



                ctx.textAlign = "left";
                ctx.textBaseline = "top";
                ctx.font = "16px Verdana, sans-serif";
                ctx.fillStyle = "#000000";
                ctx.font = "16px Verdana, sans-serif";
                var text = typeof (node.data.label) !== 'undefined' ? node.data.label : node.id;
                ctx.fillText(text, s.x - boxWidth / 2 + 5, s.y - 8);

                ctx.restore();
            }



        );

        renderer.start();






        // helpers for figuring out where to draw arrows

        return this;
    }



})();
