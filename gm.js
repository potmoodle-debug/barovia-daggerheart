import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const SUPABASE_URL="https://dosdtvaeoeymlmnesoht.supabase.co";
const PUBLISHABLE_KEY=window.BAROVIA_PUBLIC_FEED_KEY;
const API_URL=SUPABASE_URL+"/functions/v1/barovia-gm-api";
const GM_RETURN_URL="https://potmoodle-debug.github.io/barovia-daggerheart/gm.html";
const supabase=createClient(SUPABASE_URL,PUBLISHABLE_KEY);

const $=id=>document.getElementById(id);

const WORLD=window.BAROVIA_GM_WORLD||{};
const SOURCE_LENSES=window.BAROVIA_SOURCE_LENSES||{guides:{},npcs:{}};
const VIEW_META={
  dashboard:["THINKING ABOUT THE GAME","Explore"],
  brain:["RELATIONSHIP VIEW","Campaign Brain"],
  live:["RIGHT NOW","Live Play"],
  threads:["MOVING WITHOUT THE PARTY","Threads"],
  prep:["BEFORE THE SESSION","Prep"],
  people:["THE CAST","People"],
  places:["THE LIVING VALLEY","Places"],
  strahd:["THE LAND'S MASTER","Strahd"],
  campaign:["CANON IN MOTION","Campaign State"],
  reference:["BEHIND THE SCREEN","Reference"]
};

function setView(name){
  document.querySelectorAll(".gm-view").forEach(v=>v.classList.toggle("active",v.dataset.viewPanel===name));
  document.querySelectorAll(".gm-nav-link").forEach(b=>b.classList.toggle("active",b.dataset.gmView===name));
  const meta=VIEW_META[name]||VIEW_META.dashboard;
  text("gmViewEyebrow",meta[0]); text("gmViewTitle",meta[1]);
  document.body.classList.remove("gm-nav-open");
  location.hash="gm-"+name;
}
function bindViewNavigation(){
  document.querySelectorAll("[data-gm-view]").forEach(b=>b.onclick=()=>setView(b.dataset.gmView));
  $("gmMenuBtn").onclick=()=>document.body.classList.toggle("gm-nav-open");
  const requested=(location.hash||"").replace("#gm-","");
  setView(VIEW_META[requested]?requested:"dashboard");
}
function recordCard(title,kicker,body,meta=""){
  return '<article class="gm-record-card"><small>'+esc(kicker)+'</small><h3>'+esc(title)+'</h3><p>'+esc(body)+'</p>'+(meta?'<div class="gm-record-meta">'+esc(meta)+'</div>':'')+'</article>';
}

let exploreOffset=0;
let sparkIndex=0;
function pickExplore(arr,count,offset=0){
  if(!arr?.length)return[];
  const out=[];
  for(let i=0;i<Math.min(count,arr.length);i++)out.push(arr[(i+offset)%arr.length]);
  return out;
}
function openNpcFromExplore(id){setView("people");renderNpcDetail(id);}
function openPlaceFromExplore(name){
  const idx=(WORLD.places||[]).findIndex(p=>p.name===name);
  setView("places");
  if(idx>=0)renderPlaceDetail(idx);
}

