/* Shared read-aloud controls for Dhamma-Books editions with varied layouts. */
(() => {
  'use strict';
  const synth = window.speechSynthesis;
  const profile = window.DhammaBooksReadAloudVoice;
  const topbar = document.querySelector('.topbar,.toolbar,header');
  const fontPlus = document.getElementById('fontPlus') || document.getElementById('larger');
  if (!synth || !profile || !topbar || !fontPlus || document.getElementById('dbReadAloudButton')) return;

  const supported = Boolean(window.SpeechSynthesisUtterance);
  const genericBlockSelector = [
    'p.text-block','p.source-paragraph','p.paragraph-text','p.zh-text','p.eng-text','p.my-text',
    '.pali-verse-line','.zh-verse-line','.nissaya-line','.semantic-segment-cell',
    '.pali-cell','.eng-cell','.zh-cell','.my-cell','.analysis-cell','.condition-cell',
    '.analysis-translation','.source-line','.gatha-line','.single-text','.fixed-text',
    'h1','h2.section-heading','h3','h4','.section-heading','.subsection-heading',
    '.heading-pali','.heading-eng','.heading-zh','.heading-my','li'
  ].join(',');
  const bookConfigs = {
    'dhammapada-pali-chinese.html': {root:'#reader-main', blocks:'p.source-paragraph,.section-heading,.subsection-heading,h1,h3,h4'},
    'patisambhidamagga.html': {root:'main', blocks:'p.source-paragraph,p.paragraph-text,.section-heading,.subsection-heading,h1,h3,h4'},
    'patisambhidamagga-chinese.html': {root:'#reader-zh', blocks:'p.source-paragraph,.book-body p,.section-heading,.subsection-heading,h1,h3,h4'},
    'mindfulness-of-breathing.html': {root:'.lang-panel.active:not([hidden])', blocks:'p.text-block,.section-heading,.subsection-heading,h1,h3,h4'},
    'the-only-way-for-realization-of-nibbana.html': {root:'.lang-panel.active:not([hidden])', blocks:'p.text-block,p.paragraph-text,.section-heading,.subsection-heading,h1,h3,h4,li'},
    'daily-chants.html': {root:'#readerView', blocks:'.pali-cell,.eng-cell,.heading-pali,.heading-eng,h1,h3,h4'},
    'daily-chants-burmese.html': {root:'main', blocks:'.source-line,.gatha-line,.section-heading,.subsection-heading,.chant-invocation,h1,h3,h4'},
    'paccayaniddeso.html': {root:'#readerView', blocks:'.pali-cell,.eng-cell,.condition-cell,.analysis-cell,.analysis-translation,.heading-pali,.heading-eng,h1,h3,h4'},
    'paccayaniddeso-chinese.html': {root:'#readerView', blocks:'.pali-cell,.zh-cell,.condition-cell,.analysis-cell,.analysis-translation,.heading-pali,.heading-zh,h1,h3,h4'},
    'pali-chanting-book.html': {root:'#readerView', blocks:'.source-line,.gatha-line,.pali-cell,.eng-cell,.section-heading,.subsection-heading,h1,h3,h4'},
    'pali-chanting-book-chinese.html': {root:'#readerView', blocks:'.source-line,.gatha-line,.pali-cell,.zh-cell,.section-heading,.subsection-heading,h1,h3,h4'},
    'pali-chanting-book-burmese.html': {root:'#readerView', blocks:'.source-line,.gatha-line,.pali-cell,.my-cell,.section-heading,.subsection-heading,h1,h3,h4'}
  };
  const bookName = location.pathname.split('/').pop() || '';
  const bookConfig = bookConfigs[bookName] || {};
  const blockSelector = bookConfig.blocks || genericBlockSelector;
  const voiceStorageKey = 'pamc-dhamma-books:read-aloud-language-voices-v1';
  const excludedSelector = [
    'rt','.pinyin','.fn-marker','.footnote-ref','.fn-link','.page-anchor','.page-tag',
    '.verse-number','.gatha-no','button','script','style','[hidden]','[aria-hidden="true"]',
    '.proof-marker','.nissaya-button'
  ].join(',');
  const ignoredAncestorSelector = [
    '.contents','.contents-panel','.patis-contents','.toc','.cover','.cover-card','.modal',
    '.footnote-popup','.popup','.proof-panel','.search-results','nav','header','.topbar'
  ].join(',');

  const button = document.createElement('button');
  button.id = 'dbReadAloudButton';
  button.className = 'db-readaloud-button';
  button.type = 'button';
  button.setAttribute('aria-controls', 'db-readaloud-panel');
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-pressed', 'false');
  button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6.5 9H3v6h3.5L11 19V5Z"></path><path d="M15 9a4 4 0 0 1 0 6"></path><path d="M18 6a8 8 0 0 1 0 12"></path></svg>';
  fontPlus.insertAdjacentElement('afterend', button);

  const panel = document.createElement('aside');
  panel.id = 'db-readaloud-panel';
  panel.className = 'db-readaloud-panel';
  panel.hidden = true;
  panel.innerHTML = '<div class="db-readaloud-head"><h2 id="db-readaloud-title"></h2><button class="db-readaloud-close" type="button">×</button></div>'
    + '<div class="db-readaloud-actions"><button data-action="start" type="button"></button><button data-action="selection" type="button"></button><button data-action="pause" type="button" disabled></button><button data-action="stop" type="button" disabled></button></div>'
    + '<div class="db-readaloud-settings"><label for="db-readaloud-rate"></label><select id="db-readaloud-rate"><option value="0.75">0.75×</option><option value="0.9">0.9×</option><option value="1" selected>1×</option><option value="1.15">1.15×</option><option value="1.3">1.3×</option><option value="1.5">1.5×</option></select>'
    + '<label for="db-readaloud-voice"></label><select id="db-readaloud-voice"></select><label for="db-readaloud-pali-voice"></label><select id="db-readaloud-pali-voice"></select>'
    + '<label for="db-readaloud-read-pali"></label><select id="db-readaloud-read-pali"><option value="no"></option><option value="yes"></option></select></div><p class="db-readaloud-status" role="status" aria-live="polite"></p>';
  topbar.insertAdjacentElement('afterend', panel);

  const get = selector => panel.querySelector(selector);
  const title = get('h2');
  const closeButton = get('.db-readaloud-close');
  const startButton = get('[data-action="start"]');
  const selectionButton = get('[data-action="selection"]');
  const pauseButton = get('[data-action="pause"]');
  const stopButton = get('[data-action="stop"]');
  const rateSelect = get('#db-readaloud-rate');
  const voiceSelect = get('#db-readaloud-voice');
  const paliVoiceSelect = get('#db-readaloud-pali-voice');
  const readPaliSelect = get('#db-readaloud-read-pali');
  const status = get('.db-readaloud-status');
  const labels = {
    zh:{title:'中文朗读',button:'朗读',close:'关闭朗读控制',start:'从此处开始',selection:'朗读所选文字',restart:'重新开始',pause:'暂停',resume:'继续',stop:'停止',rate:'速度',voice:'中文声音',automatic:'自动选择',paliVoice:'巴利语声音',indic:'优先印度语系声音（如有）',english:'英语声音',readPali:'朗读巴利经文',no:'不朗读',yes:'朗读',ready:'选择起点或所选文字；註释按钮和弹窗将略过。',done:'朗读完成。',stopped:'已停止朗读。',error:'朗读发生错误，请再试一次。',empty:'此处没有可朗读的内容。',noSelection:'请先选择要朗读的文字。'},
    en:{title:'Read Aloud',button:'Read aloud',close:'Close read-aloud controls',start:'Start from Here',selection:'Read Selected Text',restart:'Restart',pause:'Pause',resume:'Resume',stop:'Stop',rate:'Speed',voice:'English voice',automatic:'Automatic',paliVoice:'Pāli voice',indic:'Indic voice preferred (if available)',english:'English voice',readPali:'Read Pāli text',no:'No',yes:'Yes',ready:'Choose a starting point or selected text. Notes and popups are skipped.',done:'Reading complete.',stopped:'Reading stopped.',error:'A reading error occurred. Please try again.',empty:'No readable text here.',noSelection:'Please select the text to read first.'},
    my:{title:'အသံဖြင့်ဖတ်ရန်',button:'အသံဖြင့်ဖတ်ရန်',close:'ပိတ်ရန်',start:'ဤနေရာမှစရန်',selection:'ရွေးထားသောစာကိုဖတ်ရန်',restart:'ပြန်စရန်',pause:'ခဏရပ်ရန်',resume:'ဆက်ဖတ်ရန်',stop:'ရပ်ရန်',rate:'အမြန်နှုန်း',voice:'မြန်မာအသံ',automatic:'အလိုအလျောက်',paliVoice:'ပါဠိအသံ',indic:'အိန္ဒိယဘာသာအသံကို ဦးစားပေးရန်',english:'အင်္ဂလိပ်အသံ',readPali:'ပါဠိစာကိုဖတ်ရန်',no:'မဖတ်ပါ',yes:'ဖတ်ပါ',ready:'စတင်မည့်နေရာ သို့မဟုတ် ရွေးထားသောစာကို ရွေးပါ။',done:'ဖတ်ပြီးပါပြီ။',stopped:'ဖတ်ခြင်းရပ်လိုက်ပါပြီ။',error:'ဖတ်ရာတွင် အမှားဖြစ်ပါသည်။',empty:'ဖတ်ရန်စာမရှိပါ။',noSelection:'ဖတ်ရန်စာကို အရင်ရွေးပါ။'}
  };
  let current = null, blocks = [], blockIndex = 0, chunks = [], chunkIndex = 0, token = 0, paused = false, active = false;

  function activeRoot() {
    return (bookConfig.root && document.querySelector(bookConfig.root))
      || document.querySelector('.lang-panel.active:not([hidden]),.reader.active:not([hidden])')
      || document.getElementById('readerView') || document.getElementById('reader-main')
      || document.getElementById('reader-zh') || document.querySelector('.reader-body,.book-body,main,.reader');
  }
  function interfaceLanguage() {
    const root = activeRoot();
    const declared = root?.dataset.lang || root?.getAttribute('lang') || document.documentElement.lang || '';
    if (/^(my|bur)/i.test(declared) || document.body.classList.contains('reader-my')) return 'my';
    if (/^zh/i.test(declared) || document.body.classList.contains('reader-zh')) return 'zh';
    if (/^en/i.test(declared) || document.body.classList.contains('reader-en')) return 'en';
    const sample = root?.textContent.slice(0, 5000) || '';
    if (/[က-႟]/u.test(sample) && !/[㐀-鿿]/u.test(sample)) return 'my';
    return /[㐀-鿿]/u.test(sample) ? 'zh' : 'en';
  }
  function cleanText(el) {
    const copy = el.cloneNode(true);
    copy.querySelectorAll(excludedSelector).forEach(node => node.remove());
    return copy.textContent.replace(/\s+/g, ' ').replace(/\s+([，。！？；：、）])/g, '$1').trim();
  }
  function blockLanguage(el, text) {
    const classes = `${el.className || ''} ${el.parentElement?.className || ''}`;
    if (/\b(eng-cell|eng-text|heading-eng|analysis-en)\b/.test(classes) || el.matches('[data-lang="en"]')) return 'en';
    if (/\b(my-cell|my-text|heading-my)\b/.test(classes) || /[က-႟]/u.test(text)) return 'my';
    if (/\b(zh-cell|zh-text|heading-zh|verse-zh|nissaya)\b/.test(classes) || /[㐀-鿿]/u.test(text)) return 'zh';
    if (bookName === 'mindfulness-of-breathing.html' || bookName === 'the-only-way-for-realization-of-nibbana.html') {
      const copy = el.cloneNode(true);
      copy.querySelectorAll('.pali-word,.pali-text,[lang^="pi"]').forEach(node => node.remove());
      if (/[A-Za-z]{2,}/.test(copy.textContent)) return 'en';
      if (el.matches('.pali-word,.pali-text,[lang^="pi"]') || el.querySelector('.pali-word,.pali-text,[lang^="pi"]')) return 'pali';
    }
    const markedPali = /\b(pali-cell|pali-text|heading-pali|pali-verse|verse-pali|pali)\b/.test(classes)
      || el.matches('.pali-word');
    if (markedPali || (/^[\p{Script=Latin}\p{Number}\p{Punctuation}\p{Separator}]+$/u.test(text) && /[āīūṅñṭḍṇḷṃ]/iu.test(text))) return 'pali';
    return 'en';
  }
  function visible(el) {
    const style = getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && el.getClientRects().length > 0 && !el.closest('[hidden],[aria-hidden="true"]');
  }
  function readableBlocks() {
    const root = activeRoot();
    if (!root) return [];
    const candidates = Array.from(root.querySelectorAll(blockSelector))
      .filter(visible).filter(el => !el.closest(ignoredAncestorSelector));
    return candidates
      .map(el => ({el, text:cleanText(el)})).filter(block => block.text)
      .filter((block, index, all) => !all.some((other, otherIndex) => otherIndex !== index && block.el.contains(other.el)))
      .map(block => ({...block, lang:blockLanguage(block.el, block.text)}))
      .filter(block => readPaliSelect.value === 'yes' || block.lang !== 'pali');
  }
  function selectedText() {
    const selection = getSelection(), root = activeRoot();
    if (!selection || selection.isCollapsed || !selection.rangeCount || !root) return null;
    const range = selection.getRangeAt(0), node = range.commonAncestorContainer;
    const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    const text = selection.toString().replace(/\s+/g, ' ').trim();
    if (!el || !root.contains(el) || !text) return null;
    const blockEl = el.closest(blockSelector) || el;
    const selectedPali = Boolean(el.closest('.pali-word,.pali-text,[lang^="pi"]'));
    const speechRoot = document.createElement('div');
    speechRoot.append(range.cloneContents());
    speechRoot.querySelectorAll(excludedSelector).forEach(node => node.remove());
    return {el:blockEl, text, lang:selectedPali ? 'pali' : blockLanguage(blockEl, text), selected:true, range:range.cloneRange(), speechRoot};
  }
  function selectionStartIndex(selection, list) {
    if (!selection) return -1;
    const contained = list.findIndex(block => block.el === selection.el || block.el.contains(selection.el) || selection.el.contains(block.el));
    if (contained >= 0) return contained;
    return list.findIndex(block => Boolean(selection.el.compareDocumentPosition(block.el) & Node.DOCUMENT_POSITION_FOLLOWING));
  }
  function contentFromSelectionStart(selection, block) {
    if (!selection?.range || !block?.el.contains(selection.range.startContainer)) return {text:block?.text || '', speechRoot:null};
    const range = document.createRange();
    range.selectNodeContents(block.el);
    range.setStart(selection.range.startContainer, selection.range.startOffset);
    const speechRoot = document.createElement('div');
    speechRoot.append(range.cloneContents());
    speechRoot.querySelectorAll(excludedSelector).forEach(node => node.remove());
    const text = speechRoot.textContent.replace(/\s+/g, ' ').replace(/\s+([，。！？；：、）])/g, '$1').trim();
    return {text, speechRoot};
  }
  function availableVoices(language) {
    const pattern = language === 'zh' ? /^zh/i : language === 'my' ? /^(my|bur)/i : /^en/i;
    return synth.getVoices().filter(voice => pattern.test(voice.lang));
  }
  function loadLanguageVoice(language) {
    try { return JSON.parse(localStorage.getItem(voiceStorageKey) || '{}')[language] || ''; } catch (_) { return ''; }
  }
  function saveLanguageVoice(language, voice) {
    try {
      const saved = JSON.parse(localStorage.getItem(voiceStorageKey) || '{}');
      saved[language] = voice;
      localStorage.setItem(voiceStorageKey, JSON.stringify(saved));
    } catch (_) {}
  }
  function setPanelTop() { document.documentElement.style.setProperty('--db-readaloud-top', Math.ceil(topbar.getBoundingClientRect().bottom + 8) + 'px'); }
  function refreshLanguage() {
    const language = interfaceLanguage(), l = labels[language];
    title.textContent = l.title; button.title = l.button; button.setAttribute('aria-label', l.button); closeButton.setAttribute('aria-label', l.close);
    startButton.textContent = active ? l.restart : l.start; selectionButton.textContent = l.selection; pauseButton.textContent = paused ? l.resume : l.pause; stopButton.textContent = l.stop;
    const controls = [rateSelect, voiceSelect, paliVoiceSelect, readPaliSelect];
    [l.rate,l.voice,l.paliVoice,l.readPali].forEach((value,index) => get(`label[for="${controls[index].id}"]`).textContent = value);
    readPaliSelect.options[0].textContent = l.no; readPaliSelect.options[1].textContent = l.yes;
    populateVoices(); if (!active) status.textContent = supported ? l.ready : l.error;
  }
  function populateVoices() {
    const language = interfaceLanguage(), l = labels[language], voices = availableVoices(language);
    const saved = profile.load();
    const previous = voiceSelect.dataset.language === language ? voiceSelect.value : (loadLanguageVoice(language) || (language === 'zh' ? saved.voice : ''));
    voiceSelect.replaceChildren(new Option(l.automatic,''), ...voices.map(voice => new Option(`${voice.name} (${voice.lang})`,voice.voiceURI)));
    voiceSelect.value = voices.some(voice => voice.voiceURI === previous) ? previous : '';
    voiceSelect.dataset.language = language;
    const paliVoices = profile.paliVoices(synth.getVoices()), paliPrevious = paliVoiceSelect.dataset.ready ? paliVoiceSelect.value : saved.paliVoice;
    paliVoiceSelect.replaceChildren(new Option(l.indic,'__indic__'),new Option(l.english,'__english__'),...paliVoices.map(voice => new Option(`${voice.name} (${voice.lang})`,voice.voiceURI)));
    paliVoiceSelect.value = paliVoices.some(voice => voice.voiceURI === paliPrevious) || paliPrevious === '__english__' ? paliPrevious : '__indic__';
    paliVoiceSelect.dataset.ready = 'true';
  }
  function clearHighlight() { current?.classList.remove('db-readaloud-current'); current = null; }
  function setControls(on) { active = on; pauseButton.disabled = !on; stopButton.disabled = !on; startButton.textContent = on ? labels[interfaceLanguage()].restart : labels[interfaceLanguage()].start; }
  function finish(message) { token++; synth.cancel(); clearHighlight(); paused = false; setControls(false); pauseButton.textContent = labels[interfaceLanguage()].pause; status.textContent = message || labels[interfaceLanguage()].done; }
  function keepCurrentVisible(el) {
    const rect = el.getBoundingClientRect(), safeTop = topbar.getBoundingClientRect().bottom + 12, safeBottom = innerHeight - 40;
    if (rect.bottom >= safeTop && rect.top <= safeBottom) return;
    el.scrollIntoView({behavior:'smooth',block:'nearest'});
  }
  function preserveSelection(selection) {
    if (!selection?.range) return;
    requestAnimationFrame(() => {
      const live = getSelection();
      live.removeAllRanges();
      live.addRange(selection.range.cloneRange());
      selection.el.scrollIntoView({behavior:'smooth',block:'center'});
    });
  }
  function inlineLanguageChunks(block) {
    const source = block.speechRoot || block.el;
    if (!source.querySelector('.pali-word,.pali-text,[lang^="pi"]')) return null;
    const runs = [];
    const walker = document.createTreeWalker(source, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const parent = node.parentElement;
      if (!parent || parent.closest(excludedSelector)) continue;
      const text = node.nodeValue.replace(/\s+/g, ' ');
      if (!text.trim()) continue;
      const lang = parent.closest('.pali-word,.pali-text,[lang^="pi"]') ? 'latin' : block.lang;
      const previous = runs[runs.length - 1];
      if (previous?.lang === lang) previous.text += text;
      else runs.push({text,lang});
    }
    const chunks = [];
    runs.forEach(run => {
      const parts = run.lang === 'latin' ? profile.paliSpeechChunks(run.text) : profile.splitText(run.text);
      parts.filter(Boolean).forEach(text => chunks.push({text:text.trim(),lang:run.lang}));
    });
    return chunks.filter(chunk => chunk.text);
  }
  function speakNext(runToken) {
    if (runToken !== token) return;
    if (chunkIndex >= chunks.length) { blockIndex++; return speakBlock(runToken); }
    const chunk = chunks[chunkIndex++];
    if (chunk.lang === 'latin') {
      profile.speakWithFallback(synth, chunk, rateSelect.value, synth.getVoices(), voiceSelect.value, paliVoiceSelect.value,
        () => speakNext(runToken), () => finish(labels[interfaceLanguage()].error));
      return;
    }
    const utterance = new SpeechSynthesisUtterance(chunk.text), voices = availableVoices(chunk.lang);
    const voice = voices.find(item => item.voiceURI === voiceSelect.value) || voices[0];
    utterance.lang = voice?.lang || (chunk.lang === 'zh' ? 'zh-CN' : chunk.lang === 'my' ? 'my-MM' : 'en-GB');
    utterance.rate = Number(rateSelect.value) || 1; if (voice) utterance.voice = voice;
    utterance.onend = () => speakNext(runToken);
    utterance.onerror = event => { if (!['canceled','interrupted'].includes(event.error)) finish(labels[interfaceLanguage()].error); };
    synth.speak(utterance);
  }
  function speakBlock(runToken) {
    if (runToken !== token) return;
    if (blockIndex >= blocks.length) return finish();
    clearHighlight(); const block = blocks[blockIndex]; current = block.el; current.classList.add('db-readaloud-current'); keepCurrentVisible(current);
    const inlineChunks = inlineLanguageChunks(block);
    if (inlineChunks) chunks = inlineChunks;
    else if (block.lang === 'pali') chunks = profile.paliSpeechChunks(block.text).filter(Boolean).map(text => ({text,lang:'latin'}));
    else if (block.lang === 'zh') chunks = profile.speechChunks(block.text);
    else chunks = profile.splitText(block.text).filter(Boolean).map(text => ({text,lang:block.lang}));
    chunkIndex = 0;
    const language = interfaceLanguage();
    status.textContent = language === 'zh' ? `正在朗读第 ${blockIndex + 1} 段，共 ${blocks.length} 段`
      : language === 'my' ? `စာပိုဒ် ${blockIndex + 1} / ${blocks.length} ကို ဖတ်နေပါသည်။`
      : `Reading passage ${blockIndex + 1} of ${blocks.length}`;
    speakNext(runToken);
  }
  function start() {
    if (!supported) return;
    token++; synth.cancel(); clearHighlight(); const selection = selectedText(); blocks = readableBlocks();
    if (selection) {
      blockIndex = selectionStartIndex(selection, blocks);
      if (blockIndex < 0) return finish(labels[interfaceLanguage()].empty);
      if (blocks[blockIndex].el.contains(selection.range.startContainer)) {
        const remainder = contentFromSelectionStart(selection, blocks[blockIndex]);
        if (remainder.text) blocks[blockIndex] = {...blocks[blockIndex],text:remainder.text,speechRoot:remainder.speechRoot,selected:true};
      }
      preserveSelection(selection);
    } else {
      const offset = topbar.getBoundingClientRect().bottom + 8; blockIndex = blocks.findIndex(block => block.el.getBoundingClientRect().bottom > offset); if (blockIndex < 0) blockIndex = 0;
    }
    if (!blocks.length) return finish(labels[interfaceLanguage()].empty);
    paused = false; pauseButton.textContent = labels[interfaceLanguage()].pause; setControls(true); speakBlock(token);
  }
  function readSelection() {
    if (!supported) return; const selection = selectedText();
    if (!selection) { status.textContent = labels[interfaceLanguage()].noSelection; return; }
    token++; synth.cancel(); clearHighlight(); blocks = [selection]; blockIndex = 0; paused = false; pauseButton.textContent = labels[interfaceLanguage()].pause; setControls(true); preserveSelection(selection); speakBlock(token);
  }

  button.addEventListener('click', () => { if (panel.hidden) { refreshLanguage(); setPanelTop(); panel.hidden = false; } else panel.hidden = true; button.setAttribute('aria-expanded',String(!panel.hidden)); button.setAttribute('aria-pressed',String(!panel.hidden)); });
  closeButton.addEventListener('click', () => { panel.hidden = true; button.setAttribute('aria-expanded','false'); button.setAttribute('aria-pressed','false'); });
  startButton.addEventListener('click', start); selectionButton.addEventListener('click', readSelection); stopButton.addEventListener('click', () => finish(labels[interfaceLanguage()].stopped));
  pauseButton.addEventListener('click', () => { if (!synth.speaking) return; if (paused) synth.resume(); else synth.pause(); paused = !paused; pauseButton.textContent = paused ? labels[interfaceLanguage()].resume : labels[interfaceLanguage()].pause; });
  readPaliSelect.addEventListener('change', () => profile.save({readPali:readPaliSelect.value === 'yes'}));
  paliVoiceSelect.addEventListener('change', () => profile.save({paliVoice:paliVoiceSelect.value}));
  voiceSelect.addEventListener('change', () => {
    const language = interfaceLanguage();
    saveLanguageVoice(language, voiceSelect.value);
    if (language === 'zh') profile.save({voice:voiceSelect.value});
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('[data-lang],.lang-button,#btnReader,#btnChinese,#btnEnglish,#btnBurmese,#langEn,#langZh')) return;
    setTimeout(() => { if (!panel.hidden) refreshLanguage(); }, 0);
  });
  addEventListener('resize', () => { if (!panel.hidden) setPanelTop(); }, {passive:true}); addEventListener('beforeunload', () => synth.cancel());
  if (supported) { readPaliSelect.value = profile.load().readPali ? 'yes' : 'no'; populateVoices(); if ('onvoiceschanged' in synth) synth.addEventListener('voiceschanged',populateVoices); }
  else button.disabled = true;
  refreshLanguage();
})();
