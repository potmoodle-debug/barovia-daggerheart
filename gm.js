import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const SUPABASE_URL="https://dosdtvaeoeymlmnesoht.supabase.co";
const PUBLISHABLE_KEY=window.BAROVIA_PUBLIC_FEED_KEY;
const API_URL=SUPABASE_URL+"/functions/v1/barovia-gm-api";
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
  const {data,error}=await supabase.auth.signUp({email:$("emailInput").value.trim(),password:$("passwordInput").value});
  if(error){$("authMessage").textContent=error.message;return}
  $("authMessage").textContent=data.session?"GM login created.":"Check your email to confirm the new GM login, then return here and sign in.";
  if(data.session)await authState();
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
