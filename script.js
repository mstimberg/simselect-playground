const simulators = ["ANNarchy", "Arbor", "Brian", "Genesis", "GeNN",
                    "Nest", "Neuron", "TheVirtualBrain"];
const bio_levels = ["Population Model", "Single-Compartment (Simple) Model",
                    "Single-Compartment (Complex) Model", "Multi-Compartment Model"]
const comp_levels = ["GPU", "Single Machine", "Cluster", "Supercomputer"];
const colors = ['#a6cee3','#1f78b4','#b2df8a','#33a02c','#fb9a99','#e31a1c','#fdbf6f','#ff7f00'];

const width = 1024;
const colsize = (width - 150) / (bio_levels.length + 1);
const height = 600;
const rowsize = (height - bio_levels.length*20) / (comp_levels.length + 1);

function parse_file(simulator) {
    const directory = "data/";
    const url = directory + simulator + ".json";
    data = fetch(url);
    return data;
}


function parse_files() {
    return Promise.all(simulators.map(sim => parse_file(sim))).then(
        function(sims) {
                return Promise.all(sims.map(s => s.json()));
        }).then(
        function(data) {
            descriptions = {};
            for (let i=0; i < simulators.length; i++ ) {
                description = {};
                // JSON file is a list on the top level instead of a dict
                data[i].forEach(function(d) {
                    description[Object.keys(d)[0]] = Object.values(d)[0];
                });
                descriptions[simulators[i]] = description;
            }
            return descriptions;
        });
}

function calc_rectangle(description) {
    let starts_x = [];
    let ends_x = [];
    let starts_y = [];
    let ends_y = [];

    for (let i=0; i<bio_levels.length; i++) {
        if (description["biological_level"].indexOf(bio_levels[i]) > -1) {
            if (starts_x.length == 0 || ends_x[ends_x.length-1] < i + 1) {
                starts_x.push(i + 1);
            }
         } else {
            if (starts_x.length > ends_x.length) {
                ends_x.push(i);
            }
        }
    }
    if (starts_x.length > ends_x.length) {
        ends_x.push(bio_levels.length);
    }
    for (let i=0; i<comp_levels.length; i++) {
        if (description["computing_scale"].indexOf(comp_levels[i]) > -1) {
            if (starts_y.length == 0 ||
                (ends_y[ends_y.length-1] < i + 1 && starts_y.length === ends_y.length)) {
                starts_y.push(i + 1);
            }
         } else {
            if (starts_y.length > ends_y.length) {
                ends_y.push(i);
            }
        }
    }
    if (starts_y.length > ends_y.length) {
        ends_y.push(comp_levels.length);
    }
    return {'starts_x': starts_x, 'ends_x': ends_x,
            'starts_y': starts_y, 'ends_y': ends_y};
}

function draw_rectangle(sim_idx, coords, svg) {
    ids = [];
    counter = 0;
    for (let i = 0; i < coords.starts_x.length; i++) {
        for (let j = 0; j < coords.starts_y.length; j++) {
            counter += 1;
            rect = document.createElementNS('http://www.w3.org/2000/svg', "rect");
            rect.setAttribute("x", (coords.starts_x[i] - 0.5)*colsize + sim_idx*2);
            rect.setAttribute("y", (coords.starts_y[j] - 0.5)*rowsize + sim_idx*2);
            rect.setAttribute("width", (coords.ends_x[i] - coords.starts_x[i] + 1)*colsize);
            rect.setAttribute("height", (coords.ends_y[j] - coords.starts_y[j] + 1)*rowsize);
            rect.setAttribute("rx", 10);
            rect.setAttribute("ry", 10);
            rect.setAttribute("stroke-width", "1");
            rect.setAttribute("fill", "transparent");
            rect.setAttribute("stroke", colors[sim_idx])
            id = simulators[sim_idx] + "_" + counter
            rect.setAttribute("id", id);
            ids.push(id);
            svg.appendChild(rect);
        }
    }
    return ids;
}

