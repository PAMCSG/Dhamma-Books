/* Language navigation pilot: Mindfulness of Breathing and Pāli Chanting only, v1.0.1. */
(function(){
  'use strict';
  const name=location.pathname.split('/').pop();
  const editions={'pali-chanting-book.html':'en','pali-chanting-book-chinese.html':'zh','pali-chanting-book-burmese.html':'my'};
  function line(){return (document.querySelector('header,.topbar')?.getBoundingClientRect().bottom||70)+16;}
  function current(nodes){
    let found=nodes[0];
    for(const node of nodes){if(node.getBoundingClientRect().top<=line()) found=node;else break;}
    return found;
  }
  function go(node){if(node)window.scrollTo({top:Math.max(0,window.scrollY+node.getBoundingClientRect().top-line()),behavior:'instant'});}
  function init(){
    if(name==='mindfulness-of-breathing.html'){
      const section=()=>current([...document.querySelectorAll('.lang-panel.active [data-section]')]);
      ['en','zh'].forEach(lang=>{
        const button=document.getElementById(lang==='en'?'langEn':'langZh');
        button.addEventListener('click',()=>{
          const source=section();
          const key=source?.dataset.section||'top';
          setTimeout(()=>{
            const panel=document.getElementById('reader-'+lang);
            go(panel.querySelector('[data-section="'+key+'"]')||panel.querySelector('[data-section="conclusion"]'));
            const url=new URL(location.href);url.searchParams.set('lang',lang);url.hash='';history.replaceState(null,'',url);
          },0);
        },true);
      });
      const chosen=new URLSearchParams(location.search).get('lang');
      if(chosen==='en'||chosen==='zh'){
        document.getElementById(chosen==='en'?'langEn':'langZh').click();
        setTimeout(()=>{window.scrollTo({top:0,behavior:'instant'});},0);
      }
      return;
    }
    if(!editions[name])return;
    const host=document.querySelector('.topbar-inner');
    const group=document.getElementById('db-language-options')||document.createElement('span');
    group.id='db-language-options';group.setAttribute('role','group');group.setAttribute('aria-label',group.getAttribute('aria-label')||'Book language');
    [['pali-chanting-book-chinese.html','zh'],['pali-chanting-book.html','en'],['pali-chanting-book-burmese.html','my']].forEach(([file,lang])=>{
      let button=group.querySelector('[data-db-edition="'+lang+'"]');
      if(!button){button=document.createElement('a');button.href=file;button.dataset.dbEdition=lang;button.textContent={en:'English',zh:'中文',my:'မြန်မာ'}[lang];group.append(button);}
      button.setAttribute('aria-pressed',String(file===name));button.classList.toggle('active',file===name);
      if(file===name)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
      button.addEventListener('click',event=>{
        event.preventDefault();
        if(file===name)return;
        const nodes=[...document.querySelectorAll('#readerView .pair-row[id],#readerView .section-heading[id],#readerView .page-anchor[id]')].filter(n=>n.getClientRects().length);
        const reader=document.getElementById('readerView');
        const anchor=reader.getBoundingClientRect().top>line()?null:current(nodes);
        const url=new URL(file,location.href);url.hash=anchor?anchor.id:'contentsView';location.assign(url.href);
      });
    });
    if(!group.parentElement)host.insertBefore(group,document.getElementById('fontMinus'));
    function restore(){
      let id;try{id=decodeURIComponent(location.hash.slice(1));}catch(_){return;}
      const target=document.getElementById(id);
      if(target&&(target.closest('#readerView')||id==='contentsView')){
        window.showView?.(id==='contentsView'?'contents':'reader');
        requestAnimationFrame(()=>requestAnimationFrame(()=>go(target)));
      }
    }
    if(document.readyState==='complete')restore();else window.addEventListener('load',restore,{once:true});
    window.addEventListener('hashchange',restore);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
