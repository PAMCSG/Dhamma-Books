// node tests/pced-eyya.test.js
// Optional: PCED_READER_REPO=/path/to/Tipitaka-reader
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const repo = path.resolve(__dirname, '..');
const readerRepo = process.env.PCED_READER_REPO;
const pairs = Object.entries({ vipateyya:'vipatati', pateyya:'patati', gaccheyya:'gacchati',
  'āgaccheyya':'āgacchati', bhaveyya:'bhavati', labheyya:'labhati', passeyya:'passati',
  kareyya:'karoti', 'suṇeyya':'suṇāti', 'jāneyya':'jānāti' });
let checks = 0;
function check(name, run) { run(); checks++; console.log('PASS', name); }

function environment(popupRoot = repo, reader = false) {
  const element = () => ({ value:'zh', innerHTML:'', style:{}, addEventListener(){}, setAttribute(){},
    get textContent(){return String(this.innerHTML).replace(/<[^>]*>/g,'');},
    classList:{add(){},remove(){},contains(){return false;}}, querySelectorAll(){return [];} });
  const elements = {};
  const document = {readyState:'loading', currentScript:{dataset:{pcedMode:reader?'reader':'book'}},
    addEventListener(){}, createElement:element, body:{style:{}},
    getElementById(id){return elements[id] || (elements[id]=element());}};
  const window = {document, localStorage:{getItem(){return null;},setItem(){}}};
  const context = {window,document,localStorage:window.localStorage,location:{hostname:reader?'tipitaka-reader.pages.dev':'books.test'},console};
  vm.createContext(context);
  for (const file of ['patisambhidamagga-pced-data.js','pced-standard-data.js','pali-lookup-morphology.js','kaccayana-declension.js','pced-lookup-core.js']) {
    const root = fs.existsSync(path.join(popupRoot,file)) ? popupRoot : repo;
    vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
  }
  const dictionary = window.PATISAMBHIDAMAGGA_PCED || {};
  window.PCEDStandardData.applyTo(dictionary);
  window.PCED = window.PATISAMBHIDAMAGGA_PCED = dictionary;
  const marker = "  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });";
  const popup = fs.readFileSync(path.join(popupRoot,'pced-popup-standard.js'),'utf8');
  assert.ok(popup.includes(marker));
  vm.runInContext(popup.replace(marker,'  window.eyyaTestPopup = {renderDictionary};\n'+marker),context);
  const index = fs.readFileSync(path.join(repo,'pced-index-search.js'),'utf8');
  vm.runInContext(index.replace(marker,'  buildIndexes(); window.eyyaTestSearch = search;\n'+marker),context);
  const core = window.PCEDLookupCore;
  return {window,core,dictionary,resolve:w=>core.resolve(w,{dictionary}),
    popup:(w,lang)=>window.eyyaTestPopup.renderDictionary(w,undefined,lang),
    search:(w,lang)=>window.eyyaTestSearch(w,lang)};
}

