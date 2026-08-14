const DEFAULT = [
  {id:'health', title:'Health', subs:['RHR','VO2Max','Weight','Latest Health Report','Daily Exercises','Nutrition']},
  {id:'morning', title:'Morning Rituals', subs:['Gratitude','Meditation','Affirmations','Journal']},
  {id:'plan', title:'Plan My Day', subs:['To Do List','One Thing for Day']},
  {id:'reflection', title:'Reflection', subs:['Daily','Weekly','Monthly']},
  {id:'goals', title:'Goals', subs:['Weekly','Monthly','Yearly']},
  {id:'research', title:'Research', subs:['Daily','Weekly','Monthly']},
  {id:'books', title:'Books', subs:['To Read','Completed']},
  {id:'visualization', title:'Visualization', subs:['Gallery','Vision Board']},
  {id:'productivity', title:'Productivity Methods', subs:['Deep Work','Pomodoro','Eisenhower Matrix','Time Blocking','Two-Minute Rule']},
  {id:'habits', title:'Habits', subs:['Tracker','Streaks']},
  {id:'mood', title:'Mood', subs:['Daily Mood','Mood Notes']},
  {id:'sleep', title:'Sleep', subs:['Sleep Quality','Sleep Notes']},
  {id:'hydration', title:'Hydration', subs:['Water Intake']}
];

const QUOTES = [
  "Clarity precedes mastery — decide, then do.",
  "You do not rise to the level of your goals. You fall to the level of your systems.",
  "Protect your attention; it is your most valuable asset.",
  "Small daily improvements lead to stunning results.",
  "Ship imperfectly, learn quickly, iterate boldly."
];

const STORAGE_KEY = 'kokovix.sections.v1';

function uid(prefix='id'){return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2,6)}

function loadState(){
  const s = localStorage.getItem(STORAGE_KEY);
  if(!s){ return JSON.parse(JSON.stringify(DEFAULT)); }
  try{ return JSON.parse(s); }catch(e){ return JSON.parse(JSON.stringify(DEFAULT)); }
}

// load state and normalize duplicates
function loadAndNormalize(){
  const raw = loadState();
  const norm = normalizeSections(raw.concat([]));
  saveState(norm);
  return norm;
}

function normalizeSections(arr){
  const map = new Map();
  arr.forEach(s=>{
    const key = (s.title||'').toString().trim().toLowerCase();
    if(!map.has(key)) map.set(key, {id:s.id||uid('s_'), title:s.title, subs: Array.isArray(s.subs)?s.subs.slice():[] });
    else { // merge subs
      const existing = map.get(key);
      (s.subs||[]).forEach(sub=>{ if(!existing.subs.includes(sub)) existing.subs.push(sub); });
    }
  });
  return Array.from(map.values());
}

