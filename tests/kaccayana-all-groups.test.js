const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(require.resolve('../kaccayana-declension.js'), 'utf8'), context);
const K = context.window.KaccayanaDeclension;
const tables = K.expandedReference();

for (let number = 1; number <= 13; number += 1) {
  assert(Object.values(tables).some(table =>
    table.groups.some(group => group.teacherGroupNumber === number)), `missing group ${number}`);
}
for (const [lemma, table] of Object.entries(tables)) {
  for (const group of table.groups) {
    assert.strictEqual(group.rows.length, 8, `${lemma}: incomplete inherited table`);
    assert(group.rows.every(row => Array.isArray(row.singular) && Array.isArray(row.plural)),
      `${lemma}: non-expanded row`);
  }
}

const manogana = ['mana','vaco','vayo','tejo','tapo','ceto','tamo','yaso','ayo','payo','siro','chando','saro','uro','raho','aho'];
for (const lemma of manogana) {
  const table = K.paradigm(lemma, null);
  assert(table && table.groups.length === 1 && table.groups[0].teacherGroupNumber === 6, lemma);
  assert(table.groups[0].rows.some(row => row.plural.length), `${lemma}: plural missing`);
}
const vaca = K.paradigm('vaca', null);
assert(vaca && vaca.groups[0].teacherGroupNumber === 6, 'explicit PCED vaca ↔ teacher vaco mapping missing');
assert(vaca.groups[0].rows.every(row => row.singular.length || row.plural.length), 'vaca table incomplete');
assert.strictEqual(K.paradigm('saba', null), null, 'unlisted saba must not be inferred');

const sabbanama = ['sabba','katara','katama','itara','añña','aññatara','aññatama','pubba','para','apara','dakkhiṇa','uttara','adhara','ya','ta','eta','ima','amu','kiṃ','eka','ubha','ubhaya','dvi','ti','catu','pañca','tumha','amha'];
for (const lemma of sabbanama) {
  const table = K.paradigm(lemma, null);
  assert(table && table.groups.every(group => group.teacherGroupNumber === 9), lemma);
}

const pubbaFamily = ['pubba','para','apara','dakkhiṇa','uttara','adhara'];
for (const lemma of pubbaFamily) {
  const stem = lemma.slice(0, -1);
  const [masculine, neuter] = K.paradigm(lemma, null).groups;
  assert.deepStrictEqual(Array.from(masculine.rows[1].singular), [lemma, stem + 'ā']);
  assert(masculine.rows[7].singular.includes(stem + 'e'), `${lemma}: locative ${stem}e missing`);
  assert(neuter.rows[0].plural.includes(stem + 'ā'), `${lemma}: neuter bold plural missing`);
}

const expectedAnnaFeminine = [
  [['aññā'], ['aññā','aññāyo']], [['aññe'], ['aññā','aññāyo']],
  [['aññaṃ'], ['aññā','aññāyo']], [['aññāya'], ['aññāhi','aññābhi']],
  [['aññāya','aññissā'], ['aññāsaṃ','aññāsānaṃ']], [['aññāya'], ['aññāhi','aññābhi']],
  [['aññāya','aññissā'], ['aññāsaṃ','aññāsānaṃ']], [['aññāyaṃ','aññissaṃ'], ['aññāsu']]
];
const annaFeminine = K.paradigm('añña', null).groups[2].rows;
expectedAnnaFeminine.forEach((expected, index) => {
  assert.deepStrictEqual(Array.from(annaFeminine[index].singular), expected[0], `añña row ${index + 1} singular`);
  assert.deepStrictEqual(Array.from(annaFeminine[index].plural), expected[1], `añña row ${index + 1} plural`);
});

console.log(`Audited ${Object.keys(tables).length} fully expanded reference paradigms across all 13 groups.`);
