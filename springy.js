/**
 * Springy v1.0.1
 *
 * Copyright (c) 2010 Dennis Hotson
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

var Vector;

//https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/forEach
if ( !Array.prototype.forEach ) {
  Array.prototype.forEach = function( callback, thisArg ) {
    var T, k;
    if ( this === null ) {
      throw new TypeError( " this is null or not defined" );
    }
    var O = Object(this);
    var len = O.length >>> 0; // Hack to convert O.length to a UInt32
    if ( {}.toString.call(callback) != "[object Function]" ) {
      throw new TypeError( callback + " is not a function" );
    }
    if ( thisArg ) {
      T = thisArg;
    }
    k = 0;
    while( k < len ) {
      var kValue;
      if ( k in O ) {
        kValue = O[ k ];
        callback.call( T, kValue, k, O );
      }
      k++;
    }
  };
}


var Node = function(id, data) {
	this.id = id;
	this.data = typeof(data) !== 'undefined' ? data : {};
};

var Edge = function(id, source, target, data) {
	this.id = id;
	this.source = source;
	this.target = target;
	this.data = typeof(data) !== 'undefined' ? data : {};
};

var Graph = function() {
	this.nodeSet = {};
	this.nodes = [];
	this.edges = [];
	this.adjacency = {};

	this.nextNodeId = 0;
	this.nextEdgeId = 0;
	this.eventListeners = [];
};


Graph.prototype = {

    addNode: function (node) {
        if (typeof(this.nodeSet[node.id]) === 'undefined') {
            this.nodes.push(node);
        }
        
        this.nodeSet[node.id] = node;
        
        this.notify();
        return node;
    },
    addEdge:function(edge) {
        var exists = false;
        this.edges.forEach(function(e) {
            if (edge.id === e.id) { exists = true; }
        });
        
        if (!exists) {
            this.edges.push(edge);
        }
        
        if (typeof(this.adjacency[edge.source.id]) === 'undefined') {
            this.adjacency[edge.source.id] = {};
        }
        if (typeof(this.adjacency[edge.source.id][edge.target.id]) === 'undefined') {
            this.adjacency[edge.source.id][edge.target.id] = [];
        }
        
        exists = false;
        this.adjacency[edge.source.id][edge.target.id].forEach(function(e) {
            if (edge.id === e.id) { exists = true; }
        });
        
        if (!exists) {
            this.adjacency[edge.source.id][edge.target.id].push(edge);
        }
        
        this.notify();
        return edge;
    },
    newNode: function(data) {
        var node = new Node(this.nextNodeId++, data);
        this.addNode(node);
        return node;
    },
    newEdge: function(source, target, data) {
        var edge = new Edge(this.nextEdgeId++, source, target, data);
        this.addEdge(edge);
        return edge;
	},
	// find the edges from node1 to node2
    getEdges:function(node1, node2) {
        if (typeof(this.adjacency[node1.id]) !== 'undefined'
            && typeof(this.adjacency[node1.id][node2.id]) !== 'undefined') {
            return this.adjacency[node1.id][node2.id];
        }
        return [];
	},
	// remove a node and it's associated edges from the graph
    removeNode: function(node) {
        if (typeof(this.nodeSet[node.id]) !== 'undefined') {
            delete this.nodeSet[node.id];
        }
        
        for (var i = this.nodes.length - 1; i >= 0; i--) {
            if (this.nodes[i].id === node.id) {
                this.nodes.splice(i, 1);
            }
        }
        this.detachNode(node);
	},
	// removes edges associated with a given node
    detachNode:function(node) {
        var tmpEdges = this.edges.slice();
        tmpEdges.forEach(function(e) {
            if (e.source.id === node.id || e.target.id === node.id) {
                this.removeEdge(e);
            }
        }, this);
        
        this.notify();
	},
	// remove a node and it's associated edges from the graph
    removeEdge : function(edge) {
        for (var i = this.edges.length - 1; i >= 0; i--) {
            if (this.edges[i].id === edge.id) {
                this.edges.splice(i, 1);
            }
        }
        
        for (var x in this.adjacency) {
            for (var y in this.adjacency[x]) {
                var edges = this.adjacency[x][y];
                
                for (var j=edges.length - 1; j>=0; j--) {
                    if (this.adjacency[x][y][j].id === edge.id) {
                        this.adjacency[x][y].splice(j, 1);
                    }
                }
            }
        }

        this.notify();
    },
    merge : function (data) {

        /* Merge a list of nodes and edges into the current graph. eg.
        var o = {
            nodes: [
                {id: 123, data: {type: 'user', userid: 123, displayname: 'aaa'}},
                {id: 234, data: {type: 'user', userid: 234, displayname: 'bbb'}}
            ],
            edges: [
                {from: 0, to: 1, type: 'submitted_design', directed: true, data: {weight: }}
            ]
        }
        */
        var nodes = [];
            data.nodes.forEach(function(n) {
            nodes.push(this.addNode(new Node(n.id, n.data)));
        }, this);

        data.edges.forEach(function(e) {
            var from = nodes[e.from];
            var to = nodes[e.to];
            
            var id = (e.directed)
            ? (id = e.type + "-" + from.id + "-" + to.id)
            : (from.id < to.id) // normalise id for non-directed edges
            ? e.type + "-" + from.id + "-" + to.id
            : e.type + "-" + to.id + "-" + from.id;
            
            var edge = this.addEdge(new Edge(id, from, to, e.data));
            edge.data.type = e.type;
        }, this);
    },
    filterNodes : function(fn) {
        var tmpNodes = this.nodes.slice();
        tmpNodes.forEach(function(n) {
            if (!fn(n)) {
                this.removeNode(n);
            }
        }, this);
    },
    filterEdges:function(fn) {
        var tmpEdges = this.edges.slice();
            tmpEdges.forEach(function(e) {
            if (!fn(e)) {
                this.removeEdge(e);
            }
        }, this);
    },
    addGraphListener :function(obj) {
        this.eventListeners.push(obj);
    },
    notify :function() {
        this.eventListeners.forEach(function(obj){
            obj.graphChanged();
        });
    }

};
 






