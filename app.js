const KEY='routely_v1';
const defaults={currency:'NGN',symbol:'₦',trips:[],destinations:[],items:[],budgets:{}};
let data,currentTrip=null,activeView='dashboard';
const $=id=>document.getElementById(id);
const CURRENCIES={NGN:'₦',USD:'$',GBP:'£',EUR:'€',GHS:'₵',KES:'KSh',ZAR:'R',CAD:'C$',AUD:'A$',INR:'₹'};
function safeText(v,max=500){return typeof v==='string'?v.slice(0,max):''}
function safeNumber(v,min=0,max=1e9){const n=Number(v);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):0}
function safeDate(v){if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v))return '';const d=new Date(v+'T00:00:00Z');return Number.isNaN(d.getTime())||d.toISOString().slice(0,10)!==v?'':v}
function makeId(){try{return crypto.randomUUID()}catch{const a=new Uint8Array(16);crypto.getRandomValues(a);return [...a].map(x=>x.toString(16).padStart(2,'0')).join('')}}
function normalizeData(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Invalid data');
 const tripsIn=Array.isArray(raw.trips)?raw.trips.slice(0,500):[],destIn=Array.isArray(raw.destinations)?raw.destinations.slice(0,1000):[],itemsIn=Array.isArray(raw.items)?raw.items.slice(0,5000):[];
 const idMap=new Map(),trips=tripsIn.filter(x=>x&&typeof x==='object'&&!Array.isArray(x)).map(x=>{const id=makeId();if(typeof x.id==='string')idMap.set(x.id,id);return {id,name:safeText(x.name,70),from:safeText(x.from,120),to:safeText(x.to,120),start:safeDate(x.start),end:safeDate(x.end),people:safeNumber(x.people,1,99)||1,status:['Planning','Booked','Completed'].includes(x.status)?x.status:'Planning',notes:safeText(x.notes,3000)}}).filter(x=>x.name&&x.to);
 const destinations=destIn.filter(x=>x&&typeof x==='object'&&!Array.isArray(x)).map(x=>({id:makeId(),name:safeText(x.name,120),country:safeText(x.country,120),category:['City','Nature','Beach','Culture','Adventure','Other'].includes(x.category)?x.category:'Other',notes:safeText(x.notes,1500)})).filter(x=>x.name);
 const items=itemsIn.filter(x=>x&&typeof x==='object'&&!Array.isArray(x)&&idMap.has(x.tripId)).map(x=>({id:makeId(),tripId:idMap.get(x.tripId),title:safeText(x.title,120),date:safeDate(x.date),time:/^([01]\d|2[0-3]):[0-5]\d$/.test(x.time||'')?x.time:'',type:['Sightseeing','Transport','Accommodation','Food','Activity','Other'].includes(x.type)?x.type:'Other',cost:safeNumber(x.cost,0,1e8),location:safeText(x.location,250),notes:safeText(x.notes,2000)})).filter(x=>x.title);
 const budgets={};for(const [oldId,b] of Object.entries(raw.budgets&&typeof raw.budgets==='object'?raw.budgets:{})){const id=idMap.get(oldId);if(!id||!b||typeof b!=='object')continue;budgets[id]={};for(const k of ['total','transport','stay','food','activities','other'])budgets[id][k]=safeNumber(b[k],0,1e9)}
 const currency=Object.hasOwn(CURRENCIES,raw.currency)?raw.currency:'NGN';return {currency,symbol:CURRENCIES[currency],trips,destinations,items,budgets};
}
function load(){try{return normalizeData(JSON.parse(localStorage.getItem(KEY)||'{}'))}catch{return {...defaults,trips:[],destinations:[],items:[],budgets:{}}}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(data))}catch{toast('Unable to save: browser storage may be full or disabled. Export your data and try again.')}}
function uid(){return makeId()}
data=load();
function money(n){return `${data.symbol}${Number(n||0).toLocaleString(undefined,{maximumFractionDigits:2})}`}
function dateFmt(d){if(!d)return 'Dates not set';let x=new Date(d+'T00:00:00');return x.toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'})}
function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function toast(msg){$('toast').textContent=msg;$('toast').classList.add('show');setTimeout(()=>$('toast').classList.remove('show'),2300)}
function tripItems(id){return data.items.filter(x=>x.tripId===id).sort((a,b)=>(a.date||'').localeCompare(b.date||'')||(a.time||'').localeCompare(b.time||''))}
function tripSpend(id){return tripItems(id).reduce((s,x)=>s+Number(x.cost||0),0)}
function totalBudget(){return Object.values(data.budgets).reduce((s,x)=>s+Number(x.total||0),0)}
function fmtRange(t){return t.start||t.end?`${dateFmt(t.start)} – ${dateFmt(t.end)}`:'Dates not set'}
function go(view){activeView=view;currentTrip=null;$('pageName').textContent=({dashboard:'Overview',trips:'My journeys',destinations:'Destinations',explore:'Explore & routes',budget:'Travel budget',saved:'Saved itineraries',settings:'Settings & data'})[view]||'Journey';document.querySelectorAll('.nav-link').forEach(b=>b.classList.toggle('active',b.dataset.view===view));$('sidebar').classList.remove('open');render()}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.view)));
$('menuBtn').onclick=()=>$('sidebar').classList.toggle('open');$('settingsShortcut').onclick=()=>go('settings');
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());
$('today').textContent=new Date().toLocaleDateString(undefined,{weekday:'short',day:'numeric',month:'short',year:'numeric'});
function pageHead(kicker,title,desc,button=''){return `<div class="page-head"><div><div class="eyebrow">${kicker}</div><h1>${title}</h1><p>${desc}</p></div>${button}</div>`}
function empty(icon,title,desc,button=''){return `<div class="empty"><div class="empty-icon">${icon}</div><b>${title}</b><p>${desc}</p>${button}</div>`}
function tripRow(t){return `<div class="trip-row"><div class="trip-thumb">✈</div><div class="trip-row-main"><b>${esc(t.name)}</b><small>${esc(t.to)} · ${fmtRange(t)}</small></div><span class="pill">${esc(t.status)}</span><button class="text-link" onclick="openTrip('${t.id}')">View</button></div>`}
function render(){if(currentTrip){renderTripDetail(currentTrip);return}({dashboard:renderDashboard,trips:renderTrips,destinations:renderDestinations,explore:renderExplore,budget:renderBudget,saved:renderSaved,settings:renderSettings}[activeView]||renderDashboard)()}
function renderDashboard(){
let upcoming=data.trips.filter(t=>t.status!=='Completed').sort((a,b)=>(a.start||'').localeCompare(b.start||''));
let spent=data.trips.reduce((s,t)=>s+tripSpend(t.id),0),budget=totalBudget();
$('content').innerHTML=`
<section class="hero"><div class="hero-copy"><div class="eyebrow">MAKE EVERY JOURNEY COUNT</div><h2>Your next great journey starts here.</h2><p>Bring your plans, places and travel spending together in one place.</p><button class="btn" onclick="newTrip()">＋ Plan a journey</button></div><div class="hero-art">🌍</div></section>
<div class="stats">
<div class="stat"><div class="stat-top">Total journeys <span class="stat-icon">✈</span></div><strong>${data.trips.length}</strong><small>All your planned adventures</small></div>
<div class="stat"><div class="stat-top">Destinations <span class="stat-icon">⌖</span></div><strong>${data.destinations.length}</strong><small>Places on your list</small></div>
<div class="stat"><div class="stat-top">Planned budget <span class="stat-icon">◷</span></div><strong>${money(budget)}</strong><small>Across budgets you set</small></div>
<div class="stat"><div class="stat-top">Tracked costs <span class="stat-icon">↗</span></div><strong>${money(spent)}</strong><small>Costs added to itinerary items</small></div>
</div>
<div class="dashboard-grid"><section class="panel"><div class="panel-head"><h3>Your journeys</h3><button class="text-link" onclick="go('trips')">View all →</button></div><div class="trip-list">${upcoming.length?upcoming.slice(0,4).map(tripRow).join(''):empty('🧳','No journeys yet','Start by creating your first travel plan.',`<button class="btn primary small-btn" onclick="newTrip()">Plan a journey</button>`)}</div></section>
<section class="panel"><div class="panel-head"><h3>Budget snapshot</h3><button class="text-link" onclick="go('budget')">Details →</button></div><div class="budget-total">${money(spent)}</div><div class="muted" style="font-size:11px">Tracked itinerary expenses</div><div class="progress"><span style="width:${budget?Math.min(100,spent/budget*100):0}%"></span></div><div class="budget-foot"><span>${budget?Math.round(spent/budget*100)+'% of planned budget':'Set a trip budget to track progress'}</span><b>${money(budget)}</b></div><div class="notice">Your information is stored locally on this device. Export a backup from Settings & data.</div></section></div>
<section class="panel" style="margin-top:17px"><div class="panel-head"><h3>Quick access</h3></div><div class="toolbar"><button class="btn secondary" onclick="newDestination()">＋ Add destination</button><button class="btn secondary" onclick="go('saved')">▤ Saved itineraries</button><button class="btn secondary" onclick="go('budget')">◷ Manage budgets</button></div></section>`;
}
function renderTrips(){
$('content').innerHTML=pageHead('YOUR TRAVEL SPACE','My journeys','Create, organise and keep track of every trip.',`<button class="btn primary" onclick="newTrip()">＋ New journey</button>`)+
(data.trips.length?`<div class="trip-grid">${data.trips.map((t,i)=>`<article class="trip-card"><div class="trip-cover ${['','c2','c3'][i%3]}"><span>${['🌴','🏔️','🏙️'][i%3]}</span><span class="pill">${esc(t.status)}</span></div><div class="trip-body"><h3>${esc(t.name)}</h3><p>⌖ ${esc(t.from||'Starting point not set')} → ${esc(t.to)}</p><div class="trip-meta"><span>◷ ${fmtRange(t)}</span><span>♙ ${t.people||1} traveller(s)</span></div><div class="trip-actions"><button class="btn primary small-btn" onclick="openTrip('${t.id}')">Open journey</button><button class="btn secondary small-btn" onclick="editTrip('${t.id}')">Edit</button></div></div></article>`).join('')}</div>`:empty('🧭','Your journey list is empty','Create your first trip and start building your itinerary.',`<button class="btn primary" onclick="newTrip()">＋ Plan a journey</button>`));
}
function renderDestinations(){
$('content').innerHTML=pageHead('PLACES TO GO','Destinations','Keep a personal collection of places you want to explore.',`<button class="btn primary" onclick="newDestination()">＋ Add destination</button>`)+
(data.destinations.length?`<div class="destination-grid">${data.destinations.map((d,i)=>`<article class="destination-card"><div class="dest-symbol">${({City:'🏙️',Nature:'🏞️',Beach:'🏖️',Culture:'🏛️',Adventure:'🧗',Other:'📍'})[d.category]||'📍'}</div><h3>${esc(d.name)}</h3><div class="country">${esc(d.country||d.category)}</div><p>${esc(d.notes||'A place on your travel wish list.')}</p><div class="dest-actions"><span class="pill">${esc(d.category)}</span><button class="btn danger small-btn" onclick="deleteDestination('${d.id}')">Remove</button></div></article>`).join('')}</div>`:empty('📍','No destinations saved','Add places you would love to visit.',`<button class="btn primary" onclick="newDestination()">＋ Add destination</button>`));
}