const book = environment();
for (const [word,lemma] of pairs) check(`${word}: exact entry, correct verb and optative table`,()=>{
  const r = book.resolve(word);
  assert.equal(r.grammar.lemma,lemma);
  assert.equal(r.grammar.kind,'optative');
  assert.ok(r.allHeads.includes(lemma));
  if (book.dictionary[word]) {
    assert.equal(r.mode,'exact');assert.equal(r.allHeads[0],word);
  }
  const p = book.core.inflectionParadigm(lemma,book.dictionary[lemma],{dictionary:book.dictionary,surface:word});
  assert.equal(p.kind,'verb');assert.equal(p.lemma,lemma);
  assert.ok(p.groups.some(g=>/Optative/.test(g.label)&&g.forms.includes(word)));
});
check('kareyya never falls back to the unrelated karati headword',()=>{
  assert.ok(!book.resolve('kareyya').allHeads.includes('karati'));
  const r = book.core.resolve('kareyya',{dictionary:{karati:{headword:'karati',en:[{definition:'[kri] cuts'}]}}});
  assert.equal(r.mode,'none');
});
check('nouns and the exact vineyya gerund are not relabelled as optatives',()=>{
  for(const word of ['vineyya','bhāgineyya','seyya']){
    const r=book.resolve(word);assert.equal(r.mode,'exact');assert.equal(r.verbAnalyses,undefined);
  }
  const dictionary={xati:{headword:'xati',en:[{definition:'[nt.] a container'}]}};
  assert.equal(book.core.resolve('xeyya',{dictionary}).mode,'none');
});
check('accented and unaccented roots remain distinct in the shared resolver',()=>{
  assert.ok(!book.resolve('janeyya').allHeads.includes('jānāti'));
  assert.equal(book.resolve('suneyya').mode,'none');
  assert.equal(book.resolve('zzzzeyya').mode,'none');
});
check('ambiguous regular verbs retain separate candidate tables',()=>{
  const r=book.resolve('janeyya');
  assert.ok(r.verbAnalyses.length>1);
  for(const a of r.verbAnalyses){
    const p=book.core.inflectionParadigm(a.lemma,book.dictionary[a.lemmaHead],{dictionary:book.dictionary,surface:'janeyya'});
    assert.equal(p.lemma,a.lemma);
  }
});
check('identical dictionary records are displayed once; distinct sources are retained',()=>{
  const row={source:'D',source_label:'Source D',definition:'same definition'};
  const groups=book.core.dictionaryGroups({zh:[row,{...row},{...row,source:'F',source_label:'Source F'}] },'zh');
  assert.equal(groups[0].entries.length,2);
});
check('exact optative terminology and related verb terminology remain separately available',()=>{
  const terms=[{pali:'passeyya',chinese:'EXACT_TERM',status:'规范'},
    {pali:'passati',chinese:'BASE_VERB_TERM',status:'已确认'}];
  const rows=book.core.approvedTermMatches('passeyya',book.resolve('passeyya'),{approvedTerms:terms});
  assert.deepEqual(Array.from(rows,x=>x.chinese),['EXACT_TERM','BASE_VERB_TERM']);
  assert.equal(rows[0].match,'exact');assert.equal(rows[1].matchedForm,'passati');
});

const paths=[['Dhamma book',book.popup],['Dhamma homepage',(w,lang)=>book.search(w,lang).html]];
if(readerRepo){const reader=environment(readerRepo,true);paths.push(['Tipitaka reader',reader.popup]);}
for(const [name,render] of paths){
  check(`${name}: all ten words show the correct verb, grammar and one inflection control`,()=>{
    for(const [word,lemma] of pairs){
      for(const language of ['en','zh']){
        const html=render(word,language);
        assert.ok(html.includes(lemma),word);
        assert.match(html,language==='zh'?/祈愿式（Sattamī），第三人称单数/:/Optative \(Sattamī\), third-person singular/);
        assert.equal((html.match(/class="pced-inflection-toggle"/g)||[]).length,1,`${name} ${word}`);
        assert.doesNotMatch(html,/-eyya → -ati/);
        assert.match(html,/来源|Source|Verb forms/);
      }
    }
  });
  check(`${name}: exact bhaveyya and passeyya definitions precede analysis and lemma entries`,()=>{
    for(const word of ['bhaveyya','passeyya']){
      const html=render(word,'zh');
      const exactDefinition=word==='passeyya'?'应该见':'a sort of tree';
      const exact=html.indexOf(exactDefinition),analysis=html.indexOf('grammar-analysis');
      const button=html.indexOf('class="pced-inflection-toggle"');
      assert.ok(exact>=0&&exact<analysis&&analysis<button,word);
      const lemma=word==='passeyya'?'passati':'Bhavati';
      assert.ok(html.lastIndexOf('class="headword">'+lemma)>button,word);
    }
  });
  check(`${name}: ambiguous candidates have independent controls and a context caution`,()=>{
    const html=render('janeyya','zh');
    assert.equal((html.match(/class="pced-inflection-toggle"/g)||[]).length,2);
    assert.match(html,/多个可能的原形/);
    assert.match(html,/PCED 词条：<\/b>janati/);
    assert.match(html,/PCED 词条：<\/b>janeti/);
  });
}
check('homepage can recover suṇeyya from ASCII suneyya without changing exact dictionary spellings',()=>{
  const r=book.search('suneyya','zh');
  assert.ok(r.heads.includes('suṇāti'));
  assert.match(r.html,/suṇeyya/);
});
console.log(`Passed ${checks} -eyya regression checks across ${paths.length} entry paths.`);