function saveState(data){ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

function el(tag, cls, txt){const e=document.createElement(tag); if(cls) e.className=cls; if(txt!==undefined) e.textContent=txt; return e}

let SECTIONS = loadAndNormalize();

function renderSidebar(){
  const list = document.getElementById('sectionsList'); list.innerHTML='';
  SECTIONS.forEach(sec=>{
    const li = el('li','section-item');
    // drag now initiated from handle for clearer UX
    li.dataset.id = sec.id;
    li.addEventListener('dragover',(e)=> onDragOver(e));
    li.addEventListener('dragenter',(e)=>{ li.classList.add('drag-over'); });
    li.addEventListener('dragleave',(e)=>{ li.classList.remove('drag-over'); });
    li.addEventListener('drop',(e)=> onSectionDrop(e, sec.id));
    const header = el('div','section-header');
    const handle = el('button','drag-handle','≡'); handle.title='Drag to reorder'; header.appendChild(handle);
    handle.addEventListener('mousedown', (e)=> e.preventDefault());
    handle.addEventListener('dragstart', (e)=>{});
    handle.addEventListener('pointerdown', ()=>{ li.draggable = true; });
    handle.addEventListener('pointerup', ()=>{ li.draggable = false; });
    handle.addEventListener('dragstart',(e)=> onSectionDragStart(e, sec.id));
    const title = el('span','section-title',sec.title);
    title.title = 'Click to open section';
    title.addEventListener('click', ()=> toggleExpand(sec.id));

    // inline edit on double-click
    title.addEventListener('dblclick', ()=>{
      const inp = el('input','section-edit'); inp.value = sec.title; header.replaceChild(inp, title); inp.focus();
      inp.addEventListener('blur', ()=>{ if(inp.value.trim()) sec.title = inp.value.trim(); saveState(SECTIONS); renderSidebar(); });
      inp.addEventListener('keydown',(e)=>{ if(e.key==='Enter'){ inp.blur(); } });
    });

    const chevron = el('button','chev','▸'); chevron.addEventListener('click', ()=> toggleExpand(sec.id));
    const right = el('div','sec-right');
    const addSub = el('button','icon','＋'); addSub.title='Add subsection'; addSub.addEventListener('click', (e)=>{ e.stopPropagation(); addSubInline(sec.id); });
    const del = el('button','icon','✕'); del.title='Delete section'; del.addEventListener('click',(e)=>{ e.stopPropagation(); deleteSection(sec.id); });
    right.appendChild(addSub); right.appendChild(del);

    header.appendChild(chevron); header.appendChild(title); header.appendChild(right);
    li.appendChild(header);

    const sublist = el('ul','sub-list'); sublist.style.display = sec._open ? 'block' : 'none';
    sec.subs.forEach((s, idx)=>{
      const si = el('li','sub-item'); si.draggable = true; si.dataset.sid = sec.id; si.dataset.subidx = idx;
      si.addEventListener('dragstart',(e)=> onSubDragStart(e, sec.id, idx));
      si.addEventListener('dragover',(e)=> onDragOver(e));
      si.addEventListener('dragenter',(e)=>{ si.classList.add('drag-over'); });
      si.addEventListener('dragleave',(e)=>{ si.classList.remove('drag-over'); });
      si.addEventListener('drop',(e)=> onSubDrop(e, sec.id, idx));
      const sn = el('span','sub-name', s);
      sn.addEventListener('click', ()=> openSubsection(sec.id, s));
      sn.addEventListener('dblclick', ()=>{ // inline edit
        const inp = el('input','sub-edit'); inp.value = s; si.replaceChild(inp, sn); inp.focus();
        inp.addEventListener('blur', ()=>{ if(inp.value.trim()){ sec.subs[idx]=inp.value.trim(); saveState(SECTIONS); renderSidebar(); openSubsection(sec.id, sec.subs[idx]); } else renderSidebar(); });
        inp.addEventListener('keydown',(e)=>{ if(e.key==='Enter') inp.blur(); });
      });
      const sdel = el('button','icon small','−'); sdel.title='Delete subsection'; sdel.addEventListener('click',(e)=>{ e.stopPropagation(); if(confirm('Delete subsection?')){ sec.subs.splice(idx,1); saveState(SECTIONS); renderSidebar(); }});
      si.appendChild(sn); si.appendChild(sdel); sublist.appendChild(si);
    });

    li.appendChild(sublist);
    list.appendChild(li);
  });
}

// Drag helpers for sections
let dragSectionId = null;
function onSectionDragStart(e, id){ dragSectionId = id; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', id); }
function onDragOver(e){ e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }
function onSectionDrop(e, targetId){ e.preventDefault(); if(!dragSectionId || dragSectionId===targetId) return; const fromIdx = SECTIONS.findIndex(s=>s.id===dragSectionId); const toIdx = SECTIONS.findIndex(s=>s.id===targetId); if(fromIdx<0||toIdx<0) return; const [item] = SECTIONS.splice(fromIdx,1); SECTIONS.splice(toIdx,0,item); saveState(SECTIONS); renderSidebar(); dragSectionId = null; }

// Drag helpers for subsections
let dragSub = null; // {sectionId, index}
function onSubDragStart(e, sectionId, idx){ dragSub = {sectionId, idx}; e.dataTransfer.effectAllowed='move'; }
function onSubDrop(e, targetSectionId, targetIdx){ e.preventDefault(); if(!dragSub) return; const fromSec = SECTIONS.find(s=>s.id===dragSub.sectionId); const toSec = SECTIONS.find(s=>s.id===targetSectionId); if(!fromSec||!toSec) return; const [item] = fromSec.subs.splice(dragSub.idx,1); if(targetSectionId===dragSub.sectionId){ // same section
  fromSec.subs.splice(targetIdx,0,item);
} else {
  toSec.subs.splice(targetIdx,0,item);
}
saveState(SECTIONS); renderSidebar(); dragSub = null; }

// IndexedDB helper for visuals
const IDB_NAME = 'kokovix_db'; const IDB_STORE = 'visuals';
function idbOpen(){ return new Promise((res, rej)=>{ const r = indexedDB.open(IDB_NAME, 1); r.onupgradeneeded = ()=>{ r.result.createObjectStore(IDB_STORE, {keyPath:'id'}); }; r.onsuccess = ()=> res(r.result); r.onerror = ()=> rej(r.error); }); }
async function idbAddImage(img){ const db = await idbOpen(); return new Promise((res, rej)=>{ const tx = db.transaction(IDB_STORE,'readwrite'); const store = tx.objectStore(IDB_STORE); const req = store.add(img); req.onsuccess = ()=> res(true); req.onerror = ()=> rej(req.error); }); }
async function idbGetAll(){ const db = await idbOpen(); return new Promise((res, rej)=>{ const tx = db.transaction(IDB_STORE,'readonly'); const store = tx.objectStore(IDB_STORE); const req = store.getAll(); req.onsuccess = ()=> res(req.result); req.onerror = ()=> rej(req.error); }); }
async function idbDelete(id){ const db = await idbOpen(); return new Promise((res, rej)=>{ const tx = db.transaction(IDB_STORE,'readwrite'); const store = tx.objectStore(IDB_STORE); const req = store.delete(id); req.onsuccess = ()=> res(true); req.onerror = ()=> rej(req.error); }); }

function toggleExpand(sectionId){
  SECTIONS = SECTIONS.map(s=>{ if(s.id===sectionId) s._open = !s._open; else s._open = s._open || false; return s });
  renderSidebar();
}

function addSubInline(sectionId){
  const sec = SECTIONS.find(s=>s.id===sectionId); if(!sec) return; const title = prompt('New subsection title'); if(title){ sec.subs.push(title); saveState(SECTIONS); renderSidebar(); toggleExpand(sectionId); openSubsection(sectionId, title); }
}

function addSection(title){
  if(!title) return;
  const sec = {id:uid('s_'), title, subs:[], meta:{}};
  SECTIONS.push(sec); saveState(SECTIONS); renderSidebar();
}

function renameSectionPrompt(id){
  const sec = SECTIONS.find(s=>s.id===id); if(!sec) return;
  const val = prompt('Rename section', sec.title); if(val) {sec.title=val; saveState(SECTIONS); renderSidebar();}
}

function deleteSection(id){ if(!confirm('Delete section and all subsections?')) return; SECTIONS=SECTIONS.filter(s=>s.id!==id); saveState(SECTIONS); renderSidebar(); document.getElementById('content').innerHTML='<p>Select or create a section from the left to get started.</p>'; }

function addSubsectionPrompt(sectionId){
  const name = prompt('Subsection title'); if(!name) return; const sec = SECTIONS.find(s=>s.id===sectionId);
  sec.subs.push(name); saveState(SECTIONS); renderSidebar(); openSection(sectionId);
}

function openSubsection(sectionId, sub){
  const sec = SECTIONS.find(s=>s.id===sectionId); if(!sec) return; if(!sec.subs.includes(sub)) return;
  // Special case: Meditation timer UI
  if(sectionId==='morning' && /meditat/i.test(sub)){
    return openMeditation(sectionId, sub);
  }
  const title = document.getElementById('page-title'); title.textContent = `${sec.title} — ${sub}`;
  const content = document.getElementById('content'); content.innerHTML = '';
  const bc = el('div','breadcrumb',`Home / ${sec.title} / ${sub}`); content.appendChild(bc);

  const container = el('div','card single-sub');
  const h = el('h2',null,sub); container.appendChild(h);

  const key = `kokovix.entry.${sec.id}.${sub}`;
  const area = el('textarea','sub-input',''); area.placeholder='Write notes, details, or status for this subsection.';
  area.style.width='100%'; area.style.height='160px';
  const saved = localStorage.getItem(key);
  if(saved) area.value = saved;
  container.appendChild(area);

  if(sec.id==='health' || sec.title.toLowerCase().includes('health')){
    const fldWrap = el('div','health-fields');
    const rhr = el('input','health-field',''); rhr.placeholder='RHR'; rhr.value = localStorage.getItem(key + '.rhr')||'';
    const vo2 = el('input','health-field',''); vo2.placeholder='VO2Max'; vo2.value = localStorage.getItem(key + '.vo2')||'';
    const weight = el('input','health-field',''); weight.placeholder='Weight'; weight.value = localStorage.getItem(key + '.weight')||'';
    const file = el('input','health-file',''); file.type='file'; file.addEventListener('change',(e)=>{ const f = e.target.files[0]; if(!f) return; const reader = new FileReader(); reader.onload = () => { localStorage.setItem(key+'.file', reader.result); alert('Health report saved locally'); }; reader.readAsDataURL(f); });
    fldWrap.appendChild(rhr); fldWrap.appendChild(vo2); fldWrap.appendChild(weight); fldWrap.appendChild(file);
    container.appendChild(fldWrap);
    rhr.addEventListener('input', ()=> localStorage.setItem(key+'.rhr', rhr.value));
    vo2.addEventListener('input', ()=> localStorage.setItem(key+'.vo2', vo2.value));
    weight.addEventListener('input', ()=> localStorage.setItem(key+'.weight', weight.value));
  }

  const actions = el('div','action-row');
  const saveBtn = el('button','btn','Save');
  const addEntryBtn = el('button','btn small','Add history');
  const clearBtn = el('button','btn small','Clear');
  actions.appendChild(saveBtn); actions.appendChild(addEntryBtn); actions.appendChild(clearBtn);
  container.appendChild(actions);

  const histWrap = el('div','history'); const htitle = el('h4',null,'History'); const hlist = el('ul','history-list'); histWrap.appendChild(htitle); histWrap.appendChild(hlist); container.appendChild(histWrap);

  function loadHistory(){ const raw = localStorage.getItem(key + '.history'); const arr = raw ? JSON.parse(raw) : []; hlist.innerHTML=''; arr.slice().reverse().forEach((item, idx)=>{ const li = el('li','history-item', `${new Date(item.t).toLocaleString()} — ${item.status || 'saved'} ${item.comments? '- '+item.comments: ''}`); const edit = el('button','icon small','✎'); edit.title='Edit comments'; edit.addEventListener('click', ()=>{ const newC = prompt('Edit comments', item.comments||''); if(newC!==null){ item.comments=newC; arr[arr.length-1-idx]=item; saveHistory(arr); loadHistory(); } }); const del = el('button','icon small','✕'); del.title='Delete entry'; del.addEventListener('click', ()=>{ if(confirm('Delete this history entry?')){ arr.splice(arr.length-1-idx,1); saveHistory(arr); loadHistory(); }}); li.appendChild(edit); li.appendChild(del); hlist.appendChild(li); }); }
  function saveHistory(arr){ localStorage.setItem(key + '.history', JSON.stringify(arr)); }

  saveBtn.addEventListener('click', ()=>{ localStorage.setItem(key, area.value); const raw = localStorage.getItem(key + '.history'); const arr = raw?JSON.parse(raw):[]; arr.push({t:Date.now(), status:'saved', comments: ''}); saveHistory(arr); loadHistory(); });
  addEntryBtn.addEventListener('click', ()=>{ const status = prompt('Status (e.g., done, in-progress)'); if(status===null) return; const comments = prompt('Optional comments')||''; const raw = localStorage.getItem(key + '.history'); const arr = raw?JSON.parse(raw):[]; arr.push({t:Date.now(), status, comments}); saveHistory(arr); loadHistory(); });
  clearBtn.addEventListener('click', ()=>{ if(confirm('Clear content for this subsection?')){ area.value=''; localStorage.removeItem(key); } });

  loadHistory();
  content.appendChild(container);
}

function openMeditation(sectionId, sub){
  const key = `kokovix.timer.${sectionId}.${sub}`;
  const content = document.getElementById('content'); content.innerHTML='';
  const bc = el('div','breadcrumb',`Home / Morning Rituals / ${sub}`); content.appendChild(bc);
  const box = el('div','card'); const h = el('h2',null,sub); box.appendChild(h);

  const controls = el('div','med-controls');
  const input = el('input','timer-input'); input.type='number'; input.min=1; input.value = localStorage.getItem(key + '.mins') || 10; input.title='Minutes';
  const start = el('button','btn','Start'); const stop = el('button','btn small','Stop'); const reset = el('button','btn small','Reset');
  const display = el('div','timer-display', formatTime((parseInt(input.value)||10)*60));
  controls.appendChild(input); controls.appendChild(start); controls.appendChild(stop); controls.appendChild(reset); box.appendChild(controls); box.appendChild(display);

  let timerId = null; let remaining = (parseInt(input.value)||10)*60;
  function tick(){ remaining--; display.textContent = formatTime(remaining); if(remaining<=0){ clearInterval(timerId); timerId=null; recordSession('completed'); alert('Meditation complete'); }}
  start.addEventListener('click', ()=>{ if(timerId) return; remaining = (parseInt(input.value)||10)*60; display.textContent = formatTime(remaining); timerId = setInterval(tick,1000); localStorage.setItem(key + '.mins', input.value); });
  stop.addEventListener('click', ()=>{ if(!timerId) return; clearInterval(timerId); timerId=null; recordSession('stopped'); });
  reset.addEventListener('click', ()=>{ if(timerId){ clearInterval(timerId); timerId=null; } remaining = (parseInt(input.value)||10)*60; display.textContent = formatTime(remaining); });

  function formatTime(s){ const m = Math.floor(s/60); const sec = s%60; return `${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`; }

  function recordSession(status){ const raw = localStorage.getItem(key + '.history'); const arr = raw?JSON.parse(raw):[]; arr.push({t:Date.now(), mins: parseInt(input.value)||0, status}); localStorage.setItem(key + '.history', JSON.stringify(arr)); }

  // show recent sessions
  const sessWrap = el('div','card'); const sh = el('h4',null,'Sessions'); const sl = el('ul','history-list'); sessWrap.appendChild(sh); sessWrap.appendChild(sl);
  function loadSessions(){ const raw = localStorage.getItem(key + '.history'); const arr = raw?JSON.parse(raw):[]; sl.innerHTML=''; arr.slice().reverse().forEach(it=>{ const li = el('li','history-item', `${new Date(it.t).toLocaleString()} — ${it.mins} min — ${it.status}`); sl.appendChild(li); }); }
  loadSessions();

  box.appendChild(sessWrap);
  content.appendChild(box);
}

// Visualization gallery handler
function openVisualization(sectionId, sub){
  const keyRoot = `kokovix.entry.${sectionId}.visual`;
  const content = document.getElementById('content'); content.innerHTML='';
  const bc = el('div','breadcrumb',`Home / Visualization / ${sub}`); content.appendChild(bc);

  const wrap = el('div','card');
  const h = el('h2',null, sub === 'Gallery' ? 'Gallery' : 'Vision Board'); wrap.appendChild(h);

  // uploader
  const uploader = el('div','uploader');
  const file = el('input'); file.type='file'; file.accept='image/*'; file.multiple=true;
  const drop = el('div','drop','Drag & drop images here or click to upload');
  drop.addEventListener('click', ()=> file.click());
  drop.addEventListener('dragover', (e)=>{ e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', ()=> drop.classList.remove('over'));
  drop.addEventListener('drop', (e)=>{ e.preventDefault(); drop.classList.remove('over'); handleFiles(e.dataTransfer.files); });
  file.addEventListener('change', (e)=> handleFiles(e.target.files));
  uploader.appendChild(drop); uploader.appendChild(file); wrap.appendChild(uploader);

  const gallery = el('div','vis-gallery'); wrap.appendChild(gallery);

  async function loadImages(){
    gallery.innerHTML='';
    const arr = await idbGetAll();
    arr.slice().reverse().forEach(img=>{
      const card = el('div','vis-card'); const timg = el('img'); timg.src = URL.createObjectURL(img.blob); timg.alt = img.caption||''; card.appendChild(timg);
      const meta = el('div','vis-meta', img.caption||'');
      const del = el('button','icon small','✕'); del.title='Delete'; del.addEventListener('click', async ()=>{ if(confirm('Delete image?')){ await idbDelete(img.id); loadImages(); } });
      const feat = el('button','btn small','Set featured'); feat.addEventListener('click', ()=>{ localStorage.setItem(keyRoot + '.featured', img.id); alert('Set as featured visualization'); });
      card.appendChild(meta); card.appendChild(feat); card.appendChild(del);
      timg.addEventListener('click', ()=> openLightbox(img));
      gallery.appendChild(card);
    });
  }

  function handleFiles(files){
    Array.from(files).forEach(f=>{
      const reader = new FileReader(); reader.onload = async ()=>{
        const blob = dataURLtoBlob(reader.result);
        await idbAddImage({id: uid('img_'), blob, caption: f.name, t:Date.now()});
        loadImages();
      };
      reader.readAsDataURL(f);
    });
  }

  function openLightbox(img){
    const modal = el('div','lightbox'); const imgEl = el('img');
    if(img.blob) imgEl.src = URL.createObjectURL(img.blob); else imgEl.src = img.data || '';
    modal.appendChild(imgEl);
    const close = el('button','icon close','✕'); close.addEventListener('click', ()=> modal.remove()); modal.appendChild(close);
    document.body.appendChild(modal);
  }

  function dataURLtoBlob(dataurl){ const arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1], bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n); while(n--){ u8arr[n] = bstr.charCodeAt(n); } return new Blob([u8arr], {type:mime}); }

  loadImages();
  content.appendChild(wrap);
}

// Hook openSubsection to visualization
const oldOpen = openSubsection;
openSubsection = function(sectionId, sub){
  const sec = SECTIONS.find(s=>s.id===sectionId);
  if(sec && sec.id==='visualization') return openVisualization(sectionId, sub);
  return oldOpen(sectionId, sub);
}

// initial UI wiring
window.addEventListener('DOMContentLoaded', ()=>{
  renderSidebar();
  document.getElementById('addSectionBtn').addEventListener('click', ()=>{
    const v = document.getElementById('newSectionTitle').value.trim(); if(!v) return alert('Enter a title'); addSection(v); document.getElementById('newSectionTitle').value='';
  });
  // import/export wiring
  const exportBtn = document.getElementById('exportBtn'); const importBtn = document.getElementById('importBtn'); const importFile = document.getElementById('importFile');
  if(exportBtn){ exportBtn.addEventListener('click', exportJSON); }
  if(importBtn && importFile){ importBtn.addEventListener('click', ()=> importFile.click()); importFile.addEventListener('change', (e)=>{ if(e.target.files.length) importJSONFile(e.target.files[0]); }); }
  // Build legacy nav (optional)
  buildLegacyNav();
  // Quote rotation
  const qEl = document.getElementById('quote'); if(qEl){ qEl.textContent = QUOTES[Math.floor(Math.random()*QUOTES.length)]; setInterval(()=>{ qEl.textContent = QUOTES[Math.floor(Math.random()*QUOTES.length)]; }, 8000); }
});

// Export current workspace (sections + localStorage keys + visuals)
async function exportJSON(){
  const data = {sections: SECTIONS, storage:{}, visuals:[]};
  // include kokovix keys
  Object.keys(localStorage).forEach(k=>{ if(k.startsWith('kokovix.')) data.storage[k]=localStorage.getItem(k); });
  // include visuals from IDB
  try{ const imgs = await idbGetAll(); for(const im of imgs){ let dataURL = ''; if(im.blob){ dataURL = await blobToDataURL(im.blob); } data.visuals.push({id:im.id, caption:im.caption, data: dataURL, t:im.t}); } }catch(e){console.warn('idb export failed',e)}
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'kokovix-backup.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

function blobToDataURL(blob){ return new Promise((res)=>{ const r = new FileReader(); r.onload = ()=> res(r.result); r.readAsDataURL(blob); }); }

async function importJSONFile(file){ const txt = await file.text(); try{ const obj = JSON.parse(txt); if(obj.sections) { SECTIONS = normalizeSections(obj.sections); saveState(SECTIONS); renderSidebar(); } if(obj.storage){ Object.keys(obj.storage).forEach(k=> localStorage.setItem(k, obj.storage[k])); }
    if(obj.visuals && Array.isArray(obj.visuals)){ for(const im of obj.visuals){ if(im.data){ const blob = dataURLtoBlob(im.data); await idbAddImage({id:im.id||uid('img_'), blob, caption:im.caption||'', t:im.t||Date.now()}); } }
    }
    alert('Import complete — UI refreshed');
  }catch(e){ alert('Import failed: '+e.message); }
}

// keep previous nav for compatibility with some pages
function buildLegacyNav(){
  const nav = document.getElementById('nav'); if(!nav) return;
  SECTIONS.forEach(section=>{
    const wrap = el('div','nav-section');
    const btn = el('div','nav-button');
    const left = el('div','label',section.title);
    left.classList.add('label'); btn.appendChild(left);
    const chev = el('div','chev','▸'); btn.appendChild(chev);
    btn.addEventListener('click', ()=>{ const list = wrap.querySelector('.sub-list'); const open = list.style.display==='flex'; document.querySelectorAll('.sub-list').forEach(s=>s.style.display='none'); document.querySelectorAll('.nav-button .chev').forEach(c=>c.textContent='▸'); if(!open){ list.style.display='flex'; chev.textContent='▾' } else { list.style.display='none'; chev.textContent='▸' } });
    const sub = el('div','sub-list');
    section.subs.forEach(s=>{ const item = el('div','sub-item',s); item.addEventListener('click', ()=> openSection(section.id)); sub.appendChild(item); });
    wrap.appendChild(btn); wrap.appendChild(sub); nav.appendChild(wrap);
  });
}
