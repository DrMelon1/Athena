const demoData = [
    { title: "game 1", status: "1. Playing", dlc: "No", rating: "-"},
    { title: "dlc 1", status: "4. Not Started", dlc: "Yes", rating: "-"},
];

let games = loadFromStorage() || demoData.slice();

// Default sort table by status
games.sort((a, b) => {
    const va = (a.status || "").toLowerCase();
    const vb = (b.status || "").toLowerCase();
    if (va < vb) return -1;
    if (va > vb) return 1;
    return 0;
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
                <input type="text" value="${game.rating}" data-index="${index}" data-field="rating" style="width:50%">
            </td>
            <td class="actions">
                <button data-action="delete" data-index="${index}">Delete</button>
            </td>
        `;

        tbody.appendChild(tr);

    });

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
        "1. Playing",
        "2. On-Hold",
        "3. On-Going",
        "4. Not Started",
        "5. Finished"
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
    if(status.startsWith("1")) return "status-playing";
    if(status.startsWith("2")) return "status-onhold";
    if(status.startsWith("3")) return "status-ongoing";
    if(status.startsWith("4")) return "status-notstarted";
    if(status.startsWith("5")) return "status-finished";
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
    games.unshift({ title: "New Game", status: "4. Not Started", dlc: "No", rating: "-"});
    saveToStorage();
    renderTable();
};

// header sort
document.querySelectorAll("thead th").forEach(th=>{
    th.onclick = ()=>{
        const key = th.dataset.key;

        // ignore if the user tries to sort these columns
        if(!key || key === "actions" || key === "id") //  || key === "cover" <-- implement later on (in TV?), also add ID (#) here when implemented?
            return;

        // note: if rating 10 is given, it appears at the bottom of the list (probably due to sorting by first digit?) <-- fix soon!
        if(!key || key === "dlc" || key === "rating" ) {
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
    games.forEach(game => {
        csv += `${index + 1},${game.title},${game.status},${game.dlc},${game.rating}\n`;
    });
    return csv;
}

// save as (.csv)
function saveAsCSV() {
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
        return saveAsCSV();
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
        // if filesystem access not allowed >>> save as!!
        saveAsCSV();
        return;
    }

    if (!fileHandle) {
        // if file doesn't exist >>> save as!!
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

// save as button
document.getElementById("saveAsButton").onclick = saveAsCSV;


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

console.log("script.js run complete");
