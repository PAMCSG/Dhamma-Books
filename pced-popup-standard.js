/* PAMC cross-book PCED popup standard v1.4.0 — 2026-09-06 */
(function () {
  'use strict';

  const script = document.currentScript;
  const mode = script?.dataset?.pcedMode || 'book';
  const isReferenceReader = /(?:^|\/)kutadantasutta\.html$/i.test(location.pathname);
  const APPROVED = new Set(['规范', '已确认']);
  let lastWord = '';
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

  const LANGUAGE_TITLES = Object.freeze({
    zh: '中文', en: 'English', my: 'Burmese', ja: 'Japanese',
    vi: 'Vietnamese', ko: 'Korean', other: 'Other'
  });

  function groupTitle(group) {
    return LANGUAGE_TITLES[group?.key] || String(group?.title || 'Other')
      .replace(/^中文\s*\/\s*Chinese$/i, '中文')
      .replace(/^မြန်မာ\s*\/\s*Burmese$/i, 'Burmese')
      .replace(/^日本語\s*\/\s*Japanese$/i, 'Japanese')
      .replace(/^Tiếng Việt\s*\/\s*Vietnamese$/i, 'Vietnamese')
      .replace(/^한국어\s*\/\s*Korean$/i, 'Korean');
  }

  function renderDictionaryItem(item) {
    return '<div class="source">' + esc(item.source_label || item.source || '') + '</div>' +
      '<div class="definition">' + (item.definition || '') + '</div>';
  }

  function isSingleWordRecord(row) {
    return String(row?.pali || '').split(/\s*[,;/；，]\s*/)
      .map(value => normalize(value)).some(value => value && !/\s/.test(value));
  }

  function directPublishedRows(surface, allRows) {
    const exact = normalize(surface);
    if (!exact) return [];
    return (Array.isArray(allRows) ? allRows : []).filter(row => {
      if (Number(row?.deleted) || !row?.chinese || !APPROVED.has(String(row?.status || '').trim())) return false;
      return String(row?.pali || '').split(/\s*[,;/；，]\s*/)
        .map(value => normalize(value))
        .some(value => value === exact && !/\s/.test(value));
    }).map(row => ({ ...row, match: 'exact', matchedForm: exact }));
  }

  function approvedWordRows(surface, result, allRows) {
    const approvedTerms = Array.isArray(allRows) && allRows.length
      ? allRows : (window.PCEDApprovedTerms?.records || []);
    // Exact Chinese-Tipitaka matching is deliberately independent of PCED:
    // it must still work when the dictionary resolver returns no headword.
    const direct = directPublishedRows(surface, approvedTerms);
    const resolved = (core()?.approvedTermMatches(surface, result, {
      approvedTerms, includeAllStatuses: false
    }) || []).filter(row => APPROVED.has(String(row?.status || '').trim())).filter(isSingleWordRecord);
    const seen = new Set();
    return [...direct, ...resolved].filter(row => {
      if (!isSingleWordRecord(row)) return false;
      const key = [String(row.dbid || row.id || '').trim(), normalize(row.pali),
        String(row.chinese || '').trim(), String(row.source || '').trim(),
        String(row.status || '').trim()].join('\u241f');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function renderApprovedBlock(rows, surface) {
    const seen = new Set();
    const unique = (rows || []).filter(row => {
      const key = [String(row.dbid || row.id || '').trim(), normalize(row.pali),
        String(row.chinese || '').trim(), String(row.source || '').trim(),
        String(row.status || '').trim()].join('\u241f');
      if (!row.chinese || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    if (!unique.length) return '';
    return '<div class="approved-term-block">' +
      '<div class="source approved-term-title">《汉译巴利三藏》玛欣德尊者和译藏团队</div>' +
      unique.map(row => {
        const source = String(row.source || '').trim();
        return '<div class="approved-term-row">' +
          '<div class="definition approved-term-definition"><span>' + esc(row.chinese) + '</span>' +
            (source ? '<span class="source approved-term-source">（出处：' + esc(source) + '）</span>' : '') +
          '</div>' +
          (row.match === 'inflected' ? '<div class="lookup-rule">' + esc(surface) + ' → ' +
            esc(row.matchedForm) + '（已核实词形变化）</div>' : '') +
        '</div>';
      }).join('') + '</div>';
  }

  function renderEntry(head, approvedRows, surface, includeApproved) {
    const entry = dictionary()[head];
    if (!entry) return '';
    const groups = core()?.dictionaryGroups(entry, 'zh') || [];
    let html = '<div class="entry"><div class="headword">' + esc(entry.headword || head) + '</div>';
    const approved = includeApproved ? renderApprovedBlock(approvedRows, surface) : '';
    const hasChinese = groups.some(group => group.key === 'zh');
    if (approved && !hasChinese) {
      html += '<div class="group-title" data-language="zh">中文</div>' + approved;
    }
    for (const group of groups) {
      html += '<div class="group-title" data-language="' + esc(group.key || 'other') + '">' +
        esc(groupTitle(group)) + '</div>';
      if (group.key === 'zh' && approved) html += approved;
      for (const item of group.entries) html += renderDictionaryItem(item);
    }
    return html + '</div>';
  }

  function renderDictionary(surface, suppliedRows) {
    const result = resolution(surface);
    const heads = result.allHeads || result.heads || [];
    const approvedRows = (Array.isArray(suppliedRows)
      ? suppliedRows : approvedWordRows(surface, result)).filter(isSingleWordRecord);
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

    if (!heads.length) {
      const approved = renderApprovedBlock(approvedRows, surface);
      const approvedEntry = approved
        ? '<div class="entry"><div class="headword">' + esc(surface) + '</div>' +
          '<div class="group-title" data-language="zh">中文</div>' + approved + '</div>' : '';
      return note + approvedEntry + '<div class="note"><b>No reliable PCED entry was found for ' +
        esc(surface) + '.</b><br>Only exact headwords, verified forms, conservative inflections, and verified compound or sandhi analyses were accepted.</div>';
    }
    return note + heads.map((head, index) => renderEntry(head, approvedRows, surface, index === 0)).join('');
  }

  function selectedText(modal) {
    const meta = modal.querySelector('#lookupMeta,#dictMeta,#pced-meta,.lookup-meta,.panel-meta')?.textContent || '';
    const title = modal.querySelector('#lookupTitle,#dictTitle,#pced-title,.panel-title,.pced-panel-title')?.textContent || '';
    const selected = meta.match(/^Selected(?: Pāli word)?:\s*(.+)$/i)?.[1]?.trim() || '';
    const titled = /^(?:PCED|Lookup|AI Translation)$/i.test(title.trim()) ? '' : title.trim();
    return (selected || titled || lastWord).trim();
  }

  function resetTop(modal) {
    const panel = panelOf(modal);
    const reset = () => {
      const nodes = new Set([modal, panel, ...modal.querySelectorAll(
        '.panel-body,#dictBody,#dictTab,#pced-body,.lookup-section,.tab-panel'
      )]);
      for (const node of nodes) {
        if (!node) continue;
        node.scrollTop = 0;
        node.scrollLeft = 0;
        try { node.scrollTo({ top: 0, left: 0, behavior: 'instant' }); } catch (_) {}
      }
    };
    reset();
    requestAnimationFrame(() => requestAnimationFrame(reset));
  }

  const PANEL_SELECTOR = '.panel,.pced-panel,.modalcontent,.modal-content,.lookup-panel,.dictionary-panel,.dialog';
  const HANDLE_SELECTOR = '.panel-head,.pced-panel-head,.modal-header,.dialog-header,.lookup-header,.dict-header,.modal-titlebar';

  function panelOf(modal) {
    if (!modal) return null;
    if (modal.matches?.('[role="dialog"]') && !modal.matches?.('.modal')) return modal;
    return modal.querySelector(PANEL_SELECTOR);
  }

  function handleOf(panel) {
    if (!panel) return null;
    return panel.querySelector(HANDLE_SELECTOR) ||
      [...panel.children].find(node => /^(HEADER|H1|H2)$/.test(node.tagName) || /head|header|titlebar/.test(node.className || ''));
  }

  function installMovable(modal) {
    if (modal.dataset.pamcMovable === '1') return;
    const panel = panelOf(modal);
    const handle = handleOf(panel);
    if (!panel || !handle) return;
    modal.dataset.pamcMovable = '1';
    handle.style.cursor = 'move';
    handle.style.touchAction = 'none';
    let drag = null;
    const move = event => {
      if (!drag || event.pointerId !== drag.id) return;
      panel.style.left = drag.left + event.clientX - drag.x + 'px';
      panel.style.top = drag.top + event.clientY - drag.y + 'px';
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
      Object.assign(panel.style, { position: 'fixed',
        left: rect.left + 'px', top: rect.top + 'px',
        width: drag.width + 'px', margin: '0', transform: 'none' });
      event.preventDefault();
      event.stopImmediatePropagation();
      try { handle.setPointerCapture?.(event.pointerId); } catch (_) {}
      window.addEventListener('pointermove', move, true);
      window.addEventListener('pointerup', end, true);
      window.addEventListener('pointercancel', end, true);
    }, true);
  }

  function activateTab(modal, tab) {
    modal.querySelectorAll('.tabs button[data-tab]').forEach(button => button.classList.toggle('active', !button.hidden && button.dataset.tab === tab));
    modal.querySelectorAll('.lookup-section').forEach(section => section.classList.toggle('active', section.id === tab + 'Tab'));
    resetTop(modal);
  }

  function openFirstView(modal, preferredTab) {
    const first = [...modal.querySelectorAll('.tabs button[data-tab]')].find(button => !button.hidden);
    const tab = preferredTab || first?.dataset.tab || '';
    const apply = () => {
      if (!isOpen(modal)) return;
      if (tab && modal.querySelector('#' + tab + 'Tab')) activateTab(modal, tab);
      else if (first) first.click();
      resetTop(modal);
    };
    apply();
    queueMicrotask(apply);
    requestAnimationFrame(() => requestAnimationFrame(apply));
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
      try { await window.PCEDApprovedTerms?.ready; } catch (_) {}
      let rows = Array.isArray(window.PCEDApprovedTerms?.records)
        ? [...window.PCEDApprovedTerms.records] : [];

      // The protected Tipitaka reader has a same-D1 endpoint. Merge its current
      // non-deleted records so a database exact match is not lost merely
      // because the published browser snapshot is stale or incomplete.
      if (mode === 'reader') {
        try {
          const response = await fetch('/api/records', {
            credentials: 'include', cache: 'no-store',
            headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' }
          });
          if (response.ok) {
            const data = await response.json();
            const incoming = Array.isArray(data) ? data : (data.records || []);
            if (Array.isArray(incoming) && incoming.length) {
              // A complete current same-D1 response is authoritative. Never merge
              // older bundled provenance into current database rows.
              rows = incoming.filter(row => !Number(row?.deleted) && row?.pali && row?.chinese);
            }
          }
        } catch (_) {}
      }
      return rows.filter(row => !Number(row?.deleted) && row?.pali && row?.chinese);
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
    return '<div class="mahinda-table-wrap"><table class="mahinda-table"><thead><tr><th>Pāli</th><th>玛欣德尊者翻译</th></tr></thead><tbody>' +
      rows.map(row => '<tr><td>' + esc(row.pali) + '</td><td>' + esc(row.chinese) + '</td></tr>').join('') +
      '</tbody></table></div>';
  }

  function renderAIBase(surface, phrase) {
    return '<div class="ai-box"><div class="ai-head"><div class="ai-title">AI reading assistance</div></div>' +
      '<div class="ai-source">' + esc(surface) + '</div><div class="ai-actions">' +
      '<button class="primary" data-pamc-ai="both">Chinese + English</button>' +
      '<button data-pamc-ai="zh">中文</button><button data-pamc-ai="en">English</button>' +
      '<button data-pamc-ai="detail">Detailed explanation</button></div>' +
      '<div class="ai-help">Only terminology marked 规范 or 已确认 is supplied to AI first. Only precise whole-word or contiguous-phrase matches are used.</div>' +
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
      const detail = json.detail || json.explanation || [json.literal, json.notes].filter(Boolean).join('\n\n');
      output.innerHTML = (chinese ? '<h3>中文 · AI 暂译</h3><div class="definition">' + esc(chinese) + '</div>' : '') +
        (english ? '<h3>English · AI Translation</h3><div class="definition">' + esc(english) + '</div>' : '') +
        (detail ? '<h3>Literal / grammatical reading</h3><div class="definition">' + esc(detail) + '</div>' : '');
    } catch (error) {
      status.textContent = '';
      output.innerHTML = '<div class="note"><b>AI translation is not available.</b><br>' + esc(error.message || error) + '</div>';
    }
  }

  async function enhanceReader(modal) {
    const surface = selectedText(modal);
    if (!surface) return;
    const phrase = /\s/.test(normalize(surface));
    const result = resolution(surface);
    ensureReaderTabs(modal, phrase);
    const dict = modal.querySelector('#dictTab');
    const terms = modal.querySelector('#termsTab');
    const translate = modal.querySelector('#translateTab');
    const attha = modal.querySelector('#atthaTab');
    const initialRows = phrase ? [] : approvedWordRows(surface, result);
    if (dict) dict.innerHTML = phrase ? '' : renderDictionary(surface, initialRows);
    if (attha) { try { if (typeof renderAttha === 'function') attha.innerHTML = renderAttha(surface); } catch (_) {} }
    if (translate) {
      translate.innerHTML = renderAIBase(surface, phrase);
      translate.onclick = event => {
        const button = event.target.closest('[data-pamc-ai]');
        if (button) runAI(modal, surface, button.dataset.pamcAi);
      };
    }
    if (terms) terms.innerHTML = '<div class="note">Searching 汉译巴利三藏…</div>';
    openFirstView(modal, phrase ? 'translate' : 'dict');

    const allRows = await records();
    if (selectedText(modal) !== surface) return;
    const matching = phrase ? strictPhraseRows(surface, allRows) : approvedWordRows(surface, result, allRows);
    if (dict && !phrase) dict.innerHTML = renderDictionary(surface, matching);
    if (terms) terms.innerHTML = renderTermTable(matching, surface);
    normalizeLanguageHeadings(modal);
    resetTop(modal);
    if (phrase) runAI(modal, surface, 'both');
  }

  async function enhanceBook(modal) {
    const surface = selectedText(modal);
    if (!surface) return;
    const result = resolution(surface);
    const body = modal.querySelector('#dictBody') || modal.querySelector('#dictTab') || modal.querySelector('#pced-body');
    if (body) body.innerHTML = renderDictionary(surface, approvedWordRows(surface, result));
    resetTop(modal);
    const allRows = await records();
    if (selectedText(modal) !== surface) return;
    if (body) body.innerHTML = renderDictionary(surface, approvedWordRows(surface, result, allRows));
    normalizeLanguageHeadings(modal);
    resetTop(modal);
  }

  function normalizeLanguageHeadings(modal) {
    const map = new Map([
      ['中文 / Chinese', '中文'], ['Chinese', '中文'],
      ['မြန်မာ / Burmese', 'Burmese'], ['日本語 / Japanese', 'Japanese'],
      ['Tiếng Việt / Vietnamese', 'Vietnamese'], ['한국어 / Korean', 'Korean']
    ]);
    modal.querySelectorAll('.group-title,.language-title,.lang-title').forEach(node => {
      const value = node.textContent.trim();
      if (map.has(value)) node.textContent = map.get(value);
    });
  }

  function modalOpened(modal) {
    const panel = panelOf(modal);
    if (panel) for (const name of ['left', 'top', 'width', 'margin', 'transform']) panel.style.removeProperty(name);
    installMovable(modal);
    normalizeLanguageHeadings(modal);
    if (mode !== 'reader') openFirstView(modal);
    if (mode === 'reader' && modal.id === 'lookupModal') enhanceReader(modal);
    else if (modal.id === 'dictModal' || modal.id === 'lookupModal' || modal.id === 'pced-modal') enhanceBook(modal);
    else resetTop(modal);
  }

  function isOpen(modal) {
    return modal.classList.contains('open') || modal.getAttribute('aria-hidden') === 'false';
  }

  function watchModal(modal) {
    if (!modal || modal.dataset.pamcWatched === '1') return;
    modal.dataset.pamcWatched = '1';
    installMovable(modal);
    let wasOpen = isOpen(modal);
    new MutationObserver(() => {
      const open = isOpen(modal);
      if (open && !wasOpen) queueMicrotask(() => modalOpened(modal));
      wasOpen = open;
    }).observe(modal, { attributes: true, attributeFilter: ['class', 'style', 'aria-hidden'] });
    if (wasOpen) queueMicrotask(() => modalOpened(modal));
  }

  function scanModals(root = document) {
    const found = [];
    if (root.matches?.('.modal,#pced-modal,[data-modal]')) found.push(root);
    root.querySelectorAll?.('.modal,#pced-modal,[data-modal]').forEach(modal => found.push(modal));
    [...new Set(found)].forEach(watchModal);
  }

  function init() {
    if (!core() || !Object.keys(dictionary()).length) return;
    window.addEventListener('pced-approved-terms-updated', () => {
      livePromise = null;
      queueMicrotask(() => document.querySelectorAll('.modal,#pced-modal,[data-modal]').forEach(modal => {
        if (isOpen(modal)) modalOpened(modal);
      }));
    });
    if (!document.getElementById('pamc-pced-standard-style')) {
      const style = document.createElement('style');
      style.id = 'pamc-pced-standard-style';
      style.textContent = `
        :root{--pamc-popup-brown:#75482d;--pamc-popup-brown-dark:#603921;--pamc-popup-tan:#ead8c3;--pamc-popup-paper:#fffdf9;--pamc-popup-ink:#2d2924;--pamc-popup-blue:#0b4f8a;--pamc-popup-line:#ddc7b1}
        .modal,#pced-modal,[data-modal]{color:var(--pamc-popup-ink);font-family:Georgia,"Times New Roman","Noto Serif SC","Songti SC",SimSun,serif;font-size:18px}
        .modal .panel,.modal .pced-panel,.modal .modalcontent,.modal .modal-content,.modal .lookup-panel,.modal .dictionary-panel,.modal .dialog,
        #pced-modal .panel,#pced-modal .pced-panel,#pced-modal .modalcontent,#pced-modal .modal-content{
          background:var(--pamc-popup-paper)!important;color:var(--pamc-popup-ink)!important;border:1px solid #a97958!important;border-radius:13px!important;box-shadow:0 20px 70px #0006!important;max-height:92vh
        }
        .modal .panel-head,.modal .pced-panel-head,.modal .modal-header,.modal .dialog-header,.modal .lookup-header,.modal .dict-header,.modal .modal-titlebar,
        #pced-modal .panel-head,#pced-modal .pced-panel-head,#pced-modal .modal-header{
          background:var(--pamc-popup-brown)!important;color:#fff!important;padding:8px 16px!important;border:0!important;border-radius:12px 12px 0 0!important;min-height:54px;display:flex;align-items:center;gap:10px;touch-action:none
        }
        .modal .panel-title,.modal .pced-panel-title,.modal .pced-title,.modal .modal-title,.modal .dialog-title,.modal .lookup-title,
        #pced-modal .panel-title,#pced-modal .pced-panel-title,#pced-modal .pced-title{
          color:#fff!important;font-family:Georgia,"Times New Roman",serif!important;font-size:28px!important;line-height:1.15!important;font-weight:700!important
        }
        .modal .close,.modal .close-btn,.modal .pced-close,.modal [data-close],#pced-modal .close,#pced-modal .close-btn,#pced-modal .pced-close{
          color:#fff!important;background:transparent!important;border:1px solid #d6bda9!important;border-radius:9px!important;font-family:Arial,sans-serif!important;font-size:26px!important;line-height:1!important;min-width:36px;min-height:36px;padding:4px 8px!important
        }
        .modal .panel-body,.modal .modal-body,.modal .pced-panel-body,.modal .pced-body,#pced-modal .panel-body,#pced-modal .modal-body,#pced-modal .pced-body{
          background:var(--pamc-popup-paper)!important;color:var(--pamc-popup-ink)!important;padding:18px 22px 24px!important
        }
        .lookup-meta,.panel-meta,#dictMeta,#pced-meta{color:#74665b!important;font-size:14px!important;margin-bottom:10px!important}
        .entry{padding:13px 0!important;border-top:1px solid #eadfd5!important;background:transparent!important}
        .entry:first-child{border-top:0!important}
        .headword{font-family:Georgia,"Times New Roman",serif!important;font-size:27px!important;font-weight:700!important;line-height:1.2!important;color:var(--pamc-popup-blue)!important;margin:4px 0 8px!important}
        .group-title,.language-title,.lang-title{
          display:block!important;background:var(--pamc-popup-tan)!important;color:#68442f!important;border-radius:6px!important;padding:6px 10px!important;margin:12px 0 8px!important;font-family:Georgia,"Times New Roman","Noto Serif SC",SimSun,serif!important;font-size:22px!important;font-weight:700!important;line-height:1.25!important
        }
        .source{color:#846b58!important;font-family:Arial,"Microsoft YaHei","Noto Sans Myanmar",sans-serif!important;font-size:14px!important;font-weight:600!important;line-height:1.45!important;margin:7px 0 2px!important}
        .definition{color:var(--pamc-popup-ink)!important;font-family:Georgia,"Times New Roman","Noto Serif SC","Songti SC",SimSun,"Myanmar Text","Noto Sans Myanmar",serif!important;font-size:18px!important;line-height:1.65!important}
        .note{background:#f4eee7!important;color:var(--pamc-popup-ink)!important;border:0!important;font-size:18px!important;border-radius:8px!important;padding:11px 14px!important;line-height:1.55!important;margin:8px 0 12px!important}
        .approved-term-entry{background:transparent!important;border:1px solid var(--pamc-popup-line)!important}
        .approved-term-block{border:1px solid #cfae8f;border-radius:9px;background:transparent;margin:7px 0 12px;padding:0 13px}
        .approved-term-title{margin:0!important;padding:10px 0 7px!important}
        .approved-term-row{padding:7px 0 10px;border-top:1px solid #eadfd5}
        .approved-term-row:first-of-type{border-top:0}
        .approved-term-definition{font-size:18px!important}
        .approved-term-source,.approved-term-status{display:inline!important;margin:0 0 0 .4em!important;font-size:14px!important;font-weight:400!important;white-space:normal}
        .lookup-rule{font-size:14px!important;color:#75543d!important;margin-top:5px}
        .lookup-section{display:none}.lookup-section.active{display:block}
        .tabs{display:flex!important;gap:6px!important;flex-wrap:wrap!important;border-bottom:1px solid var(--pamc-popup-line)!important;margin:3px 0 13px!important;padding-bottom:8px!important}
        .tabs button[data-tab]{display:inline-flex;align-items:center;justify-content:center;color:#68442f!important;background:var(--pamc-popup-tan)!important;border:1px solid #c7a684!important;border-radius:7px!important;padding:5px 9px!important;font-family:Arial,"Microsoft YaHei",sans-serif!important;font-size:12px!important;font-weight:600!important;line-height:1.25!important;box-shadow:none!important}
        .tabs button[data-tab]:hover{background:#dfc5aa!important}
        .tabs button[data-tab].active{color:#fff!important;background:#9a6b49!important;border-color:#8b5d3d!important}
        .tabs button[hidden]{display:none!important}
        .mahinda-table-wrap{overflow:auto;border:1px solid var(--pamc-popup-line);border-radius:9px}
        .mahinda-table{width:100%;border-collapse:collapse;background:transparent}
        .mahinda-table th,.mahinda-table td{padding:9px 11px;border-bottom:1px solid #eadfd3;text-align:left;vertical-align:top}
        .mahinda-table th{background:var(--pamc-popup-tan)!important;color:#68442f!important;font-size:12px!important}
        .ai-box{border:1px solid var(--pamc-popup-line);border-radius:10px;padding:15px;background:transparent}
        .ai-title{color:var(--pamc-popup-blue);font-family:Georgia,"Times New Roman",serif;font-size:20px;font-weight:700;margin-bottom:10px}
        .ai-source{padding:11px;background:#f4eee7;border-radius:8px;margin-bottom:12px}
        .ai-actions{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:10px}
        .ai-actions button{padding:6px 10px;border:1px solid #b98f6d;border-radius:7px;background:var(--pamc-popup-tan);color:#68442f;cursor:pointer;font-size:13px}
        .ai-actions button.primary{background:#9a6b49;color:#fff}
        .ai-help,.ai-status{margin:8px 0;color:#75543d;font-size:14px}
        @media(max-width:600px){
          .modal,#pced-modal{padding:6px!important}
          .modal .panel-body,.modal .modal-body,.modal .pced-panel-body,.modal .pced-body,#pced-modal .panel-body,#pced-modal .pced-body{padding:14px 14px 20px!important}
          .modal .panel-title,.modal .pced-panel-title,.modal .pced-title,.modal .modal-title,#pced-modal .panel-title,#pced-modal .pced-title{font-size:25px!important}
          .headword{font-size:24px!important}.group-title,.language-title,.lang-title{font-size:20px!important}.definition{font-size:17px!important}
          .tabs button[data-tab]{font-size:12px!important;padding:5px 7px!important}
        }
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
    scanModals();
    new MutationObserver(mutations => mutations.forEach(mutation => mutation.addedNodes.forEach(node => {
      if (node.nodeType === 1) scanModals(node);
    }))).observe(document.documentElement, { childList: true, subtree: true });
    document.addEventListener('pointerdown', event => {
      const word = event.target.closest?.('.pali-word,.attha-word,[data-word]');
      if (word?.dataset?.word) lastWord = word.dataset.word;
    }, true);
    // Run after the host page's embedded click handler has opened and filled
    // its modal. This makes the real page integration deterministic instead
    // of depending only on attribute-observer timing.
    document.addEventListener('click', event => {
      const word = event.target.closest?.('.pali-word,.attha-word,[data-word]');
      if (!word) return;
      if (word.dataset?.word) lastWord = word.dataset.word;
      queueMicrotask(() => document.querySelectorAll('.modal,#pced-modal,[data-modal]').forEach(modal => {
        if (isOpen(modal)) modalOpened(modal);
      }));
    }, true);
    document.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
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