let brainHistory=[];
let brainFocus=null;
function allBrainRecords(){
  const records=[];
  NPC_DB.forEach(n=>records.push({key:"npc:"+n.id,type:"PERSON",title:n.name,subtitle:n.role||n.region||"",data:n}));
  (WORLD.places||[]).forEach(p=>records.push({key:"place:"+p.name,type:"PLACE",title:p.name,subtitle:p.kind||"",data:p}));
  (WORLD.factions||[]).forEach(x=>records.push({key:"faction:"+x.name,type:"FACTION",title:x.name,subtitle:"Faction",data:x}));
  (WORLD.secrets||[]).forEach(x=>records.push({key:"secret:"+x.name,type:"SECRET",title:x.name,subtitle:"GM truth",data:x}));
  return records;
}
function recordByKey(key){return allBrainRecords().find(r=>r.key===key)}
function brainConnections(rec){
  if(!rec)return[];
  const out=[];
  const add=r=>{if(r&&r.key!==rec.key&&!out.some(x=>x.key===r.key))out.push(r)};
  if(rec.type==="PERSON"){
    const n=rec.data;
    NPC_DB.forEach(other=>{
      if(other.id===n.id)return;
      const text=[n.relationships,n.faction,n.region,n.location].join(" ").toLowerCase();
      const sameFaction=n.faction&&other.faction===n.faction;
      const sameRegion=n.region&&other.region===n.region;
      const named=text.includes(other.name.toLowerCase())||text.includes(String(other.publicName||"").toLowerCase());
      if(named||sameFaction||sameRegion)add(recordByKey("npc:"+other.id));
    });
    (WORLD.places||[]).forEach(p=>{
      const hay=[n.region,n.location].join(" ").toLowerCase();
      if(hay.includes(p.name.toLowerCase())||p.name.toLowerCase().includes(String(n.region||"").toLowerCase()))add(recordByKey("place:"+p.name));
    });
    (WORLD.factions||[]).forEach(x=>{if(n.faction&&x.name.toLowerCase().includes(n.faction.toLowerCase())||String(n.faction||"").toLowerCase().includes(x.name.toLowerCase()))add(recordByKey("faction:"+x.name))});
  }else if(rec.type==="PLACE"){
    NPC_DB.filter(n=>placeNpcMatches(rec.data,n)).forEach(n=>add(recordByKey("npc:"+n.id)));
    (WORLD.factions||[]).forEach(x=>{
      const hay=[x.name,x.goal,x.assets,x.friction].join(" ").toLowerCase();
      if(hay.includes(rec.title.toLowerCase()))add(recordByKey("faction:"+x.name));
    });
  }else if(rec.type==="FACTION"){
    NPC_DB.forEach(n=>{if(String(n.faction||"").toLowerCase().includes(rec.title.toLowerCase())||rec.title.toLowerCase().includes(String(n.faction||"").toLowerCase()))add(recordByKey("npc:"+n.id))});
    (WORLD.places||[]).forEach(p=>{const hay=[rec.data.goal,rec.data.assets,rec.data.friction].join(" ").toLowerCase();if(hay.includes(p.name.toLowerCase()))add(recordByKey("place:"+p.name))});
  }else if(rec.type==="SECRET"){
    NPC_DB.forEach(n=>{const hay=[n.knows,n.relationships,n.canon].join(" ").toLowerCase();if(hay.includes(rec.title.toLowerCase().split(" ")[0]))add(recordByKey("npc:"+n.id))});
    (WORLD.places||[]).forEach(p=>{const hay=[rec.data.truth,rec.data.whoKnows].join(" ").toLowerCase();if(hay.includes(p.name.toLowerCase()))add(recordByKey("place:"+p.name))});
  }
  return out.slice(0,10);
}
function brainSummary(rec){
  if(rec.type==="PERSON")return rec.data.goals||rec.data.portrayal||rec.data.canon||"";
  if(rec.type==="PLACE")return rec.data.pressure||rec.data.summary||"";
  if(rec.type==="FACTION")return rec.data.goal||"";
  if(rec.type==="SECRET")return rec.data.truth||"";
  return"";
}
function openBrainRecord(rec){
  if(!rec)return;
  if(brainFocus&&brainFocus!==rec.key)brainHistory.push(brainFocus);
  brainFocus=rec.key;
  renderBrain();
}
function renderBrain(){
  if(!$("gmBrain"))return;
  const rec=recordByKey(brainFocus)||recordByKey("npc:strahd")||allBrainRecords()[0];
  if(!rec)return;
  brainFocus=rec.key;
  const links=brainConnections(rec);
  $("gmBrain").innerHTML=
    '<div class="gm-brain-focus"><small>'+esc(rec.type)+'</small><strong>'+esc(rec.title)+'</strong><p>'+esc(brainSummary(rec))+'</p><button id="brainOpenRecord">Open full record</button></div>'+
    '<div class="gm-brain-rings">'+links.map(r=>'<button class="gm-brain-node" data-brain-key="'+esc(r.key)+'"><small>'+esc(r.type)+'</small><strong>'+esc(r.title)+'</strong><span>'+esc(r.subtitle||"")+'</span></button>').join("")+'</div>';
  $("gmBrain").querySelectorAll("[data-brain-key]").forEach(b=>b.onclick=()=>openBrainRecord(recordByKey(b.dataset.brainKey)));
  $("brainOpenRecord").onclick=()=>{
    if(rec.type==="PERSON"){setView("people");renderNpcDetail(rec.data.id)}
    else if(rec.type==="PLACE"){openPlaceFromExplore(rec.data.name)}
    else setView("reference");
  };
}
function initBrain(){
  if(!$("brainChooser"))return;
  const records=allBrainRecords();
  $("brainChooser").addEventListener("input",()=>{
    const q=$("brainChooser").value.trim().toLowerCase();
    if(!q)return;
    const hit=records.find(r=>[r.title,r.subtitle,r.type].join(" ").toLowerCase().includes(q));
    if(hit)openBrainRecord(hit);
  });
  $("brainRandom").onclick=()=>openBrainRecord(records[Math.floor(Math.random()*records.length)]);
  $("brainBackBtn").onclick=()=>{const prev=brainHistory.pop();if(prev){brainFocus=prev;renderBrain()}};
  if(!brainFocus)brainFocus="npc:strahd";
  renderBrain();
}
function globalSearchHits(q){
  const query=q.trim().toLowerCase();if(!query)return[];
  return allBrainRecords().filter(r=>{
    const d=r.data||{};
    const hay=[r.title,r.subtitle,r.type,d.name,d.role,d.region,d.location,d.faction,d.goals,d.relationships,d.summary,d.pressure,d.goal,d.truth].join(" ").toLowerCase();
    return hay.includes(query);
  }).slice(0,12);
}
function openGlobalRecord(rec){
  if(rec.type==="PERSON"){setView("people");renderNpcDetail(rec.data.id)}
  else if(rec.type==="PLACE"){openPlaceFromExplore(rec.data.name)}
  else {setView("brain");openBrainRecord(rec)}
}
function initGlobalSearch(){
  if(!$("gmGlobalSearch"))return;
  const input=$("gmGlobalSearch"),host=$("gmGlobalResults");
  input.addEventListener("input",()=>{
    const hits=globalSearchHits(input.value);
    host.innerHTML=hits.map((r,i)=>'<button data-global-index="'+i+'"><small>'+esc(r.type)+'</small><strong>'+esc(r.title)+'</strong></button>').join("");
    host.classList.toggle("active",Boolean(input.value.trim()));
    host.querySelectorAll("[data-global-index]").forEach(b=>b.onclick=()=>{openGlobalRecord(hits[Number(b.dataset.globalIndex)]);input.value="";host.classList.remove("active")});
  });
  document.addEventListener("keydown",e=>{
    if(e.key!=="/"||e.ctrlKey||e.metaKey||e.altKey||/input|textarea|select/i.test(e.target.tagName))return;
    e.preventDefault();input.focus();input.select();
  });
}

