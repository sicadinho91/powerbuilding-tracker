
"use strict";

const STORAGE_KEY = "powerbuildingTrackerV1";
const DRAFT_KEY = "powerbuildingTrackerDraftV1";

const defaultRoutines = [
  {
    id:"day1", name:"Squat + Legs", label:"Day 1", mainLift:"Track squat in your 5/3/1 app",
    exercises:[
      ex("paused-squat","Paused Squat",3,5,5,225,5,"reps","lb"),
      ex("rdl","Romanian Deadlift",3,8,8,185,5,"reps","lb"),
      ex("hip-abductor","Hip Abductor Machine",4,15,20,100,10,"reps","lb","Push knees outward."),
      ex("leg-extension","Leg Extension",3,15,15,110,10,"reps","lb"),
      ex("lying-ham-curl","Lying Hamstring Curl",3,15,15,70,5,"reps","lb"),
      ex("standing-calf","Standing Calf Raise",4,12,15,180,10,"reps","lb")
    ]
  },
  {
    id:"day2", name:"Bench + Chest / Shoulders", label:"Day 2", mainLift:"Track bench in your 5/3/1 app",
    exercises:[
      ex("close-grip-bench","Close-Grip Bench",3,8,8,185,5,"reps","lb"),
      ex("db-incline","DB Incline Press",3,10,10,60,5,"reps","lb/DB"),
      ex("db-lateral","DB Lateral Raise",4,12,15,12.5,2.5,"reps","lb/DB"),
      ex("face-pull","Face Pull",4,20,20,50,5,"reps","lb"),
      ex("rope-pushdown","Rope Pushdown",3,15,15,55,5,"reps","lb"),
      ex("weighted-dips","Weighted Dips",3,8,8,0,5,"reps","+lb","Zero means bodyweight.")
    ]
  },
  {
    id:"day3", name:"Core", label:"Day 3", mainLift:"Dedicated core day",
    exercises:[
      ex("hanging-leg-raise","Hanging Leg Raise",4,10,12,0,0,"reps","optional lb"),
      ex("ab-wheel","Ab Wheel",4,8,12,0,0,"reps","optional lb"),
      ex("cable-crunch","Cable Crunch",4,12,15,null,5,"reps","lb"),
      ex("weighted-plank","Weighted Plank",3,30,60,null,5,"sec","lb"),
      ex("farmer-carry","Farmer Carry",4,30,40,null,5,"yd","lb/hand")
    ]
  },
  {
    id:"day4", name:"Deadlift + Back", label:"Day 4", mainLift:"Track deadlift in your 5/3/1 app",
    exercises:[
      ex("barbell-row","Barbell Row",4,8,8,165,5,"reps","lb"),
      ex("weighted-pullup","Weighted Pull-Up",4,6,6,0,5,"reps","+lb","Zero means bodyweight."),
      ex("chest-supported-row","Chest-Supported DB Row",3,12,12,70,5,"reps","lb/DB"),
      ex("lat-pulldown","Lat Pulldown",3,12,12,140,5,"reps","lb"),
      ex("smith-shrug","Smith Shrug",5,12,12,270,10,"reps","logged lb","Starting reference: 3 plates per side. Log it consistently for your machine."),
      ex("rear-delt-fly","Rear Delt Fly",4,15,15,20,2.5,"reps","lb/DB"),
      ex("hammer-curl","Hammer Curl",3,12,12,35,2.5,"reps","lb/DB"),
      ex("ez-curl","EZ-Bar Curl",3,12,12,70,5,"reps","lb")
    ]
  },
  {
    id:"day5", name:"Incline + Upper Hypertrophy", label:"Day 5", mainLift:"Track incline press in your 5/3/1 app",
    exercises:[
      ex("db-shoulder-press","Seated DB Shoulder Press",4,8,8,60,5,"reps","lb/DB"),
      ex("machine-chest-press","Machine Chest Press",3,12,12,160,10,"reps","lb"),
      ex("cable-lateral","Cable Lateral Raise",4,15,20,15,2.5,"reps","lb"),
      ex("pec-deck","Pec Deck",3,15,15,130,10,"reps","lb"),
      ex("ez-upright-row","EZ-Bar Upright Row",3,12,12,60,5,"reps","lb"),
      ex("reverse-pec-deck","Reverse Pec Deck",4,15,15,90,10,"reps","lb"),
      ex("overhead-rope","Overhead Rope Extension",3,15,15,45,5,"reps","lb"),
      ex("preacher-curl","Preacher Curl",3,12,12,60,5,"reps","lb")
    ]
  }
];

