(()=>{
  'use strict';
  function ensureUI(){
    if(!document.getElementById('readAloudBtn')){
      const fontPlus=document.getElementById('fontPlus');
      fontPlus?.insertAdjacentHTML('afterend','<button class="read-aloud-button" id="readAloudBtn" type="button" aria-label="朗读中文" title="朗读中文" aria-controls="read-aloud-panel" aria-expanded="false" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6.5 9H3v6h3.5L11 19V5Z"></path><path d="M15 9a4 4 0 0 1 0 6"></path><path d="M18 6a8 8 0 0 1 0 12"></path></svg></button>');
    }
    if(!document.getElementById('read-aloud-panel')){
      document.querySelector('.topbar')?.insertAdjacentHTML('afterend','<aside class="read-aloud-panel" id="read-aloud-panel" aria-labelledby="read-aloud-title" hidden><div class="read-aloud-panel-head"><h2 class="read-aloud-panel-title" id="read-aloud-title">中文朗读</h2><button class="read-aloud-close" id="read-aloud-close" type="button" aria-label="关闭朗读控制">×</button></div><div class="read-aloud-actions"><button id="read-aloud-start" type="button">从此处开始</button><button id="read-aloud-pause" type="button" disabled>暂停</button><button id="read-aloud-stop" type="button" disabled>停止</button></div><div class="read-aloud-settings"><label for="read-aloud-rate">速度</label><select id="read-aloud-rate"><option value="0.75">0.75×</option><option value="0.9">0.9×</option><option value="1" selected>1×</option><option value="1.15">1.15×</option><option value="1.3">1.3×</option><option value="1.5">1.5×</option></select><label for="read-aloud-voice">中文声音</label><select id="read-aloud-voice"><option value="__male__">优先使用男声（如有）</option><option value="">自动选择</option></select></div><p class="read-aloud-status" id="read-aloud-status" aria-live="polite">只朗读中文；巴利文、註释按钮及弹窗内容将自动略过。</p></aside>');
    }
  }
  ensureUI();
  const synth=window.speechSynthesis;
  const panel=document.getElementById('read-aloud-panel');
  const openButton=document.getElementById('readAloudBtn');
  const closeButton=document.getElementById('read-aloud-close');
  const startButton=document.getElementById('read-aloud-start');
  const pauseButton=document.getElementById('read-aloud-pause');
  const stopButton=document.getElementById('read-aloud-stop');
  const rateSelect=document.getElementById('read-aloud-rate');
  const voiceSelect=document.getElementById('read-aloud-voice');
  const status=document.getElementById('read-aloud-status');
  const reader=document.getElementById('reader-main');
  const header=document.querySelector('.topbar');
  if(!panel||!openButton||!reader)return;
  const supported=Boolean(synth&&window.SpeechSynthesisUtterance);
  const blockSelector='.chapter-title,.section-title,.book-heading,.source-paragraph,.single-text,.numbered-item,.rule-item,.ch10-chinese-line,.source-meaning,.opening-quotation,.copyright-line,.copyright-notice li';
  const excludedSelector='rt,.pinyin,.heading-en,.toc-en,.pali-word,.font-pali,.pali-source-line,.ch10-pali-line,.pali-cell,.footnote-ref,button,[hidden],[aria-hidden="true"],.proof-marker';
  let blocks=[],blockIndex=0,chunks=[],chunkIndex=0,current=null,token=0,paused=false;
  function setPanelTop(){const h=header?.getBoundingClientRect().height||64;document.documentElement.style.setProperty('--read-aloud-top',Math.ceil(h+8)+'px')}
  function showPanel(){setPanelTop();panel.hidden=false;openButton.setAttribute('aria-expanded','true');openButton.setAttribute('aria-pressed','true')}
  function hidePanel(){panel.hidden=true;openButton.setAttribute('aria-expanded','false');openButton.setAttribute('aria-pressed','false')}
  function visible(el){const style=getComputedStyle(el);return style.display!=='none'&&style.visibility!=='hidden'&&el.getClientRects().length>0&&!el.closest('[hidden],[aria-hidden="true"]')}
  function cleanText(el){const copy=el.cloneNode(true);copy.querySelectorAll(excludedSelector).forEach(node=>node.remove());return copy.textContent.replace(/\s+/g,' ').replace(/\s+([，。！？；：、）])/g,'$1').trim()}
  function readableBlocks(){const all=[...reader.querySelectorAll(blockSelector)].filter(visible).filter(el=>!el.closest('.contents,.contents-panel,.cover,.cover-card,.modal,.footnote-popup,.proof-panel'));return all.filter((el,i)=>!all.some((other,j)=>j!==i&&other.contains(el)&&cleanText(other)===cleanText(el))).map(el=>({el,text:cleanText(el)})).filter(x=>/[\u3400-\u9fff]/u.test(x.text))}
  function splitText(text){const pieces=text.match(/[^。！？；]+[。！？；]?/gu)||[text],out=[];pieces.forEach(piece=>{let rest=piece.trim();while(rest.length>180){let cut=Math.max(rest.lastIndexOf('，',180),rest.lastIndexOf('、',180),rest.lastIndexOf(' ',180));if(cut<60)cut=180;out.push(rest.slice(0,cut+1));rest=rest.slice(cut+1).trim()}if(rest)out.push(rest)});return out}
  function clearHighlight(){current?.classList.remove('read-aloud-current');current=null}
  function setControls(active){pauseButton.disabled=!active;stopButton.disabled=!active;startButton.textContent=active?'重新开始':'从此处开始'}
  function finish(message='朗读完成。'){synth?.cancel();clearHighlight();setControls(false);paused=false;pauseButton.textContent='暂停';status.textContent=message}
  function selectedChinese(){const sel=getSelection();if(!sel||sel.isCollapsed||!sel.rangeCount)return null;const range=sel.getRangeAt(0),ancestor=range.commonAncestorContainer.nodeType===1?range.commonAncestorContainer:range.commonAncestorContainer.parentElement,text=sel.toString().replace(/\s+/g,' ').trim();return ancestor&&reader.contains(ancestor)&&/[\u3400-\u9fff]/u.test(text)?{el:ancestor.closest(blockSelector)||ancestor,text}:null}
  function chosenVoice(){const voices=synth.getVoices(),choice=voiceSelect.value;return window.DhammaBooksReadAloudVoice?.chooseVoice(voices,choice)||voices.find(v=>/^zh-(CN|SG)/i.test(v.lang))||voices.find(v=>/^zh/i.test(v.lang))||null}
  function populateVoices(){const saved=window.DhammaBooksReadAloudVoice?.load()||{voice:'__male__'},previous=voiceSelect.dataset.ready?voiceSelect.value:saved.voice,voices=synth.getVoices().filter(v=>/^zh/i.test(v.lang));voiceSelect.replaceChildren(new Option('优先使用男声（如有）','__male__'),new Option('自动选择',''),...voices.map(v=>new Option(`${v.name} (${v.lang})`,v.voiceURI)));voiceSelect.value=voices.some(v=>v.voiceURI===previous)||previous===''||previous==='__male__'?previous:'__male__';voiceSelect.dataset.ready='true'}
  function speakChunk(runToken){if(runToken!==token)return;if(chunkIndex>=chunks.length){blockIndex++;return speakBlock(runToken)}const utterance=new SpeechSynthesisUtterance(chunks[chunkIndex++]);utterance.lang='zh-CN';utterance.rate=Number(rateSelect.value)||1;const voice=chosenVoice();if(voice)utterance.voice=voice;utterance.onend=()=>speakChunk(runToken);utterance.onerror=event=>{if(event.error!=='canceled'&&event.error!=='interrupted')finish('朗读发生错误，请再试一次。')};synth.speak(utterance)}
  function speakBlock(runToken){if(runToken!==token)return;if(blockIndex>=blocks.length)return finish();clearHighlight();const block=blocks[blockIndex];current=block.el;current.classList.add('read-aloud-current');current.scrollIntoView({behavior:'smooth',block:'center'});chunks=splitText(block.text);chunkIndex=0;status.textContent=`正在朗读第 ${blockIndex+1} 段，共 ${blocks.length} 段`;speakChunk(runToken)}
  function start(){if(!supported)return;token++;synth.cancel();clearHighlight();const selection=selectedChinese();if(selection){blocks=[selection];blockIndex=0;getSelection()?.removeAllRanges()}else{blocks=readableBlocks();const offset=(header?.getBoundingClientRect().height||0)+8;blockIndex=blocks.findIndex(x=>x.el.getBoundingClientRect().bottom>offset);if(blockIndex<0)blockIndex=0}if(!blocks.length)return finish('此处没有可朗读的中文内容。');paused=false;pauseButton.textContent='暂停';setControls(true);speakBlock(token)}
  function togglePause(){if(!supported||!synth.speaking)return;if(paused){synth.resume();paused=false;pauseButton.textContent='暂停';status.textContent=`继续朗读第 ${blockIndex+1} 段，共 ${blocks.length} 段`}else{synth.pause();paused=true;pauseButton.textContent='继续';status.textContent='已暂停'}}
  function stop(){token++;finish('已停止朗读。')}
  openButton.addEventListener('click',()=>panel.hidden?showPanel():hidePanel());closeButton.addEventListener('click',hidePanel);startButton.addEventListener('click',start);pauseButton.addEventListener('click',togglePause);stopButton.addEventListener('click',stop);voiceSelect.addEventListener('change',()=>window.DhammaBooksReadAloudVoice?.save({voice:voiceSelect.value}));addEventListener('resize',()=>{if(!panel.hidden)setPanelTop()},{passive:true});addEventListener('beforeunload',()=>synth?.cancel());document.addEventListener('visibilitychange',()=>{if(document.hidden&&synth?.speaking&&!paused){synth.pause();paused=true;pauseButton.textContent='继续';status.textContent='页面已隐藏，朗读自动暂停。'}});
  if(supported){populateVoices();if('onvoiceschanged' in synth)synth.onvoiceschanged=populateVoices}else{openButton.disabled=true;openButton.title='此浏览器不支持朗读';status.classList.add('read-aloud-unavailable');status.textContent='此浏览器不支持朗读，请使用最新版 Chrome、Edge 或 Safari。'}
})();
