const DEFAULT = [
  {id:'morning', title:'Morning Rituals', category:'Core', pillar:'Discipline', icon:'🌅', subs:['Gratitude','Meditation','Affirmations','Journal']},
  {id:'plan', title:'Plan My Day', category:'Core', pillar:'Discipline', icon:'🗓️', subs:['One Thing','To Do List','Time Blocks']},
  {id:'night', title:'Night Rituals', category:'Core', pillar:'Discipline', icon:'🌙', subs:['Reflection','Sleep Notes']},

  {id:'health', title:'Health', category:'Health', pillar:'Health', icon:'❤️', subs:['RHR','VO2Max','Weight','Latest Health Report','Daily Exercises','Nutrition','Sleep','Hydration']},
  {id:'habits', title:'Habits', category:'Habits & Mood', pillar:'Discipline', icon:'🔁', subs:['Tracker','Streaks']},
  {id:'mood', title:'Mood', category:'Habits & Mood', pillar:'Mind & Emotions', icon:'🙂', subs:['Daily Mood','Mood Notes']},

  {id:'goals', title:'Goals', category:'Goals & Reviews', pillar:'Discipline', icon:'🎯', subs:['Weekly','Monthly','Yearly']},
  {id:'reflection', title:'Reflection', category:'Goals & Reviews', pillar:'Mind & Emotions', icon:'🔍', subs:['Daily','Weekly','Monthly','Action Items']},

  {id:'projects', title:'Projects', category:'Work & Learning', pillar:'Career (Trading)', icon:'💼', subs:['Active Projects','Backlog']},
  {id:'research', title:'Research', category:'Work & Learning', pillar:'Career (Trading)', icon:'🔬', subs:['Notes','Papers','Strategy Journal']},
  {id:'learning', title:'Learning', category:'Work & Learning', pillar:'Career (Trading)', icon:'📚', subs:['Courses','Reading List','Flashcards']},

  {id:'finance', title:'Finance', category:'Finance & Trading', pillar:'Finance & Investments', icon:'💳', subs:['Expenses','Budgets','Subscriptions']},
  {id:'trading', title:'Trading', category:'Finance & Trading', pillar:'Career (Trading)', icon:'📈', subs:['Strategies','Trade Journal','Watchlist','Backtests']},

  {id:'content', title:'Content Calendar', category:'Content & Social', pillar:'Contribution', icon:'✍️', subs:['Ideas','Schedule','Published']},
  {id:'social', title:'Social', category:'Content & Social', pillar:'Relationships & Network', icon:'📊', subs:['Analytics','Subscriptions','Screen Time']},

  {id:'notes', title:'Notes', category:'Personal Knowledge', pillar:'Mind & Emotions', icon:'🗒️', subs:['Quick Notes','Templates','Archive']},
  {id:'resources', title:'Resources', category:'Personal Knowledge', pillar:'Mind & Emotions', icon:'🔗', subs:['Links','Tools','References']},

  {id:'visualization', title:'Visualization', category:'Visualization & Media', pillar:'Mind & Emotions', icon:'🖼️', subs:['Gallery','Vision Board']},
  {id:'productivity', title:'Productivity Methods', category:'Productivity Toolbox', pillar:'Discipline', icon:'🧰', subs:['Pomodoro','Deep Work','Eisenhower Matrix','Time Blocking']}
];

const PILLARS = [
  {id:'health', title:'Health', tagline:'Health = Wealth', color:'#e25656', icon:'❤️'},
  {id:'mind', title:'Mind & Emotions', tagline:'Mind = Self Control', color:'#7d5fff', icon:'🧠'},
  {id:'relationships', title:'Relationships & Network', tagline:'Relationships = Growth Network', color:'#ffaf3e', icon:'🤝'},
  {id:'discipline', title:'Discipline', tagline:'Discipline = Success System', color:'#22c1c3', icon:'⏱️'},
  {id:'career', title:'Career (Trading)', tagline:'Trading = Mastery', color:'#2ecc71', icon:'📈'},
  {id:'finance', title:'Finance & Investments', tagline:'Finance = Freedom', color:'#f39c12', icon:'💰'},
  {id:'contribution', title:'Contribution', tagline:'Contribution = Legacy', color:'#9b59b6', icon:'🌱'}
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
    if(!map.has(key)) map.set(key, {id:s.id||uid('s_'), title:s.title, subs: Array.isArray(s.subs)?s.subs.slice():[], category: s.category||'Other', icon: s.icon||'', pillar: s.pillar||null });
    else { // merge subs and metadata
      const existing = map.get(key);
      (s.subs||[]).forEach(sub=>{ if(!existing.subs.includes(sub)) existing.subs.push(sub); });
      if(s.category) existing.category = existing.category || s.category;
      if(s.icon) existing.icon = existing.icon || s.icon;
      if(s.pillar) existing.pillar = existing.pillar || s.pillar;
    }
  });
  return Array.from(map.values());
}

