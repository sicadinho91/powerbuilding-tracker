
"use strict";
const VERSION="3.0.0";
const KEY="powerbuildingTrackerV1";
const DRAFT="powerbuildingTrackerDraftV2";

const defaults=[
{id:"day1",label:"Day 1",name:"Squat + Legs",mainLift:"5/3/1 Squat day",exercises:[
x("main-squat","5/3/1 Squat",3,1,5,null,5,"reps","lb","Enter the prescribed 5/3/1 work sets.",true),
x("paused-squat","Paused Squat",3,5,5,225,5,"reps","lb"),
x("rdl","Romanian Deadlift",3,8,8,185,5,"reps","lb"),
x("hip-abductor","Hip Abductor Machine",4,15,20,100,10,"reps","lb","Push knees outward."),
x("leg-extension","Leg Extension",3,15,15,110,10,"reps","lb"),
x("lying-ham-curl","Lying Hamstring Curl",3,15,15,70,5,"reps","lb"),
x("standing-calf","Standing Calf Raise",4,12,15,180,10,"reps","lb")]},
{id:"day2",label:"Day 2",name:"Bench + Chest / Shoulders",mainLift:"5/3/1 Bench day",exercises:[
x("main-bench","5/3/1 Bench Press",3,1,5,null,5,"reps","lb","Enter the prescribed 5/3/1 work sets.",true),
x("close-grip-bench","Close-Grip Bench",3,8,8,185,5,"reps","lb"),
x("db-incline","DB Incline Press",3,10,10,60,5,"reps","lb/DB"),
x("db-lateral","DB Lateral Raise",4,12,15,12.5,2.5,"reps","lb/DB"),
x("face-pull","Face Pull",4,20,20,50,5,"reps","lb"),
x("rope-pushdown","Rope Pushdown",3,15,15,55,5,"reps","lb"),
x("weighted-dips","Weighted Dips",3,8,8,0,5,"reps","+lb","Zero means bodyweight.")]},
{id:"day3",label:"Day 3",name:"Core",mainLift:"Dedicated core day",exercises:[
x("hanging-leg-raise","Hanging Leg Raise",4,10,12,0,0,"reps","optional lb"),
x("ab-wheel","Ab Wheel",4,8,12,0,0,"reps","optional lb"),
x("cable-crunch","Cable Crunch",4,12,15,null,5,"reps","lb"),
x("weighted-plank","Weighted Plank",3,30,60,null,5,"sec","lb"),
x("farmer-carry","Farmer Carry",4,30,40,null,5,"yd","lb/hand")]},
{id:"day4",label:"Day 4",name:"Deadlift + Back",mainLift:"5/3/1 Deadlift day",exercises:[
x("main-deadlift","5/3/1 Deadlift",3,1,5,null,5,"reps","lb","Enter the prescribed 5/3/1 work sets.",true),
x("barbell-row","Barbell Row",4,8,8,165,5,"reps","lb"),
x("weighted-pullup","Weighted Pull-Up",4,6,6,0,5,"reps","+lb"),
x("chest-supported-row","Chest-Supported DB Row",3,12,12,70,5,"reps","lb/DB"),
x("lat-pulldown","Lat Pulldown",3,12,12,140,5,"reps","lb"),
x("smith-shrug","Smith Shrug",5,12,12,270,10,"reps","logged lb"),
x("rear-delt-fly","Rear Delt Fly",4,15,15,20,2.5,"reps","lb/DB"),
x("hammer-curl","Hammer Curl",3,12,12,35,2.5,"reps","lb/DB"),
x("ez-curl","EZ-Bar Curl",3,12,12,70,5,"reps","lb")]},
{id:"day5",label:"Day 5",name:"Incline + Upper Hypertrophy",mainLift:"5/3/1 Incline Press day",exercises:[
x("main-incline","5/3/1 Incline Press",3,1,5,null,5,"reps","lb","Enter the prescribed 5/3/1 work sets.",true),
x("db-shoulder-press","Seated DB Shoulder Press",4,8,8,60,5,"reps","lb/DB"),
x("machine-chest-press","Machine Chest Press",3,12,12,160,10,"reps","lb"),
x("cable-lateral","Cable Lateral Raise",4,15,20,15,2.5,"reps","lb"),
x("pec-deck","Pec Deck",3,15,15,130,10,"reps","lb"),
x("ez-upright-row","EZ-Bar Upright Row",3,12,12,60,5,"reps","lb"),
x("reverse-pec-deck","Reverse Pec Deck",4,15,15,90,10,"reps","lb"),
x("overhead-rope","Overhead Rope Extension",3,15,15,45,5,"reps","lb"),
x("preacher-curl","Preacher Curl",3,12,12,60,5,"reps","lb")]}
];

