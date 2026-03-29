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

// 4. Navigation & Display
function loadDirectory(cat) {
    currentCategory = cat;
    const list = flightInnData[cat];
    let html = `<h2>${cat} Directory</h2><hr>`;
    if (list) {
        for (let item in list) {
            html += `<span class="result-link" onclick="openEntry('${cat}', '${item}')">${item}</span>`;
        }
    } else {
        html += `<p>No data found in this category.</p>`;
    }
    document.getElementById('view-port').innerHTML = html;
}

function openEntry(cat, item) {
    const data = flightInnData[cat][item];
    let displayDescription = (typeof data === 'object') ? (data.info || "No details") : data;
    
    document.getElementById('view-port').innerHTML = `
        <button class="back-btn" onclick="loadDirectory('${cat}')">← Back</button>
        <h2>${item}</h2>
        <div class="info-card"><p>${displayDescription}</p></div>
    `;
}

function renderHome() {
    document.getElementById('view-port').innerHTML = `<h2>Welcome to the Hub</h2><p>Select a directory from the sidebar to begin.</p>`;
}

// 5. Cloud Sync
function syncWithCloud() {
    database.ref('flightData').on('value', (snapshot) => {
        const cloudData = snapshot.val();
        if (cloudData) {
            flightInnData = cloudData;
        }
    });
}

// 6. Modal Controls
function openEditor() {
    document.getElementById('editor-modal').style.display = 'block';
}

function closeEditor() {
    document.getElementById('editor-modal').style.display = 'none';
}

function saveNewPlane() {
    const name = document.getElementById('plane-name').value;
    const info = document.getElementById('plane-info').value;

    if (name && info) {
        if (!flightInnData.Fleets) flightInnData.Fleets = {}; 
        flightInnData.Fleets[name] = info;

        database.ref('flightData').set(flightInnData).then(() => {
            alert(name + " added! 🚀");
            closeEditor();
            document.getElementById('plane-name').value = "";
            document.getElementById('plane-info').value = "";
            loadDirectory('Fleets'); // Refresh view
        });
    } else {
        alert("Fill in both boxes!");
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
            let text = (typeof entry === 'object') ? entry.info : entry;
            if (item.toLowerCase().includes(query) || (text && text.toLowerCase().includes(query))) {
                html += `<span class="result-link" onclick="openEntry('${cat}', '${item}')">${item} (${cat})</span>`;
            }
        }
    }
    document.getElementById('view-port').innerHTML = html;
}

// 8. Launch
window.onload = function() {
    renderHome();
    syncWithCloud();
};
