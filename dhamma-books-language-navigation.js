/* Approved Dhamma-Books language navigation: remaining three books, v1.0.3. */
(function(){
  'use strict';
  const name=location.pathname.split('/').pop();
  const combined={
    'the-only-way-for-realization-of-nibbana.html':{panels:{en:'reader-en',zh:'reader-zh'},buttons:{en:'langEn',zh:'langZh'}},
    'the-requisites-of-enlightenment.html':{panels:{en:'enPanel',zh:'zhPanel'},buttons:{en:'enBtn',zh:'zhBtn'}}
  };
  const editions={'paccayaniddeso-chinese.html':'zh','paccayaniddeso.html':'en'};
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
    return node.dataset.languageSection||node.dataset.section;
  }
  function sections(panel){return [...panel.querySelectorAll(panel.querySelector('[data-language-section]')?'.cover,.contents,[data-language-section]':'.cover,.contents,.toc,[data-section]')];}
  function documentTop(node){return window.scrollY+node.getBoundingClientRect().top;}
  function capturePosition(panel){
    const nodes=sections(panel),readingY=window.scrollY+line();
    let before=nodes[0],after=null;
    for(const node of nodes){
      if(documentTop(node)<=readingY)before=node;
      else{after=node;break;}
    }
    const start=documentTop(before);
    const end=after?documentTop(after):documentTop(panel)+panel.scrollHeight;
    const ratio=end>start?Math.max(0,Math.min(1,(readingY-start)/(end-start))):0;
    return {key:key(before),nextKey:after&&key(after),ratio};
  }
  function correspondingPosition(position,destination){
    const targets=sections(destination),matching=k=>targets.find(n=>key(n)===k);
    let before=position&&matching(position.key);
    if(!before)return documentTop(targets[0]);
    const index=targets.indexOf(before);
    const after=(position.nextKey&&matching(position.nextKey))||targets[index+1];
    const start=documentTop(before);
    const end=after?documentTop(after):documentTop(destination)+destination.scrollHeight;
    return start+(end-start)*position.ratio;
  }
  function goPosition(documentY){window.scrollTo({top:Math.max(0,documentY-line()),behavior:'instant'});}
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
    if(name==='the-only-way-for-realization-of-nibbana.html'){
      // Explicit corresponding headings; translations have different heading counts.
      const pairs=[[1,3],[2,4],[7,5],[8,6],[26,7],[28,8],[38,9],[39,10],[41,11],[42,12],[43,13],[48,14],[49,15],[50,16],[51,18],[52,19],[53,21],[54,22],[55,23],[56,24],[57,26],[58,28],[59,29],[60,30],[61,31],[64,32],[66,33],[67,34],[68,35],[69,36],[70,37],[71,38],[72,39],[73,40],[74,41],[76,42],[92,43],[99,44],[100,46],[104,47],[107,48],[108,50],[109,52],[110,53],[111,54],[112,55],[113,56],[114,57],[120,58]];
      const en=[...document.querySelectorAll('#reader-en h2.section-heading')];
      const zh=[...document.querySelectorAll('#reader-zh h1,#reader-zh h2,#reader-zh h3')];
      pairs.forEach(([e,z],i)=>{en[e].dataset.languageSection='heading-'+i;zh[z].dataset.languageSection='heading-'+i;});
    }
    const config=combined[name];
    if(config){
      const panel=lang=>document.getElementById(config.panels[lang]);
      const active=()=>['en','zh'].map(panel).find(n=>!n.hidden&&getComputedStyle(n).display!=='none');
      ['en','zh'].forEach(lang=>{
        const button=document.getElementById(config.buttons[lang]);
        button.addEventListener('click',()=>{
          const source=active();
          const same=source===panel(lang);
          const detailed=name==='the-only-way-for-realization-of-nibbana.html';
          const position=!same&&detailed?capturePosition(source):null;
          const target=!same&&!detailed?counterpart(source,panel(lang)):null;
          setTimeout(()=>requestAnimationFrame(()=>requestAnimationFrame(()=>{
            if(position)goPosition(correspondingPosition(position,panel(lang)));
            else go(target);
            const url=new URL(location.href);url.searchParams.set('lang',lang);url.hash='';history.replaceState(null,'',url);
          })),0);
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
    const group=document.getElementById('db-language-options')||document.createElement('span');group.replaceChildren();group.id='db-language-options';group.setAttribute('role','group');group.setAttribute('aria-label','Book language');
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
    const previous=document.getElementById('previousRead');
    (previous?.parentNode||host).insertBefore(group,previous||null);
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
