/* Read-aloud controls for Dhamma-Books editions with text-block book bodies. */
(() => {
  'use strict';
  const profile = window.DhammaBooksReadAloudVoice;
  const synth = window.speechSynthesis;
  const topbar = document.querySelector('.topbar');
  const fontPlus = document.getElementById('fontPlus') || document.getElementById('larger');
  const enPanel = document.getElementById('enPanel');
  const zhPanel = document.getElementById('zhPanel');
  const chineseBook = document.getElementById('reader-zh');
  if (!profile || !topbar || !fontPlus || !(zhPanel || chineseBook)) return;

  const supported = Boolean(synth && window.SpeechSynthesisUtterance);
  const englishKey = 'pamc-dhamma-books:read-aloud-english-voice-v1';
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
  panel.innerHTML = '<div class="db-readaloud-head"><h2 id="db-readaloud-title"></h2><button class="db-readaloud-close" type="button" aria-label="Close">×</button></div>'
    + '<div class="db-readaloud-actions"><button data-action="start" type="button"></button><button data-action="pause" type="button" disabled></button><button data-action="stop" type="button" disabled></button></div>'
    + '<div class="db-readaloud-settings"><label for="db-readaloud-rate"></label><select id="db-readaloud-rate"><option value="0.75">0.75×</option><option value="0.9">0.9×</option><option value="1" selected>1×</option><option value="1.15">1.15×</option><option value="1.3">1.3×</option><option value="1.5">1.5×</option></select>'
    + '<label for="db-readaloud-voice"></label><select id="db-readaloud-voice"></select><label for="db-readaloud-pali-voice"></label><select id="db-readaloud-pali-voice"></select>'
    + '<label for="db-readaloud-read-pali"></label><select id="db-readaloud-read-pali"><option value="no"></option><option value="yes"></option></select></div><p class="db-readaloud-status" role="status" aria-live="polite"></p>';
  topbar.insertAdjacentElement('afterend', panel);
  const get = selector => panel.querySelector(selector);
  const title = get('h2');
  const close = get('.db-readaloud-close');
  const startButton = get('[data-action="start"]');
  const pauseButton = get('[data-action="pause"]');
  const stopButton = get('[data-action="stop"]');
  const rateSelect = get('#db-readaloud-rate');
  const voiceSelect = get('#db-readaloud-voice');
  const paliVoiceSelect = get('#db-readaloud-pali-voice');
  const readPaliSelect = get('#db-readaloud-read-pali');
  const status = get('.db-readaloud-status');
  const labels = {
    zh: {title:'中文朗读', button:'朗读', close:'关闭朗读控制', start:'从此处开始', restart:'重新开始', pause:'暂停', resume:'继续', stop:'停止', rate:'速度', voice:'中文声音', automatic:'自动选择', paliVoice:'巴利语声音', indic:'优先印度语系声音（如有）', english:'英语声音', readPali:'朗读巴利经文', no:'不朗读', yes:'朗读', ready:'可选择朗读巴利原文与中文；註释按钮和弹窗将略过。', done:'朗读完成。', stopped:'已停止朗读。', error:'朗读发生错误，请再试一次。', empty:'此处没有可朗读的内容。', hidden:'页面已隐藏，朗读自动暂停。', unavailable:'此浏览器不支持朗读。'},
    en: {title:'Read Aloud', button:'Read aloud', close:'Close read-aloud controls', start:'Start from Here', restart:'Restart', pause:'Pause', resume:'Resume', stop:'Stop', rate:'Speed', voice:'English voice', automatic:'Automatic', paliVoice:'Pāli voice', indic:'Indic voice preferred (if available)', english:'English voice', readPali:'Read Pāli text', no:'No', yes:'Yes', ready:'Read the English text and optionally include Pāli passages. Notes and popups are skipped.', done:'Reading complete.', stopped:'Reading stopped.', error:'A reading error occurred. Please try again.', empty:'No readable text here.', hidden:'Automatically paused while the page is hidden.', unavailable:'Read-aloud is not supported by this browser.'}
  };
  const mode = () => enPanel && !enPanel.hidden ? 'en' : 'zh';
  let current = null, blocks = [], blockIndex = 0, chunks = [], chunkIndex = 0, token = 0, paused = false, active = false;

  function setTop() {
    document.documentElement.style.setProperty('--db-readaloud-top', Math.ceil(topbar.getBoundingClientRect().bottom + 8) + 'px');
  }
  function englishVoices() { return synth.getVoices().filter(v => /^en[-_]/i.test(v.lang)); }
  function storedEnglishVoice() { try { return localStorage.getItem(englishKey) || ''; } catch (_) { return ''; } }
  function populateVoices() {
    if (!supported) return;
    const saved = profile.load();
    const language = mode(), voice = language === 'en' ? englishVoices() : profile.chineseVoices(synth.getVoices());
    const selected = voiceSelect.dataset.language === language ? voiceSelect.value : language === 'en' ? storedEnglishVoice() : saved.voice;
    voiceSelect.replaceChildren(new Option(labels[language].automatic, ''), ...voice.map(v => new Option(`${v.name} (${v.lang})`, v.voiceURI)));
    voiceSelect.value = voice.some(v => v.voiceURI === selected) ? selected : '';
    voiceSelect.dataset.language = language;
    const pali = profile.paliVoices(synth.getVoices());
    const paliSelected = paliVoiceSelect.dataset.ready ? paliVoiceSelect.value : '__indic__';
    paliVoiceSelect.replaceChildren(new Option(labels[language].indic, '__indic__'), new Option(labels[language].english, '__english__'), ...pali.map(v => new Option(`${v.name} (${v.lang})`, v.voiceURI)));
    paliVoiceSelect.value = pali.some(v => v.voiceURI === paliSelected) || paliSelected === '__english__' ? paliSelected : '__indic__';
    paliVoiceSelect.dataset.ready = 'true';
  }
  function refreshLanguage() {
    const l = labels[mode()];
    title.textContent = l.title;
    button.setAttribute('aria-label', l.button);
    button.title = l.button;
    close.setAttribute('aria-label', l.close);
    startButton.textContent = active ? l.restart : l.start;
    pauseButton.textContent = paused ? l.resume : l.pause;
    stopButton.textContent = l.stop;
    const selects = [rateSelect, voiceSelect, paliVoiceSelect, readPaliSelect];
    [l.rate, l.voice, l.paliVoice, l.readPali].forEach((label, i) => { get(`label[for="${selects[i].id}"]`).textContent = label; });
    readPaliSelect.options[0].textContent = l.no;
    readPaliSelect.options[1].textContent = l.yes;
    populateVoices();
    if (!active) status.textContent = supported ? l.ready : l.unavailable;
  }
  function clearHighlight() { current?.classList.remove('db-readaloud-current'); current = null; }
  function setControls(on) {
    active = on;
    pauseButton.disabled = !on;
    stopButton.disabled = !on;
    startButton.textContent = on ? labels[mode()].restart : labels[mode()].start;
  }
  function finish(message) {
    token++;
    synth?.cancel();
    clearHighlight();
    paused = false;
    setControls(false);
    pauseButton.textContent = labels[mode()].pause;
    status.textContent = message || labels[mode()].done;
  }
  function activeRoot() { return mode() === 'en' ? enPanel.querySelector('.reader-body') : (zhPanel?.querySelector('.book-body') || chineseBook?.querySelector('.book-body')); }
  function cleanText(el) {
    const copy = el.cloneNode(true);
    copy.querySelectorAll('rt,.pinyin,.fn-marker,.footnote-ref,.page-anchor,button,[hidden],[aria-hidden="true"]').forEach(node => node.remove());
    return copy.textContent.replace(/\s+/g, ' ').trim();
  }
  function paliOnly(el, text) {
    if (mode() === 'zh') return !/[\u3400-\u9fff]/u.test(text) && /[\p{Script=Latin}]/u.test(text)
      && (el.querySelector('.pali-word') || /[āīūṅñṭḍṇḷṃ]/iu.test(text));
    const marked = Array.from(el.querySelectorAll('.pali-word')).reduce((sum, node) => sum + node.textContent.length, 0);
    return marked > text.length * 0.65 && /[āīūṅñṭḍṇḷṃ]/iu.test(text);
  }
  function readableBlocks() {
    const root = activeRoot();
    if (!root) return [];
    return Array.from(root.querySelectorAll('p.text-block,h2.section-heading,h3.minor-heading,h3.sub-heading'))
      .filter(el => !el.closest('.toc,.contents,.zg-frontmatter,.cover,.modal,[hidden],[aria-hidden="true"]'))
      .filter(el => { const style = getComputedStyle(el); return style.display !== 'none' && style.visibility !== 'hidden' && el.getClientRects().length > 0; })
      .map(el => ({el, text:cleanText(el)}))
      .filter(block => block.text)
      .map(block => ({...block, pali:paliOnly(block.el, block.text)}))
      .filter(block => readPaliSelect.value === 'yes' || !block.pali);
  }
  function selectedText() {
    const selection = getSelection(), root = activeRoot();
    if (!selection || selection.isCollapsed || !selection.rangeCount || !root) return null;
    const node = selection.getRangeAt(0).commonAncestorContainer;
    const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    const text = selection.toString().replace(/\s+/g, ' ').trim();
    if (!el || !root.contains(el) || !text) return null;
    const block = {el:el.closest('p.text-block,h2.section-heading,h3.minor-heading,h3.sub-heading') || el,
      text, pali:!!el.closest('.pali-word') || paliOnly(el, text), selected:true};
    return block.pali && readPaliSelect.value !== 'yes' ? null : block;
  }
  function englishSpeechChunks(el) {
    const runs = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return node.parentElement?.closest('rt,.pinyin,.fn-marker,.footnote-ref,.page-anchor,button,[hidden],[aria-hidden="true"]')
          ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const lang = readPaliSelect.value === 'yes' && node.parentElement.closest('.pali-word') ? 'latin' : 'en';
      const last = runs[runs.length - 1];
      if (last?.lang === lang) last.text += node.textContent;
      else runs.push({text:node.textContent, lang});
    }
    return runs.flatMap(run => (run.lang === 'latin' ? profile.paliSpeechChunks : profile.splitText)(run.text.replace(/\s+/g, ' ').trim())
      .filter(Boolean).map(text => ({text, lang:run.lang})));
  }
  function speakNext(runToken) {
    if (runToken !== token) return;
    if (chunkIndex >= chunks.length) { blockIndex++; return speakBlock(runToken); }
    const chunk = chunks[chunkIndex++];
    let utterance;
    if (chunk.lang === 'en') {
      utterance = new SpeechSynthesisUtterance(chunk.text);
      const voices = englishVoices();
      const voice = voices.find(v => v.voiceURI === voiceSelect.value) || voices.find(v => /^en[-_]GB/i.test(v.lang)) || voices[0];
      utterance.lang = voice?.lang || 'en-GB';
      utterance.rate = Number(rateSelect.value) || 1;
      if (voice) utterance.voice = voice;
    } else {
      profile.speakWithFallback(synth, chunk, rateSelect.value, synth.getVoices(), voiceSelect.value, paliVoiceSelect.value,
        () => speakNext(runToken),
        () => finish(labels[mode()].error),
        () => { status.textContent = mode() === 'en'
          ? 'Pāli voice unavailable on this device; trying an English voice.'
          : '此设备无法使用所选巴利语声音，正在尝试英语声音。'; });
      return;
    }
    utterance.onend = () => speakNext(runToken);
    utterance.onerror = event => { if (event.error !== 'canceled' && event.error !== 'interrupted') finish(labels[mode()].error); };
    synth.speak(utterance);
  }
  function speakBlock(runToken) {
    if (runToken !== token) return;
    if (blockIndex >= blocks.length) return finish();
    clearHighlight();
    const block = blocks[blockIndex];
    current = block.el;
    current.classList.add('db-readaloud-current');
    current.scrollIntoView({behavior:'smooth', block:'center'});
    const parts = block.pali ? profile.paliSpeechChunks(block.text) : profile.splitText(block.text);
    chunks = block.pali ? parts.map(text => ({text, lang:'latin'}))
      : mode() === 'en' ? (block.selected ? parts.map(text => ({text, lang:'en'})) : englishSpeechChunks(block.el))
      : profile.speechChunks(block.text);
    chunkIndex = 0;
    status.textContent = mode() === 'en' ? `Reading passage ${blockIndex + 1} of ${blocks.length}` : `正在朗读第 ${blockIndex + 1} 段，共 ${blocks.length} 段`;
    speakNext(runToken);
  }
  function start() {
    if (!supported) return;
    token++;
    synth.cancel();
    clearHighlight();
    const selected = selectedText();
    blocks = selected ? [selected] : readableBlocks();
    if (selected) getSelection()?.removeAllRanges();
    const offset = topbar.getBoundingClientRect().bottom + 8;
    blockIndex = selected ? 0 : Math.max(0, blocks.findIndex(block => block.el.getBoundingClientRect().bottom > offset));
    if (!blocks.length) return finish(labels[mode()].empty);
    paused = false;
    pauseButton.textContent = labels[mode()].pause;
    setControls(true);
    speakBlock(token);
  }
  button.addEventListener('click', () => {
    if (panel.hidden) { refreshLanguage(); setTop(); panel.hidden = false; }
    else panel.hidden = true;
    button.setAttribute('aria-expanded', String(!panel.hidden));
    button.setAttribute('aria-pressed', String(!panel.hidden));
  });
  close.addEventListener('click', () => { panel.hidden = true; button.setAttribute('aria-expanded', 'false'); button.setAttribute('aria-pressed', 'false'); });
  startButton.addEventListener('click', start);
  stopButton.addEventListener('click', () => finish(labels[mode()].stopped));
  pauseButton.addEventListener('click', () => {
    if (!supported || !synth.speaking) return;
    if (paused) { synth.resume(); paused = false; } else { synth.pause(); paused = true; }
    pauseButton.textContent = paused ? labels[mode()].resume : labels[mode()].pause;
  });
  voiceSelect.addEventListener('change', () => {
    if (mode() === 'en') { try { localStorage.setItem(englishKey, voiceSelect.value); } catch (_) {} }
    else profile.save({voice:voiceSelect.value});
  });
  paliVoiceSelect.addEventListener('change', () => profile.save({paliVoice:paliVoiceSelect.value}));
  readPaliSelect.addEventListener('change', () => profile.save({readPali:readPaliSelect.value === 'yes'}));
  addEventListener('resize', () => { if (!panel.hidden) setTop(); }, {passive:true});
  addEventListener('beforeunload', () => synth?.cancel());
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && synth?.speaking && !paused) {
      synth.pause(); paused = true; pauseButton.textContent = labels[mode()].resume; status.textContent = labels[mode()].hidden;
    }
  });
  if (enPanel && zhPanel) {
    const observer = new MutationObserver(() => { finish(labels[mode()].stopped); refreshLanguage(); });
    observer.observe(enPanel, {attributes:true,attributeFilter:['hidden']});
    observer.observe(zhPanel, {attributes:true,attributeFilter:['hidden']});
  }
  if (supported) {
    readPaliSelect.value = profile.load().readPali ? 'yes' : 'no';
    if ('onvoiceschanged' in synth) synth.addEventListener('voiceschanged', populateVoices);
  } else { button.disabled = true; startButton.disabled = true; }
  refreshLanguage();
})();