function renderExplore(data=dashboardData||{}){
  if(!$("exploreTrail"))return;
  const campaign=data.campaign||{};
  const strahd=data.strahd||{};
  const clocks=data.clocks||[];
  const location=campaign.current_location||"Somewhere in Barovia";
  const locLower=location.toLowerCase();

  text("exploreNowLocation",location);
  if($("exploreRecordCount"))$("exploreRecordCount").textContent=allBrainRecords().length;
  if($("exploreConnectionCount"))$("exploreConnectionCount").textContent=allBrainRecords().reduce((n,r)=>n+brainConnections(r).length,0);
  if($("exploreClockCount"))$("exploreClockCount").textContent=clocks.length;
  text("exploreNowPressure",campaign.current_pressure||"Nothing is written as immediate pressure yet — which may mean something is being missed.");
  text("exploreNowStrahd",(strahd.overall_posture||"observe")+(strahd.active_target?" · "+strahd.active_target:""));
  text("exploreStrahdThought",strahd.current_interest||strahd.next_move||"What has caught his attention?");

  const nearby=NPC_DB.filter(n=>{
    const hay=[n.region,n.location].join(" ").toLowerCase();
    return locLower && (hay.includes(locLower)||locLower.includes(String(n.region||"").toLowerCase()));
  });
  const peoplePool=(nearby.length?nearby:NPC_DB).slice();
  const people=pickExplore(peoplePool,4,exploreOffset);
  $("explorePeople").innerHTML=people.map(n=>{
    const live=liveNpcFor(n)||{};
    return '<button class="gm-face-card" data-explore-npc="'+esc(n.id)+'"><small>'+esc(live.current_location||n.location||n.region||"BAROVIA")+'</small><strong>'+esc(n.name)+'</strong><p>'+esc(live.private_motive||n.goals||n.portrayal||"")+'</p><span>'+esc(live.disposition||n.role||"")+'</span></button>';
  }).join("");
  $("explorePeople").querySelectorAll("[data-explore-npc]").forEach(b=>b.onclick=()=>openNpcFromExplore(b.dataset.exploreNpc));

  const places=WORLD.places||[];
  const currentPlace=places.find(p=>locLower.includes(p.name.toLowerCase())||p.name.toLowerCase().includes(locLower));
  const placeChoices=pickExplore(currentPlace?[currentPlace,...places.filter(p=>p!==currentPlace)]:places,2,exploreOffset);
  const secrets=pickExplore(WORLD.secrets||[],1,exploreOffset);
  const factions=pickExplore(WORLD.factions||[],1,exploreOffset+1);

  const cards=[];
  if(people[0])cards.push({kind:"PERSON",title:people[0].name,body:people[0].goals||people[0].portrayal,action:"npc",id:people[0].id});
  if(placeChoices[0])cards.push({kind:"PLACE",title:placeChoices[0].name,body:placeChoices[0].pressure||placeChoices[0].summary,action:"place",id:placeChoices[0].name});
  if(secrets[0])cards.push({kind:"SECRET",title:secrets[0].name,body:secrets[0].truth,action:"reference"});
  if(factions[0])cards.push({kind:"FACTION",title:factions[0].name,body:factions[0].goal,action:"reference"});
  if(people[1])cards.push({kind:"PERSON",title:people[1].name,body:people[1].relationships||people[1].goals,action:"npc",id:people[1].id});

  $("exploreTrail").innerHTML=cards.map((x,i)=>'<button class="gm-thought-card gm-thought-'+i+'" data-thought-action="'+esc(x.action)+'" data-thought-id="'+esc(x.id||"")+'"><small>'+esc(x.kind)+'</small><strong>'+esc(x.title)+'</strong><p>'+esc(x.body||"")+'</p><span>Follow this →</span></button>').join("");
  $("exploreTrail").querySelectorAll("[data-thought-action]").forEach(b=>b.onclick=()=>{
    const a=b.dataset.thoughtAction,id=b.dataset.thoughtId;
    if(a==="npc")openNpcFromExplore(id);
    else if(a==="place")openPlaceFromExplore(id);
    else setView("reference");
  });

  $("exploreLooseEnds").innerHTML=clocks.length?clocks.slice(0,6).map(x=>'<button class="gm-loose-end" data-gm-view="threads"><div><small>'+esc(x.owner||"UNCLAIMED")+'</small><strong>'+esc(x.label)+'</strong></div><span>'+esc(x.current_step)+"/"+esc(x.max_step)+'</span></button>').join(""):'<div class="gm-empty-whisper">No clocks yet. That does not mean Barovia is still.</div>';
  $("exploreLooseEnds").querySelectorAll("[data-gm-view]").forEach(b=>b.onclick=()=>setView("threads"));

  const sparks=[];
  const p0=people[0],p1=people[1],pl=placeChoices[0],fac=factions[0],sec=secrets[0];
  if(p0)sparks.push("What happens if "+p0.name+" gets exactly what they want?");
  if(p0&&p1)sparks.push("What would make "+p0.name+" choose "+p1.name+" over the party?");
  if(pl)sparks.push("What changes in "+pl.name+" if the party does not return for a week?");
  if(fac)sparks.push("What visible move could "+fac.name+" make before anyone understands why?");
  if(sec)sparks.push("Who would be most dangerous if they learned the truth about "+sec.name+"?");
  sparks.push("What is Strahd allowing to happen because it currently interests him?");
  sparks.push("Which apparently minor NPC could become important if the players show them kindness?");
  window.__baroviaSparks=sparks;
  text("exploreSpark",sparks[sparkIndex%sparks.length]);
}

