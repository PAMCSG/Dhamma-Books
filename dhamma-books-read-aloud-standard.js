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

  global.DhammaBooksReadAloudVoice = Object.freeze({
    version: '1.0.1',
    defaults: DEFAULTS,
    chineseVoices,
    preferredMaleVoice,
    chooseVoice,
    load,
    save,
    applyToUtterance
  });
})(window);
