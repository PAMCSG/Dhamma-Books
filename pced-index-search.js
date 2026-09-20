/* PCED landing-page search — exact Pāli/diacritic-aware and multilingual. */
(function (global) {
  'use strict';

  const MAX_LANGUAGE_RESULTS = 50;
  const APPROVED_STATUSES = new Set(['规范', '已确认']);
  const PRIORITY_KEY = 'pamc_pced_index_priority_v1';
  const PALI_DIACRITICS = /[āīūṅñṭḍṇḷṃṁŋ]/i;
  const PALI_ONLY = /^[a-zāīūṅñṭḍṇḷṃṁŋ'’\-\s]+$/i;
  const languageTitles = {
    en: 'English', zh: '中文', my: 'Burmese', ja: 'Japanese',
    vi: 'Vietnamese', ko: 'Korean', other: 'Other'
  };
  let dictionary = global.PATISAMBHIDAMAGGA_PCED || {};
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
    dictionary = global.PATISAMBHIDAMAGGA_PCED || {};
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
    if (marked) return { heads: unique(direct), mode: result?.mode || 'none', marked: true, resolution: result };

    const folded = foldPali(query);
    const heads = [...direct, ...(foldedHeadwords.get(folded) || [])];
    // A plain-ASCII query may resolve only after trying its possible Pāli
    // diacritics. Preserve that successful resolution so the landing-page
    // popup can display the same inflected-form analysis as reader popups.
    let displayResolution = result;
    const rememberResolution = candidateResult => {
      if (!candidateResult?.heads?.length) return;
      const candidateIsAnalysis = candidateResult.mode === 'inflected' || candidateResult.grammar;
      const currentIsAnalysis = displayResolution?.mode === 'inflected' || displayResolution?.grammar;
      if (candidateIsAnalysis && !currentIsAnalysis) displayResolution = candidateResult;
    };
    for (const candidate of foldedInflections.get(folded) || []) {
      const candidateResult = resolve(candidate.surface);
      heads.push(...(candidateResult?.allHeads || candidateResult?.heads || []));
      rememberResolution(candidateResult);
      if (!candidateResult?.heads?.length && dictionary[candidate.form]) heads.push(candidate.form);
    }
    if (!heads.length && !/\s/.test(query)) {
      for (const candidate of possibleDiacriticForms(query)) {
        const candidateResult = resolve(candidate);
        heads.push(...(candidateResult?.allHeads || candidateResult?.heads || []));
        rememberResolution(candidateResult);
      }
    }
    return { heads: unique(heads), mode: heads.length ? 'plain-pali' : (result?.mode || 'none'), marked: false,
      resolution: displayResolution };
  }

  function renderGrammarNote(result) {
    const grammar = result?.grammar;
    if (!grammar) {
      if (result?.mode !== 'inflected') return '';
      const head = result.heads?.[0];
      const lemma = dictionary[head]?.headword || result.resolvedForm || head;
      return '<div class="note"><b>Inflected form:</b> ' + esc(result.clicked || '') +
        ' → <b>' + esc(lemma || '') + '</b>' +
        (result.rule ? '<br><span class="lookup-rule">' + esc(result.rule) + '</span>' : '') +
        '</div>';
    }
    const lemma = dictionary[grammar.lemmaHead]?.headword || grammar.lemma;
    return '<div class="note grammar-analysis"><b>Verb form:</b> ' + esc(result.clicked || grammar.surface) +
      ' → <b>' + esc(lemma) + '</b>' +
      (grammar.label ? '<br><span class="lookup-rule">' + esc(grammar.label) + '</span>' : '') +
      (grammar.meaning ? '<br><span class="lookup-rule">Meaning: “' + esc(grammar.meaning) + '”</span>' : '') +
      (grammar.formation ? '<br><span class="lookup-rule">Formation: ' + esc(grammar.formation) + '</span>' : '') +
      (grammar.sourceNote ? '<br><span class="lookup-rule">Note: ' + esc(grammar.sourceNote) + '</span>' : '') +
      '</div>';
  }

  const INFLECTION_UI = {
    en: { title: 'Inflections', verified: 'Verified forms', case: 'Case', singular: 'Singular', plural: 'Plural',
      caution: 'Possible regular forms; irregular forms may differ.' },
    zh: { title: '词形变化', verified: '已核实词形', case: '格', singular: '单数', plural: '复数',
      caution: '可能的规则词形；不规则形式可能不同。' },
    my: { title: 'ဝေါဟာရပုံစံများ', verified: 'အတည်ပြုပြီးသော ပုံစံများ', case: 'ဝိဘတ်', singular: 'ဧကဝုစ်', plural: 'ဗဟုဝုစ်',
      caution: 'ဖြစ်နိုင်သော ပုံမှန်ပုံစံများဖြစ်ပြီး မမှန်ပုံစံများ ကွဲပြားနိုင်သည်။' }
  };
  const CASE_UI = {
    zh: { Nominative: '主格', Vocative: '呼格', Accusative: '宾格', Instrumental: '具格', Dative: '与格', Ablative: '从格', Genitive: '属格', Locative: '处格' }
  };
  function localizedGroupLabel(label, language) {
    const text = String(label || '');
    const gender = /Masculine|Masc\./i.test(text) ? 'm' : /Feminine|Fem\./i.test(text) ? 'f' : /Neuter|Neut\./i.test(text) ? 'n' : '';
    const ending = text.match(/["“]([^"”]+)["”]/)?.[1];
    const irregular = /irregular/i.test(text);
    if (language === 'zh' && gender) {
      const name = { m: '阳性名词', f: '阴性名词', n: '中性名词' }[gender];
      if (irregular) return name + '，不规则变格';
      if (/\bas\s*\(mano\)/i.test(text)) return name + '，-as（mano 类）变格';
      return name + (ending ? '，-' + ending + ' 变格' : '');
    }
    if (language === 'my' && gender) {
      const name = { m: 'ပုလ္လိင်နာမ်', f: 'ဣတ္ထိလိင်နာမ်', n: 'နပုံသကလိင်နာမ်' }[gender];
      return irregular ? name + '၊ မမှန်ဝိဘတ်ပြောင်း' : name + (ending ? '၊ -' + ending + ' ဝိဘတ်ပြောင်း' : '');
    }
    return text.replace('declens.', 'declension').replace('decl.', 'declension');
  }

  function renderInflectionPanel(head, priority = 'en') {
    const inflections = global.PCEDStandardData?.inflections;
    const mappedLemmas = (inflections?.[head] || []).map(item =>
      typeof item === 'string' ? item : item?.form
    ).filter(Boolean);
    const candidates = [head, ...mappedLemmas];
    let paradigm = null;
    for (const lemma of candidates) {
      paradigm = global.PCEDLookupCore?.inflectionParadigm?.(lemma, dictionary[lemma], { inflections });
      if (paradigm) break;
    }
    if (!paradigm) return '';
    const ui = INFLECTION_UI[priority] || INFLECTION_UI.en;
    const caseLabel = label => CASE_UI[priority]?.[label] || label;
    const chips = forms => (forms || []).map(form =>
      '<span class="pced-form-chip">' + esc(form) + '</span>'
    ).join(' ');
    let content = '';
    if (paradigm.verified?.length) {
      content += '<div class="pced-inflection-group"><b>' + esc(ui.verified) + '</b>' +
        '<div class="pced-form-list">' + chips(paradigm.verified) + '</div></div>';
    }
    for (const group of paradigm.groups || []) {
      content += '<div class="pced-inflection-group"><b>' + esc(localizedGroupLabel(group.label, priority)) + '</b>';
      if (group.rows) {
        const hasPlural = group.rows.some(row => row.plural?.length);
        content += '<div class="pced-inflection-table-wrap"><table class="pced-inflection-table">' +
          '<thead><tr><th>' + esc(ui.case) + '</th><th>' + esc(ui.singular) + '</th>' +
          (hasPlural ? '<th>' + esc(ui.plural) + '</th>' : '') + '</tr></thead><tbody>' +
          group.rows.map(row => '<tr><th>' + esc(caseLabel(row.label)) + '</th><td>' + chips(row.singular) +
            '</td>' + (hasPlural ? '<td>' + chips(row.plural) + '</td>' : '') + '</tr>').join('') + '</tbody></table></div>';
      } else content += '<div class="pced-form-list">' + chips(group.forms) + '</div>';
      content += '</div>';
    }
    content += '<div class="pced-inflection-caution">来源 / Source: Pali Lookup version 2.0</div>';
    if (paradigm.generated) {
      content += '<div class="pced-inflection-caution">' + esc(ui.caution) + '</div>';
    }
    return '<div class="pced-inflections"><button type="button" class="pced-inflection-toggle" ' +
      'aria-expanded="false">' + esc(ui.title) + '</button><div class="pced-inflection-panel" hidden>' +
      content + '</div></div>';
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

  function renderRecords(records, priority) {
    const groups = new Map();
    for (const item of records) {
      const bucket = item.bucket || 'other';
      if (!groups.has(bucket)) groups.set(bucket, []);
      groups.get(bucket).push(item);
    }
    const order = priority === 'zh' ? ['zh', 'en', 'my', 'ja', 'vi', 'ko', 'other']
      : priority === 'my' ? ['my', 'zh', 'en', 'ja', 'vi', 'ko', 'other']
        : ['en', 'zh', 'my', 'ja', 'vi', 'ko', 'other'];
    return order.filter(bucket => groups.has(bucket)).map(bucket => {
      const items = groups.get(bucket);
      return (
      '<div class="group-title" data-language="' + esc(bucket) + '">' + esc(languageTitles[bucket] || 'Other') + '</div>' +
      items.map(item => '<div class="source">' + esc(item.source_label || item.source || '') + '</div>' +
        '<div class="definition">' + (item.definition || '') + '</div>').join('')
      );
    }).join('');
  }

  function approvedRowsForHead(key) {
    const records = global.PCEDApprovedTerms?.records || [];
    const result = resolve(key);
    const rows = global.PCEDLookupCore?.approvedTermMatches(key, result, {
      approvedTerms: records, includeAllStatuses: true
    }) || [];
    const seen = new Set();
    return rows.filter(row => {
      const single = String(row?.pali || '').split(/\s*[,;/；，]\s*/)
        .some(value => value.trim() && !/\s/.test(value.trim()));
      const signature = [row?.pali, row?.chinese, row?.source, row?.status].join('\u241f');
      if (!single || !APPROVED_STATUSES.has(String(row?.status || '').trim()) || seen.has(signature)) return false;
      seen.add(signature);
      return true;
    });
  }

  function renderApprovedRows(rows) {
    if (!rows.length) return '';
    return '<div class="group-title" data-language="zh-tipitaka">汉译巴利三藏</div>' +
      '<div class="approved-term-block"><div class="source approved-term-title">玛欣德尊者和译藏团队</div>' +
      rows.map(row => '<div class="approved-term-row"><div class="definition approved-term-definition">' +
        esc(row.chinese) + (row.source ? '<span class="source approved-term-source">（出处：' +
          esc(row.source) + '）</span>' : '') + '</div></div>').join('') + '</div>';
  }

  function renderHead(key, priority) {
    const entry = dictionary[key];
    if (!entry) return '';
    const groups = global.PCEDLookupCore?.dictionaryGroups(entry, priority) || [];
    const approved = priority === 'zh' ? renderApprovedRows(approvedRowsForHead(key)) : '';
    return '<div class="entry"><div class="headword">' + esc(entry.headword || key) + '</div>' +
      renderInflectionPanel(key, priority) +
      approved +
      groups.map(group => '<div class="group-title" data-language="' + esc(group.key) + '">' +
        esc(languageTitles[group.key] || group.title || 'Other') + '</div>' +
        group.entries.map(item => '<div class="source">' + esc(item.source_label || item.source || '') + '</div>' +
          '<div class="definition">' + (item.definition || '') + '</div>').join('')).join('') + '</div>';
  }

  function renderLanguageResult(result, priority) {
    return '<div class="entry"><div class="headword">' + esc(result.entry.headword || result.key) + '</div>' +
      renderInflectionPanel(result.key, priority) +
      renderRecords(result.records, priority) + '</div>';
  }

  function search(query, priority = 'en') {
    priority = ['en', 'zh', 'my'].includes(priority) ? priority : 'en';
    query = String(query || '').replace(/\s+/g, ' ').trim().normalize('NFC');
    if (!query) return { query, heads: [], html: '', kind: 'empty' };
    const pali = PALI_ONLY.test(query) ? paliMatches(query) : { heads: [], marked: false };
    if (pali.heads.length) {
      const note = !pali.marked && pali.heads.some(head => foldPali(head) === foldPali(query) && head !== query.toLowerCase())
        ? '<div class="note"><b>Diacritic-insensitive Pāli search:</b> ' + esc(query) +
          ' matched all exact spellings with possible Pāli diacritics.</div>' : '';
      return { query, heads: pali.heads, kind: 'pali', priority,
        html: note + renderGrammarNote(pali.resolution) +
          pali.heads.map(head => renderHead(head, priority)).join('') };
    }
    const language = languageMatches(query);
    const limitNote = language.total > language.matches.length
      ? '<div class="note">Showing the first ' + language.matches.length + ' of ' + language.total + ' matching entries.</div>' : '';
    const html = language.matches.length
      ? limitNote + language.matches.map(result => renderLanguageResult(result, priority)).join('')
      : '<div class="note"><b>No PCED entry was found for ' + esc(query) + '.</b></div>';
    return { query, heads: language.matches.map(item => item.key), kind: 'language', priority, html };
  }

  function openResult(result) {
    const modal = document.getElementById('pced-modal');
    document.getElementById('pced-title').textContent = result.query;
    const priorityName = { en: 'English', zh: '中文', my: 'Burmese' }[result.priority] || 'English';
    const sequence = result.priority === 'zh'
      ? '汉译巴利三藏 → PCED 中文 → English → Burmese → Other'
      : result.priority === 'my'
        ? 'Burmese → 中文 → English → Other'
        : 'English → 中文 → Burmese → Other';
    document.getElementById('pced-meta').textContent = result.kind === 'pali'
      ? 'Pāli Lexicon · ' + priorityName + ' first'
      : 'Pāli Lexicon · ' + priorityName + ' first · multilingual search';
    document.getElementById('pced-credit').textContent = 'PCED 2.0.5.0 · ' + sequence;
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
    const priority = document.getElementById('pced-index-priority');
    const modal = document.getElementById('pced-modal');
    try { priority.value = localStorage.getItem(PRIORITY_KEY) || 'en'; } catch (_) {}
    priority?.addEventListener('change', () => {
      try { localStorage.setItem(PRIORITY_KEY, priority.value); } catch (_) {}
    });
    form?.addEventListener('submit', async event => {
      event.preventDefault();
      const query = input.value.trim();
      if (!query) { input.focus(); return; }
      if (priority.value === 'zh') {
        try { await global.PCEDApprovedTerms?.ready; } catch (_) {}
      }
      openResult(search(query, priority.value));
    });
    document.getElementById('pced-close')?.addEventListener('click', closeModal);
    modal?.addEventListener('click', event => { if (event.target === modal) closeModal(); });
    modal?.addEventListener('click', event => {
      const toggle = event.target.closest?.('.pced-inflection-toggle');
      if (!toggle) return;
      const panel = toggle.nextElementSibling;
      const opening = !!panel?.hidden;
      if (panel) panel.hidden = !opening;
      toggle.setAttribute('aria-expanded', String(opening));
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && modal?.classList.contains('open')) closeModal();
    });
    global.PCEDIndexSearch = Object.freeze({ search, foldPali, version: '1.5.2' });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})(window);