// -----------
var Layout = {};

Layout.ForceDirected = function(graph, stiffness, repulsion, damping) {
	this.graph = graph;
	this.stiffness = stiffness; // spring stiffness constant
	this.repulsion = repulsion; // repulsion constant
	this.damping = damping; // velocity damping factor

	this.nodePoints = {}; // keep track of points associated with nodes
	this.edgeSprings = {}; // keep track of springs associated with edges
};

Layout.ForceDirected.prototype = {
    point: function(node) {
        if (typeof(this.nodePoints[node.id]) === 'undefined') {
            var mass = typeof(node.data.mass) !== 'undefined' ? node.data.mass : 1.0;
            this.nodePoints[node.id] = new Layout.ForceDirected.Point(Vector.random(), mass);
        }
        
        return this.nodePoints[node.id];
    },

    spring:function(edge) {
        if (typeof(this.edgeSprings[edge.id]) === 'undefined') {
            var length = typeof(edge.data.length) !== 'undefined' ? edge.data.length : 1.0;
            
            var existingSpring = false;
            
            var from = this.graph.getEdges(edge.source, edge.target);
            from.forEach(function(e) {
                if (existingSpring === false && typeof(this.edgeSprings[e.id]) !== 'undefined') {
                    existingSpring = this.edgeSprings[e.id];
                }
            }, this);
            
            if (existingSpring !== false) {
                return new Layout.ForceDirected.Spring(existingSpring.point1, existingSpring.point2, 0.0, 0.0);
            }
            
            var to = this.graph.getEdges(edge.target, edge.source);
            from.forEach(function(e){
                if (existingSpring === false && typeof(this.edgeSprings[e.id]) !== 'undefined') {
                    existingSpring = this.edgeSprings[e.id];
                }
            }, this);
            
            if (existingSpring !== false) {
                 return new Layout.ForceDirected.Spring(existingSpring.point2, existingSpring.point1, 0.0, 0.0);
            }
            
            this.edgeSprings[edge.id] = new Layout.ForceDirected.Spring(
            this.point(edge.source), this.point(edge.target), length, this.stiffness
            );
        }
        
        return this.edgeSprings[edge.id];
    },
    // callback should accept two arguments: Node, Point
    eachNode:function(callback) {
        var t = this;
        this.graph.nodes.forEach(function(n){
            callback.call(t, n, t.point(n));
        });
    },

    // callback should accept two arguments: Edge, Spring
    eachEdge:function(callback) {
        var t = this;
        this.graph.edges.forEach(function(e){
            callback.call(t, e, t.spring(e));
        });
    },

    // callback should accept one argument: Spring
    eachSpring: function(callback) {
        var t = this;
        this.graph.edges.forEach(function(e){
            callback.call(t, t.spring(e));
        });
    },

    // Physics stuff
    applyCoulombsLaw:function() {
        this.eachNode(function(n1, point1) {
            this.eachNode(function(n2, point2) {
                if (point1 !== point2)
                {
                    var d = point1.p.subtract(point2.p);
                    var distance = d.magnitude() + 0.1; // avoid massive forces at small distances (and divide by zero)
                    var direction = d.normalise();
                    
                    // apply force to each end point
                    point1.applyForce(direction.multiply(this.repulsion).divide(distance * distance * 0.5));
                    point2.applyForce(direction.multiply(this.repulsion).divide(distance * distance * -0.5));
                }
            });
        });
    },

    applyHookesLaw: function() {
        this.eachSpring(function(spring){
            var d = spring.point2.p.subtract(spring.point1.p); // the direction of the spring
            var displacement = spring.length - d.magnitude();
            var direction = d.normalise();
            
            // apply force to each end point
            spring.point1.applyForce(direction.multiply(spring.k * displacement * -0.5));
            spring.point2.applyForce(direction.multiply(spring.k * displacement * 0.5));
        });
    },

    attractToCentre:function() {
        this.eachNode(function(node, point) {
            var direction = point.p.multiply(-1.0);
            point.applyForce(direction.multiply(this.repulsion / 50.0));
        });
    },
    updateVelocity: function(timestep) {
        this.eachNode(function(node, point) {
            // Is this, along with updatePosition below, the only places that your
            // integration code exist?
            point.v = point.v.add(point.a.multiply(timestep)).multiply(this.damping);
            point.a = new Vector(0,0);
        });
    },

    updatePosition:function(timestep) {
        this.eachNode(function(node, point) {
            // Same question as above; along with updateVelocity, is this all of
            // your integration code?
            point.p = point.p.add(point.v.multiply(timestep));
        });
    },

    // Calculate the total kinetic energy of the system
    totalEnergy :function(timestep) {
        var energy = 0.0;
        this.eachNode(function(node, point) {
            var speed = point.v.magnitude();
            energy += 0.5 * point.m * speed * speed;
        });
        
        return energy;
    }
    
        
};