function initExplore(){
  if(!$("exploreSearch"))return;
  $("reshuffleExplore").onclick=()=>{exploreOffset++;renderExplore()};
  $("nextSpark").onclick=()=>{sparkIndex++;const s=window.__baroviaSparks||[];if(s.length)text("exploreSpark",s[sparkIndex%s.length])};
  $("exploreSearch").addEventListener("input",()=>{
    const q=$("exploreSearch").value.trim().toLowerCase();
    if(!q){$("exploreResults").classList.add("hidden");$("exploreResults").innerHTML="";return}
    const hits=[];
    NPC_DB.forEach(n=>{const hay=[n.name,n.role,n.region,n.location,n.faction,n.goals,n.relationships].join(" ").toLowerCase();if(hay.includes(q))hits.push({type:"PERSON",title:n.name,meta:n.role,id:n.id,action:"npc"})});
    (WORLD.places||[]).forEach(p=>{const hay=[p.name,p.kind,p.summary,p.pressure].join(" ").toLowerCase();if(hay.includes(q))hits.push({type:"PLACE",title:p.name,meta:p.kind,id:p.name,action:"place"})});
    (WORLD.secrets||[]).forEach(s=>{const hay=[s.name,s.truth,s.whoKnows].join(" ").toLowerCase();if(hay.includes(q))hits.push({type:"SECRET",title:s.name,meta:"GM truth",action:"reference"})});
    (WORLD.factions||[]).forEach(x=>{const hay=[x.name,x.goal,x.assets,x.friction].join(" ").toLowerCase();if(hay.includes(q))hits.push({type:"FACTION",title:x.name,meta:x.goal,action:"reference"})});
    const shown=hits.slice(0,10);
    $("exploreResults").innerHTML=shown.length?shown.map((x,i)=>'<button data-search-index="'+i+'"><small>'+esc(x.type)+'</small><strong>'+esc(x.title)+'</strong><span>'+esc(x.meta||"")+'</span></button>').join(""):'<div class="gm-empty-whisper">Nothing obvious. Try a name, place, faction or secret.</div>';
    $("exploreResults").classList.remove("hidden");
    $("exploreResults").querySelectorAll("[data-search-index]").forEach(b=>b.onclick=()=>{
      const x=shown[Number(b.dataset.searchIndex)];
      if(x.action==="npc")openNpcFromExplore(x.id);
      else if(x.action==="place")openPlaceFromExplore(x.id);
      else setView("reference");
      $("exploreResults").classList.add("hidden");
    });
  });
}

function renderWorldReference(){
  renderPlaces();
  if($("gmReferenceGrid")){
    const guides=SOURCE_LENSES.guides||{};
    const sourceCards=Object.entries(guides).map(([k,g])=>recordCard(g.title||g.label,g.label||k,g.description||"",g.url?"Source available from NPC comparison panels":"Campaign authority")).join("");
    const factionCards=(WORLD.factions||[]).map(x=>recordCard(x.name,"FACTION",x.goal,"Assets: "+x.assets+" · Friction: "+x.friction)).join("");
    const threatCards=(WORLD.threats||[]).map(x=>recordCard(x.name,x.type,x.note,"Function: "+x.function)).join("");
    const secretCards=(WORLD.secrets||[]).map(x=>recordCard(x.name,"GM TRUTH",x.truth,"Known by: "+x.whoKnows)).join("");
    const methodCards=(WORLD.reference||[]).map(x=>recordCard(x.name,"RUNNING THE GAME",x.body)).join("");
    $("gmReferenceGrid").innerHTML=sourceCards+methodCards+factionCards+threatCards+secretCards;
  }
}

