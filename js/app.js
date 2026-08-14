const DEFAULT = [
  {id:'health', title:'Health', subs:['Reading for RHR','VO2Max','Weight','Latest Health Report','Daily Exercises']},
  {id:'morning', title:'Morning Rituals', subs:['Meditation','Affirmations','Journal']},
  {id:'plan', title:'Plan My Day', subs:['To Do List','One Thing for Day']},
  {id:'night', title:'Night Rituals', subs:['Reflection','Meditation']},
  {id:'goals', title:'Goals', subs:['Weekly','Monthly','Yearly']},
  {id:'weekly', title:'Weekly Review', subs:['What went well','What to improve','Action Items','Next To Do']},
  {id:'monthly', title:'Monthly Review', subs:['What went well','What to improve','Action Items','Next To Do']},
  {id:'research', title:'Research', subs:['Daily','Weekly','Monthly']},
  {id:'books', title:'Books', subs:['To Read','Completed']}
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
    const a = el('a','section-link',sec.title);
    a.href='#'; a.addEventListener('click',(ev)=>{ev.preventDefault(); openSection(sec.id);});
    const actions = el('div','sec-actions');
    const addSub = el('button','small','+sub'); addSub.title='Add subsection'; addSub.addEventListener('click',()=> addSubsectionPrompt(sec.id));
    const edit = el('button','small','edit'); edit.addEventListener('click',()=> renameSectionPrompt(sec.id));
    const del = el('button','small','del'); del.addEventListener('click',()=> deleteSection(sec.id));
    actions.appendChild(addSub); actions.appendChild(edit); actions.appendChild(del);
    li.appendChild(a); li.appendChild(actions);
    list.appendChild(li);
  });
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

function openSection(sectionId){
  const sec = SECTIONS.find(s=>s.id===sectionId); if(!sec) return;
  const title = document.getElementById('page-title'); title.textContent = sec.title;
  const content = document.getElementById('content'); content.innerHTML = '';
  const bc = el('div','breadcrumb',`Home / ${sec.title}`); content.appendChild(bc);

  // For each subsection render subsection block
  sec.subs.forEach(sub => {
    const container = el('div','card');
    const h = el('h2',null,sub);
    container.appendChild(h);

    const key = `kokovix.entry.${sec.id}.${sub}`;
    const area = el('textarea','sub-input',''); area.placeholder='Write notes, details, or status for this subsection.';
    area.style.width='100%'; area.style.height='120px';
    const saved = localStorage.getItem(key);
    if(saved) area.value = saved;
    container.appendChild(area);

    // Special fields for Health / Latest Health Report
    if(sec.title.toLowerCase().includes('health')){
      const fldWrap = el('div','health-fields');
      const rhr = el('input','',''); rhr.placeholder='RHR'; rhr.value = localStorage.getItem(key + '.rhr')||'';
      const vo2 = el('input','',''); vo2.placeholder='VO2Max'; vo2.value = localStorage.getItem(key + '.vo2')||'';
      const weight = el('input','',''); weight.placeholder='Weight'; weight.value = localStorage.getItem(key + '.weight')||'';
      const file = el('input','',''); file.type='file'; file.addEventListener('change',(e)=>{
        const f = e.target.files[0]; if(!f) return; const reader = new FileReader(); reader.onload = () => { localStorage.setItem(key+'.file', reader.result); alert('Health report saved locally'); }; reader.readAsDataURL(f);
      });
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

    // History list
    const histWrap = el('div','history'); const htitle = el('h4',null,'History'); const hlist = el('ul','history-list'); histWrap.appendChild(htitle); histWrap.appendChild(hlist); container.appendChild(histWrap);

    function loadHistory(){
      const raw = localStorage.getItem(key + '.history');
      const arr = raw ? JSON.parse(raw) : [];
      hlist.innerHTML='';
      arr.slice().reverse().forEach((item, idx)=>{
        const li = el('li','history-item', `${new Date(item.t).toLocaleString()} — ${item.status || 'saved'} ${item.comments? '- '+item.comments: ''}`);
        const edit = el('button','small','edit'); edit.addEventListener('click', ()=>{
          const newC = prompt('Edit comments', item.comments||''); if(newC!==null){ item.comments=newC; saveHistory(arr); loadHistory(); }
        });
        const del = el('button','small','del'); del.addEventListener('click', ()=>{ if(confirm('Delete this history entry?')){ arr.splice(arr.length-1-idx,1); saveHistory(arr); loadHistory(); }});
        li.appendChild(edit); li.appendChild(del);
        hlist.appendChild(li);
      });
    }

    function saveHistory(arr){ localStorage.setItem(key + '.history', JSON.stringify(arr)); }

    saveBtn.addEventListener('click', ()=>{
      localStorage.setItem(key, area.value);
      // push history entry
      const raw = localStorage.getItem(key + '.history'); const arr = raw?JSON.parse(raw):[];
      arr.push({t:Date.now(), status:'saved', comments: ''}); saveHistory(arr); loadHistory();
      alert('Saved');
    });

    addEntryBtn.addEventListener('click', ()=>{
      const status = prompt('Status (e.g., done, in-progress)'); if(status===null) return;
      const comments = prompt('Optional comments')||'';
      const raw = localStorage.getItem(key + '.history'); const arr = raw?JSON.parse(raw):[];
      arr.push({t:Date.now(), status, comments}); saveHistory(arr); loadHistory();
    });

    clearBtn.addEventListener('click', ()=>{ if(confirm('Clear content for this subsection?')){ area.value=''; localStorage.removeItem(key); } });

    container.querySelectorAll('.history .history-list');
    loadHistory();
    content.appendChild(container);
  });
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
