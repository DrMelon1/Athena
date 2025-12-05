const demoData = [
    { title: "game 1", status: "Playing", dlc: "No", rating: "-"},
    { title: "dlc 1", status: "Not Started", dlc: "Yes", rating: "-"},
];

const statusOrder = {
    "Playing": 1,
    "On-Hold": 2,
    "On-Going": 3,
    "Not Started": 4,
    "Finished": 5
};

const statusColors = {
    "Playing": "#c6ffbc",
    "On-Hold": "#ffea8e",
    "On-Going": "#f0ceff",
    "Not Started": "#ffa0a0",
    "Finished": "#a1d6ff"
}

let statusChart = null;

function countGamesByStatus() {
    const counts = {
    "Playing": 0,
    "On-Hold": 0,
    "On-Going": 0,
    "Not Started": 0,
    "Finished": 0
    };

    games.forEach(game => {
        const status = game.status;
        if(status && counts.hasOwnProperty(status)) {
            counts[status]++;
        }
    });

    return counts;
}

function updatePieChart() {
    const counts = countGamesByStatus();
    const ctx = document.getElementById("statusChart");
    if(!ctx) return;

    const chartContext = ctx.getContext("2d");
    if(!chartContext) return;

    const totalGames = games.length;

    const chartTotalElement = document.querySelector(".chart_total");
    if(chartTotalElement) {
        chartTotalElement.textContent = totalGames;
    }

    const labels = [];
    const data = [];
    const bgColors = [];

    Object.entries(counts).forEach(([status, count]) => {
        if(count > 0) {
            labels.push(status);
            data.push(count);
            bgColors.push(statusColors[status]);
        }
    });


    if(statusChart) {
        
        statusChart.destroy();
        statusChart = null;
    }

    const currentTotalForChart = totalGames;

    statusChart = new Chart(chartContext, {
        type: "doughnut",
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: bgColors,
                borderColor: "#151515",
                borderWidth: 2,
                hoverOffset: 15,
                spacing: 2
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: "60%",
            radius: "85%",

            animation: {
                animateRotate: false,
                animateScale: false
            },

            plugins: {
                legend: {display: false},
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || "";
                            const value = context.raw || 0;
                            if(currentTotalForChart === 0) return `${value} (0%)`;
                            const percentage = Math.round((value / totalGames) * 100);
                            return `${value} (${percentage}%)`;
                        }
                    },
                    backgroundColor: "#151515",
                    titleColor: "#dfbb68",
                    bodyColor: "#ffffff",
                    borderColor: "#dfbb68",
                    borderWidth: 1
                }
            }
        }
    });

    statusChart.totalGames = totalGames;
}

let games = loadFromStorage() || demoData.slice();

// Default sort table by status
games.sort((a, b) => {
    const orderA = statusOrder[a.status];
    const orderB = statusOrder[b.status];
    return orderA - orderB;
});

let fileHandle = null;

const tbody = document.querySelector("#gameTable tbody");

function saveToStorage(){
    localStorage.setItem("gameBacklog", JSON.stringify(games));
}

function loadFromStorage(){
    try{return JSON.parse(localStorage.getItem("gameBacklog"));}
    catch(e) {return null;}
}

