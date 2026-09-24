window.BAROVIA_STATE = {
  currentLocation: "At the edge of the known road",
  currentPressure: "The mists do not behave like weather",
  campaignState: "Arrival — the valley is still mostly unknown"
};

window.BAROVIA_THREADS = [
  {
    id:"mist",
    title:"The Mists",
    type:"Mystery",
    text:"The road behind no longer behaves like an ordinary road. The party can test the boundary, seek explanations, or push deeper into the valley.",
    status:"Open"
  },
  {
    id:"village",
    title:"The Village Ahead",
    type:"Opportunity",
    text:"There are signs of habitation deeper along the road. Reaching people may mean shelter and answers, but also entering someone else's troubles.",
    status:"Open"
  },
  {
    id:"castle",
    title:"The Castle Above the Valley",
    type:"Omen",
    text:"A distant fortress dominates the landscape. The party knows almost nothing about it yet, except that its presence shapes the valley below.",
    status:"Known, unresolved"
  }
];

window.BAROVIA_DISCOVERIES = [
  {
    record:"Barovia",
    kind:"World",
    title:"A Valley Behind the Mists",
    text:"The party has crossed into a land that feels geographically and supernaturally enclosed."
  },
  {
    record:"The Mists",
    kind:"Phenomenon",
    title:"The Mists Do Not Behave Normally",
    text:"Visibility, direction and distance cannot be trusted in the same way as ordinary weather."
  },
  {
    record:"Castle Ravenloft",
    kind:"Location",
    title:"A Castle Watches the Valley",
    text:"A great fortress is visible from far below, but nothing about its master has yet been established."
  }
];

window.BAROVIA_DATA = {
  "Welcome to Barovia":{
    title:"Welcome to Barovia",
    category:"Start",
    html:"<p>This is the spoiler-conscious player record for the campaign.</p><h2>What belongs here</h2><ul><li>Things the party has seen, learned or been told.</li><li>Personal knowledge legitimately available to the viewing character.</li><li>Known people, places, threats, objects, rumours and unresolved situations.</li></ul><h2>What does not belong here</h2><ul><li>Unrevealed motives.</li><li>Future events.</li><li>Secret GM truths.</li><li>Material from the adventure simply because it exists in the source book.</li></ul><p>The guide grows through play.</p>"
  },
  "Barovia":{
    title:"Barovia",
    category:"World",
    html:"<p>A mist-bound valley of old roads, dark forests, scattered settlements and looming mountains. The party does not yet know the valley's true boundaries or history.</p><p>For the player guide, Barovia is treated as a living place rather than a sequence of adventure chapters. Locations appear when the characters learn enough to meaningfully know they exist.</p>"
  },
  "The Mists":{
    title:"The Mists",
    category:"Phenomena",
    html:"<p>The mists around the valley do not behave like normal weather. They can obscure routes and make direction difficult to trust.</p><p>The party does not yet know whether they are a natural feature, a magical barrier, an intelligent force or something else.</p>"
  },
  "Castle Ravenloft":{
    title:"Castle Ravenloft",
    category:"Locations",
    html:"<p>A vast castle dominates the valley from a distant height. It is visible before the party understands anything useful about who lives there or what the place means.</p><p>Its presence is knowledge. Its secrets are not.</p>"
  },
  "Known Places":{
    title:"Known Places",
    category:"Locations",
    html:"<p>Only locations the characters have reached, seen, been told about or otherwise genuinely learned appear in this record.</p><p>Unknown sites remain absent rather than appearing as locked chapter names.</p>"
  },
  "Known People":{
    title:"Known People",
    category:"People",
    html:"<p>This record will grow as the party meets people, hears names and develops opinions. Public identity, visible behaviour and things actually learned belong here; hidden motives do not.</p>"
  },
  "Known Threats":{
    title:"Known Threats",
    category:"Threats",
    html:"<p>Barovia's dangers are recorded according to what the party has experienced. A creature entry should describe what it does in play, what the characters have learned about it and what remains uncertain.</p>"
  },
  "Campaign Journal":{
    title:"Campaign Journal",
    category:"Sessions",
    html:"<p>Short player-safe summaries will record what actually happened in play. The journal is not a transcript and does not expose behind-the-screen reasoning.</p>"
  },
  "Daggerheart in Barovia":{
    title:"Daggerheart in Barovia",
    category:"Rules",
    html:"<p>Daggerheart provides the rules engine for this campaign. Barovia supplies the campaign frame, places, people, threats and dramatic situations.</p><h2>Conversion principle</h2><p>Enemies are converted by dramatic function rather than by copying another game's statistics. A hunter should hunt. A swarm should overwhelm. A manipulator should alter the scene. A recurring enemy should create pressure beyond a single combat.</p><h2>Player agency</h2><p>Uncertain actions should still be resolved through clear stakes, meaningful consequences and spotlight-driven play. The campaign should reward clever avoidance, negotiation, preparation and retreat as readily as direct confrontation.</p>"
  },
  "What Could Happen Next":{
    title:"What Could Happen Next",
    category:"Threads",
    html:"<p>This is the living list of situations the characters currently know they could pursue. Nothing here is mandatory.</p><p>Threads can change, disappear or worsen when ignored because other people and forces in Barovia continue acting.</p>"
  }
};

window.BAROVIA_CATEGORIES = {
  "Start":["Welcome to Barovia"],
  "World":["Barovia"],
  "Threads":["What Could Happen Next"],
  "Locations":["Known Places","Castle Ravenloft"],
  "People":["Known People"],
  "Threats":["Known Threats"],
  "Phenomena":["The Mists"],
  "Rules":["Daggerheart in Barovia"],
  "Sessions":["Campaign Journal"]
};

window.BAROVIA_EDGES = [
  ["Barovia","The Mists"],
  ["Barovia","Known Places"],
  ["Barovia","Known People"],
  ["Barovia","Known Threats"],
  ["Barovia","Castle Ravenloft"],
  ["Barovia","What Could Happen Next"],
  ["Castle Ravenloft","Known Places"],
  ["The Mists","What Could Happen Next"],
  ["Daggerheart in Barovia","Barovia"],
  ["Campaign Journal","Barovia"]
];