function x(id,name,sets,min,max,next,inc,metric="reps",unit="lb",note="",mainLift=false){return{id,name,sets,min,max,nextWeight:next,increment:inc,metric,weightUnit:unit,note,mainLift}}
const clone=v=>JSON.parse(JSON.stringify(v));
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const attr=esc;
const num=v=>{const n=parseFloat(v);return Number.isFinite(n)?n:NaN};
const id=()=>crypto.randomUUID?.()||`${Date.now()}-${Math.random()}`;

let store=load(), active=loadDraft(), view="today", timer={seconds:0,running:false,handle:null};

function load(){
  try{
    const p=JSON.parse(localStorage.getItem(KEY)||"null");
    if(!p)return{version:VERSION,routines:clone(defaults),sessions:[]};
    p.version=VERSION;
    if(!Array.isArray(p.routines)||!Array.isArray(p.sessions))throw 0;
    p.routines.forEach((r,i)=>{
      const mainMap={day1:{id:"main-squat",name:"5/3/1 Squat"},day2:{id:"main-bench",name:"5/3/1 Bench Press"},day4:{id:"main-deadlift",name:"5/3/1 Deadlift"},day5:{id:"main-incline",name:"5/3/1 Incline Press"}};
      const main=mainMap[r.id];
      if(main && !(r.exercises||[]).some(e=>e.mainLift||e.id===main.id)){r.exercises.unshift(x(main.id,main.name,3,1,5,null,5,"reps","lb","Enter the prescribed 5/3/1 work sets.",true));}
      r.id=r.id||id();r.label=r.label||`Day ${i+1}`;r.name=r.name||"Workout";r.mainLift=r.mainLift||"";
      r.exercises=(r.exercises||[]).map(e=>({...x(id(),"Exercise",3,8,12,null,5),...e,id:e.id||e.exerciseId||id()}));
    });
    return p;
  }catch{return{version:VERSION,routines:clone(defaults),sessions:[]}}
}
function save(){localStorage.setItem(KEY,JSON.stringify(store))}
function loadDraft(){try{return JSON.parse(localStorage.getItem(DRAFT)||"null")}catch{return null}}
function saveDraft(){active?localStorage.setItem(DRAFT,JSON.stringify(active)):localStorage.removeItem(DRAFT)}

