(() => {
const STORAGE_KEY='barovia-daggerheart-character-v1';
const DEFAULT_CHARACTER={
 name:'Unnamed traveller',pronouns:'',heritage:'',className:'',subclass:'',level:1,evasion:0,armorScore:0,
 hp:{current:6,max:6},stress:{current:0,max:6},hope:{current:2,max:6},armor:{current:0,max:0},
 thresholds:{major:0,severe:0},
 traits:{Agility:0,Strength:0,Finesse:0,Instinct:0,Presence:0,Knowledge:0},
 experiences:[{name:'',value:2},{name:'',value:2}],notes:''
};
function clone(v){return JSON.parse(JSON.stringify(v));}
function merge(base,extra){if(!extra||typeof extra!=='object')return base;Object.keys(base).forEach(k=>{if(extra[k]===undefined)return;if(base[k]&&typeof base[k]==='object'&&!Array.isArray(base[k]))base[k]=merge(base[k],extra[k]);else base[k]=extra[k];});return base;}
function load(){try{const raw=localStorage.getItem(STORAGE_KEY);return raw?merge(clone(DEFAULT_CHARACTER),JSON.parse(raw)):clone(DEFAULT_CHARACTER);}catch(e){return clone(DEFAULT_CHARACTER);}}
let state=load();
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));const h=document.getElementById('characterHeading');if(h)h.textContent=state.name||'Character';}
function clamp(n,min,max){return Math.max(min,Math.min(max,Number(n)||0));}
function resourceCard(key,label){const r=state[key];return '<div class="resource-card"><div class="resource-head"><strong>'+label+'</strong><span class="resource-value">'+r.current+'/'+r.max+'</span></div><label class="character-small-label">Maximum</label><input class="resource-max-input" type="number" min="0" data-resource-max="'+key+'" value="'+r.max+'"><div class="resource-buttons"><button type="button" data-resource="'+key+'" data-delta="-1"'+(r.current<=0?' disabled':'')+'>−1</button><button type="button" data-resource="'+key+'" data-delta="1"'+(r.current>=r.max?' disabled':'')+'>+1</button></div></div>';}
function render(){
 const root=document.getElementById('characterApp');if(!root)return;
 let traitCards='';Object.entries(state.traits).forEach(([name,value])=>{traitCards+='<div class="trait-card"><strong>'+name+'</strong><div class="trait-controls"><input type="number" min="-5" max="10" data-trait="'+name+'" value="'+value+'"><button type="button" data-roll-trait="'+name+'">Roll</button></div></div>';});
 let exps='';state.experiences.forEach((e,i)=>{exps+='<div class="experience-row"><input data-experience-name="'+i+'" placeholder="Experience" value="'+esc(e.name)+'"><input data-experience-value="'+i+'" type="number" value="'+(Number(e.value)||0)+'"><button type="button" data-remove-experience="'+i+'">Remove</button></div>';});
 let options='';Object.keys(state.traits).forEach(t=>{options+='<option value="'+t+'">'+t+'</option>';});
 root.innerHTML='<div class="character-shell"><div><section class="character-panel">'+
 '<h2>Character</h2><div class="character-identity">'+
 '<div class="character-field"><label>Name</label><input data-field="name" value="'+esc(state.name)+'"></div>'+
 '<div class="character-field"><label>Level</label><input data-field="level" type="number" min="1" max="10" value="'+state.level+'"></div>'+
 '<div class="character-field"><label>Pronouns</label><input data-field="pronouns" value="'+esc(state.pronouns)+'"></div>'+
 '<div class="character-field"><label>Heritage</label><input data-field="heritage" value="'+esc(state.heritage)+'"></div>'+
 '<div class="character-field"><label>Class</label><input data-field="className" value="'+esc(state.className)+'"></div>'+
 '<div class="character-field"><label>Subclass</label><input data-field="subclass" value="'+esc(state.subclass)+'"></div></div>'+
 '<h3>Traits</h3><div class="trait-grid">'+traitCards+'</div>'+
 '<h3>Core resources</h3><div class="resource-grid">'+resourceCard('hp','HP')+resourceCard('stress','Stress')+resourceCard('hope','Hope')+resourceCard('armor','Armour')+'</div>'+
 '<h3>Defence & damage</h3><div class="character-identity"><div class="character-field"><label>Evasion</label><input data-field="evasion" type="number" value="'+state.evasion+'"></div><div class="character-field"><label>Armour Score</label><input data-field="armorScore" type="number" value="'+state.armorScore+'"></div></div>'+
 '<div class="threshold-grid"><div class="character-field"><label>Major threshold</label><input data-threshold="major" type="number" value="'+state.thresholds.major+'"></div><div class="character-field"><label>Severe threshold</label><input data-threshold="severe" type="number" value="'+state.thresholds.severe+'"></div></div>'+
 '<h3>Experiences</h3><div class="experience-list">'+exps+'</div><button type="button" class="dh-btn add-experience" id="addExperienceBtn">Add Experience</button>'+
 '<h3>Notes</h3><div class="character-field"><textarea data-field="notes" placeholder="Equipment, abilities, conditions, personal notes…">'+esc(state.notes)+'</textarea></div><div class="save-note">This sheet is saved only in this browser. No character data is sent to the public repository.</div>'+
 '</section></div><aside class="character-panel roll-panel"><h2>Duality Dice</h2><div id="rollResult" class="roll-result"><div class="eyebrow">READY</div><p>Choose a trait or make a custom roll.</p></div>'+
 '<div class="roll-controls"><label class="character-small-label">Trait</label><select id="rollTrait">'+options+'</select><label class="character-small-label">Extra modifier</label><input id="rollModifier" type="number" value="0"><button id="rollBtn" type="button">Roll Hope + Fear</button></div>'+
 '<div class="quick-actions"><button type="button" data-quick="hope">Gain Hope</button><button type="button" data-quick="stress">Mark Stress</button><button type="button" data-quick="hp">Mark HP</button><button type="button" data-quick="armor">Use Armour</button></div></aside></div>';
 wire();save();
}
function wire(){
 document.querySelectorAll('[data-field]').forEach(el=>el.addEventListener('input',()=>{const k=el.dataset.field;state[k]=el.type==='number'?Number(el.value):el.value;save();}));
 document.querySelectorAll('[data-trait]').forEach(el=>el.addEventListener('input',()=>{state.traits[el.dataset.trait]=Number(el.value)||0;save();}));
 document.querySelectorAll('[data-threshold]').forEach(el=>el.addEventListener('input',()=>{state.thresholds[el.dataset.threshold]=Number(el.value)||0;save();}));
 document.querySelectorAll('[data-resource]').forEach(btn=>btn.addEventListener('click',()=>{const k=btn.dataset.resource;state[k].current=clamp(state[k].current+Number(btn.dataset.delta),0,state[k].max);render();}));
 document.querySelectorAll('[data-resource-max]').forEach(el=>el.addEventListener('change',()=>{const k=el.dataset.resourceMax;state[k].max=Math.max(0,Number(el.value)||0);state[k].current=clamp(state[k].current,0,state[k].max);render();}));
 document.querySelectorAll('[data-experience-name]').forEach(el=>el.addEventListener('input',()=>{state.experiences[Number(el.dataset.experienceName)].name=el.value;save();}));
 document.querySelectorAll('[data-experience-value]').forEach(el=>el.addEventListener('input',()=>{state.experiences[Number(el.dataset.experienceValue)].value=Number(el.value)||0;save();}));
 document.querySelectorAll('[data-remove-experience]').forEach(btn=>btn.addEventListener('click',()=>{state.experiences.splice(Number(btn.dataset.removeExperience),1);render();}));
 document.querySelectorAll('[data-roll-trait]').forEach(btn=>btn.addEventListener('click',()=>roll(btn.dataset.rollTrait,0)));
 document.querySelectorAll('[data-quick]').forEach(btn=>btn.addEventListener('click',()=>{const k=btn.dataset.quick;const delta=k==='hope'?1:k==='armor'?-1:1;state[k].current=clamp(state[k].current+delta,0,state[k].max);render();}));
 const add=document.getElementById('addExperienceBtn');if(add)add.addEventListener('click',()=>{state.experiences.push({name:'',value:2});render();});
 const rollBtn=document.getElementById('rollBtn');if(rollBtn)rollBtn.addEventListener('click',()=>roll(document.getElementById('rollTrait').value,Number(document.getElementById('rollModifier').value)||0));
}
function roll(trait,extra){const hope=1+Math.floor(Math.random()*12);const fear=1+Math.floor(Math.random()*12);const tm=Number(state.traits[trait])||0;const total=hope+fear+tm+extra;const mode=hope===fear?'Critical':hope>fear?'With Hope':'With Fear';const root=document.getElementById('rollResult');root.innerHTML='<div class="eyebrow">'+esc(trait.toUpperCase())+'</div><div class="roll-dice"><div class="die"><small>Hope</small><strong>'+hope+'</strong></div><div class="die"><small>Fear</small><strong>'+fear+'</strong></div></div><div class="roll-total">Total '+total+'</div><div class="roll-outcome">'+mode+'</div><p>'+trait+' '+(tm>=0?'+':'')+tm+(extra?' · extra '+(extra>=0?'+':'')+extra:'')+'</p>';}
function show(){render();const h=document.getElementById('characterHeading');if(h)h.textContent=state.name||'Character';}
function reset(){if(!confirm("Reset this browser's Barovia character sheet?"))return;state=clone(DEFAULT_CHARACTER);save();render();}
window.BAROVIA_CHARACTER={show:show,reset:reset,getState:()=>clone(state)};
document.getElementById('resetCharacterBtn')?.addEventListener('click',reset);
})();