function ex(id,name,sets,min,max,start,inc,metric="reps",weightUnit="lb",note=""){
  return {id,name,sets,min,max,startWeight:start,nextWeight:start,increment:inc,metric,weightUnit,note};
}

function deepClone(v){ return JSON.parse(JSON.stringify(v)); }
function freshStore(){ return {version:1,routines:deepClone(defaultRoutines),sessions:[]}; }
function loadStore(){
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    if(!raw) return freshStore();
    const parsed=JSON.parse(raw);
    if(!parsed.routines || !parsed.sessions) throw new Error("Bad data");
    return parsed;
  }catch(e){ return freshStore(); }
}
function saveStore(){ localStorage.setItem(STORAGE_KEY,JSON.stringify(store)); }
function loadDraft(){
  try{return JSON.parse(localStorage.getItem(DRAFT_KEY)||"null");}catch(e){return null;}
}
function saveDraft(){ activeSession ? localStorage.setItem(DRAFT_KEY,JSON.stringify(activeSession)) : localStorage.removeItem(DRAFT_KEY); }

let store=loadStore();
let activeSession=loadDraft();
let activeView="today";
let chartSelection="";

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];

document.addEventListener("DOMContentLoaded",()=>{
  bindNav();
  bindGlobal();
  renderAll();
  if("serviceWorker" in navigator && location.protocol.startsWith("http")){
    navigator.serviceWorker.register("./sw.js").catch(()=>{});
  }
});

function bindNav(){
  $$(".nav-btn").forEach(btn=>btn.addEventListener("click",()=>{
    if(activeSession && btn.dataset.view!=="today"){
      toast("Finish or save your active workout first.");
      return;
    }
    activeView=btn.dataset.view;
    $$(".nav-btn").forEach(b=>b.classList.toggle("active",b===btn));
    $$(".view").forEach(v=>v.classList.toggle("active",v.id===`view-${activeView}`));
    renderAll();
    window.scrollTo({top:0,behavior:"smooth"});
  }));
}
function bindGlobal(){
  $("#backupBtn").addEventListener("click",()=>openModal("backupModal"));
  $("#closeBackup").addEventListener("click",()=>closeModal("backupModal"));
  $("#exportBtn").addEventListener("click",exportData);
  $("#importBtn").addEventListener("click",()=>$("#importFile").click());
  $("#importFile").addEventListener("change",importData);
  $("#resetDataBtn").addEventListener("click",resetData);
  $("#cancelReset").addEventListener("click",()=>closeModal("confirmModal"));
  $("#confirmReset").addEventListener("click",performReset);
  $$(".modal").forEach(m=>m.addEventListener("click",e=>{if(e.target===m)closeModal(m.id)}));
}

function renderAll(){
  renderToday();
  renderHistory();
  renderProgress();
  renderRoutine();
}

function renderToday(){
  const root=$("#view-today");
  if(activeSession){ renderActiveWorkout(root); return; }
  const completed=store.sessions.length;
  const last=store.sessions[0];
  root.innerHTML=`
    <section class="hero">
      <div class="eyebrow">Powerbuilding accessory tracker</div>
      <h2>Log the work your 5/3/1 app misses.</h2>
      <p>Your five-day accessory rotation is preloaded. Every completed workout updates your history and suggests the next working weight.</p>
      <div class="hero-actions">
        ${last?`<button class="btn" data-start="${nextDayId(last.routineId)}">Start next day</button>`:`<button class="btn" data-start="day1">Start Day 1</button>`}
        <button class="btn secondary" id="resumeInfo">How progression works</button>
      </div>
    </section>
    <div class="metrics">
      <div class="metric"><strong>${completed}</strong><span>Workouts logged</span></div>
      <div class="metric"><strong>${thisWeekCount()}</strong><span>This week</span></div>
      <div class="metric"><strong>${totalCompletedSets()}</strong><span>Completed sets</span></div>
      <div class="metric"><strong>${last?shortDate(last.date):"—"}</strong><span>Last workout</span></div>
    </div>
    <div class="section-head"><div><h2>Workout rotation</h2><p>Main 5/3/1 lifts stay in your other app.</p></div></div>
    <div class="cards">
      ${store.routines.map((r,i)=>dayCard(r,i)).join("")}
    </div>
  `;
  $$("[data-start]").forEach(b=>b.addEventListener("click",()=>startWorkout(b.dataset.start)));
  $("#resumeInfo").addEventListener("click",()=>openModal("progressionModal"));
}