function shell(){
  $("#app").innerHTML=`<div class="app">
    <header class="topbar"><div class="brand"><div class="logo">P</div><div><h1>Powerbuilding</h1><p>Accessories + core</p></div></div><button class="icon-btn" id="menuBtn">⋯</button></header>
    <main id="main" class="page-enter"></main>
    <nav class="bottom-nav">
      ${nav("today","◉","Workout")}${nav("history","≡","History")}${nav("progress","⌁","Progress")}${nav("routine","⚙","Routine")}
    </nav>
  </div>
  ${modals()}`;
  bindShell();render();
}
function nav(v,icon,label){return`<button class="nav ${view===v?"active":""}" data-view="${v}"><span>${icon}</span>${label}</button>`}
function modals(){return`
<div class="modal" id="menuModal"><div class="modal-card"><h2>Settings & backup</h2><p>Your workout data is saved automatically on this device. Export a backup before clearing website data or changing phones.</p><div class="modal-actions"><button class="btn secondary" id="exportBtn">Export</button><button class="btn secondary" id="importBtn">Import</button><button class="btn danger" id="resetAllBtn">Reset all</button><button class="btn" data-close="menuModal">Done</button></div><input type="file" id="importFile" accept="application/json" hidden></div></div>
<div class="modal" id="logModal"><div class="modal-card"><h2>Log workout</h2><p>Choose the workout and the date it was performed.</p><div class="form-row"><label>Workout</label><select class="field" id="logRoutine"></select></div><div class="form-row"><label>Workout date</label><input class="field" type="date" id="logDate"></div><div class="modal-actions"><button class="btn secondary" data-close="logModal">Cancel</button><button class="btn" id="beginLog">Begin logging</button></div></div></div>
<div class="modal" id="dateModal"><div class="modal-card"><h2>Change workout date</h2><div class="form-row"><label>Date</label><input class="field" type="date" id="editHistoryDate"></div><div class="modal-actions"><button class="btn secondary" data-close="dateModal">Cancel</button><button class="btn" id="saveHistoryDate">Save date</button></div></div></div>
<div class="modal" id="discardModal"><div class="modal-card"><h2>Discard workout?</h2><p>Your current entries will be removed.</p><div class="modal-actions"><button class="btn secondary" data-close="discardModal">Keep</button><button class="btn danger" id="discardBtn">Discard</button></div></div></div>`}
function bindShell(){
  $$("[data-view]").forEach(b=>b.onclick=()=>{view=b.dataset.view;shell()});
  $("#menuBtn").onclick=()=>open("menuModal");
  $$("[data-close]").forEach(b=>b.onclick=()=>close(b.dataset.close));
  $("#exportBtn").onclick=exportData;$("#importBtn").onclick=()=>$("#importFile").click();$("#importFile").onchange=importData;
  $("#resetAllBtn").onclick=()=>{if(confirm("Delete all history and reset the routine?")){store={version:VERSION,routines:clone(defaults),sessions:[]};active=null;save();saveDraft();shell();toast("Tracker reset.")}};
  $("#beginLog").onclick=()=>{const rid=$("#logRoutine").value,date=$("#logDate").value||iso();close("logModal");start(rid,date);};
  $("#saveHistoryDate").onclick=()=>{const sid=$("#dateModal").dataset.sessionId,s=store.sessions.find(x=>x.id===sid);if(s&&$("#editHistoryDate").value){s.date=$("#editHistoryDate").value;store.sessions.sort((a,b)=>b.date.localeCompare(a.date));save();close("dateModal");render();toast("Workout date updated.");}};
  $("#discardBtn").onclick=()=>{active=null;saveDraft();close("discardModal");shell();toast("Workout discarded.")};
}

function render(){
  const m=$("#main");
  if(view==="today")renderToday(m);
  if(view==="history")renderHistory(m);
  if(view==="progress")renderProgress(m);
  if(view==="routine")renderRoutine(m);
  bindResumeControls();
}

function openLogModal(rid="",date=iso()){
  $("#logRoutine").innerHTML=store.routines.map(r=>`<option value="${r.id}" ${r.id===rid?"selected":""}>${esc(r.label)} · ${esc(r.name)}</option>`).join("");
  $("#logDate").value=date;open("logModal");
}
function editSessionDate(sessionId){const s=store.sessions.find(x=>x.id===sessionId);if(!s)return;$("#dateModal").dataset.sessionId=sessionId;$("#editHistoryDate").value=s.date;open("dateModal");}
function activeResumeCard(){
  if(!active)return "";
  const done=active.exercises.flatMap(e=>e.sets).filter(s=>s.done).length;
  const total=active.exercises.flatMap(e=>e.sets).length;
  return `<section class="resume-card">
    <div class="eyebrow">Workout in progress</div>
    <h3>${esc(active.routineName)}</h3>
    <p>${done}/${total} sets completed · Every entry is autosaved.</p>
    <div class="actions"><button class="btn" data-resume-workout>Resume workout</button></div>
  </section>`;
}
function bindResumeControls(){
  $$("[data-resume-workout]").forEach(b=>b.onclick=()=>{view="today";shell()});
}

