/* PAMC Kaccayana-based nominal declension generator v1.5.0 — 2026-09-20
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

  const VERSION = '1.5.0';
  const SOURCE = "Bhante U Janakābhivaṃsa’s Kaccāyana-based 13 Groups of Declension";
  const GROUPS = Object.freeze({
    1: 'Purisādigaṇa', 2: 'Cittādigaṇa', 3: 'Kaññādigaṇa', 4: 'Pumādigaṇa',
    5: 'Rājādigaṇa', 6: 'Manogaṇa', 7: 'Nadādigaṇa', 8: 'Gahapatādigaṇa',
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
  // Manogaṇa is a closed lexical class in the teacher's table. Do not assign
  // Group 6 merely because another word has the same final vowel or a Pali
  // Lookup m.s/nt.s code. Encode each admitted lemma separately.
  const MANOGANA_CITATION_FORMS = Object.freeze({
    mana: 'mana', vaca: 'vaco', vaco: 'vaco', vaya: 'vayo', vayo: 'vayo',
    teja: 'tejo', tejo: 'tejo', tapa: 'tapo', tapo: 'tapo', ceta: 'ceto', ceto: 'ceto',
    tama: 'tamo', tamo: 'tamo', yasa: 'yaso', yaso: 'yaso', aya: 'ayo', ayo: 'ayo',
    paya: 'payo', payo: 'payo', sira: 'siro', siro: 'siro', chanda: 'chando', chando: 'chando',
    sara: 'saro', saro: 'saro', ura: 'uro', uro: 'uro', raha: 'raho', raho: 'raho',
    aha: 'aho', aho: 'aho'
  });
  function specialGroup6(lemma) {
    const teacherForm = MANOGANA_CITATION_FORMS[lemma];
    if (!teacherForm) return null;
    const base = teacherForm === 'mana' ? 'mana' : teacherForm.slice(0, -1) + 'a';
    const stem = base.slice(0, -1);
    return explicit(6, 'Masculine/neuter noun, mana/manas declension', 'm/nt', [
      [[stem + 'aṃ', stem + 'o'], [stem + 'ā', stem + 'āni']],
      [[stem + 'a', stem + 'ā'], [stem + 'ā', stem + 'āni']],
      [[stem + 'aṃ', stem + 'o'], [stem + 'e', stem + 'āni']],
      [[stem + 'ena', stem + 'asā'], [stem + 'ehi', stem + 'ebhi']],
      [[stem + 'assa', stem + 'aso'], [stem + 'ānaṃ']],
      [[stem + 'asmā', stem + 'amhā', stem + 'ā'], [stem + 'ehi', stem + 'ebhi']],
      [[stem + 'assa', stem + 'aso'], [stem + 'ānaṃ']],
      [[stem + 'asmiṃ', stem + 'amhi', stem + 'e', stem + 'asi'], [stem + 'esu']]
    ], 'Restricted Manogaṇa membership; the PCED citation/stem form is mapped explicitly to the teacher’s -o form, never inferred from an ending.');
  }

  function specialGroup6Adi(lemma) {
    // The teacher separates these Manogaṇādigaṇa examples from the closed
    // Manogaṇa list above. They must not be mixed with vaco/mano-type words.
    if (lemma === 'bila') return explicit(6, 'Neuter noun, Manogaṇādigaṇa bila type', 'nt', [
      [['bilaṃ'], ['bilā', 'bilāni']], [['bila', 'bilā'], ['bilā', 'bilāni']], [['bilaṃ'], ['bile', 'bilāni']],
      [['bilena', 'bilasa'], ['bilehi', 'bilebhi']], [['bilassa', 'bilaso'], ['bilānaṃ']],
      [['bilasmā', 'bilamhā', 'bilā'], ['bilehi', 'bilebhi']], [['bilassa', 'bilaso'], ['bilānaṃ']],
      [['bilasmiṃ', 'bilamhi', 'bile', 'bilasi'], ['bilesu']]
    ], 'Expanded from the teacher’s complete bila table; accusative singular bilo is explicitly excluded.');
    if (lemma === 'thāma') return explicit(6, 'Neuter noun, Manogaṇādigaṇa thāma type', 'nt', [
      [['thāmaṃ'], ['thāmā', 'thāmāni']], [['thāma', 'thāmā'], ['thāmā', 'thāmāni']], [['thāmaṃ'], ['thāme', 'thāmāni']],
      [['thāmena', 'thāmasa', 'thāmaso', 'thāmunā'], ['thāmehi', 'thāmebhi']],
      [['thāmassa', 'thāmaso', 'thāmuno'], ['thāmānaṃ']], [['thāmasmā', 'thāmamhā', 'thāmā', 'thāmunā'], ['thāmehi', 'thāmebhi']],
      [['thāmassa', 'thāmaso', 'thāmuno'], ['thāmānaṃ']], [['thāmasmiṃ', 'thāmamhi', 'thāme', 'thāmasi'], ['thāmesu']]
    ], 'Expanded from the teacher’s complete thāma table; accusative singular thāmo is explicitly excluded.');
    if (lemma === 'āpa') return explicit(6, 'Masculine noun, Manogaṇādigaṇa āpa type', 'm', [
      [['āpo'], ['āpā']], [['āpa', 'āpā'], ['āpā']], [['āpaṃ', 'āpo'], ['āpe', 'āpāni']],
      [['āpena'], ['āpehi', 'āpebhi']], [['āpassa'], ['āpānaṃ']], [['āpasmā', 'āpamhā', 'āpā'], ['āpehi', 'āpebhi']],
      [['āpassa'], ['āpānaṃ']], [['āpasmiṃ', 'āpamhi', 'āpe'], ['āpesu']]
    ], 'Expanded from the teacher’s complete āpa table; āpasā, āpaso and āpasi are explicitly excluded.');
    return null;
  }

  const SABBANAMA_MEMBERS = Object.freeze(new Set([
    'sabba', 'katara', 'katama', 'itara', 'añña', 'aññatara', 'aññatama',
    'pubba', 'para', 'apara', 'dakkhiṇa', 'uttara', 'adhara', 'ya', 'ta',
    'eta', 'ima', 'amu', 'kiṃ', 'eka', 'ubha', 'ubhaya', 'dvi', 'ti',
    'catu', 'pañca', 'tumha', 'amha'
  ]));
  const g9 = (label, gender, rows, note) => {
    const expandedRows = rows.slice();
    if (!expandedRows.some(item => item.label === 'Vocative')) {
      expandedRows.splice(1, 0, row('Vocative', [], []));
    }
    return group(9, label, expandedRows, gender, note);
  };
  function sabbanamaRegular(lemma, stem = lemma.slice(0, -1)) {
    const m = g9('Masculine pronoun/adjective', 'm', [
      row('Nominative', [stem + 'o'], [stem + 'e']), row('Vocative', [stem + 'a', stem + 'ā'], [stem + 'e']),
      row('Accusative', [stem + 'aṃ'], [stem + 'e']), row('Instrumental', [stem + 'ena'], [stem + 'ehi', stem + 'ebhi']),
      row('Dative', [stem + 'assa'], [stem + 'esaṃ', stem + 'esānaṃ']), row('Ablative', [stem + 'asmā', stem + 'amhā'], [stem + 'ehi', stem + 'ebhi']),
      row('Genitive', [stem + 'assa'], [stem + 'esaṃ', stem + 'esānaṃ']), row('Locative', [stem + 'asmiṃ', stem + 'amhi'], [stem + 'esu'])
    ]);
    const n = g9('Neuter pronoun/adjective', 'nt', [
      row('Nominative', [stem + 'aṃ'], [stem + 'āni']), row('Vocative', [stem + 'a', stem + 'ā'], [stem + 'āni']),
      row('Accusative', [stem + 'aṃ'], [stem + 'āni']), ...m.rows.slice(3)
    ]);
    const f = g9('Feminine pronoun/adjective', 'f', [
      row('Nominative', [stem + 'ā'], [stem + 'ā', stem + 'āyo']), row('Vocative', [stem + 'e'], [stem + 'ā', stem + 'āyo']),
      row('Accusative', [stem + 'aṃ'], [stem + 'ā', stem + 'āyo']), row('Instrumental', [stem + 'āya'], [stem + 'āhi', stem + 'ābhi']),
      row('Dative', [stem + 'āya', stem + 'assā'], [stem + 'āsaṃ', stem + 'āsānaṃ']), row('Ablative', [stem + 'āya'], [stem + 'āhi', stem + 'ābhi']),
      row('Genitive', [stem + 'āya', stem + 'assā'], [stem + 'āsaṃ', stem + 'āsānaṃ']), row('Locative', [stem + 'āyaṃ', stem + 'assaṃ'], [stem + 'āsu'])
    ]);
    return [m, n, f];
  }
  function kataraFamily(lemma) {
    const groups = sabbanamaRegular(lemma);
    const stem = lemma.slice(0, -1), f = groups[2];
    f.rows[4] = row('Dative', [stem + 'āya', stem + 'issā'], [stem + 'āsaṃ', stem + 'āsānaṃ']);
    f.rows[6] = row('Genitive', [stem + 'āya', stem + 'issā'], [stem + 'āsaṃ', stem + 'āsānaṃ']);
    f.rows[7] = row('Locative', [stem + 'āyaṃ', stem + 'issaṃ'], [stem + 'āsu']);
    return groups;
  }
  function pluralOnly(label, gender, values) {
    return g9(label, gender, CASES.filter(name => name !== 'Vocative').map((name, i) => row(name, [], values[i])));
  }
  function specialGroup9(lemma) {
    if (!SABBANAMA_MEMBERS.has(lemma)) return null;
    if (lemma === 'sabba' || lemma === 'ya' || lemma === 'ubhaya') {
      const groups = sabbanamaRegular(lemma);
      if (lemma === 'ubhaya') groups[0].rows[0].plural.push('ubhayo');
      return groups;
    }
    if (['katara','katama','itara','añña','aññatara','aññatama'].includes(lemma)) return kataraFamily(lemma);
    if (['pubba','para','apara','dakkhiṇa','uttara','adhara'].includes(lemma)) {
      const groups = sabbanamaRegular(lemma), stem = lemma.slice(0, -1);
      const add = (values, value) => { if (!values.includes(value)) values.push(value); };
      const masculine = groups[0], neuter = groups[1], feminine = groups[2];
      // Teacher table §9.8-9.13: the bold alternatives from the masculine
      // pubba table also supplement the corresponding neuter sabba table.
      add(masculine.rows[0].plural, stem + 'ā');
      add(masculine.rows[1].singular, stem + 'ā');
      add(masculine.rows[1].plural, stem + 'ā');
      add(masculine.rows[5].singular, stem + 'ā');
      add(masculine.rows[6].plural, stem + 'ānaṃ');
      add(masculine.rows[7].singular, stem + 'e');
      add(neuter.rows[0].plural, stem + 'ā');
      add(neuter.rows[1].singular, stem + 'ā');
      add(neuter.rows[1].plural, stem + 'ā');
      add(neuter.rows[5].singular, stem + 'ā');
      add(neuter.rows[6].plural, stem + 'ānaṃ');
      add(neuter.rows[7].singular, stem + 'e');
      // Pubba, para, apara and adhara follow sabba in the feminine. Dakkhiṇa
      // and uttara add the teacher's third locative-singular alternative.
      if (lemma === 'dakkhiṇa' || lemma === 'uttara') {
        add(feminine.rows[7].singular, stem + 'āya');
        add(feminine.rows[7].singular, stem + 'āyaṃ');
        add(feminine.rows[7].singular, stem + 'assaṃ');
      }
      return groups;
    }
    if (lemma === 'ta') return [
      g9('Masculine demonstrative pronoun','m',[row('Nominative',['so'],['ne','te']),row('Accusative',['naṃ','taṃ'],['ne','te']),row('Instrumental',['nena','tena'],['nehi','nebhi','tehi','tebhi']),row('Dative',['nassa','assa','tassa'],['nesaṃ','nesānaṃ','tesaṃ','tesānaṃ']),row('Ablative',['nasmā','asmā','tasmā','namhā','tamhā'],['nehi','nebhi','tehi','tebhi']),row('Genitive',['nassa','assa','tassa'],['nesaṃ','nesānaṃ','tesaṃ','tesānaṃ']),row('Locative',['nasmiṃ','asmiṃ','tasmiṃ','namhi','tamhi'],['nesu','tesu'])]),
      g9('Neuter demonstrative pronoun','nt',[row('Nominative',['naṃ','taṃ'],['nāni','tāni']),row('Accusative',['naṃ','taṃ'],['nāni','tāni']),row('Instrumental',['nena','tena'],['nehi','nebhi','tehi','tebhi']),row('Dative',['nassa','assa','tassa'],['nesaṃ','nesānaṃ','tesaṃ','tesānaṃ']),row('Ablative',['nasmā','asmā','tasmā','namhā','tamhā'],['nehi','nebhi','tehi','tebhi']),row('Genitive',['nassa','assa','tassa'],['nesaṃ','nesānaṃ','tesaṃ','tesānaṃ']),row('Locative',['nasmiṃ','asmiṃ','tasmiṃ','namhi','tamhi'],['nesu','tesu'])]),
      g9('Feminine demonstrative pronoun','f',[row('Nominative',['sā'],['nā','nāyo','tā','tāyo']),row('Accusative',['naṃ','taṃ'],['nā','nāyo','tā','tāyo']),row('Instrumental',['nāya','tāya'],['nāhi','nābhi','tāhi','tābhi']),row('Dative',['tissā','tassā','nassā','assā','tissāya','tassāya','nassāya','assāya','nāya','tāya'],['nāsaṃ','nāsānaṃ','tāsaṃ','tāsānaṃ']),row('Ablative',['nāya','tāya'],['nāhi','nābhi','tāhi','tābhi']),row('Genitive',['tissā','tassā','nassā','assā','tissāya','tassāya','nassāya','assāya','nāya','tāya'],['nāsaṃ','nāsānaṃ','tāsaṃ','tāsānaṃ']),row('Locative',['tissaṃ','tassaṃ','nassaṃ','assaṃ','nāyaṃ','tāyaṃ'],['nāsu','tāsu'])])
    ];
    if (lemma === 'eta') return [
      g9('Masculine demonstrative pronoun','m',[row('Nominative',['eso'],['ete']),row('Accusative',['etaṃ'],['ete']),row('Instrumental',['etena'],['etehi','etebhi']),row('Dative',['etassa'],['etesaṃ','etesānaṃ']),row('Ablative',['etasmā','etamhā'],['etehi','etebhi']),row('Genitive',['etassa'],['etesaṃ','etesānaṃ']),row('Locative',['etasmiṃ','etamhi'],['etesu'])]),
      g9('Neuter demonstrative pronoun','nt',[row('Nominative',['etaṃ'],['etāni']),row('Accusative',['etaṃ'],['etāni']),row('Instrumental',['etena'],['etehi','etebhi']),row('Dative',['etassa'],['etesaṃ','etesānaṃ']),row('Ablative',['etasmā','etamhā'],['etehi','etebhi']),row('Genitive',['etassa'],['etesaṃ','etesānaṃ']),row('Locative',['etasmiṃ','etamhi'],['etesu'])]),
      g9('Feminine demonstrative pronoun','f',[row('Nominative',['esā'],['etā','etāyo']),row('Accusative',['etaṃ'],['etā','etāyo']),row('Instrumental',['esā'],['etā','etāyo']),row('Dative',['etaṃ'],['etā','etāyo']),row('Ablative',['etāya'],['etāhi','etābhi']),row('Genitive',['etāya','etissā','etissāya'],['etāsaṃ','etāsānaṃ']),row('Locative',['etāya'],['etāhi','etābhi'])])
    ];
    if (lemma === 'ima') return [
      g9('Masculine demonstrative pronoun','m',[row('Nominative',['ayaṃ'],['ime']),row('Accusative',['imaṃ'],['ime']),row('Instrumental',['anena','iminā'],['imehi','imebhi','ehi','ebhi']),row('Dative',['imassa','assa'],['imesaṃ','imesānaṃ','esaṃ','esānaṃ']),row('Ablative',['imasmā','imamhā','asmā'],['imehi','imebhi','ehi','ebhi']),row('Genitive',['imassa','assa'],['imesaṃ','imesānaṃ','esaṃ','esānaṃ']),row('Locative',['imasmiṃ','imamhi','asmiṃ'],['imesu','esu'])]),
      g9('Neuter demonstrative pronoun','nt',[row('Nominative',['idaṃ','imaṃ'],['imāni']),row('Accusative',['idaṃ','imaṃ'],['imāni']),row('Instrumental',['anena','iminā'],['imehi','imebhi','ehi','ebhi']),row('Dative',['imassa','assa'],['imesaṃ','imesānaṃ','esaṃ','esānaṃ']),row('Ablative',['imasmā','imamhā','asmā'],['imehi','imebhi','ehi','ebhi']),row('Genitive',['imassa','assa'],['imesaṃ','imesānaṃ','esaṃ','esānaṃ']),row('Locative',['imasmiṃ','imamhi','asmiṃ'],['imesu','esu'])]),
      g9('Feminine demonstrative pronoun','f',[row('Nominative',['ayaṃ'],['imā','imāyo']),row('Accusative',['imaṃ'],['imā','imāyo']),row('Instrumental',['imāya'],['imāhi','imābhi']),row('Dative',['imāya','assā','assāya','imissā','imissāya'],['imāsaṃ','imāsānaṃ']),row('Ablative',['imāya'],['imāhi','imābhi']),row('Genitive',['imāya','assā','assāya','imissā','imissāya'],['imāsaṃ','imāsānaṃ']),row('Locative',['imāyaṃ','assaṃ','imissaṃ'],['imāsu'])])
    ];
    if (lemma === 'amu') return [
      g9('Masculine remote demonstrative','m',[row('Nominative',['asu','amu'],['amū']),row('Accusative',['amuṃ'],['amū']),row('Instrumental',['amunā'],['amūhi','amūbhi','amuhi','amubhi']),row('Dative',['amussa','adussa'],['amūsaṃ','amūsānaṃ','amusaṃ','amusānaṃ']),row('Ablative',['amusmā','amumhā'],['amūhi','amūbhi','amuhi','amubhi']),row('Genitive',['amussa','adussa'],['amūsaṃ','amūsānaṃ','amusaṃ','amusānaṃ']),row('Locative',['amusmiṃ','amumhi'],['amūsu','amusu'])]),
      g9('Neuter remote demonstrative','nt',[row('Nominative',['aduṃ'],['amuni','amūni']),row('Accusative',['aduṃ'],['amuni','amūni']),row('Instrumental',['amunā'],['amūhi','amūbhi','amuhi','amubhi']),row('Dative',['amussa','adussa'],['amūsaṃ','amūsānaṃ','amusaṃ','amusānaṃ']),row('Ablative',['amusmā','amumhā'],['amūhi','amūbhi','amuhi','amubhi']),row('Genitive',['amussa','adussa'],['amūsaṃ','amūsānaṃ','amusaṃ','amusānaṃ']),row('Locative',['amusmiṃ','amumhi'],['amūsu','amusu'])]),
      g9('Feminine remote demonstrative','f',[row('Nominative',['asu','amu'],['amū','amuyo']),row('Accusative',['amuṃ'],['amū','amuyo']),row('Instrumental',['amuyā'],['amūhi','amūbhi','amuhi','amubhi']),row('Dative',['amuyā','amussā'],['amūsaṃ','amūsānaṃ','amusaṃ','amusānaṃ']),row('Ablative',['amuyā'],['amūhi','amūbhi','amuhi','amubhi']),row('Genitive',['amuyā','amussā'],['amūsaṃ','amūsānaṃ','amusaṃ','amusānaṃ']),row('Locative',['amuyaṃ','amusaṃ'],['amūsu','amusu'])])
    ];
    if (lemma === 'kiṃ') return [
      g9('Masculine interrogative pronoun','m',[row('Nominative',['ko'],['ke']),row('Accusative',['kaṃ'],['ke']),row('Instrumental',['kena'],['kehi','kebhi']),row('Dative',['kassa','kissa'],['kesaṃ','kesānaṃ']),row('Ablative',['kasmā','kamhā'],['kehi','kebhi']),row('Genitive',['kassa','kissa'],['kesaṃ','kesānaṃ']),row('Locative',['kasmiṃ','kisamiṃ','kamhi','kimhi'],['kesu'])]),
      g9('Neuter interrogative pronoun','nt',[row('Nominative',['kiṃ'],['kāni']),row('Accusative',['kiṃ'],['kāni']),row('Instrumental',['kena'],['kehi','kebhi']),row('Dative',['kassa','kissa'],['kesaṃ','kesānaṃ']),row('Ablative',['kasmā','kamhā'],['kehi','kebhi']),row('Genitive',['kassa','kissa'],['kesaṃ','kesānaṃ']),row('Locative',['kasmiṃ','kisamiṃ','kamhi','kimhi'],['kesu'])]),
      g9('Feminine interrogative pronoun','f',[row('Nominative',['kā'],['kā','kāyo']),row('Accusative',['kaṃ'],['kā','kāyo']),row('Instrumental',['kāya'],['kāhi','kābhi']),row('Dative',['kāya','kassā'],['kāsaṃ','kāsānaṃ']),row('Ablative',['kāya'],['kāhi','kābhi']),row('Genitive',['kāya','kassā'],['kāsaṃ','kāsānaṃ']),row('Locative',['kāya','kassaṃ'],['kāsu'])])
    ];
    if (lemma === 'eka') return kataraFamily(lemma).map(g => { g.rows.forEach(r => { r.plural = []; }); return g; });
    if (lemma === 'ubha') return [g9('Pronoun/adjective, plural only', 'm/nt/f', [
      row('Nominative', [], ['ubho','ubhe']), row('Accusative', [], ['ubho','ubhe']),
      row('Instrumental', [], ['ubohi','ubobhi','ubehi','ubebhi']), row('Dative', [], ['ubinnaṃ']),
      row('Ablative', [], ['ubohi','ubobhi','ubehi','ubebhi']), row('Genitive', [], ['ubinnaṃ']), row('Locative', [], ['ubhosu','ubhesu'])
    ])];
    if (lemma === 'dvi') return [pluralOnly('Cardinal numeral, plural only', 'm/nt/f', [
      ['dve','duve'], ['dve','duve'], ['dvīhi','dvībhi','dvihi','dvibhi'], ['dvinnaṃ','duvinnaṃ'],
      ['dvīhi','dvībhi','dvihi','dvibhi'], ['dvinnaṃ','duvinnaṃ'], ['dvīsu','dvisu']
    ])];
    if (lemma === 'ti') return [
      pluralOnly('Masculine cardinal numeral, plural only','m',[['tayo'],['tayo'],['tīhi','tībhi','tihi','tibhi'],['tiṇṇaṃ','tiṇṇanaṃ'],['tīhi','tībhi','tihi','tibhi'],['tiṇṇaṃ','tiṇṇanaṃ'],['tīsu','tisu']]),
      pluralOnly('Neuter cardinal numeral, plural only','nt',[['tīṇṇi'],['tīṇṇi'],['tīhi','tībhi','tihi','tibhi'],['tiṇṇaṃ','tiṇṇanaṃ'],['tīhi','tībhi','tihi','tibhi'],['tiṇṇaṃ','tiṇṇanaṃ'],['tīsu','tisu']]),
      pluralOnly('Feminine cardinal numeral, plural only','f',[['tisso'],['tisso'],['tīhi','tībhi','tihi','tibhi'],['tissannaṃ'],['tīhi','tībhi','tihi','tibhi'],['tissannaṃ'],['tīsu','tisu']])
    ];
    if (lemma === 'catu') return [
      pluralOnly('Masculine cardinal numeral, plural only','m',[['cattāro'],['cattāro'],['catūhi','catūbhi','catuhi','catubhi','catubbhi'],['catunnaṃ'],['catūhi','catūbhi','catuhi','catubhi','catubbhi'],['catunnaṃ'],['catūsu','catusu']]),
      pluralOnly('Neuter cardinal numeral, plural only','nt',[['cattāri'],['cattāri'],['catūhi','catūbhi','catuhi','catubhi','catubbhi'],['catunnaṃ'],['catūhi','catūbhi','catuhi','catubhi','catubbhi'],['catunnaṃ'],['catūsu','catusu']]),
      pluralOnly('Feminine cardinal numeral, plural only','f',[['catasso'],['catasso'],['catūhi','catūbhi','catuhi','catubhi','catubbhi'],['catassannaṃ'],['catūhi','catūbhi','catuhi','catubhi','catubbhi'],['catassannaṃ'],['catūsu','catusu']])
    ];
    if (lemma === 'pañca') return [pluralOnly('Cardinal numeral, plural only','m/nt/f',[['pañca'],['pañca'],['pañcahi','pañcabhi'],['pañcannaṃ'],['pañcahi','pañcabhi'],['pañcannaṃ'],['pañcasu']])];
    if (lemma === 'tumha') return [g9('Second-person pronoun','m/nt/f',[
      row('Nominative',['tvaṃ','tuvaṃ'],['tumhe','vo']), row('Accusative',['taṃ','tavaṃ','tuvaṃ','tvaṃ'],['tumhe','tumhākaṃ','vo']),
      row('Instrumental',['tayā','tvayā','te'],['tumhehi','tumhebhi','vo']), row('Dative',['tava','tuyhaṃ','tumhaṃ','te'],['tumhākaṃ','tumhaṃ','vo']),
      row('Ablative',['tayā','tvayā'],['tumhehi','tumhebhi']), row('Genitive',['tava','tuyhaṃ','tumhaṃ','te'],['tumhākaṃ','tumhaṃ','vo']), row('Locative',['tayi','tvayi'],['tumhesu'])
    ])];
    if (lemma === 'amha') return [g9('First-person pronoun','m/nt/f',[
      row('Nominative',['ahaṃ'],['mayaṃ','amhe','no']), row('Accusative',['maṃ','mamaṃ'],['amhe','amhākaṃ','no']), row('Instrumental',['mayā','me'],['amhehi','amhebhi','no']),
      row('Dative',['mama','mayhaṃ','amhaṃ','mamaṃ','me'],['amhākaṃ','asmhākaṃ','amhaṃ','no']), row('Ablative',['mayā'],['amhehi','amhebhi']),
      row('Genitive',['mama','mayhaṃ','amhaṃ','mamaṃ','me'],['amhākaṃ','asmhākaṃ','amhaṃ','no']), row('Locative',['mayi'],['amhesu','asmesu'])
    ])];
    return null;
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
  function specialGroup8(lemma) {
    if (!['gahapatānī', 'bhikkhunī', 'rājinī', 'daṇḍinī', 'paracittavidūnī'].includes(lemma)) return null;
    const g = group7(lemma, lemma.slice(0, -1));
    g.teacherGroupNumber = 8; g.teacherGroupName = GROUPS[8];
    g.label = 'Feminine noun, "inī" declension';
    g.note = 'All rows are expanded here; the teacher’s abbreviated table refers the remaining cases to māṇavī/itthī.';
    return g;
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

  function specialGroup10(lemma) {
    if (lemma === 'jetu') return explicit(10, 'Masculine noun, nattu / -tu/-tar declension', 'm', [
      [['jetā'], ['jetāro']], [['jeta', 'jetā'], ['jetāro']], [['jetāraṃ'], ['jetāre', 'jetāro']],
      [['jetārā'], ['jetārebhi', 'jetārehi']], [['jetu', 'jetuno', 'jetussa'], ['jetārānaṃ', 'jetānaṃ']],
      [['jetārā'], ['jetārebhi', 'jetārehi']], [['jetu', 'jetuno', 'jetussa'], ['jetārānaṃ', 'jetānaṃ']],
      [['jetari'], ['jetāresu']]
    ], 'Verified against PCED Inflection Master v1.5; exact clicked headword remains jetu.');
    if (lemma === 'bhātu' || lemma === 'pitu') {
      const s = lemma === 'bhātu' ? 'bhāt' : 'pit';
      return explicit(10, 'Masculine relationship noun, u/ar declension', 'm', [
        [[s + 'ā'], [s + 'aro']], [[s + 'a', s + 'ā'], [s + 'aro']], [[s + 'araṃ'], [s + 'aro', s + 'are']],
        [[s + 'arā'], [s + 'arehi', s + 'arebhi', s + 'ūhi', s + 'ūbhi']],
        [[lemma, s + 'uno', s + 'ussa'], [s + 'arānaṃ', s + 'ūnaṃ', s + 'ānaṃ']],
        [[s + 'arā'], [s + 'arehi', s + 'arebhi', s + 'ūhi', s + 'ūbhi']],
        [[lemma, s + 'uno', s + 'ussa'], [s + 'arānaṃ', s + 'ūnaṃ', s + 'ānaṃ']],
        [[s + 'ari'], [s + 'aresu', s + 'ūsu']]
      ], 'Verified relationship-noun paradigm from PCED Inflection Master v1.5.');
    }
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
  function group11InAdjective(lemma, stem) {
    const masculine = group(11, 'Masculine adjective, "ī" declension', [
      row('Nominative', [stem + 'ī'], [stem + 'ī', stem + 'ino']),
      row('Vocative', [stem + 'i'], [stem + 'ī', stem + 'ino']),
      row('Accusative', [stem + 'iṃ', stem + 'inaṃ'], [stem + 'ī', stem + 'ino']),
      row('Instrumental', [stem + 'inā'], [stem + 'īhi', stem + 'ībhi']),
      row('Dative', [stem + 'issa', stem + 'ino'], [stem + 'īnaṃ']),
      row('Ablative', [stem + 'issa', stem + 'ino'], [stem + 'īnaṃ']),
      row('Genitive', [stem + 'issa', stem + 'ino'], [stem + 'īnaṃ']),
      row('Locative', [stem + 'ismiṃ', stem + 'imhi', stem + 'ini'], [stem + 'īsu'])
    ], 'm');
    const feminine = group(8, 'Feminine adjective, "inī" declension', [
      row('Nominative', [stem + 'inī'], [stem + 'iniyo']),
      row('Vocative', [stem + 'ini'], [stem + 'inī', stem + 'iniyo']),
      row('Accusative', [stem + 'iniṃ'], [stem + 'iniyo']),
      row('Instrumental', [stem + 'iniyā'], [stem + 'inīhi']),
      row('Dative', [stem + 'iniyā'], [stem + 'inīnaṃ']),
      row('Ablative', [stem + 'iniyā'], [stem + 'inīhi']),
      row('Genitive', [stem + 'iniyā'], [stem + 'inīnaṃ']),
      row('Locative', [stem + 'iniyā', stem + 'iniyaṃ'], [stem + 'inīsu'])
    ], 'f');
    const neuter = group(11, 'Neuter adjective, "ī" declension', [
      row('Nominative', [stem + 'i'], [stem + 'ī', stem + 'īni']),
      row('Vocative', [stem + 'i'], [stem + 'ī', stem + 'īni']),
      row('Accusative', [stem + 'iṃ', stem + 'inaṃ'], [stem + 'ī', stem + 'īni']),
      row('Instrumental', [stem + 'inā'], [stem + 'īhi', stem + 'ībhi']),
      row('Dative', [stem + 'issa', stem + 'ino'], [stem + 'īnaṃ']),
      row('Ablative', [stem + 'issa', stem + 'ino'], [stem + 'īnaṃ']),
      row('Genitive', [stem + 'issa', stem + 'ino'], [stem + 'īnaṃ']),
      row('Locative', [stem + 'ismiṃ', stem + 'imhi', stem + 'ini'], [stem + 'īsu'])
    ], 'nt');
    return [masculine, feminine, neuter];
  }
  function specialGroup11(lemma) {
    if (lemma === 'bhikkhu') return group11(lemma, { i: 'm.u', s: 'bhikkh' });
    if (lemma === 'ratti') return group11(lemma, { i: 'f.i', s: 'ratt' });
    if (lemma === 'aggi') return group11(lemma, { i: 'm.i', s: 'agg' });
    if (lemma === 'aṭṭhi') return group11(lemma, { i: 'nt.i', s: 'aṭṭh' });
    if (lemma === 'cakkhu') return group11(lemma, { i: 'nt.u', s: 'cakkh' });
    if (lemma === 'yāgu') return group11(lemma, { i: 'f.u', s: 'yāg' });
    if (lemma === 'daṇḍī') return group11InAdjective(lemma, 'daṇḍ')[0];
    if (lemma === 'sukhakārī') return group11InAdjective(lemma, 'sukhakār')[2];
    if (lemma === 'sayambhū' || lemma === 'sabbanñū' || lemma === 'sabbaññū' || lemma === 'vedagū' || lemma === 'viññū' || lemma === 'sahabhū') {
      const stem = lemma.slice(0, -1);
      const noEnding = ['sabbaññū', 'sabbanñū', 'vedagū', 'viññū'].includes(lemma) ? 'no' : null;
      const plural = [lemma, stem + 'uvo', ...(noEnding ? [stem + 'uno'] : []), ...(lemma === 'sahabhū' ? [stem + 'uno'] : [])];
      return group(11, 'Masculine noun, "ū" declension', [
        row('Nominative', [lemma], plural), row('Vocative', [lemma], plural), row('Accusative', [stem + 'uṃ'], plural),
        row('Instrumental', [stem + 'unā'], [lemma + 'hi', lemma + 'bhi']), row('Dative', [stem + 'ussa', stem + 'uno'], [lemma + 'naṃ']),
        row('Ablative', [stem + 'usmā', stem + 'umhā', stem + 'unā'], [lemma + 'hi', lemma + 'bhi']),
        row('Genitive', [stem + 'ussa', stem + 'uno'], [lemma + 'naṃ']), row('Locative', [stem + 'usmiṃ', stem + 'umhi'], [lemma + 'su'])
      ], 'm');
    }
    if (lemma === 'vadhū') {
      const stem = 'vadh';
      return group(11, 'Feminine noun, "ū" declension', [
        row('Nominative', ['vadhū'], ['vadhū', 'vadhuyo']), row('Vocative', ['vadhu'], ['vadhū', 'vadhuyo']),
        row('Accusative', ['vadhuṃ'], ['vadhū', 'vadhuyo']), row('Instrumental', ['vadhuyā'], ['vadhūhi', 'vadhūbhi']),
        row('Dative', ['vadhuyā'], ['vadhūnaṃ']), row('Ablative', ['vadhuyā'], ['vadhūhi', 'vadhūbhi']),
        row('Genitive', ['vadhuyā'], ['vadhūnaṃ']), row('Locative', ['vadhuyā', 'vadhuyaṃ'], ['vadhūsu'])
      ], 'f');
    }
    if (lemma === 'gotrabhū') {
      const inherited = specialGroup11('sayambhū');
      inherited.label = 'Neuter noun, "ū" declension'; inherited.gender = 'nt';
      inherited.rows[0] = row('Nominative', ['gotrabhu'], ['gotrabhū', 'gotrabhūni']);
      inherited.rows[1] = row('Vocative', ['gotrabhu'], ['gotrabhū', 'gotrabhūni']);
      inherited.rows[2] = row('Accusative', ['gotrabhuṃ'], ['gotrabhū', 'gotrabhūni']);
      inherited.rows.slice(3).forEach(r => { r.singular = r.singular.map(x => x.replaceAll('sayambh', 'gotrabh')); r.plural = r.plural.map(x => x.replaceAll('sayambh', 'gotrabh')); });
      return inherited;
    }
    if (lemma === 'cittago') {
      const inherited = group11('cakkhu', { i: 'nt.u', s: 'cakkh' });
      inherited.label = 'Neuter noun, "o/u" declension';
      inherited.rows.forEach(r => { r.singular = r.singular.map(x => x.replaceAll('cakkh', 'cittag')); r.plural = r.plural.map(x => x.replaceAll('cakkh', 'cittag')); });
      return inherited;
    }
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
    if (lemma === 'gacchanta') return group13(lemma, { i: 'ac.prp.nt', s: 'gacch' });
    if (lemma === 'karonta') return group13(lemma, { i: 'ac.prp.nto', s: 'kar' });
    if (lemma === 'bhavanta') {
      const groups = group13(lemma, { i: 'ac.prp.nt', s: 'bhav' });
      groups[0] = explicit(13, 'Masculine present participle, irregular bhavanta declension', 'm', [
        [['bhavaṃ'], ['bhonto', 'bhontā', 'bhavanto', 'bhavantā']],
        [['bhavaṃ', 'bhava', 'bhavā', 'bhonta', 'bhontā'], ['bhonto', 'bhontā', 'bhavanto', 'bhavantā']],
        [['bhavaṃ', 'bhavantaṃ'], ['bhonte', 'bhavante']],
        [['bhotā', 'bhontena', 'bhavatā', 'bhavantena'], ['bhavantehi', 'bhavantebhi']],
        [['bhavassa', 'bhavato', 'bhavantassa', 'bhoto', 'bhontassa'], ['bhavataṃ', 'bhavantānaṃ']],
        [['bhotā', 'bhavatā', 'bhavantasmā', 'bhavantamhā', 'bhavantā'], ['bhavantehi', 'bhavantebhi']],
        [['bhavassa', 'bhavato', 'bhavantassa', 'bhoto', 'bhontassa'], ['bhavataṃ', 'bhavantānaṃ']],
        [['bhavati', 'bhavantasmiṃ', 'bhavantamhi', 'bhavante'], ['bhavantesu']]
      ]);
      return groups;
    }
    if (!bases[lemma]) return null;
    const groups = group13(lemma, { i: 'ac.prp.nt', s: bases[lemma] });
    if (lemma === 'arahanta') groups[0].rows[0].singular.push('arahā');
    if (lemma === 'mahanta') groups[0].rows[0].singular.push('mahā');
    if (lemma === 'santa') groups[0].rows[1].plural = ['santa', 'santo'];
    return groups;
  }

  // Fully expanded audit catalogue. It deliberately includes examples whose
  // printed teacher tables say "same as ..." so future code can inspect eight
  // concrete rows instead of having to interpret cross-references again.
  const REFERENCE_LEMMAS = Object.freeze([
    'purisa', 'citta', 'kamma', 'kaññā', 'puma', 'yuva', 'addhā', 'rāja',
    'mana', 'vaca', 'vaco', 'bila', 'thāma', 'āpa', 'nadī', 'māṇavī', 'gahapatānī',
    ...SABBANAMA_MEMBERS, 'satthu', 'mātu', 'jetu', 'bhātu', 'pitu',
    'ratti', 'aggi', 'aṭṭhi', 'daṇḍī', 'sukhakārī', 'bhikkhu', 'cakkhu',
    'yāgu', 'sayambhū', 'vadhū', 'gotrabhū', 'go', 'cittago', 'guṇavantu',
    'gacchanta', 'karonta', 'bhavanta', 'santa', 'arahanta', 'mahanta'
  ]);
  const REFERENCE_MORPHOLOGY = Object.freeze({ entries: Object.freeze({
    purisa: Object.freeze([{ r: true, i: 'm.a', s: 'puris' }]),
    citta: Object.freeze([{ r: true, i: 'nt.a', s: 'citt' }]),
    'kaññā': Object.freeze([{ r: true, i: 'f.ā', s: 'kaññ' }]),
    'nadī': Object.freeze([{ r: true, i: 'f.ī', s: 'nad' }]),
    'māṇavī': Object.freeze([{ r: true, i: 'f.ī', s: 'māṇav' }]),
    satthu: Object.freeze([{ r: true, i: 'm.r', s: 'satth' }]),
    mātu: Object.freeze([{ r: true, i: 'f.p', s: 'māt' }])
  }) });

  function paradigm(lemma, morphology) {
    lemma = String(lemma || '').normalize('NFC').toLowerCase();
    const result = (groups, classificationSource = 'Pali Lookup version 2.0') => ({ lemma, groups, formSystem: 'kaccayana', formSource: SOURCE, classificationSource });
    const records = morphology?.entries?.[lemma];
    const record = Array.isArray(records) ? records.find(item => item?.r && item?.s) : null;
    const special4 = specialGroup4(lemma); if (special4) return result([special4], SOURCE);
    const special5 = specialGroup5(lemma); if (special5) return result([special5], SOURCE);
    const special6 = specialGroup6(lemma); if (special6) return result([special6], SOURCE);
    const special6Adi = specialGroup6Adi(lemma); if (special6Adi) return result([special6Adi], SOURCE);
    const special8 = specialGroup8(lemma); if (special8) return result([special8], SOURCE);
    const special9 = specialGroup9(lemma); if (special9) return result(special9, SOURCE);
    const special10 = specialGroup10(lemma); if (special10) return result([special10], SOURCE);
    const special11 = specialGroup11(lemma); if (special11) return result([special11], SOURCE);
    if (lemma === 'guṇavantu') return result(group12({ i: 'adj.v', s: 'guṇav' }), SOURCE);
    const special13 = specialGroup13(lemma); if (special13) return result(special13, SOURCE);
    // Pali Lookup marks kamma as nt.x with no stem, although its nominal
    // paradigm follows the regular neuter a-stem Cittadigana pattern.
    if (lemma === 'kamma') return result([group2(lemma, 'kamm')], SOURCE);
    if (!record) return null;
    let groups = [];
    if (record.i === 'm.a') groups = [group1(lemma, record.s)];
    else if (record.i === 'nt.a') groups = [group2(lemma, record.s)];
    else if (record.i === 'f.ā') groups = [group3(lemma, record.s)];
    else if (record.i === 'adj.a') {
      const masculine = group1(lemma, record.s);
      const feminine = group3(record.s + 'ā', record.s);
      const neuter = group2(lemma, record.s);
      masculine.label = 'Masculine adjective, "a" declension';
      feminine.label = 'Feminine adjective, "ā" declension';
      neuter.label = 'Neuter adjective, "a" declension';
      groups = [masculine, feminine, neuter];
    }
    else if (record.i === 'adj.ī') groups = group11InAdjective(lemma, record.s);
    else if (record.i === 'm.ī') groups = [group11InAdjective(lemma, record.s)[0]];
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

  function expandedReference() {
    const tables = {};
    for (const lemma of REFERENCE_LEMMAS) {
      const table = paradigm(lemma, REFERENCE_MORPHOLOGY);
      if (table?.groups?.length) tables[lemma] = table;
    }
    return tables;
  }

  global.KaccayanaDeclension = Object.freeze({
    VERSION, SOURCE, GROUPS, paradigm, referenceLemmas: REFERENCE_LEMMAS,
    expandedReference
  });
})(window);
