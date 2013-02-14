﻿


jQuery(function () {


    var ancUtils = new AncUtils();


    var params = {};

    params[0] = 'c41dfad2-f3d4-4682-9c52-610851c36dc6';

    var canvas = document.getElementById("springydemo");

    canvas.getContext("2d");

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;




    var processData = function (data) {

        if (data.Generations.length > 0) {

            var graph = new Graph();

            var springy = jQuery('#springydemo').springy({
                graph: graph,
                data:data,
                nodeSelected: function (node) {
                    console.log('Node selected: ' + JSON.stringify(node.data));
                }
            });




        }

    };

    ancUtils.twaGetJSON('/Trees/GetTreeDiag', params, processData);



    //    var springy = jQuery('#springydemo').springy({
    //        graph: graph,
    //        nodeSelected: function (node) {
    //            console.log('Node selected: ' + JSON.stringify(node.data));
    //        }
    //    });
});