var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }; // stolen from coffeescript, thanks jashkenas! ;-)

Layout.requestAnimationFrame = __bind(window.requestAnimationFrame ||
	window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame ||
	window.oRequestAnimationFrame ||
	window.msRequestAnimationFrame ||
	function(callback, element) {
		window.setTimeout(callback, 10);
	}, window);


// start simulation
Layout.ForceDirected.prototype.start = function(interval, render, done) {
	var t = this;

	if (this._started) return;
	this._started = true;

	Layout.requestAnimationFrame(function step() {
		t.applyCoulombsLaw();
		t.applyHookesLaw();
		t.attractToCentre();
		t.updateVelocity(0.03);
		t.updatePosition(0.03);

		if (typeof(render) !== 'undefined')
			render();

		// stop simulation when energy of the system goes below a threshold
		if (t.totalEnergy() < 0.01) {
			t._started = false;
			if (typeof(done) !== 'undefined') { done(); }
		} else {
            
            Layout.requestAnimationFrame(step);

		}
	});
};

// Find the nearest point to a particular position
Layout.ForceDirected.prototype.nearest = function (pos) {

    var min = { node: null, point: null, distance: 1 };
    var t = this;
    this.graph.nodes.forEach(function (n) {
        var point = t.point(n);
        var distance = point.p.subtract(pos).magnitude();

        if (min.distance === null || distance < min.distance) {
            min = { node: n, point: point, distance: distance };
        }
    });

  

    return min;
};

// returns [bottomleft, topright]
Layout.ForceDirected.prototype.getBoundingBox = function() {
	var bottomleft = new Vector(-2,-2);
	var topright = new Vector(2,2);

	this.eachNode(function(n, point) {
		if (point.p.x < bottomleft.x) {
			bottomleft.x = point.p.x;
		}
		if (point.p.y < bottomleft.y) {
			bottomleft.y = point.p.y;
		}
		if (point.p.x > topright.x) {
			topright.x = point.p.x;
		}
		if (point.p.y > topright.y) {
			topright.y = point.p.y;
		}
	});

	var padding = topright.subtract(bottomleft).multiply(0.07); // ~5% padding

	return {bottomleft: bottomleft.subtract(padding), topright: topright.add(padding)};
};




// Vector
Vector = function(x, y) {
	this.x = x;
	this.y = y;
};

Vector.random = function() {
	return new Vector(10.0 * (Math.random() - 0.5), 10.0 * (Math.random() - 0.5));
};

Vector.prototype.add = function(v2) {
	return new Vector(this.x + v2.x, this.y + v2.y);
};