function dayCard(r,i){
  const last=lastSessionForRoutine(r.id);
  return `
    <article class="day-card">
      <div>
        <h3><span class="day-number">${i+1}</span>${esc(r.name)}</h3>
        <p>${esc(r.mainLift)}</p>
        <div class="mini-stats">
          <span><strong>${r.exercises.length}</strong> exercises</span>
          <span>Last: <strong>${last?shortDate(last.date):"Not logged"}</strong></span>
        </div>
      </div>
      <button class="btn secondary" data-start="${r.id}">Start</button>
    </article>`;
}

function startWorkout(routineId){
  const r=store.routines.find(x=>x.id===routineId);
  if(!r)return;
  activeSession={
    id:cryptoId(),routineId:r.id,routineName:r.name,date:todayISO(),startedAt:new Date().toISOString(),
    exercises:r.exercises.map(e=>({
      exerciseId:e.id,name:e.name,target:{sets:e.sets,min:e.min,max:e.max,metric:e.metric},
      weightUnit:e.weightUnit,increment:e.increment,
      note:"",
      sets:Array.from({length:e.sets},(_,i)=>({set:i+1,weight:e.nextWeight??e.startWeight??"",value:"",done:false}))
    }))
  };
  saveDraft();
  renderToday();
  window.scrollTo({top:0});
}

function renderActiveWorkout(root){
  const r=store.routines.find(x=>x.id===activeSession.routineId);
  const done=activeSession.exercises.flatMap(e=>e.sets).filter(s=>s.done).length;
  const total=activeSession.exercises.flatMap(e=>e.sets).length;
  root.innerHTML=`
    <section class="session-head">
      <div><div class="eyebrow">${esc(r?.label||"Workout")}</div><h2>${esc(activeSession.routineName)}</h2><p>${esc(r?.mainLift||"")} · ${longDate(activeSession.date)}</p></div>
      <button class="icon-btn" id="cancelWorkout" aria-label="Cancel workout">✕</button>
    </section>
    <div class="progress-bar"><div style="width:${total?done/total*100:0}%"></div></div>
    <div id="exerciseList">
      ${activeSession.exercises.map((e,i)=>exerciseCard(e,i)).join("")}
    </div>
    <div class="sticky-finish"><button class="btn wide" id="finishWorkout">Finish workout · ${done}/${total} sets</button></div>
  `;
  $("#cancelWorkout").addEventListener("click",()=>openModal("cancelWorkoutModal"));
  $("#finishWorkout").addEventListener("click",finishWorkout);
  bindWorkoutInputs();
}

function exerciseCard(e,ei){
  const last=lastExercisePerformance(e.exerciseId);
  const metricLabel=e.target.metric==="reps"?"Reps":e.target.metric==="sec"?"Seconds":"Yards";
  return `
    <article class="exercise-card">
      <div class="exercise-top">
        <div>
          <h3>${esc(e.name)}</h3>
          <div class="target">${e.target.sets} × ${targetText(e.target)} · ${esc(e.weightUnit)}</div>
          <div class="last-line">${last?`Last: ${esc(last)}`:"No prior workout logged"}</div>
        </div>
        <button class="btn small secondary" data-fill-last="${ei}">Use last</button>
      </div>
      <div class="set-grid head"><span>Set</span><span>Weight</span><span>${metricLabel}</span><span>Done</span></div>
      ${e.sets.map((s,si)=>`
        <div class="set-grid">
          <span class="set-num">${si+1}</span>
          <input class="field" inputmode="decimal" type="number" step="any" placeholder="—" value="${attr(s.weight)}" data-e="${ei}" data-s="${si}" data-field="weight">
          <input class="field" inputmode="decimal" type="number" step="any" placeholder="${e.target.min}" value="${attr(s.value)}" data-e="${ei}" data-s="${si}" data-field="value">
          <button class="check ${s.done?"done":""}" data-check="${ei}-${si}" aria-label="Complete set">✓</button>
        </div>`).join("")}
      <div class="exercise-actions">
        <textarea class="field exercise-note" placeholder="Exercise note…" data-note="${ei}">${esc(e.note||"")}</textarea>
      </div>
    </article>`;
}

