
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




    //    jQuery.fn.springy = function (params) {
    //        
    //        return this;
    //    }


    jQuery.fn.springy = function (params) {
        var graph = this.graph = params.graph || new Graph();

        // graph size 
        var graph_width = 2000;
        var graph_height = 2000;

        //display size
        var display_width = window.innerWidth + 500;
        var display_height = window.innerHeight + 500;

        //save screen width/height
        var screenHeight = screen.height;
        var screenWidth = screen.width;

        //positional controls
        var centrePoint = 0;
        var centreVerticalPoint = 0;
        var zoomOffset = 0;

        var centrePointXOffset = 0.0;
        var centrePointYOffset = 0.0;

        var mouse_x = 0;
        var mouse_y = 0;

        // queue of points to move graph to 
        var mouseQueue = [];



        var mouseXPercLocat = 0.0;
        var mouseYPercLocat = 0.0;

        var percX1 = 0.0;
        var percY1 = 0.0;



        var stiffness = params.stiffness || 400.0;
        var repulsion = params.repulsion || 500.0;
        var damping = params.damping || 0.5;
        var nodeSelected = params.nodeSelected || null;

        var canvas = this[0];
        var ctx = canvas.getContext("2d");


        var layout = this.layout = new Layout.ForceDirected(graph, stiffness, repulsion, damping);

        // calculate bounding box of graph layout.. with ease-in
        var currentBB = layout.getBoundingBox();
        var targetBB = { bottomleft: new Vector(-2, -2), topright: new Vector(2, 2) };
        var mouseup = true;
        var _dir = '';

        // auto adjusting bounding box
        Layout.requestAnimationFrame(function adjust() {
            targetBB = layout.getBoundingBox();
            // current gets 20% closer to target every iteration
            currentBB = {
                bottomleft: currentBB.bottomleft.add(targetBB.bottomleft.subtract(currentBB.bottomleft)
    			.divide(10)),
                topright: currentBB.topright.add(targetBB.topright.subtract(currentBB.topright)
				.divide(10))
            };

            while (mouseQueue.length > 0) {
                var _point = mouseQueue.shift();
                SetCentrePoint(_point[0], _point[1]);
            }

            //   if (!mouseup) {
            var increment = 2;
            if (_dir == 'SOUTH') {
                centreVerticalPoint -= increment;
            }
            if (_dir == 'NORTH') {
                centreVerticalPoint += increment;
            }
            if (_dir == 'EAST') {
                centrePoint += increment;
            }
            if (_dir == 'WEST') {

                centrePoint -= increment;
            }
            if (_dir == 'UP' || _dir == 'DOWN') {

                mouse_x = screenWidth / 2;
                mouse_y = screenHeight / 2;

                GetPercDistances();

                mouseXPercLocat = percX1;
                mouseYPercLocat = percY1;

                // zero the centre point 
                SetCentrePoint(1000000, 1000000);

                if (_dir == 'UP') {
                    graph_width += 50;
                    graph_height += 50;
                } else {
                    graph_width -= 50;
                    graph_height -= 50;
                }

                GetPercDistances();


                console.log('y zoom ' + percY1 + ' ' + mouseYPercLocat);
                centreVerticalPoint += (graph_height / 100) * (percY1 - mouseYPercLocat);
                console.log('x zoom ' + percX1 + ' ' + mouseXPercLocat);

                centrePoint += (graph_width / 100) * (percX1 - mouseXPercLocat);
            }

            //zoomOffset
            //   }
            //    console.log(' state: ' + mouseup + ' ' + centrePoint + ' - ' + centreVerticalPoint);

            Layout.requestAnimationFrame(adjust);
        });

        // convert to/from screen coordinates
        toScreen = function (p) {
            var size = currentBB.topright.subtract(currentBB.bottomleft);
            var sx = p.subtract(currentBB.bottomleft).divide(size.x).x * graph_width;
            var sy = p.subtract(currentBB.bottomleft).divide(size.y).y * graph_height;
            return new Vector(sx, sy);
        };

        fromScreen = function (s) {
            var size = currentBB.topright.subtract(currentBB.bottomleft);
            var px = (s.x / graph_width) * size.x + currentBB.bottomleft.x;
            var py = (s.y / graph_height) * size.y + currentBB.bottomleft.y;
            return new Vector(px, py);
        };



        // half-assed drag and drop
        var selected = null;
        var nearest = null;
        var dragged = null;



        jQuery(canvas).mousedown(function (e) {

            console.log('canvas mouse down: ' + centrePoint + ' ' + centreVerticalPoint);
            jQuery('.actions').hide();

            var pos = jQuery(this).offset();

            mouseup = false;

            var p = fromScreen({ x: (e.pageX - centrePoint) - pos.left, y: (e.pageY - centreVerticalPoint) - pos.top });



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
            var _point = new Array(1000000, 1000000);
            mouseQueue[mouseQueue.length] = _point;
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
            var p = fromScreen({ x: (e.pageX - centrePoint) - pos.left, y: (e.pageY - centreVerticalPoint) - pos.top });
            var _point = new Array(e.clientX, e.clientY);
            // SetMouse(_point[0], _point[1]);

            mouse_x = _point[0];
            mouse_y = _point[1];

            if (!mouseup && selected.node == null) {
                mouseQueue.push(_point);
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

        //        SetMouse = function (x, y, mousestate) {
        //            mouse_x = x;
        //            mouse_y = y;

        //            if (mousestate == undefined) mousestate = false;

        //            if (mousestate == false)
        //                document.body.style.cursor = 'default';
        //            else
        //                document.body.style.cursor = 'move';
        //        };

        SetCentrePoint = function (param_x, param_y) {
            if (param_x == 1000000 && param_y == 1000000) {
                centrePointXOffset = 0;
                centrePointYOffset = 0;
            }
            else {
                if (centrePointXOffset === 0) {
                    centrePointXOffset = centrePoint - param_x;
                }
                else {

                    centrePoint = param_x + centrePointXOffset;
                }
                if (centrePointYOffset === 0) {
                    centrePointYOffset = centreVerticalPoint - param_y;
                }
                else {

                    centreVerticalPoint = param_y + centrePointYOffset;
                }
            }
        };

        SetZoomStart = function () {
            GetPercDistances();
            mouseXPercLocat = percX1;
            mouseYPercLocat = percY1;
        };

        GetPercDistances = function () {


            var _distanceFromX1 = 0.0;
            var _distanceFromY1 = 0.0;
            var _onePercentDistance = 0.0;

            percX1 = 0.0;
            percY1 = 0.0;



            //   this.drawingWidth = this.drawingX2 - this.drawingX1;
            //  this.drawingHeight = this.drawingY2 - this.drawingY1;



            if (graph_width !== 0 && graph_height !== 0) {
                if (centrePoint > 0) {
                    _distanceFromX1 = mouse_x - centrePoint; //;
                }
                else {
                    _distanceFromX1 = Math.abs(centrePoint) + mouse_x;
                }

                _onePercentDistance = graph_width / 100;
                percX1 = _distanceFromX1 / _onePercentDistance;

                if (centreVerticalPoint > 0) {
                    _distanceFromY1 = mouse_y - centreVerticalPoint; // ;                
                }
                else {
                    _distanceFromY1 = Math.abs(centreVerticalPoint) + mouse_y;
                }

                _onePercentDistance = graph_height / 100;
                percY1 = _distanceFromY1 / _onePercentDistance;

            }


        };

        var renderer = new Renderer(1, layout,
		function clear() {
		    ctx.clearRect(0, 0, graph_width, graph_height);
		},
		function drawEdge(edge, p1, p2) {





		    var x1 = toScreen(p1).x;
		    var y1 = toScreen(p1).y;

		    var x2 = toScreen(p2).x;
		    var y2 = toScreen(p2).y;




		    // var centrePoint = 0;
		    //  var centreVerticalPoint = 0;





		    x1 += centrePoint;
		    x2 += centrePoint;

		    y1 += centreVerticalPoint;
		    y2 += centreVerticalPoint;



		    if (x2 > display_width || x1 > display_width) return;
		    if (x2 < -500 || x1 < -500) return;


		    if (y2 > display_height || y1 > display_height) return;
		    if (y2 < -500 || y1 < -500) return;



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

		    var s1 = toScreen(p1).add(offset);
		    var s2 = toScreen(p2).add(offset);

		    s1.x += centrePoint;
		    s1.y += centreVerticalPoint;

		    s2.x += centrePoint;
		    s2.y += centreVerticalPoint;

		    var boxWidth = edge.target.getWidth();
		    var boxHeight = edge.target.getHeight();

		    var intersection = intersect_line_box(s1, s2, { x: x2 - boxWidth / 2.0, y: y2 - boxHeight / 2.0 }, boxWidth, boxHeight);

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
		        text = edge.data.label
		        ctx.save();
		        ctx.textAlign = "center";
		        ctx.textBaseline = "top";
		        ctx.font = "10px Helvetica, sans-serif";
		        ctx.fillStyle = "#5BA6EC";
		        ctx.fillText(text, (x1 + x2) / 2, (y1 + y2) / 2);
		        ctx.restore();
		    }

		},
		function drawNode(node, p) {
		    var s = toScreen(p);

		    s.x += centrePoint;
		    s.y += centreVerticalPoint;

		    var x1 = toScreen(p).x;
		    var y1 = toScreen(p).y;
		    var x2 = toScreen(p).x;
		    var y2 = toScreen(p).y;

		    x1 += centrePoint;
		    x2 += centrePoint;

		    y1 += centreVerticalPoint;
		    y2 += centreVerticalPoint;

		    if (x2 > display_width || x1 < 0) return;
		    if (y2 > display_height || y1 < 0) return;




		    ctx.save();

		    var boxWidth = 20; // node.getWidth();
		    var boxHeight = 20;// node.getHeight();

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
        function intersect_line_line(p1, p2, p3, p4) {
            var denom = ((p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y));

            // lines are parallel
            if (denom === 0) {
                return false;
            }

            var ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
            var ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;

            if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
                return false;
            }

            return new Vector(p1.x + ua * (p2.x - p1.x), p1.y + ua * (p2.y - p1.y));
        }

        function intersect_line_box(p1, p2, p3, w, h) {
            var tl = { x: p3.x, y: p3.y };
            var tr = { x: p3.x + w, y: p3.y };
            var bl = { x: p3.x, y: p3.y + h };
            var br = { x: p3.x + w, y: p3.y + h };

            var result;
            if (result = intersect_line_line(p1, p2, tl, tr)) { return result; } // top
            if (result = intersect_line_line(p1, p2, tr, br)) { return result; } // right
            if (result = intersect_line_line(p1, p2, br, bl)) { return result; } // bottom
            if (result = intersect_line_line(p1, p2, bl, tl)) { return result; } // left

            return false;
        }

        return this;
    }



})();
