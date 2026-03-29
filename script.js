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
let flightInnData = {
    "Airlines": {},
    "Fleets": {},
    "Airports": {},
    "Routes": {}
};

// 4. Cloud Sync
function syncWithCloud() {
    database.ref('flightData').on('value', (snapshot) => {
        const cloudData = snapshot.val();
        if (cloudData) {
            flightInnData = cloudData;
        }
    });
}

// 5. Navigation & Directory Display
function loadDirectory(cat) {
    const list = flightInnData[cat];
    let html = `<h2>${cat} Directory</h2><hr>`;
    
    if (list && Object.keys(list).length > 0) {
        for (let item in list) {
            html += `<span class="result-link" onclick="openEntry('${cat}', '${item}')">${item}</span>`;
        }
    } else {
        html += `<p>No data found. Click "+ Edit" to add a ${cat}!</p>`;
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
        contentHTML += `<div class="info-card"><p>${desc || "No details available."}</p></div>`;
        document.getElementById('view-port').innerHTML = contentHTML;
    }
}

// 6. Modal / Editor Logic
function openEditor() {
    document.getElementById('editor-modal').style.display = 'block';
}

function closeEditor() {
    document.getElementById('editor-modal').style.display = 'none';
}

function saveEntry() {
    const category = document.getElementById('entry-category').value;
    const name = document.getElementById('entry-name').value;
    const info = document.getElementById('entry-info').value;

    if (!name || !info) {
        alert("Fill in both boxes!");
        return;
    }

    if (category === "Routes") {
        const parts = info.split('|');
        if (parts.length < 3) {
            alert("Routes need: Info | Lat, Lng | Lat, Lng");
            return;
        }
        flightInnData[category][name] = {
            info: parts[0].trim(),
            coords: [
                parts[1].split(',').map(Number),
                parts[2].split(',').map(Number)
            ]
        };
    } else {
        flightInnData[category][name] = info;
    }

    database.ref('flightData').set(flightInnData).then(() => {
        alert(name + " saved! 🚀");
        closeEditor();
        loadDirectory(category);
    });
}

function renderHome() {
    document.getElementById('view-port').innerHTML = `<h2>Welcome to FlightInn</h2><p>Select a category to begin.</p>`;
}

// 7. Startup
window.onload = function() {
    renderHome();
    syncWithCloud();
};
