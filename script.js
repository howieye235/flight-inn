// --- 1. FIREBASE SETUP ---
const firebaseConfig = {
    apiKey: "AIzaSyCkid-KKHmHUUuR0oikBjPGMkha0FJB5Dc",
    authDomain: "flightinn-cb4ba.firebaseapp.com",
    projectId: "flightinn-cb4ba",
    storageBucket: "flightinn-cb4ba.firebasestorage.app",
    messagingSenderId: "272507283961",
    appId: "1:272507283961:web:e935c63963d1c8dde63528",
    databaseURL: "https://flightinn-cb4ba-default-rtdb.firebaseio.com"
};

// Initialize
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();
let flightInnData = {};

// --- 2. THE FUNCTIONS (The parts the HTML is missing) ---

function loadDirectory(cat) {
    const list = flightInnData[cat];
    let html = `<h2>${cat} Directory</h2><hr>`;
    if (list) {
        for (let item in list) {
            html += `<span class="result-link" onclick="openEntry('${cat}', '${item}')">${item}</span>`;
        }
    } else {
        html += `<p>No data found yet. Add some!</p>`;
    }
    document.getElementById('view-port').innerHTML = html;
}

function openEditor() {
    document.getElementById('editor-modal').style.display = 'block';
}

function closeEditor() {
    document.getElementById('editor-modal').style.display = 'none';
}

function renderHome() {
    document.getElementById('view-port').innerHTML = `<h2>Welcome to the Hub</h2><p>Select a directory from the sidebar to begin.</p>`;
}

// --- 3. CLOUD SYNC ---
function syncWithCloud() {
    database.ref('flightData').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            flightInnData = data;
        }
    });
}

// Start everything
window.onload = function() {
    renderHome();
    syncWithCloud();
};
