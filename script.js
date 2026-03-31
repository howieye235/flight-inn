
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
    // 1. Calculate stats with safety fallbacks
    const f = (flightInnData.Fleets && Object.keys(flightInnData.Fleets).length) || 0;
    const a = (flightInnData.Airlines && Object.keys(flightInnData.Airlines).length) || 0;
    const r = (flightInnData.Routes && Object.keys(flightInnData.Routes).length) || 0;
    const ap = (flightInnData.Airports && Object.keys(flightInnData.Airports).length) || 0;
    const total = f + a + r + ap;

    // 2. Greeting Logic
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

    // 3. Activity Feed Logic
    const recent = getRecentActivity();
    let recentHtml = recent.map(item => `
        <div class="log-item" onclick="openEntry('${item.category}', '${item.name}')" style="display:flex; align-items:center; padding:10px; border-bottom:1px solid #eee; cursor:pointer; background:white; margin-bottom:5px; border-radius:8px;">
            <span style="font-size:10px; background:#002244; color:white; padding:3px 8px; border-radius:4px; margin-right:15px; font-weight:bold;">${item.category.toUpperCase()}</span>
            <span style="font-weight:bold; color:#002244;">${item.name}</span>
        </div>
    `).join('');

    // 4. Update the Viewport
    document.getElementById('view-port').innerHTML = `
        <div class="welcome-section" style="background:#f1f5f9; padding:30px; border-radius:15px; border-left: 5px solid #002244; margin-bottom:20px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h1 style="margin:0; color:#002244;">${greeting}, Archivist</h1>
                <div id="utc-clock" style="font-family:monospace; background:#002244; color:#00f2ff; padding:5px 12px; border-radius:6px; font-weight:bold;">00:00:00 UTC</div>
            </div>
            <p style="margin-top:15px; line-height:1.6; color:#334155; font-size:1.1rem;">
                Welcome to <b>FlightInn</b>! This is your central hub for archiving aviation history. 
                Explore our database of airlines, aircraft, and routes below!
            </p>
            <div style="margin-top:10px; font-size:0.9rem; color:#64748b;">
                Currently indexing <b style="color:#002244;">${total}</b> historical entries.
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 300px; gap: 20px;">
            <div>
                <button onclick="openRandomEntry()" style="width:100%; padding:15px; background:#ffbb00; color:#002244; border:none; border-radius:12px; font-weight:bold; cursor:pointer; margin-bottom:20px; font-size:1.1rem; box-shadow: 0 4px 0 #cc9900; transition:0.1s;" onmousedown="this.style.transform='translateY(2px)'; this.style.boxShadow='0 2px 0 #cc9900'" onmouseup="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 0 #cc9900'">
                    🎲 DISCOVER RANDOM ENTRY
                </button>
                
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 15px;">
    <h2 class="overview-title" style="margin:0;">System Overview</h2>
    <div style="font-size:0.8rem; background:#e2e8f0; padding:5px 12px; border-radius:20px; color:#475569;">
        <b>Compare:</b> 
        <span onclick="openCompare('Fleets')" style="color:#2563eb; cursor:pointer; margin-left:8px; font-weight:bold;">Fleets</span> | 
        <span onclick="openCompare('Airlines')" style="color:#2563eb; cursor:pointer; font-weight:bold;">Airlines</span> |
        <span onclick="openCompare('Airports')" style="color:#2563eb; cursor:pointer; font-weight:bold;">Airports</span>
    </div>
</div>

                <div class="card-grid">
                    <div class="stat-card" onclick="loadDirectory('Fleets')"><h3>${f}</h3><p>Fleets</p></div>
                    <div class="stat-card" onclick="loadDirectory('Airlines')"><h3>${a}</h3><p>Airlines</p></div>
                    <div class="stat-card" onclick="loadDirectory('Airports')"><h3>${ap}</h3><p>Airports</p></div>
                    <div class="stat-card" onclick="loadDirectory('Routes')"><h3>${r}</h3><p>Routes</p></div>
                </div>
            </div>
            
            <div class="activity-feed" style="background:#fff; padding:15px; border-radius:12px; border:1px solid #e2e8f0; height: fit-content;">
                <h3 style="margin-top:0; color:#002244; border-bottom:2px solid #f1f5f9; padding-bottom:10px;">Recent Logs</h3>
                <div class="log-container">
                    ${recentHtml || '<p style="color:#94a3b8; font-size:12px; text-align:center; padding:20px;">No logs found.<br>Add an entry to start tracking!</p>'}
                </div>
            </div>
        </div>
    `;

    updateHomeClock();
}