let selectedPlace=null;
function placeNpcMatches(place,npc){
  const hay=[npc.region,npc.location].join(" ").toLowerCase();
  const name=String(place.name||"").toLowerCase();
  if(hay.includes(name))return true;
  if(name==="village of barovia"&&hay.includes("village of barovia"))return true;
  if(name==="krezk"&&hay.includes("abbey"))return false;
  return false;
}
function renderPlaces(){
  if(!$("gmPlaceGrid"))return;
  $("gmPlaceGrid").innerHTML=(WORLD.places||[]).map((p,i)=>{
    const count=NPC_DB.filter(n=>placeNpcMatches(p,n)).length;
    return '<button class="gm-place-row '+(selectedPlace===i?"active":"")+'" data-place-index="'+i+'"><div><small>'+esc(p.kind)+'</small><strong>'+esc(p.name)+'</strong><p>'+esc(p.pressure||"")+'</p></div><span>'+count+' people</span></button>';
  }).join("");
  $("gmPlaceGrid").querySelectorAll("[data-place-index]").forEach(b=>b.onclick=()=>renderPlaceDetail(Number(b.dataset.placeIndex)));
}
function renderPlaceDetail(index){
  selectedPlace=index;
  const p=(WORLD.places||[])[index];
  if(!p||!$("gmPlaceDetail"))return;
  const people=NPC_DB.filter(n=>placeNpcMatches(p,n));
  const livePeople=people.map(n=>{
    const live=liveNpcFor(n)||{};
    return '<button class="gm-place-person" data-place-npc="'+esc(n.id)+'"><div><strong>'+esc(n.name)+'</strong><small>'+esc(n.role)+'</small></div><span>'+esc(live.status||n.status||"")+'</span></button>';
  }).join("")||'<p class="gm-dim">No indexed NPCs are attached to this place yet.</p>';
  $("gmPlaceDetail").innerHTML=
    '<div class="gm-place-detail-head"><div><div class="eyebrow">'+esc(p.kind)+'</div><h3>'+esc(p.name)+'</h3></div><button id="placeToLive">Use at table</button></div>'+
    '<section class="gm-place-play"><small>WHAT MATTERS HERE</small><p>'+esc(p.pressure||"No current pressure recorded.")+'</p></section>'+
    '<section class="gm-place-play"><small>WHAT IT FEELS LIKE</small><p>'+esc(p.summary||"")+'</p></section>'+
    '<section class="gm-place-people"><small>PEOPLE ATTACHED TO THIS PLACE</small>'+livePeople+'</section>';
  $("gmPlaceDetail").querySelectorAll("[data-place-npc]").forEach(b=>b.onclick=()=>{setView("people");renderNpcDetail(b.dataset.placeNpc)});
  $("placeToLive").onclick=()=>setView("live");
  renderPlaces();
}


let dashboardData=null;

async function session(){
  const {data}=await supabase.auth.getSession();
  return data.session||null;
}

async function api(method="GET",body=null){
  const s=await session();
  if(!s)throw new Error("Not signed in");
  const res=await fetch(API_URL,{
    method,
    headers:{
      "Content-Type":"application/json",
      "Authorization":"Bearer "+s.access_token,
      "apikey":PUBLISHABLE_KEY
    },
    body:body?JSON.stringify(body):undefined
  });
  const json=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error(json.error||("Request failed: "+res.status));
  return json;
}

function text(id,value){$(id).textContent=value??"—"}
function value(id,v){$(id).value=v??""}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}

function item(title,meta,badge=""){
  return '<div class="gm-item"><div><small>'+esc(meta)+'</small><strong>'+esc(title)+'</strong></div>'+(badge?'<span class="gm-badge">'+esc(badge)+'</span>':'')+'</div>';
}

