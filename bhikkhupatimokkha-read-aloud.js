(()=>{
  'use strict';
  function ensureUI(){
    if(!document.getElementById('readAloudBtn')){
      const fontPlus=document.getElementById('fontPlus');
      fontPlus?.insertAdjacentHTML('afterend','<button class="read-aloud-button" id="readAloudBtn" type="button" aria-label="朗读中文" title="朗读中文" aria-controls="read-aloud-panel" aria-expanded="false" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6.5 9H3v6h3.5L11 19V5Z"></path><path d="M15 9a4 4 0 0 1 0 6"></path><path d="M18 6a8 8 0 0 1 0 12"></path></svg></button>');
    }
    if(!document.getElementById('read-aloud-panel')){
      document.querySelector('.topbar')?.insertAdjacentHTML('afterend','<aside class="read-aloud-panel" id="read-aloud-panel" aria-labelledby="read-aloud-title" hidden><div class="read-aloud-panel-head"><h2 class="read-aloud-panel-title" id="read-aloud-title">中文朗读</h2><button class="read-aloud-close" id="read-aloud-close" type="button" aria-label="关闭朗读控制">×</button></div><div class="read-aloud-actions"><button id="read-aloud-start" type="button">从此处开始</button><button id="read-aloud-selection" type="button">朗读所选文字</button><button id="read-aloud-pause" type="button" disabled>暂停</button><button id="read-aloud-stop" type="button" disabled>停止</button></div><div class="read-aloud-settings"><label for="read-aloud-rate">速度</label><select id="read-aloud-rate"><option value="0.75">0.75×</option><option value="0.9">0.9×</option><option value="1" selected>1×</option><option value="1.15">1.15×</option><option value="1.3">1.3×</option><option value="1.5">1.5×</option></select><label for="read-aloud-voice">中文声音</label><select id="read-aloud-voice"><option value="">自动选择</option></select><label for="read-aloud-pali-voice">巴利语声音</label><select id="read-aloud-pali-voice"><option value="__indic__">优先印度语系声音（如有）</option><option value="__english__">英语声音</option></select><label for="read-aloud-read-pali">朗读巴利经文</label><select id="read-aloud-read-pali"><option value="no">不朗读</option><option value="yes">朗读</option></select></div><p class="read-aloud-status" id="read-aloud-status" aria-live="polite">可选择朗读巴利原文与中文；註释按钮和弹窗将略过。</p></aside>');
    }
  }
  ensureUI();
  const synth=window.speechSynthesis;
  const panel=document.getElementById('read-aloud-panel');
  const openButton=document.getElementById('readAloudBtn');
  const closeButton=document.getElementById('read-aloud-close');
  const startButton=document.getElementById('read-aloud-start');
  const selectionButton=document.getElementById('read-aloud-selection');
  const pauseButton=document.getElementById('read-aloud-pause');
  const stopButton=document.getElementById('read-aloud-stop');
  const rateSelect=document.getElementById('read-aloud-rate');
  const voiceSelect=document.getElementById('read-aloud-voice');
  const paliVoiceSelect=document.getElementById('read-aloud-pali-voice');
  const readPaliSelect=document.getElementById('read-aloud-read-pali');
  const status=document.getElementById('read-aloud-status');
  const reader=document.getElementById('reader-main');
  const header=document.querySelector('.topbar');
  if(!panel||!openButton||!reader)return;
  const supported=Boolean(synth&&window.SpeechSynthesisUtterance);
  const blockSelector='.chapter-title,.section-title,.book-heading,.source-paragraph,.single-text,.numbered-item,.rule-item,.ch10-chinese-line,.source-meaning,.opening-quotation,.copyright-line,.copyright-notice li,.translation-cell,.zh-text,.chinese-cell,.prose-zh-cell';
  const excludedSelector='rt,.pinyin,.heading-en,.toc-en,.pali-source-line,.ch10-pali-line,.pali-cell,.footnote-ref,button,[hidden],[aria-hidden="true"],.proof-marker';
  let blocks=[],blockIndex=0,chunks=[],chunkIndex=0,current=null,token=0,paused=false;
  function setPanelTop(){const h=header?.getBoundingClientRect().height||64;document.documentElement.style.setProperty('--read-aloud-top',Math.ceil(h+8)+'px')}
  function showPanel(){setPanelTop();panel.hidden=false;openButton.setAttribute('aria-expanded','true');openButton.setAttribute('aria-pressed','true')}
  function hidePanel(){if(!paused&&!pauseButton.disabled){synth.pause();paused=true;pauseButton.textContent='继续';status.textContent='已暂停'}panel.hidden=true;openButton.setAttribute('aria-expanded','false');openButton.setAttribute('aria-pressed','false')}
  function visible(el){const style=getComputedStyle(el);return style.display!=='none'&&style.visibility!=='hidden'&&el.getClientRects().length>0&&!el.closest('[hidden],[aria-hidden="true"]')}
  function cleanText(el){const copy=el.cloneNode(true);copy.querySelectorAll(excludedSelector).forEach(node=>node.remove());return copy.textContent.replace(/\s+/g,' ').replace(/\s+([，。！？；：、）])/g,'$1').trim()}
  function readableBlocks(){const all=[...reader.querySelectorAll(blockSelector)].filter(visible).filter(el=>!el.closest('.contents,.contents-panel,.cover,.cover-card,.modal,.footnote-popup,.proof-panel'));const chinese=all.filter((el,i)=>!all.some((other,j)=>j!==i&&other.contains(el)&&cleanText(other)===cleanText(el))).map(el=>({el,text:cleanText(el)})).filter(x=>/[\u3400-\u9fff]/u.test(x.text));return readPaliSelect.value==='yes'?[...chinese,...window.DhammaBooksReadAloudVoice.paliBlocks(reader)].sort((a,b)=>a.el.compareDocumentPosition(b.el)&Node.DOCUMENT_POSITION_FOLLOWING?-1:1):chinese}
  function splitText(text){return window.DhammaBooksReadAloudVoice.splitText(text)}
  function clearHighlight(){current?.classList.remove('read-aloud-current');current=null}
  function setControls(active){pauseButton.disabled=!active;stopButton.disabled=!active;startButton.textContent=active?'重新开始':'从此处开始'}
  function finish(message='朗读完成。'){synth?.cancel();clearHighlight();setControls(false);paused=false;pauseButton.textContent='暂停';status.textContent=message}
  function selectedChinese(){const sel=getSelection();if(!sel||sel.isCollapsed||!sel.rangeCount)return null;const range=sel.getRangeAt(0),ancestor=range.commonAncestorContainer.nodeType===1?range.commonAncestorContainer:range.commonAncestorContainer.parentElement,text=sel.toString().replace(/\s+/g,' ').trim();return ancestor&&reader.contains(ancestor)&&(/[\u3400-\u9fff]/u.test(text)||(readPaliSelect.value==='yes'&&/[\p{Script=Latin}]/u.test(text)))?{el:ancestor.closest(blockSelector)||ancestor,text,pali:!/[\u3400-\u9fff]/u.test(text),range:range.cloneRange()}:null}
  function selectionStartIndex(selection,list){if(!selection)return-1;return list.findIndex(block=>block.el===selection.el||block.el.contains(selection.el)||selection.el.contains(block.el))}
  function textFromSelectionStart(selection,block){
    if(!selection?.range||!block?.el.contains(selection.range.startContainer))return block?.text||'';
    const range=document.createRange();
    range.selectNodeContents(block.el);
    range.setStart(selection.range.startContainer,selection.range.startOffset);
    const copy=document.createElement('div');
    copy.append(range.cloneContents());
    copy.querySelectorAll(excludedSelector).forEach(node=>node.remove());
    return copy.textContent.replace(/\s+/g,' ').replace(/\s+([，。！？；：、）])/g,'$1').trim();
  }
  function keepCurrentVisible(el){
    const rect=el.getBoundingClientRect();
    const safeTop=(header?.getBoundingClientRect().bottom||0)+12;
    const safeBottom=innerHeight-40;
    if(rect.bottom>=safeTop&&rect.top<=safeBottom)return;
    el.scrollIntoView({behavior:'smooth',block:'nearest'});
  }
  function chosenVoice(){const voices=synth.getVoices(),choice=voiceSelect.value;return window.DhammaBooksReadAloudVoice?.chooseVoice(voices,choice)||voices.find(v=>/^zh-(CN|SG)/i.test(v.lang))||voices.find(v=>/^zh/i.test(v.lang))||null}
  function populateVoices(){const saved=window.DhammaBooksReadAloudVoice?.load()||{voice:''},previous=voiceSelect.dataset.ready?voiceSelect.value:saved.voice,voices=synth.getVoices().filter(v=>/^zh/i.test(v.lang));voiceSelect.replaceChildren(new Option('自动选择',''),...voices.map(v=>new Option(`${v.name} (${v.lang})`,v.voiceURI)));voiceSelect.value=voices.some(v=>v.voiceURI===previous)||previous===''?previous:'';voiceSelect.dataset.ready='true';const pali=window.DhammaBooksReadAloudVoice,prior=paliVoiceSelect.dataset.ready?paliVoiceSelect.value:'__indic__',options=pali.paliVoices(synth.getVoices());paliVoiceSelect.replaceChildren(new Option('优先印度语系声音（如有）','__indic__'),new Option('英语声音','__english__'),...options.map(v=>new Option(`${v.name} (${v.lang})`,v.voiceURI)));paliVoiceSelect.value=options.some(v=>v.voiceURI===prior)||prior==='__english__'?prior:'__indic__';paliVoiceSelect.dataset.ready='true';readPaliSelect.value=saved.readPali?'yes':'no'}
  function speakChunk(runToken){if(runToken!==token)return;if(chunkIndex>=chunks.length){blockIndex++;return speakBlock(runToken)}const chunk=chunks[chunkIndex++];window.DhammaBooksReadAloudVoice.speakWithFallback(synth,chunk,rateSelect.value,synth.getVoices(),voiceSelect.value,paliVoiceSelect.value,()=>speakChunk(runToken),()=>finish('朗读发生错误，请再试一次。'),()=>{status.textContent='此设备无法使用所选巴利语声音，已改用英语声音继续朗读。'})}
  function speakBlock(runToken){if(runToken!==token)return;if(blockIndex>=blocks.length)return finish();clearHighlight();const block=blocks[blockIndex];current=block.el;current.classList.add('read-aloud-current');keepCurrentVisible(current);chunks=block.pali?window.DhammaBooksReadAloudVoice.paliSpeechChunks(block.text).map(text=>({text,lang:'latin'})):window.DhammaBooksReadAloudVoice.speechChunks(block.text);chunkIndex=0;status.textContent=`正在朗读第 ${blockIndex+1} 段，共 ${blocks.length} 段`;speakChunk(runToken)}
  function start(){if(!supported)return;token++;synth.cancel();clearHighlight();const selection=selectedChinese();blocks=readableBlocks();if(selection){blockIndex=selectionStartIndex(selection,blocks);if(blockIndex<0)blockIndex=0;else{const remainder=textFromSelectionStart(selection,blocks[blockIndex]);if(remainder)blocks[blockIndex]={...blocks[blockIndex],text:remainder}}}else{const offset=(header?.getBoundingClientRect().height||0)+8;blockIndex=blocks.findIndex(x=>x.el.getBoundingClientRect().bottom>offset);if(blockIndex<0)blockIndex=0}if(!blocks.length)return finish('此处没有可朗读的中文内容。');paused=false;pauseButton.textContent='暂停';setControls(true);speakBlock(token)}
  function readSelection(){if(!supported)return;const selection=selectedChinese();if(!selection){status.textContent='请先选择要朗读的文字。';return}token++;synth.cancel();clearHighlight();blocks=[selection];blockIndex=0;paused=false;pauseButton.textContent='暂停';setControls(true);speakBlock(token)}
  function togglePause(){if(!supported||!synth.speaking)return;if(paused){synth.resume();paused=false;pauseButton.textContent='暂停';status.textContent=`继续朗读第 ${blockIndex+1} 段，共 ${blocks.length} 段`}else{synth.pause();paused=true;pauseButton.textContent='继续';status.textContent='已暂停'}}
  function stop(){token++;finish('已停止朗读。')}
  openButton.addEventListener('click',()=>panel.hidden?showPanel():hidePanel());closeButton.addEventListener('click',hidePanel);startButton.addEventListener('click',start);selectionButton.addEventListener('click',readSelection);pauseButton.addEventListener('click',togglePause);stopButton.addEventListener('click',stop);voiceSelect.addEventListener('change',()=>window.DhammaBooksReadAloudVoice?.save({voice:voiceSelect.value}));paliVoiceSelect.addEventListener('change',()=>window.DhammaBooksReadAloudVoice?.save({paliVoice:paliVoiceSelect.value}));readPaliSelect.addEventListener('change',()=>window.DhammaBooksReadAloudVoice.save({readPali:readPaliSelect.value==='yes'}));addEventListener('resize',()=>{if(!panel.hidden)setPanelTop()},{passive:true});addEventListener('beforeunload',()=>synth?.cancel());document.addEventListener('visibilitychange',()=>{if(document.hidden&&!/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)&&synth?.speaking&&!paused){synth.pause();paused=true;pauseButton.textContent='继续';status.textContent='页面已隐藏，朗读自动暂停。'}});
  if(supported){populateVoices();if('onvoiceschanged' in synth)synth.onvoiceschanged=populateVoices}else{openButton.disabled=true;openButton.title='此浏览器不支持朗读';status.classList.add('read-aloud-unavailable');status.textContent='此浏览器不支持朗读，请使用最新版 Chrome、Edge 或 Safari。'}
})();
