// Run with: node tests/pced-word-records.test.js (Node.js; no packages required).
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const repo = process.env.PCED_TEST_REPO || path.resolve(__dirname, '..');
let checks = 0;
const check = (name, run) => { run(); checks++; console.log('PASS', name); };
const entry = (headword, marker) => ({ headword, en: [{ source: 'P', definition: marker }], zh: [], my: [] });
const words = () => ({
  handa: { ...entry('handa', 'PCED_HANDA_EN'), vi: [{ source: 'E', definition: 'PCED_HANDA_VI' }] },
  assa: entry('assa', 'PCED_ASSA_EN'),
  'āvuso': entry('āvuso', 'PCED_AVUSO_EN; original sentence examples retained'),
  putta: entry('putta', 'PCED_PUTTA_EN'),
  puttassa: entry('puttassa', 'PCED_EXACT_PUTTASSA'),
  bhikkhu: entry('bhikkhu', 'PCED_BHIKKHU_EN')
});
const sentence = { id: 'sentence', pali: 'acchariyaṃ, āvuso, abbhutaṃ, āvuso!',
  chinese: 'SENTENCE_TRANSLATION', status: '规范', source: 'corpus' };
const records = () => [
  sentence,
  { id: 'sentence-no-end', pali: 'acchariyaṃ, vata bho, abbhutaṃ, vata bho', chinese: 'OTHER_SENTENCE', status: '规范' },
  { id: 'word', pali: 'āvuso', chinese: 'SINGLE_WORD_AVUSO', status: '已确认' },
  { id: 'duplicate-word', pali: 'āvuso', chinese: 'SINGLE_WORD_AVUSO', status: '已确认' },
  { id: 'handa', pali: 'handa', chinese: 'CHINESE_HANDA', status: '规范' },
  { id: 'putta', pali: 'putta', chinese: 'CHINESE_PUTTA', status: '规范' },
  { id: 'unconfirmed', pali: 'āvuso', chinese: 'UNCONFIRMED_AVUSO', status: '待核实' },
  { id: 'deleted', pali: 'āvuso', chinese: 'DELETED_AVUSO', status: '规范', deleted: 1 },
  { id: 'substring', pali: 'sāvuso', chinese: 'SUBSTRING_ONLY', status: '规范' },
  { id: 'other-sentence', pali: 'acchariyaṃ, āvuso, abbhutaṃ, āvuso!', chinese: 'OTHER_DICTIONARY_SENTENCE', status: '另加字典' },
  { id: 'other-handa', pali: 'handa', chinese: 'OTHER_HANDA', status: '另加字典' }
];

function setup(dictionary = words(), terms = records()) {
  const elements = {};
  const el = () => ({ value: 'zh', addEventListener() {}, setAttribute() {}, style: {},
    classList: { add() {}, remove() {}, contains() { return false; } },
    innerHTML: '', get textContent() { return String(this.innerHTML).replace(/<[^>]*>/g, ''); },
    querySelectorAll() { return []; }, nextElementSibling: null });
  const document = { readyState: 'loading', currentScript: { dataset: { pcedMode: 'book' } },
    addEventListener() {}, createElement: el, body: { style: {} },
    getElementById(id) { return elements[id] || (elements[id] = el()); } };
  const window = { PCED: dictionary, PATISAMBHIDAMAGGA_PCED: dictionary,
    PCEDApprovedTerms: { records: terms }, document,
    localStorage: { getItem() { return null; }, setItem() {} } };
  const context = { window, document, location: { hostname: 'books.test' }, console,
    localStorage: window.localStorage };
  vm.createContext(context);
  const runFile = file => vm.runInContext(fs.readFileSync(path.join(repo, file), 'utf8'), context, { filename: file });
  runFile('pced-lookup-core.js');
  let popup = fs.readFileSync(path.join(repo, 'pced-popup-standard.js'), 'utf8');
  // Inspect production functions without invoking UI installation in this VM.
  const marker = "  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });";
  assert.ok(popup.includes(marker));
  popup = popup.replace(marker, '  window.testPopup = { renderDictionary, approvedWordRows, termTabWordRows, renderTermTable, updateBookLookupMeta };\n' + marker);
  vm.runInContext(popup, context, { filename: 'pced-popup-standard.js' });
  const core = window.PCEDLookupCore;
  const resolve = word => core.resolve(word, { dictionary, index: core.createExactIndex(dictionary) });
  return { core, popup: window.testPopup, window, context, resolve, runFile, dictionary, terms };
}

