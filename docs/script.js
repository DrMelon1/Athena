const demoData = [
    { title: "game 1", status: "1. Playing", dlc: "No", rating: "-"},
    { title: "dlc 1", status: "4. Not Started", dlc: "Yes", rating: "-"},
];

let games = loadFromStorage() || demoData.slice();
const tbody = document.querySelector("#gameTable tbody");

function saveToStorage(){
    localStorage.setItem("gameBacklog", JSON.stringify(games)); 
}

function loadFromStorage(){
    try{return JSON.parse(localStorage.getItem("gameBacklog"));}catch(e){return null} 
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
            <td><input type="text" value="${escapeHtml(game.title)}" data-index="${index}" data-field="title" style="width:100%"></td>
            <td>
                <select data-index="${index}" data-field="status">
                    <option ${game.status === "1. Playing" ? "selected" : ""}>1. Playing</option>
                    <option ${game.status === "2. On-Hold" ? "selected" : ""}>2. On-Hold</option>
                    <option ${game.status === "3. On-Going" ? "selected" : ""}>3. On-Going</option>
                    <option ${game.status === "4. Not Started" ? "selected" : ""}>4. Not Started</option>
                    <option ${game.status === "5. Finished" ? "selected" : ""}>5. Finished</option>
                </select>
                <div style="margin-top:5px;"><span class="status-badge ${statusClass(game.status)}">${game.status}</span></div>
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

    /* update statusClass to statusMap later on?
    const statusMap = {
        "1": "status-playing",
        "2": "status-onhold",
        "3": "status-ongoing",
        "4": "status-notstarted",
        "5": "status-finished"
    };
    return statusMap[status[0]] || "";
    */

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
    }

    // add Row
    document.getElementById("addGameButton").onclick = ()=>{
        games.push({ title: "New Game", status: "4. Not Started", dlc: "No", rating: "-"});
        saveToStorage();
        renderTable();
    };

    // header sort
    document.querySelectorAll("thead th").forEach(th=>{
        th.onclick = ()=>{
            const key = th.dataset.key;
            if(!key || key === "actions" || key === "cover") 
                return;

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
            
            renderTable();
        };
    });

    // filter & search
    document.getElementById("statusFilter").onchange = renderTable;
    document.getElementById("inputSearch").oninput = renderTable;

    // xss protection
    function escapeHtml(s){
        return (s||"").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    renderTable();

console.log("script.js run complete");
