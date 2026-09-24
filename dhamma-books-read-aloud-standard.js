/* PAMC Dhamma-Books shared read-aloud voice profile.
 * Include this file before a book's read-aloud script.
 */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'pamc-dhamma-books:read-aloud-voice-v1';
  const DEFAULTS = Object.freeze({ voice: '__male__', paliVoice: '__indic__', paliScript: 'roman' });
  const MALE_NAME_PATTERN = /(male|man|男声?|康康|kangkang|yunxi|yunjian|yunyang|yunze|yunhao)/i;

  function chineseVoices(voices) {
    return Array.from(voices || []).filter(voice => /^zh/i.test(voice.lang));
  }

  function preferredMaleVoice(voices) {
    const chinese = chineseVoices(voices);
    return chinese.find(voice => /^zh-(CN|SG)/i.test(voice.lang) && MALE_NAME_PATTERN.test(voice.name))
      || chinese.find(voice => MALE_NAME_PATTERN.test(voice.name))
      || null;
  }

  function chooseVoice(voices, choice) {
    const all = Array.from(voices || []);
    if (choice && choice !== '__male__') {
      const selected = all.find(voice => voice.voiceURI === choice);
      if (selected) return selected;
    }
    const chinese = chineseVoices(all);
    return (choice === '__male__' ? preferredMaleVoice(chinese) : null)
      || chinese.find(voice => /^zh-(CN|SG)/i.test(voice.lang))
      || chinese[0]
      || null;
  }

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return { voice: typeof saved.voice === 'string' ? saved.voice : DEFAULTS.voice, paliVoice: typeof saved.paliVoice === 'string' ? saved.paliVoice : DEFAULTS.paliVoice, paliScript: saved.paliScript === 'devanagari' ? 'devanagari' : 'roman' };
    } catch (_) {
      return { ...DEFAULTS };
    }
  }

  function save(settings) {
    const previous = load();
    const next = { voice: typeof settings.voice === 'string' ? settings.voice : previous.voice, paliVoice: typeof settings.paliVoice === 'string' ? settings.paliVoice : previous.paliVoice, paliScript: settings.paliScript === 'devanagari' || settings.paliScript === 'roman' ? settings.paliScript : previous.paliScript };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch (_) {}
    return next;
  }

  function applyToUtterance(utterance, voices, settings) {
    const voice = chooseVoice(voices, settings.voice);
    if (voice) utterance.voice = voice;
    return voice;
  }

  function prepareSpeechText(text) {
    // Web Speech does not reliably support SSML phonemes. Use the unambiguous
    // homophone 葬 (zàng) in speech input only; the visible book retains 藏.
    return String(text || '').replace(/([律经經论論])藏/g, '$1葬');
  }

  function splitText(text) {
    const pieces = String(text || '').match(/[^。！？；]+[。！？；]?/gu) || [text];
    const out = [];
    pieces.forEach(piece => {
      let rest = piece.trim();
      while (rest.length > 180) {
        let cut = Math.max(rest.lastIndexOf('，', 180), rest.lastIndexOf('、', 180), rest.lastIndexOf(' ', 180));
        if (cut < 60) cut = 180;
        out.push(rest.slice(0, cut + 1));
        rest = rest.slice(cut + 1).trim();
      }
      if (rest) out.push(rest);
    });
    return out;
  }

  function speechChunks(text) {
    const chunks=[];
    const latin=/[\p{Script=Latin}][\p{Script=Latin}\p{Mark}'’\-]*(?:[\s,;:–—.]+[\p{Script=Latin}][\p{Script=Latin}\p{Mark}'’\-]*)*/gu;
    for(const piece of splitText(text)){
      let last=0;
      for(const match of piece.matchAll(latin)){
        const before=piece.slice(last,match.index).replace(/[()（）]/g,'').trim();
        if(before)chunks.push({text:before,lang:'zh'});
        chunks.push({text:match[0].trim(),lang:'latin'});
        last=match.index+match[0].length;
      }
      const after=piece.slice(last).replace(/[()（）]/g,'').trim();
      if(after)chunks.push({text:after,lang:'zh'});
    }
    return chunks;
  }

  // The browser has no standard Pāli voice. Let readers try installed Indic
  // voices, while keeping an explicit English fallback and a manual choice.
  function paliVoices(voices) {
    return Array.from(voices || []).filter(voice => /^(sa|hi|ne|id|en)[-_]/i.test(voice.lang));
  }

  function choosePaliVoice(voices, choice) {
    const available = paliVoices(voices);
    if (choice && choice !== '__indic__' && choice !== '__english__') {
      const selected = available.find(voice => voice.voiceURI === choice);
      if (selected) return selected;
    }
    const preference = choice === '__english__'
      ? [/^en[-_]IN/i, /^en[-_]GB/i, /^en[-_]/i]
      : [/^sa[-_]IN/i, /^hi[-_]IN/i, /^ne[-_]NP/i, /^id[-_]ID/i,
        /^sa[-_]/i, /^hi[-_]/i, /^ne[-_]/i, /^id[-_]/i,
        /^en[-_]IN/i, /^en[-_]GB/i, /^en[-_]/i];
    for (const pattern of preference) {
      const found = available.find(voice => pattern.test(voice.lang));
      if (found) return found;
    }
    return null;
  }

  // Roman Pāli to Devanagari for the speech engine only. Preserve text on screen.
  function paliToDevanagari(text) {
    const independent={a:'अ',ā:'आ',i:'इ',ī:'ई',u:'उ',ū:'ऊ',e:'ए',o:'ओ'};
    const dependent={a:'',ā:'ा',i:'ि',ī:'ी',u:'ु',ū:'ू',e:'े',o:'ो'};
    const consonants={kh:'ख',gh:'घ',ch:'छ',jh:'झ',ṭh:'ठ',ḍh:'ढ',th:'थ',dh:'ध',ph:'फ',bh:'भ',k:'क',g:'ग',ṅ:'ङ',c:'च',j:'ज',ñ:'ञ',ṭ:'ट',ḍ:'ड',ṇ:'ण',t:'त',d:'द',n:'न',p:'प',b:'ब',m:'म',y:'य',r:'र',l:'ल',ḷ:'ळ',v:'व',s:'स',h:'ह'};
    const units=/kh|gh|ch|jh|ṭh|ḍh|th|dh|ph|bh|[aāiīuūeoṅñṭḍṇḷṃṁkgcjtdnpbmyrlvsh]/gu;
    return String(text || '').normalize('NFC').replace(/[a-zāīūṅñṭḍṇḷṃṁ]+/giu, word => {
      const parts=word.toLowerCase().match(units);
      if (!parts || parts.join('') !== word.toLowerCase()) return word;
      let result='';
      for (let i=0;i<parts.length;i++) {
        const part=parts[i];
        if (consonants[part]) {
          const vowel=dependent[parts[i+1]];
          result+=consonants[part]+(vowel!==undefined?(i++,vowel):'्');
        } else if (independent[part]) result+=independent[part];
        else if (part==='ṃ' || part==='ṁ') result+='ं';
      }
      return result;
    });
  }

  function makeUtterance(chunk, rate, voices, choice, paliChoice, paliScript) {
    const text=typeof chunk==='string'?chunk:chunk.text;
    const isLatin=typeof chunk!=='string'&&chunk.lang==='latin';
    const voice = isLatin?choosePaliVoice(voices, paliChoice):chooseVoice(voices, choice);
    const useDevanagari=isLatin && paliScript==='devanagari' && /^(sa|hi|ne)[-_]/i.test(voice?.lang || '');
    const utterance = new SpeechSynthesisUtterance(isLatin?(useDevanagari?paliToDevanagari(text):text):prepareSpeechText(text));
    utterance.rate = Number(rate) || 1;
    utterance.lang = isLatin?(voice?.lang || 'en-IN'):'zh-CN';
    if (voice) utterance.voice = voice;
    return utterance;
  }

  global.DhammaBooksReadAloudVoice = Object.freeze({
    version: '1.3.0',
    defaults: DEFAULTS,
    chineseVoices,
    preferredMaleVoice,
    chooseVoice,
    load,
    save,
    applyToUtterance,
    prepareSpeechText,
    splitText,
    speechChunks,
    paliVoices,
    choosePaliVoice,
    paliToDevanagari,
    makeUtterance
  });
})(window);