function renderToday(m){
  if(active){renderSession(m);return}
  const last=store.sessions[0],nextId=last?nextDay(last.routineId):store.routines[0]?.id,next=store.routines.find(r=>r.id===nextId)||store.routines[0];
  m.innerHTML=`<section class="dashboard-hero"><div><div class="eyebrow">Today</div><h2>${esc(next?.name||"Choose a workout")}</h2><p>${esc(next?.mainLift||"Build your routine")}</p></div><button class="btn dashboard-start" data-start="${next?.id||""}">Start</button></section><div class="dashboard-stats"><div><strong>${weekCount()}</strong><span>this week</span></div><div><strong>${totalSets()}</strong><span>sets logged</span></div><div><strong>${prs()}</strong><span>weight PRs</span></div></div><div class="quick-actions"><button class="quick-action" id="logPastBtn"><span>＋</span><div><strong>Log past workout</strong><small>Choose any previous date</small></div></button><button class="quick-action" data-view-direct="routine"><span>⚙</span><div><strong>Edit routine</strong><small>Workouts, lifts and targets</small></div></button></div><div class="section-head"><div><h2>Training split</h2><p>${store.routines.length} workout days</p></div></div><div class="compact-split">${store.routines.map((r,i)=>`<button class="split-row" data-log-routine="${r.id}"><span class="split-index">${i+1}</span><span class="split-copy"><strong>${esc(r.name)}</strong><small>${r.exercises.length} lifts · Last ${lastDate(r.id)}</small></span><span class="split-arrow">›</span></button>`).join("")}</div>`;
  $$('[data-start]').forEach(b=>b.onclick=()=>start(b.dataset.start,iso()));
  $('#logPastBtn').onclick=()=>openLogModal(next?.id||'',iso());
  $$('[data-log-routine]').forEach(b=>b.onclick=()=>openLogModal(b.dataset.logRoutine,iso()));
  $$('[data-view-direct]').forEach(b=>b.onclick=()=>{view=b.dataset.viewDirect;shell()});
}
function start(rid,date=iso()){
  const r=store.routines.find(r=>r.id===rid);if(!r)return;
  active={id:id(),routineId:r.id,routineName:r.name,date,startedAt:new Date().toISOString(),exercises:r.exercises.map(e=>({exerciseId:e.id,name:e.name,target:{sets:e.sets,min:e.min,max:e.max,metric:e.metric},weightUnit:e.weightUnit,increment:e.increment,note:"",sets:Array.from({length:e.sets},(_,i)=>({set:i+1,weight:e.nextWeight??"",value:"",done:false}))}))};
  saveDraft();shell();
}
function renderSession(m){
  const r=store.routines.find(r=>r.id===active.routineId), done=active.exercises.flatMap(e=>e.sets).filter(s=>s.done).length,total=active.exercises.flatMap(e=>e.sets).length;
  m.innerHTML=`<div class="session-toolbar">
    <button class="btn secondary" id="leaveSession">← Back</button>
    <button class="btn danger" id="cancelSession">Discard</button>
  </div>
  <section class="session-head"><div><div class="eyebrow">${esc(r?.label||"Workout")}</div><h2>${esc(active.routineName)}</h2><p>${esc(r?.mainLift||"")}</p><span class="active-pill">Autosaved</span></div></section>
  <div class="progress"><div style="width:${total?done/total*100:0}%"></div></div>
  ${timerBox()}
  ${active.exercises.map((e,ei)=>exercise(e,ei)).join("")}
  <div class="sticky"><button class="btn full" id="finishBtn">Finish workout · ${done}/${total}</button></div>`;
  $("#leaveSession").onclick=()=>{view="history";shell();toast("Workout saved. Resume it anytime.");};$("#cancelSession").onclick=()=>open("discardModal");$("#finishBtn").onclick=finish;
  bindSession();
}
function timerBox(){return`<div class="timer"><div><div class="eyebrow">Rest timer</div><strong id="timerDisplay">${fmtTimer(timer.seconds)}</strong></div><div class="actions"><button class="small-btn" id="timer60">1:00</button><button class="small-btn" id="timer90">1:30</button><button class="small-btn" id="timerStop">Stop</button></div></div>`}
function exercise(e,ei){
  const last=lastPerf(e.exerciseId),metric=e.target.metric==="reps"?"Reps":e.target.metric==="sec"?"Seconds":"Yards";
  return`<article class="exercise-card ${findRoutineEx(e.exerciseId)?.mainLift?"main-lift-card":""}"><div class="exercise-head"><div><h3>${esc(e.name)}${findRoutineEx(e.exerciseId)?.mainLift?`<span class="main-badge">5/3/1</span>`:""}</h3><div class="target">${e.target.sets} × ${e.target.min===e.target.max?e.target.min:`${e.target.min}–${e.target.max}`} ${e.target.metric}</div><div class="last">${last||"No prior result"}</div></div><button class="small-btn" data-last="${ei}">Use last</button></div>
  <div class="set-grid head"><span>Set</span><span>Weight</span><span>${metric}</span><span>Done</span></div>
  ${e.sets.map((s,si)=>`<div class="set-grid"><span class="set-num">${si+1}</span><input class="field" type="number" step="any" inputmode="decimal" value="${attr(s.weight)}" data-e="${ei}" data-s="${si}" data-f="weight"><input class="field" type="number" step="any" inputmode="decimal" value="${attr(s.value)}" placeholder="${e.target.min}" data-e="${ei}" data-s="${si}" data-f="value"><button class="check ${s.done?"done":""}" data-check="${ei}-${si}">✓</button></div>`).join("")}
  <textarea class="field note-field" placeholder="Exercise note…" data-note="${ei}">${esc(e.note||"")}</textarea></article>`}
