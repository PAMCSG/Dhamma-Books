/* Approved Dhamma-Books language navigation: remaining three books, v1.0.0. */
(function(){
  'use strict';
  const name=location.pathname.split('/').pop();
  const combined={
    'the-only-way-for-realization-of-nibbana.html':{panels:{en:'reader-en',zh:'reader-zh'},buttons:{en:'langEn',zh:'langZh'}},
    'the-requisites-of-enlightenment.html':{panels:{en:'enPanel',zh:'zhPanel'},buttons:{en:'enBtn',zh:'zhBtn'}}
  };
  const editions={'paccayaniddeso.html':'en','paccayaniddeso-chinese.html':'zh'};
  function line(){return (document.querySelector('header,.topbar')?.getBoundingClientRect().bottom||70)+16;}
  function current(nodes){
    let found=nodes[0];
    for(const node of nodes){if(node.getBoundingClientRect().top<=line())found=node;else break;}
    return found;
  }
  function go(node){if(node)window.scrollTo({top:Math.max(0,window.scrollY+node.getBoundingClientRect().top-line()),behavior:'instant'});}
  function key(node){
    if(node.classList.contains('cover'))return 'top';
    if(node.classList.contains('contents')||node.classList.contains('toc'))return 'contents';
    return node.dataset.section;
  }
  function sections(panel){return [...panel.querySelectorAll('.cover,.contents,.toc,[data-section]')];}
  function counterpart(sourcePanel,destination){
    const source=sections(sourcePanel),targets=sections(destination),here=current(source);
    const matching=k=>targets.find(n=>key(n)===k);
    const exact=here&&matching(key(here));
    if(exact)return exact;
    // Edition-only prefaces or appendices fall back to the nearest shared section.
    const index=source.indexOf(here);
    for(let i=index-1;i>=0;i--){const target=matching(key(source[i]));if(target)return target;}
    for(let i=index+1;i<source.length;i++){const target=matching(key(source[i]));if(target)return target;}
    return targets[0];
  }
  function init(){
    const config=combined[name];
    if(config){
      const panel=lang=>document.getElementById(config.panels[lang]);
      const active=()=>['en','zh'].map(panel).find(n=>!n.hidden&&getComputedStyle(n).display!=='none');
      ['en','zh'].forEach(lang=>{
        const button=document.getElementById(config.buttons[lang]);
        button.addEventListener('click',()=>{
          const source=active();
          const target=source===panel(lang)?null:counterpart(source,panel(lang));
          setTimeout(()=>{
            go(target);
            const url=new URL(location.href);url.searchParams.set('lang',lang);url.hash='';history.replaceState(null,'',url);
          },0);
        },true);
      });
      const chosen=new URLSearchParams(location.search).get('lang');
      if(chosen==='en'||chosen==='zh'){
        document.getElementById(config.buttons[chosen]).click();
        setTimeout(()=>window.scrollTo({top:0,behavior:'instant'}),0);
      }
      return;
    }
    if(!editions[name])return;
    const host=document.querySelector('.topbar-inner');
    const group=document.createElement('span');group.id='db-language-options';group.setAttribute('role','group');group.setAttribute('aria-label','Book language');
    group.style.cssText='display:inline-flex;gap:4px;flex-wrap:wrap;align-items:center';
    Object.entries(editions).forEach(([file,lang])=>{
      const button=document.createElement('button');button.type='button';button.textContent=lang==='en'?'English':'中文';
      button.setAttribute('aria-pressed',String(file===name));button.classList.toggle('active',file===name);
      button.onclick=()=>{
        if(file===name)return;
        const nodes=[...document.querySelectorAll('#readerView .pair-row[id],#readerView .section-heading[id],#readerView .page-anchor[id]')].filter(n=>n.getClientRects().length);
        const reader=document.getElementById('readerView');
        const anchor=reader.getBoundingClientRect().top>line()?null:current(nodes);
        const url=new URL(file,location.href);url.hash=anchor?anchor.id:'contentsView';location.assign(url.href);
      };
      group.append(button);
    });
    host.insertBefore(group,document.getElementById('previousRead'));
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
