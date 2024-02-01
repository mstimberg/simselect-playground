var elements = [];
fetch("data/simtools.json").then(response => response.json().then(
        data => {
            for (const [name, description] of Object.entries(data)) {
                elements.push({
                    group: 'nodes',
                    data: {
                        id: name
                    },
                    classes: description["features"].split(",")
                });
                if (description["relations"] !== undefined) {
                    for (let relation of description["relations"]){
                        if (relation["description"] === undefined)
                            continue;
                        elements.push({
                            group: 'edges',
                            data: {
                                id: name + " → " + relation["name"],
                                source: name,
                                target: relation["name"],
                                label: relation["description"]
                            }
                        })
                    }
                }
            }
            var cy = cytoscape({
                container: document.getElementById('cy'),
                elements: elements,
                layout: {
                    name: "cose",
                    nodeDimensionsIncludeLabels: true,
                    randomize: true
                },
                style: [
                    {
                        selector: 'node[[degree=0]]',  // hide nodes without any edges
                        style: {
                            'display': 'none'
                        }
                    },
                    {
                        selector: '.standard',
                        style: {
                            'background-color': 'darkblue',
                            'color': 'darkblue'
                        }
                    },
                    {
                        selector: 'node',
                        style: {
                            'label': 'data(id)'
                        }
                    },
                    {
                        selector: 'edge',
                        style: {
                            'curve-style': 'unbundled-bezier',
                            'label': 'data(label)',
                            'target-arrow-shape': 'triangle',
                            'font-size': 12,
                            'min-zoomed-font-size': 20,
                        }
                    }
                ]
            });
            console.log(elements);
        }
    )
);



  