function bindSession(){
  $$("[data-e]").forEach(i=>i.oninput=()=>{active.exercises[+i.dataset.e].sets[+i.dataset.s][i.dataset.f]=i.value;saveDraft()});
  $$("[data-note]").forEach(i=>i.oninput=()=>{active.exercises[+i.dataset.note].note=i.value;saveDraft()});
  $$("[data-check]").forEach(b=>b.onclick=()=>{let[e,s]=b.dataset.check.split("-").map(Number);active.exercises[e].sets[s].done=!active.exercises[e].sets[s].done;saveDraft();shell()});
  $$("[data-last]").forEach(b=>b.onclick=()=>useLast(+b.dataset.last));
  $("#timer60").onclick=()=>startTimer(60);$("#timer90").onclick=()=>startTimer(90);$("#timerStop").onclick=stopTimer;
}
function useLast(ei){
  const e=active.exercises[ei],p=findLast(e.exerciseId);
  if(p)e.sets.forEach((s,i)=>{const q=p.sets[i]||p.sets.at(-1);if(q){s.weight=q.weight;s.value=q.value}});
  saveDraft();shell();
}
function finish(){
  if(!active.exercises.flatMap(e=>e.sets).some(s=>s.done)){toast("Complete at least one set.");return}
  active.finishedAt=new Date().toISOString();active.recommendations={};
  active.exercises.forEach(e=>{const rec=recommend(e);active.recommendations[e.exerciseId]=rec;const re=findRoutineEx(e.exerciseId);if(re&&rec.weight!==null)re.nextWeight=rec.weight});
  store.sessions.unshift(clone(active));save();active=null;saveDraft();stopTimer();shell();toast("Workout saved.");
}
function recommend(e){
  const done=e.sets.filter(s=>s.done&&s.value!=="");if(!done.length)return{weight:null,reason:"No data"};
  const ws=done.map(s=>num(s.weight)).filter(Number.isFinite),cur=ws.length?Math.max(...ws):null,vs=done.map(s=>num(s.value)).filter(Number.isFinite);
  if(cur===null)return{weight:null,reason:"Enter weight"};
  if(done.length===e.target.sets&&vs.every(v=>v>=e.target.max)&&e.increment>0)return{weight:round(cur+e.increment,e.increment),reason:"Increase"};
  if(vs.some(v=>v<e.target.min)&&e.increment>0)return{weight:Math.max(0,round(cur-e.increment,e.increment)),reason:"Reduce"};
  return{weight:cur,reason:"Repeat"};
}