function render(data){
  dashboardData=data;
  if(typeof renderNpcDirectory==="function")renderNpcDirectory();
  renderExplore(data);
  const c=data.campaign||{};
  const s=data.strahd||{};
  const snap=data.snapshot||{};

  text("campaignStatus",(c.campaign_phase||"Unstated")+" · "+(c.current_location||"Unknown"));
  text("strahdStatus",(s.overall_posture||"observe")+(s.active_target?" · "+s.active_target:""));


  value("campaignLocation",c.current_location);
  value("campaignPressure",c.current_pressure);
  value("campaignPhase",c.campaign_phase);
  value("campaignNotes",c.gm_notes);

  value("strahdPosture",s.overall_posture||"observe");
  value("strahdTarget",s.active_target);
  value("strahdInterest",s.current_interest);
  value("strahdTest",s.current_test);
  value("strahdNext",s.next_move);
  value("strahdRestraint",s.restraint);

  $("attentionList").innerHTML=(data.attention||[]).map(x=>item(x.character_key,x.interest_reason||x.next_pressure||"No private note",x.stage)).join("")||item("No character attention yet","Create one below");
  $("npcList").innerHTML=(data.npcs||[]).map(x=>item(x.public_name||x.name,(x.current_location||"Unknown location")+(x.status?" · "+x.status:""),x.disposition||"")).join("")||item("No NPC states yet","Add one below");
  const clockHtml=(data.clocks||[]).map(x=>item(x.label,(x.owner||"No owner")+" · "+x.current_step+"/"+x.max_step,x.visibility)).join("")||item("No clocks yet","Add one below");
  $("clockList").innerHTML=clockHtml;
  if($("dashboardClockList"))$("dashboardClockList").innerHTML=clockHtml;
  if($("dashboardCampaignReadout"))$("dashboardCampaignReadout").innerHTML='<p><small>LOCATION</small><strong>'+esc(c.current_location||"Unknown")+'</strong></p><p><small>PRESSURE</small><strong>'+esc(c.current_pressure||"None recorded")+'</strong></p><p><small>PHASE</small><strong>'+esc(c.campaign_phase||"Unstated")+'</strong></p>';
  if($("dashboardNpcCount"))$("dashboardNpcCount").textContent=NPC_DB.length;
  if($("dashboardNpcSummary"))$("dashboardNpcSummary").textContent=NPC_DB.length+' people indexed across Barovia.';
  if($("dashboardStrahdSummary"))$("dashboardStrahdSummary").textContent=(s.overall_posture||"observe")+(s.active_target?" · target: "+s.active_target:"");
  if($("liveLocation"))$("liveLocation").textContent=c.current_location||"Unknown";
  if($("livePressure"))$("livePressure").textContent=c.current_pressure||"No immediate pressure recorded.";
  if($("livePhase"))$("livePhase").textContent=c.campaign_phase||"Unstated";
  if($("liveStrahd"))$("liveStrahd").textContent=(s.overall_posture||"observe")+(s.active_target?" · "+s.active_target:"");
  if($("liveClockList"))$("liveClockList").innerHTML=clockHtml;
  if($("liveNpcList")){
    const loc=String(c.current_location||"").toLowerCase();
    const nearby=NPC_DB.filter(n=>loc && ([n.region,n.location].join(" ").toLowerCase().includes(loc)||loc.includes(String(n.region||"").toLowerCase()))).slice(0,12);
    $("liveNpcList").innerHTML=(nearby.length?nearby:NPC_DB.slice(0,6)).map(n=>{
      const live=liveNpcFor(n)||{};
      return '<button class="gm-live-person" data-live-npc="'+esc(n.id)+'"><div><strong>'+esc(n.name)+'</strong><small>'+esc(n.role)+'</small></div><span>'+esc(live.disposition||live.status||n.status||"")+'</span></button>';
    }).join("");
    $("liveNpcList").querySelectorAll("[data-live-npc]").forEach(b=>b.onclick=()=>{setView("people");renderNpcDetail(b.dataset.liveNpc)});
  }

}

async function refresh(){
  const data=await api();
  render(data);
}

async function authState(){
  const s=await session();
  $("authPanel").classList.toggle("hidden",!!s);
  $("dashboard").classList.toggle("hidden",!s);
  $("signOutBtn").classList.toggle("hidden",!s);
  text("authStatus",s?s.user.email:"Not signed in");
  if(s){
    try{await refresh()}catch(e){$("authMessage").textContent=e.message;}
  }
}

$("signInBtn").onclick=async()=>{
  $("authMessage").textContent="";
  const {error}=await supabase.auth.signInWithPassword({email:$("emailInput").value.trim(),password:$("passwordInput").value});
  if(error){$("authMessage").textContent=error.message;return}
  await authState();
};

$("signUpBtn").onclick=async()=>{
  $("authMessage").textContent="";
  const {data,error}=await supabase.auth.signUp({email:$("emailInput").value.trim(),password:$("passwordInput").value,options:{emailRedirectTo:GM_RETURN_URL}});
  if(error){$("authMessage").textContent=error.message;return}
  $("authMessage").textContent=data.session?"GM login created.":"Check your email to confirm the new GM login, then return here and sign in.";
  if(data.session)await authState();
};

$("resendBtn").onclick=async()=>{
  $("authMessage").textContent="";
  const email=$("emailInput").value.trim();
  if(!email){$("authMessage").textContent="Enter your GM email first.";return}
  const {error}=await supabase.auth.resend({
    type:"signup",
    email,
    options:{emailRedirectTo:GM_RETURN_URL}
  });
  $("authMessage").textContent=error?error.message:"A new confirmation email has been sent. Use the newest link.";
};

$("signOutBtn").onclick=async()=>{await supabase.auth.signOut();await authState()};

$("saveCampaignBtn").onclick=async()=>{
  await api("POST",{action:"save_campaign",data:{
    current_location:$("campaignLocation").value,
    current_pressure:$("campaignPressure").value,
    campaign_phase:$("campaignPhase").value,
    gm_notes:$("campaignNotes").value
  }});
  await refresh();
};

$("saveStrahdBtn").onclick=async()=>{
  await api("POST",{action:"save_strahd",data:{
    overall_posture:$("strahdPosture").value,
    active_target:$("strahdTarget").value,
    current_interest:$("strahdInterest").value,
    current_test:$("strahdTest").value,
    next_move:$("strahdNext").value,
    restraint:$("strahdRestraint").value
  }});
  await refresh();
};

$("saveAttentionBtn").onclick=async()=>{
  await api("POST",{action:"upsert_attention",data:{
    character_key:$("attentionName").value,
    stage:$("attentionStage").value,
    interest_reason:$("attentionReason").value,
    next_pressure:$("attentionPressure").value,
    private_notes:$("attentionNotes").value
  }});
  ["attentionName","attentionReason","attentionPressure","attentionNotes"].forEach(id=>value(id,""));
  await refresh();
};

