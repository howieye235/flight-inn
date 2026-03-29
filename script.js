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
        if (s.val()) { 
            flightInnData = s.val(); 
            if(!document.querySelector('.nav-item.active')) renderHome();
        }
    });
}

// --- NAVIGATION ---
function renderHome() {
    const f = flightInnData.Fleets ? Object.keys(flightInnData.Fleets).length : 0;
    const a = flightInnData.Airlines ? Object.keys(flightInnData.Airlines).length : 0;
    const r = flightInnData.Routes ? Object.keys(flightInnData.Routes).length : 0;

    document.getElementById('view-port').innerHTML = `
        <div class="dashboard">
            <h1 style="color:#222;">System Overview</h1>
            <div class="card-grid">
                <div class="stat-card"><h3>${f}</h3><p>Fleets</p></div>
                <div class="stat-card"><h3>${a}</h3><p>Airlines</p></div>
                <div class="stat-card"><h3>${r}</h3><p>Routes</p></div>
            </div>
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
    const img = data.image || "https://via.placeholder.com/800x300?text=No+Photo+Uploaded";
    
    let html = `
        <button class="back-btn" onclick="loadDirectory('${cat}')">← Back</button>
        <div class="hero" style="background-image: url('${img}')">
            <div class="hero-text"><h1>${item}</h1></div>
        </div>
        <div class="info-block">
            <p>${data.info || "No details provided."}</p>
            <div style="margin-top:20px; display:flex; gap:10px;">
                <button onclick="editItem('${cat}', '${item}')">Edit</button>
                <button onclick="deleteItem('${cat}', '${item}')" style="background:#ff4444; color:white;">Delete</button>
            </div>
        </div>
    `;

    if (cat === "Routes" && data.coords) {
        html += `<div id="map" style="height:350px; border-radius:12px; margin-top:20px;"></div>`;
        document.getElementById('view-port').innerHTML = html;
        setTimeout(() => {
            var m = L.map('map').setView(data.coords[0], 3);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(m);
            L.polyline(data.coords, {color: '#0066cc', weight: 4}).addTo(m);
            m.fitBounds(L.polyline(data.coords).getBounds());
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

    if (!flightInnData[cat]) flightInnData[cat] = {};

    if (cat === "Routes") {
        const p = info.split('|');
        flightInnData[cat][name] = { 
            info: p[0], 
            image: img,
            coords: [p[1].split(',').map(Number), p[2].split(',').map(Number)] 
        };
    } else {
        flightInnData[cat][name] = { info: info, image: img };
    }

    database.ref('flightData').set(flightInnData).then(() => {
        closeEditor();
        loadDirectory(cat);
    });
}

function deleteItem(cat, item) {
    if(confirm("Delete?")) {
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

window.onload = sync;