function bindWorkoutInputs(){
  $$("[data-field]").forEach(inp=>inp.addEventListener("input",()=>{
    const e=+inp.dataset.e,s=+inp.dataset.s,f=inp.dataset.field;
    activeSession.exercises[e].sets[s][f]=inp.value;
    saveDraft();
  }));
  $$("[data-note]").forEach(inp=>inp.addEventListener("input",()=>{
    activeSession.exercises[+inp.dataset.note].note=inp.value;saveDraft();
  }));
  $$("[data-check]").forEach(btn=>btn.addEventListener("click",()=>{
    const [e,s]=btn.dataset.check.split("-").map(Number);
    activeSession.exercises[e].sets[s].done=!activeSession.exercises[e].sets[s].done;
    saveDraft();renderToday();
  }));
  $$("[data-fill-last]").forEach(btn=>btn.addEventListener("click",()=>{
    fillFromLast(+btn.dataset.fillLast);
  }));
  $("#confirmCancelWorkout")?.addEventListener("click",cancelWorkout);
  $("#keepWorkout")?.addEventListener("click",()=>closeModal("cancelWorkoutModal"));
}

function fillFromLast(ei){
  const current=activeSession.exercises[ei];
  const prior=findLastExercise(current.exerciseId);
  if(prior){
    current.sets.forEach((s,i)=>{
      const p=prior.sets[i]||prior.sets[prior.sets.length-1];
      if(p){s.weight=p.weight;s.value=p.value;}
    });
  }else{
    const routineEx=findRoutineExercise(current.exerciseId);
    current.sets.forEach(s=>s.weight=routineEx?.nextWeight??routineEx?.startWeight??"");
  }
  saveDraft();renderToday();
}

function finishWorkout(){
  const completed=activeSession.exercises.flatMap(e=>e.sets).filter(s=>s.done).length;
  if(completed===0){toast("Complete at least one set before finishing.");return;}
  activeSession.finishedAt=new Date().toISOString();
  activeSession.recommendations={};
  activeSession.exercises.forEach(e=>{
    const rec=recommendNext(e);
    activeSession.recommendations[e.exerciseId]=rec;
    const re=findRoutineExercise(e.exerciseId);
    if(re && rec.weight!==null && rec.weight!=="") re.nextWeight=rec.weight;
  });
  store.sessions.unshift(deepClone(activeSession));
  saveStore();
  activeSession=null;saveDraft();
  renderAll();
  toast("Workout saved.");
  window.scrollTo({top:0,behavior:"smooth"});
}

function recommendNext(e){
  const done=e.sets.filter(s=>s.done && s.value!=="");
  if(!done.length) return {weight:baseWeight(e),reason:"Repeat"};
  const weights=done.map(s=>num(s.weight)).filter(Number.isFinite);
  const current=weights.length?Math.max(...weights):baseWeight(e);
  if(current===null || current==="") return {weight:null,reason:"Enter a starting weight"};
  const values=done.map(s=>num(s.value)).filter(Number.isFinite);
  const allSets=done.length===e.target.sets;
  if(allSets && values.length===done.length && values.every(v=>v>=e.target.max) && e.increment>0){
    return {weight:roundTo(current+e.increment,e.increment),reason:`Add ${e.increment} ${e.weightUnit}`};
  }
  if(values.some(v=>v<e.target.min) && e.increment>0){
    return {weight:Math.max(0,roundTo(current-e.increment,e.increment)),reason:"Reduce one increment"};
  }
  return {weight:current,reason:"Repeat and beat reps"};
}

function cancelWorkout(){activeSession=null;saveDraft();closeModal("cancelWorkoutModal");renderToday();toast("Workout discarded.");}

function renderHistory(){
  const root=$("#view-history");
  if(!store.sessions.length){
    root.innerHTML=`<div class="section-head"><div><h2>History</h2><p>Your completed workouts will appear here.</p></div></div><div class="empty">No workouts logged yet.</div>`;
    return;
  }
  root.innerHTML=`
    <div class="section-head"><div><h2>History</h2><p>${store.sessions.length} completed workout${store.sessions.length===1?"":"s"}</p></div></div>
    ${store.sessions.map(s=>historyCard(s)).join("")}`;
  $$("[data-delete-session]").forEach(btn=>btn.addEventListener("click",()=>{
    if(confirm("Delete this workout from history?")){
      store.sessions=store.sessions.filter(s=>s.id!==btn.dataset.deleteSession);saveStore();renderAll();toast("Workout deleted.");
    }
  }));
}

