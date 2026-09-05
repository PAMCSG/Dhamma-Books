/* PAMC cross-book PCED popup standard v1.0.0 — 2026-09-05 */
(function () {
  'use strict';

  const script = document.currentScript;
  const mode = script?.dataset?.pcedMode || 'book';
  const isReferenceReader = /(?:^|\/)kutadantasutta\.html$/i.test(location.pathname);
  const APPROVED = new Set(['规范', '核实', '已核实', '确认', '已确认']);
  let lastWord = '';
  let liveRecords = [];
  let livePromise = null;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
  const core = () => window.PCEDLookupCore;
  const dictionary = () => {
    try {
      if (typeof PCED !== 'undefined') return PCED;
      if (typeof PCED_ENTRIES !== 'undefined') return PCED_ENTRIES;
      return window.PCED || window.PCED_ENTRIES || {};
    } catch (_) { return window.PCED || window.PCED_ENTRIES || {}; }
  };
  const normalize = value => core()?.normalizeForMatch(value)
    .replace(/[^a-zāīūṅñṭḍṇḷṃ\s]/g, ' ').replace(/\s+/g, ' ').trim() || '';

  function standardOptions() {
    const data = dictionary();
    let aliases, related;
    try { aliases = typeof APPROVED_PCED_ALIASES !== 'undefined' ? APPROVED_PCED_ALIASES : undefined; } catch (_) {}
    try { related = typeof PCED_RELATED !== 'undefined' ? PCED_RELATED : undefined; } catch (_) {}
    return {
      dictionary: data,
      index: core()?.createExactIndex(data),
      aliases,
      related,
      inflections: window.PCEDStandardData?.inflections
    };
  }

  function resolution(surface) {
    return core()?.resolve(surface, standardOptions()) || {
      clicked: surface, normalized: normalize(surface), mode: 'none', heads: [], allHeads: [], components: []
    };
  }

  function renderEntry(head) {
    const entry = dictionary()[head];
    if (!entry) return '';
    let html = '<div class="entry"><div class="headword">' + esc(entry.headword || head) + '</div>';
    const groups = core()?.dictionaryGroups(entry, 'zh') || [];
    for (const group of groups) {
      html += '<div class="group-title">' + esc(group.title) + '</div>';
      for (const item of group.entries) {
        html += '<div class="source">' + esc(item.source_label || item.source || '') + '</div>' +
          '<div class="definition">' + (item.definition || '') + '</div>';
      }
    }
    return html + '</div>';
  }

  function approvedWordRows(surface, result) {
    return core()?.approvedTermMatches(surface, result) || [];
  }

  function renderApprovedRows(rows, surface) {
    return rows.map(row => '<div class="entry approved-term-entry">' +
      '<div class="headword">' + esc(row.pali) + '</div>' +
      '<div class="group-title">中文 / Chinese</div>' +
      '<div class="source">《汉译巴利三藏》玛欣德尊者和译藏团队 · ' + esc(row.status || '') + '</div>' +
      '<div class="definition">' + esc(row.chinese) + '</div>' +
      (row.match === 'inflected' ? '<div class="lookup-rule">' + esc(surface) + ' → ' +
        esc(row.matchedForm) + '（已核实词形变化）</div>' : '') + '</div>').join('');
  }

  function renderDictionary(surface) {
    const result = resolution(surface);
    const heads = result.allHeads || result.heads || [];
    const approved = renderApprovedRows(approvedWordRows(surface, result), surface);
    if (!heads.length) return approved + '<div class="note"><b>No reliable PCED entry was found for ' +
      esc(surface) + '.</b><br>Only exact headwords, verified forms, conservative inflections, and verified compound or sandhi analyses were accepted.</div>';
    const shown = heads.map(head => dictionary()[head]?.headword || head).join(', ');
    const parts = (result.components || []).map(item => item.surface).join(' + ');
    let note = '';
    if (result.mode === 'inflected') note = '<div class="note"><b>Inflected form:</b> ' + esc(surface) +
      ' → <b>' + esc(dictionary()[heads[0]]?.headword || result.resolvedForm || shown) + '</b>' +
      (result.rule ? '<br><span class="lookup-rule">' + esc(result.rule) + '</span>' : '') + '</div>';
    else if (result.mode === 'alias' || result.mode === 'related') note = '<div class="note"><b>PCED form:</b> ' +
      esc(surface) + ' → <b>' + esc(shown) + '</b></div>';
    else if (result.mode === 'compound' || result.mode === 'sandhi' || parts) note = '<div class="note"><b>' +
      (result.mode === 'sandhi' ? 'Sandhi' : 'Compound') + ' analysis:</b> ' + esc(surface) + ' → <b>' +
      esc(parts || shown) + '</b></div>';
    return approved + note + heads.map(renderEntry).join('');
  }

  function selectedText(modal) {
    const meta = modal.querySelector('#lookupMeta,#dictMeta,#pced-meta,.lookup-meta,.panel-meta')?.textContent || '';
    const title = modal.querySelector('#lookupTitle,#dictTitle,#pced-title,.panel-title,.pced-panel-title')?.textContent || '';
    return (lastWord || meta.replace(/^Selected(?: Pāli word)?:\s*/i, '').trim() || title.trim()).trim();
  }

  function resetTop(modal) {
    const panel = modal.querySelector('.panel,.pced-panel,.modalcontent');
    const reset = () => {
      if (panel) panel.scrollTop = 0;
      modal.querySelectorAll('.panel-body,.lookup-section.active,.tab-panel.active').forEach(node => { node.scrollTop = 0; });
    };
    reset();
    requestAnimationFrame(() => requestAnimationFrame(reset));
  }

  function installMovable(modal) {
    if (modal.dataset.pamcMovable === '1') return;
    const panel = modal.querySelector('.panel,.pced-panel,.modalcontent');
    const handle = panel?.querySelector('.panel-head,.pced-panel-head,.modal-header,.dialog-header');
    if (!panel || !handle) return;
    modal.dataset.pamcMovable = '1';
    handle.style.cursor = 'move';
    handle.style.touchAction = 'none';
    let drag = null;
    const clamp = (value, low, high) => Math.min(Math.max(low, value), Math.max(low, high));
    const move = event => {
      if (!drag || event.pointerId !== drag.id) return;
      const maxLeft = Math.max(0, window.innerWidth - drag.width);
      const maxTop = Math.max(0, window.innerHeight - Math.min(drag.height, window.innerHeight));
      panel.style.left = clamp(drag.left + event.clientX - drag.x, 0, maxLeft) + 'px';
      panel.style.top = clamp(drag.top + event.clientY - drag.y, 0, maxTop) + 'px';
    };
    const end = event => {
      if (!drag || event.pointerId !== drag.id) return;
      drag = null;
      window.removeEventListener('pointermove', move, true);
      window.removeEventListener('pointerup', end, true);
      window.removeEventListener('pointercancel', end, true);
    };
    handle.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      if (event.target.closest('button,a,input,select,textarea')) return;
      const rect = panel.getBoundingClientRect();
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, left: rect.left, top: rect.top,
        width: Math.min(rect.width, window.innerWidth), height: rect.height };
      Object.assign(panel.style, { position: 'fixed', left: clamp(rect.left, 0, Math.max(0, window.innerWidth - drag.width)) + 'px',
        top: clamp(rect.top, 0, Math.max(0, window.innerHeight - Math.min(rect.height, window.innerHeight))) + 'px',
        width: drag.width + 'px', margin: '0', transform: 'none' });
      event.preventDefault();
      event.stopImmediatePropagation();
      window.addEventListener('pointermove', move, true);
      window.addEventListener('pointerup', end, true);
      window.addEventListener('pointercancel', end, true);
    }, true);
    const fit = () => {
      if (!panel.style.left) return;
      const rect = panel.getBoundingClientRect();
      panel.style.left = clamp(rect.left, 0, Math.max(0, window.innerWidth - Math.min(rect.width, window.innerWidth))) + 'px';
      panel.style.top = clamp(rect.top, 0, Math.max(0, window.innerHeight - Math.min(rect.height, window.innerHeight))) + 'px';
    };
    window.addEventListener('resize', fit);
  }

  function activateTab(modal, tab) {
    modal.querySelectorAll('.tabs button[data-tab]').forEach(button => button.classList.toggle('active', !button.hidden && button.dataset.tab === tab));
    modal.querySelectorAll('.lookup-section').forEach(section => section.classList.toggle('active', section.id === tab + 'Tab'));
    resetTop(modal);
  }

  function ensureReaderTabs(modal, phrase) {
    const body = modal.querySelector('.panel-body') || modal.querySelector('.panel');
    let bar = body.querySelector('.tabs');
    if (!bar) { bar = document.createElement('div'); bar.className = 'tabs'; body.prepend(bar); }
    const definitions = [
      ['dict', 'PCED Dictionary'], ['terms', '汉译巴利三藏'], ['translate', 'AI Translation'], ['attha', 'Aṭṭhakathā']
    ];
    const buttons = new Map([...bar.querySelectorAll('button[data-tab]')].map(button => [button.dataset.tab, button]));
    for (const [tab, label] of definitions) {
      let button = buttons.get(tab);
      if (!button) { button = document.createElement('button'); button.dataset.tab = tab; button.textContent = label; buttons.set(tab, button); }
      button.hidden = phrase && tab === 'dict';
    }
    for (const tab of (phrase ? ['translate', 'terms', 'attha'] : ['dict', 'terms', 'translate', 'attha'])) bar.append(buttons.get(tab));
    for (const [tab] of definitions) {
      let section = modal.querySelector('#' + tab + 'Tab');
      if (!section) { section = document.createElement('div'); section.id = tab + 'Tab'; section.className = 'lookup-section'; body.append(section); }
    }
    bar.onclick = event => { const button = event.target.closest('button[data-tab]'); if (button && !button.hidden) activateTab(modal, button.dataset.tab); };
  }

  async function records() {
    if (livePromise) return livePromise;
    livePromise = (async () => {
      const local = Array.isArray(window.PCEDApprovedTerms?.records) ? window.PCEDApprovedTerms.records : [];
      try {
        const response = await fetch('/api/records', { credentials: 'include', cache: 'no-store', headers: { Accept: 'application/json' } });
        if (response.ok) {
          const json = await response.json();
          liveRecords = Array.isArray(json) ? json : (json.records || json.items || []);
        }
      } catch (_) {}
      const seen = new Set();
      return [...liveRecords, ...local].filter(row => {
        const key = [row.id || row.dbid || '', row.pali || '', row.chinese || '', row.status || ''].join('\u241f');
        if (seen.has(key)) return false;
        seen.add(key); return row.pali && row.chinese;
      });
    })();
    return livePromise;
  }

  function strictPhraseRows(text, allRows) {
    const source = ' ' + normalize(text) + ' ';
    const exact = [];
    const contained = [];
    for (const row of allRows) {
      const pali = normalize(row.pali);
      if (!pali) continue;
      const item = { ...row, normalizedPali: pali };
      if (pali === source.trim()) exact.push(item);
      else if (source.includes(' ' + pali + ' ')) contained.push(item);
    }
    const ranked = (exact.length ? exact : contained).sort((a, b) =>
      Number(APPROVED.has(b.status)) - Number(APPROVED.has(a.status)) || b.normalizedPali.length - a.normalizedPali.length);
    const kept = [];
    for (const row of ranked) {
      if (kept.some(existing => existing.normalizedPali === row.normalizedPali && existing.chinese === row.chinese)) continue;
      if (!exact.length && kept.some(existing => APPROVED.has(existing.status) && APPROVED.has(row.status) &&
        (' ' + existing.normalizedPali + ' ').includes(' ' + row.normalizedPali + ' '))) continue;
      kept.push(row);
      if (kept.length >= 12) break;
    }
    return kept;
  }

  function renderTermTable(rows, surface) {
    if (!rows.length) return '<div class="note">No precise 汉译巴利三藏 match was found for <b>' + esc(surface) + '</b>.</div>';
    return '<div class="mahinda-table-wrap"><table class="mahinda-table"><thead><tr><th>Pāli</th><th>玛欣德尊者翻译</th><th>状态</th></tr></thead><tbody>' +
      rows.map(row => '<tr><td>' + esc(row.pali) + '</td><td>' + esc(row.chinese) + '</td><td>' + esc(row.status || '待核对') + '</td></tr>').join('') +
      '</tbody></table></div>';
  }

  function renderAIBase(surface, phrase) {
    return '<div class="ai-box"><div class="ai-head"><div class="ai-title">AI reading assistance</div></div>' +
      '<div class="ai-source">' + esc(surface) + '</div><div class="ai-actions">' +
      '<button class="primary" data-pamc-ai="both">Chinese + English</button>' +
      '<button data-pamc-ai="zh">中文</button><button data-pamc-ai="en">English</button>' +
      '<button data-pamc-ai="detail">Detailed explanation</button></div>' +
      '<div class="ai-help">Terminology marked 规范、核实、已核实、确认 or 已确认 is supplied to AI first. Only precise whole-word or contiguous-phrase matches are used.</div>' +
      '<div class="ai-status" data-pamc-ai-status></div><div data-pamc-ai-result></div></div>';
  }

  async function runAI(modal, surface, modeName) {
    const status = modal.querySelector('[data-pamc-ai-status]');
    const output = modal.querySelector('[data-pamc-ai-result]');
    if (!status || !output) return;
    status.textContent = 'AI is preparing the translation…';
    const matches = strictPhraseRows(surface, await records());
    const confirmed = matches.filter(row => APPROVED.has(row.status)).map(row => ({
      pali: row.pali, chinese: row.chinese, status: row.status
    }));
    try {
      const response = await fetch('/api/pali-translate', { method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ text: surface, mode: modeName, confirmed_terms: confirmed }) });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || ('HTTP ' + response.status));
      status.textContent = '';
      const chinese = json.chinese || json.zh || json.translation_zh || '';
      const english = json.english || json.en || json.translation_en || '';
      const detail = json.detail || json.explanation || '';
      output.innerHTML = (chinese ? '<h3>中文 · AI 暂译</h3><div class="definition">' + esc(chinese) + '</div>' : '') +
        (english ? '<h3>English · AI Translation</h3><div class="definition">' + esc(english) + '</div>' : '') +
        (detail ? '<h3>Literal / grammatical reading</h3><div class="definition">' + esc(detail) + '</div>' : '');
    } catch (error) {
      status.textContent = '';
      output.innerHTML = '<div class="note"><b>AI translation is not available.</b><br>' + esc(error.message || error) + '</div>';
    }
  }

  async function enhanceReader(modal) {
    if (isReferenceReader) { resetTop(modal); return; }
    const surface = selectedText(modal);
    if (!surface) return;
    const phrase = /\s/.test(normalize(surface));
    ensureReaderTabs(modal, phrase);
    const dict = modal.querySelector('#dictTab');
    const terms = modal.querySelector('#termsTab');
    const translate = modal.querySelector('#translateTab');
    const attha = modal.querySelector('#atthaTab');
    if (dict) dict.innerHTML = phrase ? '' : renderDictionary(surface);
    if (attha) { try { if (typeof renderAttha === 'function') attha.innerHTML = renderAttha(surface); } catch (_) {} }
    translate.innerHTML = renderAIBase(surface, phrase);
    translate.onclick = event => { const button = event.target.closest('[data-pamc-ai]'); if (button) runAI(modal, surface, button.dataset.pamcAi); };
    terms.innerHTML = '<div class="note">Searching 汉译巴利三藏…</div>';
    activateTab(modal, phrase ? 'translate' : 'dict');
    const matching = phrase ? strictPhraseRows(surface, await records()) : approvedWordRows(surface, resolution(surface));
    if (selectedText(modal) === surface) terms.innerHTML = renderTermTable(matching, surface);
    if (phrase && selectedText(modal) === surface) runAI(modal, surface, 'both');
  }

  function enhanceBook(modal) {
    const surface = selectedText(modal);
    if (!surface) return;
    const body = modal.querySelector('#dictBody') || modal.querySelector('#dictTab') || modal.querySelector('#pced-body');
    if (body) body.innerHTML = renderDictionary(surface);
    resetTop(modal);
  }

  function modalOpened(modal) {
    const panel = modal.querySelector('.panel,.pced-panel,.modalcontent');
    if (panel) for (const name of ['left', 'top', 'width', 'margin', 'transform']) panel.style.removeProperty(name);
    const first = [...modal.querySelectorAll('.tabs button[data-tab]')].find(button => !button.hidden);
    if (mode !== 'reader' && first && !first.classList.contains('active')) first.click();
    if (mode === 'reader' && modal.id === 'lookupModal') enhanceReader(modal);
    else if (modal.id === 'dictModal' || modal.id === 'lookupModal' || modal.id === 'pced-modal') enhanceBook(modal);
    else resetTop(modal);
  }

  function watchModal(modal) {
    installMovable(modal);
    new MutationObserver(() => { if (modal.classList.contains('open')) queueMicrotask(() => modalOpened(modal)); })
      .observe(modal, { attributes: true, attributeFilter: ['class'] });
  }

  function init() {
    if (!core() || !Object.keys(dictionary()).length) return;
    if (!document.getElementById('pamc-pced-standard-style')) {
      const style = document.createElement('style');
      style.id = 'pamc-pced-standard-style';
      style.textContent = `
        .approved-term-entry{margin:0 0 12px;padding:13px 14px;border:1px solid #d7bd98!important;border-radius:9px;background:#fff8e9}
        .lookup-rule{font-size:.88em;color:#75543d}
        .lookup-section{display:none}.lookup-section.active{display:block}
        .tabs button[hidden]{display:none!important}
        .mahinda-table-wrap{overflow:auto;border:1px solid #e0cdb8;border-radius:12px}
        .mahinda-table{width:100%;border-collapse:collapse}
        .mahinda-table th,.mahinda-table td{padding:10px 12px;border-bottom:1px solid #eadfd3;text-align:left;vertical-align:top}
        .ai-box{border:1px solid #e0cdb8;border-radius:12px;padding:16px}
        .ai-title{font-size:1.2em;font-weight:700;margin-bottom:10px}
        .ai-source{padding:12px;background:#f7f3ee;border-radius:10px;margin-bottom:12px}
        .ai-actions{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}
        .ai-actions button{padding:8px 12px;border:1px solid #a66b42;border-radius:9px;background:#fff;cursor:pointer}
        .ai-actions button.primary{background:#96613d;color:#fff}
        .ai-help,.ai-status{margin:8px 0;color:#75543d;font-size:.9em}
        .panel-head,.pced-panel-head,.modal-header,.dialog-header{touch-action:none}
      `;
      document.head.append(style);
    }
    const data = dictionary();
    const sample = Object.values(data)[0];
    if (sample && Array.isArray(sample.entries) && !('en' in sample || 'zh' in sample || 'my' in sample)) {
      window.PCEDStandardData?.applyFlat?.(data);
    } else {
      window.PCEDStandardData?.applyTo?.(data);
    }
    document.querySelectorAll('.modal,#pced-modal').forEach(watchModal);
    document.addEventListener('pointerdown', event => {
      const word = event.target.closest?.('.pali-word,.attha-word,[data-word]');
      if (word?.dataset?.word) lastWord = word.dataset.word;
    }, true);
    document.addEventListener('selectionchange', () => {
      const text = window.getSelection()?.toString().replace(/\s+/g, ' ').trim();
      if (text && text.length <= 3500) lastWord = text;
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