const env = setup();
check('complete record filtering excludes sentences and mixed multiword alternatives', () => {
  for (const row of [sentence, { pali: 'handa, this is a phrase' }, { pali: 'handa; assa bhikkhu' },
    { pali: 'handa, assa', type: '标准句式' }, { pali: 'handa', type: 'phrase' }, { pali: 'handa?' }, { pali: 'handa…assa' }]) {
    assert.equal(env.core.singleWordTermForms(row).length, 0, JSON.stringify(row));
  }
});
check('genuine single-word alternatives and Unicode variants remain available', () => {
  assert.deepEqual(Array.from(env.core.singleWordTermForms({ pali: 'handa, handā / handa' })), ['handa', 'handā']);
  assert.deepEqual(Array.from(env.core.singleWordTermForms({ pali: 'evaṁ; evaṃ' })), ['evaṃ']);
  assert.deepEqual(Array.from(env.core.singleWordTermForms({ pali: '  āvuso  ' })), ['āvuso']);
  assert.deepEqual(Array.from(env.core.singleWordTermForms({ pali: 'Jambu-dīpa' })), ['jambu-dīpa']);
  assert.deepEqual(Array.from(env.core.singleWordTermForms({ pali: 'asubha-bhāvanā' })), ['asubha-bhāvanā']);
});
check('single-word PCED excludes corpus sentences, unapproved rows and deleted rows', () => {
  const rows = env.popup.approvedWordRows('āvuso', env.resolve('āvuso'), env.terms);
  assert.deepEqual(Array.from(rows, row => row.chinese), ['SINGLE_WORD_AVUSO']);
  const html = env.popup.renderDictionary('āvuso');
  assert.match(html, /SINGLE_WORD_AVUSO/);
  assert.doesNotMatch(html, /SENTENCE_TRANSLATION|OTHER_DICTIONARY_SENTENCE|UNCONFIRMED_AVUSO|DELETED_AVUSO|SUBSTRING_ONLY/);
  assert.match(html, /original sentence examples retained/);
});
check('reader terminology tab retains whole-word sentences, all non-deleted statuses and deduplication', () => {
  const rows = env.popup.termTabWordRows('āvuso', env.resolve('āvuso'), env.terms);
  assert.ok(rows.some(row => row.id === 'sentence'));
  assert.ok(rows.some(row => row.id === 'unconfirmed'));
  assert.ok(!rows.some(row => row.id === 'deleted' || row.id === 'substring'));
  assert.equal(rows.filter(row => row.chinese === 'SINGLE_WORD_AVUSO').length, 1);
  const html = env.popup.renderTermTable(rows, 'āvuso');
  assert.match(html, /SENTENCE_TRANSLATION/);
  assert.match(html, /状态/);
});
check('handassa resolves as sandhi and Chinese handa precedes its other dictionaries', () => {
  const result = env.resolve('handassa');
  assert.equal(result.mode, 'sandhi');
  assert.deepEqual(Array.from(result.components, part => part.surface), ['handa', 'assa']);
  const html = env.popup.renderDictionary('handassa');
  assert.match(html, /handa \+ assa/);
  assert.match(html, /连声拆分/);
  assert.doesNotMatch(html, /已核实词形变化/);
  const ordered = ['CHINESE_HANDA', 'OTHER_HANDA', 'PCED_HANDA_EN', 'PCED_HANDA_VI'].map(text => html.indexOf(text));
  assert.ok(ordered.every(index => index >= 0));
  assert.deepEqual([...ordered].sort((a,b) => a-b), ordered);
});
check('related nominal meaning accompanies the resolved lemma before its PCED languages', () => {
  const dictionary = words(); delete dictionary.puttassa;
  const sample = setup(dictionary);
  const html = sample.popup.renderDictionary('puttassa');
  assert.ok(html.indexOf('CHINESE_PUTTA') < html.indexOf('PCED_PUTTA_EN'));
  assert.match(html, /非精确匹配/);
});
check('exact surface entry remains ahead of a different related headword', () => {
  const html = env.popup.renderDictionary('puttassa');
  assert.ok(html.indexOf('PCED_EXACT_PUTTASSA') < html.indexOf('CHINESE_PUTTA'));
});
check('exact handassa entry remains first and component Chinese meaning appears once', () => {
  const dictionary = words(); dictionary.handassa = entry('handassa', 'PCED_EXACT_HANDASSA');
  const sample = setup(dictionary);
  const result = sample.resolve('handassa');
  assert.equal(result.mode, 'exact');
  assert.equal(result.allHeads[0], 'handassa');
  const html = sample.popup.renderDictionary('handassa');
  assert.ok(html.indexOf('PCED_EXACT_HANDASSA') < html.indexOf('CHINESE_HANDA'));
  assert.ok(html.indexOf('CHINESE_HANDA') < html.indexOf('PCED_HANDA_EN'));
  assert.equal((html.match(/CHINESE_HANDA/g) || []).length, 1);
});
check('non-Chinese book profile keeps Chinese-Tipitaka extraction disabled', () => {
  const html = env.popup.renderDictionary('handa', [], 'en');
  assert.doesNotMatch(html, /CHINESE_HANDA/);
  assert.match(html, /PCED_HANDA_EN/);
});
check('book metadata removes obsolete legacy suffix analyses', () => {
  const meta = { textContent: 'PCED 2.0.5.0 · 中文 → English · handassa → handa (-assa → -a)' };
  env.popup.updateBookLookupMeta({ querySelector() { return meta; } }, 'zh');
  assert.equal(meta.textContent, 'PCED 2.0.5.0 · 中文 → English → Burmese → Other');
  assert.doesNotMatch(meta.textContent, /-assa|handassa/);
});
check('single-word terminology can appear even when ordinary PCED has no entry', () => {
  const terms = [{ pali: 'evaṃvaṇṇo', chinese: 'CHINESE_WITHOUT_PCED', status: '规范' }];
  const sample = setup(words(), terms);
  assert.match(sample.popup.renderDictionary('evaṃvaṇṇo'), /CHINESE_WITHOUT_PCED/);
});
check('no substring or fuzzy fallback is introduced', () => {
  assert.equal(env.core.approvedTermMatches('vuso', {}, { approvedTerms: env.terms }).length, 0);
  assert.equal(env.resolve('zzzzzz').allHeads.length, 0);
});

