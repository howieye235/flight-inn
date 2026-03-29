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
        if (data) { flightInnData = data; }
    });
}

// 3. Modal Controls
function openEditor() {
    document.getElementById('editor-modal').style.display = 'block';
}

function closeEditor() {
    document.getElementById('editor-modal').style.display = 'none';
}

// 4. THE UNIVERSAL SAVE (Now with Routes!)
function saveEntry() {
    const category = document.getElementById('entry-category').value;
    const name = document.getElementById('entry-name').value;
    const info = document.getElementById('entry-info').value;

    if (!name || !info) return alert("Fill in all boxes!");

    if (!flightInnData[category]) flightInnData[category] = {};

    if (category === "Routes") {
        // Special logic for Routes: "Info | 52.1, -106.7 | 43.6, -79.6"
        const parts = info.split('|');
        if (parts.length < 3) return alert("Routes need: Info | Lat1, Lng1 | Lat2, Lng2");
        
        flightInnData[category][name] = {
            info: parts[0].trim(),
            coords: [
                parts[1].split(',').map(Number),
                parts[2].split(',').map(Number)
            ]
        };
    } else {
        // Normal text for everything else
        flightInnData[category][name] = info;
    }

    database.ref('flightData').set(flightInnData).then(() => {
        alert(name + " saved! 🚀");
        closeEditor();
        loadDirectory(category);
    });
}

// 5. Navigation & Map Logic
function loadDirectory(cat) {
    const list = flightInnData[cat];
    let html = `<h2>${cat} Directory</h2><hr>`;
    for (let item in list) {
        html += `<span class="result-link" onclick="openEntry('${cat}', '${item}')">${item}</span>`;
    }
    document.getElementById('view-port').innerHTML = html;
}

function openEntry(cat, item) {
    const data = flightInnData[cat][item];
    let contentHTML = `<button class="back-btn" onclick="loadDirectory('${cat}')">← Back</button><h2>${item}</h2>`;

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
        contentHTML += `<div class="info-card"><p>${desc}</p></div>`;
        document.getElementById('view-port').innerHTML = contentHTML;
    }
}

function renderHome() {
    document.getElementById('view-port').innerHTML = `<h2>Welcome to FlightInn</h2><p>Select a category to begin.</p>`;
}

window.onload = function() { renderHome(); syncWithCloud(); };