function updateHomeClock() {

    const clockEl = document.getElementById('utc-clock');

    if (!clockEl) return;

    const now = new Date();

    clockEl.innerText = now.toISOString().substr(11, 8) + " UTC";

    setTimeout(updateHomeClock, 1000);

}

function showTutorial() {
    const viewport = document.getElementById('view-port');
    viewport.innerHTML = `
        <div class="tutorial-page" style="max-width: 900px; margin: 0 auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid var(--primary); padding-bottom: 10px; margin-bottom: 30px;">
                <h1 style="color:var(--primary); margin:0;">📖 FlightInn Official Manual</h1>
                <button onclick="renderHome()" style="padding: 8px 16px; background: var(--primary); color: white; border: none; border-radius: 6px; cursor: pointer;">← Back to Dash</button>
            </div>

            <section style="margin-bottom: 40px;">
                <h2 style="color:var(--primary);"><span style="color:var(--accent);">01.</span> Managing the Database</h2>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div style="background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
                        <h3 style="margin-top:0;">🆕 Adding New Assets</h3>
                        <p>1. Click the <b>+ ADD NEW</b> button in the sidebar.<br>
                           2. Select the correct <b>Category</b> (Airlines, Fleets, etc).<br>
                           3. Fill in the <b>Specs</b> (Mfr, Engines, Era).<br>
                           4. Hit <b>Save to Cloud</b> to sync with Firebase.</p>
                    </div>
                    <div style="background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
                        <h3 style="margin-top:0;">📝 Editing & Deleting</h3>
                        <p>Open any existing entry. At the bottom of the article, you will find the <b>Edit</b> and <b>Delete</b> buttons. Editing opens the same menu used for new entries.</p>
                    </div>
                </div>
            </section>

            <section style="margin-bottom: 40px;">
                <h2 style="color:var(--primary);"><span style="color:var(--accent);">02.</span> Content Styling</h2>
                <div style="background: #f8fafc; padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0;">
                    <p>Use these codes in the <b>Article Body</b> to style your text:</p>
                    <table style="width: 100%; border-collapse: collapse; background: white;">
                        <tr style="border-bottom: 1px solid #eee;">
                            <th style="text-align: left; padding: 10px;">Feature</th>
                            <th style="text-align: left; padding: 10px;">What to type</th>
                            <th style="text-align: left; padding: 10px;">Result</th>
                        </tr>
                        <tr><td style="padding: 10px;"><b>Bold</b></td><td style="padding: 10px;"><code>**Text**</code></td><td style="padding: 10px;"><b>Text</b></td></tr>
                        <tr><td style="padding: 10px;"><i>Italic</i></td><td style="padding: 10px;"><code>*Text*</code></td><td style="padding: 10px;"><i>Text</i></td></tr>
                        <tr><td style="padding: 10px;"><strike>Strike</strike></td><td style="padding: 10px;"><code>~~Text~~</code></td><td style="padding: 10px;"><strike>Text</strike></td></tr>
                        <tr><td style="padding: 10px;">Heading</td><td style="padding: 10px;"><code># Main / ## Sub</code></td><td style="padding: 10px;">Large Headers</td></tr>
                        <tr><td style="padding: 10px;">Bullet List</td><td style="padding: 10px;"><code>* Item</code></td><td style="padding: 10px;">• Item</td></tr>
                        <tr><td style="padding: 10px;">Blockquote</td><td style="padding: 10px;"><code>> Text</code></td><td style="padding: 10px; border-left: 3px solid #ccc;">"Quote"</td></tr>
                    </table>
                </div>
            </section>

            <section style="margin-bottom: 40px;">
                <h2 style="color:var(--primary);"><span style="color:var(--accent);">03.</span> Aviation & Wiki Features</h2>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div style="background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
                        <h3 style="margin-top:0;">🔗 Internal Wiki-Links</h3>
                        <p>Link to another entry by name:</p>
                        <code>[[Boeing 777]]</code>
                        <p>Link with custom display text:</p>
                        <code>[[WestJet|The Teal Airline]]</code>
                    </div>
                    <div style="background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
                        <h3 style="margin-top:0;">🖼️ Multimedia</h3>
                        <p>Embed an image (e.g. from Discord or Imgur):</p>
                        <code>![9H-SUN at YYZ](URL_HERE)</code>
                    </div>
                </div>
            </section>

            <section style="margin-bottom: 40px;">
                <h2 style="color:var(--primary);"><span style="color:var(--accent);">04.</span> Route Coordination</h2>
                <div style="background: #002244; color: white; padding: 25px; border-radius: 12px;">
                    <h3>📍 How to Map a Flight</h3>
                    <p>When selecting the <b>Routes</b> category, you must use the Coordinate separator in the body:</p>
                    <code style="background: rgba(255,255,255,0.1); display: block; padding: 15px; border-radius: 6px; color: #00f2ff;">
                        Brief Description | Start_Lat, Start_Lng | End_Lat, End_Lng
                    </code>
                    <p style="margin-top: 15px; font-size: 0.9rem; opacity: 0.8;">Example: <i>Air Canada 862 | 52.17, -106.68 | 43.67, -79.62</i></p>
                </div>
            </section>

<section style="margin-bottom: 40px;">
    <h2 style="color:var(--primary); border-bottom: 2px solid #eee;">📝 Style Cheat Sheet</h2>
    <div style="background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
        <table style="width: 100%; text-align: left; border-collapse: collapse;">
            <tr style="background: #f8fafc;">
                <th style="padding: 10px; border: 1px solid #ddd;">Feature</th>
                <th style="padding: 10px; border: 1px solid #ddd;">Syntax</th>
            </tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><b>Bold</b></td><td style="padding: 8px; border: 1px solid #ddd;"><code>**text**</code></td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><i>Italic</i></td><td style="padding: 8px; border: 1px solid #ddd;"><code>*text*</code></td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><u>Underline</u></td><td style="padding: 8px; border: 1px solid #ddd;"><code>&lt;u&gt;text&lt;/u&gt;</code></td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;">List</td><td style="padding: 8px; border: 1px solid #ddd;"><code>* item</code></td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;">Table</td><td style="padding: 8px; border: 1px solid #ddd;"><code>| A | B |</code></td></tr>
        </table>
    </div>
</section>

            <div style="text-align: center; color: #94a3b8; font-size: 0.8rem; margin-bottom: 50px;">
                FlightInn System v3.0 | Running on Firebase RTDB
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

    // 2. The Wiki Sidebar Layout (Updated to match your CSS)

let html = `

    <button class="back-btn" onclick="loadDirectory('${cat}')">← Back</button>

    

    <div class="hero" style="background-image: url('${img}')">

        <div class="hero-text">

            <h1>${item}</h1>

            <div class="quick-facts">

                <div class="fact-badge">${status}</div>

                <div class="fact-badge">${cat.slice(0, -1)}</div>

            </div>

        </div>

    </div>



    <div class="wiki-layout">

        <div class="article-body">

            <h2 class="section-header">Reference Article</h2>

            <div class="wiki-content">

                ${typeof marked !== 'undefined' ? marked.parse(wikiLinker(data.info || "No detailed information provided.")) : wikiLinker(data.info || "")}

            </div>

            

            <div class="article-actions">

                <button onclick="editItem('${cat}', '${item}')" class="edit-btn">Edit Article</button>

                <button onclick="deleteItem('${cat}', '${item}')" class="delete-btn" style="background:#ef4444; color:white;">Delete Entry</button>

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



// 1. Define XP values for each Rarity level
    const xpTable = { "Common": 10, "Uncommon": 25, "Rare": 50, "Epic": 100, "Legendary": 250 };
    const selectedRarity = document.getElementById('entry-rarity').value; // We will add this ID to your HTML modal next

    let entryData = {
        info: info,
        image: img,
        maker: maker,
        engines: engines,
        era: era,
        extra: extra,
        status: status,
        rarity: selectedRarity, // NEW
        points: xpTable[selectedRarity] || 10, // NEW
        hubs: document.getElementById('entry-hubs').value,
        freqFlyer: document.getElementById('entry-freq').value,
        subsidiaries: document.getElementById('entry-subs').value,
        destinations: document.getElementById('entry-destinations').value,
        hubFor: document.getElementById('entry-hubfor').value,
        openingDate: document.getElementById('entry-opening').value,
        runways: document.getElementById('entry-runways').value,
        timestamp: Date.now()
    };

    database.ref('flightData').set(flightInnData).then(() => {
        closeEditor();
        renderHome();
    });
}

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
        const infoInput = document.getElementById('entry-info');
        if (infoInput) {
            infoInput.addEventListener('input', updatePreview);
        }
        console.log("✅ Editor Listeners Initialized");
    }
}

