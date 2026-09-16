/* Dhamma-Books index PCED search — landing-page integration */
(function () {
  'use strict';

  const MAX_RESULTS = 80;
  const DIACRITICS = /[āīūṅñṭḍṇḷṃṁ]/i;
  const PALI_LETTERS = /^[a-zāīūṅñṭḍṇḷṃṁ\s.'’-]+$/i;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
  const stripHtml = value => String(value ?? '').replace(/<[^>]*>/g, ' ');
  const core = () => window.PCEDLookupCore;
  const dictionary = () => window.PCED || window.PCEDStandardData?.entries || {};
  const normalizeText = value => String(value ?? '').normalize('NFC').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
  const foldPali = value => normalizeText(value)
    .replace(/[ā]/g, 'a').replace(/[ī]/g, 'i').replace(/[ū]/g, 'u')
    .replace(/[ṅ]/g, 'n').replace(/[ñ]/g, 'n')
    .replace(/[ṭ]/g, 't').replace(/[ḍ]/g, 'd')
    .replace(/[ṇ]/g, 'n').replace(/[ḷ]/g, 'l')
    .replace(/[ṃṁ]/g, 'm');

  function allRecords(entry) {
    return ['zh', 'en', 'my', 'vi', 'other']
      .flatMap(key => Array.isArray(entry?.[key]) ? entry[key] : [])
      .concat(entry?.entries || [], entry?.extra_entries || []);
  }

  function exactIndex() {
    const data = dictionary();
    return core()?.createExactIndex(data) || new Map();
  }

  function paliHeads(query) {
    const data = dictionary();
    const index = exactIndex();
    const options = {
      dictionary: data,
      index,
      inflections: window.PCEDStandardData?.inflections,
      decompositions: window.PCEDStandardData?.decompositions
    };
    const resolved = core()?.resolve(query, options);
    const heads = new Set(resolved?.allHeads || resolved?.heads || []);
    const containsDiacritics = DIACRITICS.test(query);

    if (!containsDiacritics) {
      const folded = foldPali(query).replace(/[^a-z]+/g, '');
      if (folded) {
        for (const [key, entry] of Object.entries(data)) {
          const head = core()?.cleanWord(key) || normalizeText(key);
          if (foldPali(head).replace(/[^a-z]+/g, '') === folded) {
            heads.add(key);
            if (entry?.headword) heads.add(key);
          }
        }
      }
    }
    return [...heads].filter(head => data[head]);
  }

  function translationHeads(query) {
    const needle = normalizeText(query);
    if (!needle) return [];
    const exact = [];
    const partial = [];
    for (const [head, entry] of Object.entries(dictionary())) {
      const fields = [entry?.headword, ...allRecords(entry).flatMap(record => [
        record?.definition, record?.source_label
      ])].map(value => normalizeText(stripHtml(value))).filter(Boolean);
      if (fields.some(value => value === needle)) exact.push(head);
      else if (fields.some(value => value.includes(needle))) partial.push(head);
      if (exact.length + partial.length >= MAX_RESULTS * 4) break;
    }
    return [...new Set([...exact, ...partial])];
  }

  function lookup(query) {
    const paliLike = PALI_LETTERS.test(query);
    const strictDiacritic = DIACRITICS.test(query);
    const heads = paliLike ? paliHeads(query) : [];
    if (heads.length || strictDiacritic) {
      return { heads, mode: strictDiacritic ? 'diacritic' : 'pali' };
    }
    return { heads: translationHeads(query), mode: 'translation' };
  }

  function groupTitle(group) {
    return ({ zh: '中文', en: 'English', my: 'Burmese', ja: 'Japanese',
      vi: 'Vietnamese', ko: 'Korean', other: 'Other' })[group?.key] || group?.title || 'Other';
  }

  function renderEntry(head) {
    const entry = dictionary()[head];
    if (!entry) return '';
    const groups = core()?.dictionaryGroups(entry, 'zh') || [];
    return '<div class="entry"><div class="headword">' + esc(entry.headword || head) + '</div>' +
      groups.map(group => '<div class="group-title">' + esc(groupTitle(group)) + '</div>' +
        group.entries.map(item =>
          '<div class="source">' + esc(item.source_label || item.source || '') + '</div>' +
          '<div class="definition">' + (item.definition || '') + '</div>'
        ).join('')).join('') + '</div>';
  }

  function installStyle() {
    const style = document.createElement('style');
    style.id = 'index-pced-search-style';
    style.textContent = `
      .index-pced-search{margin:0 0 22px;padding:13px 15px;border:1px solid var(--line);border-radius:13px;background:var(--paper);box-shadow:0 5px 18px rgba(80,52,35,.08)}
      .index-pced-row{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:center}
      .index-pced-label{color:var(--brown-dark);font-weight:700;white-space:nowrap}
      .index-pced-input{width:100%;min-width:0;height:40px;padding:8px 12px;border:1px solid #c9ad98;border-radius:8px;background:#fff;color:var(--ink);font:16px Georgia,"Times New Roman",serif}
      .index-pced-input:focus{outline:2px solid rgba(168,115,79,.28);border-color:var(--brown)}
      .index-pced-button{height:40px;padding:7px 18px;border:1px solid var(--brown-dark);border-radius:8px;background:var(--brown-dark);color:#fff;font-weight:700;cursor:pointer}
      .index-pced-button:hover{background:#674027}
      #indexPcedModal{display:none;position:fixed;inset:0;z-index:2147483000;padding:72px 14px 14px;background:transparent!important;backdrop-filter:none!important;pointer-events:none}
      #indexPcedModal.open{display:flex;align-items:flex-start;justify-content:center}
      #indexPcedModal .panel{width:min(820px,calc(100vw - 28px));max-height:calc(100vh - 88px);display:flex;flex-direction:column;pointer-events:auto}
      #indexPcedModal .panel-head{flex:0 0 auto}
      #indexPcedModal .panel-title{flex:1;min-width:0}
      #indexPcedModal .panel-meta{font-size:14px;font-weight:400;opacity:.9;margin-top:3px}
      #indexPcedModal .panel-body{overflow:auto;overscroll-behavior:contain}
      #indexPcedModal .index-result-summary{margin:0 0 10px;color:#75543d;font-size:14px}
      @media(max-width:620px){
        .index-pced-search{padding:10px;margin-bottom:16px}
        .index-pced-row{grid-template-columns:auto minmax(0,1fr) auto;gap:6px}
        .index-pced-label{font-size:0}
        .index-pced-label::after{content:"PCED";font-size:13px}
        .index-pced-input{height:38px;font-size:15px;padding:7px 9px}
        .index-pced-button{height:38px;padding:6px 11px}
        #indexPcedModal{padding:64px 6px 6px}
        #indexPcedModal .panel{width:calc(100vw - 12px);max-height:calc(100vh - 70px)}
      }
    `;
    document.head.append(style);
  }

  function installMarkup() {
    const header = document.querySelector('.wrap > header');
    const main = document.querySelector('.wrap > main');
    if (!header || !main) return null;

    const search = document.createElement('section');
    search.className = 'index-pced-search';
    search.setAttribute('aria-label', 'PCED Dictionary Search');
    search.innerHTML =
      '<form class="index-pced-row" id="indexPcedForm">' +
      '<label class="index-pced-label" for="indexPcedInput">PCED Dictionary / PCED 词典</label>' +
      '<input class="index-pced-input" id="indexPcedInput" type="search" autocomplete="off" ' +
      'placeholder="Enter Pāli or translation / 输入巴利语或其他语言" aria-label="Enter Pāli or another language">' +
      '<button class="index-pced-button" type="submit">Search / 搜索</button></form>';
    main.before(search);

    const modal = document.createElement('div');
    modal.id = 'indexPcedModal';
    modal.className = 'modal';
    modal.dataset.modal = 'index-pced';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML =
      '<section class="panel" role="dialog" aria-modal="false" aria-labelledby="indexPcedTitle">' +
      '<div class="panel-head"><div><div class="panel-title" id="indexPcedTitle">PCED Dictionary</div>' +
      '<div class="panel-meta" id="indexPcedMeta"></div></div>' +
      '<button class="close" type="button" data-close aria-label="Close">×</button></div>' +
      '<div class="panel-body" id="indexPcedResults"></div></section>';
    document.body.append(modal);
    return { search, modal };
  }

  function init() {
    if (!core() || !Object.keys(dictionary()).length) return;
    installStyle();
    const installed = installMarkup();
    if (!installed) return;
    const { modal } = installed;
    const form = document.getElementById('indexPcedForm');
    const input = document.getElementById('indexPcedInput');
    const meta = document.getElementById('indexPcedMeta');
    const results = document.getElementById('indexPcedResults');
    const close = () => {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      input.focus({ preventScroll: true });
    };

    form.addEventListener('submit', event => {
      event.preventDefault();
      const query = input.value.normalize('NFC').replace(/\s+/g, ' ').trim();
      if (!query) { input.focus(); return; }
      const found = lookup(query);
      const shown = found.heads.slice(0, MAX_RESULTS);
      meta.textContent = 'Selected / 所选：' + query;
      results.innerHTML = shown.length
        ? '<div class="index-result-summary">' + shown.length +
          (found.heads.length > shown.length ? ' of ' + found.heads.length : '') +
          ' matching entr' + (shown.length === 1 ? 'y' : 'ies') + '</div>' +
          shown.map(renderEntry).join('')
        : '<div class="note"><b>No matching PCED entry was found.</b><br>' +
          (found.mode === 'diacritic'
            ? 'The diacritics were preserved and matched exactly. / 已按照输入的附加符号精确查询。'
            : 'Try a Pāli headword or a word from a translation. / 请输入巴利语词目或译文中的词语。') +
          '</div>';
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      results.scrollTop = 0;
    });
    modal.querySelector('[data-close]').addEventListener('click', close);
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && modal.classList.contains('open')) close();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
