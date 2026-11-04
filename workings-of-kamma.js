/* The Workings of Kamma: source navigation, notes and shared-reader integration. */
(() => {
  'use strict';
  // The shared PCED supplement fills this stable dictionary object on startup.
  window.PCED_ENTRIES={};
  document.addEventListener('DOMContentLoaded',()=>window.PCEDStandardData?.applyTo(window.PCED_ENTRIES),{once:true});
  const header=document.querySelector('.topbar'), root=document.documentElement;
  const measure=()=>root.style.setProperty('--kamma-header-height',Math.ceil(header.getBoundingClientRect().height)+'px');
  measure();addEventListener('resize',measure,{passive:true});if(window.ResizeObserver)new ResizeObserver(measure).observe(header);
  let size=18;try{size=Number(localStorage.getItem('workings-of-kamma:text-size'))||18;}catch(_){}
  const apply=()=>{root.style.setProperty('--reader-size',size+'px');root.style.setProperty('--db-reader-font',size+'px');};apply();
  for(const [id,delta] of [['fontMinus',-1],['fontPlus',1]])document.getElementById(id).addEventListener('click',()=>{size=Math.max(14,Math.min(30,size+delta));apply();try{localStorage.setItem('workings-of-kamma:text-size',size);}catch(_){}measure();});
  const contents=document.getElementById('book-contents'),toggle=document.getElementById('contentsToggle');
  function setOpen(open){contents.classList.toggle('collapsed',!open);toggle.textContent=open?'Collapse':'Expand';toggle.setAttribute('aria-expanded',String(open));}
  toggle.addEventListener('click',()=>setOpen(contents.classList.contains('collapsed')));
  document.getElementById('contentsBtn').addEventListener('click',()=>{setOpen(true);contents.scrollIntoView({behavior:'smooth',block:'start'});});
  function go(target){measure();const y=scrollY+target.getBoundingClientRect().top-header.getBoundingClientRect().height-14;scrollTo({top:Math.max(0,y),behavior:'instant'});}
  document.addEventListener('click',event=>{
    const link=event.target.closest('a[href^="#"]');
    if(!link||link.matches('[data-note]'))return;
    const target=document.getElementById(decodeURIComponent(link.hash.slice(1)));
    if(!target||target.closest('[hidden]'))return;
    event.preventDefault();history.replaceState(null,'',link.hash);go(target);
  });
  const noteModal=document.getElementById('noteModal'),noteBody=document.getElementById('noteBody');
  const dictModal=document.getElementById('dictModal');
  function openModal(modal){modal.classList.add('open');modal.setAttribute('aria-hidden','false');window.PAMCPopupMovement?.scan(modal);}
  function closeModal(modal){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');}
  document.addEventListener('click',event=>{
    const trigger=event.target.closest('[data-note]');
    if(trigger){event.preventDefault();const source=document.getElementById(trigger.dataset.note);if(!source)return;document.getElementById('noteTitle').textContent=source.dataset.noteLabel;noteBody.replaceChildren(source.cloneNode(true));noteBody.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));openModal(noteModal);noteBody.scrollTop=0;return;}
    const word=event.target.closest('.pali-word[data-word]');
    if(word){
      const selection=getSelection();if(selection&&!selection.isCollapsed)return;
      document.getElementById('dictTitle').textContent=word.dataset.word;
      document.getElementById('dictMeta').textContent='PCED';
      document.getElementById('dictBody').replaceChildren();
      const placeholder=document.createElement('p');placeholder.textContent='Looking up '+word.dataset.word+'…';document.getElementById('dictBody').append(placeholder);openModal(dictModal);
    }
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'){if(dictModal.classList.contains('open'))closeModal(dictModal);else closeModal(noteModal);}
    if((event.key==='Enter'||event.key===' ')&&event.target.matches('.pali-word')){event.preventDefault();event.target.click();}
  });
  document.getElementById('noteClose').addEventListener('click',()=>closeModal(noteModal));
  document.getElementById('dictClose').addEventListener('click',()=>closeModal(dictModal));
  // Clicking the speech controls must retain the selected start word.
  for(const id of ['dbReadAloudButton'])document.getElementById(id).addEventListener('pointerdown',event=>event.preventDefault());
  document.addEventListener('pointerdown',event=>{if(event.target.closest('#db-readaloud-panel [data-action="start"],#db-readaloud-panel [data-action="selection"]'))event.preventDefault();});
  addEventListener('load',()=>{measure();if(location.hash){const target=document.getElementById(decodeURIComponent(location.hash.slice(1)));if(target&&!target.closest('[hidden]'))go(target);}},{once:true});
})();