const curatedPlaces=[
 {name:'Lagos',country:'Nigeria',kind:'City',emoji:'🌆',desc:'A lively coastal city known for its food, art, beaches and energetic culture.'},
 {name:'Cape Town',country:'South Africa',kind:'Nature & city',emoji:'⛰️',desc:'Mountain scenery, waterfront experiences, beaches and memorable day trips.'},
 {name:'Marrakech',country:'Morocco',kind:'Culture',emoji:'🕌',desc:'Historic markets, gardens, architecture and distinctive Moroccan cuisine.'},
 {name:'Nairobi',country:'Kenya',kind:'Wildlife & city',emoji:'🦒',desc:'A dynamic city with cultural attractions and wildlife experiences nearby.'},
 {name:'Accra',country:'Ghana',kind:'Coastal city',emoji:'🌴',desc:'Coastal neighbourhoods, music, history, markets and Ghanaian food.'},
 {name:'Zanzibar',country:'Tanzania',kind:'Beach',emoji:'🏝️',desc:'White-sand beaches, clear water and the historic streets of Stone Town.'},
 {name:'Kigali',country:'Rwanda',kind:'City & nature',emoji:'🌿',desc:'Green hills, thoughtful cultural experiences and a relaxed city atmosphere.'},
 {name:'Kyoto',country:'Japan',kind:'Culture',emoji:'🏯',desc:'Temples, traditional streets, gardens and seasonal scenery.'},
 {name:'Lisbon',country:'Portugal',kind:'City',emoji:'🚋',desc:'Hillside neighbourhoods, waterfront views, historic trams and local cuisine.'}
];
function renderExplore(){
 $('content').innerHTML=pageHead('DISCOVER & NAVIGATE','Explore & routes','Find inspiration, estimate a road route and convert travel money.')+
 `<section class="panel" style="margin-bottom:17px"><div class="panel-head"><h3>Route planner</h3><span class="pill">OpenStreetMap + OSRM</span></div><div class="route-form"><label>Starting point<input id="routeFrom" placeholder="e.g. Ikeja, Lagos"></label><label>Destination<input id="routeTo" placeholder="e.g. Lekki, Lagos"></label><button class="btn primary" id="routeBtn" onclick="planRoute()">Calculate route</button></div><div id="routeStatus" class="api-note">Enter two places to calculate an approximate driving route. Location lookup and routing require an internet connection.</div><div id="routeResult"></div><div class="map-frame" style="margin-top:13px"><div id="routeMap"></div></div><div id="mapFallback" class="api-note" style="margin-top:9px">If the map does not load, you can still open the journey in Google Maps after entering your start and destination.</div><div class="api-note">Map data © OpenStreetMap contributors. Route estimates are provided by the public OSRM demo service and may be unavailable or unsuitable for navigation. Always follow local road signs.</div></section>
 <div class="budget-layout" style="margin-bottom:20px"><section class="panel"><div class="panel-head"><h3>Currency converter</h3><span class="pill">Live rates</span></div><div class="fx-form"><label>Amount<input id="fxAmount" type="number" min="0" step="any" value="100"></label><label>From<select id="fxFrom"><option>NGN</option><option>USD</option><option>GBP</option><option>EUR</option><option>GHS</option><option>KES</option><option>ZAR</option><option>CAD</option><option>AUD</option><option>INR</option></select></label><label>To<select id="fxTo"><option>USD</option><option>NGN</option><option>GBP</option><option>EUR</option><option>GHS</option><option>KES</option><option>ZAR</option><option>CAD</option><option>AUD</option><option>INR</option></select></label><button class="btn primary" onclick="convertCurrency()">Convert</button></div><div class="fx-output" id="fxOutput">Ready to convert</div><div class="api-note" id="fxNote">Rates are retrieved from a public exchange-rate endpoint when online. Confirm rates with your bank or provider before making payments.</div></section>
 <section class="panel"><div class="panel-head"><h3>Smart planning tips</h3></div><div class="budget-line"><span>Before booking</span><b>Check entry requirements</b></div><div class="budget-line"><span>Before departure</span><b>Confirm transport details</b></div><div class="budget-line"><span>While travelling</span><b>Keep a budget buffer</b></div><div class="budget-line"><span>For your records</span><b>Save booking references safely</b></div><p class="api-note">Recommendations are planning prompts, not live booking or visa advice.</p></section></div>
 <div class="panel-head"><h3>Destination inspiration</h3><span class="muted" style="font-size:10px">A starter collection to spark ideas</span></div><div class="explore-grid">${curatedPlaces.map(p=>`<article class="explore-card"><div class="emoji">${p.emoji}</div><h3>${p.name}</h3><div class="country">${p.country} · ${p.kind}</div><p>${p.desc}</p><button class="btn secondary small-btn" onclick="saveSuggestedDestination('${p.name.replace(/'/g,"\\'")}','${p.country}','${p.kind}')">＋ Save destination</button></article>`).join('')}</div>`;
 initRouteMap();
}
let routeMap=null,routeLayer=null,routeTiles=null;
function initRouteMap(){
 const el=document.getElementById('routeMap');if(!el)return;
 const fallback=document.getElementById('mapFallback');
 if(!window.L){if(fallback)fallback.textContent='The map library could not load. Use the Google Maps directions link after entering your places.';return;}
 if(routeMap){routeMap.remove();routeMap=null}
 routeMap=L.map('routeMap').setView([6.5244,3.3792],10);
 let tileErrors=0, fallbackTried=false;
 const showFallbackMessage=()=>{if(fallback)fallback.textContent='The map tiles are unavailable on this connection. Your route details are still available; use the Google Maps directions link below.';};
 const tryAlternateTiles=()=>{
  if(fallbackTried)return;
  fallbackTried=true;
  if(routeTiles)routeMap.removeLayer(routeTiles);
  routeTiles=L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{subdomains:'abcd',maxZoom:19,attribution:'© OpenStreetMap contributors © CARTO'});
  let alternateErrors=0;
  routeTiles.on('tileerror',()=>{alternateErrors++;if(alternateErrors>=2)showFallbackMessage();});
  routeTiles.addTo(routeMap);
  if(fallback)fallback.textContent='Trying an alternate map provider…';
 };
 routeTiles=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'});
 routeTiles.on('tileerror',()=>{tileErrors++;if(tileErrors>=2)tryAlternateTiles();});
 routeTiles.addTo(routeMap);
 setTimeout(()=>routeMap.invalidateSize(),250);
}
function safeMapPopup(label,value){const node=document.createElement('div');node.textContent=label+': '+value;return node;}
async function geocodePlace(q){
 const url='https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q='+encodeURIComponent(q);
 const res=await fetch(url,{headers:{'Accept':'application/json'}});
 if(!res.ok)throw Error('Place lookup is temporarily unavailable.');
 const results=await res.json();if(!results.length)throw Error('Could not find “'+q+'”. Try adding a city or country.');
 return {lat:Number(results[0].lat),lon:Number(results[0].lon),label:results[0].display_name};
}
async function planRoute(){
 const from=document.getElementById('routeFrom')?.value.trim(),to=document.getElementById('routeTo')?.value.trim();
 const status=document.getElementById('routeStatus'),result=document.getElementById('routeResult'),btn=document.getElementById('routeBtn');
 if(!from||!to){toast('Enter both a starting point and destination.');return}
 btn.disabled=true;btn.textContent='Calculating…';status.textContent='Finding both places…';result.innerHTML='';
 const fallback=document.getElementById('mapFallback');if(fallback)fallback.innerHTML='Map not displaying? <a target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&origin='+encodeURIComponent(from)+'&destination='+encodeURIComponent(to)+'&travelmode=driving">Open directions in Google Maps</a>.';
 try{
  const a=await geocodePlace(from);await new Promise(r=>setTimeout(r,1100));const b=await geocodePlace(to);
  status.textContent='Calculating approximate driving route…';
  const url=`https://router.project-osrm.org/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}?overview=full&geometries=geojson&steps=false`;
  const rr=await fetch(url);if(!rr.ok)throw Error('The route service did not respond. Try again later.');
  const payload=await rr.json();if(payload.code!=='Ok'||!payload.routes?.length)throw Error('No driving route was found for those places.');
  const route=payload.routes[0],km=route.distance/1000,mins=route.duration/60;
  result.innerHTML=`<div class="route-result"><div><b>${km.toFixed(1)} km</b><small>Estimated road distance</small></div><div><b>${mins>=60?Math.floor(mins/60)+' hr '+Math.round(mins%60)+' min':Math.round(mins)+' min'}</b><small>Estimated driving time</small></div><div><b>Driving</b><small>Suggested route profile</small></div></div>`;
  if(routeMap){if(routeLayer)routeMap.removeLayer(routeLayer);routeLayer=L.geoJSON(route.geometry,{style:{color:'#167d78',weight:5,opacity:.85}}).addTo(routeMap);const points=route.geometry.coordinates;L.marker([a.lat,a.lon]).addTo(routeMap).bindPopup(safeMapPopup('Start',from));L.marker([b.lat,b.lon]).addTo(routeMap).bindPopup(safeMapPopup('Destination',to));routeMap.fitBounds(routeLayer.getBounds(),{padding:[25,25]})}
  status.textContent='Route calculated. This is an estimate, not live traffic guidance.';
  if(fallback)fallback.innerHTML='If map tiles are blocked on this network, <a target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&origin='+encodeURIComponent(from)+'&destination='+encodeURIComponent(to)+'&travelmode=driving">open this route in Google Maps</a>.';
 }catch(err){status.textContent=err.message||'Unable to calculate this route.'}
 finally{btn.disabled=false;btn.textContent='Calculate route'}
}
async function convertCurrency(){
 const amount=Number(document.getElementById('fxAmount').value),from=document.getElementById('fxFrom').value,to=document.getElementById('fxTo').value,out=document.getElementById('fxOutput'),note=document.getElementById('fxNote');
 if(!Number.isFinite(amount)||amount<0){toast('Enter a valid amount.');return}
 out.textContent='Fetching latest available rate…';
 try{
  const res=await fetch('https://open.er-api.com/v6/latest/'+encodeURIComponent(from));
  if(!res.ok)throw Error();const d=await res.json();if(d.result!=='success'||!d.rates?.[to])throw Error();
  const rate=d.rates[to],converted=amount*rate;
  out.textContent=`${amount.toLocaleString()} ${from} = ${converted.toLocaleString(undefined,{maximumFractionDigits:2})} ${to}`;
  note.textContent=`Indicative rate: 1 ${from} = ${rate.toLocaleString(undefined,{maximumFractionDigits:6})} ${to}. Last updated: ${d.time_last_update_utc||'provider timestamp unavailable'}. Rates may differ from the rate you receive.`;
 }catch{out.textContent='Conversion unavailable right now.';note.textContent='Check your internet connection and try again. This feature uses a public rate service and is not a payment quote.'}
}
function saveSuggestedDestination(name,country,category){
 if(data.destinations.some(d=>d.name.toLowerCase()===name.toLowerCase()&&d.country.toLowerCase()===country.toLowerCase())){toast('That destination is already saved.');return}
 data.destinations.push({id:uid(),name,country,category,notes:'Added from ROUTELY destination inspiration.'});save();toast(name+' saved to your destinations.')
}

