/*
 * PAMC shared PCED lookup core
 * Version 3.9.1 — 2026-09-20
 *
 * One resolver is shared by every book. Hosts provide their PCED data and
 * keep their own popup layout. A candidate is accepted only when it is a
 * complete headword in that host's PCED data. No prefix, substring or fuzzy
 * fallback is permitted.
 */
(function (global) {
  'use strict';

  const VERSION = '3.9.1';
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
    'pākārantara': Object.freeze({ kind: 'compound', parts: Object.freeze(['pākāra', 'antara']) }),
    // hata + avasesaka contracts across the compound boundary to hatāvasesaka.
    // Some source dictionaries print "hata + vasesaka", but vasesaka is not
    // an independently attested PCED headword; both approved parts below are.
    'hatāvasesaka': Object.freeze({ kind: 'compound', parts: Object.freeze(['hata', 'avasesaka']) }),
    'dassukhīla': Object.freeze({ kind: 'compound', parts: Object.freeze(['dassu', 'khīla']) })
  });

  // Verified whole-word spelling variants. A mapped form is accepted only
  // when it is an exact PCED headword in the host dictionary.
  const BUILTIN_ALIASES = Object.freeze({
    'vīriyindriya': Object.freeze(['viriyindriya'])
  });

  // Verified whole-word inflections that cannot be recovered reliably by a
  // productive suffix rule. `preferLemma` also applies when PCED contains a
  // separate entry for the surface form, so the popup still identifies the
  // grammatical form and opens the verb's citation entry.
  const BUILTIN_INFLECTIONS = Object.freeze({
    'paṭisuṇitvā': Object.freeze([Object.freeze({
      form: 'paṭissuṇāti', label: 'absolutive: having agreed/promised',
      family: 'verified verb form', preferLemma: true
    })]),
    'paṭissuṇitvā': Object.freeze([Object.freeze({
      form: 'paṭissuṇāti', label: 'absolutive: having agreed/promised',
      family: 'verified verb form', preferLemma: true
    })]),
    'paṭissutvā': Object.freeze([Object.freeze({
      form: 'paṭissuṇāti', label: 'absolutive: having agreed/promised',
      family: 'verified verb form', preferLemma: true
    })]),
    'agamā': Object.freeze([Object.freeze({ form: 'gacchati', label: 'Hiyyattanī, third-person singular: went', family: 'Kaccāyana verb form', preferLemma: true })]),
    'agamū': Object.freeze([Object.freeze({ form: 'gacchati', label: 'Hiyyattanī, third-person plural: went', family: 'Kaccāyana verb form', preferLemma: true })]),
    'agamī': Object.freeze([Object.freeze({ form: 'gacchati', label: 'Ajjatanī (aorist), third-person singular: went', family: 'Kaccāyana verb form', preferLemma: true })]),
    'agamuṃ': Object.freeze([Object.freeze({ form: 'gacchati', label: 'Ajjatanī (aorist), third-person plural: went', family: 'Kaccāyana verb form', preferLemma: true })]),
    'agacchi': Object.freeze([Object.freeze({ form: 'gacchati', label: 'Ajjatanī (aorist), third-person singular: went', family: 'Kaccāyana verb form', preferLemma: true })]),
    'agacchuṃ': Object.freeze([Object.freeze({ form: 'gacchati', label: 'Ajjatanī (aorist), third-person plural: went', family: 'Kaccāyana verb form', preferLemma: true })])
  });

  // Kaccāyana-confirmed forms of gamu (to go). Past systems cannot be
  // recovered safely from a present-tense ending alone, so irregular and
  // historically transformed forms are maintained as complete-word families.
  // Sources: Kaccāyana Pāli Vyākaraṇaṁ §§418–419, 476, 517, 519.
  const KACCAYANA_VERB_PARADIGMS = Object.freeze({
    'gacchati': Object.freeze([
      Object.freeze({ label: 'Present (Vattamānā): 3sg, 3pl, 2sg, 2pl, 1sg, 1pl', forms: Object.freeze(['gacchati', 'gacchanti', 'gacchasi', 'gacchatha', 'gacchāmi', 'gacchāma']) }),
      Object.freeze({ label: 'Past imperfect (Hiyyattanī)', forms: Object.freeze(['agamā', 'agamū']) }),
      Object.freeze({ label: 'Aorist / recent past (Ajjatanī)', forms: Object.freeze(['agamī', 'agamuṃ', 'agacchi', 'agacchuṃ']) }),
      Object.freeze({ label: 'Imperative (Pañcamī)', forms: Object.freeze(['gacchatu', 'gacchantu', 'gacchāhi', 'gacchatha']) }),
      Object.freeze({ label: 'Optative (Sattamī)', forms: Object.freeze(['gaccheyya', 'gaccheyyuṃ', 'gaccheyyāsi', 'gaccheyyātha', 'gaccheyyāmi', 'gaccheyyāma']) }),
      Object.freeze({ label: 'Future (Bhavissanti)', forms: Object.freeze(['gacchissati', 'gacchissanti', 'gacchissasi', 'gacchissatha', 'gacchissāmi', 'gacchissāma']) })
    ])
  });

  // Curated analyses are reserved for forms whose inherited dictionary
  // formula needs clarification. Productive verb-number recognition remains
  // rule-based and is accepted only when both the surface form and its lemma
  // are complete PCED headwords.
  const BUILTIN_GRAMMAR_ANALYSES = Object.freeze({
    'gacchati': Object.freeze({ lemma: 'gacchati', root: 'gamu', label: 'Third-person singular, present active', meaning: 'goes' }),
    'dissanti': Object.freeze({
      lemma: 'dissati',
      label: 'Third-person plural, present passive',
      meaning: 'are seen; appear'
    })
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
      ['enti', 'eti', 'third-person plural, present'], ['etu', 'eti'], ['entu', 'eti'], ['emi', 'eti'], ['esi', 'eti'], ['etha', 'eti'],
      ['onti', 'oti', 'third-person plural, present'], ['otu', 'oti'], ['ontu', 'oti'], ['omi', 'oti'], ['oma', 'oti'], ['osi', 'oti'], ['otha', 'oti'],
      ['āmi', 'ati'], ['āma', 'ati'], ['asi', 'ati'], ['atha', 'ati'], ['atu', 'ati'], ['antu', 'ati'], ['anti', 'ati', 'third-person plural, present'],
      ['āmi', 'āti'], ['āma', 'āti'], ['āsi', 'āti'], ['ātha', 'āti'], ['ātu', 'āti'], ['anti', 'āti', 'third-person plural, present'],
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
        ['issatha', lemmaEnding], ['issati', lemmaEnding],
        ['issanti', lemmaEnding, 'third-person plural, future']
      ], 'future verb');
    }

    // Verbs whose present citation form ends in -eti commonly form their
    // future with -ess- rather than -iss-: viheṭheti → viheṭhessanti.
    // As with every productive rule, the proposed -eti lemma is used only
    // when it is independently attested as a complete PCED headword.
    suffixRules([
      ['essāmi', 'eti'], ['essāma', 'eti'], ['essasi', 'eti'],
      ['essatha', 'eti'], ['essati', 'eti'],
      ['essanti', 'eti', 'third-person plural, future']
    ], 'future -e verb');

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

  function entryRecords(entry) {
    return ['zh', 'en', 'my', 'vi', 'other']
      .flatMap(key => Array.isArray(entry?.[key]) ? entry[key] : [])
      .concat(entry?.entries || [], entry?.extra_entries || []);
  }

  // PCED frequently records the attested past/aorist form inside the verb
  // entry instead of giving that form a separate headword, for example:
  // gacchati 【过】gacchi; pavisati 【过】pavisi; cinteti [aor] cintesi.
  // Keep these forms separate from productive suffix guesses. They are
  // accepted only when a dictionary record explicitly labels them as past.
  const PAST_FORM_INDEX_CACHE = new WeakMap();

  function explicitPastForms(entry) {
    const forms = [];
    const add = value => {
      const form = cleanWord(value);
      if (form && form.length > 2 && PALI_FORM.test(form) && !forms.includes(form)) forms.push(form);
    };
    const take = value => String(value || '').split(/[\s,，、/]+/).slice(0, 4).forEach(add);
    for (const record of entryRecords(entry)) {
      const text = String(record?.definition || '').replace(/<[^>]*>/g, ' ');
      // Some PCED records place the label after the forms:
      // "kari, akāsi,【过】". Limit the backwards match to Pāli tokens so
      // translated prose before the citation cannot become a candidate.
      const beforeMarker = /([a-zāīūṅñṭḍṇḷṃ-]+(?:\s*[,，、/]\s*[a-zāīūṅñṭḍṇḷṃ-]+){0,5})\s*[,，]?\s*【(?:过|過|过去|過去)】/gi;
      let beforeMatch;
      while ((beforeMatch = beforeMarker.exec(text))) take(beforeMatch[1]);
      for (const pattern of [
        /【(?:过|過|过去|過去)】\s*([^。；;【】\n]+)/gi,
        /\[(?:aor(?:ist)?|past)\]\s*([^.;\[\]\n]+)/gi
      ]) {
        pattern.lastIndex = 0;
        let match;
        while ((match = pattern.exec(text))) take(match[1]);
      }
    }
    return forms;
  }

  function explicitPastIndex(dictionary) {
    if (!dictionary || typeof dictionary !== 'object') return new Map();
    if (PAST_FORM_INDEX_CACHE.has(dictionary)) return PAST_FORM_INDEX_CACHE.get(dictionary);
    const index = new Map();
    for (const [head, entry] of Object.entries(dictionary)) {
      for (const form of explicitPastForms(entry)) {
        if (!index.has(form)) index.set(form, []);
        if (!index.get(form).includes(head)) index.get(form).push(head);
      }
    }
    PAST_FORM_INDEX_CACHE.set(dictionary, index);
    return index;
  }

  function exactVerbAnalysis(surface, exactHeads, context, options = {}) {
    const word = cleanWord(surface);
    const maintained = options.grammarAnalyses?.[word] ||
      global.PCEDStandardData?.grammarAnalyses?.[word] ||
      BUILTIN_GRAMMAR_ANALYSES[word];
    if (maintained) {
      const lemmaHeads = context.exact(maintained.lemma);
      if (!lemmaHeads.length) return null;
      return { surface: word, ...maintained, lemmaHead: lemmaHeads[0], verified: true };
    }

    // Do not guess from -anti alone: nouns such as santi could otherwise be
    // misidentified. Require an exact PCED surface entry explicitly marked as
    // a verb, plus an independently attested singular dictionary form.
    const records = exactHeads.flatMap(head => entryRecords(context.dictionary[head]));
    const grammarText = records.map(record => String(record?.definition || '')).join(' ');
    if (!/(?:\(\s*(?:kamma\s*[,，]\s*)?kri\s*\)|（\s*(?:kamma\s*[,，]\s*)?kri\s*）|ကြိ)/i.test(grammarText)) {
      return null;
    }

    const endings = [
      ['enti', 'eti'], ['onti', 'oti'], ['anti', 'ati'], ['anti', 'āti']
    ];
    for (const [ending, lemmaEnding] of endings) {
      if (!word.endsWith(ending) || word.length <= ending.length + 2) continue;
      const lemma = word.slice(0, -ending.length) + lemmaEnding;
      const lemmaHeads = context.exact(lemma);
      if (!lemmaHeads.length) continue;
      const passive = /(?:kamma|ကမ္မ)/i.test(grammarText);
      const tense = word.endsWith('issanti') ? 'future' : 'present';
      return {
        surface: word,
        lemma,
        lemmaHead: lemmaHeads[0],
        label: `Third-person plural, ${tense} ${passive ? 'passive' : 'verb'}`,
        verified: false
      };
    }
    return null;
  }

  function verifiedInflectionCandidates(surface, options) {
    const key = cleanWord(surface);
    const maintainedMap = options.inflections || global.PCEDStandardData?.inflections;
    const values = [...(maintainedMap?.[key] || []), ...(BUILTIN_INFLECTIONS[key] || [])];
    const candidates = values.map(item => typeof item === 'string'
      ? { form: cleanWord(item), label: 'verified inflection', family: 'verified' }
      : {
          form: cleanWord(item?.form), label: item?.label || 'verified inflection',
          family: item?.family || 'verified', preferLemma: !!item?.preferLemma
        })
      .filter(item => item.form);
    return candidates.filter((item, index) =>
      candidates.findIndex(candidate => candidate.form === item.form) === index
    );
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
    const attestedPastHeads = explicitPastIndex(context.dictionary).get(normalized) || [];
    if (exactHeads.length) {
      const preferred = verifiedInflectionCandidates(normalized, options)
        .find(candidate => candidate.preferLemma && context.exact(candidate.form).length);
      if (preferred) {
        return finish({
          ...base, mode: 'inflected', tier: 1, heads: context.exact(preferred.form),
          resolvedForm: preferred.form, rule: preferred.label, family: preferred.family,
          notes: [`${clicked} → ${preferred.form} (${preferred.label})`]
        });
      }
      if (attestedPastHeads.length) {
        return finish({
          ...base, mode: 'inflected', tier: 1, heads: attestedPastHeads,
          resolvedForm: cleanWord(attestedPastHeads[0]),
          rule: 'dictionary-attested past / aorist form',
          family: 'Kaccāyana past verb',
          notes: [`${clicked} → ${attestedPastHeads.join(', ')} (dictionary-attested past / aorist form)`]
        });
      }
      const grammar = exactVerbAnalysis(normalized, exactHeads, context, options);
      // A finite inflected verb may itself have a PCED record. Once its
      // verbal status and singular lemma are verified, show the lemma entry
      // instead of treating the surface record as an exact lexical headword.
      // This also prevents compound/root decomposition from being applied to
      // the inflected surface form.
      if (grammar?.lemmaHead) {
        return finish({
          ...base, mode: 'exact', tier: 1, heads: [grammar.lemmaHead], grammar
        });
      }
      return finish(addEntryDecomposition({
        ...base, mode: 'exact', tier: 1, heads: exactHeads,
        grammar: null
      }));
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
        const result = {
          ...base, mode: 'inflected', tier: 3, heads,
          resolvedForm: candidate.form, rule: candidate.label, family: candidate.family,
          notes: [`${clicked} → ${candidate.form} (${candidate.label})`]
        };
        return finish(/verb/i.test(candidate.family || '') ? result : addEntryDecomposition(result));
      }
    }

    if (attestedPastHeads.length) {
      return finish({
        ...base, mode: 'inflected', tier: 3, heads: attestedPastHeads,
        resolvedForm: cleanWord(attestedPastHeads[0]),
        rule: 'dictionary-attested past / aorist form',
        family: 'Kaccāyana past verb',
        notes: [`${clicked} → ${attestedPastHeads.join(', ')} (dictionary-attested past / aorist form)`]
      });
    }

    const candidates = inflectionCandidates(normalized);
    base.attemptedForms = [...new Set([...verifiedCandidates, ...candidates].map(candidate => candidate.form))];
    for (const candidate of candidates) {
      const heads = context.exact(candidate.form);
      if (heads.length) {
        const result = {
          ...base, mode: 'inflected', tier: 3, heads,
          resolvedForm: candidate.form, rule: candidate.label, family: candidate.family,
          notes: [`${clicked} → ${candidate.form} (${candidate.label})`]
        };
        return finish(/verb/i.test(candidate.family || '') ? result : addEntryDecomposition(result));
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

  const APPROVED_TERM_STATUSES = new Set(['规范', '核实', '已核实', '确认', '已确认']);
  const APPROVED_TERM_INDEX_CACHE = new WeakMap();
  const PUBLISHED_TERM_INDEX_CACHE = new WeakMap();

  function approvedTermAlternatives(pali) {
    return String(pali || '').split(/\s*[,;/；，]\s*/)
      .map(value => cleanWord(value))
      // A single-word click must not inherit the translation of a phrase
      // merely because that phrase happens to contain the same word.
      .filter(value => value && !/\s/.test(value));
  }

  function approvedTermIndex(records, includeAllStatuses = false) {
    const cache = includeAllStatuses ? PUBLISHED_TERM_INDEX_CACHE : APPROVED_TERM_INDEX_CACHE;
    if (cache.has(records)) return cache.get(records);
    const index = new Map();
    for (const record of records) {
      if (!includeAllStatuses && !APPROVED_TERM_STATUSES.has(String(record?.status || '').trim())) continue;
      if (!String(record?.chinese || '').trim()) continue;
      for (const form of approvedTermAlternatives(record?.pali)) {
        if (!index.has(form)) index.set(form, []);
        index.get(form).push(record);
      }
    }
    cache.set(records, index);
    return index;
  }

  function approvedTermMatches(surface, resolution = {}, options = {}) {
    const records = options.approvedTerms || global.PCEDApprovedTerms?.records || [];
    if (!Array.isArray(records) || !records.length) return [];
    const index = approvedTermIndex(records, !!options.includeAllStatuses);
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

    // The ordinary dictionary may contain an exact inflected entry (for
    // example gotamo). That exact PCED hit must not prevent the approved-term
    // lookup from also testing the corresponding whole-word citation form
    // (Gotama). Every proposed form is still accepted only as an exact key in
    // the approved-term index; no prefix, substring or fuzzy match is used.
    const inflectedForms = [];
    const addInflected = value => {
      value = cleanWord(value);
      if (value && value !== exact && !inflectedForms.includes(value)) inflectedForms.push(value);
    };

    if (['alias', 'inflected'].includes(resolution.mode)) {
      addInflected(resolution.resolvedForm);
      for (const head of resolution.primaryHeads || resolution.heads || []) addInflected(head);
    }
    for (const candidate of verifiedInflectionCandidates(exact, options)) addInflected(candidate.form);
    for (const candidate of inflectionCandidates(exact)) addInflected(candidate.form);

    return collect(inflectedForms, 'inflected');
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

  function uniqueForms(forms) {
    return [...new Set(forms.map(cleanWord).filter(Boolean))];
  }

  function inflectionGrammarText(entry) {
    return entryRecords(entry).map(record =>
      String(record?.definition || '').replace(/<[^>]*>/g, ' ')
    ).join('\u241e');
  }

  function verifiedFormsForLemma(lemma, options = {}) {
    lemma = cleanWord(lemma);
    const forms = [];
    const maps = [options.inflections, global.PCEDStandardData?.inflections, BUILTIN_INFLECTIONS];
    for (const map of maps) {
      for (const [surface, rawValues] of Object.entries(map || {})) {
        const values = Array.isArray(rawValues) ? rawValues : [rawValues];
        if (values.some(value => cleanWord(typeof value === 'string' ? value : value?.form) === lemma)) {
          forms.push(cleanWord(surface));
        }
      }
    }
    return uniqueForms(forms).filter(form => form !== lemma);
  }

  function paliLookupNounParadigm(lemma) {
    const data = global.PaliLookupMorphology;
    const records = data?.entries?.[lemma];
    if (!Array.isArray(records)) return null;
    const caseOrder = ['nom', 'voc', 'acc', 'ins', 'dat', 'abl', 'gen', 'loc'];
    const caseLabels = {
      nom: 'Nominative', voc: 'Vocative', acc: 'Accusative', ins: 'Instrumental',
      dat: 'Dative', abl: 'Ablative', gen: 'Genitive', loc: 'Locative'
    };
    const groups = [];
    const makeRows = items => caseOrder.map(caseCode => {
      const selected = items.filter(item => item.c === caseCode);
      if (!selected.length) return null;
      const forms = number => uniqueForms(selected.filter(item => item.n === number)
        .sort((a, b) => a.q - b.q).map(item => item.f));
      return { label: caseLabels[caseCode], singular: forms('s'), plural: forms('pl') };
    }).filter(Boolean);
    for (const record of records.filter(item => item?.g === 'N')) {
      if (!record.r || !record.s) continue;
      for (const groupCode of data.infoGroups?.[record.i] || []) {
        const endings = data.nounGroups?.[groupCode] || [];
        const rows = caseOrder.map(caseCode => {
          const selected = endings.filter(item => item.c === caseCode);
          if (!selected.length) return null;
          const forms = number => uniqueForms(selected.filter(item => item.n === number)
            .sort((a, b) => a.q - b.q).map(item => record.s + item.e));
          return { label: caseLabels[caseCode], singular: forms('s'), plural: forms('pl') };
        }).filter(Boolean);
        const nominative = rows.find(row => row.label === 'Nominative') || rows[0];
        const nominativeForms = [...(nominative?.singular || []), ...(nominative?.plural || [])];
        const gender = /^f\./i.test(record.i) ? 'Feminine'
          : /^nt\./i.test(record.i) ? 'Neuter'
            : /^m\./i.test(record.i) ? 'Masculine'
              : nominativeForms.some(form => /(?:atī|atiyo|antiyo|āyo)$/u.test(form)) ? 'Feminine'
                : nominativeForms.some(form => /(?:aṃ|antāni|āni)$/u.test(form)) ? 'Neuter'
                  : nominativeForms.length ? 'Masculine' : '';
        const description = data.descriptions?.[record.i] || record.i;
        if (rows.length) groups.push({
          label: gender && !/^(?:Masculine|Feminine|Neuter|Masc\.?|Fem\.?|Neut\.?)\b/i.test(description)
            ? gender + ' ' + description.charAt(0).toLowerCase() + description.slice(1) : description,
          morphologyCode: record.i,
          morphologyGroupCode: groupCode,
          lemma,
          source: data.source,
          rows
        });
      }
    }
    const irregular = data.irregularNouns?.[lemma] || [];
    const definitions = [...new Set(irregular.map(item => item.d))];
    for (const definition of definitions) {
      const selected = irregular.filter(item => item.d === definition);
      const gender = selected[0]?.g;
      const label = gender === 'm' ? 'Masculine noun, irregular declension'
        : gender === 'f' ? 'Feminine noun, irregular declension'
          : gender === 'nt' ? 'Neuter noun, irregular declension' : 'Irregular noun';
      const rows = makeRows(selected);
      if (rows.length) groups.push({ label, morphologyCode: 'irregular', lemma, source: data.source, rows });
    }
    return groups;
  }

  function nounParadigm(lemma, grammarText) {
    // Gender labels are read only near the beginning of each dictionary
    // record. Later compound descriptions often mention words of another
    // gender (for example bhikkhuṇī inside the bhikkhu entry).
    const genderText = grammarText.split('\u241e').map(text => text.slice(0, 180)).join(' ');
    const masculine = /(?:\[\s*m\.?\s*\]|(?:^|[\s：,，;；])m\.|【阳】)/i.test(genderText);
    const feminine = /(?:\[\s*f\.?\s*\]|(?:^|[\s：,，;；])f\.|【阴】)/i.test(genderText);
    const neuter = /(?:\[\s*n(?:t)?\.?\s*\]|(?:^|[\s：,，;；])n(?:t)?\.|【中】)/i.test(genderText);
    const paradigms = [];
    const row = (label, singular, plural) => ({ label, singular: uniqueForms(singular), plural: uniqueForms(plural) });

    if (lemma.endsWith('a') && (masculine || (!feminine && !neuter))) {
      const stem = lemma.slice(0, -1);
      paradigms.push({ label: 'Masculine -a', rows: [
        row('Nominative', [stem + 'o'], [stem + 'ā']),
        row('Accusative', [stem + 'aṃ'], [stem + 'e']),
        row('Instrumental', [stem + 'ena'], [stem + 'ehi', stem + 'ebhi']),
        row('Dative / Genitive', [stem + 'assa'], [stem + 'ānaṃ']),
        row('Ablative', [stem + 'ā', stem + 'asmā', stem + 'amhā'], [stem + 'ehi', stem + 'ebhi']),
        row('Locative', [stem + 'e', stem + 'asmiṃ', stem + 'amhi'], [stem + 'esu']),
        row('Vocative', [lemma], [stem + 'ā'])
      ] });
    }
    if (lemma.endsWith('a') && neuter) {
      const stem = lemma.slice(0, -1);
      paradigms.push({ label: 'Neuter -a', rows: [
        row('Nominative / Accusative', [stem + 'aṃ'], [stem + 'āni']),
        row('Instrumental', [stem + 'ena'], [stem + 'ehi', stem + 'ebhi']),
        row('Dative / Genitive', [stem + 'assa'], [stem + 'ānaṃ']),
        row('Ablative', [stem + 'ā', stem + 'asmā', stem + 'amhā'], [stem + 'ehi', stem + 'ebhi']),
        row('Locative', [stem + 'e', stem + 'asmiṃ', stem + 'amhi'], [stem + 'esu']),
        row('Vocative', [lemma], [stem + 'āni'])
      ] });
    }
    if (lemma.endsWith('ā') && (feminine || (!masculine && !neuter))) {
      const stem = lemma.slice(0, -1);
      paradigms.push({ label: 'Feminine -ā', rows: [
        row('Nominative', [lemma], [stem + 'āyo']),
        row('Accusative', [stem + 'aṃ'], [stem + 'āyo']),
        row('Instrumental / Ablative', [stem + 'āya'], [stem + 'āhi', stem + 'ābhi']),
        row('Dative / Genitive', [stem + 'āya'], [stem + 'ānaṃ']),
        row('Locative', [stem + 'āyaṃ', stem + 'āya'], [stem + 'āsu']),
        row('Vocative', [stem + 'e'], [stem + 'āyo'])
      ] });
    }
    if (lemma.endsWith('i') && (masculine || feminine)) {
      const stem = lemma.slice(0, -1);
      paradigms.push({ label: (masculine ? 'Masculine' : 'Feminine') + ' -i', rows: !masculine && feminine ? [
        row('Nominative', [lemma], [stem + 'iyo']),
        row('Accusative', [stem + 'iṃ'], [stem + 'iyo']),
        row('Instrumental / Ablative', [stem + 'iyā'], [stem + 'īhi', stem + 'ībhi']),
        row('Dative / Genitive', [stem + 'iyā'], [stem + 'īnaṃ']),
        row('Locative', [stem + 'iyaṃ', stem + 'iyā'], [stem + 'īsu']),
        row('Vocative', [lemma], [stem + 'iyo'])
      ] : [
        row('Nominative', [lemma], [stem + 'ayo', stem + 'ī']),
        row('Accusative', [stem + 'iṃ'], [stem + 'ayo', stem + 'ī']),
        row('Instrumental', [stem + 'inā'], [stem + 'īhi', stem + 'ībhi']),
        row('Dative / Genitive', [stem + 'issa', stem + 'ino'], [stem + 'īnaṃ']),
        row('Ablative', [stem + 'ismā', stem + 'imhā'], [stem + 'īhi', stem + 'ībhi']),
        row('Locative', [stem + 'ismiṃ', stem + 'imhi'], [stem + 'īsu']),
        row('Vocative', [lemma], [stem + 'ayo', stem + 'ī'])
      ] });
    }
    if (lemma.endsWith('ī') && feminine) {
      const stem = lemma.slice(0, -1);
      paradigms.push({ label: 'Feminine -ī', rows: [
        row('Nominative', [lemma], [stem + 'iyo']),
        row('Accusative', [stem + 'iṃ'], [stem + 'iyo']),
        row('Instrumental / Ablative', [stem + 'iyā'], [stem + 'īhi', stem + 'ībhi']),
        row('Dative / Genitive', [stem + 'iyā'], [stem + 'īnaṃ']),
        row('Locative', [stem + 'iyaṃ', stem + 'iyā'], [stem + 'īsu']),
        row('Vocative', [stem + 'i'], [stem + 'iyo'])
      ] });
    }
    if (lemma.endsWith('u') && masculine) {
      const stem = lemma.slice(0, -1);
      paradigms.push({ label: 'Masculine -u', rows: [
        row('Nominative', [lemma], [stem + 'avo', stem + 'ū']),
        row('Accusative', [stem + 'uṃ'], [stem + 'avo', stem + 'ū']),
        row('Instrumental', [stem + 'unā'], [stem + 'ūhi', stem + 'ūbhi']),
        row('Dative / Genitive', [stem + 'uno', stem + 'ussa'], [stem + 'ūnaṃ']),
        row('Ablative', [stem + 'usmā', stem + 'umhā'], [stem + 'ūhi', stem + 'ūbhi']),
        row('Locative', [stem + 'usmiṃ', stem + 'umhi'], [stem + 'ūsu']),
        row('Vocative', [lemma], [stem + 'avo', stem + 'ū'])
      ] });
    }
    return paradigms;
  }

  function verbParadigm(lemma, grammarText) {
    const maintained = KACCAYANA_VERB_PARADIGMS[lemma];
    if (maintained) return maintained.map(group => ({ label: group.label, forms: uniqueForms(group.forms) }));
    const ending = ['āti', 'ati', 'eti', 'oti'].find(value => lemma.endsWith(value));
    if (!ending || !/(?:\bkri\b|ကြိ|【(?:过|現|现|命|独)|\b(?:pr|imper|opt|fut|aor|ger|inf)\s*[．.]|\b(?:goes|does|makes|becomes)\b)/i.test(grammarText)) return [];
    const stem = lemma.slice(0, -ending.length);
    const endings = ending === 'eti'
      ? ['eti', 'enti', 'esi', 'etha', 'emi', 'ema']
      : ending === 'oti'
        ? ['oti', 'onti', 'osi', 'otha', 'omi', 'oma']
        : [ending, 'anti', 'asi', 'atha', 'āmi', 'āma'];
    const futureMarker = ending === 'eti' ? 'ess' : 'iss';
    const imperativeEndings = ending === 'eti'
      ? ['etu', 'entu', 'ehi', 'etha']
      : ending === 'oti'
        ? ['otu', 'ontu', 'ohi', 'otha']
        : ending === 'āti'
          ? ['ātu', 'antu', 'āhi', 'ātha']
          : ['atu', 'antu', 'āhi', 'atha'];
    const group = (label, forms) => ({ label, forms: uniqueForms(forms) });
    return [
      group('Present: 3sg, 3pl, 2sg, 2pl, 1sg, 1pl', endings.map(value => stem + value)),
      group('Imperative', imperativeEndings.map(value => stem + value)),
      group('Optative', ['eyya', 'eyyuṃ', 'eyyāsi', 'eyyātha', 'eyyāmi', 'eyyāma'].map(value => stem + value)),
      group('Future', ['ati', 'anti', 'asi', 'atha', 'āmi', 'āma'].map(value => stem + futureMarker + value)),
      group('Present participle', [stem + 'anta', stem + 'amāna']),
      group('Absolutive / infinitive', ending === 'eti'
        ? [stem + 'etvā', stem + 'etuṃ']
        : ending === 'oti' ? [stem + 'otvā', stem + 'otuṃ'] : [stem + 'itvā', stem + 'ituṃ'])
    ];
  }

  function inflectionParadigm(head, entry, options = {}) {
    const lemma = cleanWord(head);
    if (!lemma || !entry) return null;
    const grammarText = inflectionGrammarText(entry);
    const kaccayana = global.KaccayanaDeclension?.paradigm?.(lemma, global.PaliLookupMorphology);
    const reliableNounGroups = paliLookupNounParadigm(lemma);
    // Once the Pali Lookup morphology dataset is present, never guess a
    // noun's gender from its final letter.  Unknown nouns get no generated
    // noun table until their grammatical class is confirmed.
    const nounGroups = kaccayana?.groups || reliableNounGroups ||
      (global.PaliLookupMorphology ? [] : nounParadigm(lemma, grammarText));
    const verbGroups = verbParadigm(lemma, grammarText);
    const attestedPast = explicitPastForms(entry);
    if (verbGroups.length && attestedPast.length) {
      // A form can legitimately be syncretic (for example cintesi is both
      // present 2sg and an attested aorist 3sg). Only deduplicate against an
      // existing past group, not against the whole conjugation table.
      const existingPast = new Set(verbGroups
        .filter(group => /past|aorist|ajjatanī|hiyyattanī/i.test(group.label))
        .flatMap(group => group.forms || []));
      const additional = attestedPast.filter(form => !existingPast.has(form));
      if (additional.length) {
        const futureIndex = verbGroups.findIndex(group => /^Future/.test(group.label));
        const pastGroup = { label: 'Ajjatanī / Aorist (dictionary-attested)', forms: additional };
        if (futureIndex >= 0) verbGroups.splice(futureIndex, 0, pastGroup);
        else verbGroups.push(pastGroup);
      }
    }
    const verified = verifiedFormsForLemma(lemma, options);
    if (!nounGroups.length && !verbGroups.length && !verified.length) return null;
    return {
      lemma,
      kind: verbGroups.length ? 'verb' : nounGroups.length ? 'noun' : 'verified',
      verified,
      groups: verbGroups.length ? verbGroups : nounGroups,
      generated: !!(verbGroups.length || nounGroups.length),
      formSystem: verbGroups.length ? 'kaccayana' : kaccayana?.groups?.length ? 'kaccayana' : reliableNounGroups?.length ? 'pali-lookup' : 'generated',
      formSource: verbGroups.length
        ? 'Bhante U Janakābhivaṃsa’s verb table; Kaccāyana Pāli Vyākaraṇaṁ, Ākhyāta Kappa'
        : kaccayana?.formSource || (reliableNounGroups?.length ? 'Pali Lookup version 2.0' : ''),
      classificationSource: kaccayana?.classificationSource || '',
      morphologySource: reliableNounGroups?.length ? global.PaliLookupMorphology?.source : ''
    };
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
    inflectionParadigm,
    verifiedDecompositions: BUILTIN_DECOMPOSITIONS
  });
})(window);
