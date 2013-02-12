
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

    var Vector,Renderer,Layout,Graph;


    var mapHandler = function(currentBB, graph){
        
        this.graph =graph;
        this.currentBB = currentBB;
        
               // graph size 
        this.graph_width = 2000;
        this.graph_height = 2000;

        //display size
        this.display_width = window.innerWidth + 500;
        this.display_height = window.innerHeight + 500;

        //save screen width/height
        this.screenHeight = screen.height;
        this.screenWidth = screen.width;

        //positional controls
        this.centrePoint = 0;
        this.centreVerticalPoint = 0;
        this.zoomOffset = 0;

        this.centrePointXOffset = 0.0;
        this.centrePointYOffset = 0.0;

        this.mouse_x = 0;
        this.mouse_y = 0;

        // queue of points to move graph to 
        this.mouseQueue = [];

        this.mouseXPercLocat = 0.0;
        this.mouseYPercLocat = 0.0;

        this.percX1 = 0.0;
        this.percY1 = 0.0; 
        
        this.canvas = this[0];
        this.ctx = this.canvas.getContext("2d");
        
    };
    
    mapHandler.prototype = {
        
        SetCentrePoint:function (param_x, param_y) {
            if (param_x == 1000000 && param_y == 1000000) {
                this.centrePointXOffset = 0;
                this.centrePointYOffset = 0;
            }
            else {
                if (this.centrePointXOffset === 0) {
                    this.centrePointXOffset = this.centrePoint - param_x;
                }
                else {

                    this.centrePoint = param_x + this.centrePointXOffset;
                }
                if (this.centrePointYOffset === 0) {
                    this.centrePointYOffset = this.centreVerticalPoint - param_y;
                }
                else {

                    this.centreVerticalPoint = param_y + this.centrePointYOffset;
                }
            }
        },
        SetZoomStart: function () {
            this.GetPercDistances();
            this.mouseXPercLocat = this.percX1;
            this.mouseYPercLocat = this.percY1;
        },
        GetPercDistances: function () {


            var _distanceFromX1 = 0.0;
            var _distanceFromY1 = 0.0;
            var _onePercentDistance = 0.0;

            this.percX1 = 0.0;
            this.percY1 = 0.0;



            //   this.drawingWidth = this.drawingX2 - this.drawingX1;
            //  this.drawingHeight = this.drawingY2 - this.drawingY1;



            if (this.graph_width !== 0 && this.graph_height !== 0) {
                if (this.centrePoint > 0) {
                    _distanceFromX1 = this.mouse_x - this.centrePoint; //;
                }
                else {
                    _distanceFromX1 = Math.abs(this.centrePoint) + this.mouse_x;
                }

                _onePercentDistance = this.graph_width / 100;
                this.percX1 = _distanceFromX1 / _onePercentDistance;

                if (this.centreVerticalPoint > 0) {
                    _distanceFromY1 = this.mouse_y - this.centreVerticalPoint; // ;                
                }
                else {
                    _distanceFromY1 = Math.abs(this.centreVerticalPoint) + this.mouse_y;
                }

                _onePercentDistance = this.graph_height / 100;
                this.percY1 = _distanceFromY1 / _onePercentDistance;

            }


        },
        UpdatePosition:function(_dir){
            
            var increment = 2;
            
            if (_dir == 'SOUTH') {
                this.centreVerticalPoint -= increment;
            }
            if (_dir == 'NORTH') {
                this.centreVerticalPoint += increment;
            }
            if (_dir == 'EAST') {
                this.centrePoint += increment;
            }
            if (_dir == 'WEST') {

                this.centrePoint -= increment;
            }
            if (_dir == 'UP' || _dir == 'DOWN') {

                this.mouse_x = this.screenWidth / 2;
                this.mouse_y = this.screenHeight / 2;

                this.GetPercDistances();

                this.mouseXPercLocat = this.percX1;
                this.mouseYPercLocat = this.percY1;

                // zero the centre point 
                this.SetCentrePoint(1000000, 1000000);

                if (_dir == 'UP') {
                    this.graph_width += 50;
                    this.graph_height += 50;
                } else {
                    this.graph_width -= 50;
                    this.graph_height -= 50;
                }

                this.GetPercDistances();


                //console.log('y zoom ' + percY1 + ' ' + mouseYPercLocat);
                this.centreVerticalPoint += (this.graph_height / 100) * (this.percY1 - this.mouseYPercLocat);
                //console.log('x zoom ' + percX1 + ' ' + mouseXPercLocat);

                this.centrePoint += (this.graph_width / 100) * (this.percX1 - this.mouseXPercLocat);
            }

        },
        
        toScreen:function (p) {
            var size = this.currentBB.topright.subtract(this.currentBB.bottomleft);
            var sx = p.subtract(this.currentBB.bottomleft).divide(size.x).x * this.graph_width;
            var sy = p.subtract(this.currentBB.bottomleft).divide(size.y).y * this.graph_height;
            return new Vector(sx, sy);
        },

        fromScreen:function (s) {
            var size = this.currentBB.topright.subtract(this.currentBB.bottomleft);
            var px = (s.x / this.graph_width) * size.x + this.currentBB.bottomleft.x;
            var py = (s.y / this.graph_height) * size.y + this.currentBB.bottomleft.y;
            return new Vector(px, py);
        },
        currentPositionFromScreen:function(pos,e){
             var p = this.fromScreen({ x: (e.pageX - this.centrePoint) - pos.left, y: (e.pageY - this.centreVerticalPoint) - pos.top });            
             return p;
        },
        currentPositionToScreen:function(pos,e){
             var p = this.toScreen({ x: (e.pageX - this.centrePoint) - pos.left, y: (e.pageY - this.centreVerticalPoint) - pos.top });            
             return p;
        },
        addToMouseQueue: function(x,y){            
            var _point = new Array(x, y);
            this.mouseQueue[this.mouseQueue.length] = _point;            
        },
        intersect_line_line: function(p1, p2, p3, p4) {
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
        },

        intersect_line_box: function(p1, p2, p3, w, h) {
            var tl = { x: p3.x, y: p3.y };
            var tr = { x: p3.x + w, y: p3.y };
            var bl = { x: p3.x, y: p3.y + h };
            var br = { x: p3.x + w, y: p3.y + h };

            var result;
            if (result = this.intersect_line_line(p1, p2, tl, tr)) { return result; } // top
            if (result = this.intersect_line_line(p1, p2, tr, br)) { return result; } // right
            if (result = this.intersect_line_line(p1, p2, br, bl)) { return result; } // bottom
            if (result = this.intersect_line_line(p1, p2, bl, tl)) { return result; } // left

            return false;
        },

        drawEdge: function(edge, p1, p2) {

    	    var x1 = this.toScreen(p1).x;            
		    var y1 = this.toScreen(p1).y;
		    var x2 = this.toScreen(p2).x;
		    var y2 = this.toScreen(p2).y;

		    x1 += this.centrePoint;
		    x2 += this.centrePoint;
		    y1 += this.centreVerticalPoint;
		    y2 += this.centreVerticalPoint;

		    if (x2 > this.display_width || x1 > this.display_width) return;
		    if (x2 < -500 || x1 < -500) return;
		    if (y2 > this.display_height || y1 > this.display_height) return;
		    if (y2 < -500 || y1 < -500) return;



		    var direction = new Vector(x2 - x1, y2 - y1);
		    var normal = direction.normal().normalise();

		    var from = this.graph.getEdges(edge.source, edge.target);
		    var to = this.graph.getEdges(edge.target, edge.source);

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

		    var s1 = this.toScreen(p1).add(offset);
		    var s2 = this.toScreen(p2).add(offset);

		    s1.x += this.centrePoint;
		    s1.y += this.centreVerticalPoint;

		    s2.x += this.centrePoint;
		    s2.y += this.centreVerticalPoint;

		    var boxWidth = edge.target.getWidth();
		    var boxHeight = edge.target.getHeight();

		    var intersection = this.intersect_line_box(s1, s2, { x: x2 - boxWidth / 2.0, y: y2 - boxHeight / 2.0 }, boxWidth, boxHeight);

		    if (!intersection) {
		        intersection = s2;
		    }

            var stroke = typeof (edge.data.color) !== 'undefined' ? edge.data.color : '#000000';

		    var arrowWidth;
		    var arrowLength;

		    var weight = typeof (edge.data.weight) !== 'undefined' ? edge.data.weight : 1.0;

		    this.ctx.lineWidth = Math.max(weight * 2, 0.1);
		    arrowWidth = 1 + this.ctx.lineWidth;
		    arrowLength = 8;

		    var directional = typeof (edge.data.directional) !== 'undefined' ? edge.data.directional : true;

		    // line
		    var lineEnd;
		    if (directional) {
		        lineEnd = intersection.subtract(direction.normalise().multiply(arrowLength * 0.5));
		    } else {
		        lineEnd = s2;
		    }

		    this.ctx.strokeStyle = stroke;
		    this.ctx.beginPath();
		    this.ctx.moveTo(s1.x, s1.y);
		    this.ctx.lineTo(lineEnd.x, lineEnd.y);
		    this.ctx.stroke();

		    // arrow
		    if (directional) {
		        this.ctx.save();
		        this.ctx.fillStyle = stroke;
		        this.ctx.translate(intersection.x, intersection.y);
		        this.ctx.rotate(Math.atan2(y2 - y1, x2 - x1));
		        this.ctx.beginPath();

		        this.ctx.moveTo(-arrowLength, arrowWidth);

		        this.ctx.lineTo(0, 0);
		        this.ctx.lineTo(-arrowLength, -arrowWidth);
		        this.ctx.lineTo(-arrowLength * 0.8, -0);
		        this.ctx.closePath();
		        this.ctx.fill();
		        this.ctx.restore();
		    }

		    // label
		    if (typeof (edge.data.label) !== 'undefined') {
		        var text = edge.data.label
		        this.ctx.save();
		        this.ctx.textAlign = "center";
		        this.ctx.textBaseline = "top";
		        this.ctx.font = "10px Helvetica, sans-serif";
		        this.ctx.fillStyle = "#5BA6EC";
		        this.ctx.fillText(text, (x1 + x2) / 2, (y1 + y2) / 2);
		        this.ctx.restore();
		    }

		},
        
        drawNode: function(node, p) {
    	   
           var s = this.toScreen(p);

		    s.x += this.centrePoint;
		    s.y += this.centreVerticalPoint;

		    var x1 = this.toScreen(p).x;
		    var y1 = this.toScreen(p).y;
		    var x2 = this.toScreen(p).x;
		    var y2 = this.toScreen(p).y;

		    x1 += this.centrePoint;
		    x2 += this.centrePoint;

		    y1 += this.centreVerticalPoint;
		    y2 += this.centreVerticalPoint;

		    if (x2 > this.display_width || x1 < 0) return;
		    if (y2 > this.display_height || y1 < 0) return;




		    this.ctx.save();

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


		    var radgrad = this.ctx.createRadialGradient(s.x + 2, s.y + 3, 1, s.x + 5, s.y + 5, 5);

		    radgrad.addColorStop(0, '#A7D30C');
		    radgrad.addColorStop(0.9, '#019F62');
		    radgrad.addColorStop(1, 'rgba(1,159,98,0)');



		    this.ctx.fillStyle = radgrad;
		    this.ctx.fillRect(s.x - boxWidth / 2, s.y - 10, boxWidth, 20);



		    this.ctx.textAlign = "left";
		    this.ctx.textBaseline = "top";
		    this.ctx.font = "16px Verdana, sans-serif";
		    this.ctx.fillStyle = "#000000";
		    this.ctx.font = "16px Verdana, sans-serif";
		    var text = typeof (node.data.label) !== 'undefined' ? node.data.label : node.id;
		    this.ctx.fillText(text, s.x - boxWidth / 2 + 5, s.y - 8);

		    this.ctx.restore();
		},
        clear:function () {
    	    this.ctx.clearRect(0, 0, this.graph_width, this.graph_height);
		}

    };
    


    jQuery.fn.springy = function (params) {
        var graph = this.graph = params.graph || new Graph();

        var stiffness = params.stiffness || 400.0;
        var repulsion = params.repulsion || 500.0;
        var damping = params.damping || 0.5;
        var nodeSelected = params.nodeSelected || null;

        


        var layout = this.layout = new Layout.ForceDirected(graph, stiffness, repulsion, damping);

        // calculate bounding box of graph layout.. with ease-in
        var currentBB = layout.getBoundingBox();
        var targetBB = { bottomleft: new Vector(-2, -2), topright: new Vector(2, 2) };
        var mouseup = true;
        var _dir = '';


        var fdMapHandler = new mapHandler(layout.getBoundingBox(),graph) ;

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

        jQuery(fdMapHandler.canvas).mousedown(function (e) {         
            jQuery('.actions').hide();

            var pos = jQuery(this).offset();

            mouseup = false;

            var p =  fdMapHandler.currentPositionFromScreen(pos,e);    // fromScreen({ x: (e.pageX - centrePoint) - pos.left, y: (e.pageY - centreVerticalPoint) - pos.top });

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


        jQuery(fdMapHandler.canvas).mousemove(function (e) {                    
            var pos = jQuery(this).offset();
            var p = fdMapHandler.currentPositionFromScreen(pos,e );    

            if (!mouseup && selected.node === null) {
                fdMapHandler.addToMouseQueue(e.clientX,e.clientY);                
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

            fdMapHandler.ctx.save();
            fdMapHandler.ctx.font = "16px Verdana, sans-serif";
            var width = fdMapHandler.ctx.measureText(text).width + 10;
            fdMapHandler.ctx.restore();

            this._width || (this._width = {});
            this._width[text] = width;

            return width;
        };

        Node.prototype.getHeight = function () {
            return 20;
        };

        var renderer = new Renderer(1, layout,fdMapHandler.clear,fdMapHandler.drawEdge,fdMapHandler.drawNode);

        renderer.start();

        // helpers for figuring out where to draw arrows
      
        return this;
    }



})();
