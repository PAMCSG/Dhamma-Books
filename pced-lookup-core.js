/*
 * PAMC shared PCED lookup core
 * Version 2.2.0 — 2026-09-04
 *
 * One resolver is shared by every book. Hosts provide their PCED data and
 * keep their own popup layout. A candidate is accepted only when it is a
 * complete headword in that host's PCED data. No prefix, substring or fuzzy
 * fallback is permitted.
 */
(function (global) {
  'use strict';

  const VERSION = '2.2.0';
  const EDGE_NON_PALI = /^[^a-zāīūṅñṭḍṇḷṃ]+|[^a-zāīūṅñṭḍṇḷṃ]+$/g;
  const PALI_FORM = /^[a-zāīūṅñṭḍṇḷṃ]+$/;

  // Verified linguistic decompositions; every part must still be validated
  // as a complete PCED headword at runtime.
  const VERIFIED_DECOMPOSITIONS = Object.freeze({
    'tenupasaṅkami': Object.freeze({ kind: 'sandhi', parts: Object.freeze(['tena', 'upasaṅkami']) }),
    'yañca': Object.freeze({ kind: 'sandhi', parts: Object.freeze(['yaṃ', 'ca']) }),
    'mahāpariccāga': Object.freeze({ kind: 'compound', parts: Object.freeze(['mahanta', 'pariccāga']) }),
    'dhammacakkappavattana': Object.freeze({ kind: 'compound', parts: Object.freeze(['dhammacakka', 'pavattana']) }),
    'pākārantara': Object.freeze({ kind: 'compound', parts: Object.freeze(['pākāra', 'antara']) })
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

    const aStemRules = [
      ['ānaṃ', 4], ['ehi', 3], ['ebhi', 4], ['assa', 4], ['ena', 3],
      ['esu', 3], ['asmā', 4], ['amhā', 4], ['asmiṃ', 5], ['amhi', 4],
      ['āni', 3], ['aṃ', 2], ['o', 1], ['e', 1], ['ā', 1]
    ];
    for (const [suffix, removeCount] of aStemRules) {
      if (word.endsWith(suffix) && word.length > removeCount + 2) {
        add(word.slice(0, -removeCount) + 'a', `-${suffix} → -a`, 'a-stem');
      }
    }

    if (word.endsWith('āya') && word.length > 5) {
      add(word.slice(0, -3) + 'ā', '-āya → -ā', 'ā-stem');
      add(word.slice(0, -3) + 'a', '-āya → -a', 'a-stem');
    }
    if (word.endsWith('āyaṃ') && word.length > 6) add(word.slice(0, -4) + 'ā', '-āyaṃ → -ā', 'ā-stem');
    if (word.endsWith('āsu') && word.length > 5) add(word.slice(0, -3) + 'ā', '-āsu → -ā', 'ā-stem');
    if (word.endsWith('ānaṃ') && word.length > 6) add(word.slice(0, -4) + 'ā', '-ānaṃ → -ā', 'ā-stem');

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

    if (word.endsWith('ato') && word.length > 4) add(word.slice(0, -3) + 'a', '-ato → -a', 'a-stem');
    if (word.endsWith('ito') && word.length > 4) add(word.slice(0, -3) + 'i', '-ito → -i', 'i-stem');

    // Conservative finite-verb endings. A generated form is never displayed
    // unless the resulting lemma is an exact headword in the host dictionary.
    const verbRules = [
      ['āmi', 'ati'], ['āma', 'ati'], ['asi', 'ati'], ['atha', 'ati'], ['anti', 'ati'],
      ['issāmi', 'ati'], ['issati', 'ati'], ['issanti', 'ati'],
      ['emi', 'eti'], ['enti', 'eti'], ['etu', 'eti'], ['entu', 'eti']
    ];
    for (const [suffix, replacement] of verbRules) {
      if (word.endsWith(suffix) && word.length > suffix.length + 2) {
        add(word.slice(0, -suffix.length) + replacement, `-${suffix} → -${replacement}`, 'verb');
      }
    }

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
      for (const map of [options.fallbackAliases, options.aliases, options.related]) {
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
      const definitionSplit = decompositionFromEntry(context.dictionary[head]);
      if (definitionSplit) {
        const components = definitionSplit.parts.map(part => resolvePart(part, context, options));
        // A PCED bracketed formula is treated as a displayable compound only
        // when every component is itself an attested complete headword.
        if (components.every(part => part.heads.length)) result.components = components;
      }
      if (!result.components.length) {
        const verifiedSplit = VERIFIED_DECOMPOSITIONS[cleanWord(head)];
        if (verifiedSplit) result.components = verifiedSplit.parts.map(part => resolvePart(part, context, options));
      }
      return result;
    };

    const exactHeads = context.exact(normalized);
    if (exactHeads.length) {
      return finish(addEntryDecomposition({ ...base, mode: 'exact', tier: 1, heads: exactHeads }));
    }

    // An explicitly verified sandhi/compound is stronger evidence than a
    // legacy related-form map. Accept it here only when every component is
    // independently attested as a complete PCED headword.
    const directSplit = VERIFIED_DECOMPOSITIONS[normalized];
    if (directSplit) {
      const components = directSplit.parts.map(part => resolvePart(part, context, options));
      if (components.every(part => part.heads.length)) {
        return finish({
          ...base, mode: directSplit.kind || 'compound', tier: 2, components,
          resolvedForm: normalized,
          notes: [`${clicked} → ${directSplit.parts.join(' + ')} (${directSplit.kind || 'compound'})`]
        });
      }
    }

    for (const [map, label] of [
      [options.fallbackAliases, 'verified fallback headword'],
      [options.aliases, 'verified headword'],
      [options.related, 'verified related form']
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

    const decompositionKeys = [normalized, ...candidates.map(candidate => candidate.form)];
    for (const key of decompositionKeys) {
      const hostSplit = normalizeDecomposition(options.decompositions?.[key] || options.compounds?.[key]);
      const split = hostSplit || VERIFIED_DECOMPOSITIONS[key];
      if (!split) continue;
      const components = split.parts.map(part => resolvePart(part, context, options));
      return finish({
        ...base, mode: split.kind || 'compound', tier: 4, components, resolvedForm: key,
        notes: [`${clicked} → ${split.parts.join(' + ')} (${split.kind || 'compound'})`]
      });
    }

    const record = options.lookupRecords?.[normalized];
    if (record && ['related', 'inflected'].includes(record.mode)) {
      const heads = formsFromMap(options.lookupRecords, normalized).flatMap(context.exact);
      if (heads.length) return finish({ ...base, mode: record.mode, tier: record.mode === 'related' ? 2 : 3, heads });
    }

    return finish(base);
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
    classifySourceEntry,
    dictionaryGroups,
    verifiedDecompositions: VERIFIED_DECOMPOSITIONS
  });
})(window);
