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

function sync() {
    database.ref('flightData').on('value', (s) => {
        flightInnData = s.val() || {};
        if (document.getElementById('view-port').innerHTML.includes('SYSTEM')) renderHome();
    });
}

function renderHome() {
    const f = flightInnData.Fleets ? Object.keys(flightInnData.Fleets).length : 0;
    const a = flightInnData.Airlines ? Object.keys(flightInnData.Airlines).length : 0;
    const r = flightInnData.Routes ? Object.keys(flightInnData.Routes).length : 0;

    document.getElementById('view-port').innerHTML = `
        <h1 style="color:white; letter-spacing:1px;">SYSTEM OVERVIEW</h1>
        <div style="display:flex; gap:15px; margin-top:20px;">
            <div class="stat-box"><h6>FLEET</h6><p>${f}</p></div>
            <div class="stat-box"><h6>AIRLINES</h6><p>${a}</p></div>
            <div class="stat-box"><h6>ROUTES</h6><p>${r}</p></div>
        </div>
    `;
}

function loadDirectory(cat) {
    let html = `<h2 style="color:white;">${cat}</h2><div style="border-bottom:1px solid #222; margin-bottom:15px;"></div>`;
    if (flightInnData[cat]) {
        for (let item in flightInnData[cat]) {
            html += `<div class="list-item" onclick="openEntry('${cat}', '${item}')">${item}</div>`;
        }
    }
    document.getElementById('view-port').innerHTML = html;
}

function openEntry(cat, item) {
    const d = flightInnData[cat][item];
    const img = d.image || "https://via.placeholder.com/800x300?text=No+Photo";
    
    let html = `
        <button class="back-btn" onclick="loadDirectory('${cat}')">← Back</button>
        <div style="display:flex; justify-content:space-between; align-items:center; margin:20px 0;">
            <h2 style="color:white; margin:0;">${item}</h2>
            <div>
                <button onclick="editItem('${cat}', '${item}')" class="action-btn">Edit</button>
                <button onclick="deleteItem('${cat}', '${item}')" class="action-btn" style="background:#700;">Delete</button>
            </div>
        </div>
        <div style="width:100%; height:350px; background:url('${img}') center/cover; border-radius:10px; border:1px solid #333; margin-bottom:20px;"></div>
        <div class="info-card">${d.info || "No details."}</div>
    `;

    if (cat === "Routes" && d.coords) {
        html += `<div id="map" style="height:350px; border-radius:10px; margin-top:20px; border:1px solid #333;"></div>`;
        document.getElementById('view-port').innerHTML = html;
        setTimeout(() => {
            var m = L.map('map').setView(d.coords[0], 3);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(m);
            L.polyline(d.coords, {color: '#0066cc', weight: 4, dashArray: '10,10'}).addTo(m);
            m.fitBounds(L.polyline(d.coords).getBounds(), {padding:[50,50]});
        }, 200);
    } else {
        document.getElementById('view-port').innerHTML = html;
    }
}

function saveEntry() {
    const cat = document.getElementById('entry-category').value;
    const name = document.getElementById('entry-name').value;
    const img = document.getElementById('entry-image').value;
    const info = document.getElementById('entry-info').value;

    if (!flightInnData[cat]) flightInnData[cat] = {};

    if (cat === "Routes") {
        const p = info.split('|');
        flightInnData[cat][name] = { info: p[0], image: img, coords: [p[1].split(',').map(Number), p[2].split(',').map(Number)] };
    } else {
        flightInnData[cat][name] = { info: info, image: img };
    }

    database.ref('flightData').set(flightInnData).then(() => {
        document.getElementById('editor-modal').style.display='none';
        loadDirectory(cat);
    });
}

function editItem(cat, item) {
    const d = flightInnData[cat][item];
    document.getElementById('entry-category').value = cat;
    document.getElementById('entry-name').value = item;
    document.getElementById('entry-image').value = d.image || "";
    document.getElementById('entry-info').value = (cat === "Routes") ? `${d.info}|${d.coords[0]}|${d.coords[1]}` : d.info;
    document.getElementById('editor-modal').style.display='block';
}

function deleteItem(cat, item) {
    if(confirm("Delete?")) {
        delete flightInnData[cat][item];
        database.ref('flightData').set(flightInnData).then(() => loadDirectory(cat));
    }
}

function openEditor() { document.getElementById('editor-modal').style.display='block'; }
function closeEditor() { document.getElementById('editor-modal').style.display='none'; }

window.onload = function() { sync(); renderHome(); };