function historyCard(s){
  const completed=s.exercises.flatMap(e=>e.sets).filter(x=>x.done).length;
  const total=s.exercises.flatMap(e=>e.sets).length;
  return `<article class="history-card">
    <div class="history-top">
      <div><h3>${esc(s.routineName)}</h3><p>${longDate(s.date)} · ${completed}/${total} sets</p></div>
      <button class="btn small danger" data-delete-session="${s.id}">Delete</button>
    </div>
    <div class="history-exercises">
      ${s.exercises.map(e=>{
        const completedSets=e.sets.filter(x=>x.done);
        if(!completedSets.length)return "";
        const best=bestSetText(e);
        const rec=s.recommendations?.[e.exerciseId];
        return `<div class="history-row"><span>${esc(e.name)}</span><span>${esc(best)}${rec?` · Next ${formatWeight(rec.weight,e.weightUnit)}`:""}</span></div>`;
      }).join("")}
    </div>
  </article>`;
}

function renderProgress(){
  const root=$("#view-progress");
  const all=allExercises();
  if(!chartSelection || !all.some(e=>e.id===chartSelection)) chartSelection=all[0]?.id||"";
  const e=all.find(x=>x.id===chartSelection);
  const points=e?exercisePoints(e.id):[];
  const stats=e?exerciseStats(e.id):{sessions:0,best:"—",volume:"—",last:"—"};
  root.innerHTML=`
    <div class="section-head"><div><h2>Progress</h2><p>Best completed working weight by workout.</p></div></div>
    <div class="chart-panel">
      <div class="select-row"><label for="exerciseSelect">Exercise</label>
        <select class="field" id="exerciseSelect">${all.map(x=>`<option value="${x.id}" ${x.id===chartSelection?"selected":""}>${esc(x.name)}</option>`).join("")}</select>
      </div>
      <div class="metrics">
        <div class="metric"><strong>${stats.sessions}</strong><span>Sessions</span></div>
        <div class="metric"><strong>${stats.best}</strong><span>Best weight</span></div>
        <div class="metric"><strong>${stats.volume}</strong><span>Total volume</span></div>
        <div class="metric"><strong>${stats.last}</strong><span>Last logged</span></div>
      </div>
      ${points.length?`<canvas id="progressChart" width="680" height="220"></canvas>`:`<div class="empty">Log this exercise to see a progress chart.</div>`}
    </div>`;
  $("#exerciseSelect")?.addEventListener("change",e=>{chartSelection=e.target.value;renderProgress();});
  if(points.length) requestAnimationFrame(()=>drawChart(points,e));
}

function drawChart(points,e){
  const canvas=$("#progressChart"); if(!canvas)return;
  const rect=canvas.getBoundingClientRect(),dpr=window.devicePixelRatio||1;
  canvas.width=Math.max(300,rect.width*dpr);canvas.height=220*dpr;
  const ctx=canvas.getContext("2d");ctx.scale(dpr,dpr);
  const w=rect.width,h=220,p={l:42,r:16,t:18,b:34};
  ctx.clearRect(0,0,w,h);
  const vals=points.map(x=>x.weight),min=Math.min(...vals),max=Math.max(...vals);
  const lo=min===max?Math.max(0,min-5):min-(max-min)*.12;
  const hi=min===max?max+5:max+(max-min)*.12;
  const x=i=>p.l+(points.length===1?(w-p.l-p.r)/2:i*(w-p.l-p.r)/(points.length-1));
  const y=v=>p.t+(hi-v)*(h-p.t-p.b)/(hi-lo||1);
  ctx.strokeStyle="#2a3445";ctx.lineWidth=1;
  for(let i=0;i<4;i++){
    const yy=p.t+i*(h-p.t-p.b)/3;ctx.beginPath();ctx.moveTo(p.l,yy);ctx.lineTo(w-p.r,yy);ctx.stroke();
    const val=hi-i*(hi-lo)/3;ctx.fillStyle="#9ba7b8";ctx.font="11px system-ui";ctx.textAlign="right";ctx.fillText(trimNum(val),p.l-7,yy+4);
  }
  ctx.strokeStyle="#5aa9ff";ctx.lineWidth=3;ctx.lineJoin="round";ctx.beginPath();
  points.forEach((pt,i)=>{const xx=x(i),yy=y(pt.weight);i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy)});ctx.stroke();
  points.forEach((pt,i)=>{
    const xx=x(i),yy=y(pt.weight);ctx.fillStyle="#77e2a8";ctx.beginPath();ctx.arc(xx,yy,4.5,0,Math.PI*2);ctx.fill();
  });
  ctx.fillStyle="#9ba7b8";ctx.font="10px system-ui";ctx.textAlign="center";
  const labels=points.length<=5?points:points.filter((_,i)=>i===0||i===points.length-1||i%Math.ceil(points.length/4)===0);
  labels.forEach(pt=>{const i=points.indexOf(pt);ctx.fillText(shortDate(pt.date),x(i),h-10)});
}


