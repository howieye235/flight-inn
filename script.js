
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

function openEntry(cat, item) {
    const data = flightInnData[cat][item];
    // Fixed the image link since via.placeholder is down
    const img = data.image || "https://placehold.co/800x400?text=No+Photo";
    
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
            var container = L.DomUtil.get('map');
            if (container != null) { container._leaflet_id = null; }

            // Initialize Map
            var m = L.map('map').setView(data.coords[0], 3);
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(m);

            // DRAW THE LINE (Straight line for now since Arc is blocked)
            var path = L.polyline([data.coords[0], data.coords[1]], {
                color: '#0066cc', 
                weight: 4,
                dashArray: '10, 10' // Makes it look like a cool flight path!
            }).addTo(m);

            // IATA LABELS (Bringing them back!)
            const codes = item.split('-'); 
            if(codes.length === 2) {
                // Label 1
                L.marker(data.coords[0], {
                    icon: L.divIcon({className: 'iata-label-navy', html: `<span>${codes[0].trim()}</span>`, iconSize:[40,20]})
                }).addTo(m);
                // Label 2
                L.marker(data.coords[1], {
                    icon: L.divIcon({className: 'iata-label-navy', html: `<span>${codes[1].trim()}</span>`, iconSize:[40,20]})
                }).addTo(m);
            }

            m.invalidateSize();
            m.fitBounds(path.getBounds(), {padding: [50, 50]});
        }, 400);
    } else {
        document.getElementById('view-port').innerHTML = html;
    }
}
// --- ACTIONS & SEARCH ---
function openEditor() { document.getElementById('editor-modal').style.display='flex'; }
function closeEditor() { document.getElementById('editor-modal').style.display='none'; }

function saveEntry() {
    const cat = document.getElementById('entry-category').value;
    const name = document.getElementById('entry-name').value;
    const img = document.getElementById('entry-image').value;
    const info = document.getElementById('entry-info').value;

    // 1. Validation
    if (!name) return alert("Please enter a name (e.g., JFK-LHR)");
    if (!flightInnData[cat]) flightInnData[cat] = {};

    // 2. Specialized Logic for Routes (Coordinates)
    if (cat === "Routes") {
        const parts = info.split('|');
        if (parts.length < 3) {
            alert("Format Error! Use: Description | Lat,Lng | Lat,Lng");
            return;
        }
        
        try {
            // Convert strings like "40.6, -73.7" into real Numbers [40.6, -73.7]
            const start = parts[1].split(',').map(num => parseFloat(num.trim()));
            const end = parts[2].split(',').map(num => parseFloat(num.trim()));
            
            flightInnData[cat][name] = { 
                info: parts[0].trim(), 
                image: img, 
                coords: [start, end] 
            };
        } catch (e) {
            alert("Coordinate error! Make sure they are numbers separated by commas.");
            return;
        }
    } else {
        // 3. Standard save for Fleets, Airlines, and Airports
        flightInnData[cat][name] = { 
            info: info, 
            image: img 
        };
    }

    // 4. Push to Firebase Cloud
    database.ref('flightData').set(flightInnData)
        .then(() => {
            closeEditor();
            loadDirectory(cat);
        })
        .catch((error) => {
            console.error("Firebase Error:", error);
            alert("Cloud Save Failed!");
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