$("saveNpcBtn").onclick=async()=>{
  await api("POST",{action:"upsert_npc",data:{
    name:$("npcName").value,
    public_name:$("npcPublicName").value,
    current_location:$("npcLocation").value,
    status:$("npcStatus").value,
    disposition:$("npcDisposition").value,
    private_motive:$("npcMotive").value
  }});
  ["npcName","npcPublicName","npcLocation","npcStatus","npcDisposition","npcMotive"].forEach(id=>value(id,""));
  await refresh();
};

$("saveClockBtn").onclick=async()=>{
  await api("POST",{action:"upsert_clock",data:{
    label:$("clockLabel").value,
    owner:$("clockOwner").value,
    current_step:Number($("clockStep").value||0),
    max_step:Number($("clockMax").value||4),
    visibility:$("clockVisibility").value,
    public_hint:$("clockHint").value,
    advance_conditions:$("clockAdvance").value,
    consequence:$("clockConsequence").value
  }});
  ["clockLabel","clockOwner","clockHint","clockAdvance","clockConsequence"].forEach(id=>value(id,""));
  value("clockStep",0);value("clockMax",4);
  await refresh();
};

supabase.auth.onAuthStateChange(()=>setTimeout(authState,0));
authState();


// --- Searchable GM NPC reference database ---
const NPC_DB=window.BAROVIA_GM_NPCS||[];
let selectedNpcId=null;
const NPC_NOTE_KEY="barovia-gm-npc-notes-v1";

