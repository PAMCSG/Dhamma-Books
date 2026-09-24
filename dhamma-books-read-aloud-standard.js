/* PAMC Dhamma-Books shared read-aloud voice profile.
 * Include this file before a book's read-aloud script.
 */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'pamc-dhamma-books:read-aloud-voice-v1';
  const DEFAULTS = Object.freeze({ voice: '__male__' });
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
      return { voice: typeof saved.voice === 'string' ? saved.voice : DEFAULTS.voice };
    } catch (_) {
      return { ...DEFAULTS };
    }
  }

  function save(settings) {
    const next = { voice: typeof settings.voice === 'string' ? settings.voice : DEFAULTS.voice };
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

  function makeUtterance(text, rate, voices, choice) {
    const utterance = new SpeechSynthesisUtterance(prepareSpeechText(text));
    utterance.lang = 'zh-CN';
    utterance.rate = Number(rate) || 1;
    const voice = chooseVoice(voices, choice);
    if (voice) utterance.voice = voice;
    return utterance;
  }

  global.DhammaBooksReadAloudVoice = Object.freeze({
    version: '1.0.2',
    defaults: DEFAULTS,
    chineseVoices,
    preferredMaleVoice,
    chooseVoice,
    load,
    save,
    applyToUtterance,
    prepareSpeechText,
    splitText,
    makeUtterance
  });
})(window);
