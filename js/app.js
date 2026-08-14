const DEFAULT = [
  {id:'health', title:'Health', subs:['RHR','VO2Max','Weight','Latest Health Report','Daily Exercises']},
  {id:'morning', title:'Morning Rituals', subs:['Meditation','Affirmations','Journal']},
  {id:'plan', title:'Plan My Day', subs:['To Do List','One Thing for Day']},
  {id:'reflection', title:'Reflection', subs:['Daily','Weekly','Monthly']},
  {id:'goals', title:'Goals', subs:['Weekly','Monthly','Yearly']},
  {id:'research', title:'Research', subs:['Daily','Weekly','Monthly']},
  {id:'books', title:'Books', subs:['To Read','Completed']},
  {id:'visualization', title:'Visualization', subs:['Gallery','Vision Board']}
];

const STORAGE_KEY = 'kokovix.sections.v1';

function uid(prefix='id'){return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2,6)}

function loadState(){
  const s = localStorage.getItem(STORAGE_KEY);
  if(!s){ return JSON.parse(JSON.stringify(DEFAULT)); }
  try{ return JSON.parse(s); }catch(e){ return JSON.parse(JSON.stringify(DEFAULT)); }
}

function saveState(data){ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

function el(tag, cls, txt){const e=document.createElement(tag); if(cls) e.className=cls; if(txt!==undefined) e.textContent=txt; return e}

let SECTIONS = loadState();

function renderSidebar(){
  const list = document.getElementById('sectionsList'); list.innerHTML='';
  SECTIONS.forEach(sec=>{
    const li = el('li','section-item');

    const header = el('div','section-header');
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
      const si = el('li','sub-item');
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

  function loadImages(){
    const raw = localStorage.getItem(keyRoot + '.images'); const arr = raw?JSON.parse(raw):[];
    gallery.innerHTML='';
    arr.slice().reverse().forEach(img=>{
      const card = el('div','vis-card'); const timg = el('img'); timg.src = img.data; timg.alt = img.caption||''; card.appendChild(timg);
      const meta = el('div','vis-meta', img.caption||'');
      const del = el('button','icon small','✕'); del.title='Delete'; del.addEventListener('click', ()=>{ if(confirm('Delete image?')){ const i = arr.findIndex(x=>x.id===img.id); if(i>-1){ arr.splice(i,1); localStorage.setItem(keyRoot + '.images', JSON.stringify(arr)); loadImages(); } }});
      const feat = el('button','btn small','Set featured'); feat.addEventListener('click', ()=>{ localStorage.setItem(keyRoot + '.featured', img.id); alert('Set as featured visualization'); });
      card.appendChild(meta); card.appendChild(feat); card.appendChild(del);
      timg.addEventListener('click', ()=> openLightbox(img));
      gallery.appendChild(card);
    });
  }

  function handleFiles(files){
    const raw = localStorage.getItem(keyRoot + '.images'); const arr = raw?JSON.parse(raw):[];
    Array.from(files).forEach(f=>{
      const reader = new FileReader(); reader.onload = ()=>{ arr.push({id: uid('img_'), data: reader.result, caption: f.name, t:Date.now()}); localStorage.setItem(keyRoot + '.images', JSON.stringify(arr)); loadImages(); };
      reader.readAsDataURL(f);
    });
  }

  function openLightbox(img){
    const modal = el('div','lightbox'); const imgEl = el('img'); imgEl.src = img.data; modal.appendChild(imgEl);
    const close = el('button','icon close','✕'); close.addEventListener('click', ()=> modal.remove()); modal.appendChild(close);
    document.body.appendChild(modal);
  }

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
  // Build legacy nav (optional)
  buildLegacyNav();
});

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
