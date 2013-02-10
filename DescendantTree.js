


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



            var genIdx = 0;

            while (genIdx < 8) {

                var personIdx = 0;
                var genArray = new Array();

                while (personIdx < data.Generations[genIdx].length) {

                    var currentPerson = data.Generations[genIdx][personIdx];

                    if (!currentPerson.IsHtmlLink) {
                        var descriptor = '.'; // currentPerson.DOB + ' ' + currentPerson.Name;

                        data.Generations[genIdx][personIdx].nodeLink = graph.newNode({ label: descriptor });

                        if (genIdx > 0) {
                            var fatherNode = data.Generations[genIdx - 1][currentPerson.FatherIdx].nodeLink;
                            graph.newEdge(fatherNode, currentPerson.nodeLink, { color: '#99CCFF' });
                        }
                    }

                    personIdx++;
                }

                genIdx++;
            }


            var springy = jQuery('#springydemo').springy({
                graph: graph,
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