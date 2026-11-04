const vm = require('node:vm');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const voices = [{voiceURI:'zh',lang:'zh-CN'},{voiceURI:'en',lang:'en-GB'}];
const spoken = [];
const native = {paused:false, onvoiceschanged:null, getVoices:()=>voices,
  addEventListener(){}, cancel(){}, resume(){this.paused=false;},
  speak(utterance){spoken.push(utterance);}};
const window = {speechSynthesis:native, SpeechSynthesisUtterance:class{constructor(text){this.text=text;}}};
vm.runInNewContext(fs.readFileSync('dhamma-books-read-aloud-standard.js','utf8'),
  {window, SpeechSynthesisUtterance:window.SpeechSynthesisUtterance, document:{getElementById:()=>null}});
const profile = window.DhammaBooksReadAloudVoice;
const synth = profile.createSpeechController(native);
let ends = 0, errors = 0;
const utterance = new window.SpeechSynthesisUtterance('First second third');
Object.assign(utterance,{lang:'en-GB',voice:voices[1],rate:1.3,pitch:0.9,volume:0.7,
  onend:()=>ends++,onerror:()=>errors++});
synth.speak(utterance);
spoken[0].onboundary({charIndex:6});
synth.pause();
assert.equal(synth.paused,true);assert.equal(synth.speaking,true);assert.equal(profile.isSpeechPaused(),true);
spoken[0].onend();spoken[0].onerror({error:'voice-unavailable'});
assert.equal(ends,0);assert.equal(errors,0);
synth.resume();
assert.equal(spoken[1].text,'second third');
for(const key of ['voice','lang','rate','pitch','volume'])assert.equal(spoken[1][key],utterance[key]);
spoken[1].onboundary({charIndex:7});synth.pause();synth.resume();
assert.equal(spoken[2].text,'third');
spoken[2].onend();assert.equal(ends,1);assert.equal(synth.speaking,false);
spoken[2].onend();assert.equal(ends,1);
synth.speak(utterance);synth.pause();synth.resume();
assert.equal(spoken.at(-1).text,utterance.text,'no-boundary voices repeat only their current chunk');
const canceled=spoken.at(-1);synth.cancel();canceled.onend();canceled.onerror({error:'voice-unavailable'});
assert.equal(ends,1);assert.equal(errors,0);assert.equal(synth.paused,false);
native.paused=true;synth.cancel();assert.equal(native.paused,false);
synth.speak(utterance);synth.speak(new window.SpeechSynthesisUtterance('Queued'));
assert.equal(synth.pending,true);spoken.at(-1).onend();assert.equal(spoken.at(-1).text,'Queued');
synth.cancel();
// A real Pāli failure can fall back once, while cancellation never retries it.
profile.speakWithFallback(synth,{text:'magga',lang:'latin'},1,voices,'','__indic__',()=>ends++,()=>errors++);
spoken.at(-1).onerror({error:'voice-unavailable'});
assert.equal(spoken.at(-1).voice.lang,'en-GB');spoken.at(-1).onend();assert.equal(ends,3);
console.log('PASS shared pause/Continue, boundaries, queue, cancellation, stale events and voice fallback');