function mark_buttons(x, y, coords) {
    console.log(x, y);
    if (x < 0.5*colsize/2 || x > (bio_levels.length + 0.5)*colsize || y < 0.5*rowsize/2 || y > (comp_levels.length + 0.5)*rowsize) {
        reset_buttons();
        return;
    }
    for (let i = 0; i < simulators.length; i++) {
        sim_coords = coords[simulators[i]].coords;
        let fits = false;
        for (let j = 0; j < sim_coords.starts_x.length; j++) {
            for (let k=0; k < sim_coords.starts_y.length; k++) {
                if (x/colsize >= sim_coords.starts_x[j]-0.5 && x/colsize <= sim_coords.ends_x[j]+0.5 &&
                    y/rowsize >= sim_coords.starts_y[k]-0.5 && y/rowsize <= sim_coords.ends_y[k]+0.5) {
                    fits = true;
                    break;
                }
            }
        }
        sim_button = document.getElementById(simulators[i]);
        svg_ids = coords[simulators[i]].ids;
        if (fits) {
            stroke_width = 3;
            sim_button.setAttribute("class","xkcd-script active");
        } else {
            stroke_width = 1;
            sim_button.setAttribute("class","xkcd-script");
        }
        svg_ids.forEach(function(id) {
            rect = document.getElementById(id);
            rect.setAttribute("stroke-width", stroke_width);
        });
    }
}

function reset_buttons() {
    for (let i = 0; i < simulators.length; i++) {
        sim_button = document.getElementById(simulators[i]);
        sim_button.setAttribute("class","xkcd-script");
        svg_ids = all_coords[simulators[i]].ids;
        svg_ids.forEach(function(id) {
            rect = document.getElementById(id);
            rect.setAttribute("stroke-width", 1);
        });
    }
}

document.addEventListener("DOMContentLoaded", (event) => {
    parse_files().then(function(descriptions) {
        let buttons_div = document.getElementById("buttons");
        let buttons = [];
        for (let i = 0; i < simulators.length; i++) {
            let button = document.createElement("button");
            button.innerHTML = simulators[i];
            button.id = simulators[i];
            button.setAttribute("style", "background: " + colors[i] + ";");
            buttons_div.appendChild(button);
        }
        // create SVG graph
        let graph_div = document.getElementById("graph");
        let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", width);
        svg.setAttribute("height", height);
        all_coords = {};
        simulators.forEach(function(simulator, idx) {
            coords = calc_rectangle(descriptions[simulator]);
            ids = draw_rectangle(idx, coords, svg);
            all_coords[simulator] = {'coords': coords, 'ids': ids};
        });
        
        for (let i = 0; i < bio_levels.length; i++) {
            text = document.createElementNS('http://www.w3.org/2000/svg', "text");
            text.setAttribute("x", (i+1)*colsize);
            text.setAttribute("y", height - bio_levels.length*20 + i*20);
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("font-family", "xkcd-script");
            textNode= document.createTextNode(bio_levels[i]);
            text.appendChild(textNode);
            svg.appendChild(text);
        }
        
        for (let i = 0; i < comp_levels.length; i++) {
            text = document.createElementNS('http://www.w3.org/2000/svg', "text");
            text.setAttribute("y", (i + 1)*rowsize);
            text.setAttribute("x", width - 150);
            text.setAttribute("font-family", "xkcd-script");
            textNode= document.createTextNode(comp_levels[i]);
            text.appendChild(textNode);
            svg.appendChild(text);
        }

        graph_div.appendChild(svg);
        // Trigger function when hovering over the svg element
        svg.addEventListener("mousemove", function(e) {
            let x = e.clientX;
            let y = e.clientY;
            pt = svg.createSVGPoint();
            pt.x = x;
            pt.y = y;
            const svgP = pt.matrixTransform( svg.getScreenCTM().inverse() );
            mark_buttons(svgP.x, svgP.y, all_coords);
        });
        svg.addEventListener("mouseleave", function(e) {
            reset_buttons();
        });
    });
});