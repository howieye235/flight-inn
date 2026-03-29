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
    let contentHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <button class="back-btn" onclick="loadDirectory('${cat}')">← Back</button>
            <button onclick="editItem('${cat}', '${item}')" style="background:#34495e; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; font-size:12px;">Edit Details</button>
        </div>
        <h2>${item}</h2>
    `;

    // (Keep your existing Map/Text logic here)
    if (cat === "Routes" && data.coords) {
        // ... (your existing map code)
    } else {
        let desc = (typeof data === 'object') ? data.info : data;
        contentHTML += `<div class="info-card"><p>${desc}</p></div>`;
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
    // Count the items
    const airlineCount = flightInnData.Airlines ? Object.keys(flightInnData.Airlines).length : 0;
    const fleetCount = flightInnData.Fleets ? Object.keys(flightInnData.Fleets).length : 0;
    const airportCount = flightInnData.Airports ? Object.keys(flightInnData.Airports).length : 0;

    document.getElementById('view-port').innerHTML = `
        <div class="stats-container" style="display:flex; gap:20px; margin-bottom:20px;">
            <div class="stat-card" style="background:#1a1a1a; padding:15px; border-radius:8px; border-left:4px solid #0066cc; flex:1;">
                <h4 style="margin:0; color:#888; font-size:12px;">FLEET SIZE</h4>
                <p style="margin:5px 0 0; font-size:24px; font-weight:bold;">${fleetCount}</p>
            </div>
            <div class="stat-card" style="background:#1a1a1a; padding:15px; border-radius:8px; border-left:4px solid #2ecc71; flex:1;">
                <h4 style="margin:0; color:#888; font-size:12px;">AIRLINES</h4>
                <p style="margin:5px 0 0; font-size:24px; font-weight:bold;">${airlineCount}</p>
            </div>
            <div class="stat-card" style="background:#1a1a1a; padding:15px; border-radius:8px; border-left:4px solid #f1c40f; flex:1;">
                <h4 style="margin:0; color:#888; font-size:12px;">AIRPORTS</h4>
                <p style="margin:5px 0 0; font-size:24px; font-weight:bold;">${airportCount}</p>
            </div>
        </div>
        <h2>Welcome to FlightInn</h2>
        <p>Select a category from the sidebar to view your aviation database.</p>
    `;
}

function editItem(cat, item) {
    const data = flightInnData[cat][item];
    
    // Fill the modal with current data
    document.getElementById('entry-category').value = cat;
    document.getElementById('entry-name').value = item;
    
    // If it's a route, we need to format it back to "Info | Lat,Lng | Lat,Lng"
    if (cat === "Routes" && data.coords) {
        document.getElementById('entry-info').value = `${data.info} | ${data.coords[0].join(',')} | ${data.coords[1].join(',')}`;
    } else {
        document.getElementById('entry-info').value = (typeof data === 'object') ? data.info : data;
    }

    // Show the modal
    openEditor();
}

// 7. Startup
window.onload = function() {
    renderHome();
    syncWithCloud();
};