function renderBudget(){
let rows=data.trips.map(t=>{let b=data.budgets[t.id]||{total:0,transport:0,stay:0,food:0,activities:0,other:0};return {t,b,spent:tripSpend(t.id)}}).filter(x=>true);
$('content').innerHTML=pageHead('MONEY, MADE CLEAR','Travel budget','Set a budget for each journey and compare it with costs recorded in your itinerary.')+
(rows.length?`<div class="budget-layout">${rows.map(({t,b,spent})=>`<section class="panel"><div class="panel-head"><h3>${esc(t.name)}</h3><span class="pill">${money(spent)} spent</span></div><div class="budget-total">${money(b.total)}</div><div class="muted" style="font-size:10px">Planned trip budget</div><div class="progress"><span style="width:${b.total?Math.min(100,spent/b.total*100):0}%"></span></div><div class="budget-foot"><span>${b.total?Math.round(spent/b.total*100)+'% used':'No budget set'}</span><b>${money(Math.max(0,b.total-spent))} remaining</b></div><div class="budget-line"><span>Set total budget</span><input class="budget-input" type="number" min="0" value="${b.total||0}" onchange="setBudget('${t.id}','total',this.value)"></div><div class="budget-line"><span>Transport estimate</span><input class="budget-input" type="number" min="0" value="${b.transport||0}" onchange="setBudget('${t.id}','transport',this.value)"></div><div class="budget-line"><span>Accommodation estimate</span><input class="budget-input" type="number" min="0" value="${b.stay||0}" onchange="setBudget('${t.id}','stay',this.value)"></div><div class="budget-line"><span>Food estimate</span><input class="budget-input" type="number" min="0" value="${b.food||0}" onchange="setBudget('${t.id}','food',this.value)"></div><div class="budget-line"><span>Activities estimate</span><input class="budget-input" type="number" min="0" value="${b.activities||0}" onchange="setBudget('${t.id}','activities',this.value)"></div><div class="budget-line"><span>Other estimate</span><input class="budget-input" type="number" min="0" value="${b.other||0}" onchange="setBudget('${t.id}','other',this.value)"></div></section>`).join('')}</div>`:empty('💳','No journeys to budget yet','Create a journey first, then set its budget.',`<button class="btn primary" onclick="newTrip()">＋ Create journey</button>`))+
`<div class="notice">Budget figures are estimates you enter. ROUTELY does not fetch live fares, exchange rates or booking prices.</div>`;
}
function renderSaved(){
let saved=data.trips.filter(t=>t.status==='Booked'||t.status==='Completed');
$('content').innerHTML=pageHead('YOUR TRAVEL LIBRARY','Saved itineraries','A focused view of booked and completed journeys.')+(saved.length?`<div class="trip-grid">${saved.map(t=>`<article class="trip-card"><div class="trip-cover">🗺️</div><div class="trip-body"><h3>${esc(t.name)}</h3><p>${esc(t.to)} · ${fmtRange(t)}</p><div class="trip-actions"><button class="btn primary small-btn" onclick="openTrip('${t.id}')">View itinerary</button><button class="btn secondary small-btn" onclick="exportTrip('${t.id}')">Export</button></div></div></article>`).join('')}</div>`:empty('▤','No saved itineraries yet','Mark a journey as Booked or Completed to see it here.'));
}
function renderTripDetail(id){
let t=data.trips.find(x=>x.id===id);if(!t){currentTrip=null;render();return}
let items=tripItems(id),spent=tripSpend(id),b=(data.budgets[id]||{}).total||0;
$('pageName').textContent=t.name;
$('content').innerHTML=`<button class="text-link" onclick="currentTrip=null;go('trips')">← Back to journeys</button><div class="detail-hero" style="margin-top:15px"><div><div class="eyebrow">YOUR JOURNEY</div><h2>${esc(t.name)}</h2><p>${esc(t.from||'Starting point not set')} → ${esc(t.to)} &nbsp; • &nbsp; ${fmtRange(t)} &nbsp; • &nbsp; ${t.people||1} traveller(s)</p></div><div class="detail-actions"><button class="btn secondary small-btn" onclick="editTrip('${id}')">Edit trip</button><button class="btn primary small-btn" onclick="newItem('${id}')">＋ Add activity</button></div></div>
<div class="stats"><div class="stat"><div class="stat-top">Activities <span class="stat-icon">☷</span></div><strong>${items.length}</strong></div><div class="stat"><div class="stat-top">Tracked costs <span class="stat-icon">◷</span></div><strong>${money(spent)}</strong></div><div class="stat"><div class="stat-top">Trip budget <span class="stat-icon">◎</span></div><strong>${money(b)}</strong></div><div class="stat"><div class="stat-top">Status <span class="stat-icon">✓</span></div><strong style="font-size:17px">${esc(t.status)}</strong></div></div>
<div class="dashboard-grid"><section class="panel"><div class="panel-head"><h3>Day-by-day itinerary</h3><button class="text-link" onclick="newItem('${id}')">＋ Add item</button></div>${items.length?`<div class="itinerary">${items.map(x=>`<div class="itinerary-item"><div class="it-time">${x.time?esc(x.time):'Flexible'}<small>${dateFmt(x.date)}</small></div><div class="it-main"><b>${esc(x.title)}</b><small>${esc(x.type)}${x.location?' · '+esc(x.location):''}${x.notes?' · '+esc(x.notes):''}</small>${x.location?`<a class="map-link" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(x.location)}">Open map ↗</a>`:''}</div><div><div class="it-cost">${money(x.cost)}</div><button class="text-link" onclick="editItem('${x.id}')">Edit</button> <button class="text-link" onclick="deleteItem('${x.id}')">×</button></div></div>`).join('')}</div>`:empty('🗓️','Your itinerary is waiting','Add your first stop, activity or travel detail.',`<button class="btn primary small-btn" onclick="newItem('${id}')">＋ Add itinerary item</button>`)}</section>
<section class="panel"><div class="panel-head"><h3>Journey notes</h3></div><p class="muted" style="font-size:12px;line-height:1.7;white-space:pre-wrap">${esc(t.notes||'No notes added yet.')}</p><div class="budget-line"><span>Starting point</span><b>${esc(t.from||'—')}</b></div><div class="budget-line"><span>Destination</span><b>${esc(t.to)}</b></div><div class="budget-line"><span>Travellers</span><b>${t.people||1}</b></div><div class="budget-line"><span>Tracked costs</span><b>${money(spent)}</b></div><div class="toolbar" style="margin-top:16px"><button class="btn secondary small-btn" onclick="exportTrip('${id}')">Export itinerary</button><button class="btn danger small-btn" onclick="deleteTrip('${id}')">Delete journey</button></div></section></div>`;
}
function renderSettings(){
$('content').innerHTML=pageHead('PREFERENCES & CONTROL','Settings & data','Choose your display currency and manage your ROUTELY data.')+
`<div class="settings-grid"><section class="panel"><div class="panel-head"><h3>Travel preferences</h3></div><div class="setting-row"><div><b>Display currency</b><small>Used for budgets and costs.</small></div><select id="currencySelect" onchange="changeCurrency(this.value)"><option value="NGN">NGN — Nigerian naira (₦)</option><option value="USD">USD — US dollar ($)</option><option value="GBP">GBP — British pound (£)</option><option value="EUR">EUR — Euro (€)</option><option value="GHS">GHS — Ghanaian cedi (₵)</option><option value="KES">KES — Kenyan shilling (KSh)</option><option value="ZAR">ZAR — South African rand (R)</option><option value="CAD">CAD — Canadian dollar (C$)</option><option value="AUD">AUD — Australian dollar (A$)</option><option value="INR">INR — Indian rupee (₹)</option></select></div><div class="setting-row"><div><b>Offline availability</b><small>Previously loaded app shell can work offline.</small></div><span class="pill">PWA ready</span></div><div class="setting-row"><div><b>Account</b><small>No account or sign-in required.</small></div><span class="pill">Local mode</span></div></section>
<section class="panel"><div class="panel-head"><h3>Backup & restore</h3></div><p class="muted" style="font-size:11px;line-height:1.6">Your journeys, destinations, itinerary items and budgets are stored in this browser on this device. Export a backup regularly, especially before clearing browser data.</p><div class="toolbar" style="margin-top:18px"><button class="btn primary" onclick="backup()">↓ Export backup</button><label class="btn secondary" for="restoreFile">↑ Restore backup</label><input id="restoreFile" type="file" accept="application/json,.json" hidden onchange="restoreBackup(this.files[0])"></div><div class="notice">For privacy, ROUTELY does not send your trip details to a server. Local data may be lost if browser storage is cleared or the device is changed.</div></section>
<section class="panel"><div class="panel-head"><h3>Data management</h3></div><div class="setting-row"><div><b>Delete all ROUTELY data</b><small>Permanently clears journeys, destinations and budgets from this browser.</small></div><button class="btn danger small-btn" onclick="resetAll()">Reset data</button></div></section>
<section class="panel"><div class="panel-head"><h3>About ROUTELY</h3></div><h2 style="font:800 21px Manrope;margin:0">ROUTELY</h2><p class="muted" style="font-size:11px">Intelligent trip and journey planning.</p><div class="budget-line"><span>Version</span><b>1.0.0</b></div><div class="budget-line"><span>Application type</span><b>Installable PWA</b></div><div class="budget-line"><span>Data storage</span><b>On this device</b></div></section></div>`;
$('currencySelect').value=data.currency||'NGN';
}
function newTrip(){ $('tripForm').reset();$('tripId').value='';$('tripPeople').value=1;$('tripDialogTitle').textContent='Plan a journey';$('tripDialog').showModal()}
function editTrip(id){let t=data.trips.find(x=>x.id===id);if(!t)return;$('tripForm').reset();$('tripId').value=id;$('tripName').value=t.name;$('tripFrom').value=t.from||'';$('tripTo').value=t.to;$('tripStart').value=t.start||'';$('tripEnd').value=t.end||'';$('tripPeople').value=t.people||1;$('tripStatus').value=t.status;$('tripNotes').value=t.notes||'';$('tripDialogTitle').textContent='Edit journey';$('tripDialog').showModal()}
$('tripForm').onsubmit=e=>{e.preventDefault();let id=$('tripId').value,t={id:id||uid(),name:$('tripName').value.trim(),from:$('tripFrom').value.trim(),to:$('tripTo').value.trim(),start:$('tripStart').value,end:$('tripEnd').value,people:Number($('tripPeople').value)||1,status:$('tripStatus').value,notes:$('tripNotes').value.trim()};if(t.end&&t.start&&t.end<t.start){toast('Return date cannot be before departure.');return}if(id)data.trips=data.trips.map(x=>x.id===id?t:x);else data.trips.push(t);save();$('tripDialog').close();toast('Journey saved');render()};
function openTrip(id){currentTrip=id;renderTripDetail(id)}
function deleteTrip(id){if(!confirm('Delete this journey and all its itinerary items and budget?'))return;data.trips=data.trips.filter(t=>t.id!==id);data.items=data.items.filter(x=>x.tripId!==id);delete data.budgets[id];save();currentTrip=null;go('trips');toast('Journey deleted')}
function newItem(tripId){$('itemForm').reset();$('itemTripId').value=tripId;$('itemId').value='';$('itemDialogTitle').textContent='Add itinerary item';let t=data.trips.find(x=>x.id===tripId);$('itemDate').value=t?.start||'';$('itemDialog').showModal()}
function editItem(id){let x=data.items.find(x=>x.id===id);if(!x)return;$('itemTripId').value=x.tripId;$('itemId').value=id;$('itemTitle').value=x.title;$('itemDate').value=x.date||'';$('itemTime').value=x.time||'';$('itemType').value=x.type;$('itemCost').value=x.cost||'';$('itemLocation').value=x.location||'';$('itemNotes').value=x.notes||'';$('itemDialogTitle').textContent='Edit itinerary item';$('itemDialog').showModal()}
$('itemForm').onsubmit=e=>{e.preventDefault();let id=$('itemId').value,x={id:id||uid(),tripId:$('itemTripId').value,title:$('itemTitle').value.trim(),date:$('itemDate').value,time:$('itemTime').value,type:$('itemType').value,cost:Number($('itemCost').value)||0,location:$('itemLocation').value.trim(),notes:$('itemNotes').value.trim()};if(id)data.items=data.items.map(y=>y.id===id?x:y);else data.items.push(x);save();$('itemDialog').close();toast('Itinerary item saved');renderTripDetail(x.tripId)};
function deleteItem(id){if(!confirm('Remove this itinerary item?'))return;data.items=data.items.filter(x=>x.id!==id);save();renderTripDetail(currentTrip);toast('Item removed')}
function newDestination(){$('destinationForm').reset();$('destinationDialog').showModal()}
$('destinationForm').onsubmit=e=>{e.preventDefault();data.destinations.push({id:uid(),name:$('destName').value.trim(),country:$('destCountry').value.trim(),category:$('destCategory').value,notes:$('destNotes').value.trim()});save();$('destinationDialog').close();toast('Destination saved');renderDestinations()}
function deleteDestination(id){if(!confirm('Remove this destination?'))return;data.destinations=data.destinations.filter(d=>d.id!==id);save();renderDestinations();toast('Destination removed')}
function setBudget(id,key,val){if(!data.budgets[id])data.budgets[id]={total:0,transport:0,stay:0,food:0,activities:0,other:0};data.budgets[id][key]=Math.max(0,Number(val)||0);save();toast('Budget updated')}
function changeCurrency(code){if(!Object.hasOwn(CURRENCIES,code)){toast('Unsupported currency');return}data.currency=code;data.symbol=CURRENCIES[code];save();render();toast('Currency updated')}
function download(name,content,type='application/json'){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.rel='noopener';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function backup(){download('routely-backup-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify(data,null,2));toast('Backup exported')}
function restoreBackup(file){if(!file)return;if(file.size>2*1024*1024){toast('Backup is too large. Maximum size is 2 MB.');return}if(file.type&&file.type!=='application/json'&&!file.name.toLowerCase().endsWith('.json')){toast('Choose a ROUTELY JSON backup.');return}let r=new FileReader();r.onload=()=>{try{const parsed=JSON.parse(r.result);if(!parsed||typeof parsed!=='object'||!Array.isArray(parsed.trips)||!Array.isArray(parsed.destinations)||!Array.isArray(parsed.items))throw Error('Invalid backup');const clean=normalizeData(parsed);if(!confirm('Restore this backup? Current ROUTELY data will be replaced.'))return;data=clean;save();render();toast('Backup restored safely')}catch{toast('That backup is invalid, damaged or contains unsupported data')}};r.onerror=()=>toast('Could not read that backup file');r.readAsText(file)}
function resetAll(){if(!confirm('This will permanently delete all ROUTELY data stored in this browser. Continue?'))return;if(!confirm('Are you absolutely sure? Export a backup first if you need one.'))return;data={...defaults};save();go('dashboard');toast('All local data cleared')}
function exportTrip(id){let t=data.trips.find(x=>x.id===id);if(!t)return;let pack={app:'ROUTELY',exportedAt:new Date().toISOString(),trip:t,items:tripItems(id),budget:data.budgets[id]||{}};download('routely-'+t.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'.json',JSON.stringify(pack,null,2));toast('Itinerary exported')}
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
render();