function renderHistory(m){
  m.innerHTML=`${activeResumeCard()}<div class="section-head"><div><h2>History</h2><p>${store.sessions.length} workouts</p></div></div>${store.sessions.length?store.sessions.map(s=>`<article class="history-card"><div class="history-top"><div><h3>${esc(s.routineName)}</h3><p>${longDate(s.date)}</p></div><div class="history-actions"><button class="btn small secondary" data-date="${s.id}">Date</button><button class="btn small danger" data-del="${s.id}">Delete</button></div></div>${s.exercises.map(e=>{const d=e.sets.filter(x=>x.done);if(!d.length)return"";const b=[...d].sort((a,b)=>num(b.weight)-num(a.weight)||num(b.value)-num(a.value))[0];return`<div class="history-row"><span>${esc(e.name)}</span><span>${fmtWeight(b.weight,e.weightUnit)} × ${b.value} ${e.target.metric}</span></div>`}).join("")}</article>`).join(""):`<div class="empty">No workouts logged yet.</div>`}`;
  $$("[data-date]").forEach(b=>b.onclick=()=>editSessionDate(b.dataset.date));
  $$("[data-del]").forEach(b=>b.onclick=()=>{if(confirm("Delete this workout?")){store.sessions=store.sessions.filter(s=>s.id!==b.dataset.del);save();renderHistory(m)}})
}
function renderProgress(m){
  const exs=allExercises(),selected=window.progressEx||exs[0]?.id||"",pts=points(selected),e=exs.find(x=>x.id===selected);
  m.innerHTML=`${activeResumeCard()}<div class="section-head"><div><h2>Progress</h2><p>Best completed weight per workout</p></div></div><div class="chart-card"><div class="form-row"><label>Exercise</label><select class="field" id="progressSelect">${exs.map(x=>`<option value="${x.id}" ${x.id===selected?"selected":""}>${esc(x.name)}</option>`).join("")}</select></div>${pts.length?`<canvas id="chart"></canvas>`:`<div class="empty">Log this exercise to build a chart.</div>`}</div>`;
  $("#progressSelect").onchange=e=>{window.progressEx=e.target.value;renderProgress(m)};if(pts.length)requestAnimationFrame(()=>draw(pts));
}
function renderRoutine(m){
  m.innerHTML=`${activeResumeCard()}<div class="section-head"><div><h2>Edit routine</h2><p>Everything below is editable.</p></div><button class="btn small danger" id="resetRoutine">Reset</button></div><div class="note">Rename workout days, edit accessories, change sets and rep ranges, add or remove exercises, and reorder days. An active workout keeps the version it started with.</div><div style="height:12px"></div>${store.routines.map((r,ri)=>dayEditor(r,ri)).join("")}<button class="btn secondary full" id="addDay">Add workout day</button>`;
  bindEditor();
}
function dayEditor(r,ri){return`<details class="editor-card" ${ri===0?"open":""}><summary><span>${esc(r.label)} · ${esc(r.name)}</span><span>＋</span></summary><div class="day-editor"><div class="form-row"><label>Day label</label><input class="field" value="${attr(r.label)}" data-day="${ri}|label"></div><div class="form-row"><label>Workout name</label><input class="field" value="${attr(r.name)}" data-day="${ri}|name"></div><div class="form-row"><label>Main-lift note</label><input class="field" value="${attr(r.mainLift)}" data-day="${ri}|mainLift"></div><div class="move-row"><button class="small-btn" data-daymove="${ri}|-1">↑ Day</button><button class="small-btn" data-daymove="${ri}|1">↓ Day</button><button class="btn small danger" data-daydel="${ri}">Delete day</button></div></div>${r.exercises.map((e,ei)=>exEditor(e,ri,ei)).join("")}<button class="btn secondary full" data-addex="${ri}">Add accessory</button></details>`}
function exEditor(e,ri,ei){return`<div class="exercise-editor"><div class="name-row"><input class="field" value="${attr(e.name)}" data-ex="${ri}|${ei}|name"><button class="btn small danger" data-exdel="${ri}|${ei}">✕</button></div><div class="editor-grid"><label>Sets<input class="field" type="number" value="${e.sets}" data-ex="${ri}|${ei}|sets"></label><label>Min<input class="field" type="number" value="${e.min}" data-ex="${ri}|${ei}|min"></label><label>Max<input class="field" type="number" value="${e.max}" data-ex="${ri}|${ei}|max"></label><label>Next wt<input class="field" type="number" step="any" value="${attr(e.nextWeight??"")}" data-ex="${ri}|${ei}|nextWeight"></label><label>Increment<input class="field" type="number" step="any" value="${e.increment}" data-ex="${ri}|${ei}|increment"></label><label>Metric<select class="field" data-ex="${ri}|${ei}|metric">${["reps","sec","yd"].map(v=>`<option ${e.metric===v?"selected":""}>${v}</option>`).join("")}</select></label></div><div class="form-row" style="margin-top:8px"><label>Weight label</label><input class="field" value="${attr(e.weightUnit)}" data-ex="${ri}|${ei}|weightUnit"></div><div class="form-row"><label>Exercise note</label><input class="field" value="${attr(e.note||"")}" data-ex="${ri}|${ei}|note"></div><label class="toggle-row"><input type="checkbox" ${e.mainLift?"checked":""} data-main-toggle="${ri}|${ei}"><span>5/3/1 main lift</span></label><div class="move-row"><button class="small-btn" data-exmove="${ri}|${ei}|-1">↑ Accessory</button><button class="small-btn" data-exmove="${ri}|${ei}|1">↓ Accessory</button></div></div>`}
function bindEditor(){
  $$("[data-day]").forEach(i=>{const saveDay=()=>{let[ri,k]=i.dataset.day.split("|");store.routines[+ri][k]=i.value;save()};i.oninput=saveDay;i.onchange=()=>{saveDay();shell();toast("Workout updated.")}});
  $$("[data-ex]").forEach(i=>{const saveEx=()=>{let[ri,ei,k]=i.dataset.ex.split("|"),e=store.routines[+ri].exercises[+ei];e[k]=["sets","min","max","nextWeight","increment"].includes(k)?(i.value===""?null:num(i.value)):i.value;if(k==="sets")e.sets=Math.max(1,Math.round(e.sets||1));save()};i.oninput=saveEx;i.onchange=()=>{saveEx();toast("Accessory updated.")}});
  $$("[data-main-toggle]").forEach(i=>i.onchange=()=>{let[ri,ei]=i.dataset.mainToggle.split("|").map(Number);store.routines[ri].exercises[ei].mainLift=i.checked;save();toast("Lift type updated.")});
  $$("[data-addex]").forEach(b=>b.onclick=()=>{store.routines[+b.dataset.addex].exercises.push(x(id(),"New Accessory",3,8,12,null,5));save();shell()});
  $$("[data-exdel]").forEach(b=>b.onclick=()=>{let[ri,ei]=b.dataset.exdel.split("|").map(Number);if(confirm("Remove this accessory?")){store.routines[ri].exercises.splice(ei,1);save();shell()}});
  $$("[data-exmove]").forEach(b=>b.onclick=()=>{let[ri,ei,d]=b.dataset.exmove.split("|").map(Number),a=store.routines[ri].exercises,n=ei+d;if(n>=0&&n<a.length){[a[ei],a[n]]=[a[n],a[ei]];save();shell()}});
  $$("[data-daymove]").forEach(b=>b.onclick=()=>{let[i,d]=b.dataset.daymove.split("|").map(Number),n=i+d;if(n>=0&&n<store.routines.length){[store.routines[i],store.routines[n]]=[store.routines[n],store.routines[i]];save();shell()}});
  $$("[data-daydel]").forEach(b=>b.onclick=()=>{let i=+b.dataset.daydel;if(store.routines.length===1){toast("Keep at least one workout.");return}if(confirm("Delete this workout day?")){store.routines.splice(i,1);save();shell()}});
  $("#addDay").onclick=()=>{store.routines.push({id:id(),label:`Day ${store.routines.length+1}`,name:"New Workout",mainLift:"",exercises:[x(id(),"New Accessory",3,8,12,null,5)]});save();shell()};
  $("#resetRoutine").onclick=()=>{if(confirm("Reset the routine? History will remain.")){store.routines=clone(defaults);save();shell()}};
}

