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
    layoutNodes();
}

function layoutNodes() {
    layout = cy.layout({
        name: "cola",
        animate: "end"
    });
    layout.run();
}

function urlButton(type, url) {
    const button = document.createElement("button");
    let icon = "";
    switch (type) {
        case "source":
            iconFile = "github.svg";
            break;
        case "documentation":
            iconFile = "book.svg";
            break;
        case "homepage":
            iconFile = "home.svg";
            break;
        case "download":
            iconFile = "download.svg";
            break;
        case "issue tracker":
            iconFile = "check-circle.svg";
            break;
        case "forum":
            iconFile = "users.svg";
            break;
        case "examples":
            iconFile = "code.svg";
            break;
        case "tutorial":
            iconFile = "user.svg";
            break;
        case "installation":
            iconFile = "package.svg";
            break;
        case "email":
            iconFile = "mail.svg";
            break;
        default:
            iconFile = "link.svg";
    }
    icon = `<img aria-hidden='true' focusable='false' class='icon' src='assets/${iconFile}'></img>`;
    button.innerHTML = icon + " " + type;
    button.onclick = function() {
        window.open(url, "_blank");
    }
    return button;
}

function highlightElement(event) {
    if (event.target.group() === "nodes") {
        const node = event.target;
        if (node === event.cy) {  // clicked on background
            cy.elements().forEach(n => n.style("opacity", 1));
            return;
        }
        // change opacity if node or edge is not connected to the clicked node
        const connected_edges = node.connectedEdges()
        const connected_nodes = connected_edges.connectedNodes();
        cy.elements().forEach(n => n.style("opacity", 0.2));
        connected_edges.forEach(n => n.style("opacity", 1));
        connected_nodes.forEach(n => n.style("opacity", 1));

        // Show details about the simulator
        const details = document.getElementById("details");
        // Basic description
        details.innerHTML = "<h2>" + node.id() + "</h2>";
        details.innerHTML += "<p>" + node.data("description") + "</p>";
        // Relations
        const outgoingEdges = node.outgoers("edge");
        if (outgoingEdges.length > 0) {
            details.innerHTML += "<h3>Relations</h3>";
            const list = document.createElement("ul");
            for (let edge of outgoingEdges) {
                const listItem = document.createElement("li");
                const targetLink = document.createElement("a");
                targetLink.href = "#";
                targetLink.addEventListener("click",function(e) { node.unselect(); edge.target().select(); });
                targetLink.innerHTML = edge.target().id();
                const label = document.createElement("i");
                label.innerHTML = " " + edge.data("label") + " ";
                listItem.appendChild(label);
                listItem.appendChild(targetLink);

                list.appendChild(listItem);
            }
            details.appendChild(list);
        }
        // URLs
        if (node.data("urls") !== undefined) {
            for (let [text, url] of Object.entries(node.data("urls"))) {
                details.appendChild(urlButton(text, url));
            }
        }
    } else if (event.target.group() === "edges") {
        const edge = event.target;
        const details = document.getElementById("details");
        const headerElement = document.createElement("h2");
        headerElement.innerHTML = edge.id();
        
        const sourceLink = document.createElement("a");
        sourceLink.href = "#";
        sourceLink.addEventListener("click",function(e) { edge.unselect(); edge.source().select(); });
        sourceLink.innerHTML = edge.source().id();

        const targetLink = document.createElement("a");
        targetLink.href = "#";
        targetLink.addEventListener("click",function(e) { edge.unselect(); edge.target().select(); });
        targetLink.innerHTML = edge.target().id();
        
        details.innerHTML = "";

        const paragraph = document.createElement("p");
        paragraph.appendChild(sourceLink);
        const label = document.createElement("i");
        label.innerHTML = " " + edge.data("label") + " ";
        paragraph.appendChild(label);
        paragraph.appendChild(targetLink);
        details.appendChild(headerElement);
        details.appendChild(paragraph);
        // Only show the edge and the connected nodes
        cy.elements().forEach(n => n.style("opacity", 0.2));
        edge.style("opacity", 1);
        edge.connectedNodes().forEach(n => n.style("opacity", 1));
    } else if (event.target === cy) {
        unhighlightNode();
    }
}

function unhighlightNode(event) {
    cy.elements().forEach(n => n.style("opacity", 1));
    document.getElementById("details").innerHTML = "";
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
                        description: description["summary"],
                        urls: description["urls"],
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
            cy = window.cy = cytoscape({
                container: document.getElementById('cy'),
                elements: elements,
                layout: { name: 'random' },
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
                            'label': 'data(id)'
                        }
                    },
                    {
                        selector: ':selected',
                        style: {
                            'outline-color': 'darkorange',
                            'outline-style': 'solid',
                            'outline-width': 3,
                            'color': 'darkorange',
                            'line-color': 'darkorange',
                            'target-arrow-color': 'darkorange'
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
            layoutNodes();
            selectionChanged();
            cy.on("select", "*", highlightElement);
            cy.on("unselect", "*", unhighlightNode);
        }
    )
);



  