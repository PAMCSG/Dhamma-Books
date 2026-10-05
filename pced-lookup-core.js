/*
 * PAMC shared PCED lookup core
 * Version 3.9.28 — 2026-10-05
 *
 * One resolver is shared by every book. Hosts provide their PCED data and
 * keep their own popup layout. A candidate is accepted only when it is a
 * complete headword in that host's PCED data. No prefix, substring or fuzzy
 * fallback is permitted.
 */
(function (global) {
  'use strict';

  const VERSION = '3.9.28';
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
    'bruhi': Object.freeze(['brūhi']),
    'vīriyindriya': Object.freeze(['viriyindriya'])
  });

  // Verified whole-word inflections that cannot be recovered reliably by a
  // productive suffix rule. Exact complete PCED headwords normally take
  // precedence over this table. A deliberately curated `preferLemma` mapping
  // is the narrow exception: it keeps an attested surface-form entry from
  // hiding its verified lemma analysis.
  const BUILTIN_INFLECTIONS = Object.freeze({
    'rañño': Object.freeze([Object.freeze({
      form: 'rāja', label: 'Rājādigaṇa, genitive/dative singular: of/to the king',
      family: 'verified noun form', preferLemma: true
    })]),
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
    // Both complete forms are verified in a Pāli text. Kaccāyana, Ākhyāta
    // 504 explains the Ajjatanī third-plural -uṃ → -iṃsu ending. Do not invert this
    // spelling for arbitrary verbs: the stem must be established separately.
    'vihariṃsu': Object.freeze([Object.freeze({
      form: 'viharati', label: 'Ajjatanī (aorist), third-person plural',
      family: 'text-attested Kaccāyana verb form', preferLemma: true
    })]),
    'ussahiṃsu': Object.freeze([Object.freeze({
      form: 'ussahati', label: 'Ajjatanī (aorist), third-person plural',
      family: 'text-attested Kaccāyana verb form', preferLemma: true
    })]),
    'agamā': Object.freeze([Object.freeze({ form: 'gacchati', label: 'Hiyyattanī, third-person singular: went', family: 'Kaccāyana verb form', preferLemma: true })]),
    'agamū': Object.freeze([Object.freeze({ form: 'gacchati', label: 'Hiyyattanī, third-person plural: went', family: 'Kaccāyana verb form', preferLemma: true })]),
    'agamī': Object.freeze([Object.freeze({ form: 'gacchati', label: 'Ajjatanī (aorist), third-person singular: went', family: 'Kaccāyana verb form', preferLemma: true })]),
    'agamuṃ': Object.freeze([Object.freeze({ form: 'gacchati', label: 'Ajjatanī (aorist), third-person plural: went', family: 'Kaccāyana verb form', preferLemma: true })]),
    'agacchi': Object.freeze([Object.freeze({ form: 'gacchati', label: 'Ajjatanī (aorist), third-person singular: went', family: 'Kaccāyana verb form', preferLemma: true })]),
    'agacchuṃ': Object.freeze([Object.freeze({ form: 'gacchati', label: 'Ajjatanī (aorist), third-person plural: went', family: 'Kaccāyana verb form', preferLemma: true })])
  });

  // Keep resolver labels unchanged; translate only their display text.
  function localizedAnalysisText(value, language = 'en') {
    const text = String(value || '');
    if (language !== 'zh' || !text) return text;
    const translations = {
      'Rājādigaṇa, genitive/dative singular: of/to the king': 'Rājādigaṇa（王等组），单数属格／与格：王的／给王',
      'verified inflection': '已核实的词形变化',
      'aorist 3rd person plural → present headword': '不定过去时第三人称复数 → 现在时词典原形',
      'dictionary-attested past / aorist form': '词典中有记载的过去时／不定过去时形式',
      'absolutive: having agreed/promised': '独立分词：已经同意／承诺',
      'Hiyyattanī, third-person singular: went': 'Hiyyattanī（过去未完成时），第三人称单数：去了',
      'Hiyyattanī, third-person plural: went': 'Hiyyattanī（过去未完成时），第三人称复数：去了',
      'Ajjatanī (aorist), third-person singular: went': 'Ajjatanī（不定过去时），第三人称单数：去了',
      'Ajjatanī (aorist), third-person plural: went': 'Ajjatanī（不定过去时），第三人称复数：去了',
      'Ajjatanī (aorist), third-person plural': 'Ajjatanī（不定过去时），第三人称复数',
      'Ajjatanī (aorist), third-person plural, passive': 'Ajjatanī（不定过去时），第三人称复数，被动语态',
      'Third-person singular, present active': '现在时主动语态，第三人称单数',
      'Third-person plural, present passive': '现在时被动语态，第三人称复数',
      'Third-person plural, present verb': '现在时动词，第三人称复数',
      'Third-person plural, future verb': '未来时动词，第三人称复数',
      'goes': '去', 'are seen; appear': '被看见；出现',
      'ñc = ṃ + c (niggahīta assimilation)': 'ñc = ṃ + c（鼻音同化）'
    };
    if (translations[text]) return translations[text];
    const caseMatch = text.match(/^(Nominative|Vocative|Accusative|Instrumental|Dative|Ablative|Genitive|Locative) (Singular|Plural)$/i);
    if (caseMatch) {
      const cases = { nominative: '主格', vocative: '呼格', accusative: '宾格', instrumental: '具格',
        dative: '与格', ablative: '从格', genitive: '属格', locative: '处格' };
      return (caseMatch[2].toLowerCase() === 'singular' ? '单数' : '复数') + cases[caseMatch[1].toLowerCase()];
    }
    const verbMatch = text.match(/^third-person plural, (present|future)$/i);
    if (verbMatch) return (verbMatch[1].toLowerCase() === 'future' ? '未来时' : '现在时') + '，第三人称复数';
    if (/^-[a-zāīūṅñṭḍṇḷṃ]+ → (?:-[a-zāīūṅñṭḍṇḷṃ]+|PCED citation -[a-zāīūṅñṭḍṇḷṃ]+)$/iu.test(text)) {
      return '词尾变化：' + text.replace('PCED citation', 'PCED 词典原形');
    }
    return text;
  }

  function localizedVerbGroupLabel(label, language = 'en') {
    const value = String(label || '');
    if (language !== 'zh') return value;
    if (value.endsWith(' (endings only)')) return localizedVerbGroupLabel(value.slice(0, -15), language) + '（仅词尾）';
    const labels = {
      'Present (Vattamānā)': '现在时（Vattamānā）',
      'Parokkhā': '未亲见过去时（Parokkhā）',
      'Hiyyattanī': '过去未完成时（Hiyyattanī）',
      'Ajjatanī': '不定过去时（Ajjatanī）',
      'Kālātipatti': '未实现条件式（Kālātipatti）',
      'Present: 3sg, 3pl, 2sg, 2pl, 1sg, 1pl': '现在时：第三人称单数、复数；第二人称单数、复数；第一人称单数、复数',
      'Present (Vattamānā): 3sg, 3pl, 2sg, 2pl, 1sg, 1pl': '现在时（Vattamānā）：第三人称单数、复数；第二人称单数、复数；第一人称单数、复数',
      'Past imperfect (Hiyyattanī)': '过去未完成时（Hiyyattanī）',
      'Aorist / recent past (Ajjatanī)': '不定过去时（Ajjatanī）',
      'Ajjatanī / Aorist (dictionary-attested)': '不定过去时（Ajjatanī；PCED 词典记载）',
      'Ajjatanī / Aorist (regular possibilities from verb table)': '不定过去时（Ajjatanī；依动词表推算的可能词形）',
      'Ajjatanī / Aorist (uploaded verb table)': '不定过去时（Ajjatanī；所提供的动词表）',
      'Past forms recorded in PCED': 'PCED 词典记载的过去时词形',
      'Imperative': '命令式',
      'Imperative (Pañcamī)': '命令式（Pañcamī）',
      'Optative': '祈愿式',
      'Optative (Sattamī)': '祈愿式（Sattamī）',
      'Future': '未来时',
      'Future (Bhavissanti)': '未来时（Bhavissanti）',
      'Present participle': '现在分词',
      'Passive present (regular possibilities from verb table)': '现在时被动语态（依动词表推算的可能词形）',
      'Absolutive / gerund': '独立分词／动名词',
      'Infinitive': '不定式',
      'Absolutive / infinitive': '独立分词／不定式'
    };
    return labels[value] || value;
  }

  const VERB_PERSON_LABELS = Object.freeze({
    thirdSingular: Object.freeze({ en: 'Third person singular', zh: '第三人称单数' }),
    thirdPlural: Object.freeze({ en: 'Third person plural', zh: '第三人称复数' }),
    secondSingular: Object.freeze({ en: 'Second person singular', zh: '第二人称单数' }),
    secondPlural: Object.freeze({ en: 'Second person plural', zh: '第二人称复数' }),
    firstSingular: Object.freeze({ en: 'First person singular', zh: '第一人称单数' }),
    firstPlural: Object.freeze({ en: 'First person plural', zh: '第一人称复数' }),
    other: Object.freeze({ en: 'Other PCED past citations', zh: '其他 PCED 词典记载的过去时词形' })
  });
  function localizedVerbPersonLabel(person, language = 'en') {
    return VERB_PERSON_LABELS[person]?.[language === 'zh' ? 'zh' : 'en'] || person;
  }

  // These complete PCED headwords are absent from the reduced web extract but
  // are present in PCED 2.0.5.0 or the project's verified Inflection Master.
  // Keep them as exact headwords, never unrelated substring results.
  const BUILTIN_EXACT_HEADWORDS = Object.freeze({
    // Original PCED 2.0.5 records restored from the official pali-h/cidian
    // (blob 03444838c76cb59c7b60d2097b4bcc6783d34b48). Preserve all homographs.
    "vacati": {"headword": "vacati", "zh": [], "en": [], "my": [{"source": "B", "source_label": "Pali Word Grammar from Pali Myanmar Dictionary", "headword": "vacati", "definition": "vacati(kri)<br>  ဝစတိ(ကြိ)<br>  «vaca+a+ti. nīti, dhātu. 31. vatti-saṃ. vaccai, vayai, vaai-prā, addhamāgadhi.»<br>  [ဝစ+အ+တိ။ နီတိ၊ ဓာတု။ ၃၁။ ဝတ္တိ-သံ။ ဝစ္စဣ၊ ဝယဣ၊ ဝအဣ-ပြာ၊ အဒ္ဓမာဂဓိ။]"}, {"source": "K", "source_label": "Tipiṭaka Pāḷi-Myanmar Dictionary တိပိဋက-ပါဠိမြန်မာ အဘိဓာန်", "headword": "vacati", "definition": "ဝစတိ(ကြိ)<br>  [ဝစ+အ+တိ။ နီတိ၊ ဓာတု။ ၃၁။ ဝတ္တိ-သံ။ ဝစ္စဣ၊ ဝယဣ၊ ဝအဣ-ပြာ၊ အဒ္ဓမာဂဓိ။]<br>  (၁) ပြော-ဟော-ဆို-၏။ ဝတ္တီ-လည်းကြည့်။ (၂) တင့်တယ်၏။"}, {"source": "R", "source_label": "U Hau Sein’s Pāḷi-Myanmar Dictionary ပါဠိမြန်မာ အဘိဓာန်(ဦးဟုတ်စိန်)", "headword": "vacati", "definition": "ဝစတိ\t (√ဝစ်)<br>ဆို၏။"}], "vi": [], "other": []},
    "vatti": {"headword": "vatti", "zh": [], "en": [{"source": "C", "source_label": "Concise Pali-English Dictionary by A.P. Buddhadatta Mahathera", "headword": "vatti", "definition": "[aor. of vattati] existed; happened; took place; went on."}, {"source": "P", "source_label": "PTS Pali-English dictionary The Pali Text Society’s Pali-English dictionary", "headword": "vatti", "definition": "[Vedic vakti, <em>vac</em>] to speak, say, call; pres. not found (for which vadati); fut. 1<sup>st</sup> sg. <i>vakkhāmi</i> J.I,346; 3<sup>rd</sup> <i>vakkhati</i> S.I,142; J.I,356; II,40; VI,352; VbhA.51; 1<sup>st</sup> pl. <i>vakkhāma</i> S.IV,72; M.III,207; Vism.170, 446; 3<sup>rd</sup> <i>vakkhanti</i> Vin.II,1; pte. fut. <i>vakkhamāna</i> PvA.18. -- aor. 1<sup>st</sup> sg. <i>avacaṁ</i> J.III,280; DhA.III,194, & <i>avocaṁ</i> Th.2, 124; Vv 79<sup>7</sup>; S.I,10; DhA.III,285; 2<sup>nd</sup> <i>avaca</i> Th.2, 415, <i>avoca</i> Dh.133, & <i>avacāsi</i> Vv 35<sup>7</sup>; 53<sup>9</sup>; 3<sup>rd</sup> <i>avaca</i> J.I,294; Pv.II,3<sup>19</sup>; PvA.65 (mā a.); <i>avoca</i> Th.2, 494; S.I,150; Sn.p. 78; J.II,160; PvA.6, 31, 49, & <i>avacāsi</i> J.VI,525; 1<sup>st</sup> pl. <i>avacumha </i>&<i> avocumha</i> M.II,91; III,15; 2<sup>nd</sup> <i>avacuttha</i> Vin.I,75 (mā a.); II,297; J.II,48; DhA.I,73; IV,228, & <i>avocuttha</i> J.I,176; Miln.9; 3<sup>rd</sup> pl. <i>avacuṁ</i> J.V,260, & <i>avocuṁ</i> M.II,147. -- inf. <i>vattuṁ</i> Sn.431; J.VI,351; Vism.522=VbhA.130 (vattukāma); SnA 414; DA.I,109; DhA.I,329; II,5. -- ger. <i>vatvā</i> SnA 398; PvA.68, 73, & <i>vatvāna</i> Sn.p. 78. ‹-› grd. <i>vattabba</i> Miln.276 (kiṁ vattabbaṁ what is there to be said about it? i. e. it goes without saying); SnA 123, 174, 178; PvA.12, 27, 92. -- ppr. med. <i>vuccamāna</i> Vin.I,60; III,221; PvA.13. -- Pass. <i>vuccati</i> D.I,168, 245; Dh.63; Mhvs 9, 9; 34, 81 (vuccate, v. l. uccate); J.I,129 (vuccare, 3<sup>rd</sup> pl.); PvA.24, 34, 63, 76; -- pp. <i>vutta</i> (q. v.). -- Caus. <i>vāceti</i> to make speak, i. e. to read out; to cause to read; also to teach, to instruct Sn.1018, 1020; J.I,452 (read); PvA.97. -- pp. <i>vācita</i> (q. v.). ‹-› Desid. <i>vavakkhati</i> (see Geiger, P.Gr. § 184=Sk. vivakṣati) to wish to call D.II,256.  <i>Vattika=vatika</i> Nd<sup>1</sup> 89 (having the habit of horses, elephants etc.). (Page 598)"}, {"source": "I", "source_label": "Pali-Dictionary Vipassana Research Institute", "headword": "vatti", "definition": "To speak, to say; to speak to, address"}], "my": [{"source": "B", "source_label": "Pali Word Grammar from Pali Myanmar Dictionary", "headword": "vatti", "definition": "vatti(kri)<br>  ဝတ္တိ(ကြိ)<br>  «vatu(vattu)+ī»<br>  [ဝတု(ဝတ္တု)+ဤ]"}, {"source": "B", "source_label": "Pali Word Grammar from Pali Myanmar Dictionary", "headword": "vatti", "definition": "vatti(kri)<br>  ဝတ္တိ(ကြိ)<br>  «vatu(vattu)+ṇe+ī. curādi. nīti,dhātu.3va9.»<br>  [ဝတု(ဝတ္တု)+ဏေ+ဤ။ စုရာဒိ။ နီတိ၊ဓာတု။၃ဝ၉။]"}, {"source": "B", "source_label": "Pali Word Grammar from Pali Myanmar Dictionary", "headword": "vatti", "definition": "vatti(kri)<br>  ဝတ္တိ(ကြိ)<br>  «vaca+ti. vattītivadati. nīti, dhātu,31. nipātanaca-ta-pru. ī asārattha, 3. 2-nitea vattietāyātivācāhu saddanīticharā nitea rhilerā.»<br>  [ဝစ+တိ။ ဝတ္တီတိဝဒတိ။ နီတိ၊ ဓာတု၊၃၁။ နိပါတနသုတ်ဖြင့်စ-ကိုတ-ပြု။ ဤ အလိုသာရတ္ထ၊ ၃။ ၂-၌ ဝတ္တိဧတာယာတိဝါစာဟု သဒ္ဒနီတိဆရာတော်တို့ လက်ထက်၌ ပါဌ်ရှိလေရာသည်။]"}, {"source": "K", "source_label": "Tipiṭaka Pāḷi-Myanmar Dictionary တိပိဋက-ပါဠိမြန်မာ အဘိဓာန်", "headword": "vatti", "definition": "ဝတ္တိ(ကြိ)<br>  [ဝစ+တိ။ ဝတ္တီတိဝဒတိ။ နီတိ၊ ဓာတု၊၃၁။ နိပါတနသုတ်ဖြင့်စ-ကိုတ-ပြု။ ဤ အလိုသာရတ္ထ၊ ၃။ ၂-၌ ဝတ္တိဧတာယာတိဝါစာဟု သဒ္ဒနီတိဆရာတော်တို့ လက်ထက်၌ ပါဌ်ရှိလေရာသည်။]<br>  ပြော-ဆို-၏။"}, {"source": "K", "source_label": "Tipiṭaka Pāḷi-Myanmar Dictionary တိပိဋက-ပါဠိမြန်မာ အဘိဓာန်", "headword": "vatti", "definition": "ဝတ္တိ(ကြိ)<br>  [ဝတု(ဝတ္တု)+ဏေ+ဤ။ စုရာဒိ။ နီတိ၊ဓာတု။၃ဝ၉။]<br>  ဟော-ဆို-ပြီ။"}, {"source": "K", "source_label": "Tipiṭaka Pāḷi-Myanmar Dictionary တိပိဋက-ပါဠိမြန်မာ အဘိဓာန်", "headword": "vatti", "definition": "ဝတ္တိ(ကြိ)<br>  [ဝတု(ဝတ္တု)+ဤ]<br>  (၁) ဖြစ်ပြီ။ (၂) ကျင့်-ဖြည့်ကျင့်-ပြီ။"}, {"source": "R", "source_label": "U Hau Sein’s Pāḷi-Myanmar Dictionary ပါဠိမြန်မာ အဘိဓာန်(ဦးဟုတ်စိန်)", "headword": "vatti", "definition": "ဝတ္တိ\t(ဣ) <br>နံ့သာပျောင်း။"}], "vi": [], "other": [{"source": "L", "source_label": "빨한 P.T.S. 사전 — Korean PTS dictionary", "headword": "vatti", "definition": "[Vedic vakti, vac] 발설하다, 말하다, 부르다; 과거형은 발견되지 않음 (for which vadati); fut. 1st sg. vakkhāmi J I.346; 3rd vakkhati S I.142; J I.356; II.40; VI.352; VbhA 51; 1st pl. vakkhāma S IV.72; M III.207; Vism 170, 446; 3rd vakkhanti Vin II.1; pte. fut. vakkhamāna PvA 18. -- aor. 1st sg. avacaṃ J III.280; DhA III.194, & avocaṃ Th 2, 124; Vv 797; S I.10; DhA III.285; 2nd avaca Th 2, 415, avoca Dh 133, & avacāsi Vv 357; 539; 3rd avaca J I.294; Pv II.319; PvA 65 (mā a.); avoca Th 2, 494; S I.150; Sn p. 78; J II.160; PvA 6, 31, 49, & avacāsi J VI.525; 1st pl. avacumha & avocumha M II.91; III.15; 2nd avacuttha Vin I.75 (mā a.); II.297; J II.48; DhA I.73; IV.228, & avocuttha J I.176; Miln 9; 3rd pl. avacuṃ J V.260, & avocuṃ M II.147. -- inf. vattuṃ Sn 431; J VI.351; Vism 522=VbhA 130 (vattukāma); SnA 414; DA I.109; DhA I.329; II.5. -- ger. vatvā SnA 398; PvA 68, 73, & vatvāna Sn p. 78. ‹-› grd. vattabba Miln 276 (kiṃ vattabbaṃ 그것에 관해 말할 것이 무에 있는가? 즉 그것은 말 없이 지나간다); SnA 123, 174, 178; PvA 12, 27, 92. -- ppr. med. vuccamāna Vin I.60; III.221; PvA 13. -- Pass. vuccati D I.168, 245; Dh 63; Mhvs 9, 9; 34, 81 (vuccate, v. l. uccate); J I.129 (vuccare, 3rd pl.); PvA 24, 34, 63, 76; -- pp. vutta (q. v.). -- Caus. vāceti 말하게 하다, 즉 소리내어 읽다; 읽게 g다; 가르치다, 지시하다 Sn 1018, 1020; J I.452 (read); PvA 97. -- pp. vācita (q. v.). ‹-› Desid. vavakkhati (see Geiger, P.Gr. § 184=Sk. vivakṣati) 부르고 싶어하다 D II.256. Nd1 89 (말, 코끼리 등의 습관이 있는.)."}]},

    // PCED 2.0.5.0 has brūhi as its own entry in both Myanmar sources.
    // Do not redirect the exact headword to the related verb brūti.
    'brūhi': Object.freeze({
      headword: 'brūhi', zh: Object.freeze([]), en: Object.freeze([]),
      my: Object.freeze([
        Object.freeze({
          source: 'B', source_label: 'Pali Word Grammar from Pali Myanmar Dictionary',
          definition: 'brūhi (ကြိ) [brū+a+hi] [ဗြူ+အ+ဟိ]'
        }),
        Object.freeze({
          source: 'K', source_label: 'Tipiṭaka Pāḷi-Myanmar Dictionary တိပိဋက-ပါဠိမြန်မာ အဘိဓာန်',
          definition: 'brūhi — ဆိုလော၊ ဟောတော်မူပါလော။ ဗြဝီတိ-ကြည့်။'
        })
      ]), vi: Object.freeze([]), other: Object.freeze([])
    }),
    jetu: Object.freeze({
      headword: 'jetu', zh: Object.freeze([]),
      en: Object.freeze([Object.freeze({
        source: 'M', source_label: 'PCED Inflection Master v1.5 — verified PCED headword',
        definition: '[m.] victor; conqueror.', headword: 'jetu'
      })]), my: Object.freeze([]), vi: Object.freeze([]), other: Object.freeze([])
    }),
    'bhātu': Object.freeze({
      headword: 'bhātu', zh: Object.freeze([]), en: Object.freeze([Object.freeze({
        source: 'P', source_label: 'PCED verified relationship-noun headword',
        definition: '[m.] brother; a member of the bhātu / bhātar relationship-noun family.', headword: 'bhātu'
      })]), my: Object.freeze([]), vi: Object.freeze([]), other: Object.freeze([])
    }),
    pitu: Object.freeze({
      headword: 'pitu', zh: Object.freeze([]), en: Object.freeze([Object.freeze({
        source: 'P', source_label: 'PCED verified relationship-noun headword',
        definition: '[m.] father; a member of the pitu / pitar relationship-noun family.', headword: 'pitu'
      })]), my: Object.freeze([]), vi: Object.freeze([]), other: Object.freeze([])
    })
  });

  // Kaccāyana-confirmed forms of gamu (to go). Past systems cannot be
  // recovered safely from a present-tense ending alone, so irregular and
  // historically transformed forms are maintained as complete-word families.
  // Sources: Kaccāyana Pāli Vyākaraṇaṁ §§418–419, 476, 517, 519.
  const KACCAYANA_VERB_PARADIGMS = Object.freeze({
    'gacchati': Object.freeze([
      Object.freeze({ label: 'Present (Vattamānā): 3sg, 3pl, 2sg, 2pl, 1sg, 1pl', persons: Object.freeze([
        { person: 'thirdSingular', forms: ['gacchati', 'gacche'] }, { person: 'thirdPlural', forms: ['gacchanti', 'gacchare'] },
        { person: 'secondSingular', forms: ['gacchasi'] }, { person: 'secondPlural', forms: ['gacchatha'] },
        { person: 'firstSingular', forms: ['gacchāmi', 'gacche'] }, { person: 'firstPlural', forms: ['gacchāma'] }
      ]) }),
      Object.freeze({ label: 'Past imperfect (Hiyyattanī)', persons: Object.freeze([
        { person: 'thirdSingular', forms: ['agamā', 'agacchā', 'gacchā', 'agaccha', 'gaccha'] },
        { person: 'thirdPlural', forms: ['agamū', 'agacchū', 'gacchū', 'agacchu', 'gacchu'] },
        { person: 'secondSingular', forms: ['agaccho', 'gaccho', 'agaccha', 'gaccha', 'agacchi', 'gacchi'] },
        { person: 'secondPlural', forms: ['agacchattha', 'gacchattha', 'agacchatha', 'gacchatha'] },
        { person: 'firstSingular', forms: ['agacchaṃ', 'gacchaṃ'] },
        { person: 'firstPlural', forms: ['agacchamhā', 'gacchamhā'] }
      ]) }),
      Object.freeze({ label: 'Aorist / recent past (Ajjatanī)', persons: Object.freeze([
        Object.freeze({ person: 'thirdSingular', forms: Object.freeze(['agamī', 'agacchī', 'gacchī', 'agacchi', 'gacchi']) }),
        Object.freeze({ person: 'thirdPlural', forms: Object.freeze(['agamuṃ', 'agacchuṃ', 'gacchuṃ', 'agacchiṃsu', 'gacchiṃsu']) }),
        Object.freeze({ person: 'secondSingular', forms: Object.freeze(['agaccho', 'gaccho', 'agaccha', 'gaccha', 'agacchi', 'gacchi']) }),
        Object.freeze({ person: 'secondPlural', forms: Object.freeze(['agacchittha', 'gacchittha']) }),
        Object.freeze({ person: 'firstSingular', forms: Object.freeze(['agacchiṃ', 'gacchiṃ']) }),
        Object.freeze({ person: 'firstPlural', forms: Object.freeze(['agacchimhā', 'gacchimhā', 'agacchimha', 'gacchimha']) })
      ]) }),
      Object.freeze({ label: 'Imperative (Pañcamī)', persons: Object.freeze([
        { person: 'thirdSingular', forms: ['gacchatu', 'gacche'] }, { person: 'thirdPlural', forms: ['gacchantu'] },
        { person: 'secondSingular', forms: ['gacchāhi', 'gaccha', 'gacchassu'] }, { person: 'secondPlural', forms: ['gacchatha'] },
        { person: 'firstSingular', forms: ['gacchāmi', 'gacche'] }, { person: 'firstPlural', forms: ['gacchāma'] }
      ]) }),
      Object.freeze({ label: 'Optative (Sattamī)', persons: Object.freeze([
        { person: 'thirdSingular', forms: ['gaccheyya', 'gacche'] }, { person: 'thirdPlural', forms: ['gaccheyyuṃ'] },
        { person: 'secondSingular', forms: ['gaccheyyāsi', 'gacche'] }, { person: 'secondPlural', forms: ['gaccheyyātha'] },
        { person: 'firstSingular', forms: ['gaccheyyāmi', 'gacche'] }, { person: 'firstPlural', forms: ['gaccheyyāma'] }
      ]) }),
      Object.freeze({ label: 'Future (Bhavissanti)', persons: Object.freeze([
        { person: 'thirdSingular', forms: ['gacchissati'] }, { person: 'thirdPlural', forms: ['gacchissanti', 'gacchissare'] },
        { person: 'secondSingular', forms: ['gacchissasi'] }, { person: 'secondPlural', forms: ['gacchissatha'] },
        { person: 'firstSingular', forms: ['gacchissāmi'] }, { person: 'firstPlural', forms: ['gacchissāma'] }
      ]) })
    ])
  });

  // The asterisks on printed pp. 602–606 mark departures from the
  // ordinary vibhatti endings. Keep the lookup forms unadorned and add the
  // mark only to the Kaccāyana source display, so searches still use Pāli words.
  const KACCAYANA_STARRED_GACCHATI = new Set([
    'gacche', 'gacchare', 'gaccha', 'gacchassu',
    'agaccha', 'agacchu', 'gacchu', 'agacchi', 'gacchi',
    'agacchatha', 'agacchiṃsu', 'gacchiṃsu',
    'agacchimha', 'gacchimha', 'gacchissare'
  ]);

  // These forms are individually verified. Rule 504 accounts for the third-plural
  // ending; the complete stems are checked against the text and PCED lemmas.
  const TEXT_ATTESTED_AORIST_PLURAL = Object.freeze({
    viharati: 'vihariṃsu',
    ussahati: 'ussahiṃsu'
  });

  // Complete exceptional paradigms transcribed from the user's
  // "02 Pali Grammar table - Verbs.pdf", pp. 5–6. Its hoti rows misplace
  // some pronouns; the listed forms are ordered by person without pronouns.
  // Do not apply the regular -oti template to hoti: it produces false forms.
  const VERB_TABLE_EXCEPTIONS = Object.freeze({
    hoti: Object.freeze([
      Object.freeze({ label: 'Present: 3sg, 3pl, 2sg, 2pl, 1sg, 1pl', persons: Object.freeze([
        { person: 'thirdSingular', forms: ['hoti'] }, { person: 'thirdPlural', forms: ['honti'] },
        { person: 'secondSingular', forms: ['hosi'] }, { person: 'secondPlural', forms: ['hottha'] },
        { person: 'firstSingular', forms: ['homi'] }, { person: 'firstPlural', forms: ['homa'] }
      ]) }),
      Object.freeze({ label: 'Ajjatanī / Aorist (uploaded verb table)', persons: Object.freeze([
        Object.freeze({ person: 'thirdSingular', forms: Object.freeze(['ahosi']) }),
        Object.freeze({ person: 'thirdPlural', forms: Object.freeze(['ahesuṃ']) }),
        Object.freeze({ person: 'secondSingular', forms: Object.freeze(['ahuvā', 'ahosi']) }),
        Object.freeze({ person: 'secondPlural', forms: Object.freeze(['ahuvattha', 'ahusittha']) }),
        Object.freeze({ person: 'firstSingular', forms: Object.freeze(['ahosiṃ', 'ahuṃ']) }),
        Object.freeze({ person: 'firstPlural', forms: Object.freeze(['ahosimha', 'ahumha']) })
      ]) }),
      Object.freeze({ label: 'Imperative', persons: Object.freeze([
        { person: 'thirdSingular', forms: ['hotu'] }, { person: 'thirdPlural', forms: ['hontu'] },
        { person: 'secondSingular', forms: ['hohi'] }, { person: 'secondPlural', forms: ['hotha'] },
        { person: 'firstSingular', forms: ['homi'] }, { person: 'firstPlural', forms: ['homa'] }
      ]) })
    ]),
    atthi: Object.freeze([
      Object.freeze({ label: 'Present: 3sg, 3pl, 2sg, 2pl, 1sg, 1pl', persons: Object.freeze([
        { person: 'thirdSingular', forms: ['atthi'] }, { person: 'thirdPlural', forms: ['santi'] },
        { person: 'secondSingular', forms: ['asi'] }, { person: 'secondPlural', forms: ['attha'] },
        { person: 'firstSingular', forms: ['asmi', 'amhi'] }, { person: 'firstPlural', forms: ['asma', 'amha'] }
      ]) })
    ]),
    brūti: Object.freeze([
      Object.freeze({ label: 'Present: 3sg, 3pl, 2sg, 2pl, 1sg, 1pl', persons: Object.freeze([
        { person: 'thirdSingular', forms: ['brūti'] }, { person: 'thirdPlural', forms: ['brūvanti'] },
        { person: 'secondSingular', forms: ['brūsi'] }, { person: 'secondPlural', forms: ['brūtha'] },
        { person: 'firstSingular', forms: ['brūmi'] }, { person: 'firstPlural', forms: ['brūma'] }
      ]) })
    ]),
    hanti: Object.freeze([
      Object.freeze({ label: 'Present: 3sg, 3pl, 2sg, 2pl, 1sg, 1pl', persons: Object.freeze([
        { person: 'thirdSingular', forms: ['hanati', 'hanti'] }, { person: 'thirdPlural', forms: ['hananti'] },
        { person: 'secondSingular', forms: ['hanasi'] }, { person: 'secondPlural', forms: ['hanatha'] },
        { person: 'firstSingular', forms: ['hanāmi'] }, { person: 'firstPlural', forms: ['hanāma'] }
      ]) })
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

  // PCED's [brū+a+hi] is a verbal formation, not a compound of brū and hi.
  // Keep the exact brūhi record visible while explaining its imperative form.
  const EXACT_VERB_FORMS = Object.freeze({
    'modataṃ': Object.freeze({
      lemma: 'modati', label: 'Third-person singular imperative, Attanopada (Pañcamī)',
      labelZh: '命令式（Pañcamī）· 自言（Attanopada）· 第三人称单数',
      meaning: 'let him rejoice; may you rejoice (respectful address)',
      meaningZh: '愿他欢喜；愿您欢喜（尊称用法）',
      formation: 'moda + taṃ; PCED root formula: mud + a + taṃ',
      formationZh: 'moda + taṃ；PCED 词根构成：mud + a + taṃ',
      sourceNote: 'PCED Myanmar grammar entry; -taṃ is the third-person singular Attanopada imperative ending.',
      sourceNoteZh: '依据 PCED 缅文语法条目；-taṃ 是自言命令式第三人称单数词尾。'
    }),
    'yajataṃ': Object.freeze({
      lemma: 'yajati', label: 'Third-person singular imperative, Attanopada (Pañcamī)',
      labelZh: '命令式（Pañcamī）· 自言（Attanopada）· 第三人称单数',
      meaning: 'let him perform the sacrifice; please perform the sacrifice (respectful address)',
      meaningZh: '愿他举行祭祀；请您举行祭祀（尊称用法）',
      formation: 'yaja + taṃ; PCED root formula: yaj + a + taṃ',
      formationZh: 'yaja + taṃ；PCED 词根构成：yaj + a + taṃ',
      sourceNote: 'PCED Myanmar grammar entry; -taṃ is the third-person singular Attanopada imperative ending.',
      sourceNoteZh: '依据 PCED 缅文语法条目；-taṃ 是自言命令式第三人称单数词尾。'
    }),
    'brūhi': Object.freeze({
      lemma: 'brūti', label: 'Second-person singular imperative of √brū',
      labelZh: '√brū 的命令式第二人称单数',
      meaning: 'say!; tell!', meaningZh: '说吧；请说',
      formation: 'brū + a + hi (PCED Myanmar grammar)',
      formationZh: 'brū + a + hi（PCED 缅文语法条目）',
      sourceNote: 'Compare the present forms brūti and bravīti.',
      sourceNoteZh: '参见现在时词形 brūti 和 bravīti。'
    })
  });

  // Original, complete records from official PCED 2.0.5 cidian
  // (blob 03444838c76cb59c7b60d2097b4bcc6783d34b48). Reduced web data
  // can already contain the headword but omit its English/source records.
  const RESTORED_SOURCE_ENTRIES = Object.freeze({"haññi":{"headword":"haññi","zh":[],"en":[{"source":"C","source_label":"Concise Pali-English Dictionary by A.P. Buddhadatta Mahathera","headword":"haññi","definition":"[aor. of haññati] was killed."}],"my":[{"source":"R","source_label":"U Hau Sein’s Pāḷi-Myanmar Dictionary ပါဠိမြန်မာ အဘိဓာန်(ဦးဟုတ်စိန်)","headword":"haññi","definition":"ဟညိ"}],"vi":[],"other":[]},"lūyiṃsu":{"headword":"lūyiṃsu","zh":[],"en":[],"my":[{"source":"B","source_label":"Pali Word Grammar from Pali Myanmar Dictionary","headword":"lūyiṃsu","definition":"lūyiṃsu(kamma,kri)<br>  လူယိံသု(ကမ္မ၊ကြိ)<br>  [ū+ya+uī]<br>  [လူ+ယ+ဦ]"},{"source":"K","source_label":"Tipiṭaka Pāḷi-Myanmar Dictionary တိပိဋက-ပါဠိမြန်မာ အဘိဓာန်","headword":"lūyiṃsu","definition":"လူယိံသု(ကမ္မ၊ကြိ)<br>  [လူ+ယ+ဦ]<br>  ရိတ်-ဖြတ်-ပယ်-နုတ်-အပ်ကုန်ပြီ။"}],"vi":[],"other":[]},"chijji":{"headword":"chijji","zh":[],"en":[{"source":"C","source_label":"Concise Pali-English Dictionary by A.P. Buddhadatta Mahathera","headword":"chijji","definition":"[aor. of chijjati] was broken."}],"my":[{"source":"B","source_label":"Pali Word Grammar from Pali Myanmar Dictionary","headword":"chijji","definition":"chijji(kri)<br>  ဆိဇ္ဇိ(ကြိ)<br>  [chidi+ya+ī]<br>  [ဆိဒိ+ယ+ဤ]"},{"source":"K","source_label":"Tipiṭaka Pāḷi-Myanmar Dictionary တိပိဋက-ပါဠိမြန်မာ အဘိဓာန်","headword":"chijji","definition":"\"ဆိဇ္ဇိ\t(ကြိ)<br>  [ဆိဒိ+ယ+ဤ]<br>  (က) ပြတ်ပြီ။ (ခ) ပြတ်-ရှ-ကွဲ-ပြီ။ (ဂ) ပြတ်-ကုန်-ခန်း-ပြီ။ (ဃ) စုတ်-ပြတ်-ပြီ။ (င) ပြတ်-စဲ-ရပ်-တိတ်-ဆိတ်-ငြိမ်သက်-ပြီ။ ဆိဇ္ဇတိ-(၁)-ကြည့်။\""},{"source":"R","source_label":"U Hau Sein’s Pāḷi-Myanmar Dictionary ပါဠိမြန်မာ အဘိဓာန်(ဦးဟုတ်စိန်)","headword":"chijji","definition":"ဆိဇ္ဇိ"}],"vi":[],"other":[]},"haññati":{"headword":"haññati","zh":[{"source":"D","source_label":"《巴汉词典》Mahāñāṇo Bhikkhu编著","headword":"haññati","definition":"(han + ya), 被杀，被破坏。 【过】 haññi。 【现分】 haññamāna。(p355)"},{"source":"F","source_label":"《巴汉词典》明法比丘增订","headword":"haññati","definition":"(han+ya), 被杀，被破坏。【过】haññi。【现分】haññamāna。S.42.3./IV,309.︰‘Ime sattā haññantu vā bajjhantu vā ucchijjantu vā vinassantu vā mā ahesuṁ iti vā’ti.(这些有情，当杀！当捕！当斩！当灭！勿使存在。)"}],"en":[{"source":"C","source_label":"Concise Pali-English Dictionary by A.P. Buddhadatta Mahathera","headword":"haññati","definition":"[han + ya] is killed or destroyed haññana : [nt.] torture; distress; killing."},{"source":"P","source_label":"PTS Pali-English dictionary The Pali Text Society's Pali-English dictionary","headword":"haññati","definition":"& hañchati see <i>hanati</i>. (Page 727)"}],"my":[{"source":"R","source_label":"U Hau Sein’s Pāḷi-Myanmar Dictionary ပါဠိမြန်မာ အဘိဓာန်(ဦးဟုတ်စိန်)","headword":"haññati","definition":"ဟညတိ\t (ကမ္မ) (√ဟန်+ယ)<br>သတ်အပ်၏။ ညှဉ်းဆဲအပ်၏။ သတ်ပုတ်အပ်၏။ နှိပ်စက်အပ်၏။"}],"vi":[{"source":"U","source_label":"Pali Viet Dictionary  Bản dịch của ngài Bửu Chơn.","headword":"haññati","definition":"(han+ya) bị giết chết hay bị phá hủy [aor] haññi [prp] hañña, --māna"},{"source":"E","source_label":"Pali Viet Abhidhamma Terms  Từ điển các thuật ngữ Vô Tỷ Pháp của ngài Tịnh Sự, được chép từ phần ghi chú thuật ngữ trong các bản dịch của ngài.","headword":"haññati","definition":"bị làm hại, bị thương tổn"}],"other":[{"source":"L","source_label":"빨한 P.T.S. 사전- 선운사대학원용 (박경숙 박사님 초역; 2013년 1월 편집: 빅쿠 재연, 환성, 성륜, 성각, 진일, 법이, 원경, 대산, 보적, 무진, 원우;  2014년 1월 빅쿠원우교열) words:16233.","headword":"haññati","definition":"& hañchati see hanati."}]},"chijjati":{"headword":"chijjati","zh":[{"source":"D","source_label":"《巴汉词典》Mahāñāṇo Bhikkhu编著","headword":"chijjati","definition":"(chindati 的【被】), 被切割，被打破，被切断。 【过】 chijji。 【现分】 chijjanta, chijjamāna。 【独】 chijjitvā, chijjiya。(p131)"},{"source":"F","source_label":"《巴汉词典》明法比丘增订","headword":"chijjati","definition":"(chindati 的【被】), 被切割，被打破，被切断。【过】chijji。【现分】chijjanta, chijjamāna。【独】chijjitvā, chijjiya。"}],"en":[{"source":"C","source_label":"Concise Pali-English Dictionary by A.P. Buddhadatta Mahathera","headword":"chijjati","definition":"[pass. of chindati] is cut, broken or severed."},{"source":"I","source_label":"Pali-Dictionary Vipassana Research Institute","headword":"chijjati","definition":"see <i>chindati</i>"}],"my":[{"source":"B","source_label":"Pali Word Grammar from Pali Myanmar Dictionary","headword":"chijjati","definition":"chijjati(kri)<br>  ဆိဇ္ဇတိ(ကြိ)<br>  [chidi+ya+ti]<br>  [ဆိဒိ+ယ+တိ]"},{"source":"B","source_label":"Pali Word Grammar from Pali Myanmar Dictionary","headword":"chijjati","definition":"chijjati(kamma,kri)<br>  ဆိဇ္ဇတိ(ကမ္မ၊ကြိ)<br>  [chidi+ya+te. te- ti-pru.]<br>  [ဆိဒိ+ယ+တေ။ တေ-ကို တိ-ပြု။]"},{"source":"K","source_label":"Tipiṭaka Pāḷi-Myanmar Dictionary တိပိဋက-ပါဠိမြန်မာ အဘိဓာန်","headword":"chijjati","definition":"\"ဆိဇ္ဇတိ\t(ကမ္မ၊ကြိ)<br>  [ဆိဒိ+ယ+တေ။ တေ-ကို တိ-ပြု။]<br>  (က) ဖြတ်အပ်၏။ (ခဝ ပယ်-ဖြတ်-အပ်၏။ (ဂ) ခုတ်ဖြတ်-ပိုင်းဖြတ်-လှီးဖြတ်-အပ်၏။\""},{"source":"K","source_label":"Tipiṭaka Pāḷi-Myanmar Dictionary တိပိဋက-ပါဠိမြန်မာ အဘိဓာန်","headword":"chijjati","definition":"\"ဆိဇ္ဇတိ\t(ကြိ)<br>  [ဆိဒိ+ယ+တိ]<br>  (၁) (က) ပြတ်၏။ (ခ) ပြတ်-ကင်း-၏။ (ဂ) ပြတ်-ကင်း-ပျောက်-၏။ (ဃ) ပြတ်-ရှ-ကွဲ-၏။ (င) ပြတ်-ကုန်-ခန်း-၏။ (စ) ပြတ်၏၊ ဆိတ်သုန်း၏။ (ဆ) ကျိုး-ပြတ်-၏။ (ဇ) စုတ်-ပြတ်-၏။ (ဈ) ပြတ်၏၊ ကျ၏၊ ပြတ်ကျ၏။ (ည) ပြီး-ပြတ်-၏။ (ဋ) ပြီးပြတ်-ပြေလည်-ပြေရှင်း-၏။ (ဌ) ပြတ်-စဲ-ရပ်-တိတ်-ဆိတ်-ငြိမ်သက်-၏။ (ဍ) ချုပ်-ပြတ်-၏။ (၂) ပျောက်-ပျက်-ပြယ်-၏။ (၃) ပျောက်-ပြေ-ပြယ်-၏။ (၄) ၂-ဖြာထက်ခြမ်း ဖြန်းဖြန်းကွဲ၏။ (၅) ပျက်စီး၏။\""},{"source":"R","source_label":"U Hau Sein’s Pāḷi-Myanmar Dictionary ပါဠိမြန်မာ အဘိဓာန်(ဦးဟုတ်စိန်)","headword":"chijjati","definition":"ဆိဇ္ဇတိ\t (ကမ္မ) (√ဆိဒ်+ယ)<br>ဖြတ်အပ်၏။ ပြတ်၏။<br>သဒ္ဒေါ ဆိဇ္ဇိ၊ အသံသည် ပျောက်ခဲ့ပြီ။"}],"vi":[{"source":"U","source_label":"Pali Viet Dictionary  Bản dịch của ngài Bửu Chơn.","headword":"chijjati","definition":"(pass của chindati) bị cắt, bị bể tan [aor] chijji [prp] chijjanta, chijjamāna [abs] chijjitvā, chijjiya"}],"other":[]},"lūyati":{"headword":"lūyati","zh":[],"en":[{"source":"C","source_label":"Concise Pali-English Dictionary by A.P. Buddhadatta Mahathera","headword":"lūyati","definition":"[v.] is reaped."},{"source":"I","source_label":"Pali-Dictionary Vipassana Research Institute","headword":"lūyati","definition":"To be cut or reaped"}],"my":[{"source":"B","source_label":"Pali Word Grammar from Pali Myanmar Dictionary","headword":"lūyati","definition":"lūyati(kamma,kri)<br>  လူယတိ(ကမ္မ၊ကြိ)<br>  [ū+ya+te. rū. te- ti-pru. 516. lunāti-mha.]<br>  [လူ+ယ+တေ။ ရူ။ တေ-ကို တိ-ပြု။ ၅၁၆။ လုနာတိ-မှ။]"},{"source":"K","source_label":"Tipiṭaka Pāḷi-Myanmar Dictionary တိပိဋက-ပါဠိမြန်မာ အဘိဓာန်","headword":"lūyati","definition":"လူယတိ(ကမ္မ၊ကြိ)<br>  [လူ+ယ+တေ။ ရူ။ တေ-ကို တိ-ပြု။ ၅၁၆။ လုနာတိ-မှ။]<br>  ရိတ်-ဖြတ်-ပယ်-နုတ်-အပ်၏။"},{"source":"R","source_label":"U Hau Sein’s Pāḷi-Myanmar Dictionary ပါဠိမြန်မာ အဘိဓာန်(ဦးဟုတ်စိန်)","headword":"lūyati","definition":"လူယတိ\t (ကမ္မ) (√လူ+ယ)<br>ရိတ်အပ်၏။ ရိတ်ဖြတ်အပ်၏။"}],"vi":[],"other":[{"source":"L","source_label":"빨한 P.T.S. 사전- 선운사대학원용 (박경숙 박사님 초역; 2013년 1월 편집: 빅쿠 재연, 환성, 성륜, 성각, 진일, 법이, 원경, 대산, 보적, 무진, 원우;  2014년 1월 빅쿠원우교열) words:16233.","headword":"lūyati","definition":": Pass. of lunāti (q. v.)."}]},"lunāti":{"headword":"lunāti","zh":[],"en":[{"source":"C","source_label":"Concise Pali-English Dictionary by A.P. Buddhadatta Mahathera","headword":"lunāti","definition":"[lu + nā] cuts off; mows; reaps."},{"source":"P","source_label":"PTS Pali-English dictionary The Pali Text Society's Pali-English dictionary","headword":"lunāti","definition":"<i> </i>[<em>lū</em>, given as <em>lu</em> at Dhtp 504 (“chedana”) & Dhtm 728 (“paccheda”). For etym. cp. Gr. lu/w to loosen, Lat. luo to pay a fine, Goth. fraliusan to lose; Ger. los, E. lose & loose] to cut, cut off, mow, reap Miln.33 (yavalāvakā yavaṁ lunanti); DhsA.39. -- pp. <i>lūna (</i>&<i> luta)</i>. -- Caus I. <i>lāvayati</i> Mhvs 10, 30; Caus. II. <i>lavāpeti</i> to cause to mow Vin.II,180. -- A Pass. <i>lūyati</i> [fr. <em>lu</em>] is found at D.I,141 (aor. lūyiṁsu) and at corresponding passage Pug.56 (imper. lūyantu, where <i>dubbā</i> is to be corrected to <i>dabbhā</i>). -- See lava, lavaka, lavana, lāyati, lavati. (Page 585)"},{"source":"I","source_label":"Pali-Dictionary Vipassana Research Institute","headword":"lunāti","definition":"To cut, to reap"}],"my":[{"source":"B","source_label":"Pali Word Grammar from Pali Myanmar Dictionary","headword":"lunāti","definition":"lunāti(kri)<br>  လုနာတိ(ကြိ)<br>  [ū+nā+ti. nīti, dhātu. 255. nirutti. 679. lunāti-saṃ. luṇai-prā, addhamāgadhī.]<br>  [လူ+နာ+တိ။ နီတိ၊ ဓာတု။ ၂၅၅။ နိရုတ္တိ။ ၆၇၉။ လုနာတိ-သံ။ လုဏဣ-ပြာ၊ အဒ္ဓမာဂဓီ။]"},{"source":"K","source_label":"Tipiṭaka Pāḷi-Myanmar Dictionary တိပိဋက-ပါဠိမြန်မာ အဘိဓာန်","headword":"lunāti","definition":"လုနာတိ(ကြိ)<br>  [လူ+နာ+တိ။ နီတိ၊ ဓာတု။ ၂၅၅။ နိရုတ္တိ။ ၆၇၉။ လုနာတိ-သံ။ လုဏဣ-ပြာ၊ အဒ္ဓမာဂဓီ။]<br>  ရှ-ရိတ်-ဖြတ်-၏။"},{"source":"R","source_label":"U Hau Sein’s Pāḷi-Myanmar Dictionary ပါဠိမြန်မာ အဘိဓာန်(ဦးဟုတ်စိန်)","headword":"lunāti","definition":"လုနာတိ\t (√လူ)<br>ရိတ်၏။ ရိတ်ဖြတ်၏။"}],"vi":[{"source":"U","source_label":"Pali Viet Dictionary  Bản dịch của ngài Bửu Chơn.","headword":"lunāti","definition":"(lu+nā) chặt đứt, cắt cỏ, gặt lúa oar luni"}],"other":[{"source":"L","source_label":"빨한 P.T.S. 사전- 선운사대학원용 (박경숙 박사님 초역; 2013년 1월 편집: 빅쿠 재연, 환성, 성륜, 성각, 진일, 법이, 원경, 대산, 보적, 무진, 원우;  2014년 1월 빅쿠원우교열) words:16233.","headword":"lunāti","definition":"[lū, given as lu at Dhtp 504 (\"chedana\") & Dhtm 728 (\"paccheda\"). 어원에 관해서는 Gr. lu/w 놓아주다, Lat. luo 벌금을 물다, Goth. fraliusan 홓아주다; Ger. los, E. 잃어버리다 & 놓아주다,와 비교하라] 자르다, 잘라내다, 뽑다, 거두다 Miln 33 (yavalāvakā yavaṃ lunanti); DhsA 39. -- pp. lūna (& luta). -- Caus I. lāvayati Mhvs 10, 30; Caus. II. lavāpeti 뽑게 하다 Vin II.180. -- A Pass. lūyati [fr. lu] is found at D I.141 (aor. lūyiṃsu) and at corresponding passage Pug 56 (imper. lūyantu, where dubbā is to be corrected to dabbhā). -- See lava, lavaka, lavana, lāyati, lavati."}]},"āpajjati":{"headword":"āpajjati","zh":[{"source":"D","source_label":"《巴汉词典》Mahāñāṇo Bhikkhu编著","headword":"āpajjati","definition":"(ā + pad + ya), 进入，遭受，偶遇。(p52)"},{"source":"F","source_label":"《巴汉词典》明法比丘增订","headword":"āpajjati","definition":"(ā+pad去+ya；Sk. āpadyate), 进入(get into)，遭受、陷入(undergo)，偶遇(meet with)。ppr. āpajjanto。pot. āpajjeyya。aor. āpajji & āpādi。3rd pl. āpādu。ger. āpajjitvā。pp. āpanna。caus. āpādeti。āpajja(=āsajja & ālajja)。"}],"en":[{"source":"C","source_label":"Concise Pali-English Dictionary by A.P. Buddhadatta Mahathera","headword":"āpajjati","definition":"[ā + pad + ya] gets into; undergoes; meets with."},{"source":"P","source_label":"PTS Pali-English dictionary The Pali Text Society's Pali-English dictionary","headword":"āpajjati","definition":"[Sk. āpadyate, ā + <em>pad</em>] to get into, to meet with (Acc.); to undergo; to make, produce, exhibit Vin.II,126 (saṁvaraṁ); D.I,222 (pariyeṭṭhiṁ); It.113 (vuddhiṁ); J.I,73; Pug.20, 33 (diṭṭh’ânugatiṁ); PvA.29 (ppr. āpajjanto); DhA.II,71 -- pot. <i>āpajjeyya</i> D.I,119 (musāvādaṁ). -- aor.<i> āpajji</i> J.V,349; PvA.124 (saṅkocaṁ) & <i>āpādi</i> S.I,37; A.II,34; It.85; J.II,293; 3<sup>rd</sup> pl.<i> āpādu </i>D.II,273. -- ger. <i>āpajjitva</i> PvA.22 (saṁvegaṁ), 151. ‹-› pp. <i>āpanna</i> (q. v.). -- Caus. <i>āpādeti</i> (q. v.). -- Note. The reading <i>āpajja</i> in āpajja naṁ It.86 is uncertain (vv. ll. āsajja & ālajja). The id. p. at Vin.II,203 (CV. VII.4, 8) has āsajjanaṁ, for which Bdhgh, on p. 325 has āpajjanaṁ. Cp. pariyāpajjati. (Page 101)"},{"source":"I","source_label":"Pali-Dictionary Vipassana Research Institute","headword":"āpajjati","definition":"To enter, to fall into, to undergo"}],"my":[{"source":"B","source_label":"Pali Word Grammar from Pali Myanmar Dictionary","headword":"āpajjati","definition":"āpajjati(kri)<br>  အာပဇ္ဇတိ(ကြိ)<br>  «ā+pada+ya+ti. padagabhiyaṃ. nīti, dhā.227»<br>  [အာ+ပဒ+ယ+တိ။ ပဒဂဘိယံ။ နီတိ၊ ဓာ။၂၂၇]"},{"source":"K","source_label":"Tipiṭaka Pāḷi-Myanmar Dictionary တိပိဋက-ပါဠိမြန်မာ အဘိဓာန်","headword":"āpajjati","definition":"အာပဇ္ဇတိ(ကြိ)<br>  [အာ+ပဒ+ယ+တိ။ ပဒဂဘိယံ။ နီတိ၊ ဓာ။၂၂၇]<br>  ရောက်၏။"},{"source":"R","source_label":"U Hau Sein’s Pāḷi-Myanmar Dictionary ပါဠိမြန်မာ အဘိဓာန်(ဦးဟုတ်စိန်)","headword":"āpajjati","definition":"အာပဇ္ဇတိ\t (အာ√ပဒ်)<br>ရောက်၏။<br>ဒေါမနဿံ အာပဇ္ဇတိ၊ နှလုံးမသာယာခြင်းသို့ရောက်၏။ စက္ခုန္ဒြိယေ သံဝရံ အာပဇ္ဇတိ၊ စက္ခုန္ဒြေ၌ စောင့်စည်းခြင်းသို့ ရောက်၏။ အာပတ္တိံ အာပဇ္ဇမာနောပိ၊ အာပတ်သို့ ရောက် သော်လည်း။ ဝိဿာသံ အာပဇ္ဇိတွာ၊ အကျွမ်းဝင်ခြင်းသို့ ရောက်၍။"}],"vi":[{"source":"U","source_label":"Pali Viet Dictionary  Bản dịch của ngài Bửu Chơn.","headword":"āpajjati","definition":"(ā+pad+ya) đi vào, chịu, bị (một sự gì), đương đầu với"},{"source":"E","source_label":"Pali Viet Abhidhamma Terms  Từ điển các thuật ngữ Vô Tỷ Pháp của ngài Tịnh Sự, được chép từ phần ghi chú thuật ngữ trong các bản dịch của ngài.","headword":"āpajjati","definition":"mắc vào, bị; tham dự, chịu, chấp nhận"}],"other":[{"source":"L","source_label":"빨한 P.T.S. 사전- 선운사대학원용 (박경숙 박사님 초역; 2013년 1월 편집: 빅쿠 재연, 환성, 성륜, 성각, 진일, 법이, 원경, 대산, 보적, 무진, 원우;  2014년 1월 빅쿠원우교열) words:16233.","headword":"āpajjati","definition":"[Sk. āpadyate, ā + pad] 처하다, ~와 만나다 (acc.); 겪다, 만들다, 생산하다, 보이다 Vin II.126 (saṁvaraṁ); D I.222 (pariyeṭṭhiṁ); It 113 (vuddhiṁ); J I.73; Pug 20, 33 (diṭṭhɔânugatiṁ); PvA 29 (ppr. āpajjanto); DhA II.71 -- pot. āpajjeyya D I.119 (musāvādaṁ). -- aor. āpajji J V.349; PvA 124 (sankocaṁ) & āpādi S I.37; A II.34; It 85; J II.293; 3rd pl. āpādu D II.273. -- ger. āpajjitva PvA 22 (saṁvegaṁ), 151. ‹-› pp. āpanna (q. v.). -- Caus. āpādeti (q. v.). -- Note. The reading āpajja in āpajja naṁ It 86 is uncertain (vv. ll. āsajja & ālajja). The id. p. at Vin II.203 (CV. VII.4, 8) has āsajjanaṁ, for which Bdhgh, on p. 325 has āpajjanaṁ. Cp. pariyāpajjati."}]},"chijjiṃsu":{"headword":"chijjiṃsu","zh":[],"en":[],"my":[{"source":"B","source_label":"Pali Word Grammar from Pali Myanmar Dictionary","headword":"chijjiṃsu","definition":"chijjiṃsu(kri)<br>  ဆိဇ္ဇိံသု(ကြိ)<br>  [chidi+ya+uaṃ]<br>  [ဆိဒိ+ယ+ဥံ]"},{"source":"B","source_label":"Pali Word Grammar from Pali Myanmar Dictionary","headword":"chijjiṃsu","definition":"chijjiṃsu(kamma,kri)<br>  ဆိဇ္ဇိံသု(ကမ္မ၊ကြိ)<br>  [chidi+ya+uaṃ]<br>  [ဆိဒိ+ယ+ဥံ]"},{"source":"K","source_label":"Tipiṭaka Pāḷi-Myanmar Dictionary တိပိဋက-ပါဠိမြန်မာ အဘိဓာန်","headword":"chijjiṃsu","definition":"\"ဆိဇ္ဇိံသု\t(ကမ္မ၊ကြိ)<br>  [ဆိဒိ+ယ+ဥံ]<br>  \tခုတ်ဖြတ်-ပိုင်းဖြတ်-လှီးဖြတ်-အပ်ကုန်ပြီ။ ဆိဇ္ဇတိ-(၂)-ကြည့်။\""},{"source":"K","source_label":"Tipiṭaka Pāḷi-Myanmar Dictionary တိပိဋက-ပါဠိမြန်မာ အဘိဓာန်","headword":"chijjiṃsu","definition":"\"ဆိဇ္ဇိံသု\t(ကြိ)<br>  [ဆိဒိ+ယ+ဥံ]<br>  (က) ပြတ်ကုန်ပြီ။ (ခ) ပြတ်-ကုန်-ခန်း-ကုန်ပြီ။ ဆိဇ္ဇတိ-(၁)-ကြည့်။\""}],"vi":[],"other":[]}});
  const RESTORED_DICTIONARIES = new WeakSet();
  function restoreSourceEntries(dictionary) {
    if (!dictionary || RESTORED_DICTIONARIES.has(dictionary)) return;
    for (const [head, restored] of Object.entries(RESTORED_SOURCE_ENTRIES)) {
      const existing = dictionary[head];
      if (!existing) {
        dictionary[head] = restored;
        continue;
      }
      const merged = { ...existing };
      const present = new Set(entryRecords(existing).map(record =>
        record.source + '\u0000' + String(record.definition || '').trim()));
      for (const bucket of ['zh', 'en', 'my', 'vi', 'other']) {
        const additions = restored[bucket].filter(record =>
          !present.has(record.source + '\u0000' + record.definition.trim()));
        if (additions.length) merged[bucket] = [...(existing[bucket] || []), ...additions];
      }
      dictionary[head] = merged;
    }
    RESTORED_DICTIONARIES.add(dictionary);
  }

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
    restoreSourceEntries(dictionary);
    // Include the maintained exact entries before indexing. Otherwise the
    // first resolve() adds them after a host has built its index, leaving
    // that supplied index permanently incomplete. Plain-letter searches
    // then rebuild the whole dictionary for every diacritic candidate.
    for (const [key, entry] of Object.entries(BUILTIN_EXACT_HEADWORDS)) {
      if (dictionary && !dictionary[key]) dictionary[key] = entry;
    }
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
    restoreSourceEntries(dictionary);
    for (const [key, entry] of Object.entries(BUILTIN_EXACT_HEADWORDS)) {
      if (!dictionary[key]) dictionary[key] = entry;
    }
    // A host may retain an index created before these entries were added,
    // including when an older lookup core was replaced after page load.
    // Complete that same index once instead of rescanning the dictionary on
    // every resolve() call during a plain-letter diacritic search.
    let index = options.index;
    if (!index) index = createExactIndex(dictionary);
    else {
      for (const key of [...Object.keys(BUILTIN_EXACT_HEADWORDS), ...Object.keys(RESTORED_SOURCE_ENTRIES)]) {
        const normalized = cleanWord(key);
        const heads = index.get(normalized) || [];
        if (!heads.includes(key)) index.set(normalized, [...heads, key]);
      }
    }
    const exact = form => {
      const word = cleanWord(form);
      const heads = (index.get(word) || []).filter(head => dictionary[head]);
      if (dictionary[word] && !heads.includes(word)) heads.unshift(word);
      return heads;
    };
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
      // Abbreviation marks are structural, never disposable punctuation.
      if (/[~∼～˜…]|^[-–—]|[-–—]$/.test(String(value).trim())) return;
      const form = cleanWord(value);
      if (form && form.length > 2 && PALI_FORM.test(form) && !forms.includes(form)) forms.push(form);
    };
    const take = value => String(value || '').split(/[\s,，、/]+/).slice(0, 4).forEach(add);
    for (const record of entryRecords(entry)) {
      const text = String(record?.definition || '').replace(/<[^>]*>/g, ' ')
        .replace(/．/g, '.')
        // A tilde/dash may refer to a prefix, stem, or a nested subentry.
        // Without an explicit expansion, suppress the entire abbreviated token
        // before either forwards or backwards past-form extraction.
        .replace(/[~∼～˜…–—-]\s*[a-zāīūṅñṭḍṇḷṃṁŋ-]+/gi, ' ');
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
      // PTS and Mizuno also use unbracketed aor. / aor. pass. citations.
      // Read only the immediately labelled complete form, never references,
      // prose, or a lemma in an [aor. of ...] cross-reference.
      const inlineAorist = /\baor(?:ist)?\s*\.\s*(?:pass(?:ive)?\s*\.\s*)?(?:[123]\s*(?:st|nd|rd|th)?\s*(?:sg|pl)\s*\.\s*)?([a-zāīūṅñṭḍṇḷṃṁŋ]+)(?=[\s,，;；.\]）)]|$)/gi;
      let inlineMatch;
      while ((inlineMatch = inlineAorist.exec(text))) add(inlineMatch[1]);
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

  function isPassiveLemma(entry) {
    return entryRecords(entry).some(record => {
      const citation = normalizeForMatch(String(record?.definition || '')
        .replace(/<[^>]*>/g, ' ')).split(/【(?:过|過)】|\baor[．.]/i)[0].slice(0, 220);
      return /\bpass(?:ive)?\b|【被】|\bkamma\b|ကမ္မ|[（(]\s*[a-zāīūṅñṭḍṇḷṃ]+\s*\+\s*ya\s*[）)]/i.test(citation);
    });
  }

  // A passive is sometimes a labelled subentry in an active verb's record:
  // lunāti: -- A Pass. lūyati ... (aor. lūyiṃsu). Retain the local
  // passive lemma rather than assigning the surface to the enclosing verb.
  const PASSIVE_PAST_INDEX_CACHE = new WeakMap();
  function passivePastIndex(dictionary) {
    if (PASSIVE_PAST_INDEX_CACHE.has(dictionary)) return PASSIVE_PAST_INDEX_CACHE.get(dictionary);
    const index = new Map();
    for (const entry of Object.values(dictionary)) for (const record of entryRecords(entry)) {
      const text = String(record.definition || '').replace(/<[^>]*>/g, ' ').replace(/．/g, '.');
      const pattern = /\bPass(?:ive)?\.\s*([a-zāīūṅñṭḍṇḷṃṁ]+)(?=\s|\[|\()/gi;
      let match;
      while ((match = pattern.exec(text))) {
        const lemma = cleanWord(match[1]);
        if (!/(?:āti|ati|eti|oti)$/.test(lemma)) continue;
        const passage = text.slice(pattern.lastIndex).split(/--|‹-›/)[0];
        for (const form of explicitPastForms({ entries: [{ definition: passage }] })) {
          if (!index.has(form)) index.set(form, []);
          if (!index.get(form).includes(lemma)) index.get(form).push(lemma);
        }
      }
    }
    PASSIVE_PAST_INDEX_CACHE.set(dictionary, index);
    return index;
  }

  // Ajjatanī third-plural -iṃsu can use the same stem as singular -i.
  // Require PCED to attest that singular and its precise -ati lemma. Merely
  // stripping -iṃsu and finding a plausible headword is insufficient.
  function dictionaryAoristPluralCandidates(surface, context) {
    const word = cleanWord(surface);
    if (!word.endsWith('iṃsu') || word.length <= 6) return [];
    const stem = word.slice(0, -4);
    const lemma = stem + 'ati';
    const lemmaHeads = context.exact(lemma);
    if (!lemmaHeads.length) return [];
    const singular = stem + 'i';
    let attested = (explicitPastIndex(context.dictionary).get(singular) || [])
      .some(head => cleanWord(head) === lemma);
    // Reduced book dictionaries may carry only a singular cross-reference:
    // haññi [aor. of haññati]. Validate the complete target as well.
    if (!attested) {
      attested = context.exact(singular).some(head =>
        entryRecords(context.dictionary[head]).some(record => {
          const text = normalizeForMatch(String(record?.definition || '')
            .replace(/<[^>]*>/g, ' ').replace(/．/g, '.'));
          const match = text.match(/\[\s*aor(?:ist)?(?:\s*\.\s*|\s+)of\s+([a-zāīūṅñṭḍṇḷṃ]+)\s*\]/i);
          return match && cleanWord(match[1]) === lemma;
        }));
    }
    const passiveSubentry = (passivePastIndex(context.dictionary).get(word) || []).includes(lemma);
    if (!attested && !passiveSubentry) return [];
    // Only an explicit passive citation or root + ya formula establishes
    // voice. Do not borrow a nested passive subentry from an active lemma.
    const passive = passiveSubentry || lemmaHeads.some(head => isPassiveLemma(context.dictionary[head]));
    const label = 'Ajjatanī (aorist), third-person plural' + (passive ? ', passive' : '');
    return [{ form: lemma, label, family: 'dictionary-attested aorist verb',
      grammar: { surface: word, lemma, lemmaHead: lemmaHeads[0], label, verified: true } }];
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

    const attestedPlural = dictionaryAoristPluralCandidates(word, context)[0];
    if (attestedPlural) return attestedPlural.grammar;

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
      for (const candidate of [...verifiedInflectionCandidates(form, options), ...dictionaryAoristPluralCandidates(form, context)]) {
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
      heads: [], components: [], componentHeads: [], lemmaHeads: [], allHeads: [], notes: [], attemptedForms: []
    };
    if (!normalized) return base;

    const finish = result => {
      result.heads = [...new Set(result.heads || [])];
      result.componentHeads = [...new Set((result.components || []).flatMap(part => part.heads || []))]
        .filter(head => !result.heads.includes(head));
      // Preserve the exact surface definitions first. When its grammatical
      // analysis identifies a separately attested verb lemma, display that
      // lemma's complete PCED entry after the surface entries in every host.
      result.lemmaHeads = result.mode === 'exact' && result.grammar?.lemma
        ? context.exact(result.grammar.lemma).filter(head =>
            !result.heads.includes(head) && !result.componentHeads.includes(head))
        : [];
      result.allHeads = [...result.heads, ...result.componentHeads, ...result.lemmaHeads];
      return result;
    };

    const addEntryDecomposition = result => {
      if (result.heads.length !== 1 || result.components.length) return result;
      const head = result.heads[0];
      if (EXACT_VERB_FORMS[cleanWord(head)]) return result;
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
    const verifiedCandidates = [...verifiedInflectionCandidates(normalized, options),
      ...dictionaryAoristPluralCandidates(normalized, context)];
    const attestedPastHeads = explicitPastIndex(context.dictionary).get(normalized) || [];
    if (exactHeads.length) {
      const exactVerbForm = EXACT_VERB_FORMS[normalized];
      if (exactVerbForm) return finish({
        ...base, mode: 'exact', tier: 1, heads: exactHeads, grammar: exactVerbForm
      });
      const grammar = exactVerbAnalysis(normalized, exactHeads, context, options);
      // Exact surface entries always precede citation-form analysis.
      return finish(grammar ? {
        ...base, mode: 'exact', tier: 1, heads: exactHeads, grammar
      } : addEntryDecomposition({
        ...base, mode: 'exact', tier: 1, heads: exactHeads, grammar: null
      }));
    }

    const speechMatches = speechFormMatches(normalized);
    // A plain-letter speech query may recover an exact diacritic spelling.
    // Preserve that dictionary entry before falling back to its verb family.
    const speechExactHeads = [...new Set(speechMatches.flatMap(match =>
      (match.forms || []).flatMap(context.exact)))];
    if (speechExactHeads.length) return finish({
      ...base, mode: 'exact', tier: 1, heads: speechExactHeads, grammar: null
    });
    const speechHeads = [...new Set(speechMatches.flatMap(match => context.exact(match.lemma)))];
    if (speechHeads.length) return finish({
      ...base, mode: 'inflected', tier: 3, heads: speechHeads,
      resolvedForm: speechHeads[0], rule: 'Speech verb family / 说话动词词形组',
      family: 'speech verb', notes: [`${clicked} → ${speechHeads.join(', ')}`]
    });

    for (const [map, label] of [
      [options.fallbackAliases, 'verified fallback headword'],
      [options.aliases, 'verified headword'],
      [BUILTIN_ALIASES, 'verified PCED spelling']
    ]) {
      const mapped = formsFromMap(map, normalized);
      const heads = mapped.flatMap(context.exact);
      if (heads.length) {
        const exactVerbForm = EXACT_VERB_FORMS[cleanWord(mapped[0])];
        if (exactVerbForm) return finish({
          ...base, mode: 'exact', tier: 2, heads,
          resolvedForm: cleanWord(mapped[0]), grammar: exactVerbForm
        });
        return finish(addEntryDecomposition({
          ...base, mode: label.includes('related') ? 'related' : 'alias', tier: 2,
          heads, resolvedForm: cleanWord(mapped[0]), notes: [`${clicked} → ${mapped.join(', ')} (${label})`]
        }));
      }
    }

    for (const candidate of verifiedCandidates) {
      const heads = context.exact(candidate.form);
      if (heads.length) {
        const result = {
          ...base, mode: 'inflected', tier: 3, heads,
          resolvedForm: candidate.form, rule: candidate.label, family: candidate.family,
          grammar: candidate.grammar || null,
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
    const copyGroup = group => ({
      label: group.label,
      forms: uniqueForms(group.forms || group.persons?.flatMap(item => item.forms) || []),
      ...(group.persons ? { persons: group.persons.map(item => ({ person: item.person, forms: [...item.forms] })) } : {})
    });
    const exception = VERB_TABLE_EXCEPTIONS[lemma];
    if (exception) return exception.map(copyGroup);
    const ending = ['āti', 'ati', 'eti', 'oti'].find(value => lemma.endsWith(value));
    if (!ending || (!maintained && !/(?:\bkri\b|ကြိ|【(?:过|現|现|命|独)|\b(?:pr|imper|opt|fut|aor|ger|inf)\s*[．.]|\b(?:goes|does|makes|becomes)\b)/i.test(grammarText))) return [];
    const stem = lemma.slice(0, -ending.length);
    const endings = ending === 'eti'
      ? ['eti', 'enti', 'esi', 'etha', 'emi', 'ema']
      : ending === 'oti'
        ? ['oti', 'onti', 'osi', 'otha', 'omi', 'oma']
        : ending === 'āti'
          ? ['āti', 'anti', 'āsi', 'ātha', 'āmi', 'āma']
          : ['ati', 'anti', 'asi', 'atha', 'āmi', 'āma'];
    const futureMarker = ending === 'eti' ? 'ess' : 'iss';
    const group = (label, forms) => ({ label, forms: uniqueForms(forms) });
    const personGroup = (label, persons) => ({
      label, persons,
      forms: uniqueForms(persons.flatMap(item => item.forms))
    });
    const personKeys = ['thirdSingular', 'thirdPlural', 'secondSingular', 'secondPlural', 'firstSingular', 'firstPlural'];
    const personsFromEndings = values => personKeys.map((person, index) => ({ person, forms: [stem + values[index]] }));
    const imperative = ending === 'eti'
      ? [['etu'], ['entu'], ['ehi'], ['etha'], ['emi'], ['ema']]
      : ending === 'oti'
        ? [['otu'], ['ontu'], ['ohi'], ['otha'], ['omi'], ['oma']]
        : ending === 'āti'
          ? [['ātu'], ['antu'], ['a', 'āhi'], ['ātha'], ['āmi'], ['āma']]
          : [['atu'], ['antu'], ['a', 'āhi'], ['atha'], ['āmi'], ['āma']];
    const imperativePersons = personKeys.map((person, index) => ({
      person, forms: imperative[index].map(value => stem + value)
    }));
    // The PDF gives paca, ṭhape and ṭhapaya as separate aorist patterns.
    // An initial a- is exemplified for paca only, so do not impose it on
    // arbitrary prefixed verbs (for example ussahati).
    let pastPersons = [];
    if (ending === 'eti') {
      pastPersons = [
        ['thirdSingular', ['esi']], ['thirdPlural', ['esiṃsu', 'esuṃ']],
        ['secondSingular', ['eso']], ['secondPlural', ['esittha']],
        ['firstSingular', ['esiṃ']], ['firstPlural', ['esimha', 'esimhā']]
      ];
    } else if (ending === 'ati' || ending === 'āti') {
      pastPersons = [
        ['thirdSingular', ['i', 'ī']], ['thirdPlural', ['iṃsu', 'uṃ']],
        ['secondSingular', ['o']], ['secondPlural', ['ittha']],
        ['firstSingular', ['iṃ']], ['firstPlural', ['imha', 'imhā']]
      ];
    }
    pastPersons = pastPersons.map(([person, suffixes]) => {
      const forms = suffixes.map(value => stem + value);
      if (lemma === 'pacati') forms.push(...forms.map(value => 'a' + value));
      return { person, forms: uniqueForms(forms) };
    });
    // The verified third-plural words belong inside the complete Ajjatanī
    // person pattern. The source line identifies them as text-attested.
    if (TEXT_ATTESTED_AORIST_PLURAL[lemma]) {
      const plural = pastPersons.find(item => item.person === 'thirdPlural');
      if (plural) plural.forms = uniqueForms([...plural.forms, TEXT_ATTESTED_AORIST_PLURAL[lemma]]);
    }
    const groups = [
      personGroup('Present: 3sg, 3pl, 2sg, 2pl, 1sg, 1pl', personsFromEndings(endings)),
      ...(pastPersons.length ? [personGroup('Ajjatanī / Aorist (regular possibilities from verb table)', pastPersons)] : []),
      personGroup('Future', personsFromEndings(['ati', 'anti', 'asi', 'atha', 'āmi', 'āma']
        .map(value => futureMarker + value))),
      personGroup('Imperative', imperativePersons),
      personGroup('Optative', personsFromEndings(['eyya', 'eyyuṃ', 'eyyāsi', 'eyyātha', 'eyyāmi', 'eyyāma'])),
      ...(ending !== 'oti' ? [personGroup('Passive present (regular possibilities from verb table)',
        personsFromEndings(['īyati', 'īyanti', 'īyasi', 'īyatha', 'īyāmi', 'īyāma']))] : []),
      group('Present participle', [stem + 'anta', stem + 'amāna']),
      group('Absolutive / gerund', ending === 'eti'
        ? [stem + 'etvā', stem + 'etvāna', stem + 'etūna']
        : ending === 'oti' ? [stem + 'otvā']
          : [stem + 'itvā', stem + 'itvāna', stem + 'itūna']),
      group('Infinitive', [stem + (ending === 'eti' ? 'etuṃ' : ending === 'oti' ? 'otuṃ' : 'ituṃ')])
    ];
    if (lemma === 'hanati') groups[0] = personGroup(groups[0].label, [
      { person: 'thirdSingular', forms: ['hanati', 'hanti'] },
      ...groups[0].persons.slice(1)
    ]);
    return groups;
  }

  // Kaccāyana, Ākhyāta §§423–430 (printed pp. 588–592), gives the
  // Attanopada endings. Complete gacchati examples are on pp. 603–606.
  // Only the predictable -ati patterns are composed for other lemmas;
  // older past stems and irregular verbs must not be invented from -ti.
  function attanopadaParadigm(lemma, verbGroups) {
    if (!verbGroups.length) return [];
    const keys = ['thirdSingular', 'thirdPlural', 'secondSingular', 'secondPlural', 'firstSingular', 'firstPlural'];
    const group = (label, cells, endingsOnly = false) => ({
      label: endingsOnly ? label + ' (endings only)' : label,
      persons: keys.map((person, index) => ({ person, forms: cells[index] })),
      endingsOnly
    });
    const suffixes = [
      ['Parokkhā', ['ttha', 're', 'ttho', 'vho', 'iṃ', 'mhe']],
      ['Hiyyattanī', ['ttha', 'tthuṃ', 'se', 'vhaṃ', 'iṃ', 'mhase']],
      ['Ajjatanī', ['ā', 'ū', 'se', 'vhaṃ', 'aṃ', 'mhe']],
      ['Kālātipatti', ['ssatha', 'ssiṃsu', 'ssase', 'ssavhe', 'ssaṃ', 'ssāmhase']]
    ];
    if (lemma === 'gacchati') return [
      group('Present (Vattamānā)', [['gacchate'], ['gacchante', 'gacchare'], ['gacchase'], ['gacchavhe'], ['gacche'], ['gacchāmhe']]),
      group('Parokkhā', [['jagamittha'], ['jagamire'], ['jagamittho'], ['jagamivho'], ['jagamiṃ'], ['jagamimhe']]),
      group('Hiyyattanī', [['agacchattha', 'gacchattha'], ['agacchatthuṃ', 'gacchatthuṃ'], ['agacchase', 'gacchase'], ['agacchavhaṃ', 'gacchavhaṃ'], ['agacchiṃ', 'gacchiṃ'], ['agacchamhase', 'gacchamhase']]),
      group('Ajjatanī', [['agacchā', 'gacchā', 'agacchittha', 'gacchittha'], ['agacchū', 'gacchū'], ['agacchise', 'gacchise'], ['agacchivhaṃ', 'gacchivhaṃ'], ['agacchaṃ', 'gacchaṃ', 'agaccha', 'gaccha'], ['agacchimhe', 'gacchimhe']]),
      group('Imperative (Pañcamī)', [['gacchataṃ'], ['gacchantaṃ'], ['gacchassu'], ['gacchavho'], ['gacche'], ['gacchāmase']]),
      group('Optative (Sattamī)', [['gacchetha'], ['gaccheraṃ'], ['gacchetho'], ['gaccheyyāvho'], ['gaccheyyaṃ', 'gacche'], ['gaccheyyāmhe']]),
      group('Future (Bhavissanti)', [['gacchissate'], ['gacchissante', 'gacchissare'], ['gacchissase'], ['gacchissavhe'], ['gacchissaṃ'], ['gacchissāmhe']]),
      group('Kālātipatti', [['agacchissatha', 'gacchissatha'], ['agacchissiṃsu', 'gacchissiṃsu'], ['agacchissase', 'gacchissase'], ['agacchissavhe', 'gacchissavhe'], ['agacchissaṃ', 'gacchissaṃ'], ['agacchissāmhase', 'gacchissāmhase']])
    ];
    if (!lemma.endsWith('ati') || VERB_TABLE_EXCEPTIONS[lemma]) return [];
    const stem = lemma.slice(0, -3);
    const compose = endings => endings.map(ending => [stem + ending]);
    return [
      group('Present (Vattamānā)', compose(['ate', 'ante', 'ase', 'avhe', 'e', 'āmhe'])),
      ...suffixes.slice(0, 3).map(([label, endings]) => group(label, endings.map(ending => ['-' + ending]), true)),
      group('Imperative (Pañcamī)', compose(['ataṃ', 'antaṃ', 'assu', 'avho', 'e', 'āmase'])),
      group('Optative (Sattamī)', compose(['etha', 'eraṃ', 'etho', 'eyyāvho', 'eyyaṃ', 'eyyāmhe'])),
      group('Future (Bhavissanti)', compose(['issate', 'issante', 'issase', 'issavhe', 'issaṃ', 'issāmhe'])),
      group('Kālātipatti', suffixes[3][1].map(ending => ['-' + ending]), true)
    ];
  }


  // Irregular speech forms transcribed from the restored original PCED PTS
  // record, not generated by treating vatti as a regular -ati verb.
  function pcedSpeechParadigm(lemma) {
    if (lemma !== 'vatti') return null;
    const personKeys = ['thirdSingular', 'thirdPlural', 'secondSingular', 'secondPlural', 'firstSingular', 'firstPlural'];
    const finite = (label, values, note) => ({
      label, note,
      persons: personKeys.map((person, i) => ({ person, forms: values[i] })),
      forms: values.flat().filter(form => form !== '—')
    });
    const groups = [
      { label: 'Speech sense / 说话义 — dictionary citation / 词典原形', forms: ['vacati', 'vatti'],
        note: '√vac. PTS says the present is not found and refers to vadati; Myanmar sources also record vatti as a verb. No regular present or imperative paradigm is inferred. / PTS 注明现在时未见，另参 vadati；缅文词典也收录 vatti 动词条目。此处不推造规则现在时或命令式。' },
      finite('Future (PCED and grammatical paradigm) / 未来时（PCED 与语法词形表）',
        [['vakkhati'], ['vakkhanti'], ['vakkhasi'], ['vakkhatha'], ['vakkhāmi'], ['vakkhāma']],
        'Order: 3sg, 3pl, 2sg, 2pl, 1sg, 1pl. Second-person forms are supplied by the grammatical vakkhati paradigm. / 顺序：第三人称单、复数；第二人称单、复数；第一人称单、复数。第二人称词形依据 vakkhati 语法变位表补充。'),
      finite('Aorist (PCED-attested) / 不定过去时（PCED 记载）',
        [['avaca', 'avoca', 'avacāsi'], ['avacuṁ', 'avocuṁ'], ['avaca', 'avoca', 'avacāsi'], ['avacuttha', 'avocuttha'], ['avacaṁ', 'avocaṁ'], ['avacumha', 'avocumha']],
        'Order: 3sg, 3pl, 2sg, 2pl, 1sg, 1pl. Some forms occur in more than one person. / 顺序：第三人称单、复数；第二人称单、复数；第一人称单、复数。部分词形可用于不同人称。'),
      { label: 'Infinitive / 不定式', forms: ['vattuṁ'] },
      { label: 'Absolutive / 独立分词', forms: ['vatvā', 'vatvāna'] },
      { label: 'Gerundive / 应当分词', forms: ['vattabba'] },
      { label: 'Future participle / 未来分词', forms: ['vakkhamāna'] },
      { label: 'Present middle participle / 现在中间态分词', forms: ['vuccamāna'] },
      { ...finite('Passive present paradigm / 被动现在时变位表',
        [['vuccati'], ['vuccanti'], ['vuccasi'], ['vuccatha'], ['vuccāmi'], ['vuccāma']],
        'Complete conjugation from the vucca- passive stem; each position is not individually claimed as text-attested. / 依 vucca- 被动词干列出的完整变位；不表示每一位置都已在经文中核实。'), generated: true },
      { label: 'Passive present / 被动现在时', forms: ['vuccati', 'vuccate', 'uccate', 'vuccare'],
        note: 'vuccati, vuccate, uccate: third singular; vuccare: third plural. / vuccati、vuccate、uccate：第三人称单数；vuccare：第三人称复数。' },
      { label: 'Past participle / 过去分词', forms: ['vutta'] },
      { label: 'Derived verbs / 派生动词', forms: ['vāceti', 'vācita', 'vavakkhati'],
        note: 'Causative vāceti; its past participle vācita; desiderative vavakkhati. / 使役动词 vāceti；其过去分词 vācita；欲求动词 vavakkhati。' },
      { label: 'Separate meaning / 另一义 — aorist of vattati / vattati 的不定过去时', forms: ['vatti'],
        note: 'Concise Pali-English Dictionary: existed; happened; took place; went on. This belongs to vattati, distinct from the speech forms above. / 简明巴英词典：存在过、发生了、进行了。此义属于 vattati，与上述说话义分开。' }
    ];
    return {
      lemma, kind: 'verb', verified: [], groups, specialSources: [],
      attanopadaGroups: [], attanopadaGenerated: false, generated: false,
      formSystem: 'pced',
      formSource: 'PCED 2.0.5 — PTS Pali-English Dictionary, vatti (p. 598); Concise Pali-English Dictionary, vatti; original Myanmar dictionary records; vakkhati future paradigm (Digital Pāli Dictionary).',
      formSourceZh: 'PCED 2.0.5 — PTS 巴英词典 vatti（第 598 页）；简明巴英词典 vatti；原缅文词典条目；vakkhati 未来时变位表（Digital Pāli Dictionary）。'
    };
  }

  function baseInflectionParadigm(head, entry, options = {}) {
    let lemma = cleanWord(head);
    if (!lemma || !entry) return null;
    const pcedSpeech = pcedSpeechParadigm(lemma);
    if (pcedSpeech) return pcedSpeech;
    const grammarText = inflectionGrammarText(entry);
    const kaccayana = verbParadigm(lemma, grammarText).length ? null :
      global.KaccayanaDeclension?.paradigm?.(lemma, global.PaliLookupMorphology);
    if (kaccayana?.lemma) lemma = kaccayana.lemma;
    const reliableNounGroups = paliLookupNounParadigm(lemma);
    // Once the Pali Lookup morphology dataset is present, never guess a
    // noun's gender from its final letter.  Unknown nouns get no generated
    // noun table until their grammatical class is confirmed.
    const nounGroups = kaccayana?.groups || reliableNounGroups ||
      (global.PaliLookupMorphology ? [] : nounParadigm(lemma, grammarText));
    let verbGroups = verbParadigm(lemma, grammarText);
    // The lemma may already be passive. Do not passivize it a second time.
    if (verbGroups.length && isPassiveLemma(entry)) {
      verbGroups = verbGroups.filter(group => !/^Passive present \(regular/.test(group.label));
    }
    const attanopadaGroups = attanopadaParadigm(lemma, verbGroups);
    const attestedPast = explicitPastForms(entry);
    const specialSources = [];
    if (verbGroups.length && KACCAYANA_VERB_PARADIGMS[lemma]) {
      specialSources.push({
        source: 'Kaccāyana Pāli Vyākaraṇaṁ, Ākhyāta, printed pp. 602–606 (worked examples; starred forms are exceptional)',
        sourceZh: '《迦旃延巴利文法》动词篇，第 602–606 页（例词；* 号为特殊词形）',
        groups: KACCAYANA_VERB_PARADIGMS[lemma].map(group => ({
          label: group.label,
          persons: group.persons.map(item => ({
            person: item.person,
            forms: item.forms.map(form => KACCAYANA_STARRED_GACCHATI.has(form) ? '*' + form : form)
          }))
        }))
      });
    }
    if (verbGroups.length && attestedPast.length) {
      // Keep dictionary citations separate from the PDF-derived six positions.
      const existingPast = new Set(verbGroups
        .filter(group => /past|aorist|ajjatanī|hiyyattanī/i.test(group.label))
        .flatMap(group => group.forms || []));
      const additional = attestedPast.filter(form => !existingPast.has(form));
      if (additional.length) {
        specialSources.push({
          source: 'PCED dictionary entry (past forms explicitly cited)',
          sourceZh: 'PCED 词典条目（明确记载的过去时词形）',
          groups: [{ label: 'Past forms recorded in PCED', forms: additional }]
        });
      }
    }
    const verbSource = verbGroups.length ? [
      VERB_TABLE_EXCEPTIONS[lemma]
          ? 'Exceptional forms in the supplied 02 Pali Grammar table - Verbs.pdf, pp. 5–6'
          : lemma.endsWith('oti')
            ? 'Regular forms generated from the PCED verb lemma'
            : 'Possible finite and passive forms from 02 Pali Grammar table - Verbs.pdf, pp. 1–4; absolutive and infinitive from p. 5; present participle is an additional regular pattern applied to the PCED lemma',
      ...(TEXT_ATTESTED_AORIST_PLURAL[lemma]
        ? ['Third-person plural form separately verified in a Pāli text'] : [])
    ].join('; ') : '';
    const verbSourceZh = verbGroups.length ? [
      VERB_TABLE_EXCEPTIONS[lemma]
          ? '所提供的《02 Pali Grammar table - Verbs.pdf》第 5–6 页中列出的特殊动词词形'
          : lemma.endsWith('oti')
            ? '规则词形依 PCED 动词词典原形生成'
            : '有限动词及被动式的可能词形依据《02 Pali Grammar table - Verbs.pdf》第 1–4 页；独立分词及不定式依据第 5 页；现在分词另依规则词干推算',
      ...(TEXT_ATTESTED_AORIST_PLURAL[lemma]
        ? ['第三人称复数词形另经巴利文核实'] : [])
    ].join('；') : '';
    const verified = verifiedFormsForLemma(lemma, options);
    if (!nounGroups.length && !verbGroups.length && !verified.length) return null;
    return {
      lemma,
      kind: verbGroups.length ? 'verb' : nounGroups.length ? 'noun' : 'verified',
      verified,
      groups: verbGroups.length ? verbGroups : nounGroups,
      specialSources,
      attanopadaGroups,
      attanopadaGenerated: lemma !== 'gacchati',
      generated: verbGroups.length
        ? !VERB_TABLE_EXCEPTIONS[lemma]
        : !!nounGroups.length,
      formSystem: verbGroups.length ? 'kaccayana' : kaccayana?.groups?.length ? 'kaccayana' : reliableNounGroups?.length ? 'pali-lookup' : 'generated',
      formSource: verbGroups.length
        ? verbSource
        : kaccayana?.formSource || (reliableNounGroups?.length ? 'Pali Lookup version 2.0' : ''),
      formSourceZh: verbSourceZh,
      classificationSource: kaccayana?.classificationSource || '',
      morphologySource: reliableNounGroups?.length ? global.PaliLookupMorphology?.source : ''
    };
  }


  function speechFamilies() {
    const vac = pcedSpeechParadigm('vatti');
    const vad = { lemma: 'vadati', kind: 'verb', groups: verbParadigm('vadati', 'kri'),
      attanopadaGroups: attanopadaParadigm('vadati', verbParadigm('vadati', 'kri')) };
    return [{ root: 'vac', lemma: 'vatti', paradigm: vac }, { root: 'vad', lemma: 'vadati', paradigm: vad }];
  }

  function speechFormMatches(surface) {
    const word = cleanWord(surface);
    const fold = value => cleanWord(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ṃ/g, 'm');
    const plain = !/[āīūṅñṭḍṇḷṃ]/.test(word);
    const same = form => cleanWord(form) === word || (plain && fold(form) === fold(word));
    const matches = [];
    for (const family of speechFamilies()) {
      for (const group of family.paradigm.groups) {
        // Derived verbs keep their own conjugation, not the parent speech table.
        if (/Derived verbs|Separate meaning/.test(group.label)) continue;
        const positions = (group.persons || []).filter(position => position.forms.some(form => same(form)));
        if ((group.forms || []).some(form => same(form)) || positions.length) {
          matches.push({ ...family, label: group.label, forms: (group.forms || []).filter(same), persons: positions.map(position => position.person), generated: family.root === 'vad' || !!group.generated });
        }
      }
      for (const group of family.paradigm.attanopadaGroups || []) {
        if (group.endingsOnly) continue;
        const positions = (group.persons || []).filter(position => position.forms.some(form => same(form)));
        if (positions.length) matches.push({ ...family, label: group.label + ' — Attanopada', forms: positions.flatMap(position => position.forms.filter(same)), persons: positions.map(position => position.person), generated: true });
      }
    }
    return matches;
  }

  function dictionaryRoot(entry) {
    const roots = new Set();
    // Only dedicated root data or explicitly marked roots near the beginning
    // of a definition. Never infer a root from an arbitrary word ending.
    const add = value => {
      const word = String(value || '').replace(/^√/, '').trim().toLowerCase();
      if (/^[a-zāīūṅñṭḍṇḷṃ]+$/.test(word)) roots.add(word);
    };
    add(entry?.root);
    for (const record of entryRecords(entry)) {
      add(record.root);
      const text = String(record.definition || '').replace(/<[^>]*>/g, ' ').trim();
      const explicit = text.slice(0, 100).match(/√\s*([a-zāīūṅñṭḍṇḷṃ]+)/gi) || [];
      for (const value of explicit) add(value.replace(/\s/g, ''));
      // PCED Myanmar grammar: a bare root + affix + ending, without prefixes.
      if (record.source === 'B' && /\bkri\b|ကြိ/.test(text)) {
        const formula = text.match(/«\s*([a-zāīūṅñṭḍṇḷṃ]+)\s*\+\s*(?:a|ya|ṇe|ṇaya)\s*\+\s*(?:ti|te)\b/i);
        if (formula) add(formula[1]);
      }
    }
    return [...roots];
  }

  function inflectionParadigm(head, entry, options = {}) {
    const surface = cleanWord(options.surface || head);
    const headword = cleanWord(head);
    const fold = value => cleanWord(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ṃ/g, 'm');
    // Each displayed spelling gets its own analysis. An ASCII query vatti
    // may also list vaṭṭi, but that noun must never inherit the √vac table.
    const analysisSurface = fold(surface) === fold(headword) ? headword : surface;
    const matches = speechFormMatches(analysisSurface);
    const family = matches.find(match => match.lemma === headword) || matches[0];
    let result;
    if (family) {
      const dictionary = options.dictionary || {};
      const familyEntry = dictionary[family.lemma] || BUILTIN_EXACT_HEADWORDS[family.lemma];
      const direct = baseInflectionParadigm(head, entry, options);
      if (direct?.kind === 'noun' && headword !== family.lemma) {
        result = { ...direct, specialSources: [...(direct.specialSources || []), {
          source: 'Related speech verb family (noun declension retained)',
          sourceZh: '相关说话动词词形组（保留此词的名词变格）', groups: family.paradigm.groups
        }] };
      } else if (family.root === 'vac') result = pcedSpeechParadigm('vatti');
      else if (familyEntry || headword === 'vadati') result = baseInflectionParadigm('vadati', { ...(familyEntry || entry), entries: [...((familyEntry || entry)?.entries || []), { definition: 'kri — verified √vad speech verb' }] }, options);
    }
    let grammar = null;
    if (!result && options.dictionary) {
      const context = resolutionContext(options);
      grammar = exactVerbAnalysis(analysisSurface, context.exact(analysisSurface), context, options);
      if (grammar && cleanWord(grammar.lemma) !== headword) {
        // Exact surface definitions remain first in the popup. Its button
        // uses the independently validated verb lemma and its source entry.
        const direct = baseInflectionParadigm(head, entry, options);
        if (direct?.kind === 'noun') result = direct;
        else result = baseInflectionParadigm(grammar.lemmaHead, context.dictionary[grammar.lemmaHead], options);
      }
    }
    if (!result) result = baseInflectionParadigm(head, entry, options);
    if (!result) return null;
    const familyRoot = family?.root || ({ vāceti: 'vac', vavakkhati: 'vac', vadati: 'vad', vacati: 'vac', vatti: 'vac' })[headword];
    const roots = familyRoot ? [familyRoot] : dictionaryRoot(options.dictionary?.[result.lemma] || entry);
    const analyses = grammar?.verified
      ? [{ label: grammar.label, persons: [], generated: false }]
      : matches.map(match => ({ label: match.label, persons: match.persons, generated: match.generated }));
    if (!analyses.length) {
      for (const group of result.groups || []) {
        const positions = (group.persons || []).filter(position => position.forms.some(form => cleanWord(form) === surface));
        if (positions.length) analyses.push({ label: group.label, persons: positions.map(position => position.person), generated: !!result.generated });
        for (const row of group.rows || []) for (const number of ['singular', 'plural']) {
          if ((row[number] || []).some(form => cleanWord(form) === surface)) analyses.push({ label: row.label + ' (' + number + ')', persons: [], generated: !!result.generated });
        }
      }
    }
    if (analysisSurface === 'vatti') analyses.push({ label: 'Separate meaning: aorist of vattati / 另一义：vattati 的不定过去时', persons: [], generated: false });
    const stems = result.kind === 'noun'
      ? [...new Set((global.PaliLookupMorphology?.entries?.[result.lemma] || [])
          .map(record => record.s).filter(value => typeof value === 'string' && value.trim()))]
      : [];
    return { ...result, queriedForm: options.surface || head, matchedHeadword: head, roots, stems,
      familyLabel: family?.root === 'vac' ? '√vac — vacati / vatti (speech / 说话)' : family?.root === 'vad' ? '√vad — vadati' : '',
      rootSource: familyRoot ? 'PCED speech root family / PCED 说话动词词根组' : roots.length ? 'PCED explicit root or grammar formula / PCED 明确词根或语法构词式' : '',
      queriedAnalyses: analyses };
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
    localizedAnalysisText,
    localizedVerbGroupLabel,
    localizedVerbPersonLabel,
    inflectionParadigm,
    verifiedDecompositions: BUILTIN_DECOMPOSITIONS
  });
})(window);