function renderRoutine(){
  const root=$("#view-routine");
  root.innerHTML=`
    <div class="section-head">
      <div><h2>Routine</h2><p>Edit workout days, exercise lists, targets, and progression.</p></div>
      <button class="btn small danger" id="resetRoutine">Reset routine</button>
    </div>
    <div class="note">Changes save automatically. You can rename workouts, edit the main-lift note, add or remove exercises, and reorder entire workout days.</div>
    <div style="height:12px"></div>
    <div id="routineDays">
      ${store.routines.map((r,ri)=>editorDay(r,ri)).join("")}
    </div>
    <button class="btn secondary wide" id="addWorkoutDay">Add workout day</button>`;
  bindRoutineEditor();
}

function editorDay(r,ri){
  return `<details class="editor-card" ${ri===0?"open":""}>
    <summary>
      <span>${esc(r.label||`Day ${ri+1}`)} · ${esc(r.name)}</span>
      <span>＋</span>
    </summary>

    <div class="workout-editor-head">
      <div class="select-row">
        <label>Day label</label>
        <input class="field" value="${attr(r.label||`Day ${ri+1}`)}" data-day-edit="${ri}-label">
      </div>
      <div class="select-row">
        <label>Workout name</label>
        <input class="field" value="${attr(r.name)}" data-day-edit="${ri}-name">
      </div>
      <div class="select-row">
        <label>Main-lift note</label>
        <input class="field" value="${attr(r.mainLift||"")}" data-day-edit="${ri}-mainLift">
      </div>
      <div class="editor-buttons">
        <button class="btn small secondary" data-day-up="${ri}">↑ Move day</button>
        <button class="btn small secondary" data-day-down="${ri}">↓ Move day</button>
        <button class="btn small danger" data-delete-day="${ri}">Delete day</button>
      </div>
    </div>

    <div class="editor-list">
      ${r.exercises.map((e,ei)=>editorExercise(e,ri,ei)).join("")}
      <button class="btn secondary wide" data-add-ex="${ri}">Add exercise</button>
    </div>
  </details>`;
}

function editorExercise(e,ri,ei){
  return `<div class="editor-exercise">
    <div class="name-row">
      <input class="field" value="${attr(e.name)}" data-edit="${ri}-${ei}-name">
      <button class="btn small danger" data-delete-ex="${ri}-${ei}">✕</button>
    </div>
    <div class="editor-grid">
      <label>Sets<input class="field" type="number" min="1" value="${e.sets}" data-edit="${ri}-${ei}-sets"></label>
      <label>Min<input class="field" type="number" step="any" value="${e.min}" data-edit="${ri}-${ei}-min"></label>
      <label>Max<input class="field" type="number" step="any" value="${e.max}" data-edit="${ri}-${ei}-max"></label>
      <label>Next weight<input class="field" type="number" step="any" value="${attr(e.nextWeight??"")}" data-edit="${ri}-${ei}-nextWeight"></label>
      <label>Increment<input class="field" type="number" step="any" value="${e.increment}" data-edit="${ri}-${ei}-increment"></label>
      <label>Metric<select class="field" data-edit="${ri}-${ei}-metric">
        ${["reps","sec","yd"].map(x=>`<option ${e.metric===x?"selected":""}>${x}</option>`).join("")}
      </select></label>
    </div>
    <div class="editor-grid" style="grid-template-columns:1fr">
      <label>Weight label<input class="field" value="${attr(e.weightUnit)}" data-edit="${ri}-${ei}-weightUnit"></label>
      <label>Exercise note<input class="field" value="${attr(e.note||"")}" data-edit="${ri}-${ei}-note"></label>
    </div>
    <div class="editor-buttons">
      <button class="btn small secondary" data-move-up="${ri}-${ei}">↑ Up</button>
      <button class="btn small secondary" data-move-down="${ri}-${ei}">↓ Down</button>
    </div>
  </div>`;
}

