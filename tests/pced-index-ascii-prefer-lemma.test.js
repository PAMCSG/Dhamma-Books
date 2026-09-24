const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const element = () => ({
  value: 'zh',
  addEventListener() {},
  classList: { add() {}, remove() {}, contains() { return false; } },
  setAttribute() {},
  nextElementSibling: null
});
const elements = new Proxy({}, {
  get(target, key) { return target[key] || (target[key] = element()); }
});
const context = {
  window: {},
  document: {
    readyState: 'complete',
    getElementById(id) { return elements[id]; },
    addEventListener() {},
    body: { style: {} }
  },
  localStorage: { getItem() { return null; }, setItem() {} },
  console
};
context.window.document = context.document;
context.window.localStorage = context.localStorage;
vm.createContext(context);

for (const file of [
  '../patisambhidamagga-pced-data.js',
  '../pced-standard-data.js',
  '../pced-lookup-core.js',
  '../pced-index-search.js'
]) {
  vm.runInContext(fs.readFileSync(require.resolve(file), 'utf8'), context);
}

for (const surface of [
  'paṭisuṇitvā', 'paṭissuṇitvā', 'paṭissutvā',
  'patisunitva', 'patissunitva', 'patissutva'
]) {
  const result = context.window.PCEDIndexSearch.search(surface, 'zh');
  assert.deepStrictEqual(Array.from(result.heads), ['paṭissuṇāti'], `${surface}: wrong displayed headword`);
  assert.match(result.html, /having agreed\/promised/, `${surface}: analysis missing`);
  assert.doesNotMatch(result.html, /Compound analysis/, `${surface}: false compound analysis displayed`);
}

console.log('Verified exact and plain-letter landing searches for all paṭissuṇāti absolutive forms.');