// Update your window onload to trigger both sync and init
window.onload = () => {
    sync();
    initEditor(); 
    updateHomeClock(); // Start the clock immediately
};

// --- PREVIEW SYSTEM ---

function togglePreview() {
    const container = document.getElementById('preview-container');
    if (!container) return;
    const isHidden = !container.style.display || container.style.display === 'none';
    container.style.display = isHidden ? 'block' : 'none';
    if (isHidden) { updatePreview(); }
}

function updatePreview() {
    const infoInput = document.getElementById('entry-info');
    const previewArea = document.getElementById('wiki-preview-content');
    
    if (infoInput && previewArea) {
        let rawText = infoInput.value;
        let linkedText = wikiLinker(rawText);
        if (typeof marked !== 'undefined') {
            previewArea.innerHTML = marked.parse(linkedText);
        } else {
            previewArea.innerHTML = linkedText;
        }
    }
}

// --- ACTIVITY FEED LOGIC ---
function getRecentActivity() {
    let allEntries = [];
    const categories = ['Airlines', 'Fleets', 'Airports', 'Routes'];
    
    categories.forEach(cat => {
        if (flightInnData && flightInnData[cat]) {
            Object.keys(flightInnData[cat]).forEach(name => {
                const entry = flightInnData[cat][name];
                allEntries.push({
                    name: name,
                    category: cat,
                    time: entry.timestamp || 0
                });
            });
        }
    });
    
    // Sort by time (newest first) and take the top 5
    return allEntries.sort((a, b) => b.time - a.time).slice(0, 5);
}

