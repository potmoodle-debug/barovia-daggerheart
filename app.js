const DATA=window.BAROVIA_DATA||{};
const CATS=window.BAROVIA_CATEGORIES||{};
const EDGES=window.BAROVIA_EDGES||[];
const THREADS=window.BAROVIA_THREADS||[];
const DISC=window.BAROVIA_DISCOVERIES||[];
const STATE=window.BAROVIA_STATE||{};

const home=document.getElementById("home");
const article=document.getElementById("article");
const brain=document.getElementById("brain");
const character=document.getElementById("character");
const nav=document.getElementById("nav");
const searchInput=document.getElementById("searchInput");

function esc(s){
  return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}
function slug(s){return encodeURIComponent(s)}
function routeFor(name){return "#/record/"+slug(name)}
function go(h){location.hash=h}

function renderState(){
  document.getElementById("currentLocation").textContent=STATE.currentLocation||"Unknown";
  document.getElementById("currentPressure").textContent=STATE.currentPressure||"None recorded";
  document.getElementById("campaignState").textContent=STATE.campaignState||"Unrecorded";
}

function renderThreads(){
  const grid=document.getElementById("threadGrid");
  grid.innerHTML="";
  THREADS.forEach(t=>{
    const b=document.createElement("button");
    b.className="card";
    b.innerHTML=`<small>${esc(t.type)}</small><h3>${esc(t.title)}</h3><p>${esc(t.text)}</p><span class="tag">${esc(t.status)}</span>`;
    b.onclick=()=>go("#/threads");
    grid.appendChild(b);
  });
}

function renderDiscoveries(){
  const grid=document.getElementById("discoveryGrid");
  grid.innerHTML="";
  DISC.forEach(d=>{
    const b=document.createElement("button");
    b.className="card";
    b.innerHTML=`<small>${esc(d.kind)}</small><h3>${esc(d.title)}</h3><p>${esc(d.text)}</p><span class="tag">Open record</span>`;
    b.onclick=()=>DATA[d.record]?go(routeFor(d.record)):null;
    grid.appendChild(b);
  });
}

function navLink(name){
  const b=document.createElement("button");
  b.className="nav-link";
  b.dataset.name=name;
  b.textContent=DATA[name]?.title||name;
  b.onclick=()=>go(routeFor(name));
  return b;
}

function renderNav(filter=""){
  nav.innerHTML="";
  const q=filter.trim().toLowerCase();

  Object.entries(CATS).forEach(([cat,names])=>{
    const visible=names.filter(n=>{
      const d=DATA[n]||{};
      return !q ||
        (d.title||n).toLowerCase().includes(q) ||
        (d.html||"").toLowerCase().includes(q);
    });

    if(!visible.length)return;

    const g=document.createElement("div");
    g.className="nav-group";

    const h=document.createElement("h3");
    h.textContent=cat;
    g.appendChild(h);

    visible.forEach(n=>g.appendChild(navLink(n)));
    nav.appendChild(g);
  });
}

searchInput.addEventListener("input",()=>renderNav(searchInput.value));

function related(name){
  const out=[];
  EDGES.forEach(([a,b])=>{
    if(a===name&&DATA[b])out.push(b);
    else if(b===name&&DATA[a])out.push(a);
  });
  return [...new Set(out)];
}

function relatedHTML(name){
  const list=related(name);
  if(!list.length)return"";

  return `<section class="related">
    <div class="eyebrow">CONNECTED RECORDS</div>
    <h2>Related records</h2>
    <div class="related-grid">
      ${list.map(n=>`<button data-related="${esc(n)}"><small>${esc(DATA[n].category)}</small><strong>${esc(DATA[n].title)}</strong></button>`).join("")}
    </div>
  </section>`;
}

function showRecord(name){
  if(!DATA[name]){
    showHome();
    return;
  }

  home.classList.add("hidden");
  brain.classList.add("hidden");
  character.classList.add("hidden");
  article.classList.remove("hidden");

  const d=DATA[name];

  article.innerHTML=`
    <div class="article-nav">
      <button id="backBtn">← Back</button>
      <button id="homeBtn">Barovia home</button>
    </div>
    <div class="article-meta">${esc(d.category)} / Player-known record</div>
    <h1>${esc(d.title)}</h1>
    ${d.html}
    ${relatedHTML(name)}
  `;

  document.getElementById("backBtn").onclick=()=>history.length>1?history.back():go("#/");
  document.getElementById("homeBtn").onclick=()=>go("#/");

  article.querySelectorAll("[data-related]").forEach(b=>{
    b.onclick=()=>go(routeFor(b.dataset.related));
  });

  document.getElementById("crumb").textContent="Barovia / "+d.title;
  document.title=d.title+" — Barovia";

  document.querySelectorAll(".nav-link").forEach(x=>{
    x.classList.toggle("active",x.dataset.name===name);
  });

  window.scrollTo(0,0);
  article.focus({preventScroll:true});
}

