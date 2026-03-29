// 1. Firebase Config
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

// 2. Cloud Sync
function syncWithCloud() {
    database.ref('flightData').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) { 
            flightInnData = data; 
            // If we are on the home screen, refresh the counters live
            if (document.getElementById('view-port').innerHTML.includes('WELCOME')) {
                renderHome();
            }
        }
    });
}

// 3. Navigation & Directory
function loadDirectory(cat) {
    const list = flightInnData[cat];
    let html = `<h2>${cat} Directory</h2><hr>`;
    if (list) {
        for (let item in list) {
            html += `<span class="result-link" onclick="openEntry('${cat}', '${item}')">${item}</span>`;
        }
    } else {
        html += `<p>No data found in ${cat}.</p>`;
    }
    document.getElementById('view-port').innerHTML = html;
}

// 4. Detailed View (WITH EDIT BUTTON)
function openEntry(cat, item) {
    const data = flightInnData[cat][item];
    let contentHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <button class="back-btn" onclick="loadDirectory('${cat}')">← Back</button>
            <button onclick="editItem('${cat}', '${item}')" style="background:#34495e; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">[ Edit ]</button>
        </div>
        <h2>${item}</h2>
    `;

    if (cat === "Routes" && data.coords) {
        contentHTML += `<div class="info-card"><p>${data.info}</p></div><div id="map" style="height:400px; margin-top:20px;"></div>`;
        document.getElementById('view-port').innerHTML = contentHTML;
        setTimeout(() => {
            var map = L.map('map').setView(data.coords[0], 3);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);
            L.polyline(data.coords, {color: '#0066cc', weight: 3, dashArray: '8, 8'}).addTo(map);
            map.fitBounds(L.polyline(data.coords).getBounds(), {padding: [50, 50]});
        }, 200);
    } else {
        let desc = (typeof data === 'object') ? data.info : data;
        contentHTML += `<div class="info-card"><p>${desc || "No details."}</p></div>`;
        document.getElementById('view-port').innerHTML = contentHTML;
    }
}

// 5. Home Screen (WITH COUNTERS)
function renderHome() {
    const fleetSize = flightInnData.Fleets ? Object.keys(flightInnData.Fleets).length : 0;
    const airlineSize = flightInnData.Airlines ? Object.keys(flightInnData.Airlines).length : 0;
    const routeSize = flightInnData.Routes ? Object.keys(flightInnData.Routes).length : 0;

    document.getElementById('view-port').innerHTML = `
        <div style="display:flex; gap:15px; margin-bottom:30px;">
            <div style="background:#1a1a1a; padding:15px; border-radius:8px; flex:1; border-left:4px solid #0066cc;">
                <small style="color:#888;">FLEET</small><br><strong>${fleetSize} Aircraft</strong>
            </div>
            <div style="background:#1a1a1a; padding:15px; border-radius:8px; flex:1; border-left:4px solid #2ecc71;">
                <small style="color:#888;">AIRLINES</small><br><strong>${airlineSize} Operators</strong>
            </div>
            <div style="background:#1a1a1a; padding:15px; border-radius:8px; flex:1; border-left:4px solid #f1c40f;">
                <small style="color:#888;">ROUTES</small><br><strong>${routeSize} Active</strong>
            </div>
        </div>
        <h2>WELCOME TO FLIGHTINN</h2>
        <p>Your cloud-synced aviation database is online.</p>
    `;
}

// 6. Editor & Save Logic
function openEditor() { document.getElementById('editor-modal').style.display = 'block'; }
function closeEditor() { document.getElementById('editor-modal').style.display = 'none'; }

function editItem(cat, item) {
    const data = flightInnData[cat][item];
    document.getElementById('entry-category').value = cat;
    document.getElementById('entry-name').value = item;
    if (cat === "Routes" && data.coords) {
        document.getElementById('entry-info').value = `${data.info} | ${data.coords[0]} | ${data.coords[1]}`;
    } else {
        document.getElementById('entry-info').value = (typeof data === 'object') ? data.info : data;
    }
    openEditor();
}

function saveEntry() {
    const cat = document.getElementById('entry-category').value;
    const name = document.getElementById('entry-name').value;
    const info = document.getElementById('entry-info').value;

    if (!flightInnData[cat]) flightInnData[cat] = {};

    if (cat === "Routes") {
        const p = info.split('|');
        flightInnData[cat][name] = { info: p[0], coords: [p[1].split(',').map(Number), p[2].split(',').map(Number)] };
    } else {
        flightInnData[cat][name] = info;
    }

    database.ref('flightData').set(flightInnData).then(() => {
        alert("Sync Complete!");
        closeEditor();
        loadDirectory(cat);
    });
}

// 7. Launch
window.onload = function() { syncWithCloud(); renderHome(); };