function npcNotes(){
  try{return JSON.parse(localStorage.getItem(NPC_NOTE_KEY)||"{}")}catch{return{}}
}
function saveNpcNotes(id,data){
  const all=npcNotes(); all[id]=data; localStorage.setItem(NPC_NOTE_KEY,JSON.stringify(all));
}
function liveNpcFor(npc){
  const rows=dashboardData?.npcs||[];
  const norm=s=>String(s||"").trim().toLowerCase();
  return rows.find(x=>norm(x.name)===norm(npc.name)||norm(x.public_name)===norm(npc.publicName));
}
function npcField(label,value){
  if(!value)return"";
  return '<section class="gm-npc-field"><h4>'+esc(label)+'</h4><p>'+esc(value)+'</p></section>';
}
function sourceLensHTML(npc){
  const guide=SOURCE_LENSES.guides||{};
  const notes=SOURCE_LENSES.npcs?.[npc.id]||{};
  const lens=(key,title,body,url="")=>{
    const content=body||"No specific notes added for this NPC yet.";
    const link=url?'<a href="'+esc(url)+'" target="_blank" rel="noopener">Open source</a>':"";
    return '<section class="gm-source-lens gm-source-'+esc(key)+'"><div class="gm-source-head"><span>'+esc(title)+'</span>'+link+'</div><p>'+esc(content)+'</p></section>';
  };
  return '<div class="gm-source-compare">'+
    lens("raw",guide.raw?.label||"RAW",npc.canon,guide.raw?.url)+
    lens("mandymod",guide.mandymod?.label||"MANDYMOD",notes.mandymod,guide.mandymod?.url)+
    lens("dragna",guide.dragna?.label||"DRAGNACARTA",notes.dragna,guide.dragna?.url)+
    lens("ours",guide.ours?.label||"OUR BAROVIA","The campaign-canon choice is recorded below. This is the version we actually run.")+
  '</div>';
}
function renderNpcDetail(id){
  selectedNpcId=id;
  const npc=NPC_DB.find(x=>x.id===id);
  if(!npc)return;
  const live=liveNpcFor(npc)||{};
  const notes=npcNotes()[id]||{};
  $("npcDbDetail").innerHTML=
    '<div class="gm-npc-detail-head"><div><div class="eyebrow">'+esc(npc.region||"BAROVIA")+'</div><h3>'+esc(npc.name)+'</h3><p>'+esc(npc.role||"")+'</p></div><span class="gm-badge">'+esc(live.status||npc.status||"Unknown")+'</span></div>'+
    '<div class="gm-npc-tags">'+(npc.tags||[]).map(t=>'<span>'+esc(t)+'</span>').join("")+'</div>'+
    '<div class="gm-npc-facts"><div><small>LOCATION</small><strong>'+esc(live.current_location||npc.location||"Unknown")+'</strong></div><div><small>FACTION</small><strong>'+esc(npc.faction||"None")+'</strong></div><div><small>DISPOSITION</small><strong>'+esc(live.disposition||"Unrecorded")+'</strong></div></div>'+
    '<section class="gm-at-table"><div class="eyebrow">AT THE TABLE</div>'+npcField("What they want now",live.private_motive||npc.goals)+npcField("How to play them",npc.portrayal)+npcField("What they know",npc.knows)+npcField("Relationships",npc.relationships)+npcField("Daggerheart use",npc.daggerheart)+'</section>'+
    '<section class="gm-npc-field gm-npc-live"><h4>Our Barovia — campaign canon</h4><textarea id="npcCampaignNotes" placeholder="What we have actually chosen for this campaign. Current plans, voice cues, promises, injuries, debts, changes from RAW or adopted expansion ideas...">'+esc(notes.notes||"")+'</textarea><div class="gm-npc-note-actions"><button id="saveNpcCampaignNotes">Save Our Barovia</button><span id="npcNoteSaved"></span></div></section>'+
    '<details class="gm-source-drawer"><summary>RAW / MandyMod / DragnaCarta ideas</summary>'+sourceLensHTML(npc)+'</details>';
  $("saveNpcCampaignNotes").onclick=()=>{
    saveNpcNotes(id,{notes:$("npcCampaignNotes").value,updatedAt:new Date().toISOString()});
    $("npcNoteSaved").textContent="Saved";
    setTimeout(()=>{if($("npcNoteSaved"))$("npcNoteSaved").textContent=""},1200);
  };
  renderNpcDirectory();
}
function renderNpcDirectory(){
  if(!$("npcDbList"))return;
  const q=($("npcDbSearch").value||"").trim().toLowerCase();
  const region=$("npcDbRegion").value;
  const status=$("npcDbStatus").value;
  const filtered=NPC_DB.filter(npc=>{
    const live=liveNpcFor(npc)||{};
    const actualStatus=live.status||npc.status||"";
    const hay=[npc.name,npc.publicName,npc.location,npc.region,npc.role,npc.faction,npc.canon,...(npc.tags||[])].join(" ").toLowerCase();
    return (!q||hay.includes(q))&&(!region||npc.region===region)&&(!status||actualStatus===status);
  }).sort((a,b)=>a.name.localeCompare(b.name));
  $("npcDbCount").textContent=filtered.length+" / "+NPC_DB.length+" NPCs";
  if($("npcDbCountTop"))$("npcDbCountTop").textContent=NPC_DB.length;
  $("npcDbList").innerHTML=filtered.map(npc=>{
    const live=liveNpcFor(npc)||{};
    return '<button class="gm-npc-row '+(selectedNpcId===npc.id?"active":"")+'" data-npc-id="'+esc(npc.id)+'"><div><strong>'+esc(npc.name)+'</strong><small>'+esc(npc.role)+' · '+esc(live.current_location||npc.location)+'</small></div><span>'+esc(live.status||npc.status||"")+'</span></button>';
  }).join("")||'<div class="gm-npc-empty"><p>No NPCs match those filters.</p></div>';
  $("npcDbList").querySelectorAll("[data-npc-id]").forEach(b=>b.onclick=()=>renderNpcDetail(b.dataset.npcId));
}
function initNpcDatabase(){
  if(!$("npcDbList"))return;
  const regions=[...new Set(NPC_DB.map(x=>x.region).filter(Boolean))].sort();
  const statuses=[...new Set(NPC_DB.map(x=>x.status).filter(Boolean))].sort();
  $("npcDbRegion").innerHTML='<option value="">All locations</option>'+regions.map(x=>'<option>'+esc(x)+'</option>').join("");
  $("npcDbStatus").innerHTML='<option value="">All statuses</option>'+statuses.map(x=>'<option>'+esc(x)+'</option>').join("");
  $("npcDbSearch").addEventListener("input",renderNpcDirectory);
  $("npcDbRegion").addEventListener("change",renderNpcDirectory);
  $("npcDbStatus").addEventListener("change",renderNpcDirectory);
  $("npcDbClear").onclick=()=>{value("npcDbSearch","");value("npcDbRegion","");value("npcDbStatus","");renderNpcDirectory()};
  renderNpcDirectory();
}
const LOCAL_WORK_KEY="barovia-gm-working-v1";
function loadWorking(){
  try{return JSON.parse(localStorage.getItem(LOCAL_WORK_KEY)||"{}")}catch{return{}}
}
function saveWorking(next){
  const data={...loadWorking(),...next};
  localStorage.setItem(LOCAL_WORK_KEY,JSON.stringify(data));
}
function initWorkingTools(){
  const data=loadWorking();
  if($("liveNotes"))$("liveNotes").value=data.liveNotes||"";
  ["prepOpening","prepPeople","prepPressure","prepDiscoveries"].forEach(id=>{if($(id))$(id).value=data[id]||""});
  if($("saveLiveNotes"))$("saveLiveNotes").onclick=()=>{
    saveWorking({liveNotes:$("liveNotes").value});
    $("liveNoteSaved").textContent="Saved";
    setTimeout(()=>{if($("liveNoteSaved"))$("liveNoteSaved").textContent=""},1200);
  };
  if($("clearLiveNotes"))$("clearLiveNotes").onclick=()=>{$("liveNotes").value="";saveWorking({liveNotes:""})};
  if($("savePrep"))$("savePrep").onclick=()=>{
    const next={};["prepOpening","prepPeople","prepPressure","prepDiscoveries"].forEach(id=>next[id]=$(id).value);
    saveWorking(next);$("prepSaved").textContent="Saved";
    setTimeout(()=>{if($("prepSaved"))$("prepSaved").textContent=""},1200);
  };
}

initNpcDatabase();
renderWorldReference();
bindViewNavigation();
initWorkingTools();
initExplore();
initBrain();
initGlobalSearch();
renderExplore();