function showThreads(){
  home.classList.add("hidden");
  brain.classList.add("hidden");
  character.classList.add("hidden");
  article.classList.remove("hidden");

  article.innerHTML=`
    <div class="article-nav"><button id="homeBtn">← Barovia home</button></div>
    <div class="article-meta">Campaign / Current possibilities</div>
    <h1>What could happen next</h1>
    <p>Nothing here is compulsory. These are situations the party currently understands well enough to choose whether to pursue.</p>
    <div class="grid">
      ${THREADS.map(t=>`<div class="card"><small>${esc(t.type)}</small><h3>${esc(t.title)}</h3><p>${esc(t.text)}</p><span class="tag">${esc(t.status)}</span></div>`).join("")}
    </div>
  `;

  document.getElementById("homeBtn").onclick=()=>go("#/");
  document.getElementById("crumb").textContent="Barovia / Possibilities";
  document.title="What Could Happen Next — Barovia";
  window.scrollTo(0,0);
}

function showBrain(rootName="Barovia"){
  home.classList.add("hidden");
  article.classList.add("hidden");
  character.classList.add("hidden");
  brain.classList.remove("hidden");

  const root=document.getElementById("brainRoot");
  const relatedNames=related(rootName);

  root.innerHTML=`
    <button class="brain-node root" data-node="${esc(rootName)}">
      <small>${esc(DATA[rootName]?.category||"Record")}</small>
      <strong>${esc(DATA[rootName]?.title||rootName)}</strong>
    </button>
    ${relatedNames.map(n=>`<button class="brain-node" data-node="${esc(n)}"><small>${esc(DATA[n].category)}</small><strong>${esc(DATA[n].title)}</strong></button>`).join("")}
  `;

  root.querySelectorAll("[data-node]").forEach(b=>{
    b.onclick=()=>{
      const n=b.dataset.node;
      if(related(n).length)showBrain(n);
      else go(routeFor(n));
    };
  });

  document.getElementById("crumb").textContent="Barovia / Player Brain";
  document.title="Player Brain — Barovia";
  window.scrollTo(0,0);
}

function showCharacter(){
  home.classList.add("hidden");
  article.classList.add("hidden");
  brain.classList.add("hidden");
  character.classList.remove("hidden");
  document.getElementById("crumb").textContent="Barovia / Character";
  document.title="Character — Barovia";
  window.BAROVIA_CHARACTER?.show();
  window.scrollTo(0,0);
}

function showWorld(){
  showRecord("Barovia");
}

function showHome(){
  article.classList.add("hidden");
  brain.classList.add("hidden");
  character.classList.add("hidden");
  home.classList.remove("hidden");

  document.getElementById("crumb").textContent="Barovia / Home";
  document.title="Barovia — Daggerheart Campaign Guide";

  document.querySelectorAll(".nav-link").forEach(x=>x.classList.remove("active"));
  window.scrollTo(0,0);
}

function route(){
  const h=location.hash||"#/";

  if(h==="#/"||h==="#"){showHome();return}
  if(h==="#/character"){showCharacter();return}
  if(h==="#/threads"){showThreads();return}
  if(h==="#/brain"){showBrain();return}
  if(h==="#/world"){showWorld();return}

  if(h.startsWith("#/record/")){
    showRecord(decodeURIComponent(h.slice(9)));
    return;
  }

  showHome();
}

window.addEventListener("barovia:player-snapshot",event=>{
  const p=event.detail||{};
  if(p.state)Object.assign(STATE,p.state);
  if(Array.isArray(p.threads)){THREADS.splice(0,THREADS.length,...p.threads);}
  if(Array.isArray(p.discoveries)){DISC.splice(0,DISC.length,...p.discoveries);}
  if(p.records)Object.assign(DATA,p.records);
  if(p.categories){
    Object.keys(CATS).forEach(k=>delete CATS[k]);
    Object.assign(CATS,p.categories);
  }
  if(Array.isArray(p.edges)){EDGES.splice(0,EDGES.length,...p.edges);}
  renderState();renderThreads();renderDiscoveries();renderNav(searchInput.value);
  route();
});

window.addEventListener("hashchange",route);

document.getElementById("menuBtn").onclick=()=>{
  document.getElementById("sidebar").classList.toggle("open");
};

document.addEventListener("click",e=>{
  if(
    window.innerWidth<=960 &&
    !e.target.closest("#sidebar") &&
    !e.target.closest("#menuBtn")
  ){
    document.getElementById("sidebar").classList.remove("open");
  }
});

renderState();
renderThreads();
renderDiscoveries();
renderNav();
route();