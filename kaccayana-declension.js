/* PAMC Kaccayana-based nominal declension generator v1.0.0 — 2026-09-20
 *
 * Classification input: Pali Lookup 2.0 morphology (lemma, gender, stem class).
 * Forms: Bhante U Janakabhivamsa, "13 Groups - List of Declension" (July 2019),
 * checked against Kaccayana Pali Vyakarana, Volume 2, New MLBD Edition (2021).
 *
 * This module deliberately returns null for a class that has not been safely
 * encoded. The caller may then show a clearly attributed Pali Lookup fallback.
 */
(function (global) {
  'use strict';

  const VERSION = '1.0.0';
  const SOURCE = "Bhante U Janakābhivaṃsa’s Kaccāyana-based 13 Groups of Declension";
  const GROUPS = Object.freeze({
    1: 'Purisādigaṇa', 2: 'Cittādigaṇa', 3: 'Kaññādigaṇa', 4: 'Pumādigaṇa',
    5: 'Rājādigaṇa', 6: 'Manogaṇādi', 7: 'Nadādigaṇa', 8: 'Gahapatādigaṇa',
    9: 'Sabbanāmagaṇa', 10: 'Satthādigaṇa', 11: 'Rattādigaṇa',
    12: 'Guṇavādigaṇa', 13: 'Gacchantādigaṇa'
  });
  const CASES = ['Nominative', 'Vocative', 'Accusative', 'Instrumental', 'Dative', 'Ablative', 'Genitive', 'Locative'];
  const unique = values => [...new Set((values || []).filter(Boolean))];
  const row = (label, singular, plural) => ({ label, singular: unique(singular), plural: unique(plural) });
  const group = (number, label, rows, gender, note) => ({
    teacherGroupNumber: number, teacherGroupName: GROUPS[number], label, gender,
    source: SOURCE, formSystem: 'kaccayana', rows, ...(note ? { note } : {})
  });
  const standardTailA = stem => [
    row('Instrumental', [stem + 'ena'], [stem + 'ehi', stem + 'ebhi']),
    row('Dative', [stem + 'assa'], [stem + 'ānaṃ']),
    row('Ablative', [stem + 'asmā', stem + 'amhā', stem + 'ā'], [stem + 'ehi', stem + 'ebhi']),
    row('Genitive', [stem + 'assa'], [stem + 'ānaṃ']),
    row('Locative', [stem + 'asmiṃ', stem + 'amhi', stem + 'e'], [stem + 'esu'])
  ];

  function group1(lemma, stem) {
    return group(1, 'Masculine noun, "a" declension', [
      row('Nominative', [stem + 'o'], [stem + 'ā']),
      row('Vocative', [lemma, stem + 'ā'], [stem + 'ā']),
      row('Accusative', [stem + 'aṃ'], [stem + 'e']), ...standardTailA(stem)
    ], 'm');
  }
  function group2(lemma, stem) {
    return group(2, 'Neuter noun, "a" declension', [
      row('Nominative', [stem + 'aṃ'], [stem + 'ā', stem + 'āni']),
      row('Vocative', [lemma, stem + 'ā'], [stem + 'ā', stem + 'āni']),
      row('Accusative', [stem + 'aṃ'], [stem + 'e', stem + 'āni']), ...standardTailA(stem)
    ], 'nt');
  }
  function group3(lemma, stem) {
    return group(3, 'Feminine noun, "ā" declension', [
      row('Nominative', [lemma], [lemma, stem + 'āyo']),
      row('Vocative', [stem + 'e'], [lemma, stem + 'āyo']),
      row('Accusative', [stem + 'aṃ'], [lemma, stem + 'āyo']),
      row('Instrumental', [stem + 'āya'], [stem + 'āhi', stem + 'ābhi']),
      row('Dative', [stem + 'āya'], [stem + 'ānaṃ']),
      row('Ablative', [stem + 'āya'], [stem + 'āhi', stem + 'ābhi']),
      row('Genitive', [stem + 'āya'], [stem + 'ānaṃ']),
      row('Locative', [stem + 'āya', stem + 'āyaṃ'], [stem + 'āsu'])
    ], 'f');
  }
  function explicit(number, label, gender, values, note) {
    return group(number, label, CASES.map((name, index) => row(name, values[index][0], values[index][1])), gender, note);
  }
  function specialGroup4(lemma) {
    if (lemma === 'puma') return explicit(4, 'Masculine noun, special "a" declension', 'm', [
      [['puma', 'pumo'], ['pumāno', 'pumā']], [['pumaṃ', 'puma', 'pumā'], ['pumāno', 'pumā']],
      [['pumānaṃ', 'pumaṃ'], ['pumāno', 'pume']], [['pumunā', 'pumānā', 'pumena'], ['pumānehi', 'pumānebhi', 'pumehi', 'pumebhi']],
      [['pumuno', 'pumassa'], ['pumānaṃ']], [['pumunā', 'pumasmā', 'pumamhā', 'pumā'], ['pumānehi', 'pumānebhi', 'pumehi', 'pumebhi']],
      [['pumuno', 'pumassa'], ['pumānaṃ']], [['pumāne', 'pumasmiṃ', 'pumamhi', 'pume'], ['pumānesu', 'pumesu', 'pumāsu']]
    ]);
    if (lemma === 'yuva') return explicit(4, 'Masculine noun, special "a" declension', 'm', [
      [['yuvāno', 'yuvā'], ['yuvānā', 'yuvā']], [['yuvāna', 'yuvānā', 'yuva', 'yuvā'], ['yuvānā', 'yuvā']],
      [['yuvānaṃ', 'yuvaṃ'], ['yuvāna', 'yuve']], [['yuvānena', 'yuvena', 'yuvānā'], ['yuvānehi', 'yuvānebhi', 'yuvehi', 'yuvebhi']],
      [['yuvānassa', 'yuvassa', 'yuvino'], ['yuvānānaṃ', 'yuvānaṃ']], [['yuvānasmā', 'yuvānamhā', 'yuvānā', 'yuvasmā', 'yuvamhā', 'yuvā'], ['yuvānehi', 'yuvānebhi', 'yuvehi', 'yuvebhi']],
      [['yuvānassa', 'yuvassa', 'yuvino'], ['yuvānānaṃ', 'yuvānaṃ']], [['yuvānasmiṃ', 'yuvānamhi', 'yuvāne', 'yuvasmiṃ', 'yuvamhi', 'yuve'], ['yuvānesu', 'yuvesu', 'yuvāsu']]
    ]);
    if (lemma === 'addhāna' || lemma === 'addhā') return explicit(4, 'Masculine noun, special "a" declension', 'm', [
      [['addhā'], ['addhāno']], [['addha', 'addhā'], ['addhāno']], [['addhānaṃ'], ['addhāno']],
      [['addhunā'], ['addhānehi', 'addhānebhi']], [['addhuno'], ['addhānaṃ']], [['addhunā'], ['addhānehi', 'addhānebhi']],
      [['addhuno'], ['addhānaṃ']], [['addhani', 'addhāne'], ['addhāsu']]
    ]);
    return null;
  }
  function specialGroup5(lemma) {
    if (lemma !== 'rāja') return null;
    return explicit(5, 'Masculine noun, special "a" declension', 'm', [
      [['rājā'], ['rājāno']], [['rāja', 'rājā'], ['rājāno']], [['rājānaṃ', 'rājaṃ'], ['rājāno']],
      [['raññā', 'rājinā', 'rājena'], ['rājūhi', 'rājūbhi', 'rājehi', 'rājebhi']],
      [['rañño', 'rājino'], ['raññaṃ', 'rājūnaṃ', 'rājānaṃ']], [['raññā'], ['rājūhi', 'rājūbhi', 'rājehi', 'rājebhi']],
      [['rañño', 'rājino'], ['raññaṃ', 'rājūnaṃ', 'rājānaṃ']], [['raññe', 'rājini'], ['rājesu', 'rājūsu']]
    ], 'The teacher lists brahma, atta, sakha and ātuma as similar; they remain on fallback until separately verified.');
  }
  function group7(lemma, stem) {
    const base = lemma.slice(0, -1);
    const nad = lemma === 'nadī';
    return group(7, 'Feminine noun, "ī" declension', [
      row('Nominative', [lemma], [lemma, base + 'iyo', ...(nad ? ['najjo'] : [])]),
      row('Vocative', [base + 'i'], [lemma, base + 'iyo', ...(nad ? ['najjo'] : [])]),
      row('Accusative', [base + 'iṃ', base + 'iyaṃ'], [lemma, base + 'iyo', ...(nad ? ['najjo'] : [])]),
      row('Instrumental', [base + 'iyā', ...(nad ? ['najjā'] : [])], [lemma + 'hi', lemma + 'bhi']),
      row('Dative', [base + 'iyā', ...(nad ? ['najjā'] : [])], [lemma + 'naṃ']),
      row('Ablative', [base + 'iyā', ...(nad ? ['najjā'] : [])], [lemma + 'hi', lemma + 'bhi']),
      row('Genitive', [base + 'iyā', ...(nad ? ['najjā'] : [])], [lemma + 'naṃ']),
      row('Locative', [base + 'iyā', base + 'iyaṃ', ...(nad ? ['najjaṃ'] : [])], [lemma + 'su'])
    ], 'f');
  }
  function group10(lemma, record) {
    const s = record.s;
    if (record.i === 'm.r') return group(10, 'Masculine agent noun, "u/ar" declension', [
      row('Nominative', [s + 'ā'], [s + 'āro']), row('Vocative', [s + 'a', s + 'ā'], [s + 'āro']),
      row('Accusative', [s + 'āraṃ'], [s + 'āro']), row('Instrumental', [s + 'ārā', s + 'unā'], [s + 'ārehi', s + 'ārebhi', s + 'ūhi', s + 'ūbhi']),
      row('Dative', [s + 'u', s + 'uno', s + 'ussa'], [s + 'ārānaṃ', s + 'ānaṃ', s + 'ūnaṃ']),
      row('Ablative', [s + 'ārā'], [s + 'ārehi', s + 'ārebhi', s + 'ūhi', s + 'ūbhi']),
      row('Genitive', [s + 'u', s + 'uno', s + 'ussa'], [s + 'ārānaṃ', s + 'ānaṃ', s + 'ūnaṃ']),
      row('Locative', [s + 'ari'], [s + 'āresu', s + 'ūsu'])
    ], 'm');
    if (record.i === 'f.p' && lemma === 'mātu') return explicit(10, 'Feminine kinship noun, "u/ar" declension', 'f', [
      [['mātā'], ['mātaro']], [['māta', 'mātā'], ['mātaro']], [['mātaraṃ'], ['mātaro']],
      [['mātarā', 'mātuyā', 'matyā'], ['mātarehi', 'mātarebhi', 'mātūhi', 'mātūbhi']],
      [['mātu', 'mātussa', 'mātuyā', 'matyā'], ['mātarānaṃ', 'mātānaṃ', 'mātūnaṃ']],
      [['mātarā', 'mātuyā', 'matyā'], ['mātarehi', 'mātarebhi', 'mātūhi', 'mātūbhi']],
      [['mātu', 'mātussa', 'mātuyā', 'matyā'], ['mātarānaṃ', 'mātānaṃ', 'mātūnaṃ']],
      [['mātari', 'mātuyā', 'mātyā', 'mātuyaṃ', 'matyaṃ'], ['mātaresu', 'mātūsu']]
    ]);
    return null;
  }
  function group11(lemma, record) {
    const code = record.i, stem = record.s;
    if (code === 'm.i') return group(11, 'Masculine noun, "i" declension', [
      row('Nominative', [lemma, stem + 'ini'], [stem + 'ī', stem + 'ayo']), row('Vocative', [lemma], [stem + 'ī', stem + 'ayo']),
      row('Accusative', [stem + 'iṃ'], [stem + 'ī', stem + 'ayo']), row('Instrumental', [stem + 'inā'], [stem + 'īhi', stem + 'ībhi', stem + 'ihi', stem + 'ibhi']),
      row('Dative', [stem + 'issa', stem + 'ino'], [stem + 'īnaṃ', stem + 'inaṃ']), row('Ablative', [stem + 'ismā', stem + 'imhā', stem + 'inā'], [stem + 'īhi', stem + 'ībhi', stem + 'ihi', stem + 'ibhi']),
      row('Genitive', [stem + 'issa', stem + 'ino'], [stem + 'īnaṃ', stem + 'inaṃ']), row('Locative', [stem + 'ismiṃ', stem + 'imhi'], [stem + 'īsu', stem + 'isu'])
    ], 'm');
    if (code === 'f.i') return group(11, 'Feminine noun, "i" declension', [
      row('Nominative', [lemma], [stem + 'ī', stem + 'iyo', stem + 'yo']), row('Vocative', [lemma], [stem + 'ī', stem + 'iyo', stem + 'yo']),
      row('Accusative', [stem + 'iṃ'], [stem + 'ī', stem + 'iyo', stem + 'yo']), row('Instrumental', [stem + 'iyā', stem + 'yā'], [stem + 'īhi', stem + 'ībhi', stem + 'ihi', stem + 'ibhi']),
      row('Dative', [stem + 'iyā', stem + 'yā'], [stem + 'īnaṃ', stem + 'inaṃ']), row('Ablative', [stem + 'iyā', stem + 'yā'], [stem + 'īhi', stem + 'ībhi', stem + 'ihi', stem + 'ibhi']),
      row('Genitive', [stem + 'iyā', stem + 'yā'], [stem + 'īnaṃ', stem + 'inaṃ']), row('Locative', [stem + 'iyā', stem + 'yā', stem + 'īyaṃ', stem + 'yaṃ', stem + 'o'], [stem + 'īsu', stem + 'isu'])
    ], 'f');
    if (code === 'nt.i') {
      const masculine = group11(lemma, { ...record, i: 'm.i' });
      masculine.gender = 'nt'; masculine.label = 'Neuter noun, "i" declension';
      masculine.rows[0] = row('Nominative', [lemma], [stem + 'ī', stem + 'īni']);
      masculine.rows[1] = row('Vocative', [lemma], [stem + 'ī', stem + 'īni']);
      masculine.rows[2] = row('Accusative', [stem + 'iṃ'], [stem + 'ī', stem + 'īni']);
      return masculine;
    }
    if (code === 'm.u' || code === 'nt.u' || code === 'f.u') {
      const gender = code.slice(0, code.indexOf('.'));
      const isF = gender === 'f', isN = gender === 'nt';
      const pluralNom = isN ? [stem + 'ū', stem + 'ūni'] : isF ? [stem + 'ū', stem + 'uyo'] : [stem + 'ū', stem + 'avo'];
      return group(11, ({m:'Masculine',f:'Feminine',nt:'Neuter'}[gender]) + ' noun, "u" declension', [
        row('Nominative', [lemma], pluralNom), row('Vocative', [lemma], pluralNom), row('Accusative', [stem + 'uṃ'], pluralNom),
        row('Instrumental', [isF ? stem + 'uyā' : stem + 'unā'], [stem + 'ūhi', stem + 'ūbhi', stem + 'uhi', stem + 'ubhi']),
        row('Dative', [isF ? stem + 'uyā' : stem + 'ussa', ...(isF ? [] : [stem + 'uno'])], [stem + 'ūnaṃ', stem + 'unaṃ']),
        row('Ablative', [isF ? stem + 'uyā' : stem + 'usmā', ...(isF ? [] : [stem + 'umhā', stem + 'unā'])], [stem + 'ūhi', stem + 'ūbhi', stem + 'uhi', stem + 'ubhi']),
        row('Genitive', [isF ? stem + 'uyā' : stem + 'ussa', ...(isF ? [] : [stem + 'uno'])], [stem + 'ūnaṃ', stem + 'unaṃ']),
        row('Locative', [isF ? stem + 'uyā' : stem + 'usmiṃ', ...(isF ? [stem + 'uyaṃ'] : [stem + 'umhi'])], [stem + 'ūsu', stem + 'usu'])
      ], gender);
    }
    return null;
  }
  function specialGroup11(lemma) {
    if (lemma === 'bhikkhu') return group11(lemma, { i: 'm.u', s: 'bhikkh' });
    if (lemma !== 'go') return null;
    return explicit(11, 'Masculine noun, "o" declension', 'm', [
      [['go'], ['gāvo', 'gavo']], [['go'], ['gāvo', 'gavo']], [['gavaṃ', 'gāvaṃ', 'gāvuṃ'], ['gāvo', 'gavo']],
      [['gāvena', 'gavena'], ['gohi', 'gobhi']], [['gāvassa', 'gavassa'], ['gavaṃ', 'gonaṃ', 'gunnaṃ']],
      [['gāvasmā', 'gāvamhā', 'gāvā', 'gavasmā', 'gavamhā', 'gavā'], ['gohi', 'gobhi']],
      [['gāvassa', 'gavassa'], ['gavaṃ', 'gonaṃ', 'gunnaṃ']],
      [['gāvasmiṃ', 'gāvamhi', 'gāve', 'gavasmiṃ', 'gavamhi', 'gave'], ['gāvesu', 'gavesu', 'gosu']]
    ]);
  }
  function group12(record) {
    const base = record.s, long = base + 'ant';
    const common = [
      row('Instrumental', [base + 'atā', long + 'ena'], [long + 'ehi', long + 'ebhi']),
      row('Dative', [base + 'assa', base + 'anto', long + 'assa'], [base + 'ataṃ', long + 'ānaṃ']),
      row('Ablative', [base + 'atā', long + 'asmā', long + 'ā'], [long + 'ehi', long + 'ebhi']),
      row('Genitive', [base + 'assa', base + 'anto', long + 'assa'], [base + 'ataṃ', long + 'ānaṃ']),
      row('Locative', [base + 'ati', long + 'asmiṃ', long + 'amhi', long + 'e'], [long + 'esu'])
    ];
    const masculine = group(12, 'Masculine adjective, vant/mant declension', [
      row('Nominative', [base + 'ā', long + 'o'], [long + 'ā', long + 'o']),
      row('Vocative', [base + 'aṃ', base + 'a', base + 'ā'], [long + 'ā', long + 'o']),
      row('Accusative', [base + 'aṃ', long + 'aṃ'], [long + 'e']), ...common
    ], 'm');
    const feminineLemma = base + 'atī';
    const feminine = group7(feminineLemma, base + 'at');
    feminine.teacherGroupNumber = 12; feminine.teacherGroupName = GROUPS[12];
    feminine.label = 'Feminine adjective, vant/mant declension (follows Group 7 Nadādigaṇa)';
    const neuter = group(12, 'Neuter adjective, vant/mant declension', [
      row('Nominative', [base + 'aṃ'], [long + 'ā', long + 'i', long + 'āni']),
      row('Vocative', [base + 'aṃ', base + 'a', base + 'ā'], [long + 'ā', long + 'i', long + 'āni']),
      row('Accusative', [base + 'aṃ', long + 'aṃ'], [long + 'ā', long + 'i', long + 'āni']), ...common
    ], 'nt');
    return [masculine, feminine, neuter];
  }
  function group13(lemma, record) {
    const base = record.s, long = base + (record.i.endsWith('nto') ? 'ont' : 'ant');
    const weak = record.i.endsWith('nto') ? base + 'ot' : base + 'at';
    const masculine = group(13, 'Masculine present participle declension', [
      row('Nominative', [base + 'aṃ', long + 'o'], [long + 'ā', long + 'o']),
      row('Vocative', [base + 'aṃ', base + 'a', base + 'ā'], [long + 'ā', long + 'o']),
      row('Accusative', [base + 'aṃ', long + 'aṃ'], [long + 'e']),
      row('Instrumental', [weak + 'ā', long + 'ena'], [long + 'ehi', long + 'ebhi']),
      row('Dative', [base + 'assa', weak + 'o', long + 'assa'], [weak + 'aṃ', long + 'ānaṃ']),
      row('Ablative', [weak + 'ā', long + 'asmā', long + 'amhā', long + 'ā'], [long + 'ehi', long + 'ebhi']),
      row('Genitive', [base + 'assa', weak + 'o', long + 'assa'], [weak + 'aṃ', long + 'ānaṃ']),
      row('Locative', [weak + 'i', long + 'asmiṃ', long + 'amhi', long + 'e'], [long + 'esu'])
    ], 'm');
    const feminine = group7(long + 'ī', long);
    feminine.teacherGroupNumber = 13; feminine.teacherGroupName = GROUPS[13];
    feminine.label = 'Feminine present participle declension (follows Group 7 Nadādigaṇa)';
    const neuter = group(13, 'Neuter present participle declension', [
      row('Nominative', [base + 'aṃ', long + 'aṃ'], [long + 'ā', long + 'i', long + 'āni']),
      row('Vocative', [base + 'aṃ', base + 'a', base + 'ā'], [long + 'ā', long + 'i', long + 'āni']),
      row('Accusative', [base + 'aṃ', long + 'aṃ'], [long + 'e', long + 'i', long + 'āni']),
      ...masculine.rows.slice(3)
    ], 'nt');
    return [masculine, feminine, neuter];
  }
  function specialGroup13(lemma) {
    const bases = { arahanta: 'arah', mahanta: 'mah', santa: 's' };
    if (!bases[lemma]) return null;
    const groups = group13(lemma, { i: 'ac.prp.nt', s: bases[lemma] });
    if (lemma === 'arahanta') groups[0].rows[0].singular.push('arahā');
    if (lemma === 'mahanta') groups[0].rows[0].singular.push('mahā');
    return groups;
  }

  function paradigm(lemma, morphology) {
    lemma = String(lemma || '').normalize('NFC').toLowerCase();
    const result = groups => ({ lemma, groups, formSystem: 'kaccayana', formSource: SOURCE, classificationSource: 'Pali Lookup version 2.0' });
    const records = morphology?.entries?.[lemma];
    const record = Array.isArray(records) ? records.find(item => item?.r && item?.s) : null;
    const special4 = specialGroup4(lemma); if (special4) return result([special4]);
    const special5 = specialGroup5(lemma); if (special5) return result([special5]);
    const special11 = specialGroup11(lemma); if (special11) return result([special11]);
    const special13 = specialGroup13(lemma); if (special13) return result(special13);
    if (!record) return null;
    let groups = [];
    if (record.i === 'm.a') groups = [group1(lemma, record.s)];
    else if (record.i === 'nt.a') groups = [group2(lemma, record.s)];
    else if (record.i === 'f.ā') groups = [group3(lemma, record.s)];
    else if (record.i === 'f.ī') {
      const g = group7(lemma, record.s);
      if (/(?:patānī|bhikkhunī|rājinī|daṇḍinī)$/.test(lemma)) {
        g.teacherGroupNumber = 8; g.teacherGroupName = GROUPS[8]; g.label = 'Feminine noun, "inī" declension';
      }
      groups = [g];
    }
    else if (/^(?:m\.r|m\.p|f\.p)$/.test(record.i)) { const g = group10(lemma, record); if (g) groups = [g]; }
    else if (/^(?:m|f|nt)\.(?:i|u)$/.test(record.i)) { const g = group11(lemma, record); if (g) groups = [g]; }
    else if (record.i === 'adj.v') groups = group12(record);
    else if (/^(?:ac|ca|cp|md|pa)\.prp\.(?:nt|nte|nto)$/.test(record.i)) groups = group13(lemma, record);
    if (!groups.length) return null;
    return result(groups);
  }

  global.KaccayanaDeclension = Object.freeze({ VERSION, SOURCE, GROUPS, paradigm });
})(window);