function bindRoutineEditor(){
  $$("[data-day-edit]").forEach(el=>{
    const save=()=>{
      const first=el.dataset.dayEdit.indexOf("-");
      const ri=+el.dataset.dayEdit.slice(0,first);
      const key=el.dataset.dayEdit.slice(first+1);
      store.routines[ri][key]=el.value;
      saveStore();
    };
    el.addEventListener("input",save);
    el.addEventListener("change",()=>{save();renderRoutine();toast("Workout updated.");});
  });

  $$("[data-edit]").forEach(el=>{
    const save=()=>{
      const parts=el.dataset.edit.split("-");
      const ri=+parts.shift(), ei=+parts.shift(), key=parts.join("-");
      const e=store.routines[ri].exercises[ei];
      if(["sets","min","max","nextWeight","increment"].includes(key)){
        e[key]=el.value===""?null:num(el.value);
        if(key==="sets") e.sets=Math.max(1,Math.round(e.sets||1));
      }else{
        e[key]=el.value;
      }
      saveStore();
    };
    el.addEventListener("input",save);
    el.addEventListener("change",()=>{save();toast("Exercise updated.");});
  });

  $$("[data-delete-ex]").forEach(b=>b.addEventListener("click",()=>{
    const [ri,ei]=b.dataset.deleteEx.split("-").map(Number);
    if(confirm("Remove this exercise?")){
      store.routines[ri].exercises.splice(ei,1);
      saveStore();renderRoutine();toast("Exercise removed.");
    }
  }));

  $$("[data-add-ex]").forEach(b=>b.addEventListener("click",()=>{
    const ri=+b.dataset.addEx;
    store.routines[ri].exercises.push(ex(cryptoId(),"New Exercise",3,8,12,null,5,"reps","lb"));
    saveStore();renderRoutine();
  }));

  $$("[data-move-up]").forEach(b=>b.addEventListener("click",()=>moveExercise(b.dataset.moveUp,-1)));
  $$("[data-move-down]").forEach(b=>b.addEventListener("click",()=>moveExercise(b.dataset.moveDown,1)));

  $$("[data-day-up]").forEach(b=>b.addEventListener("click",()=>moveWorkoutDay(+b.dataset.dayUp,-1)));
  $$("[data-day-down]").forEach(b=>b.addEventListener("click",()=>moveWorkoutDay(+b.dataset.dayDown,1)));
  $$("[data-delete-day]").forEach(b=>b.addEventListener("click",()=>{
    const ri=+b.dataset.deleteDay;
    if(store.routines.length<=1){toast("Keep at least one workout day.");return;}
    if(confirm(`Delete ${store.routines[ri].name}?`)){
      store.routines.splice(ri,1);
      normalizeDayLabels();
      saveStore();renderAll();toast("Workout day deleted.");
    }
  }));

  $("#addWorkoutDay").addEventListener("click",()=>{
    const n=store.routines.length+1;
    store.routines.push({
      id:cryptoId(),
      name:"New Workout",
      label:`Day ${n}`,
      mainLift:"Add your main-lift note",
      exercises:[ex(cryptoId(),"New Exercise",3,8,12,null,5,"reps","lb")]
    });
    saveStore();renderAll();toast("Workout day added.");
  });

  $("#resetRoutine").addEventListener("click",()=>{
    if(confirm("Reset only the routine to the original preloaded plan? Workout history will stay.")){
      store.routines=deepClone(defaultRoutines);
      saveStore();renderAll();toast("Routine reset.");
    }
  });
}

function moveExercise(key,dir){
  const [ri,ei]=key.split("-").map(Number),arr=store.routines[ri].exercises,n=ei+dir;
  if(n<0||n>=arr.length)return;
  [arr[ei],arr[n]]=[arr[n],arr[ei]];
  saveStore();renderRoutine();
}

function moveWorkoutDay(index,dir){
  const next=index+dir;
  if(next<0||next>=store.routines.length)return;
  [store.routines[index],store.routines[next]]=[store.routines[next],store.routines[index]];
  normalizeDayLabels();
  saveStore();renderAll();toast("Workout order updated.");
}

function normalizeDayLabels(){
  store.routines.forEach((r,i)=>{
    if(/^Day \d+$/i.test(r.label||"")) r.label=`Day ${i+1}`;
  });
}