function openRandomEntry() {
    const categories = Object.keys(flightInnData);
    if (categories.length === 0) return alert("Archive is empty!");

    // 1. Pick a random category that actually has items
    const validCats = categories.filter(cat => Object.keys(flightInnData[cat]).length > 0);
    const randomCat = validCats[Math.floor(Math.random() * validCats.length)];

    // 2. Pick a random item from that category
    const items = Object.keys(flightInnData[randomCat]);
    const randomItem = items[Math.floor(Math.random() * items.length)];

    // 3. Open it!
    openEntry(randomCat, randomItem);
}

// --- FIXED COMPARE LOGIC ---
// --- FINAL COMPARISON TOOL LOGIC ---
function openCompare(cat) {
    const items = Object.keys(flightInnData[cat] || {});
    if (items.length < 2) return alert(`You need at least two ${cat} entries to compare!`);

    const item1 = prompt(`Enter the name of the first ${cat.slice(0,-1)}:`, items[0]);
    const item2 = prompt(`Enter the name of the second ${cat.slice(0,-1)}:`, items[1]);

    if (!flightInnData[cat][item1] || !flightInnData[cat][item2]) {
        return alert("One or both of those entries could not be found. Check your spelling!");
    }

    const d1 = flightInnData[cat][item1];
    const d2 = flightInnData[cat][item2];

    let compareHtml = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; background:#f1f5f9; padding:15px; border-radius:10px;">
            <h2 style="margin:0; color:#002244;">📊 ${cat} Comparison</h2>
            <button onclick="renderHome()" style="padding:8px 15px; background:#002244; color:white; border:none; border-radius:8px; cursor:pointer;">← Close Comparison</button>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            ${renderCompareCard(item1, d1, cat)}
            ${renderCompareCard(item2, d2, cat)}
        </div>
    `;

    document.getElementById('view-port').innerHTML = compareHtml;
}

function renderCompareCard(name, data, cat) {
    // Logic to determine labels based on category
    let labelA = "Manufacturer";
    let labelB = "Engines/Code";
    
    if (cat === "Airports") {
        labelA = "City/Country";
        labelB = "IATA/ICAO";
    } else if (cat === "Airlines") {
        labelA = "Country";
        labelB = "Fleet Size";
    }

    return `
        <div style="background:white; border-radius:15px; overflow:hidden; border:1px solid #e2e8f0; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
            <div style="height:160px; background-image:url('${data.image || "https://placehold.co/400x200?text=No+Image"}'); background-size:cover; background-position:center; background-color:#002244;"></div>
            <div style="padding:20px;">
                <h3 style="margin:0 0 15px 0; color:#002244; border-bottom:2px solid #f1f5f9; padding-bottom:10px;">${name}</h3>
                <div style="display:flex; flex-direction:column; gap:12px; font-size:0.95rem;">
                    <div style="display:flex; justify-content:space-between; border-bottom:1px solid #f8fafc; padding-bottom:4px;">
                        <span style="color:#64748b;">${labelA}:</span><b>${data.maker || '—'}</b>
                    </div>
                    <div style="display:flex; justify-content:space-between; border-bottom:1px solid #f8fafc; padding-bottom:4px;">
                        <span style="color:#64748b;">${labelB}:</span><b>${data.engines || '—'}</b>
                    </div>
                    <div style="display:flex; justify-content:space-between; border-bottom:1px solid #f8fafc; padding-bottom:4px;">
                        <span style="color:#64748b;">Era:</span><b>${data.era || '—'}</b>
                    </div>
                    <div style="display:flex; justify-content:space-between;">
                        <span style="color:#64748b;">Status:</span>
                        <b style="color:${data.status === 'Retired' ? '#ef4444' : '#10b981'};">${data.status || 'Active'}</b>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderSpotterChecklist() {
    let totalXP = 0;
    let html = `
        <div style="background: linear-gradient(135deg, #002244 0%, #004488 100%); color:white; padding:30px; border-radius:15px; margin-bottom:20px;">
            <h1 style="margin:0;">📸 Spotter's Log</h1>
            <p id="total-xp-display" style="font-size:1.5rem; color:#00f2ff; font-weight:bold; margin-top:10px;">Calculating XP...</p>
        </div>
        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap:15px;">
    `;
    
    // Look through your Fleets category for everything you've added
    const fleet = flightInnData.Fleets || {};
    
    for (let name in fleet) {
        const p = fleet[name];
        const xp = p.points || 10;
        totalXP += xp;

        html += `
            <div style="background:white; padding:15px; border-radius:12px; border:2px solid #e2e8f0; border-left: 5px solid #00f2ff;">
                <div style="font-size:0.7rem; font-weight:bold; color:#64748b; text-transform:uppercase;">${p.rarity || 'Common'}</div>
                <b style="color:#002244; font-size:1.1rem;">${name}</b>
                <div style="margin-top:5px; font-size:0.9rem; color:#2563eb;">+${xp} XP Collected</div>
            </div>
        `;
    }

    document.getElementById('view-port').innerHTML = html + `</div>`;
    document.getElementById('total-xp-display').innerText = `Total Score: ${totalXP} XP`;
}