if (fs.existsSync(path.join(repo, 'pced-index-search.js'))) {
  function indexSample(exactSandhi = false) {
    const dictionary = words();
    if (exactSandhi) dictionary.handassa = entry('handassa', 'PCED_EXACT_HANDASSA');
    const sample = setup(dictionary);
    let source = fs.readFileSync(path.join(repo, 'pced-index-search.js'), 'utf8');
    const marker = "  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });";
    source = source.replace(marker, '  buildIndexes(); window.indexSearch = search;\n' + marker);
    vm.runInContext(source, sample.context);
    return sample.window.indexSearch;
  }
  check('homepage searches āvuso and plain-letter avuso without sentence leakage', () => {
    const search = indexSample();
    for (const word of ['āvuso', 'avuso']) {
      const html = search(word, 'zh').html;
      assert.match(html, /SINGLE_WORD_AVUSO/);
      assert.doesNotMatch(html, /SENTENCE_TRANSLATION|OTHER_DICTIONARY_SENTENCE|DELETED_AVUSO/);
    }
  });
  check('homepage handassa shows sandhi and Chinese priority', () => {
    const html = indexSample()('handassa', 'zh').html;
    assert.match(html, /handa \+ assa/);
    assert.ok(html.indexOf('CHINESE_HANDA') < html.indexOf('PCED_HANDA_EN'));
    assert.ok(html.indexOf('OTHER_HANDA') < html.indexOf('PCED_HANDA_EN'));
  });
  check('homepage preserves exact handassa before component meanings, without duplicates', () => {
    const html = indexSample(true)('handassa', 'zh').html;
    assert.ok(html.indexOf('PCED_EXACT_HANDASSA') < html.indexOf('CHINESE_HANDA'));
    assert.ok(html.indexOf('CHINESE_HANDA') < html.indexOf('PCED_HANDA_EN'));
    assert.equal((html.match(/CHINESE_HANDA/g) || []).length, 1);
  });
}
console.log(`${checks} PCED terminology regressions passed.`);
