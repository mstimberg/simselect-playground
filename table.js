const simulators = ["ANNarchy", "Arbor", "Brian", "Genesis", "GeNN",
                    "Nest", "Neuron", "TheVirtualBrain"];
const bio_levels = ["Population Model", "Single-Compartment (Simple) Model",
                    "Single-Compartment (Complex) Model", "Multi-Compartment Model"]
const comp_levels = ["GPU", "Single Machine", "Cluster", "Supercomputer"];
const colors = ['#a6cee3','#1f78b4','#b2df8a','#33a02c','#fb9a99','#e31a1c','#fdbf6f','#ff7f00'];

const width = 1200;
const colsize = (width - 150) / (bio_levels.length + 1);
const height = 600;
const rowsize = (height - bio_levels.length*20) / (comp_levels.length + 1);

function parse_file(simulator) {
    const directory = "data/";
    const url = directory + simulator + ".json";
    data = fetch(url);
    return data;
}

var criteria = [];  // selected criteria
var sim_descriptions = {}; // simulator descriptions

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

function toggle(feature) {
    const checkbox = document.getElementById("select_" + feature);
    if (checkbox.checked) {
        criteria.push(feature);
    } else {
        const index = criteria.indexOf(feature);
        if (index > -1) { // only splice array when item is found
            criteria.splice(index, 1); // 2nd parameter means remove one item only
        }
    }
    update_table();
}

function update_table() {
    let header = "<thead class='simulator_table'>\n<th></th>"
    bio_levels.forEach(bio_level => {
        const is_selected = criteria.indexOf(bio_level) >= 0 ? "checked" : "";
        header += `<th><div class="header_space"><div class="header"><input type="checkbox" id="select_${bio_level}" name="select_${bio_level}" onclick="toggle('${bio_level}');"/ ${is_selected}><label for="select_${bio_level}">${bio_level}</label></div></div></th>`;
    });
    comp_levels.forEach(comp_level => {
        const is_selected = criteria.indexOf(comp_level) >= 0 ? "checked" : "";
        header += `<th><div class="header_space"><div class="header"><input type="checkbox" id="select_${comp_level}" name="select_${comp_level}" onclick="toggle('${comp_level}');" ${is_selected}/><label for="select_${comp_level}">${comp_level}</label></div></div></th>`;;
    });
    header += "\n</thead>";
    let rows = [];
    for (const [simulator, sim_description] of Object.entries(sim_descriptions)) {
        let matches = 0;
        let row = `<tr><th scope="row" class='simulator_name'>${simulator}</td>`;
        bio_levels.forEach(bio_level => {
            const cell_class = get_cell_class(criteria, bio_level, sim_description["biological_level"]);
            if (cell_class == "match")
                matches++;
            row += `<td class=${cell_class}></td>`;
        })
        comp_levels.forEach(comp_level => {
            const cell_class = get_cell_class(criteria, comp_level, sim_description["computing_scale"]);
            if (cell_class == "match")
                matches++;
            row += `<td class=${cell_class}></td>`;
        })
        row += "</tr>"
        rows.push({row: row, matches: matches});
    }
    rows.sort((a, b) => b['matches']-a['matches'])
    let table_div = document.getElementById("table");
    table_div.innerHTML = "<table>\n" + header + "\n<tbody>" + rows.map(r => r["row"]).join("\n") + "</tbody></table>"
}

document.addEventListener("DOMContentLoaded", (event) => {
    parse_files().then(function(descriptions) {
        sim_descriptions = descriptions;
        update_table();
    });
});

function get_cell_class(criteria, feature, category_description) {
    if (criteria.indexOf(feature) >= 0) {
        if (category_description.indexOf(feature) >= 0)
            cell_class = "match";

        else
            cell_class = "mismatch";
    } else {
        if (category_description.indexOf(feature) >= 0)
            cell_class = "has_feature";

        else
            cell_class = "no_feature";
    }
    return cell_class;
}
