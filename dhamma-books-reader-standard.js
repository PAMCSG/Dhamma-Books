/* Dhamma-Books shared bookmark, search, header, chanting-flow, and popup bootstrap behavior v1.3.19 */
(function(){
  'use strict';
  const BOOKMARK_KEY='dhamma-books:bookmarks:'+location.pathname;
  const LEGACY_CONTROL_IDS=['bookmarkBtn','saveBookmark','goBookmark','returnBookmark','searchInput','searchBtn'];
  const STRINGS={
    en:{bookmark:'Book Mark',search:'Search',placeholder:'Search text…',modal:'Book Marks',add:'Add book mark here',current:'Current position: ',empty:'No book marks saved.',go:'Go',remove:'Delete',noResults:'No results',matches:n=>n+' match'+(n===1?'':'es'),close:'Close book marks'},
    zh:{bookmark:'书签',search:'搜索',placeholder:'搜索文字…',modal:'书签',add:'在此处添加书签',current:'当前位置：',empty:'尚未保存书签。',go:'前往',remove:'删除',noResults:'没有结果',matches:n=>'找到 '+n+' 个匹配',close:'关闭书签'},
    my:{bookmark:'စာညှပ်',search:'ရှာ',placeholder:'ရှာရန်',modal:'စာညှပ်များ',add:'ဤနေရာတွင် စာညှပ်သိမ်း',current:'လက်ရှိနေရာ - ',empty:'စာညှပ် မရှိသေးပါ။',go:'သွားမည်',remove:'ဖျက်မည်',noResults:'မတွေ့ပါ',matches:n=>n+' ခု တွေ့သည်',close:'စာညှပ်များ ပိတ်ရန်'}
  };
  let beforeSearch=null;

  function ensurePopupMovementStandard(){
    if(window.PAMCPopupMovement||document.querySelector('script[src*="pced-popup-standard.js"]')) return;
    const popupScript=document.createElement('script');
    popupScript.src=new URL('pced-popup-standard.js?v=1.3.16',document.baseURI).href;
    popupScript.dataset.pcedMode='book';
    document.head.append(popupScript);
  }

  function pathLanguage(){
    const path=location.pathname.toLowerCase();
    if(path.includes('burmese')) return 'my';
    if(path.includes('chinese')||path.includes('dhammapada')||path.includes('patisambhidamagga')||path.includes('zhiguan')||path.includes('twelve-kinds')) return 'zh';
    return '';
  }
  function currentLanguage(){
    const fixed=pathLanguage();
    if(fixed) return fixed;
    const visible=[...document.querySelectorAll('main[data-lang],main[id$="Panel"],main[id^="reader-"]')].find(isVisible);
    const value=(visible?.dataset.lang||visible?.id||'').toLowerCase();
    if(value.includes('zh')) return 'zh';
    if(value.includes('my')) return 'my';
    return 'en';
  }
  function words(){return STRINGS[currentLanguage()]||STRINGS.en}

  function screenHeader(){
    return document.querySelector('body>header:first-of-type,body>nav.topbar,body>.topbar');
  }
  function headerHost(header){
    return header&&(header.querySelector('.top,.topbar-inner')||header);
  }
  function isVisible(node){
    if(!node||node.hidden||node.closest('[hidden],.hidden,[aria-hidden="true"]')) return false;
    const style=getComputedStyle(node);
    return style.display!=='none'&&style.visibility!=='hidden'&&
      (typeof node.getClientRects!=='function'||node.getClientRects().length>0);
  }
  function hideLegacyControls(){
    LEGACY_CONTROL_IDS.forEach(id=>{
      const node=document.getElementById(id);
      if(!node) return;
      const wrap=/^search/.test(id)?node.closest('.searchbox,.search-wrap'):null;
      (wrap||node).classList.add('db-legacy-control');
    });
    document.querySelectorAll('button[onclick*="saveBookmark"],button[onclick*="gotoBookmark"],button[onclick*="openBookmarks"]').forEach(node=>{
      node.classList.add('db-legacy-control');
    });
  }
  function isChantingEdition(){
    const name=location.pathname.split('/').pop().toLowerCase();
    // Chanting Book category: Daily Chants Burmese deliberately keeps its existing views.
    return [
      'daily-chants.html',
      'paccayaniddeso.html',
      'paccayaniddeso-chinese.html',
      'pali-chanting-book.html',
      'pali-chanting-book-chinese.html',
      'pali-chanting-book-burmese.html'
    ].includes(name);
  }
  function installContinuousChantingFlow(){
    if(!isChantingEdition()) return;
    const contents=document.getElementById('contentsView'),reader=document.getElementById('readerView');
    if(!contents||!reader) return;
    const contentsButton=document.getElementById('btnContents'),readerButton=document.getElementById('btnReader');
    function show(which){
      const atContents=which==='contents';
      contents.classList.remove('hidden');reader.classList.remove('hidden');
      contentsButton?.classList.toggle('active',atContents);
      readerButton?.classList.toggle('active',!atContents);
    }
    window.showView=show;
    if(contentsButton) contentsButton.onclick=()=>{
      if(typeof window.saveCurrentPosition==='function') window.saveCurrentPosition();
      show('contents');contents.scrollIntoView({behavior:'smooth',block:'start'});
    };
    if(readerButton) readerButton.onclick=()=>{
      show('reader');reader.scrollIntoView({behavior:'smooth',block:'start'});
    };
    show('contents');
  }
  function create(tag,props){
    const node=document.createElement(tag);
    Object.entries(props||{}).forEach(([key,value])=>{
      if(key==='text') node.textContent=value;
      else if(key==='class') node.className=value;
      else node.setAttribute(key,value);
    });
    return node;
  }
  function buildControls(){
    const header=screenHeader(),host=headerHost(header);
    if(!host) return null;
    hideLegacyControls();
    const existing=document.getElementById('db-standard-controls');
    if(existing){
      const bookmark=document.getElementById('db-bookmark-button');
      const input=document.getElementById('db-search-input');
      const search=document.getElementById('db-search-button');
      const status=document.getElementById('db-search-status');
      return bookmark&&input&&search&&status?{bookmark,input,search,status,controls:existing}:null;
    }
    const controls=create('div',{id:'db-standard-controls',class:'db-standard-controls'});
    const bookmark=create('button',{id:'db-bookmark-button',type:'button',text:'Book Mark','aria-label':'Open book marks'});
    const searchbox=create('div',{class:'db-searchbox'});
    const input=create('input',{id:'db-search-input',type:'search',autocomplete:'off',placeholder:'Search text…','aria-label':'Search book text'});
    const search=create('button',{id:'db-search-button',type:'button',text:'Search'});
    const status=create('span',{id:'db-search-status',class:'db-search-status','aria-live':'polite'});
    searchbox.append(input,search);
    controls.append(bookmark,searchbox,status);
    const spacer=[...host.children].find(node=>node.classList?.contains('spacer'));
    if(spacer) host.insertBefore(controls,spacer); else host.append(controls);
    return {bookmark,input,search,status,controls};
  }

  function adoptPaccayaniddesoControls(){
    const name=location.pathname.split('/').pop().toLowerCase();
    if(name!=='paccayaniddeso.html'&&name!=='paccayaniddeso-chinese.html') return null;
    const bookmark=document.getElementById('bookmarkBtn');
    const input=document.getElementById('searchInput');
    const search=document.getElementById('searchBtn');
    const host=headerHost(screenHeader());
    if(!bookmark||!input||!search||!host) return null;
    document.getElementById('previousRead')?.setAttribute('hidden','');
    bookmark.onclick=null;
    input.onkeydown=null;
    search.onclick=null;
    let status=document.getElementById('db-search-status');
    if(!status){
      status=create('span',{id:'db-search-status',class:'db-search-status db-paccayaniddeso-search-status','aria-live':'polite'});
      host.append(status);
    }
    return {bookmark,input,search,status,controls:host};
  }

  function installPaccayaniddesoReaderStandard(){
    const name=location.pathname.split('/').pop().toLowerCase();
    if(name!=='paccayaniddeso.html'&&name!=='paccayaniddeso-chinese.html') return;
    document.documentElement.classList.add('db-paccayaniddeso-root');
    document.body.classList.add('db-paccayaniddeso-reader-standard');
    const header=screenHeader();
    const panel=document.getElementById('paccayaniddesoContents');
    const toggle=document.getElementById('paccayaniddesoContentsToggle');
    const setOpen=open=>{
      if(!panel||!toggle) return;
      panel.classList.toggle('collapsed',!open);
      toggle.setAttribute('aria-expanded',String(open));
      toggle.textContent=open?(name.includes('chinese')?'收起':'Collapse'):(name.includes('chinese')?'展开':'Expand');
    };
    toggle?.addEventListener('click',()=>setOpen(panel.classList.contains('collapsed')));
    document.getElementById('btnContents')?.addEventListener('click',()=>setOpen(true));
    setOpen(true);
    const measure=()=>header&&document.documentElement.style.setProperty('--db-paccayaniddeso-header-height',Math.ceil(header.getBoundingClientRect().height)+'px');
    measure();
    addEventListener('resize',measure,{passive:true});
    if(header&&window.ResizeObserver)new ResizeObserver(measure).observe(header);
  }

  function normalize(value){
    return String(value||'').normalize('NFC').toLowerCase().replace(/[ṃṁŋ]/g,'ṃ').replace(/\s+/g,' ').trim();
  }
  function patternFor(query){
    const escaped=String(query||'').normalize('NFC').replace(/[.*+?^$(){}|[\]\\]/g,'\\$&').replace(/[ṃṁŋ]/gi,'[ṃṁŋ]');
    return escaped?new RegExp(escaped,'giu'):null;
  }
  function visibleRoots(){
    const roots=[...document.querySelectorAll('main')].filter(isVisible);
    return roots.length?roots:[document.body];
  }
  function searchUnits(roots){
    const selectors=['.source-page','.text-block','.pair-row','.reading-row','.source-paragraph','.verse-card'];
    for(const selector of selectors){
      const units=roots.flatMap(root=>[...root.querySelectorAll(selector)]).filter(isVisible);
      if(units.length>1) return units;
    }
    return roots;
  }
  function clearHighlights(){
    document.querySelectorAll('mark.db-search-hit').forEach(mark=>{
      const parent=mark.parentNode;
      mark.replaceWith(document.createTextNode(mark.textContent||''));
      if(parent) parent.normalize();
    });
  }
  function restoreUnits(){
    document.querySelectorAll('[data-db-search-display]').forEach(unit=>{
      unit.style.display=unit.dataset.dbSearchDisplay;
      delete unit.dataset.dbSearchDisplay;
    });
  }
  function clearSearch(restorePosition){
    clearHighlights();
    restoreUnits();
    const status=document.getElementById('db-search-status');
    if(status) status.textContent='';
    const saved=beforeSearch;
    beforeSearch=null;
    if(restorePosition&&saved){
      requestAnimationFrame(()=>requestAnimationFrame(()=>window.scrollTo({left:saved.x,top:saved.y,behavior:'instant'})));
    }
  }
  function highlight(root,query){
    const pattern=patternFor(query);
    if(!pattern) return [];
    const nodes=[];
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{
      acceptNode(node){
        const parent=node.parentElement;
        if(!parent||parent.closest('script,style,mark,.db-standard-controls,.db-bookmark-overlay,[hidden],.hidden')) return NodeFilter.FILTER_REJECT;
        pattern.lastIndex=0;
        return pattern.test(node.nodeValue||'')?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
      }
    });
    while(walker.nextNode()) nodes.push(walker.currentNode);
    const marks=[];
    nodes.forEach(node=>{
      const text=node.nodeValue||'',fragment=document.createDocumentFragment();
      let last=0;
      pattern.lastIndex=0;
      for(const match of text.matchAll(pattern)){
        fragment.append(document.createTextNode(text.slice(last,match.index)));
        const mark=create('mark',{class:'db-search-hit',text:match[0]});
        fragment.append(mark);marks.push(mark);
        last=match.index+match[0].length;
      }
      fragment.append(document.createTextNode(text.slice(last)));
      node.replaceWith(fragment);
    });
    return marks;
  }
  function runSearch(){
    const input=document.getElementById('db-search-input'),status=document.getElementById('db-search-status');
    if(!input) return;
    clearHighlights();restoreUnits();
    const raw=input.value.trim(),query=normalize(raw);
    if(!query){clearSearch(true);return}
    if(!beforeSearch) beforeSearch={x:window.scrollX,y:window.scrollY};
    const units=searchUnits(visibleRoots());
    let first=null,total=0;
    units.forEach(unit=>{
      const found=normalize(unit.innerText||unit.textContent).includes(query);
      unit.dataset.dbSearchDisplay=unit.style.display;
      unit.style.display=found?unit.dataset.dbSearchDisplay:'none';
      if(!found) return;
      const marks=highlight(unit,raw);total+=marks.length;
      if(!first&&marks.length) first=marks[0];
    });
    const text=words();
    if(status) status.textContent=total?text.matches(total):text.noResults;
    if(first){
      first.classList.add('db-search-current');
      setTimeout(()=>first.scrollIntoView({behavior:'smooth',block:'center'}),25);
    }
  }
  function installSearch(controls){
    controls.search.addEventListener('click',runSearch);
    controls.input.addEventListener('keydown',event=>{if(event.key==='Enter')runSearch()});
    controls.input.addEventListener('input',()=>{
      if(controls.input.value.trim()){
        if(!beforeSearch) beforeSearch={x:window.scrollX,y:window.scrollY};
        return;
      }
      clearSearch(true);
    });
  }

  function allAnchorCandidates(){
    const selector='.source-page,.page-anchor,.text-block,.pair-row,.reading-row,.source-paragraph,.verse-card,section[id],article[id]';
    const nodes=[...document.querySelectorAll(selector)].filter(node=>!node.closest('.db-standard-controls,.db-bookmark-overlay'));
    nodes.forEach((node,index)=>node.dataset.dbBookmarkAnchor=String(index));
    return nodes;
  }
  function currentAnchor(candidates){
    const visible=candidates.filter(isVisible),line=(screenHeader()?.getBoundingClientRect().height||60)+12;
    let current=visible[0]||null,best=Infinity;
    visible.forEach(node=>{
      const rect=node.getBoundingClientRect();
      const distance=rect.top<=line?line-rect.top:rect.top-line+100000;
      if(distance<best){best=distance;current=node}
    });
    return current;
  }
  function bookmarkLabel(node){
    const text=String(node?.innerText||node?.textContent||'').replace(/\s+/g,' ').trim();
    return (text||document.title||'Reading position').slice(0,120);
  }
  function loadBookmarks(){
    try{const value=JSON.parse(localStorage.getItem(BOOKMARK_KEY)||'[]');return Array.isArray(value)?value:[]}catch(_){return[]}
  }
  function saveBookmarks(items){
    try{localStorage.setItem(BOOKMARK_KEY,JSON.stringify(items))}catch(_){}
  }
  function languageOf(node){
    return node?.closest('main[data-lang]')?.dataset.lang||node?.closest('[lang]')?.getAttribute('lang')||'';
  }
  function activateLanguage(lang){
    const map={en:['langEn','enBtn'],zh:['langZh','zhBtn'],my:['langMy','myBtn']};
    const id=(map[lang]||[]).find(candidate=>document.getElementById(candidate));
    if(id) document.getElementById(id).click();
  }
  function buildBookmarkModal(candidates){
    const overlay=create('div',{id:'db-bookmark-overlay',class:'db-bookmark-overlay','aria-hidden':'true'});
    const panel=create('div',{class:'db-bookmark-panel',role:'dialog','aria-modal':'true','aria-labelledby':'db-bookmark-title'});
    const head=create('div',{class:'db-bookmark-head'}),title=create('div',{id:'db-bookmark-title',class:'db-bookmark-title',text:'Book Marks'});
    const close=create('button',{class:'db-bookmark-close',type:'button',text:'×','aria-label':'Close book marks'});
    const body=create('div',{class:'db-bookmark-body'}),current=create('p',{class:'db-bookmark-current'});
    const add=create('button',{class:'db-bookmark-add',type:'button',text:'Add book mark here'}),list=create('div',{class:'db-bookmark-list'});
    head.append(title,close);body.append(current,add,list);panel.append(head,body);overlay.append(panel);document.body.append(overlay);
    function closeModal(){overlay.classList.remove('open');overlay.setAttribute('aria-hidden','true')}
    function go(item){
      closeModal();activateLanguage(item.lang);
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        const anchor=document.querySelector('[data-db-bookmark-anchor="'+item.anchor+'"]');
        if(anchor){
          const top=anchor.getBoundingClientRect().top+window.scrollY+(item.offset||0);
          window.scrollTo({top,left:0,behavior:'smooth'});
        }else window.scrollTo({top:item.scrollY||0,left:0,behavior:'smooth'});
      }));
    }
    function render(){
      const text=words(),anchor=currentAnchor(candidates);current.textContent=text.current+bookmarkLabel(anchor);
      title.textContent=text.modal;add.textContent=text.add;close.setAttribute('aria-label',text.close);
      list.replaceChildren();
      const items=loadBookmarks();
      if(!items.length){list.append(create('div',{class:'db-bookmark-empty',text:text.empty}));return}
      items.forEach(item=>{
        const row=create('div',{class:'db-bookmark-row'}),label=create('div',{class:'db-bookmark-label',text:item.label||'Reading position'});
        label.append(create('span',{class:'db-bookmark-time',text:new Date(item.createdAt).toLocaleString()}));
        const goButton=create('button',{type:'button',text:text.go}),remove=create('button',{type:'button',text:text.remove});
        goButton.addEventListener('click',()=>go(item));
        remove.addEventListener('click',()=>{saveBookmarks(loadBookmarks().filter(saved=>saved.id!==item.id));render()});
        row.append(label,goButton,remove);list.append(row);
      });
    }
    function openModal(){render();overlay.classList.add('open');overlay.setAttribute('aria-hidden','false');close.focus()}
    close.addEventListener('click',closeModal);overlay.addEventListener('click',event=>{if(event.target===overlay)closeModal()});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&overlay.classList.contains('open'))closeModal()});
    add.addEventListener('click',()=>{
      const anchor=currentAnchor(candidates),rect=anchor?.getBoundingClientRect();
      const item={id:String(Date.now())+'-'+Math.random().toString(36).slice(2,8),createdAt:new Date().toISOString(),anchor:anchor?.dataset.dbBookmarkAnchor||'',offset:rect?Math.round(-rect.top):0,scrollY:window.scrollY,lang:languageOf(anchor),label:bookmarkLabel(anchor)};
      const items=loadBookmarks();items.unshift(item);saveBookmarks(items.slice(0,100));render();
    });
    return {openModal};
  }

  function installCategoryContentsStyle(){
    const name=location.pathname.split('/').pop().toLowerCase();
    if(![
      'mindfulness-of-breathing.html',
      'the-only-way-for-realization-of-nibbana.html',
      'the-requisites-of-enlightenment.html',
      'patisambhidamagga.html',
      'zhiguan-fayao.html',
      'the-buddhas-twelve-kinds-of-evil-retribution.html'
    ].includes(name)) return;
    document.body.classList.add('db-standard-contents');
    // Refresh the existing shared stylesheet without rewriting large book files.
    const stylesheet=document.querySelector('link[rel="stylesheet"][href*="dhamma-books-reader-standard.css"]');
    if(stylesheet){
      const url=new URL(stylesheet.href,document.baseURI);
      url.searchParams.set('v','1.3.15');
      if(stylesheet.href!==url.href) stylesheet.href=url.href;
    }
  }
  function installDailyChantsStandard(){
    if(location.pathname.split('/').pop().toLowerCase()!=='daily-chants.html') return;
    document.documentElement.classList.add('db-daily-chants-root');
    document.body.classList.add('db-daily-chants-standard');
    const header=screenHeader();
    const contents=document.getElementById('dailyChantsContents');
    const toggle=document.getElementById('contentsToggle');
    const setOpen=open=>{
      if(!contents||!toggle) return;
      contents.classList.toggle('collapsed',!open);
      toggle.setAttribute('aria-expanded',String(open));
      toggle.textContent=open?'Collapse':'Expand';
    };
    toggle?.addEventListener('click',()=>setOpen(contents.classList.contains('collapsed')));
    document.getElementById('btnContents')?.addEventListener('click',()=>setOpen(true));
    setOpen(true);
    const measure=()=>header&&document.documentElement.style.setProperty('--db-daily-chants-header-height',Math.ceil(header.getBoundingClientRect().height)+'px');
    measure();addEventListener('resize',measure,{passive:true});if(header&&window.ResizeObserver)new ResizeObserver(measure).observe(header);
  }
  function installApprovedHeadingHierarchy(){
    const name=location.pathname.split('/').pop().toLowerCase();
    const setLevel=(heading,isSubheading)=>{
      if(!heading) return;
      heading.classList.toggle('db-main-heading',!isSubheading);
      heading.classList.toggle('db-subheading',isSubheading);
    };
    if(name==='mindfulness-of-breathing.html'){
      document.querySelectorAll('#en-contents a.toc-row[href^="#"],#zh-contents a.toc-row[href^="#"]').forEach(link=>{
        const heading=document.getElementById(decodeURIComponent(link.hash.slice(1)));
        if(heading?.matches('#reader-en > .section-heading,#reader-zh > .section-heading')){
          setLevel(heading,link.classList.contains('sub'));
        }
      });
      setLevel(document.getElementById('en-endnotes'),false);
      return;
    }
    if(name==='the-only-way-for-realization-of-nibbana.html'){
      const chinese=document.getElementById('reader-zh');
      if(!chinese) return;
      const major=new Set(['中译序','第一章绪论','第二章大念处经','第三章总说','第四章止业处','第五章观业处','尾注']);
      chinese.querySelectorAll(':scope > .section-heading,:scope > .subheading').forEach(heading=>{
        const title=(heading.textContent||'').replace(/\s+/g,'');
        setLevel(heading,!major.has(title));
      });
      return;
    }
    if(name==='the-requisites-of-enlightenment.html'){
      const english=document.querySelector('#enPanel .reader-body');
      const chinese=document.querySelector('#zhPanel .reader-body');
      const majorEnglish=new Set(["Editor’s Preface","Preface to the Second Edition","Translator’s Preface","Introduction","Glossary"]);
      english?.querySelectorAll(':scope > .section-heading').forEach(heading=>{
        const title=(heading.textContent||'').replace(/\s+/g,' ').trim();
        setLevel(heading,!(majorEnglish.has(title)||/^(?:[IVX]+)\./.test(title)));
      });
      chinese?.querySelectorAll(':scope > .section-heading,:scope > .sub-heading').forEach(heading=>{
        setLevel(heading,heading.classList.contains('sub-heading'));
      });
      return;
    }
    if(name==='zhiguan-fayao.html'||name==='the-buddhas-twelve-kinds-of-evil-retribution.html'){
      document.querySelectorAll('#reader-zh .book-body > .section-heading,#reader-zh .book-body > .sub-heading').forEach(heading=>{
        setLevel(heading,heading.classList.contains('sub-heading'));
      });
    }
  }
  function installMindfulnessReaderStandard(controls){
    if(location.pathname.split('/').pop().toLowerCase()!=='mindfulness-of-breathing.html') return;
    document.body.classList.add('db-mindfulness-reader-standard');
    const header=screenHeader();
    document.querySelectorAll('#en-contents,#zh-contents').forEach(contents=>{
      const toggle=contents.querySelector(':scope > .contents-head > .contents-toggle');
      const scroll=contents.querySelector(':scope > .contents-scroll');
      if(!toggle||!scroll)return;
      const setOpen=open=>{contents.classList.toggle('collapsed',!open);toggle.setAttribute('aria-expanded',String(open));toggle.textContent=contents.id==='zh-contents'?(open?'收起':'展开'):(open?'Collapse':'Expand')};
      toggle.addEventListener('click',()=>setOpen(contents.classList.contains('collapsed')));setOpen(true);
    });
    document.getElementById('contentsBtn')?.addEventListener('click',event=>{
      event.preventDefault();const contents=document.getElementById(currentLanguage()==='zh'?'zh-contents':'en-contents');
      contents?.classList.remove('collapsed');const toggle=contents?.querySelector('.contents-toggle');
      if(toggle){toggle.setAttribute('aria-expanded','true');toggle.textContent=currentLanguage()==='zh'?'收起':'Collapse'}
      contents?.scrollIntoView({behavior:'smooth',block:'start'});
    });
    const measure=()=>header&&document.documentElement.style.setProperty('--db-mindfulness-header-height',Math.ceil(header.getBoundingClientRect().height)+'px');
    measure();addEventListener('resize',measure,{passive:true});if(header&&window.ResizeObserver)new ResizeObserver(measure).observe(header);
  }
  function installDailyChantsBurmeseStandard(){
    if(location.pathname.split('/').pop().toLowerCase()!=='daily-chants-burmese.html') return;
    document.body.classList.add('db-daily-chants-burmese-standard');
    const header=screenHeader();
    const contents=document.getElementById('contentsPanel');
    const toggle=document.getElementById('contentsToggle');
    const setOpen=open=>{
      if(!contents||!toggle) return;
      contents.classList.toggle('collapsed',!open);
      toggle.setAttribute('aria-expanded',String(open));
      toggle.textContent=open?'ပိတ်မည်':'ဖွင့်မည်';
    };
    toggle?.addEventListener('click',()=>setOpen(contents.classList.contains('collapsed')));
    document.getElementById('contentsBtn')?.addEventListener('click',event=>{
      event.preventDefault();
      setOpen(true);
      contents?.scrollIntoView({behavior:'smooth',block:'start'});
    });
    setOpen(true);
    const measure=()=>header&&document.documentElement.style.setProperty('--db-daily-burmese-header-height',Math.ceil(header.getBoundingClientRect().height)+'px');
    measure();addEventListener('resize',measure,{passive:true});if(header&&window.ResizeObserver)new ResizeObserver(measure).observe(header);
  }
  function installRequisitesReaderStandard(){
    if(location.pathname.split('/').pop().toLowerCase()!=='the-requisites-of-enlightenment.html') return;
    document.body.classList.add('db-requisites-reader-standard');
    const header=screenHeader();
    document.querySelectorAll('#en-toc,#zh-toc').forEach(contents=>{
      const toggle=contents.querySelector(':scope > .contents-head > .contents-toggle');
      const scroll=contents.querySelector(':scope > .contents-scroll');
      if(!toggle||!scroll) return;
      const setOpen=open=>{
        contents.classList.toggle('collapsed',!open);
        toggle.setAttribute('aria-expanded',String(open));
        toggle.textContent=contents.id==='zh-toc'?(open?'收起':'展开'):(open?'Collapse':'Expand');
      };
      toggle.addEventListener('click',()=>setOpen(contents.classList.contains('collapsed')));
      setOpen(true);
    });
    document.getElementById('contentsBtn')?.addEventListener('click',event=>{
      event.preventDefault();
      const contents=document.getElementById(currentLanguage()==='zh'?'zh-toc':'en-toc');
      contents?.classList.remove('collapsed');
      const toggle=contents?.querySelector('.contents-toggle');
      if(toggle){toggle.setAttribute('aria-expanded','true');toggle.textContent=currentLanguage()==='zh'?'收起':'Collapse'}
      contents?.scrollIntoView({behavior:'smooth',block:'start'});
    });
    const measure=()=>header&&document.documentElement.style.setProperty('--db-requisites-header-height',Math.ceil(header.getBoundingClientRect().height)+'px');
    measure();addEventListener('resize',measure,{passive:true});if(header&&window.ResizeObserver)new ResizeObserver(measure).observe(header);
  }
  function installOnlyWayReaderStandard(){
    if(location.pathname.split('/').pop().toLowerCase()!=='the-only-way-for-realization-of-nibbana.html') return;
    document.body.classList.add('db-only-way-reader-standard','db-standard-contents');
    const header=screenHeader();
    document.querySelectorAll('#en-contents,#zh-contents').forEach(contents=>{
      const toggle=contents.querySelector(':scope > .contents-head > .contents-toggle');
      const scroll=contents.querySelector(':scope > .contents-scroll');
      if(!toggle||!scroll) return;
      const setOpen=open=>{
        contents.classList.toggle('collapsed',!open);
        toggle.setAttribute('aria-expanded',String(open));
        toggle.textContent=contents.id==='zh-contents'?(open?'收起':'展开'):(open?'Collapse':'Expand');
      };
      toggle.addEventListener('click',()=>setOpen(contents.classList.contains('collapsed')));
      setOpen(true);
    });
    document.getElementById('contentsBtn')?.addEventListener('click',event=>{
      event.preventDefault();
      const contents=document.getElementById(currentLanguage()==='zh'?'zh-contents':'en-contents');
      contents?.classList.remove('collapsed');
      const toggle=contents?.querySelector('.contents-toggle');
      if(toggle){toggle.setAttribute('aria-expanded','true');toggle.textContent=currentLanguage()==='zh'?'收起':'Collapse'}
      contents?.scrollIntoView({behavior:'smooth',block:'start'});
    });
    const measure=()=>header&&document.documentElement.style.setProperty('--db-only-way-header-height',Math.ceil(header.getBoundingClientRect().height)+'px');
    measure();addEventListener('resize',measure,{passive:true});if(header&&window.ResizeObserver)new ResizeObserver(measure).observe(header);
  }
  function installPatisambhidamaggaReaderStandard(){
    if(location.pathname.split('/').pop().toLowerCase()!=='patisambhidamagga.html') return;
    document.body.classList.add('db-patisambhidamagga-reader-standard','db-standard-contents');
    const header=screenHeader(),contents=document.getElementById('contents');
    const toggle=contents?.querySelector(':scope > .contents-head > .contents-toggle');
    const scroll=contents?.querySelector(':scope > .contents-scroll');
    if(toggle&&scroll){
      const setOpen=open=>{
        contents.classList.toggle('collapsed',!open);
        toggle.setAttribute('aria-expanded',String(open));
        toggle.textContent=open?'收起':'展开';
      };
      toggle.addEventListener('click',()=>setOpen(contents.classList.contains('collapsed')));
      setOpen(true);
      document.getElementById('contentsBtn')?.addEventListener('click',event=>{
        event.preventDefault();setOpen(true);contents.scrollIntoView({behavior:'smooth',block:'start'});
      });
    }
    const measure=()=>header&&document.documentElement.style.setProperty('--db-patisambhidamagga-header-height',Math.ceil(header.getBoundingClientRect().height)+'px');
    measure();addEventListener('resize',measure,{passive:true});if(header&&window.ResizeObserver)new ResizeObserver(measure).observe(header);
  }
  function migrateRequisitesBookmark(candidates){
    if(location.pathname.split('/').pop().toLowerCase()!=='the-requisites-of-enlightenment.html') return;
    let saved=[];try{saved=JSON.parse(localStorage.getItem(BOOKMARK_KEY)||'[]')}catch{}
    if(Array.isArray(saved)&&saved.length) return;
    let legacy;try{legacy=JSON.parse(localStorage.getItem('bodhi-bookmark')||'null')}catch{}
    if(!legacy) return;
    const target=(legacy.id&&document.getElementById(legacy.id))||(legacy.id&&document.querySelector('[data-section="'+CSS.escape(legacy.id)+'"]'));
    const candidate=target&&(candidates.includes(target)?target:target.closest('.source-page,.page-anchor,.text-block,.pair-row,.reading-row,.source-paragraph,.verse-card,section[id],article[id]'));
    const item={id:'legacy-'+Date.now(),createdAt:new Date().toISOString(),anchor:candidate?.dataset.dbBookmarkAnchor||'',offset:0,scrollY:Number(legacy.y)||0,lang:legacy.lang||'zh',label:(target?.textContent||'Imported book mark').replace(/\s+/g,' ').trim().slice(0,90)};
    try{localStorage.setItem(BOOKMARK_KEY,JSON.stringify([item]))}catch{}
  }
  function migrateDailyChantsBurmeseBookmark(){
    if(location.pathname.split('/').pop().toLowerCase()!=='daily-chants-burmese.html'||loadBookmarks().length) return;
    let raw=null;try{raw=localStorage.getItem('pamc-daily-chants-burmese-bookmark')}catch{}
    if(raw===null) return;
    const scrollY=Number(raw);
    if(!Number.isFinite(scrollY)||scrollY<0) return;
    saveBookmarks([{id:'legacy-'+Date.now(),createdAt:new Date().toISOString(),anchor:'',offset:0,scrollY,lang:'my',label:'ယခင်စာညှပ်'}]);
  }
  function migratePatisambhidamaggaBookmarks(candidates){
    if(location.pathname.split('/').pop().toLowerCase()!=='patisambhidamagga.html') return;
    if(loadBookmarks().length) return;
    let legacy=[];
    try{legacy=JSON.parse(localStorage.getItem('patisambhidamagga_reader_bookmarks_v1')||'[]')}catch{}
    if(!Array.isArray(legacy)) legacy=[];
    let single='';try{single=localStorage.getItem('patisambhidamagga_stage1_manual_bookmark_v7')||''}catch{}
    if(single&&!legacy.some(item=>item?.id===single)) legacy.unshift({id:single,title:'旧书签'});
    const imported=legacy.map((item,index)=>{
      const target=item?.id&&document.getElementById(item.id);
      const candidate=target&&(candidates.includes(target)?target:target.closest('.source-page,.page-anchor,.text-block,.pair-row,.reading-row,.source-paragraph,.verse-card,section[id],article[id]'));
      if(!candidate) return null;
      return {id:'legacy-'+Date.now()+'-'+index,createdAt:item.saved||new Date().toISOString(),anchor:candidate.dataset.dbBookmarkAnchor||'',offset:0,scrollY:0,lang:'zh',label:item.title||bookmarkLabel(target)};
    }).filter(Boolean);
    if(imported.length) saveBookmarks(imported);
  }
  function migrateOnlyWayBookmarks(candidates){
    if(location.pathname.split('/').pop().toLowerCase()!=='the-only-way-for-realization-of-nibbana.html') return;
    if(loadBookmarks().length) return;
    const imported=[];
    ['en','zh'].forEach((lang,index)=>{
      let legacy='';try{legacy=localStorage.getItem('tow-bookmark-'+lang)||''}catch{}
      const target=legacy&&document.getElementById(legacy);
      const candidate=target&&(candidates.includes(target)?target:target.closest('.source-page,.page-anchor,.text-block,.pair-row,.reading-row,.source-paragraph,.verse-card,section[id],article[id]'));
      if(!candidate) return;
      imported.push({id:'legacy-'+Date.now()+'-'+index,createdAt:new Date().toISOString(),anchor:candidate.dataset.dbBookmarkAnchor||'',offset:0,scrollY:0,lang,label:bookmarkLabel(target)});
    });
    if(imported.length) saveBookmarks(imported);
  }
  function migratePaccayaniddesoBookmarks(candidates){
    const name=location.pathname.split('/').pop().toLowerCase();
    if((name!=='paccayaniddeso.html'&&name!=='paccayaniddeso-chinese.html')||loadBookmarks().length) return;
    let legacy=[];
    try{legacy=JSON.parse(localStorage.getItem('paccayaniddeso-reader-v1:bookmarks')||'[]')}catch{}
    if(!Array.isArray(legacy)) return;
    const lang=name.includes('chinese')?'zh':'en';
    const imported=legacy.map((item,index)=>{
      const target=item?.id&&document.getElementById(item.id);
      const candidate=target&&(candidates.includes(target)?target:target.closest('.pair-row,.section-heading,.page-anchor,section[id],article[id]'));
      if(!candidate) return null;
      return {id:'legacy-'+Date.now()+'-'+index,createdAt:item.saved||new Date().toISOString(),anchor:candidate.dataset.dbBookmarkAnchor||'',offset:0,scrollY:0,lang,label:item.title||bookmarkLabel(target)};
    }).filter(Boolean);
    if(imported.length) saveBookmarks(imported);
  }
  function init(){
    ensurePopupMovementStandard();
    installCategoryContentsStyle();
    installApprovedHeadingHierarchy();
    installContinuousChantingFlow();
    installDailyChantsStandard();
    installPaccayaniddesoReaderStandard();
    const controls=adoptPaccayaniddesoControls()||buildControls();
    if(!controls) return;
    installMindfulnessReaderStandard(controls);
    installDailyChantsBurmeseStandard();
    installRequisitesReaderStandard();
    installOnlyWayReaderStandard();
    installPatisambhidamaggaReaderStandard();
    function applyLanguage(){
      const text=words();
      controls.bookmark.textContent=text.bookmark;
      controls.bookmark.setAttribute('aria-label',text.modal);
      controls.search.textContent=text.search;
      controls.input.placeholder=text.placeholder;
      controls.input.setAttribute('aria-label',text.placeholder);
    }
    applyLanguage();
    ['langEn','langZh','enBtn','zhBtn','langMy','myBtn'].forEach(id=>{
      const button=document.getElementById(id);
      if(button) button.addEventListener('click',()=>setTimeout(applyLanguage,0));
    });
    installSearch(controls);
    const candidates=allAnchorCandidates();
    migrateDailyChantsBurmeseBookmark();
    migrateRequisitesBookmark(candidates);
    migratePatisambhidamaggaBookmarks(candidates);
    migrateOnlyWayBookmarks(candidates);
    migratePaccayaniddesoBookmarks(candidates);
    const bookmark=buildBookmarkModal(candidates);
    controls.bookmark.addEventListener('click',bookmark.openModal);
    window.DhammaBooksReaderStandard={runSearch,clearSearch,openBookmarks:bookmark.openModal,applyLanguage,version:'1.3.19'};
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
