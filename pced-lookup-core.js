/*
 * PAMC shared PCED-only lookup core
 * Version 1.0.0 — 2026-09-01
 *
 * Matching never changes the displayed source text or the spelling stored in
 * PCED. A generated inflection candidate must still be validated against a
 * complete PCED headword by the host book. No prefix/substring guessing.
 */
(function (global) {
  'use strict';

  const VERSION = '1.0.0';
  const EDGE_NON_PALI = /^[^a-zāīūṅñṭḍṇḷṃ]+|[^a-zāīūṅñṭḍṇḷṃ]+$/g;

  function normalizeForMatch(value) {
    return String(value ?? '')
      .normalize('NFC')
      .toLocaleLowerCase()
      // User-approved equivalent keyboard/input forms.
      .replace(/[ṁŋ]/g, 'ṃ')
      .replace(/~n/g, 'ñ')
      .replace(/t\./g, 'ṭ')
      .replace(/d\./g, 'ḍ')
      .replace(/n\./g, 'ṇ')
      .replace(/l\./g, 'ḷ')
      .replace(/ng/g, 'ṅ')
      .replace(/aa/g, 'ā')
      .replace(/ii/g, 'ī')
      .replace(/uu/g, 'ū')
      .replace(/[‘’‛ʼ`´]/g, "'")
      .trim();
  }

  function cleanWord(value) {
    return normalizeForMatch(value).replace(EDGE_NON_PALI, '');
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

    // a-stem nouns/adjectives: guṇo/guṇaṃ/gahakūṭaṃ → guṇa/gahakūṭa.
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

    // ā-stem feminine forms.
    if (word.endsWith('āya') && word.length > 5) {
      add(word.slice(0, -3) + 'ā', '-āya → -ā', 'ā-stem');
      add(word.slice(0, -3) + 'a', '-āya → -a', 'a-stem');
    }
    if (word.endsWith('āyaṃ') && word.length > 6) add(word.slice(0, -4) + 'ā', '-āyaṃ → -ā', 'ā-stem');
    if (word.endsWith('āsu') && word.length > 5) add(word.slice(0, -3) + 'ā', '-āsu → -ā', 'ā-stem');
    if (word.endsWith('ānaṃ') && word.length > 6) add(word.slice(0, -4) + 'ā', '-ānaṃ → -ā', 'ā-stem');

    // i/ī-stem forms.
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

    // u-stem nouns/adjectives, including nominative/vocative plural.
    // bhikkhū/bhikkhavo/bhikkhuṃ/bhikkhunā/... → bhikkhu.
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

    // Common ablative/genitive-looking forms used frequently in chants.
    if (word.endsWith('ato') && word.length > 4) add(word.slice(0, -3) + 'a', '-ato → -a', 'a-stem');
    if (word.endsWith('ito') && word.length > 4) add(word.slice(0, -3) + 'i', '-ito → -i', 'i-stem');

    // Conservative, previously approved finite-verb patterns.
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

  global.PCEDLookupCore = Object.freeze({
    version: VERSION,
    normalizeForMatch,
    cleanWord,
    inflectionCandidates
  });
})(window);
