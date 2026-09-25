import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const SUPABASE_URL="https://dosdtvaeoeymlmnesoht.supabase.co";
const PUBLISHABLE_KEY=window.BAROVIA_PUBLIC_FEED_KEY;
const API_URL=SUPABASE_URL+"/functions/v1/barovia-gm-api";
const GM_RETURN_URL="https://potmoodle-debug.github.io/barovia-daggerheart/gm.html";
const supabase=createClient(SUPABASE_URL,PUBLISHABLE_KEY);

const $=id=>document.getElementById(id);
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
  const c=data.campaign||{};
  const s=data.strahd||{};
  const snap=data.snapshot||{};

  text("campaignStatus",(c.campaign_phase||"Unstated")+" · "+(c.current_location||"Unknown"));
  text("strahdStatus",(s.overall_posture||"observe")+(s.active_target?" · "+s.active_target:""));
  text("snapshotStatus","Revision "+(snap.revision??0));

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
  $("clockList").innerHTML=(data.clocks||[]).map(x=>item(x.label,(x.owner||"No owner")+" · "+x.current_step+"/"+x.max_step,x.visibility)).join("")||item("No clocks yet","Add one below");
  $("revelationList").innerHTML=(data.revelations||[]).slice(0,12).map(x=>item(x.subject,x.kind,x.status)).join("")||item("No queued revelations","Approved player-safe changes appear here");
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

$("queueRevelationBtn").onclick=async()=>{
  let payload={};
  try{payload=JSON.parse($("revelationJson").value||"{}")}catch{alert("Player-safe payload must be valid JSON.");return}
  await api("POST",{action:"queue_revelation",data:{
    kind:$("revelationKind").value,
    subject:$("revelationSubject").value,
    player_safe_payload:payload
  }});
  value("revelationSubject","");value("revelationJson","");
  await refresh();
};

$("publishBtn").onclick=async()=>{
  if(!confirm("Publish all approved player-safe revelations and the current campaign summary?"))return;
  $("publishMessage").textContent="Publishing…";
  try{
    const result=await api("POST",{action:"publish",data:{state:{
      currentLocation:$("campaignLocation").value,
      currentPressure:$("campaignPressure").value,
      campaignState:$("campaignPhase").value
    }}});
    $("publishMessage").textContent="Published revision "+result.revision+" · "+result.published+" approved revelation(s).";
    await refresh();
  }catch(e){$("publishMessage").textContent=e.message}
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
    npcField("Canon reference",npc.canon)+npcField("Portrayal",npc.portrayal)+npcField("Goals",live.private_motive||npc.goals)+npcField("What they know",npc.knows)+npcField("Relationships",npc.relationships)+npcField("Daggerheart use",npc.daggerheart)+
    '<section class="gm-npc-field gm-npc-live"><h4>Our campaign — private notes</h4><textarea id="npcCampaignNotes" placeholder="Changes from canon, secrets established in play, voice cues, promises, injuries, debts, current plans...">'+esc(notes.notes||"")+'</textarea><div class="gm-npc-note-actions"><button id="saveNpcCampaignNotes">Save private notes</button><span id="npcNoteSaved"></span></div></section>';
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
initNpcDatabase();