function renderTable(){
    tbody.innerHTML = "";
    const filter = document.getElementById("statusFilter").value.toLowerCase();
    const search = document.getElementById("inputSearch").value.toLowerCase();

    games.forEach((game, index)=>{
        if(filter && game.status.toLowerCase() !== filter) return;
        if(search && !game.title.toLowerCase().includes(search)) return;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="id" style="text-align:center;">${tbody.children.length + 1}</td>
            <td><input type="text" value="${escapeHtml(game.title)}" data-index="${index}" data-field="title" style="width:100%"></td>
            <td>
                <div style="margin-top:5px;">
                    <span class="status-badge ${statusClass(game.status)} status-badge-clickable" data-index="${index}">${game.status}</span>
                </div>
            </td>
            <td>
                <select data-index="${index}" data-field="dlc">
                    <option ${game.dlc === "No" ? "selected" : ""}>No</option>
                    <option ${game.dlc === "Yes" ? "selected" : ""}>Yes</option>
                </select>
            </td>
            <td>
                <select data-index="${index}" data-field="rating">
                    <option ${game.rating === "-" ? "selected" : ""}>-</option>
                    <option ${game.rating === "1" ? "selected" : ""}>1</option>
                    <option ${game.rating === "2" ? "selected" : ""}>2</option>
                    <option ${game.rating === "3" ? "selected" : ""}>3</option>
                    <option ${game.rating === "4" ? "selected" : ""}>4</option>
                    <option ${game.rating === "5" ? "selected" : ""}>5</option>
                    <option ${game.rating === "6" ? "selected" : ""}>6</option>
                    <option ${game.rating === "7" ? "selected" : ""}>7</option>
                    <option ${game.rating === "8" ? "selected" : ""}>8</option>
                    <option ${game.rating === "9" ? "selected" : ""}>9</option>
                    <option ${game.rating === "10" ? "selected" : ""}>10</option>
                </select>
            </td>
            <td class="actions">
                <button data-action="delete" data-index="${index}">Delete</button>
            </td>
        `;

        tbody.appendChild(tr);

    });

    updatePieChart();
    attachListeners();

}

let currentStatusMenu = null;

function openStatusMenu(badge, index) {

    if (currentStatusMenu) {
        currentStatusMenu.remove();
        currentStatusMenu = null;
    }

    const menu = document.createElement("div");
    menu.className = "status-menu";
    currentStatusMenu = menu;

    const options = [
        "Playing",
        "On-Hold",
        "On-Going",
        "Not Started",
        "Finished"
    ];

    options.forEach(option => {
        const item = document.createElement("div");
        item.className = "status-item";
        item.textContent = option;
        item.onclick = () => {
            games[index].status = option;
            saveToStorage();
            renderTable();
            menu.remove();
            currentStatusMenu = null;
        };
        menu.appendChild(item);
    });
    
    document.body.appendChild(menu);

    // get badge position
    const rect = badge.getBoundingClientRect();

    // calc available space
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    // est. menu height (approx. 40px per item + padding)
    const estimatedMenuHeight = options.length * 40 + 12;

    // determine menu position
    if (spaceBelow >= estimatedMenuHeight || spaceBelow >= spaceAbove) {

        // below
        menu.style.top = (rect.bottom + window.scrollY) + "px";
    
    }
    else {
        
        // above
        menu.style.top = (rect.top + window.scrollY - estimatedMenuHeight) + "px";

    }

    // horizontal position (aligned w/ badge)
    menu.style.left = (rect.left + window.scrollX) + "px";

    const closeMenu = (e) => {
        if(!menu.contains(e.target) && e.target !== badge) {
            menu.remove();
            currentStatusMenu = null;
            document.removeEventListener("mousedown", closeMenu);
        }
    };
    setTimeout(() => {
        document.addEventListener("mousedown", closeMenu);
    }, 0);

    const closeOnScroll = () => {
        menu.remove();
        currentStatusMenu = null;
        window.removeEventListener("scroll", closeOnScroll);
        document.removeEventListener("mousedown", closeMenu);
    };

    window.addEventListener("scroll", closeOnScroll);

}

function statusClass(status){
    if(status === "Playing") return "status-playing";
    if(status === "On-Hold") return "status-onhold";
    if(status === "On-Going") return "status-ongoing";
    if(status === "Not Started") return "status-notstarted";
    if(status === "Finished") return "status-finished";
    return "";
}

function attachListeners(){
    // inputs / selects
    tbody.querySelectorAll("input[data-field], select[data-field]").forEach(elem=>{
        elem.onchange = ()=>{
            const index = elem.dataset.index; const f = elem.dataset.field;
            games[index][f] = elem.value;
            saveToStorage();
            renderTable(); 
        };
    });

    tbody.querySelectorAll("button[data-action='delete']").forEach(btn=>{
        btn.onclick = ()=>{
            const index = btn.dataset.index; const action = btn.dataset.action;
            if(action === "delete"){
                games.splice(index, 1);
                saveToStorage();
                renderTable();
            }
        };
    });

    tbody.querySelectorAll(".status-badge-clickable").forEach(badge=>{
        badge.onclick = ()=>{
            const index = badge.dataset.index;
            openStatusMenu(badge, index);
        };
    });
}

// add Row
document.getElementById("addGameButton").onclick = ()=>{
    games.unshift({ title: "New Game", status: "Not Started", dlc: "No", rating: "-"});
    saveToStorage();
    renderTable();
};

// header sort
document.querySelectorAll("thead th").forEach(th=>{
    th.onclick = ()=>{
        const key = th.dataset.key;

        // ignore if the user tries to sort these columns
        if(!key || key === "actions" || key === "id") //  || key === "cover" <-- implement later on (in TV?)
            return;

        if(key === "status") {
            games.sort((a,b) => {
                const orderA = statusOrder[a.status];
                const orderB = statusOrder[b.status];
                return orderA - orderB;
            });
        }
        else if(key === "rating") {
            games.sort((a,b) => {
                const ratingA = a.rating;
                const ratingB = b.rating;

                if (ratingA === "-" && ratingB === "-") return 0;
                if (ratingA === "-" ) return 1;
                if (ratingB === "-") return -1;

                return parseInt(ratingB) - parseInt(ratingA);
            });
        }
        else if(key === "dlc") {
            games.sort((a,b)=>{
            const va=(a[key]||"").toString().toLowerCase();
            const vb=(b[key]||"").toString().toLowerCase();
            if(va>vb) return -1;
            if(va<vb) return 1;
            return 0;
        });
        }
        else {
            games.sort((a,b)=>{
            const va=(a[key]||"").toString().toLowerCase();
            const vb=(b[key]||"").toString().toLowerCase();
            if(va<vb) return -1;
            if(va>vb) return 1;
            return 0;
        });
        }
        saveToStorage();
        renderTable();
    };
});

// filter & search
document.getElementById("statusFilter").onchange = renderTable;
document.getElementById("inputSearch").oninput = renderTable;

// csv handling
function generateCSV() {
    let csv = "ID,Title,Status,DLC,Rating\n";
    games.forEach((game, index) => {
        csv += `${index + 1},${game.title},${game.status},${game.dlc},${game.rating}\n`;
    });
    return csv;
}

// export (.csv)
function exportCSV() {
    const csv = generateCSV();
    const blob = new Blob([csv], { type: 'text/csv' });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "game_backlog.csv";
    a.click();
}

// save
async function saveToCSV() {
    if(!("showSaveFilePicker" in window) || !fileHandle) {
        return exportCSV();
    }
    
    const writable = await fileHandle.createWritable();
    await writable.write(generateCSV());
    await writable.close();
    alert("File saved successfully!");
}

// open (+ fallback in case of unsupported browser)

document.getElementById("openFileButton").onclick = async() => {
    if("showOpenFilePicker" in window) {
        try {
            [fileHandle] = await window.showOpenFilePicker({
                types: [{
                    description: 'CSV Files',
                    accept: { 'text/csv': ['.csv'] }
                }]
            });

            const file = await fileHandle.getFile();
            const text = await file.text();
            loadCsvText(text);
            console.log("File loaded successfully!");
        } catch (e) {
            console.error(e);
            alert("Failed to open file.");
        }
    } 
    else {
    
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".csv";
        input.onchange = async () => {
            const file = input.files[0];
            const text = await file.text();
            loadCsvText(text);
            console.log("File loaded successfully!");
        };
        input.click();
    }
};

function loadCsvText(text) {
    const rows = text.trim().split("\n").map(r => r.split(","));
    games = rows.slice(1).map(r => ({
        id: Number(r[0]),
        title: r[1] || "",
        status: r[2] || "",
        dlc: r[3] || "",
        rating: r[4] || ""
    }));
    saveToStorage();
    renderTable();
}

// save button
document.getElementById("saveFileButton").onclick = async() => {
    if (!("showSaveFilePicker" in window)) {
        // if filesystem access not allowed >>> export (direct download)
        exportCSV();
        return;
    }

    if (!fileHandle) {
        // if file doesn't exist >>> export!!
        fileHandle = await window.showSaveFilePicker({
            suggestedName: "game_backlog.csv",
            types: [{
                description: 'CSV Files',
                accept: { 'text/csv': ['.csv'] }
            }]
        });
    }
    saveToCSV();
};

// export .csv button
document.getElementById("exportButton").onclick = exportCSV;


// xss protection
function escapeHtml(s){
    return (s||"")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

document.getElementById("inputSearch").value = "";
renderTable();

