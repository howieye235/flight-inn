
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

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const database = firebase.database();
let flightInnData = {};

// --- CLOUD SYNC ---
function sync() {
    database.ref('flightData').on('value', (s) => {
        flightInnData = s.val() || {};
        // This ensures the dashboard updates whenever the data changes
        renderHome(); 
    });
}

// --- NAVIGATION & DASHBOARD ---
function renderHome() {
    const f = flightInnData.Fleets ? Object.keys(flightInnData.Fleets).length : 0;
    const a = flightInnData.Airlines ? Object.keys(flightInnData.Airlines).length : 0;
    const r = flightInnData.Routes ? Object.keys(flightInnData.Routes).length : 0;
    const ap = flightInnData.Airports ? Object.keys(flightInnData.Airports).length : 0;

    document.getElementById('view-port').innerHTML = `
        <h1 style="color:var(--primary);">System Overview</h1>
        <div class="card-grid">
            <div class="stat-card"><h3>${f}</h3><p>Fleets</p></div>
            <div class="stat-card"><h3>${a}</h3><p>Airlines</p></div>
            <div class="stat-card"><h3>${ap}</h3><p>Airports</p></div>
            <div class="stat-card"><h3>${r}</h3><p>Routes</p></div>
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
    const img = data.image || "https://placehold.co/800x400?text=No+Photo";
    
    let factsHtml = ""; 
    const status = data.status || "Active";
    const statusColor = status === "Active" ? "#00ff88" : (status === "Retired" ? "#ff4444" : "#ffbb00");

    // 1. Sidebar Rows for non-Route categories
   if (cat === "Airlines") {
        factsHtml = `
            <div class="sidebar-row"><span class="s-label">Country</span><span class="s-value">${data.maker || "—"}</span></div>
            <div class="sidebar-row"><span class="s-label">Fleet Size</span><span class="s-value">${data.engines || "—"}</span></div>
            <div class="sidebar-row"><span class="s-label">Hubs</span><span class="s-value">${data.hubs || "—"}</span></div>
            <div class="sidebar-row"><span class="s-label">Frequent Flyer</span><span class="s-value">${data.freqFlyer || "—"}</span></div>
            <div class="sidebar-row"><span class="s-label">Subsidiaries</span><span class="s-value">${data.subsidiaries || "—"}</span></div>
            <div class="sidebar-row"><span class="s-label">Destinations</span><span class="s-value">${data.destinations || "—"}</span></div>
            <div class="sidebar-row"><span class="s-label">Alliance</span><span class="s-value">${data.extra || "—"}</span></div>
            <div class="sidebar-row"><span class="s-label">Established</span><span class="s-value">${data.era || "—"}</span></div>`;
    } else if (cat === "Airports") {
        factsHtml = `
            <div class="sidebar-row"><span class="s-label">City/Country</span><span class="s-value">${data.maker || "—"}</span></div>
            <div class="sidebar-row"><span class="s-label">IATA</span><span class="s-value">${data.engines || "—"}</span></div>
            <div class="sidebar-row"><span class="s-label">ICAO</span><span class="s-value">${data.extra || "—"}</span></div>
            <div class="sidebar-row"><span class="s-label">Hub For</span><span class="s-value">${data.hubFor || "—"}</span></div>
            <div class="sidebar-row"><span class="s-label">Opening Date</span><span class="s-value">${data.openingDate || "—"}</span></div>
            <div class="sidebar-row"><span class="s-label">Runways</span><span class="s-value">${data.runways || "—"}</span></div>
            <div class="sidebar-row"><span class="s-label">Era</span><span class="s-value">${data.era || "—"}</span></div>`;
    } else if (cat === "Fleets") {
        factsHtml = `
            <div class="sidebar-row"><span class="s-label">Manufacturer</span><span class="s-value">${data.maker || "—"}</span></div>
            <div class="sidebar-row"><span class="s-label">Engines</span><span class="s-value">${data.engines || "—"}</span></div>
            <div class="sidebar-row"><span class="s-label">Era</span><span class="s-value">${data.era || "—"}</span></div>
            <div class="sidebar-row"><span class="s-label">Purpose</span><span class="s-value">${data.extra || "—"}</span></div>`;
    }

    // 2. The Wiki Sidebar Layout
    let html = `
        <button class="back-btn" onclick="loadDirectory('${cat}')">← Back</button>
        <div class="hero" style="background-image: url('${img}')">
            <div class="hero-text"><h1>${item}</h1></div>
        </div>

        <div class="wiki-layout">
            <div class="article-body">
                <h2 class="section-header">Reference Article</h2>

<div class="article-body">
    <h2 class="section-header">Reference Article</h2>
    <div class="wiki-content">
        ${typeof marked !== 'undefined' ? marked.parse(wikiLinker(data.info || "No detailed information provided.")) : wikiLinker(data.info || "")}
    </div>
    <div class="article-actions">
        <button onclick="editItem('${cat}', '${item}')" class="edit-btn">Edit Article</button>
        <button onclick="deleteItem('${cat}', '${item}')" class="delete-btn">Delete Entry</button>
    </div>
</div>
            
            <aside class="wiki-sidebar">
                <div class="sidebar-header">Quick Facts</div>
                <div class="sidebar-content">
                    ${factsHtml}
                    <div class="sidebar-row">
                        <span class="s-label">Status</span>
                        <span class="s-value" style="color:${statusColor}; font-weight:bold;">${status}</span>
                    </div>
                </div>
            </aside>
        </div>`;

    // 3. YOUR ORIGINAL ROUTE LOGIC (DO NOT CHANGE)
    if (cat === "Routes" && data.coords) {
        document.getElementById('view-port').innerHTML = html + `<div id="map" style="height:450px; width:100%; border-radius:12px; margin-top:20px;"></div>`;
        
        setTimeout(() => {
            var container = L.DomUtil.get('map');
            if (container != null) { container._leaflet_id = null; }

            var m = L.map('map').setView(data.coords[0], 3);
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(m);

            var flightPath = L.Polyline.Arc(data.coords[0], data.coords[1], {
                color: '#00f2ff', weight: 4, vertices: 100
            }).addTo(m);

            const codes = item.split('-'); 
            if(codes.length === 2) {
                [data.coords[0], data.coords[1]].forEach((pos, i) => {
                    L.marker(pos, {
                        icon: L.divIcon({
                            className: 'no-box',
                            html: `<span class="badge-style">${codes[i].trim()}</span>`, 
                            iconSize: [0, 0], 
                            iconAnchor: [20, 10]
                        })
                    }).addTo(m);
                });
            }
            m.invalidateSize();
            m.fitBounds(flightPath.getBounds(), {padding: [50, 50]});
        }, 400);
    } else {
        document.getElementById('view-port').innerHTML = html;
    }
}

// --- ACTIONS & SEARCH ---
function openEditor() {
    const modal = document.getElementById('editor-modal');
    const overlay = document.getElementById('modal-overlay');

    modal.classList.add('active');
    overlay.style.display = 'block';

    // NEW: This stops the click from "bubbling" up to the overlay
    modal.onclick = (e) => {
        e.stopPropagation();
    };
}
function closeEditor() {
    // Remove the class to slide it back out
    document.getElementById('editor-modal').classList.remove('active');
    // Hide the overlay
    document.getElementById('modal-overlay').style.display = 'none';
}

function saveEntry() {
    // 1. Grab Basic Info
    const cat = document.getElementById('entry-category').value;
    const name = document.getElementById('entry-name').value;
    const img = document.getElementById('entry-image').value;
    const info = document.getElementById('entry-info').value;
    
    // 2. Grab the "Quick Fact" Specs
    const maker = document.getElementById('entry-maker').value;   // Spec A
    const engines = document.getElementById('entry-engines').value; // Spec B
    const era = document.getElementById('entry-era').value;       // Spec C
    const extra = document.getElementById('entry-extra').value;   // Spec D
    const status = document.getElementById('entry-status').value;

    // Validation
    if (!name) return alert("Please enter a name for this entry.");
    
    // Initialize category if it doesn't exist locally
    if (!flightInnData[cat]) flightInnData[cat] = {};

    // 3. Build the Data Object
    let entryData = {
        info: info,
        image: img,
        maker: maker,
        engines: engines,
        era: era,
        extra: extra,
        status: status,
        // CORRECTED FORMAT: Key: Value,
        hubs: document.getElementById('entry-hubs').value,
        freqFlyer: document.getElementById('entry-freq').value,
        subsidiaries: document.getElementById('entry-subs').value,
        destinations: document.getElementById('entry-destinations').value,
        hubFor: document.getElementById('entry-hubfor').value,
        openingDate: document.getElementById('entry-opening').value,
        runways: document.getElementById('entry-runways').value
    };
    // 4. Special Logic for Routes (Coordinates)
    if (cat === "Routes") {
        const parts = info.split('|');
        if (parts.length >= 3) {
            try {
                const start = parts[1].split(',').map(num => parseFloat(num.trim()));
                const end = parts[2].split(',').map(num => parseFloat(num.trim()));
                
                // Update entryData with parsed info and coords
                entryData.info = parts[0].trim();
                entryData.coords = [start, end];
            } catch (e) {
                return alert("Coordinate Error! Use: Info | Lat,Lng | Lat,Lng");
            }
        } else {
            return alert("Route format must be: Info | Lat,Lng | Lat,Lng");
        }
    }

    // 5. Save to Local Variable and Firebase
    flightInnData[cat][name] = entryData;

    database.ref('flightData').set(flightInnData)
        .then(() => {
            console.log(`✅ Successfully saved ${name} to ${cat}`);
            closeEditor();
            loadDirectory(cat); // Refresh the list view
        })
        .catch((error) => {
            console.error("❌ Firebase Save Error:", error);
            alert("Failed to save to cloud. Check console.");
        });
}

function deleteItem(cat, item) {
    if(confirm("Delete " + item + "?")) {
        delete flightInnData[cat][item];
        database.ref('flightData').set(flightInnData).then(() => {
            loadDirectory(cat);
        });
    }
}

function editItem(cat, item) {
    const d = flightInnData[cat][item];

    // 1. Fill Basic Info
    const catEl = document.getElementById('entry-category');
    const nameEl = document.getElementById('entry-name');
    const imgEl = document.getElementById('entry-image');
    const infoEl = document.getElementById('entry-info');
    const statusEl = document.getElementById('entry-status');

    if (catEl) catEl.value = cat;
    if (nameEl) nameEl.value = item;
    if (imgEl) imgEl.value = d.image || "";
    
    // 2. Fill the "Details" (Article or Route string)
    if (infoEl) {
        if (cat === "Routes" && d.coords) {
            infoEl.value = `${d.info} | ${d.coords[0]} | ${d.coords[1]}`;
        } else {
            infoEl.value = d.info || "";
        }
    }

    // 3. Fill the Quick Fact Spec Boxes (A, B, C, D)
    const makerEl = document.getElementById('entry-maker');
    const engEl = document.getElementById('entry-engines');
    const eraEl = document.getElementById('entry-era');
    const extraEl = document.getElementById('entry-extra');

    if (makerEl) makerEl.value = d.maker || "";    
    if (engEl) engEl.value = d.engines || ""; 
    if (eraEl) eraEl.value = d.era || "";          
    if (extraEl) extraEl.value = d.extra || "";      
    
    // 4. Fill Category-Specific Fields with NULL checks
    const fields = {
        'entry-hubs': d.hubs,
        'entry-freq': d.freqFlyer,
        'entry-subs': d.subsidiaries,
        'entry-destinations': d.destinations,
        'entry-hubfor': d.hubFor,
        'entry-opening': d.openingDate,
        'entry-runways': d.runways
    };

    for (let id in fields) {
        const el = document.getElementById(id);
        if (el) el.value = fields[id] || "";
    }

    // 5. Finalize UI
    if (statusEl) statusEl.value = d.status || "Active";
    
    toggleExtraFields(cat); 
    openEditor();
}

function searchDatabase() {
    let query = document.getElementById('queryInput').value.toLowerCase();
    let viewport = document.getElementById('view-port');
    if (query === "") { renderHome(); return; }

    let html = `<h2>Search Results</h2><div class="list-container">`;
    let found = false;
    ['Airlines', 'Fleets', 'Airports', 'Routes'].forEach(c => {
        if (flightInnData[c]) {
            Object.keys(flightInnData[c]).forEach(item => {
                if (item.toLowerCase().includes(query)) {
                    found = true;
                    html += `<div class="list-item" onclick="openEntry('${c}', '${item}')">${item} <small>(${c})</small></div>`;
                }
            });
        }
    });
    viewport.innerHTML = found ? html + `</div>` : `<p>No results found.</p>`;
}
function wikiLinker(text) {
    if (!text || !flightInnData) return text || "";

    // 1. Handle [[Target|Display Name]] style links
    // This finds [[Real Name|What I typed]]
    text = text.replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, (match, target, display) => {
        // Find if the target exists in any category
        let foundCat = null;
        for (let cat in flightInnData) {
            if (flightInnData[cat][target.trim()]) {
                foundCat = cat;
                break;
            }
        }
        
        if (foundCat) {
            return `<span class="wiki-link" onclick="openEntry('${foundCat}', '${target.trim()}')">${display.trim()}</span>`;
        }
        return display; // If not found, just show the text
    });

    // 2. Handle standard [[Target]] links (No pipe)
    text = text.replace(/\[\[([^\]]+)\]\]/g, (match, target) => {
        let foundCat = null;
        for (let cat in flightInnData) {
            if (flightInnData[cat][target.trim()]) {
                foundCat = cat;
                break;
            }
        }

        if (foundCat) {
            return `<span class="wiki-link" onclick="openEntry('${foundCat}', '${target.trim()}')">${target.trim()}</span>`;
        }
        return target;
    });

    // 3. Keep your existing auto-linker for plain text names 
    // (Optional: You can keep this or rely entirely on [[]] for more control)
    return text;
}

function toggleExtraFields(category) {
    const airlineFields = document.getElementById('airline-extra-fields');
    const airportFields = document.getElementById('airport-extra-fields');
    
    if (airlineFields) airlineFields.style.display = (category === "Airlines") ? "grid" : "none";
    if (airportFields) airportFields.style.display = (category === "Airports") ? "grid" : "none";
}

// Attach it to the category dropdown in the modal
// Remove the standalone event listener from the bottom and 
// incorporate it into your sync or a dedicated init function.

// --- DYNAMIC UI LOGIC ---

function toggleExtraFields(category) {
    const airlineFields = document.getElementById('airline-extra-fields');
    const airportFields = document.getElementById('airport-extra-fields');
    
    // Reset both to hidden first
    if (airlineFields) airlineFields.style.display = "none";
    if (airportFields) airportFields.style.display = "none";
    
    // Only show the relevant one using Grid for a cleaner look
    if (category === "Airlines" && airlineFields) airlineFields.style.display = "grid";
    if (category === "Airports" && airportFields) airportFields.style.display = "grid";
}

// This function ensures the elements exist before adding listeners
function initEditor() {
    const categoryDropdown = document.getElementById('entry-category');
    if (categoryDropdown) {
        categoryDropdown.addEventListener('change', (e) => {
            toggleExtraFields(e.target.value);
        });
        document.getElementById('entry-info').addEventListener('input', updatePreview);
        
        console.log("✅ Editor Listeners Initialized");
    }
}

// Update your window onload to trigger both sync and init
window.onload = () => {
    sync();
    initEditor(); 
};

// --- PREVIEW SYSTEM ---

// This function shows/hides the preview box
function togglePreview() {
    const container = document.getElementById('preview-container');
    // Check if it's hidden or doesn't have a display style set yet
    const isHidden = !container.style.display || container.style.display === 'none';
    
    container.style.display = isHidden ? 'block' : 'none';
    
    // If we just opened it, update the content immediately
    if (isHidden) {
        updatePreview();
    }
}

// This function converts your [[WikiLinks]] into clickable spans in the preview
function updatePreview() {
    const infoInput = document.getElementById('entry-info');
    const previewArea = document.getElementById('wiki-preview-content');
    
    if (infoInput && previewArea) {
        let rawText = infoInput.value;

        // 1. First, process your custom [[WikiLinks]]
        let linkedText = wikiLinker(rawText);

        // 2. Then, let 'Marked' turn Markdown into HTML (Bold, Tables, etc.)
        // We use 'marked.parse' here
        if (typeof marked !== 'undefined') {
            previewArea.innerHTML = marked.parse(linkedText);
        } else {
            previewArea.innerHTML = linkedText; // Fallback if library fails
        }
    }
}
