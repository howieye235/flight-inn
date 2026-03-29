
// --- CONFIG & INIT ---
const firebaseConfig = {
    apiKey: "AIzaSyCkid-KKHmHUUuR0oikBjPGMkha0FJB5Dc",
    authDomain: "flightinn-cb4ba.firebaseapp.com",
    projectId: "flightinn-cb4ba",
    storageBucket: "flightinn-cb4ba.firebasestorage.app",
    messagingSenderId: "272507283961",
    appId: "1:272507283961:web:e935c63963d1c8dde63528",
    databaseURL: "https://flightinn-cb4ba-default-rtdb.firebaseio.com"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const database = firebase.database();
let flightInnData = {};

// --- CLOUD SYNC ---
function sync() {
    database.ref('flightData').on('value', (s) => {
        flightInnData = s.val() || {};
        // This ensures the dashboard updates whenever the data changes
        renderHome(); 
    });
}

// --- NAVIGATION & DASHBOARD ---
function renderHome() {
    const f = flightInnData.Fleets ? Object.keys(flightInnData.Fleets).length : 0;
    const a = flightInnData.Airlines ? Object.keys(flightInnData.Airlines).length : 0;
    const r = flightInnData.Routes ? Object.keys(flightInnData.Routes).length : 0;
    const ap = flightInnData.Airports ? Object.keys(flightInnData.Airports).length : 0;

    document.getElementById('view-port').innerHTML = `
        <h1 style="color:var(--primary);">System Overview</h1>
        <div class="card-grid">
            <div class="stat-card"><h3>${f}</h3><p>Fleets</p></div>
            <div class="stat-card"><h3>${a}</h3><p>Airlines</p></div>
            <div class="stat-card"><h3>${ap}</h3><p>Airports</p></div>
            <div class="stat-card"><h3>${r}</h3><p>Routes</p></div>
        </div>
    `;
}

function loadDirectory(cat) {
    let html = `<h2>${cat}</h2><div class="list-container">`;
    if (flightInnData[cat]) {
        for (let item in flightInnData[cat]) {
            html += `<div class="list-item" onclick="openEntry('${cat}', '${item}')">${item}</div>`;
        }
    }
    document.getElementById('view-port').innerHTML = html + `</div>`;
}

// --- ENTRY VIEW (MAPS, CURVES, IATA) ---
function openEntry(cat, item) {
    const data = flightInnData[cat][item];
    const img = data.image || "https://via.placeholder.com/800x400?text=No+Photo";
    
    let html = `
        <button class="back-btn" onclick="loadDirectory('${cat}')">← Back</button>
        <div class="hero" style="background-image: url('${img}')">
            <div class="hero-text"><h1>${item}</h1></div>
        </div>
        <div class="info-block">
            <p>${data.info || "No details provided."}</p>
            <div style="margin-top:20px; display:flex; gap:10px;">
                <button onclick="editItem('${cat}', '${item}')" class="edit-btn">Edit</button>
                <button onclick="deleteItem('${cat}', '${item}')" class="delete-btn">Delete</button>
            </div>
        </div>
    `;

    if (cat === "Routes" && data.coords) {
    html += `<div id="map" style="height:450px; width:100%; background:#ddd; border-radius:12px; margin-top:20px;"></div>`;
    document.getElementById('view-port').innerHTML = html;

    setTimeout(() => {
        // Check if map already exists, if so, remove it to prevent "Already Initialized" error
        var container = L.DomUtil.get('map');
        if (container != null) { container._leaflet_id = null; }

        var m = L.map('map').setView(data.coords[0], 3);

        // Standard OpenStreetMap Tiles (The most reliable ones)
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }).addTo(m);

        // THE CURVED LINE
        var path = L.Polyline.Arc(L.latLng(data.coords[0]), L.latLng(data.coords[1]), {
            color: '#0066cc', 
            weight: 4, 
            vertices: 100 
        }).addTo(m);

        // IATA LABELS
        const codes = item.split('-'); 
        if(codes.length === 2) {
            L.marker(data.coords[0], {icon: L.divIcon({className: 'iata-label-navy', html: `<span>${codes[0].trim()}</span>` , iconSize:[40,20]})}).addTo(m);
            L.marker(data.coords[1], {icon: L.divIcon({className: 'iata-label-navy', html: `<span>${codes[1].trim()}</span>` , iconSize:[40,20]})}).addTo(m);
        }

        // Final nudge to make sure tiles load
        m.invalidateSize();
        m.fitBounds(path.getBounds(), {padding: [50, 50]});
    }, 400); // 400ms gives it plenty of time to render the white theme container
}
    else {
    document.getElementById('view-port').innerHTML = html;
} // <--- ADD THIS (Closes the "else" block)
} // <--- ADD THIS (Closes the "openEntry" function)
// --- ACTIONS & SEARCH ---
function openEditor() { document.getElementById('editor-modal').style.display='flex'; }
function closeEditor() { document.getElementById('editor-modal').style.display='none'; }

function saveEntry() {
    const cat = document.getElementById('entry-category').value;
    const name = document.getElementById('entry-name').value;
    const img = document.getElementById('entry-image').value;
    const info = document.getElementById('entry-info').value;

    if (!name) return alert("Enter a name!");
    if (!flightInnData[cat]) flightInnData[cat] = {};

    if (cat === "Routes") {
        const parts = info.split('|');
        if (parts.length < 3) return alert("Use: Info | Lat,Lng | Lat,Lng");
        try {
            const start = parts[1].trim().split(',').map(Number);
            const end = parts[2].trim().split(',').map(Number);
            flightInnData[cat][name] = { info: parts[0].trim(), image: img, coords: [start, end] };
        } catch (e) { return alert("Coordinate error!"); }
    } else {
        flightInnData[cat][name] = { info: info, image: img };
    }

    database.ref('flightData').set(flightInnData).then(() => {
        closeEditor();
        loadDirectory(cat);
    });
}

function deleteItem(cat, item) {
    if(confirm("Delete " + item + "?")) {
        delete flightInnData[cat][item];
        database.ref('flightData').set(flightInnData).then(() => loadDirectory(cat));
    }
}

function editItem(cat, item) {
    const d = flightInnData[cat][item];
    document.getElementById('entry-category').value = cat;
    document.getElementById('entry-name').value = item;
    document.getElementById('entry-image').value = d.image || "";
    document.getElementById('entry-info').value = (cat === "Routes") ? `${d.info}|${d.coords[0]}|${d.coords[1]}` : d.info;
    openEditor();
}

function searchDatabase() {
    let query = document.getElementById('queryInput').value.toLowerCase();
    let viewport = document.getElementById('view-port');
    if (query === "") { renderHome(); return; }

    let html = `<h2>Search Results</h2><div class="list-container">`;
    let found = false;
    ['Airlines', 'Fleets', 'Airports', 'Routes'].forEach(cat => {
        if (flightInnData[cat]) {
            Object.keys(flightInnData[cat]).forEach(item => {
                if (item.toLowerCase().includes(query)) {
                    found = true;
                    html += `<div class="list-item" onclick="openEntry('${cat}', '${item}')">${item} <small>(${cat})</small></div>`;
                }
            });
        }
    });
    viewport.innerHTML = found ? html + `</div>` : `<p>No results found.</p>`;
}

window.onload = sync;
