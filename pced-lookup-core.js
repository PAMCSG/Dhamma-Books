/*
 * PAMC shared PCED lookup core
 * Version 3.4.0 — 2026-09-05
 *
 * One resolver is shared by every book. Hosts provide their PCED data and
 * keep their own popup layout. A candidate is accepted only when it is a
 * complete headword in that host's PCED data. No prefix, substring or fuzzy
 * fallback is permitted.
 */
(function (global) {
  'use strict';

  const VERSION = '3.4.0';
  const EDGE_NON_PALI = /^[^a-zāīūṅñṭḍṇḷṃ]+|[^a-zāīūṅñṭḍṇḷṃ]+$/g;
  const PALI_FORM = /^[a-zāīūṅñṭḍṇḷṃ]+$/;

  // Verified linguistic decompositions; every part must still be validated
  // as a complete PCED headword at runtime.
  const BUILTIN_DECOMPOSITIONS = Object.freeze({
    'tenupasaṅkami': Object.freeze({ kind: 'sandhi', parts: Object.freeze(['tena', 'upasaṅkami']) }),
    'yañca': Object.freeze({ kind: 'sandhi', parts: Object.freeze(['yaṃ', 'ca']) }),
    'panāhaṃ': Object.freeze({ kind: 'sandhi', parts: Object.freeze(['pana', 'ahaṃ']) }),
    'etadavoca': Object.freeze({ kind: 'sandhi', parts: Object.freeze(['etaṃ', 'avoca']) }),
    'mahāpariccāga': Object.freeze({ kind: 'compound', parts: Object.freeze(['mahanta', 'pariccāga']) }),
    'dhammacakkappavattana': Object.freeze({ kind: 'compound', parts: Object.freeze(['dhammacakka', 'pavattana']) }),
    'pākārantara': Object.freeze({ kind: 'compound', parts: Object.freeze(['pākāra', 'antara']) })
  });

  // Verified whole-word spelling variants. A mapped form is accepted only
  // when it is an exact PCED headword in the host dictionary.
  const BUILTIN_ALIASES = Object.freeze({
    'vīriyindriya': Object.freeze(['viriyindriya'])
  });

  const SOURCE_LANGUAGE = Object.freeze({
    A: 'ja', S: 'ja', // Mizuno Hiroshi's Pāli-Japanese dictionaries.
    E: 'vi', Q: 'vi', U: 'vi', // Vietnamese dictionaries in legacy `other` buckets.
    L: 'ko'           // Korean PTS translation.
  });

  const GROUP_TITLES = Object.freeze({
    en: 'English',
    zh: '中文 / Chinese',
    my: 'မြန်မာ / Burmese',
    ja: '日本語 / Japanese',
    vi: 'Tiếng Việt / Vietnamese',
    ko: '한국어 / Korean',
    other: 'Other'
  });

  function normalizeForMatch(value) {
    return String(value ?? '')
      .normalize('NFC')
      .toLocaleLowerCase()
      .replace(/[ṁŋ]/g, 'ṃ')
      .replace(/~n/g, 'ñ')
      .replace(/t\./g, 'ṭ')
      .replace(/d\./g, 'ḍ')
      .replace(/n\./g, 'ṇ')
      .replace(/l\./g, 'ḷ')
      .replace(/aa/g, 'ā')
      .replace(/ii/g, 'ī')
      .replace(/uu/g, 'ū')
      .replace(/[‘’‛ʼ`´]/g, "'")
      .trim();
  }

  function cleanWord(value) {
    return normalizeForMatch(value).replace(EDGE_NON_PALI, '');
  }

  function createExactIndex(dictionary) {
    const index = new Map();
    for (const key of Object.keys(dictionary || {})) {
      const normalized = cleanWord(key);
      if (!normalized) continue;
      if (!index.has(normalized)) index.set(normalized, []);
      index.get(normalized).push(key);
    }
    return index;
  }

  function inflectionCandidates(surface) {
    const word = cleanWord(surface);
    const candidates = [];
    const add = (form, label, family) => {
      form = cleanWord(form);
      if (form && form !== word && !candidates.some(item => item.form === form)) {
        candidates.push({ form, label, family });
      }
    };

    const suffixRules = (rules, family) => {
      for (const [suffix, replacement, label = `-${suffix} → -${replacement}`] of rules) {
        if (word.endsWith(suffix) && word.length > suffix.length + 2) {
          add(word.slice(0, -suffix.length) + replacement, label, family);
        }
      }
    };

    // Regular nominal/adjectival declensions. These rules only propose
    // dictionary forms: resolve() accepts one only when the complete result
    // is an attested PCED headword. Explicit verified-form tables are tried
    // before these productive paradigms.
    const aStemRules = [
      ['ānaṃ', 4], ['ehi', 3], ['ebhi', 4], ['assa', 4], ['ena', 3],
      ['esu', 3], ['asmā', 4], ['amhā', 4], ['asmiṃ', 5], ['amhi', 4],
      ['āni', 3], ['aṃ', 2], ['o', 1], ['e', 1], ['ā', 1]
    ];
    for (const [suffix, removeCount] of aStemRules) {
      if (word.endsWith(suffix) && word.length > removeCount + 2) {
        add(word.slice(0, -removeCount) + 'a', `-${suffix} → -a`, 'a-stem');
        // Some PCED proper-name/adjective entries use the masculine
        // nominative -o as their citation form instead of the stem in -a.
        add(word.slice(0, -removeCount) + 'o', `-${suffix} → PCED citation -o`, 'a-stem citation variant');
      }
    }

    if (word.endsWith('āya') && word.length > 5) {
      add(word.slice(0, -3) + 'ā', '-āya → -ā', 'ā-stem');
      add(word.slice(0, -3) + 'a', '-āya → -a', 'a-stem');
    }
    if (word.endsWith('āyaṃ') && word.length > 6) add(word.slice(0, -4) + 'ā', '-āyaṃ → -ā', 'ā-stem');
    if (word.endsWith('āsu') && word.length > 5) add(word.slice(0, -3) + 'ā', '-āsu → -ā', 'ā-stem');
    if (word.endsWith('ānaṃ') && word.length > 6) add(word.slice(0, -4) + 'ā', '-ānaṃ → -ā', 'ā-stem');
    suffixRules([
      ['aṃ', 'ā'], ['āyo', 'ā'], ['āhi', 'ā'], ['ābhi', 'ā']
    ], 'ā-stem');

    if (word.endsWith('iyā') && word.length > 4) {
      add(word.slice(0, -3) + 'i', '-iyā → -i', 'i-stem');
      add(word.slice(0, -3) + 'ī', '-iyā → -ī', 'ī-stem');
    }
    if (word.endsWith('īnaṃ') && word.length > 6) {
      add(word.slice(0, -4) + 'i', '-īnaṃ → -i', 'i-stem');
      add(word.slice(0, -4) + 'ī', '-īnaṃ → -ī', 'ī-stem');
    }
    if (word.endsWith('issa') && word.length > 5) add(word.slice(0, -4) + 'i', '-issa → -i', 'i-stem');
    if (word.endsWith('ismiṃ') && word.length > 6) add(word.slice(0, -5) + 'i', '-ismiṃ → -i', 'i-stem');
    if (word.endsWith('imhi') && word.length > 5) add(word.slice(0, -4) + 'i', '-imhi → -i', 'i-stem');
    if (word.endsWith('inā') && word.length > 4) {
      add(word.slice(0, -3) + 'i', '-inā → -i', 'i-stem');
      add(word.slice(0, -3) + 'ī', '-inā → -ī', 'ī-stem');
    }
    suffixRules([
      ['iṃ', 'i'], ['iṃ', 'ī'], ['ayo', 'i'], ['īni', 'i'], ['īni', 'ī'],
      ['īhi', 'i'], ['īhi', 'ī'], ['ībhi', 'i'], ['ībhi', 'ī'],
      ['īsu', 'i'], ['īsu', 'ī'], ['isu', 'i'], ['iyo', 'i'], ['iyo', 'ī'],
      ['ī', 'i']
    ], 'i/ī-stem');

    // Adjectives and agent nouns whose dictionary citation form ends in -in.
    suffixRules([
      ['inaṃ', 'in'], ['inā', 'in'], ['ino', 'in'], ['issa', 'in'],
      ['ibhi', 'in'], ['ihi', 'in'], ['īnaṃ', 'in'], ['īsu', 'in']
    ], '-in stem');

    const uStemRules = [
      ['ūnaṃ', 4], ['ūbhi', 4], ['ūhi', 3], ['ūsu', 3],
      ['ussa', 4], ['usmā', 4], ['umhā', 4], ['usmiṃ', 5], ['umhi', 4],
      ['unā', 3], ['uno', 3], ['uṃ', 2], ['avo', 3], ['ū', 1]
    ];
    for (const [suffix, removeCount] of uStemRules) {
      if (word.endsWith(suffix) && word.length > removeCount + 2) {
        add(word.slice(0, -removeCount) + 'u', `-${suffix} → -u`, 'u-stem');
      }
    }
    suffixRules([
      ['ūni', 'u'], ['uyo', 'u'], ['uyā', 'u'], ['ubhi', 'u'], ['uhi', 'u'], ['usu', 'u']
    ], 'u/ū-stem');

    // -vantu/-mantu possessive adjectives. Inflected -vant/-mant forms are
    // reduced to the PCED citation form, never matched by prefix.
    suffixRules([
      ['vantaṃ', 'vantu'], ['vantena', 'vantu'], ['vantassa', 'vantu'],
      ['vanto', 'vantu'], ['vantā', 'vantu'], ['vante', 'vantu'],
      ['vantehi', 'vantu'], ['vantebhi', 'vantu'], ['vantānaṃ', 'vantu'],
      ['vantesu', 'vantu'], ['vatā', 'vantu'], ['vato', 'vantu'], ['vati', 'vantu']
    ], '-vantu stem');
    suffixRules([
      ['mantaṃ', 'mantu'], ['mantena', 'mantu'], ['mantassa', 'mantu'],
      ['manto', 'mantu'], ['mantā', 'mantu'], ['mante', 'mantu'],
      ['mantehi', 'mantu'], ['mantebhi', 'mantu'], ['mantānaṃ', 'mantu'],
      ['mantesu', 'mantu'], ['matā', 'mantu'], ['mato', 'mantu'], ['mati', 'mantu']
    ], '-mantu stem');

    // Consonant-stem relationship/agent nouns (pitar, mātar, satthar etc.).
    suffixRules([
      ['taraṃ', 'tar'], ['tarā', 'tar'], ['tari', 'tar'], ['taro', 'tar'],
      ['tare', 'tar'], ['tarūhi', 'tar'], ['tarūnaṃ', 'tar']
    ], '-tar stem');

    if (word.endsWith('ato') && word.length > 4) add(word.slice(0, -3) + 'a', '-ato → -a', 'a-stem');
    if (word.endsWith('ito') && word.length > 4) add(word.slice(0, -3) + 'i', '-ito → -i', 'i-stem');

    // Regular finite and non-finite verb families. Multiple conjugation
    // classes can share a surface ending, so candidates are ordered from the
    // most common class and every accepted lemma is independently attested.
    suffixRules([
      ['enti', 'eti'], ['etu', 'eti'], ['entu', 'eti'], ['emi', 'eti'], ['esi', 'eti'], ['etha', 'eti'],
      ['onti', 'oti'], ['otu', 'oti'], ['ontu', 'oti'], ['omi', 'oti'], ['oma', 'oti'], ['osi', 'oti'], ['otha', 'oti'],
      ['āmi', 'ati'], ['āma', 'ati'], ['asi', 'ati'], ['atha', 'ati'], ['atu', 'ati'], ['antu', 'ati'], ['anti', 'ati'],
      ['āmi', 'āti'], ['āma', 'āti'], ['āsi', 'āti'], ['ātha', 'āti'], ['ātu', 'āti'], ['anti', 'āti'],
      ['ate', 'ati'], ['ante', 'ati']
    ], 'present/imperative verb');

    suffixRules([
      ['eyyaṃ', 'ati'], ['eyyuṃ', 'ati'], ['eyyāsi', 'ati'], ['eyyātha', 'ati'],
      ['eyyāmi', 'ati'], ['eyyāma', 'ati'], ['eyya', 'ati'],
      ['eyyaṃ', 'eti'], ['eyyuṃ', 'eti'], ['eyya', 'eti']
    ], 'optative verb');

    for (const lemmaEnding of ['ati', 'āti', 'eti', 'oti']) {
      suffixRules([
        ['issāmi', lemmaEnding], ['issāma', lemmaEnding], ['issasi', lemmaEnding],
        ['issatha', lemmaEnding], ['issati', lemmaEnding], ['issanti', lemmaEnding]
      ], 'future verb');
    }

    suffixRules([
      ['itvā', 'ati'], ['ituṃ', 'ati'], ['etvā', 'eti'], ['etuṃ', 'eti'],
      ['otvā', 'oti'], ['otuṃ', 'oti']
    ], 'absolutive/infinitive verb');

    return candidates;
  }

  function formsFromMap(map, key) {
    if (!map) return [];
    const value = map[key];
    if (!value) return [];
    if (typeof value === 'string') return [value];
    if (Array.isArray(value)) return value;
    if (Array.isArray(value.headwords)) return value.headwords;
    return [];
  }

  function decompositionFromEntry(entry) {
    if (!entry) return null;
    const records = ['zh', 'en', 'my', 'vi', 'other']
      .flatMap(key => Array.isArray(entry[key]) ? entry[key] : [])
      .concat(entry.entries || [], entry.extra_entries || []);
    for (const record of records) {
      const plain = String(record?.definition || '').replace(/<[^>]*>/g, ' ');
      const match = plain.match(/[\[«]([^\]»]+\+[^\]»]+)[\]»]/);
      if (!match) continue;
      const parts = match[1].split('+').map(cleanWord)
        .filter(part => part.length > 1 && PALI_FORM.test(part));
      if (parts.length >= 2 && parts.length <= 5) return { kind: 'compound', parts };
    }
    return null;
  }

  function normalizeDecomposition(value) {
    if (!value) return null;
    const rawParts = Array.isArray(value) ? value : value.parts;
    if (!Array.isArray(rawParts)) return null;
    const parts = rawParts.map(item => cleanWord(typeof item === 'string' ? item : item?.surface || item?.form || item?.head))
      .filter(Boolean);
    return parts.length >= 2 ? { kind: value.kind || 'compound', parts } : null;
  }

  function decompositionFor(key, options = {}) {
    key = cleanWord(key);
    return normalizeDecomposition(
      options.decompositions?.[key] ||
      options.compounds?.[key] ||
      global.PCEDStandardData?.decompositions?.[key] ||
      BUILTIN_DECOMPOSITIONS[key]
    );
  }

  function niggahitaCaDecomposition(word) {
    word = cleanWord(word);
    if (!word.endsWith('ñca') || word.length <= 4) return null;
    return {
      kind: 'sandhi',
      parts: [word.slice(0, -3) + 'ṃ', 'ca'],
      label: 'ñc = ṃ + c (niggahīta assimilation)'
    };
  }

  function resolutionContext(options) {
    const dictionary = options.dictionary || {};
    const index = options.index || createExactIndex(dictionary);
    const exact = form => (index.get(cleanWord(form)) || []).slice();
    return { dictionary, index, exact };
  }

  function verifiedInflectionCandidates(surface, options) {
    const map = options.inflections || global.PCEDStandardData?.inflections;
    const values = map?.[cleanWord(surface)];
    if (!Array.isArray(values)) return [];
    return values.map(item => typeof item === 'string'
      ? { form: cleanWord(item), label: 'verified inflection', family: 'verified' }
      : { form: cleanWord(item?.form), label: item?.label || 'verified inflection', family: item?.family || 'verified' })
      .filter(item => item.form);
  }

  function resolvePart(form, context, options) {
    let heads = context.exact(form);
    let method = heads.length ? 'exact' : 'none';
    if (!heads.length) {
      for (const map of [options.fallbackAliases, options.aliases, BUILTIN_ALIASES]) {
        const mapped = formsFromMap(map, cleanWord(form));
        heads = mapped.flatMap(context.exact);
        if (heads.length) { method = 'related'; break; }
      }
    }
    if (!heads.length) {
      for (const candidate of verifiedInflectionCandidates(form, options)) {
        heads = context.exact(candidate.form);
        if (heads.length) { method = 'inflected'; break; }
      }
    }
    if (!heads.length) {
      for (const candidate of inflectionCandidates(form)) {
        heads = context.exact(candidate.form);
        if (heads.length) { method = 'inflected'; break; }
      }
    }
    if (!heads.length) {
      const mapped = formsFromMap(options.related, cleanWord(form));
      heads = mapped.flatMap(context.exact);
      if (heads.length) method = 'related';
    }
    return { surface: form, method, heads: [...new Set(heads)] };
  }

  function resolve(surface, options = {}) {
    const clicked = String(surface ?? '');
    const normalized = cleanWord(clicked);
    const context = resolutionContext(options);
    const base = {
      version: VERSION, clicked, normalized, mode: 'none', tier: 0,
      heads: [], components: [], componentHeads: [], allHeads: [], notes: [], attemptedForms: []
    };
    if (!normalized) return base;

    const finish = result => {
      result.heads = [...new Set(result.heads || [])];
      result.componentHeads = [...new Set((result.components || []).flatMap(part => part.heads || []))]
        .filter(head => !result.heads.includes(head));
      result.allHeads = [...result.heads, ...result.componentHeads];
      return result;
    };

    const addEntryDecomposition = result => {
      if (result.heads.length !== 1 || result.components.length) return result;
      const head = result.heads[0];
      // The maintained standard table takes precedence over formulas embedded
      // in individual dictionary records, which occasionally use a stem form
      // that differs from the approved display analysis (for example mano).
      const verifiedSplit = decompositionFor(head, options);
      if (verifiedSplit) {
        const components = verifiedSplit.parts.map(part => resolvePart(part, context, options));
        if (components.every(part => part.heads.length)) result.components = components;
      }
      if (!result.components.length) {
        const definitionSplit = decompositionFromEntry(context.dictionary[head]);
        if (definitionSplit) {
          const components = definitionSplit.parts.map(part => resolvePart(part, context, options));
          // A PCED bracketed formula is treated as a displayable compound only
          // when every component is itself an attested complete headword.
          if (components.every(part => part.heads.length)) result.components = components;
        }
      }
      return result;
    };

    const exactHeads = context.exact(normalized);
    if (exactHeads.length) {
      return finish(addEntryDecomposition({ ...base, mode: 'exact', tier: 1, heads: exactHeads }));
    }

    for (const [map, label] of [
      [options.fallbackAliases, 'verified fallback headword'],
      [options.aliases, 'verified headword'],
      [BUILTIN_ALIASES, 'verified PCED spelling']
    ]) {
      const mapped = formsFromMap(map, normalized);
      const heads = mapped.flatMap(context.exact);
      if (heads.length) {
        return finish(addEntryDecomposition({
          ...base, mode: label.includes('related') ? 'related' : 'alias', tier: 2,
          heads, resolvedForm: cleanWord(mapped[0]), notes: [`${clicked} → ${mapped.join(', ')} (${label})`]
        }));
      }
    }

    const verifiedCandidates = verifiedInflectionCandidates(normalized, options);
    for (const candidate of verifiedCandidates) {
      const heads = context.exact(candidate.form);
      if (heads.length) {
        return finish(addEntryDecomposition({
          ...base, mode: 'inflected', tier: 3, heads,
          resolvedForm: candidate.form, rule: candidate.label, family: candidate.family,
          notes: [`${clicked} → ${candidate.form} (${candidate.label})`]
        }));
      }
    }

    const candidates = inflectionCandidates(normalized);
    base.attemptedForms = [...new Set([...verifiedCandidates, ...candidates].map(candidate => candidate.form))];
    for (const candidate of candidates) {
      const heads = context.exact(candidate.form);
      if (heads.length) {
        return finish(addEntryDecomposition({
          ...base, mode: 'inflected', tier: 3, heads,
          resolvedForm: candidate.form, rule: candidate.label, family: candidate.family,
          notes: [`${clicked} → ${candidate.form} (${candidate.label})`]
        }));
      }
    }

    // Only after exact and whole-word inflection lookup has failed, treat
    // final -ñca as niggahīta + ca. Returning this result even when the first
    // component is unattested prevents legacy maps from inventing "añca" or
    // "mañca" as standalone words.
    const ncaSplit = niggahitaCaDecomposition(normalized);
    if (ncaSplit) {
      const components = ncaSplit.parts.map(part => resolvePart(part, context, options));
      return finish({
        ...base, mode: 'sandhi', tier: 4, components,
        resolvedForm: ncaSplit.parts[0], rule: ncaSplit.label,
        notes: [`${clicked} → ${ncaSplit.parts.join(' + ')} (${ncaSplit.label})`]
      });
    }

    const decompositionKeys = [normalized, ...candidates.map(candidate => candidate.form)];
    for (const key of decompositionKeys) {
      const split = decompositionFor(key, options);
      if (!split) continue;
      const components = split.parts.map(part => resolvePart(part, context, options));
      return finish({
        ...base, mode: split.kind || 'compound', tier: 4, components, resolvedForm: key,
        notes: [`${clicked} → ${split.parts.join(' + ')} (${split.kind || 'compound'})`]
      });
    }

    const relatedHeads = formsFromMap(options.related, normalized).flatMap(context.exact);
    if (relatedHeads.length) {
      return finish(addEntryDecomposition({
        ...base, mode: 'related', tier: 5, heads: relatedHeads,
        resolvedForm: cleanWord(relatedHeads[0]), notes: [`${clicked} → ${relatedHeads.join(', ')} (verified related form)`]
      }));
    }

    const record = options.lookupRecords?.[normalized];
    if (record && ['related', 'inflected'].includes(record.mode)) {
      const heads = formsFromMap(options.lookupRecords, normalized).flatMap(context.exact);
      if (heads.length) return finish({ ...base, mode: record.mode, tier: record.mode === 'related' ? 2 : 3, heads });
    }

    return finish(base);
  }

  const APPROVED_TERM_STATUSES = new Set(['已确认', '规范']);
  const APPROVED_TERM_INDEX_CACHE = new WeakMap();

  function approvedTermAlternatives(pali) {
    return String(pali || '').split(/\s*[,;/；，]\s*/)
      .map(value => cleanWord(value))
      // A single-word click must not inherit the translation of a phrase
      // merely because that phrase happens to contain the same word.
      .filter(value => value && !/\s/.test(value));
  }

  function approvedTermIndex(records) {
    if (APPROVED_TERM_INDEX_CACHE.has(records)) return APPROVED_TERM_INDEX_CACHE.get(records);
    const index = new Map();
    for (const record of records) {
      if (!APPROVED_TERM_STATUSES.has(String(record?.status || '').trim())) continue;
      if (!String(record?.chinese || '').trim()) continue;
      for (const form of approvedTermAlternatives(record?.pali)) {
        if (!index.has(form)) index.set(form, []);
        index.get(form).push(record);
      }
    }
    APPROVED_TERM_INDEX_CACHE.set(records, index);
    return index;
  }

  function approvedTermMatches(surface, resolution = {}, options = {}) {
    const records = options.approvedTerms || global.PCEDApprovedTerms?.records || [];
    if (!Array.isArray(records) || !records.length) return [];
    const index = approvedTermIndex(records);
    const exact = cleanWord(surface);
    const collect = (forms, match) => {
      const seen = new Set(), out = [];
      for (const form of forms.map(cleanWord).filter(Boolean)) {
        for (const record of index.get(form) || []) {
          const signature = [record.id || '', record.pali || '', record.chinese || '', record.status || ''].join('\u241f');
          if (seen.has(signature)) continue;
          seen.add(signature);
          out.push({ ...record, match, matchedForm: form });
        }
      }
      return out;
    };

    const exactRows = collect([exact], 'exact');
    if (exactRows.length) return exactRows;

    // Only verified aliases/whole-word inflections may connect the clicked
    // form to an approved database headword. Compound components and merely
    // related forms are deliberately excluded.
    if (!['alias', 'inflected'].includes(resolution.mode)) return [];
    const heads = resolution.primaryHeads || resolution.heads || [];
    return collect([resolution.resolvedForm, ...heads], 'inflected');
  }

  function classifySourceEntry(record, originalBucket = 'other') {
    const code = String(record?.source || '').trim().toUpperCase();
    return SOURCE_LANGUAGE[code] || (GROUP_TITLES[originalBucket] ? originalBucket : 'other');
  }

  function dictionaryGroups(entry, primaryLanguage = 'en') {
    const grouped = { en: [], zh: [], my: [], ja: [], vi: [], ko: [], other: [] };
    for (const bucket of ['en', 'zh', 'my', 'vi', 'other']) {
      for (const record of Array.isArray(entry?.[bucket]) ? entry[bucket] : []) {
        grouped[classifySourceEntry(record, bucket)].push(record);
      }
    }
    for (const record of [...(entry?.entries || []), ...(entry?.extra_entries || [])]) {
      grouped[classifySourceEntry(record, 'zh')].push(record);
    }
    const primary = ['en', 'zh', 'my'].includes(primaryLanguage) ? primaryLanguage : 'en';
    const order = primary === 'zh'
      ? ['zh', 'en', 'my', 'ja', 'vi', 'ko', 'other']
      : primary === 'my'
        ? ['my', 'zh', 'en', 'ja', 'vi', 'ko', 'other']
        : ['en', 'zh', 'my', 'ja', 'vi', 'ko', 'other'];
    return order.filter(key => grouped[key].length).map(key => ({
      key, title: GROUP_TITLES[key], entries: grouped[key]
    }));
  }

  global.PCEDLookupCore = Object.freeze({
    version: VERSION,
    normalizeForMatch,
    cleanWord,
    createExactIndex,
    inflectionCandidates,
    resolve,
    approvedTermMatches,
    classifySourceEntry,
    dictionaryGroups,
    verifiedDecompositions: BUILTIN_DECOMPOSITIONS
  });
})(window);
