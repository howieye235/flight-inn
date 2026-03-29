const firebaseConfig = {
  apiKey: "AIzaSyCkid-KKHmHUUuR0oikBjPGMkha0FJB5Dc",
  authDomain: "flightinn-cb4ba.firebaseapp.com",
  projectId: "flightinn-cb4ba",
  storageBucket: "flightinn-cb4ba.firebasestorage.app",
  messagingSenderId: "272507283961",
  appId: "1:272507283961:web:e935c63963d1c8dde63528"
};
let flightInnData = {
    "Airlines": {
        "Air Canada": "Historical data on DC-8 and L-1011 operations.",
        "WestJet": "Features 737-600 fleet info for YXE-YYZ routes.",
        "British Midland": "Includes details on European 737 short-haul fleet."
    },
    "Fleets": {
        "MD-11": "Three-engine jet used for long-haul cargo and passenger ops.",
        "L-1011 TriStar": "Advanced wide-body tri-jet with historical significance.",
        "737-600": "The 'Baby Boeing' specialized regional aircraft."
    },
    "Airports": {
        "YXE Saskatoon": "Primary gateway for central Saskatchewan.",
        "YYZ Toronto": "Main Canadian international hub.",
        "OPO Porto": "Site of 9H-SUN tri-jet photography."
    },
    "Routes": {
        "YXE-YYZ": {
            "info": "WestJet 737-600 Flight Path.",
            "coords": [[52.17, -106.70], [43.67, -79.62]]
        },
        "YYZ-LHR": {
            "info": "Classic Atlantic crossing to London.",
            "coords": [[43.67, -79.62], [51.47, -0.45]]
        }
    }
};

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
    let contentHTML = `
        <button class="back-btn" onclick="loadDirectory('${cat}')">← Back to ${cat}</button>
        <h2 style="color: #001a33; margin-top:0;">${item}</h2>
    `;

    if (cat === "Routes" && data.coords) {
        contentHTML += `
            <div class="info-card"><p>${data.info}</p></div>
            <div id="map" style="height: 450px; border-radius: 12px; margin-top: 20px;"></div>
        `;
        document.getElementById('view-port').innerHTML = contentHTML;
        
        setTimeout(() => {
            // 1. Initialize Map
            var map = L.map('map').setView(data.coords[0], 3);
            
            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; CARTO'
            }).addTo(map);

            const start = data.coords[0];
            const end = data.coords[1];

            // 2. Smooth Curve Math (Bezier)
            const controlPoint = [
                (start[0] + end[0]) / 2 + (end[1] - start[1]) * 0.15, 
                (start[1] + end[1]) / 2
            ];

            const latlngs = [];
            for (let t = 0; t <= 1; t += 0.01) {
                const lat = (1 - t) * (1 - t) * start[0] + 2 * (1 - t) * t * controlPoint[0] + t * t * end[0];
                const lng = (1 - t) * (1 - t) * start[1] + 2 * (1 - t) * t * controlPoint[1] + t * t * end[1];
                latlngs.push([lat, lng]);
            }

            // 3. Draw the Line
            const smoothCurve = L.polyline(latlngs, {
                color: '#0066cc',
                weight: 3,
                opacity: 0.7,
                dashArray: '8, 8'
            }).addTo(map);

// 4. Add IATA Labels (Bare Navy Text)
const codes = item.split('-');
codes.forEach((code, i) => {
    L.marker(data.coords[i], {
        icon: L.divIcon({
            className: 'iata-label-navy', // New clean class name
            html: `<span>${code}</span>`, // Just bare text inside a span
            iconSize: [40, 20],
            // This anchors the bottom-center of the text to the dot
            iconAnchor: [20, 25] 
        })
    }).addTo(map);
});

            map.fitBounds(smoothCurve.getBounds(), {padding: [50, 50]});
        }, 200);

    } else {
        let displayDescription = (typeof data === 'object') ? data.info : data;
        contentHTML += `<div class="info-card"><p>${displayDescription}</p></div>`;
        document.getElementById('view-port').innerHTML = contentHTML;
    }
}

function runQuery() {
    const query = document.getElementById('queryInput').value.toLowerCase();
    if (query.length < 1) return;
    let html = `<h2>Search Results</h2><hr>`;
    for (let cat in flightInnData) {
        for (let item in flightInnData[cat]) {
            let entry = flightInnData[cat][item];
            let text = (typeof entry === 'object') ? entry.info : entry;
            if (item.toLowerCase().includes(query) || text.toLowerCase().includes(query)) {
                html += `<span class="result-link" onclick="openEntry('${cat}', '${item}')">${item} (${cat})</span>`;
            }
        }
    }
    document.getElementById('view-port').innerHTML = html;
}

function toggleEditor() {
    const mod = document.getElementById('wiki-editor');
    mod.style.display = mod.style.display === 'none' ? 'block' : 'none';
    document.getElementById('jsonBox').value = JSON.stringify(flightInnData, null, 4);
}

function applyData() {
    const newData = document.getElementById('db-editor').value;
    try {
        const parsedData = JSON.parse(newData);
        
        // This sends the data to your Firebase locker
        database.ref('flightData').set(parsedData).then(() => {
            alert("Cloud Sync Successful! 🚀");
            closeEditor();
        });

    } catch (e) {
        alert("JSON Error: Double check your commas and brackets!");
    }
}

function renderHome() {
    document.getElementById('view-port').innerHTML = `<h2>Welcome to the Hub</h2><p>Select a directory from the sidebar to begin.</p>`;
}

window.onload = renderHome;

// Function to show the box
function openEditor() {
    document.getElementById('editor-modal').style.display = 'block';
}

// Function to hide the box
function closeEditor() {
    document.getElementById('editor-modal').style.display = 'none';
}

// The 'Brain' that saves to Firebase
function saveNewPlane() {
    const name = document.getElementById('plane-name').value;
    const info = document.getElementById('plane-info').value;

    if (name && info) {
        // Use "Fleets" to match your data structure
        if (!flightInnData.Fleets) flightInnData.Fleets = {}; 
        flightInnData.Fleets[name] = info; // Simplified for your current layout

        database.ref('flightData').set(flightInnData).then(() => {
            alert(name + " added! 🚀");
            closeEditor();
            document.getElementById('plane-name').value = "";
            document.getElementById('plane-info').value = "";
        });
    } else {
        alert("Fill in both boxes first!");
    }
}
    } else {
        alert("Fill in both boxes first!");
    }
}
