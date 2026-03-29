// 1. Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCkid-KKHmHUUuR0oikBjPGMkha0FJB5Dc",
    authDomain: "flightinn-cb4ba.firebaseapp.com",
    projectId: "flightinn-cb4ba",
    storageBucket: "flightinn-cb4ba.firebasestorage.app",
    messagingSenderId: "272507283961",
    appId: "1:272507283961:web:e935c63963d1c8dde63528",
    databaseURL: "https://flightinn-cb4ba-default-rtdb.firebaseio.com"
};

// 2. Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

// 3. Global Variables
let flightInnData = {};
let currentCategory = 'Airlines';

// 4. Cloud Sync (The Live Connection)
function syncWithCloud() {
    database.ref('flightData').on('value', (snapshot) => {
        const cloudData = snapshot.val();
        if (cloudData) {
            flightInnData = cloudData;
            // If we are looking at a list, refresh it live
            const viewport = document.getElementById('view-port');
            if (viewport.innerHTML.includes('Directory')) {
                loadDirectory(currentCategory);
            }
        }
    });
}

// 5. Navigation & Directory Display
function loadDirectory(cat) {
    currentCategory = cat;
    const list = flightInnData[cat];
    let html = `<h2>${cat} Directory</h2><hr>`;
    
    if (list && Object.keys(list).length > 0) {
        for (let item in list) {
            html += `<span class="result-link" onclick="openEntry('${cat}', '${item}')">${item}</span>`;
        }
    } else {
        html += `<p>No data found. Click "+ Edit" to add a ${cat.slice(0,-1)}!</p>`;
    }
    document.getElementById('view-port').innerHTML = html;
}

// 6. Detailed Entry View (Includes Map Logic for Routes)
function openEntry(cat, item) {
    const data = flightInnData[cat][item];
    let displayDescription = (typeof data === 'object') ? (data.info || "No details") : data;
    
    document.getElementById('view-port').innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <button class="back-btn" onclick="loadDirectory('${cat}')">← Back</button>
            <button onclick="editCurrentEntry('${cat}', '${item}')" style="background:none; border:1px solid #ccc; color:#666; padding:5px; cursor:pointer; font-size:12px;">[ Edit Info ]</button>
        </div>
        <h2>${item}</h2>
        <div class="info-card"><p>${displayDescription}</p></div>
    `;
}

    // Check if it's a Route with Coordinates
    if (cat === "Routes" && data.coords) {
        contentHTML += `
            <div class="info-card"><p>${data.info}</p></div>
            <div id="map" style="height: 450px; border-radius: 12px; margin-top: 20px;"></div>
        `;
        document.getElementById('view-port').innerHTML = contentHTML;
        
        // Leaflet Map Initialization
        setTimeout(() => {
            var map = L.map('map').setView(data.coords[0], 3);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; CARTO'
            }).addTo(map);

            const start = data.coords[0];
            const end = data.coords[1];

            // Draw Curved Flight Path
            const controlPoint = [(start[0] + end[0]) / 2 + (end[1] - start[1]) * 0.15, (start[1] + end[1]) / 2];
            const latlngs = [];
            for (let t = 0; t <= 1; t += 0.01) {
                const lat = (1 - t) * (1 - t) * start[0] + 2 * (1 - t) * t * controlPoint[0] + t * t * end[0];
                const lng = (1 - t) * (1 - t) * start[1] + 2 * (1 - t) * t * controlPoint[1] + t * t * end[1];
                latlngs.push([lat, lng]);
            }
            L.polyline(latlngs, {color: '#0066cc', weight: 3, dashArray: '8, 8'}).addTo(map);
            map.fitBounds(L.polyline(latlngs).getBounds(), {padding: [50, 50]});
        }, 200);

    } else {
        // Standard Text View for Airlines/Fleets/Airports
        let displayDescription = (typeof data === 'object') ? (data.info || "No details") : data;
        contentHTML += `<div class="info-card"><p>${displayDescription}</p></div>`;
        document.getElementById('view-port').innerHTML = contentHTML;
    }
}

// 7. Search Feature
function runQuery() {
    const query = document.getElementById('queryInput').value.toLowerCase();
    if (query.length < 1) return;
    let html = `<h2>Search Results</h2><hr>`;
    for (let cat in flightInnData) {
        for (let item in flightInnData[cat]) {
            let entry = flightInnData[cat][item];
            let text = (typeof entry === 'object') ? (entry.info || "") : entry;
            if (item.toLowerCase().includes(query) || text.toLowerCase().includes(query)) {
                html += `<span class="result-link" onclick="openEntry('${cat}', '${item}')">${item} (${cat})</span>`;
            }
        }
    }
    document.getElementById('view-port').innerHTML = html;
}

// Open the editor (Reset for "New" entry)
function openEditor() {
    document.getElementById('modal-title').innerText = "Add New Entry ✈️";
    document.getElementById('entry-name').value = "";
    document.getElementById('entry-info').value = "";
    document.getElementById('editor-modal').style.display = 'block';
}

// THE UNIVERSAL SAVE (Handles Airlines, Fleets, and Airports)
function saveEntry() {
    const category = document.getElementById('entry-category').value;
    const name = document.getElementById('entry-name').value;
    const info = document.getElementById('entry-info').value;

    if (name && info) {
        // Ensure the category exists in our data
        if (!flightInnData[category]) {
            flightInnData[category] = {};
        }

        // Save the data
        flightInnData[category][name] = info;

        // Sync to Firebase
        database.ref('flightData').set(flightInnData).then(() => {
            alert(name + " saved to " + category + "! 🚀");
            closeEditor();
            loadDirectory(category); // Refresh the view immediately
        });
    } else {
        alert("Please fill in both Name and Details!");
    }
}

// THE EDIT OPTION (Call this from an entry page)
function editCurrentEntry(cat, name) {
    const currentData = flightInnData[cat][name];
    
    document.getElementById('modal-title').innerText = "Editing: " + name;
    document.getElementById('entry-category').value = cat;
    document.getElementById('entry-name').value = name;
    document.getElementById('entry-info').value = (typeof currentData === 'object') ? currentData.info : currentData;
    
    document.getElementById('editor-modal').style.display = 'block';
}

function renderHome() {
    document.getElementById('view-port').innerHTML = `<h2>Welcome to the Hub</h2><p>Select a directory to view your aviation data.</p>`;
}

// 9. Startup
window.onload = function() {
    renderHome();
    syncWithCloud();
};