function exportData(){
  const blob=new Blob([JSON.stringify(store,null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`powerbuilding-backup-${todayISO()}.json`;a.click();URL.revokeObjectURL(a.href);
  toast("Backup exported.");
}
function importData(ev){
  const file=ev.target.files?.[0]; if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const data=JSON.parse(reader.result);
      if(!data.routines||!Array.isArray(data.sessions))throw new Error();
      store=data;saveStore();renderAll();closeModal("backupModal");toast("Backup imported.");
    }catch(e){alert("That file is not a valid Powerbuilding Tracker backup.");}
    ev.target.value="";
  };
  reader.readAsText(file);
}
function resetData(){closeModal("backupModal");openModal("confirmModal");}
function performReset(){store=freshStore();activeSession=null;saveStore();saveDraft();closeModal("confirmModal");renderAll();toast("All tracker data reset.");}

function lastSessionForRoutine(id){return store.sessions.find(s=>s.routineId===id);}
function nextDayId(lastId){const i=store.routines.findIndex(r=>r.id===lastId);return store.routines[(i+1+store.routines.length)%store.routines.length]?.id||"day1";}
function findRoutineExercise(id){for(const r of store.routines){const e=r.exercises.find(x=>x.id===id);if(e)return e;}return null;}
function findLastExercise(id){for(const s of store.sessions){const e=s.exercises.find(x=>x.exerciseId===id);if(e)return e;}return null;}
function lastExercisePerformance(id){const e=findLastExercise(id);return e?bestSetText(e):"";}
function bestSetText(e){
  const sets=e.sets.filter(s=>s.done);
  if(!sets.length)return "No completed sets";
  const best=[...sets].sort((a,b)=>(num(b.weight)-num(a.weight))||(num(b.value)-num(a.value)))[0];
  return `${formatWeight(best.weight,e.weightUnit)} × ${trimNum(best.value)} ${e.target.metric}`;
}
function allExercises(){
  const map=new Map();store.routines.forEach(r=>r.exercises.forEach(e=>map.set(e.id,e)));return [...map.values()];
}
function exercisePoints(id){
  return store.sessions.slice().reverse().flatMap(s=>{
    const e=s.exercises.find(x=>x.exerciseId===id);if(!e)return[];
    const weights=e.sets.filter(x=>x.done&&x.weight!=="").map(x=>num(x.weight)).filter(Number.isFinite);
    return weights.length?[{date:s.date,weight:Math.max(...weights)}]:[];
  });
}
function exerciseStats(id){
  let sessions=0,best=-Infinity,volume=0,last="—";
  store.sessions.forEach(s=>{
    const e=s.exercises.find(x=>x.exerciseId===id);if(!e)return;
    const sets=e.sets.filter(x=>x.done);if(!sets.length)return;
    sessions++;if(last==="—")last=shortDate(s.date);
    sets.forEach(x=>{const w=num(x.weight),v=num(x.value);if(Number.isFinite(w)){best=Math.max(best,w);if(e.target.metric==="reps"&&Number.isFinite(v))volume+=w*v;}})
  });
  return {sessions,best:best===-Infinity?"—":trimNum(best),volume:volume?compact(volume):"—",last};
}
function thisWeekCount(){
  const now=new Date(),day=(now.getDay()+6)%7,start=new Date(now);start.setHours(0,0,0,0);start.setDate(now.getDate()-day);
  return store.sessions.filter(s=>new Date(s.date+"T12:00:00")>=start).length;
}
function totalCompletedSets(){return store.sessions.reduce((n,s)=>n+s.exercises.reduce((a,e)=>a+e.sets.filter(x=>x.done).length,0),0);}
function targetText(t){return t.min===t.max?`${t.min} ${t.metric}`:`${t.min}–${t.max} ${t.metric}`;}
function formatWeight(v,u){return v===null||v===""?"—":`${trimNum(v)} ${u}`;}
function baseWeight(e){const vals=e.sets.map(s=>num(s.weight)).filter(Number.isFinite);return vals.length?Math.max(...vals):null;}
function roundTo(v,inc){if(!inc)return v;const d=(String(inc).split(".")[1]||"").length;return +((Math.round(v/inc)*inc).toFixed(d));}
function num(v){const n=parseFloat(v);return Number.isFinite(n)?n:NaN;}
function trimNum(v){const n=num(v);return Number.isFinite(n)?String(+n.toFixed(2)):"—";}
function compact(n){return Intl.NumberFormat("en",{notation:"compact",maximumFractionDigits:1}).format(n);}
function todayISO(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function shortDate(iso){return new Date(iso+"T12:00:00").toLocaleDateString(undefined,{month:"short",day:"numeric"});}
function longDate(iso){return new Date(iso+"T12:00:00").toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric",year:"numeric"});}
function cryptoId(){return (crypto.randomUUID?.()||`${Date.now()}-${Math.random()}`).replaceAll(".","");}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function attr(v){return esc(v).replace(/`/g,"&#096;");}
function openModal(id){$("#"+id)?.classList.add("open");}
function closeModal(id){$("#"+id)?.classList.remove("open");}
let toastTimer;
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),1800);}
