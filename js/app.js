const DATA = [
  {id:'health', title:'Health', subs:['Exercise','Diet','Sleep']},
  {id:'morning', title:'Morning Rituals', subs:['Meditation','Stretching','Cold Shower']},
  {id:'schedule', title:'Daily Schedule', subs:['Work Blocks','Pomodoro','Breaks']},
  {id:'night', title:'Night Journal', subs:['Gratitude','Reflection','Tomorrow Plan']},
  {id:'learning', title:'Learning', subs:['Courses','Flashcards','Reading List']},
  {id:'research', title:'Research', subs:['Papers','Notes','Literature Review']},
  {id:'habits', title:'Habits', subs:['Tracker','Weekly Review','Streaks']},
  {id:'goals', title:'Goals', subs:['Short-term','Long-term','OKRs']},
  {id:'notes', title:'Notes', subs:['Quick Notes','Archive','Templates']},
  {id:'resources', title:'Resources', subs:['Tools','Links','References']}
];

function el(tag, cls, txt){const e=document.createElement(tag); if(cls) e.className=cls; if(txt!==undefined) e.textContent=txt; return e}

function buildNav(){
  const nav = document.getElementById('nav');
  DATA.forEach(section=>{
    const wrap = el('div','nav-section');
    const btn = el('div','nav-button');
    const left = el('div','label',section.title);
    left.classList.add('label');
    btn.appendChild(left);
    const chev = el('div','chev','▸');
    btn.appendChild(chev);
    btn.addEventListener('click', ()=>{
      const list = wrap.querySelector('.sub-list');
      const open = list.style.display === 'flex';
      document.querySelectorAll('.sub-list').forEach(s=>s.style.display='none');
      document.querySelectorAll('.nav-button .chev').forEach(c=>c.textContent='▸');
      if(!open){ list.style.display='flex'; chev.textContent='▾' }
      else { list.style.display='none'; chev.textContent='▸' }
    });

    const sub = el('div','sub-list');
    section.subs.forEach(s=>{
      const item = el('div','sub-item',s);
      item.addEventListener('click', ()=> loadContent(section, s));
      sub.appendChild(item);
    });

    wrap.appendChild(btn);
    wrap.appendChild(sub);
    nav.appendChild(wrap);
  });
}

function loadContent(section, sub){
  const title = document.getElementById('page-title');
  title.textContent = `${section.title} — ${sub}`;
  const content = document.getElementById('content');
  content.innerHTML = '';
  const bc = el('div','breadcrumb',`Home / ${section.title} / ${sub}`);
  content.appendChild(bc);

  const card = el('div','card');
  const h = el('h2',null,sub);
  const p = el('p',null,`This is a starter page for "${sub}" inside the ${section.title} section. Use this area to track notes, templates, checklists, or embed external resources.`);
  card.appendChild(h); card.appendChild(p);

  const notes = el('textarea',null,'');
  notes.style.width='100%'; notes.style.height='160px'; notes.placeholder='Write notes here — saved to localStorage per page.';
  const key = `kokovix.${section.id}.${sub}`;
  const saved = localStorage.getItem(key);
  if(saved) notes.value = saved;
  notes.addEventListener('input', ()=> localStorage.setItem(key, notes.value));

  card.appendChild(notes);

  const row = el('div','action-row');
  const save = el('button','btn small','Clear');
  save.addEventListener('click', ()=>{ if(confirm('Clear notes for this page?')){ notes.value=''; localStorage.removeItem(key); }});
  row.appendChild(save);
  card.appendChild(row);

  content.appendChild(card);
}

window.addEventListener('DOMContentLoaded', ()=>{ buildNav(); });