function startTimer(sec){stopTimer();timer.seconds=sec;timer.running=true;tick();timer.handle=setInterval(()=>{timer.seconds--;tick();if(timer.seconds<=0){stopTimer();navigator.vibrate?.([200,100,200]);toast("Rest complete.")}},1000)}
function stopTimer(){clearInterval(timer.handle);timer.handle=null;timer.running=false;timer.seconds=Math.max(0,timer.seconds);tick()}
function tick(){const el=$("#timerDisplay");if(el)el.textContent=fmtTimer(timer.seconds)}
function fmtTimer(s){return`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`}

function allExercises(){const m=new Map();store.routines.forEach(r=>r.exercises.forEach(e=>m.set(e.id,e)));return[...m.values()]}
function points(eid){return store.sessions.slice().reverse().flatMap(s=>{const e=s.exercises.find(x=>x.exerciseId===eid);if(!e)return[];const w=e.sets.filter(x=>x.done&&x.weight!=="").map(x=>num(x.weight)).filter(Number.isFinite);return w.length?[{date:s.date,weight:Math.max(...w)}]:[]})}
function draw(pts){const c=$("#chart"),r=c.getBoundingClientRect(),d=devicePixelRatio||1;c.width=r.width*d;c.height=220*d;const g=c.getContext("2d");g.scale(d,d);const w=r.width,h=220,p={l:42,r:16,t:18,b:34},vs=pts.map(p=>p.weight),lo=Math.min(...vs)-5,hi=Math.max(...vs)+5,x=i=>p.l+(pts.length===1?(w-p.l-p.r)/2:i*(w-p.l-p.r)/(pts.length-1)),y=v=>p.t+(hi-v)*(h-p.t-p.b)/(hi-lo||1);g.strokeStyle="#2b3748";for(let i=0;i<4;i++){let yy=p.t+i*(h-p.t-p.b)/3;g.beginPath();g.moveTo(p.l,yy);g.lineTo(w-p.r,yy);g.stroke()}g.strokeStyle="#66aaff";g.lineWidth=3;g.beginPath();pts.forEach((pt,i)=>i?g.lineTo(x(i),y(pt.weight)):g.moveTo(x(i),y(pt.weight)));g.stroke();g.fillStyle="#71e3a6";pts.forEach((pt,i)=>{g.beginPath();g.arc(x(i),y(pt.weight),4.5,0,Math.PI*2);g.fill()})}
function findLast(eid){for(const s of store.sessions){const e=s.exercises.find(x=>x.exerciseId===eid);if(e)return e}return null}
function lastPerf(eid){const e=findLast(eid);if(!e)return"";const s=e.sets.filter(x=>x.done);if(!s.length)return"";const b=[...s].sort((a,b)=>num(b.weight)-num(a.weight)||num(b.value)-num(a.value))[0];return`Last: ${fmtWeight(b.weight,e.weightUnit)} × ${b.value} ${e.target.metric}`}
function findRoutineEx(eid){for(const r of store.routines){const e=r.exercises.find(x=>x.id===eid);if(e)return e}return null}
function nextDay(rid){let i=store.routines.findIndex(r=>r.id===rid);return store.routines[(i+1+store.routines.length)%store.routines.length]?.id}
function lastDate(rid){const s=store.sessions.find(s=>s.routineId===rid);return s?shortDate(s.date):"Never"}
function weekCount(){const n=new Date(),d=(n.getDay()+6)%7,s=new Date(n);s.setHours(0,0,0,0);s.setDate(n.getDate()-d);return store.sessions.filter(x=>new Date(x.date+"T12:00:00")>=s).length}
function totalSets(){return store.sessions.reduce((a,s)=>a+s.exercises.reduce((b,e)=>b+e.sets.filter(x=>x.done).length,0),0)}
function prs(){let count=0;const best={};store.sessions.slice().reverse().forEach(s=>s.exercises.forEach(e=>e.sets.filter(x=>x.done).forEach(x=>{const w=num(x.weight);if(Number.isFinite(w)&&(best[e.exerciseId]===undefined||w>best[e.exerciseId])){if(best[e.exerciseId]!==undefined)count++;best[e.exerciseId]=w}})));return count}
function round(v,i){if(!i)return v;return Math.round(v/i)*i}
function fmtWeight(v,u){return v===""||v==null?"—":`${v} ${u}`}
function iso(){const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function shortDate(s){return new Date(s+"T12:00:00").toLocaleDateString(undefined,{month:"short",day:"numeric"})}
function longDate(s){return new Date(s+"T12:00:00").toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric",year:"numeric"})}
function open(i){$("#"+i)?.classList.add("open")}function close(i){$("#"+i)?.classList.remove("open")}
let tt;function toast(t){const e=$("#toast");e.textContent=t;e.classList.add("show");clearTimeout(tt);tt=setTimeout(()=>e.classList.remove("show"),1800)}
function exportData(){const b=new Blob([JSON.stringify(store,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=`powerbuilding-backup-${iso()}.json`;a.click();URL.revokeObjectURL(a.href)}
function importData(e){const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const p=JSON.parse(r.result);if(!p.routines||!p.sessions)throw 0;store=p;save();shell();toast("Backup imported.")}catch{alert("Invalid backup file.")}};r.readAsText(f)}

shell();

if("serviceWorker"in navigator){
  navigator.serviceWorker.register("./sw.js").then(reg=>{
    reg.addEventListener("updatefound",()=>{
      const nw=reg.installing;
      nw.addEventListener("statechange",()=>{if(nw.state==="installed"&&navigator.serviceWorker.controller)$("#updateBanner").classList.remove("hidden")})
    });
    $("#applyUpdate").onclick=()=>{reg.waiting?.postMessage({type:"SKIP_WAITING"})};
  });
  navigator.serviceWorker.addEventListener("controllerchange",()=>location.reload());
}
