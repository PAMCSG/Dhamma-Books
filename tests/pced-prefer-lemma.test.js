const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(require.resolve('../pced-lookup-core.js'), 'utf8'), context);

const core = context.window.PCEDLookupCore;
const dictionary = {
  'paṭissutvā': { headword: 'paṭissutvā', zh: [], en: [], my: [{ definition: 'surface entry' }] },
  'paṭissuṇitvā': { headword: 'paṭissuṇitvā', zh: [], en: [], my: [{ definition: 'surface entry' }] },
  'paṭissuṇāti': { headword: 'paṭissuṇāti', zh: [], en: [{ definition: 'agrees; promises' }], my: [] },
  gacchati: { headword: 'gacchati', zh: [], en: [{ definition: 'goes' }], my: [] }
};
const options = { dictionary, index: core.createExactIndex(dictionary) };

for (const surface of ['paṭisuṇitvā', 'paṭissuṇitvā', 'paṭissutvā']) {
  const result = core.resolve(surface, options);
  assert.strictEqual(result.mode, 'inflected', `${surface}: verified analysis missing`);
  assert.deepStrictEqual(Array.from(result.heads), ['paṭissuṇāti'], `${surface}: wrong lemma`);
  assert.strictEqual(result.resolvedForm, 'paṭissuṇāti', `${surface}: wrong resolved form`);
  assert.match(result.rule, /having agreed\/promised/, `${surface}: meaning missing`);
}

const ordinaryExact = core.resolve('gacchati', options);
assert.deepStrictEqual(Array.from(ordinaryExact.heads), ['gacchati'], 'ordinary exact lookup changed');

console.log('Verified preferLemma override and ordinary exact-first lookup.');
