/* Dhamma-Books shared bookmark, search, header, and chanting-flow behavior v1.3.0 */
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
    if(!host||document.getElementById('db-standard-controls')) return null;
    hideLegacyControls();
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

  function init(){
    installContinuousChantingFlow();
    const controls=buildControls();
    if(!controls) return;
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
    const bookmark=buildBookmarkModal(allAnchorCandidates());
    controls.bookmark.addEventListener('click',bookmark.openModal);
    window.DhammaBooksReaderStandard={runSearch,clearSearch,openBookmarks:bookmark.openModal,applyLanguage,version:'1.3.0'};
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