Vector.prototype.subtract = function(v2) {
	return new Vector(this.x - v2.x, this.y - v2.y);
};

Vector.prototype.multiply = function(n) {
	return new Vector(this.x * n, this.y * n);
};

Vector.prototype.divide = function(n) {
	return new Vector((this.x / n) || 0, (this.y / n) || 0); // Avoid divide by zero errors..
};

Vector.prototype.magnitude = function() {
	return Math.sqrt(this.x*this.x + this.y*this.y);
};

Vector.prototype.normal = function() {
	return new Vector(-this.y, this.x);
};

Vector.prototype.normalise = function() {
	return this.divide(this.magnitude());
};







// Point
Layout.ForceDirected.Point = function(position, mass) {
	this.p = position; // position
	this.m = mass; // mass
	this.v = new Vector(0, 0); // velocity
	this.a = new Vector(0, 0); // acceleration
};

Layout.ForceDirected.Point.prototype.applyForce = function(force) {
	this.a = this.a.add(force.divide(this.m));
};

// Spring
Layout.ForceDirected.Spring = function(point1, point2, length, k) {
	this.point1 = point1;
	this.point2 = point2;
	this.length = length; // spring length at rest
	this.k = k; // spring constant (See Hooke's law) .. how stiff the spring is
};






    var mapHandler = function(currentBB, graph){
        
        //this.graph =graph;
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

        zoomCurrentBB: function (targetBB, amount) {

            this.currentBB = {
                bottomleft: this.currentBB.bottomleft.add(targetBB.bottomleft.subtract(this.currentBB.bottomleft)
    			.divide(amount)),
                topright: this.currentBB.topright.add(targetBB.topright.subtract(this.currentBB.topright)
				.divide(amount))
            };


        },
        
        currentPositionFromScreen:function(pos,e){
            var utils = new Utils(this.currentBB, this.graph_width, this.graph_height);                
             var p = utils.fromScreen({ x: (e.pageX - this.centrePoint) - pos.left, y: (e.pageY - this.centreVerticalPoint) - pos.top });            
             return p;
        },
        currentPositionToScreen:function(pos,e){
            var utils = new Utils(this.currentBB, this.graph_width, this.graph_height);             
             var p = utils.toScreen({ x: (e.pageX - this.centrePoint) - pos.left, y: (e.pageY - this.centreVerticalPoint) - pos.top });            
             return p;
        },
        
        addToMouseQueue: function(x,y){            
            var _point = new Array(x, y);
            this.mouseQueue[this.mouseQueue.length] = _point;            
        },
       
        validToDraw:function(x1,y1){
            
            var validDraw =true;
            
            if ( x1 > this.display_width) validDraw = false;
    	    if ( x1 < -500) validDraw = false;
            if ( y1 > this.display_height) validDraw = false;
            if ( y1 < -500) validDraw = false;
            
            return validDraw;    
        },
        mapOffset:function(v1){
            
            v1.x += this.centrePoint;
		    v1.y += this.centreVerticalPoint;
            
            return v1;
        }
 

    };




// Layout.ForceDirected.Spring.prototype.distanceToPoint = function(point)
// {
// 	// hardcore vector arithmetic.. ohh yeah!
// 	// .. see http://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment/865080#865080
// 	var n = this.point2.p.subtract(this.point1.p).normalise().normal();
// 	var ac = point.p.subtract(this.point1.p);
// 	return Math.abs(ac.x * n.x + ac.y * n.y);
// };

// Renderer handles the layout rendering loop
function Renderer(interval,mapHandler, layout, clear, drawEdge, drawNode) {
	this.interval = interval;
	this.layout = layout;
	this.clear = clear;
	this.drawEdge = drawEdge;
	this.drawNode = drawNode;
    this.map = mapHandler;
    
	this.layout.graph.addGraphListener(this);
}

Renderer.prototype.graphChanged = function(e) {
	this.start();
};

Renderer.prototype.start = function() {
	var t = this;
	this.layout.start(1, function render() {
		t.clear();

		t.layout.eachEdge(function(edge, spring) {
			t.drawEdge(edge, spring.point1.p, spring.point2.p);
		});

		t.layout.eachNode(function(node, point) {
			t.drawNode(node, point.p);
		});
	});
};


function Utils(currentBB, gwidth,hwidth){
    this.currentBB = currentBB;
    this.graph_width = gwidth;
    this.graph_height = hwidth;
}

Utils.prototype = {
    
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
        }
    
}






