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

firebase.initializeApp(firebaseConfig);
const database = firebase.database();
let flightInnData = {};

// --- CLOUD SYNC ---
function sync() {
    database.ref('flightData').on('value', (s) => {
        flightInnData = s.val() || {};
        // Auto-load home if the viewport is empty
        if (!document.getElementById('view-port').innerHTML.trim()) renderHome();
    });
}

function renderHome() {
    const f = flightInnData.Fleets ? Object.keys(flightInnData.Fleets).length : 0;
    const a = flightInnData.Airlines ? Object.keys(flightInnData.Airlines).length : 0;
    const r = flightInnData.Routes ? Object.keys(flightInnData.Routes).length : 0;
    const ap = flightInnData.Airports ? Object.keys(flightInnData.Airports).length : 0; // Added this

    document.getElementById('view-port').innerHTML = `
        <h1 style="color:var(--primary);">System Overview</h1>
        <div class="card-grid">
            <div class="stat-card"><h3>${f}</h3><p>Fleets</p></div>
            <div class="stat-card"><h3>${a}</h3><p>Airlines</p></div>
            <div class="stat-card"><h3>${ap}</h3><p>Airports</p></div> <div class="stat-card"><h3>${r}</h3><p>Routes</p></div>
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
        html += `<div id="map" style="height:400px; border-radius:12px; margin-top:20px; border:1px solid #ddd;"></div>`;
        document.getElementById('view-port').innerHTML = html;

        // Give the browser 200ms to render the DIV before Leaflet tries to draw the map
        setTimeout(() => {
            var m = L.map('map');
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(m);
            
            var path = L.polyline(data.coords, {color: '#0066cc', weight: 5, opacity: 0.7}).addTo(m);
            
            // This is the magic part: it auto-zooms to fit the flight path
            m.fitBounds(path.getBounds(), {padding: [50, 50]});
        }, 200);
    } else {
        document.getElementById('view-port').innerHTML = html;
    }
}

// --- ACTIONS ---
function openEditor() { document.getElementById('editor-modal').style.display='flex'; }
function closeEditor() { document.getElementById('editor-modal').style.display='none'; }

function saveEntry() {
    const cat = document.getElementById('entry-category').value;
    const name = document.getElementById('entry-name').value;
    const img = document.getElementById('entry-image').value;
    const info = document.getElementById('entry-info').value;

    // Check if name is empty
    if (!name) return alert("Please enter a name!");

    // Ensure the category exists in our local data object
    if (!flightInnData[cat]) flightInnData[cat] = {};

    if (cat === "Routes") {
        const parts = info.split('|');
        if (parts.length < 3) {
            alert("Route Format Error! Use: Description | Lat,Lng | Lat,Lng");
            return;
        }
        
        try {
            const start = parts[1].trim().split(',').map(Number);
            const end = parts[2].trim().split(',').map(Number);
            
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
        // Standard save for Fleets, Airlines, and Airports
        flightInnData[cat][name] = { 
            info: info, 
            image: img 
        };
    }

    // Push to Firebase
    console.log("Attempting to save:", name, "to", cat);
    database.ref('flightData').set(flightInnData)
        .then(() => {
            console.log("Save Successful!");
            closeEditor();
            loadDirectory(cat);
        })
        .catch((error) => {
            console.error("Firebase Error:", error);
            alert("Cloud Save Failed: " + error.message);
        });
}

    database.ref('flightData').set(flightInnData).then(() => {
        closeEditor();
        loadDirectory(cat);
    });
}

function deleteItem(cat, item) {
    if(confirm("Permanently delete " + item + "?")) {
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
    let results = [];
    
    // Search through all categories
    ['Fleets', 'Airlines', 'Airports', 'Routes'].forEach(cat => {
        if (flightInnData[cat]) {
            Object.keys(flightInnData[cat]).forEach(item => {
                if (item.toLowerCase().includes(query)) {
                    results.push({cat, item});
                }
            });
        }
    });

    // Display results
    let html = `<h2>Search Results</h2>`;
    results.forEach(res => {
        html += `<div class="list-item" onclick="openEntry('${res.cat}', '${res.item}')">${res.item} (${res.cat})</div>`;
    });
    document.getElementById('view-port').innerHTML = html;
}

window.onload = sync;

function searchDatabase() {
    let query = document.getElementById('queryInput').value.toLowerCase();
    let viewport = document.getElementById('view-port');
    
    // If search is empty, go back to Home
    if (query === "") {
        renderHome();
        return;
    }

    let resultsHtml = `<h2 style="color:var(--primary);">Search Results</h2><div class="list-container">`;
    let found = false;

    // We loop through every category in your database
    ['Airlines', 'Fleets', 'Airports', 'Routes'].forEach(cat => {
        if (flightInnData[cat]) {
            Object.keys(flightInnData[cat]).forEach(item => {
                // If the name matches what you typed
                if (item.toLowerCase().includes(query)) {
                    found = true;
                    resultsHtml += `
                        <div class="list-item" onclick="openEntry('${cat}', '${item}')">
                            <span style="font-weight:bold;">${item}</span> 
                            <span style="color:#888; font-size:12px; margin-left:10px;">in ${cat}</span>
                        </div>`;
                }
            });
        }
    });

    if (!found) {
        resultsHtml += `<p style="color:#888;">No aircraft or airlines found matching "${query}"</p>`;
    }

    viewport.innerHTML = resultsHtml + `</div>`;
}
