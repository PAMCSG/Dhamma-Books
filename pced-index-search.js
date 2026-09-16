/* PCED landing-page search — exact Pāli/diacritic-aware and multilingual. */
(function (global) {
  'use strict';

  const MAX_LANGUAGE_RESULTS = 50;
  const PALI_DIACRITICS = /[āīūṅñṭḍṇḷṃṁŋ]/i;
  const PALI_ONLY = /^[a-zāīūṅñṭḍṇḷṃṁŋ'’\-\s]+$/i;
  const languageTitles = {
    en: 'English', zh: '中文', my: 'Burmese', ja: 'Japanese',
    vi: 'Vietnamese', ko: 'Korean', other: 'Other'
  };
  let dictionary = global.PCEDStandardData?.entries || {};
  // Make the shared popup profile recognise the landing-page dictionary while
  // retaining its index-search renderer and matching rules.
  global.PCED = dictionary;
  let exactIndex = null;
  let foldedHeadwords = new Map();
  let foldedInflections = new Map();

  const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));

  function plainText(value) {
    const holder = document.createElement('div');
    holder.innerHTML = String(value || '');
    return (holder.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function foldPali(value) {
    return String(value || '').normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[ṃṁŋ]/gi, 'm')
      .toLowerCase().replace(/[^a-z]/g, '');
  }

  function addToIndex(index, key, value) {
    if (!key) return;
    if (!index.has(key)) index.set(key, []);
    if (!index.get(key).includes(value)) index.get(key).push(value);
  }

  function buildIndexes() {
    dictionary = global.PCEDStandardData?.entries || {};
    global.PCED = dictionary;
    global.PCEDStandardData?.applyTo?.(dictionary);
    exactIndex = global.PCEDLookupCore?.createExactIndex(dictionary);
    foldedHeadwords = new Map();
    foldedInflections = new Map();
    for (const key of Object.keys(dictionary)) addToIndex(foldedHeadwords, foldPali(key), key);
    for (const [surface, records] of Object.entries(global.PCEDStandardData?.inflections || {})) {
      for (const record of Array.isArray(records) ? records : [records]) {
        if (record?.form) addToIndex(foldedInflections, foldPali(surface), { surface, form: record.form });
      }
    }
  }

  function resolve(surface) {
    return global.PCEDLookupCore?.resolve(surface, {
      dictionary,
      index: exactIndex,
      inflections: global.PCEDStandardData?.inflections,
      decompositions: global.PCEDStandardData?.decompositions
    });
  }

  function unique(values) {
    return [...new Set(values.filter(Boolean))];
  }

  function possibleDiacriticForms(value) {
    const choices = {
      a: ['a', 'ā'], i: ['i', 'ī'], u: ['u', 'ū'],
      n: ['n', 'ṅ', 'ñ', 'ṇ'], t: ['t', 'ṭ'], d: ['d', 'ḍ'],
      l: ['l', 'ḷ'], m: ['m', 'ṃ']
    };
    let forms = [''];
    for (const character of String(value || '').toLowerCase()) {
      const replacements = choices[character] || [character];
      forms = forms.flatMap(form => replacements.map(replacement => form + replacement));
      // Extremely long plain strings are more likely to be an English phrase;
      // exact headword/verified-form indexes above still remain available.
      if (forms.length > 8192) return [];
    }
    return forms;
  }

  function paliMatches(query) {
    const marked = PALI_DIACRITICS.test(query);
    const result = resolve(query);
    const direct = result?.allHeads || result?.heads || [];
    if (marked) return { heads: unique(direct), mode: result?.mode || 'none', marked: true };

    const folded = foldPali(query);
    const heads = [...direct, ...(foldedHeadwords.get(folded) || [])];
    for (const candidate of foldedInflections.get(folded) || []) {
      const candidateResult = resolve(candidate.surface);
      heads.push(...(candidateResult?.allHeads || candidateResult?.heads || []));
      if (!candidateResult?.heads?.length && dictionary[candidate.form]) heads.push(candidate.form);
    }
    if (!heads.length && !/\s/.test(query)) {
      for (const candidate of possibleDiacriticForms(query)) {
        const candidateResult = resolve(candidate);
        heads.push(...(candidateResult?.allHeads || candidateResult?.heads || []));
      }
    }
    return { heads: unique(heads), mode: heads.length ? 'plain-pali' : (result?.mode || 'none'), marked: false };
  }

  function recordsForEntry(entry) {
    const records = [];
    for (const bucket of ['zh', 'en', 'my', 'vi', 'other']) {
      for (const item of entry?.[bucket] || []) records.push({ ...item, bucket });
    }
    for (const item of [...(entry?.entries || []), ...(entry?.extra_entries || [])]) {
      records.push({ ...item, bucket: 'zh' });
    }
    return records;
  }

  function languageMatches(query) {
    const needle = String(query || '').normalize('NFC').toLocaleLowerCase();
    const matches = [];
    let total = 0;
    for (const [key, entry] of Object.entries(dictionary)) {
      const selected = recordsForEntry(entry).filter(item =>
        plainText(item.definition).normalize('NFC').toLocaleLowerCase().includes(needle) ||
        String(item.source_label || item.source || '').normalize('NFC').toLocaleLowerCase().includes(needle)
      );
      if (!selected.length) continue;
      total += 1;
      if (matches.length < MAX_LANGUAGE_RESULTS) matches.push({ key, entry, records: selected });
    }
    return { matches, total };
  }

  function renderRecords(records) {
    const groups = new Map();
    for (const item of records) {
      const bucket = item.bucket || 'other';
      if (!groups.has(bucket)) groups.set(bucket, []);
      groups.get(bucket).push(item);
    }
    return [...groups].map(([bucket, items]) =>
      '<div class="group-title" data-language="' + esc(bucket) + '">' + esc(languageTitles[bucket] || 'Other') + '</div>' +
      items.map(item => '<div class="source">' + esc(item.source_label || item.source || '') + '</div>' +
        '<div class="definition">' + (item.definition || '') + '</div>').join('')
    ).join('');
  }

  function renderHead(key) {
    const entry = dictionary[key];
    if (!entry) return '';
    const groups = global.PCEDLookupCore?.dictionaryGroups(entry, 'zh') || [];
    return '<div class="entry"><div class="headword">' + esc(entry.headword || key) + '</div>' +
      groups.map(group => '<div class="group-title" data-language="' + esc(group.key) + '">' +
        esc(languageTitles[group.key] || group.title || 'Other') + '</div>' +
        group.entries.map(item => '<div class="source">' + esc(item.source_label || item.source || '') + '</div>' +
          '<div class="definition">' + (item.definition || '') + '</div>').join('')).join('') + '</div>';
  }

  function renderLanguageResult(result) {
    return '<div class="entry"><div class="headword">' + esc(result.entry.headword || result.key) + '</div>' +
      renderRecords(result.records) + '</div>';
  }

  function search(query) {
    query = String(query || '').replace(/\s+/g, ' ').trim().normalize('NFC');
    if (!query) return { query, heads: [], html: '', kind: 'empty' };
    const pali = PALI_ONLY.test(query) ? paliMatches(query) : { heads: [], marked: false };
    if (pali.heads.length) {
      const note = !pali.marked && pali.heads.some(head => foldPali(head) === foldPali(query) && head !== query.toLowerCase())
        ? '<div class="note"><b>Diacritic-insensitive Pāli search:</b> ' + esc(query) +
          ' matched all exact spellings with possible Pāli diacritics.</div>' : '';
      return { query, heads: pali.heads, kind: 'pali', html: note + pali.heads.map(renderHead).join('') };
    }
    const language = languageMatches(query);
    const limitNote = language.total > language.matches.length
      ? '<div class="note">Showing the first ' + language.matches.length + ' of ' + language.total + ' matching entries.</div>' : '';
    const html = language.matches.length
      ? limitNote + language.matches.map(renderLanguageResult).join('')
      : '<div class="note"><b>No PCED entry was found for ' + esc(query) + '.</b></div>';
    return { query, heads: language.matches.map(item => item.key), kind: 'language', html };
  }

  function openResult(result) {
    const modal = document.getElementById('pced-modal');
    document.getElementById('pced-title').textContent = result.query;
    document.getElementById('pced-meta').textContent = result.kind === 'pali'
      ? 'PCED · Pāli headword search'
      : 'PCED · Chinese, English, Burmese and other-language search';
    document.getElementById('pced-body').innerHTML = result.html;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    const modal = document.getElementById('pced-modal');
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function init() {
    buildIndexes();
    const form = document.getElementById('pced-index-form');
    const input = document.getElementById('pced-index-query');
    const modal = document.getElementById('pced-modal');
    form?.addEventListener('submit', event => {
      event.preventDefault();
      const query = input.value.trim();
      if (!query) { input.focus(); return; }
      openResult(search(query));
    });
    document.getElementById('pced-close')?.addEventListener('click', closeModal);
    modal?.addEventListener('click', event => { if (event.target === modal) closeModal(); });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && modal?.classList.contains('open')) closeModal();
    });
    global.PCEDIndexSearch = Object.freeze({ search, foldPali, version: '1.0.0' });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})(window);