function saveState(data){ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

function el(tag, cls, txt){const e=document.createElement(tag); if(cls) e.className=cls; if(txt!==undefined) e.textContent=txt; return e}

let SECTIONS = loadAndNormalize();
// Safety fallback: if storage was corrupted or empty, restore DEFAULT sections
if(!SECTIONS || !Array.isArray(SECTIONS) || SECTIONS.length===0){
  SECTIONS = JSON.parse(JSON.stringify(DEFAULT));
  saveState(SECTIONS);
  console.info('kokovix: restored default sections due to empty state');
}
let activePillar = null;

function renderSidebar(){
  const list = document.getElementById('sectionsList'); list.innerHTML='';
  // dedupe
  const unique = [];
  const seen = new Set();
  SECTIONS.forEach(s=>{ const k=(s.title||'').toString().trim().toLowerCase(); if(!seen.has(k)){ seen.add(k); unique.push(Object.assign({}, s)); } else { const ex = unique.find(u=> (u.title||'').toString().trim().toLowerCase()===k); if(ex){ (s.subs||[]).forEach(sub=>{ if(!ex.subs.includes(sub)) ex.subs.push(sub); }); if(s.pillar) ex.pillar = ex.pillar || s.pillar; if(s.icon) ex.icon = ex.icon || s.icon; } } });
  // group by pillars (in PILLARS order)
  const pillarMap = new Map();
  PILLARS.forEach(p=> pillarMap.set(p.title, []));
  const other = [];
  unique.forEach(s=>{ if(s.pillar && pillarMap.has(s.pillar)) pillarMap.get(s.pillar).push(s); else other.push(s); });
  PILLARS.forEach(p=>{
    let items = pillarMap.get(p.title) || [];
    if(items.length===0) return;
    if(activePillar && activePillar!==p.title) items = items.filter(i=> i.pillar===activePillar);
    const gh = el('div','group-header'); gh.innerHTML = `<strong>${p.icon} ${p.title}</strong> <div style="font-size:12px;color:var(--muted)">${p.tagline}</div>`;
    list.appendChild(gh);
    items.forEach(sec=>{
      const li = el('li','section-item'); li.dataset.id = sec.id;
      li.addEventListener('dragover',(e)=> onDragOver(e)); li.addEventListener('dragenter',(e)=> li.classList.add('drag-over')); li.addEventListener('dragleave',(e)=> li.classList.remove('drag-over')); li.addEventListener('drop',(e)=> onSectionDrop(e, sec.id));
      const header = el('div','section-header');
      const handle = el('button','drag-handle','≡'); handle.title='Drag to reorder'; header.appendChild(handle); handle.addEventListener('mousedown',(e)=>e.preventDefault()); handle.addEventListener('pointerdown', ()=>{ li.draggable=true; }); handle.addEventListener('pointerup', ()=>{ li.draggable=false; }); handle.addEventListener('dragstart',(e)=> onSectionDragStart(e, sec.id));
      const chevron = el('button','chev','▸'); chevron.addEventListener('click', ()=> toggleExpand(sec.id));
      const iconEl = el('span','section-icon', sec.icon || '');
      const title = el('span','section-title', sec.title); title.title='Click to open section'; title.addEventListener('click', ()=> toggleExpand(sec.id));
      const right = el('div','sec-right'); const addSub = el('button','icon','＋'); addSub.title='Add subsection'; addSub.addEventListener('click',(e)=>{ e.stopPropagation(); addSubInline(sec.id); }); const del = el('button','icon','✕'); del.title='Delete section'; del.addEventListener('click',(e)=>{ e.stopPropagation(); deleteSection(sec.id); }); right.appendChild(addSub); right.appendChild(del);
      header.appendChild(chevron); header.appendChild(iconEl); header.appendChild(title); header.appendChild(right);
      li.appendChild(header);
      const sublist = el('ul','sub-list'); sublist.style.display = sec._open ? 'block' : 'none';
      sec.subs.forEach((s, idx)=>{ const si = el('li','sub-item'); si.draggable=true; si.dataset.sid=sec.id; si.dataset.subidx=idx; si.addEventListener('dragstart',(e)=> onSubDragStart(e, sec.id, idx)); si.addEventListener('dragover',(e)=> onDragOver(e)); si.addEventListener('dragenter',(e)=> si.classList.add('drag-over')); si.addEventListener('dragleave',(e)=> si.classList.remove('drag-over')); si.addEventListener('drop',(e)=> onSubDrop(e, sec.id, idx)); const sn = el('span','sub-name', s); sn.addEventListener('click', ()=> openSubsection(sec.id, s)); const sdel = el('button','icon small','−'); sdel.title='Delete subsection'; sdel.addEventListener('click',(e)=>{ e.stopPropagation(); if(confirm('Delete subsection?')){ sec.subs.splice(idx,1); saveState(SECTIONS); renderSidebar(); }}); si.appendChild(sn); si.appendChild(sdel); sublist.appendChild(si); });
      li.appendChild(sublist); list.appendChild(li);
    });
  });
  // other bucket
  if(other.length){ const gh = el('div','group-header','Other'); list.appendChild(gh); other.forEach(sec=>{ const li = el('li','section-item'); li.textContent = sec.title; list.appendChild(li); }); }
}

function focusPillar(pillarTitle){
  if(activePillar === pillarTitle) { activePillar = null; } else { activePillar = pillarTitle; }
  renderSidebar();
  renderPyramid();
  renderPillarView(activePillar);
}

function renderPyramid(){
  const container = document.getElementById('dashboard') || document.getElementById('pyramid');
  if(!container) return;
  container.innerHTML='';
  const ns = 'http://www.w3.org/2000/svg';
  const pctWidth = Math.max(320, container.clientWidth || 320);
  const width = pctWidth; const height = 320;
  const svg = document.createElementNS(ns, 'svg'); svg.setAttribute('viewBox', `0 0 ${width} ${height}`); svg.setAttribute('preserveAspectRatio','xMidYMid meet'); svg.classList.add('pyramid-large');
  const n = PILLARS.length;
  const layerH = height / n;
  const shrink = 0.12; // fraction to shrink each layer relative to full width
  PILLARS.forEach((p, idx)=>{
    // draw bottom-up: idx 0 is bottom
    const bottomY = height - (idx * layerH);
    const topY = height - ((idx+1) * layerH);
    const frac = 1 - (idx * shrink);
    const layerW = Math.max(40, width * frac);
    const leftX = (width - layerW) / 2;
    const rightX = leftX + layerW;
    const points = `${leftX},${bottomY} ${rightX},${bottomY} ${rightX},${topY} ${leftX},${topY}`;
    const poly = document.createElementNS(ns, 'polygon');
    poly.setAttribute('points', points);
    poly.setAttribute('fill', p.color);
    poly.setAttribute('stroke', 'rgba(0,0,0,0.2)');
    poly.setAttribute('data-pillar', p.title);
    poly.classList.add('pyramid-layer');
    // tooltip
    const tt = document.createElementNS(ns, 'title'); tt.textContent = `${p.title} — ${p.tagline}`; poly.appendChild(tt);
    poly.addEventListener('click', ()=> focusPillar(p.title));
    poly.addEventListener('mouseenter', ()=> poly.classList.add('hover'));
    poly.addEventListener('mouseleave', ()=> poly.classList.remove('hover'));
    if(activePillar === p.title) poly.classList.add('active');
    // label text centered
    const tx = document.createElementNS(ns, 'text'); tx.setAttribute('x', width/2); tx.setAttribute('y', topY + (layerH/2)+6); tx.setAttribute('fill','white'); tx.setAttribute('text-anchor','middle'); tx.setAttribute('font-size','12'); tx.setAttribute('font-weight','700'); tx.textContent = `${p.icon} ${p.title}`;
    svg.appendChild(poly);
    svg.appendChild(tx);
  });
  container.appendChild(svg);
  // if active pillar, also render its sections under the pyramid
  if(activePillar) renderPillarView(activePillar);
}

function renderPillarView(pillarTitle){
  const main = document.getElementById('main-view'); if(!main) return;
  main.innerHTML = '';
  if(!pillarTitle){ main.appendChild(el('p',null,'Choose a pillar from the pyramid above to view its sections.')); return; }
  const p = PILLARS.find(x=> x.title===pillarTitle);
  const header = el('div','card'); const h = el('h2',null,`${p.icon} ${p.title}`); const tag = el('div',null,p.tagline); tag.className='subtitle'; header.appendChild(h); header.appendChild(tag); main.appendChild(header);
  const wrap = el('div','pillar-sections');
  const secs = SECTIONS.filter(s=> s.pillar === pillarTitle);
  secs.forEach(s=>{
    const card = el('div','section-card'); const ic = el('div','ico', s.icon||''); const t = el('div',null,s.title); card.appendChild(ic); card.appendChild(t);
    card.addEventListener('click', ()=>{ // open first subsection if any
      if(s.subs && s.subs[0]){ openSubsection(s.id, s.subs[0]); } else { alert('No subsections found for this section.'); }
      activePillar = pillarTitle; renderSidebar();
    });
    wrap.appendChild(card);
  });
  main.appendChild(wrap);
}

// Remove unexpected legacy/duplicate elements inside the sidebar
function cleanSidebarDom(){
  const aside = document.querySelector('.sidebar'); if(!aside) return;
  // keep these selectors
  const keepSelectors = ['.brand', '.section-controls', '.io-controls', '#sectionsList', '#pyramid'];
  Array.from(aside.children).forEach(ch=>{
    const keep = keepSelectors.some(sel=> ch.matches && ch.matches(sel));
    if(!keep){ aside.removeChild(ch); }
  });
  // also ensure there is only one sectionsList
  const lists = aside.querySelectorAll('#sectionsList'); if(lists.length>1){ for(let i=1;i<lists.length;i++) lists[i].remove(); }
}

// Normalize in-memory sections and persist to localStorage if changes found
function normalizeAndPersist(){
  // attempt to migrate loose sections (e.g., Sleep, Hydration) into Health
  try{ migrateSections(); }catch(e){ console.warn('migrateSections failed', e); }
  try{
    const raw = loadState();
    const norm = normalizeSections(raw.concat([]));
    // if normalization reduces duplicates or changes structure, persist
    if(JSON.stringify(norm) !== JSON.stringify(raw)){
      saveState(norm);
      SECTIONS = norm;
      console.info('kokovix: normalized and persisted sections (duplicates merged)');
      alert('Kokovix: duplicate sections were detected and merged for a cleaner sidebar.');
    } else {
      SECTIONS = norm; // ensure in-memory matches storage
    }
  }catch(e){ console.warn('normalizeAndPersist failed', e); }
}

// Move standalone Sleep/Hydration sections into the Health section and merge subs
function migrateSections(){
  const raw = loadState();
  let changed = false;
  // find or create health section in raw
  let health = raw.find(s=> (s.title||'').toString().trim().toLowerCase()==='health');
  if(!health){ health = {id:uid('s_'), title:'Health', category:'Health', pillar:'Health', icon:'❤️', subs:[]}; raw.unshift(health); changed = true; }
  const moveTitles = ['sleep','hydration'];
  for(let i = raw.length-1;i>=0;i--){ const s = raw[i]; if(!s || !s.title) continue; const t = s.title.toString().trim().toLowerCase(); if(moveTitles.includes(t) || (s.category && s.category.toLowerCase()==='health' && (t==='sleep' || t==='hydration'))){
      // move subsections or the title itself into health.subs
      if(Array.isArray(s.subs) && s.subs.length){ s.subs.forEach(sub=>{ if(!health.subs.includes(sub)) health.subs.push(sub); }); }
      else { if(!health.subs.includes(s.title)) health.subs.push(s.title); }
      raw.splice(i,1); changed = true;
    } }
  if(changed){ saveState(normalizeSections(raw)); SECTIONS = normalizeSections(raw); }
}

// Build a non-destructive preview of what would be merged/removed
function computeMigrationPreview(){
  const raw = loadState();
  const health = raw.find(s=> (s.title||'').toString().trim().toLowerCase()==='health');
  const healthSubs = health ? (Array.isArray(health.subs)? health.subs.slice():[]) : [];
  const toRemove = [];
  const additions = new Set();
  const mergedFrom = {};
  const moveTitles = ['sleep','hydration'];
  raw.forEach(s=>{
    if(!s || !s.title) return;
    const t = s.title.toString().trim().toLowerCase();
    if(moveTitles.includes(t) || (s.category && s.category.toLowerCase()==='health' && (t==='sleep' || t==='hydration'))){
      toRemove.push(s.title);
      mergedFrom[s.title] = Array.isArray(s.subs) ? s.subs.slice() : [];
      if(mergedFrom[s.title].length===0) mergedFrom[s.title].push(s.title);
      mergedFrom[s.title].forEach(sub=>{ if(!healthSubs.includes(sub)) additions.add(sub); });
    }
  });
  return {toRemove, additions: Array.from(additions), mergedFrom};
}

function showMigrationPreview(){
  const p = computeMigrationPreview();
  // build modal
  const overlay = el('div','modal-overlay');
  const modal = el('div','modal');
  const h = el('h3',null,'Migration Preview — Health consolidation'); modal.appendChild(h);
  const body = el('div','modal-body');
  if(p.toRemove.length===0){ body.appendChild(el('div',null,'No Sleep/Hydration or movable health items were found.')); }
  else{
    body.appendChild(el('div',null,`Sections that would be removed: ${p.toRemove.join(', ')}`));
    body.appendChild(el('div',null,'Subsections that would be added to Health:')); 
    const ul = el('ul',null); p.additions.forEach(a=> ul.appendChild(el('li',null,a))); body.appendChild(ul);
    body.appendChild(el('div',null,'Source mapping:'));
    const map = el('ul',null);
    Object.keys(p.mergedFrom).forEach(k=>{ const li = el('li',null, `${k} → ${ (p.mergedFrom[k].length ? p.mergedFrom[k].join(', ') : k) }`); map.appendChild(li); });
    body.appendChild(map);
  }
  modal.appendChild(body);
  const actions = el('div','modal-actions');
  const closeBtn = el('button','btn ghost','Close'); closeBtn.addEventListener('click', ()=> overlay.remove());
  const applyBtn = el('button','btn','Apply Migration'); applyBtn.addEventListener('click', ()=>{ overlay.remove(); migrateSections(); renderSidebar(); alert('Migration applied — duplicates merged.'); });
  actions.appendChild(closeBtn); actions.appendChild(applyBtn); modal.appendChild(actions);
  overlay.appendChild(modal); document.body.appendChild(overlay);
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
  const key = title.toString().trim().toLowerCase();
  if(SECTIONS.some(s=> (s.title||'').toString().trim().toLowerCase()===key)){ alert('Section already exists'); return; }
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
  // clean up any stray legacy elements and normalize stored sections
  cleanSidebarDom();
  normalizeAndPersist();
  renderSidebar();
  document.getElementById('addSectionBtn').addEventListener('click', ()=>{
    const v = document.getElementById('newSectionTitle').value.trim(); if(!v) return alert('Enter a title'); addSection(v); document.getElementById('newSectionTitle').value='';
  });
  // import/export wiring
  const exportBtn = document.getElementById('exportBtn'); const importBtn = document.getElementById('importBtn'); const importFile = document.getElementById('importFile');
  if(exportBtn){ exportBtn.addEventListener('click', exportJSON); }
  if(importBtn && importFile){ importBtn.addEventListener('click', ()=> importFile.click()); importFile.addEventListener('change', (e)=>{ if(e.target.files.length) importJSONFile(e.target.files[0]); }); }
  const previewBtn = document.getElementById('previewBtn'); if(previewBtn){ previewBtn.addEventListener('click', ()=> showMigrationPreview()); }
  const resetBtn = document.getElementById('resetBtn'); if(resetBtn){ resetBtn.addEventListener('click', ()=> resetKokovixStorage()); }
  const repairBtn = document.getElementById('repairBtn'); if(repairBtn){ repairBtn.addEventListener('click', ()=>{ if(!confirm('Attempt a non-destructive repair by merging defaults where metadata is missing?')) return; repairSections(); }); }
  const applyRepairBtn = document.getElementById('applyRepairBtn'); if(applyRepairBtn){ applyRepairBtn.addEventListener('click', ()=>{ try{ repairSections(); showDiagnostics(); localStorage.setItem('kokovix.diag_shown_v1','1'); }catch(e){ alert('Repair failed: '+(e&&e.message)); } }); }

  // Also wire repair buttons to the stronger force-apply defaults when requested
  if(repairBtn){ repairBtn.addEventListener('dblclick', ()=>{ // double-click to force-apply defaults
    try{ forceApplyDefaults(); }catch(e){ alert('Force apply failed: '+(e&&e.message)); }
  }); }
  const dumpBtn = document.getElementById('dumpBtn'); if(dumpBtn){ dumpBtn.addEventListener('click', ()=> exportDiagnostics()); }
  const showDiagBtn = document.getElementById('showDiagBtn'); if(showDiagBtn){ showDiagBtn.addEventListener('click', ()=> showDiagnostics()); }
  // legacy nav removed to avoid duplicate lists
  // Quote rotation
  const qEl = document.getElementById('quote'); if(qEl){ qEl.textContent = QUOTES[Math.floor(Math.random()*QUOTES.length)]; setInterval(()=>{ qEl.textContent = QUOTES[Math.floor(Math.random()*QUOTES.length)]; }, 8000); }
  // render interactive pyramid
  renderPyramid();
  
  // One-time reset helper: clears all kokovix.* keys and restores DEFAULT sections.
  function resetKokovixStorage(){
    if(!confirm('This will permanently clear all Kokovix local data (history, visuals, sections). Proceed?')) return;
    Object.keys(localStorage).forEach(k=>{ if(k.startsWith('kokovix.') || k===STORAGE_KEY) localStorage.removeItem(k); });
    saveState(JSON.parse(JSON.stringify(DEFAULT)));
    alert('Kokovix storage cleared and defaults restored. Reloading...');
    // reload without query param
    const url = new URL(window.location.href);
    url.searchParams.delete('reset_kokovix');
    window.location.replace(url.toString());
  }
  
  // If URL contains ?reset_kokovix=1 then run the one-time reset automatically
  try{
    const qp = new URLSearchParams(window.location.search || '');
    if(qp.get('reset_kokovix')==='1'){
      // small delay to allow DOM to settle
      setTimeout(()=>{ resetKokovixStorage(); }, 300);
    }
  }catch(e){ /* ignore in older browsers */ }
  // Auto-repair on load: if any section is missing pillar metadata, attempt a silent repair
  try{
    const anyMissingPillar = SECTIONS.some(s=> !s.pillar);
    if(anyMissingPillar){
      console.info('kokovix: auto-repair triggered — filling missing pillar/category/icon from defaults');
      // create a one-time backup in localStorage before repair (downloads can be blocked by browser)
      try{
        const data = { sectionsKey: STORAGE_KEY, sections: localStorage.getItem(STORAGE_KEY), kokovix: {} };
        Object.keys(localStorage).forEach(k=>{ if(k.startsWith('kokovix.') || k===STORAGE_KEY) data.kokovix[k]=localStorage.getItem(k); });
        localStorage.setItem('kokovix.backup.before_auto_repair.v1', JSON.stringify(data));
        console.info('kokovix: backup saved to localStorage key kokovix.backup.before_auto_repair.v1');
      }catch(e){ console.warn('kokovix: backup before repair failed', e); }
      autoRepairSections();
      // mark diagnostics as shown so modal doesn't auto-open again
      try{ localStorage.setItem('kokovix.diag_shown_v1','1'); }catch(e){}
      alert('Auto-repair applied. A backup was saved to localStorage (key: kokovix.backup.before_auto_repair.v1). Use Show Diagnostics → Download to retrieve it.');
    }
  }catch(e){ console.warn('auto-repair check failed', e); }
  // (removed auto diagnostics auto-open to avoid modal on load)
  // Open Core category first (expand and show first subsection)
  const core = SECTIONS.find(s=>s.category==='Core');
  if(core){ core._open = true; renderSidebar(); if(core.subs && core.subs[0]) openSubsection(core.id, core.subs[0]); }

  // Mobile sidebar toggle
  const toggleBtn = document.getElementById('toggleSidebarBtn');
  if(toggleBtn){
    const aside = document.querySelector('.sidebar');
    // create overlay
    let overlay = document.querySelector('.content-overlay');
    if(!overlay){ overlay = document.createElement('div'); overlay.className='content-overlay'; document.body.appendChild(overlay); }
    toggleBtn.addEventListener('click', ()=>{ aside.classList.toggle('open'); overlay.classList.toggle('show'); });
    overlay.addEventListener('click', ()=>{ aside.classList.remove('open'); overlay.classList.remove('show'); });
    // close sidebar when clicking a section item (mobile)
    document.getElementById('sectionsList').addEventListener('click', ()=>{ if(window.matchMedia && window.matchMedia('(max-width:900px)').matches){ aside.classList.remove('open'); overlay.classList.remove('show'); } });
  }
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

// Silent auto-repair: same logic as repairSections but without alerts — used on initial load
function autoRepairSections(){
  try{
    let changed = false;
    const raw = loadState();
    const diagnostics = [];
    const defMap = new Map(DEFAULT.map(d=>[(d.title||'').toString().trim().toLowerCase(), d]));
    const defById = new Map(DEFAULT.map(d=>[d.id, d]));

    raw.forEach(s=>{
      if(!s || !s.title) return;
      const key = s.title.toString().trim();
      const keyL = key.toLowerCase();
      let def = defMap.get(keyL) || defById.get(s.id);
      if(!def){
        def = DEFAULT.find(d=>{
          const dt = (d.title||'').toString().toLowerCase();
          if(dt && (keyL.includes(dt) || dt.includes(keyL))) return true;
          if(Array.isArray(d.subs) && d.subs.some(ss=> ss.toString().toLowerCase()===keyL)) return true;
          return false;
        });
      }

      const changes = [];
      if(def){
        if(!Array.isArray(s.subs) || s.subs.length===0){ s.subs = Array.isArray(def.subs)? def.subs.slice():[]; changes.push('subs'); }
        if(!s.pillar && def.pillar){ s.pillar = def.pillar; changes.push('pillar'); }
        if(!s.category && def.category){ s.category = def.category; changes.push('category'); }
        if(!s.icon && def.icon){ s.icon = def.icon; changes.push('icon'); }
        if(Array.isArray(def.subs)){
          def.subs.forEach(sub=>{ if(!s.subs.includes(sub)){ s.subs.push(sub); changes.push('added sub:'+sub); } });
        }
      } else {
        if(!s.pillar && s.category){
          const catL = s.category.toString().toLowerCase();
          const p = PILLARS.find(pp=> pp.title.toLowerCase().includes(catL) || catL.includes(pp.title.toLowerCase()));
          if(p){ s.pillar = p.title; changes.push('pillar from category->'+p.title); }
        }
      }

      if(changes.length){ changed = true; diagnostics.push({title: s.title, changes}); }
    });

    if(changed){
      const norm = normalizeSections(raw);
      saveState(norm);
      SECTIONS = norm;
      renderSidebar();
      console.info('kokovix: autoRepairSections applied', diagnostics);
    } else {
      console.info('kokovix: autoRepairSections found no changes');
    }
  }catch(e){ console.error('autoRepairSections failed', e); }
}

// Non-destructive repair: smarter merge of DEFAULT metadata into stored sections
function repairSections(){
  try{
    let changed = false;
    const raw = loadState();
    const diagnostics = [];
    const defMap = new Map(DEFAULT.map(d=>[(d.title||'').toString().trim().toLowerCase(), d]));
    const defById = new Map(DEFAULT.map(d=>[d.id, d]));

    raw.forEach(s=>{
      if(!s || !s.title) return;
      const key = s.title.toString().trim();
      const keyL = key.toLowerCase();
      // try exact title or id match first
      let def = defMap.get(keyL) || defById.get(s.id);
      // fuzzy matches: title contains, default subs contain this title, or vice versa
      if(!def){
        def = DEFAULT.find(d=>{
          const dt = (d.title||'').toString().toLowerCase();
          if(dt && (keyL.includes(dt) || dt.includes(keyL))) return true;
          if(Array.isArray(d.subs) && d.subs.some(ss=> ss.toString().toLowerCase()===keyL)) return true;
          return false;
        });
      }

      const changes = [];
      if(def){
        if(!Array.isArray(s.subs) || s.subs.length===0){ s.subs = Array.isArray(def.subs)? def.subs.slice():[]; changes.push('subs'); }
        if(!s.pillar && def.pillar){ s.pillar = def.pillar; changes.push('pillar'); }
        if(!s.category && def.category){ s.category = def.category; changes.push('category'); }
        if(!s.icon && def.icon){ s.icon = def.icon; changes.push('icon'); }
        if(Array.isArray(def.subs)){
          def.subs.forEach(sub=>{ if(!s.subs.includes(sub)){ s.subs.push(sub); changes.push('added sub:'+sub); } });
        }
      } else {
        // try map pillar from existing category
        if(!s.pillar && s.category){
          const catL = s.category.toString().toLowerCase();
          const p = PILLARS.find(pp=> pp.title.toLowerCase().includes(catL) || catL.includes(pp.title.toLowerCase()));
          if(p){ s.pillar = p.title; changes.push('pillar from category->'+p.title); }
        }
      }

      if(changes.length){ changed = true; diagnostics.push({title: s.title, changes}); }
    });

    if(changed){
      const norm = normalizeSections(raw);
      saveState(norm);
      SECTIONS = norm;
      renderSidebar();
      console.info('repairSections diagnostics:', diagnostics);
      alert('Repair applied. Changes: ' + diagnostics.map(d=> d.title+': '+d.changes.join(', ')).join(' | '));
    } else {
      console.info('repairSections: no changes required', diagnostics);
      alert('No repair needed — data already healthy.');
    }
  }catch(e){ console.error('repairSections failed', e); alert('Repair failed: '+(e && e.message)); }
}

// Download current kokovix localStorage keys and sections for diagnostics
function exportDiagnostics(){
  try{
    const data = { sectionsKey: STORAGE_KEY, sections: null, kokovix: {} };
    data.sections = localStorage.getItem(STORAGE_KEY);
    Object.keys(localStorage).forEach(k=>{ if(k.startsWith('kokovix.') || k===STORAGE_KEY) data.kokovix[k]=localStorage.getItem(k); });
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'kokovix-diagnostic.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }catch(e){ console.error('exportDiagnostics failed', e); alert('Export failed: '+(e && e.message)); }
}

// Force-apply DEFAULT mapping into stored sections (overwrites missing/empty fields)
function forceApplyDefaults(){
  try{
    const raw = loadState();
    const defMap = new Map(DEFAULT.map(d=>[(d.title||'').toString().trim().toLowerCase(), d]));
    let changed = false;
    raw.forEach(s=>{
      if(!s || !s.title) return;
      const key = s.title.toString().trim().toLowerCase();
      const def = defMap.get(key);
      if(def){
        if(s.pillar !== def.pillar){ s.pillar = def.pillar; changed = true; }
        if(!s.category && def.category){ s.category = def.category; changed = true; }
        if(!s.icon && def.icon){ s.icon = def.icon; changed = true; }
        if(!Array.isArray(s.subs) || s.subs.length===0){ s.subs = Array.isArray(def.subs)? def.subs.slice():[]; changed = true; }
        else { def.subs.forEach(sub=>{ if(!s.subs.includes(sub)){ s.subs.push(sub); changed = true; } }); }
      }
    });
    if(changed){ const norm = normalizeSections(raw); saveState(norm); SECTIONS = norm; renderSidebar(); alert('Defaults applied to stored sections.'); }
    else { alert('No defaults needed to apply.'); }
  }catch(e){ console.error('forceApplyDefaults failed', e); alert('Force apply failed: '+(e&&e.message)); }
}

// In-page diagnostics modal to view/copy kokovix storage without DevTools
function showDiagnostics(){
  try{
    const data = { sectionsKey: STORAGE_KEY, sections: null, kokovix: {} };
    data.sections = localStorage.getItem(STORAGE_KEY);
    Object.keys(localStorage).forEach(k=>{ if(k.startsWith('kokovix.') || k===STORAGE_KEY) data.kokovix[k]=localStorage.getItem(k); });

    const overlay = el('div','modal-overlay');
    const modal = el('div','modal');
    const h = el('h3',null,'Kokovix Diagnostics'); modal.appendChild(h);
    const body = el('div','modal-body');
    const txt = el('textarea',null, JSON.stringify(data, null, 2)); txt.style.width='100%'; txt.style.height='320px'; txt.style.background='transparent'; txt.style.color='var(--text)'; txt.style.border='1px solid rgba(255,255,255,0.03)'; body.appendChild(txt);
    modal.appendChild(body);
    const actions = el('div','modal-actions');
    const copyBtn = el('button','btn','Copy to Clipboard'); copyBtn.addEventListener('click', async ()=>{ try{ await navigator.clipboard.writeText(txt.value); alert('Copied to clipboard'); }catch(e){ alert('Copy failed: '+e.message); } });
    const dlBtn = el('button','btn small','Download'); dlBtn.addEventListener('click', ()=>{ const blob = new Blob([txt.value], {type:'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'kokovix-diagnostic.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); });
    const closeBtn = el('button','btn ghost','Close'); closeBtn.addEventListener('click', ()=> overlay.remove());
    actions.appendChild(copyBtn); actions.appendChild(dlBtn); actions.appendChild(closeBtn); modal.appendChild(actions);
    overlay.appendChild(modal); document.body.appendChild(overlay);
  }catch(e){ console.error('showDiagnostics failed', e); alert('Diagnostics failed: '+(e && e.message)); }
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
  nav.innerHTML = '';
  // show deduped sections
  const seen = new Set();
  const list = [];
  SECTIONS.forEach(s=>{ const k=(s.title||'').toString().trim().toLowerCase(); if(!seen.has(k)){ seen.add(k); list.push(s); } });
  list.forEach(section=>{
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
