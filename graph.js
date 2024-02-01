var elements = [];
var cy;
var removed = [];
const SIMULATORS = ["Arbor", "Brian", "GeNN", "MOOSE", "NEST", "Neuron"];

function selectionChanged() {
    const selected = [];
    for (const name of SIMULATORS) {
        const checkbox = document.getElementById(name);
        if (checkbox.checked)
            selected.push(name);
    }
    removed.toReversed().forEach(eles => eles.restore());
    removed = [];
    removed.push(cy.filter(function(element, i){
        return element.isNode() && element.data("features").includes("simulator") && !selected.includes(element.data("id"));
    }).remove());
    // Hide all edges that are not connected to a visible node
    removed.push(cy.filter(function(element, i){
        return element.isEdge() && !(element.source().visible() && element.target().visible);
    }).remove());
    // Hide all nodes that are not connected to a visible edge
    removed.push(cy.filter(function(element, i){
        return element.isNode() && !element.connectedEdges().some(edge => edge.visible());
    }).remove());
    layout = cy.makeLayout({
        name: "concentric",
        animate: true,
        levelWidth: function(node) {return 1;},
        concentric: function(node) {
            const features = node.data("features");
            let depth = 0;
            if (features.includes("standard"))
                depth = 3;
            else if (features.includes("standard"))
                depth = 2;
            else if (features.includes("simulator"))
                depth = 1;
            console.log(node.data("id"), depth);
            return depth;
        }
    });
    layout.run();
}

fetch("data/simtools.json").then(response => response.json().then(
        data => {
            const checkbox_container = document.getElementById("simulators");
            for (const name of SIMULATORS) {
                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.id = name;
                checkbox.name = name;
                checkbox.value = name;
                checkbox.checked = true;
                checkbox.onchange = selectionChanged;
                checkbox_container.appendChild(checkbox);
                const label = document.createElement("label");
                label.htmlFor = name;
                label.appendChild(document.createTextNode(name));
                checkbox_container.appendChild(label);
            }
            for (const [name, description] of Object.entries(data)) {
                const features = description["features"].split(",").map(x => x.trim());
                elements.push({
                    group: 'nodes',
                    data: {
                        id: name,
                        features: features
                    },
                    classes: features,
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
            cy = cytoscape({
                container: document.getElementById('cy'),
                elements: elements,
                style: [
                    {
                        selector: '.standard',
                        style: {
                            'background-color': 'darkblue',
                            'color': 'darkblue'
                        }
                    },
                    {
                        selector: '.frontend',
                        style: {
                            'shape': 'triangle'
                        }
                    },
                    {
                        selector: '.simulator',
                        style: {
                            'background-color': 'darkred',
                            'color': 'darkred'
                        }
                    },
                    {
                        selector: '.library',
                        style: {
                            'background-color': 'darkblue',
                            'color': 'darkblue'
                        }
                    },
                    {
                        selector: '.API',
                        style: {
                            'shape': 'rectangle'
                        }
                    },
                    {
                        selector: 'node',
                        style: {
                            'label': 'data(id)',
                            'font-size': 10
                        }
                    },
                    {
                        selector: 'edge',
                        style: {
                            'curve-style': 'unbundled-bezier',
                            'label': 'data(label)',
                            'target-arrow-shape': 'triangle',
                            'font-size': 8,
                            'min-zoomed-font-size': 36,
                        }
                    }
                ]
            });
            selectionChanged();
        }
    )
);



  