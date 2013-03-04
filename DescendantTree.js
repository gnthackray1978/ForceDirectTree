


jQuery(function () {


        var colourScheme = {
            mapbackgroundColour: '#0A0A33',

            normalMainLabelColour: 'white',
            normalMainLabelBackground: '#0A0A33',
            normalMainShapeBackground: 'purple',

            selectedMainLabelColour: 'white',
            selectedMainLabelBackground: '#0A0A33',
            selectedMainShapeBackground: 'green',

            nearestMainLabelColour: 'white',
            nearestMainLabelBackground: '#0A0A33',
            nearestMainShapeBackground: 'yellow',


            normalInfoLabelColour: 'white',
            normalInfoLabelBackground: '#0A0A33',

            selectedInfoLabelColour: 'white',
            selectedInfoLabelBackground: '#0A0A33',

            nearestInfoLabelColour: 'white',
            nearestInfoLabelBackground: '#0A0A33',


            infoLineColour: 'blue',
            normalLineGradient: ['#0066FF', '#1975FF', '#3385FF', '#4D94FF', '#66A3FF', '#80B2FF', '#99C2FF', '#CCE0FF', '#E6F0FF'],

            shadowColour: 'black',
           // maleColour: 'purple',
        //    femaleColour: 'purple'
        };



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

            var tree = new Tree(data);

            var springy = jQuery('#springydemo').springy({
                graph: graph,
                colourScheme :colourScheme,
                data: tree,
                nodeSelected: function (node) {
                    console.log('Node selected: ' + node.data.person.Name);
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