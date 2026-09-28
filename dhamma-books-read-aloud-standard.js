/* PAMC Dhamma-Books shared read-aloud voice profile.
 * Include this file before a book's read-aloud script.
 */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'pamc-dhamma-books:read-aloud-voice-v1';
  const DEFAULTS = Object.freeze({ voice: '', paliVoice: '__indic__', readPali: false });
  function chineseVoices(voices) {
    return Array.from(voices || []).filter(voice => /^zh/i.test(voice.lang));
  }

  function chooseVoice(voices, choice) {
    const chinese = chineseVoices(voices);
    if (choice && choice !== '__male__') {
      const selected = chinese.find(voice => voice.voiceURI === choice);
      if (selected) return selected;
    }
    return chinese.find(voice => /^zh-(CN|SG)/i.test(voice.lang))
      || chinese[0]
      || null;
  }

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return { voice: typeof saved.voice === 'string' && saved.voice !== '__male__' ? saved.voice : DEFAULTS.voice, paliVoice: typeof saved.paliVoice === 'string' ? saved.paliVoice : DEFAULTS.paliVoice, readPali: saved.readPali === true };
    } catch (_) {
      return { ...DEFAULTS };
    }
  }

  function save(settings) {
    const previous = load();
    const next = { voice: typeof settings.voice === 'string' && settings.voice !== '__male__' ? settings.voice : previous.voice, paliVoice: typeof settings.paliVoice === 'string' ? settings.paliVoice : previous.paliVoice, readPali: typeof settings.readPali === 'boolean' ? settings.readPali : previous.readPali };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch (_) {}
    return next;
  }

  // Keep each book's read-aloud controls movable without changing speech playback.
  function makePanelMovable(panel, handle, toolbar) {
    if (!panel || !handle || panel.dataset.readAloudMovable) return;
    panel.dataset.readAloudMovable = 'true';
    handle.style.cursor = 'grab';
    handle.style.touchAction = 'none';
    handle.title = 'Drag to move / 拖动以移动朗读窗口';
    handle.tabIndex = 0;
    handle.setAttribute('aria-label', 'Move read-aloud window with arrow keys / 使用方向键移动朗读窗口');

    const margin = 8;
    let moved = false;
    let pointerId = null;
    let offsetX = 0;
    let offsetY = 0;
    let naturalWidth = null;
    const clamp = (value, low, high) => Math.min(Math.max(value, low), high);
    function bounds() {
      const top = toolbar?.getBoundingClientRect().bottom || 0;
      const minTop = Math.min(Math.max(margin, top + margin), Math.max(margin, innerHeight - 60));
      return { minTop, maxTop: Math.max(minTop, innerHeight - 60) };
    }
    function place(x, y) {
      const { minTop, maxTop } = bounds();
      if (naturalWidth === null) naturalWidth = panel.getBoundingClientRect().width;
      panel.style.boxSizing = 'border-box';
      panel.style.width = `${Math.min(naturalWidth, innerWidth - margin * 2)}px`;
      const left = clamp(x, margin, Math.max(margin, innerWidth - panel.getBoundingClientRect().width - margin));
      const top = clamp(y, minTop, maxTop);
      panel.style.left = `${Math.round(left)}px`;
      panel.style.top = `${Math.round(top)}px`;
      panel.style.right = 'auto';
      panel.style.maxHeight = `${Math.max(52, innerHeight - top - margin)}px`;
      panel.style.overflow = 'auto';
      moved = true;
    }
    handle.addEventListener('pointerdown', event => {
      if (event.button !== 0 || event.target.closest('button,a,input,select,textarea')) return;
      const rect = panel.getBoundingClientRect();
      pointerId = event.pointerId;
      offsetX = event.clientX - rect.left;
      offsetY = event.clientY - rect.top;
      handle.setPointerCapture(pointerId);
      handle.style.cursor = 'grabbing';
      event.preventDefault();
    });
    handle.addEventListener('pointermove', event => {
      if (event.pointerId === pointerId) place(event.clientX - offsetX, event.clientY - offsetY);
    });
    function endDrag(event) {
      if (event.pointerId !== pointerId) return;
      pointerId = null;
      handle.style.cursor = 'grab';
      if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
    }
    handle.addEventListener('pointerup', endDrag);
    handle.addEventListener('pointercancel', endDrag);
    handle.addEventListener('keydown', event => {
      const step = event.shiftKey ? 48 : 16;
      const delta = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[event.key];
      if (!delta || event.target !== handle) return;
      const rect = panel.getBoundingClientRect();
      place(rect.left + delta[0], rect.top + delta[1]);
      event.preventDefault();
    });
    addEventListener('resize', () => {
      if (moved) {
        const rect = panel.getBoundingClientRect();
        place(rect.left, rect.top);
      }
    }, { passive: true });
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
        paliSpeechChunks(match[0].trim()).forEach(text => chunks.push({text,lang:'latin'}));
        last=match.index+match[0].length;
      }
      const after=piece.slice(last).replace(/[()（）]/g,'').trim();
      if(after)chunks.push({text:after,lang:'zh'});
    }
    return chunks;
  }

  // Small utterances are more reliable on mobile speech engines.
  function paliSpeechChunks(text) {
    const chunks=[];
    for (const piece of splitText(text)) {
      let rest=piece.trim();
      while (rest.length>90) {
        let cut=rest.lastIndexOf(' ',90);
        if (cut<35) cut=90;
        chunks.push(rest.slice(0,cut).trim());
        rest=rest.slice(cut).trim();
      }
      if (rest) chunks.push(rest);
    }
    return chunks;
  }

  // The browser has no standard Pāli voice. Let readers try installed Indic
  // voices, while keeping an explicit English fallback and a manual choice.
  function paliVoices(voices) {
    return Array.from(voices || []).filter(voice => /^(sa|hi|ne|id|en)[-_]/i.test(voice.lang));
  }

  function hasIndicVoice(voices) {
    return paliVoices(voices).some(voice => /^(sa|hi|ne|id)[-_]/i.test(voice.lang));
  }

  function choosePaliVoice(voices, choice) {
    // On mobile, the working Pāli pronunciation may be supplied by an English-tagged voice.
    if (choice === '__indic__' && /Android|iPhone|iPad|iPod/i.test(global.navigator?.userAgent || '')) choice = '__english__';
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

  // Shared collection keeps the book's source paragraphs in document order.
  function paliBlocks(reader) {
    const selector='.pali-cell,.pali-source-line,.ch10-pali-line,.opening-pali,.paired-heading-pali';
    const candidates=Array.from(reader.querySelectorAll(selector)).filter(el => {
      if (el.closest('.contents,.contents-panel,.cover,.cover-card,.modal,.footnote-popup,.proof-panel,[hidden],[aria-hidden="true"]')) return false;
      const style=getComputedStyle(el);
      return style.display!=='none' && style.visibility!=='hidden' && el.getClientRects().length>0;
    });
    return candidates.filter(el => !candidates.some(other => other!==el && el.contains(other))).map(el => {
      const copy=el.cloneNode(true);
      copy.querySelectorAll('rt,.pinyin,.footnote-ref,button,[hidden],[aria-hidden="true"],.proof-marker').forEach(node => node.remove());
      return {el,text:copy.textContent.replace(/\s+/g,' ').trim(),pali:true};
    }).filter(block => /[\p{Script=Latin}]/u.test(block.text));
  }

  function makeUtterance(chunk, rate, voices, choice, paliChoice) {
    const text=typeof chunk==='string'?chunk:chunk.text;
    const isLatin=typeof chunk!=='string'&&chunk.lang==='latin';
    const voice = isLatin?choosePaliVoice(voices, paliChoice):chooseVoice(voices, choice);
    // Indic speech engines may spell capitalised Pāḷi as initials. Lowercase
    // only the spoken Pāḷi copy; the visible book text remains unchanged.
    const spokenText=isLatin?text.toLocaleLowerCase():text;
    const utterance = new SpeechSynthesisUtterance(isLatin && !voice
      ? spokenText.replace(/[ṃṁ]/gu,'m').normalize('NFD').replace(/[\u0300-\u036f]/gu,'')
      : isLatin ? spokenText : prepareSpeechText(spokenText));
    // Keep the chosen Chinese speed; Pāli passages have a gentler pace.
    const selectedRate = Number(rate) || 1;
    utterance.rate = isLatin ? selectedRate * 0.85 : selectedRate;
    utterance.lang = isLatin?(voice?.lang || 'en-US'):'zh-CN';
    if (voice) utterance.voice = voice;
    return utterance;
  }

  const activeUtterances=new Set();
  function speakWithFallback(synth, chunk, rate, voices, choice, paliChoice, onend, onerror, onfallback) {
    const isPali=typeof chunk!=='string'&&chunk.lang==='latin';
    let retried=false;
    function play(fallback) {
      const utterance=makeUtterance(chunk,rate,synth.getVoices(),choice,fallback?'__english__':paliChoice);
      if (fallback) {
        // Some mobile voices reject Pāli diacritics; retain the original on screen.
        utterance.text=utterance.text.replace(/[ṃṁ]/gu,'m').normalize('NFD').replace(/[\u0300-\u036f]/gu,'');
        if (!/^en[-_]/i.test(utterance.voice?.lang || '')) {
          utterance.voice=null;
          utterance.lang='en-US';
        }
      }
      activeUtterances.add(utterance);
      utterance.onend=()=>{activeUtterances.delete(utterance);onend()};
      utterance.onerror=event=>{
        activeUtterances.delete(utterance);
        if (event.error==='canceled'||event.error==='interrupted') return;
        if (isPali&&!retried&&event.error!=='not-allowed') {
          retried=true;
          onfallback?.();
          play(true);
        } else onerror(event);
      };
      synth.speak(utterance);
      // Canceled utterances do not always dispatch an event on mobile.
      if (activeUtterances.size>8) activeUtterances.delete(activeUtterances.values().next().value);
    }
    play(false);
  }

  global.DhammaBooksReadAloudVoice = Object.freeze({
    version: '1.4.5',
    defaults: DEFAULTS,
    chineseVoices,
    chooseVoice,
    load,
    save,
    applyToUtterance,
    prepareSpeechText,
    splitText,
    speechChunks,
    paliSpeechChunks,
    paliVoices,
    hasIndicVoice,
    choosePaliVoice,
    paliBlocks,
    makeUtterance,
    speakWithFallback,
    makePanelMovable
  });
  // The two Hanyu Pinyin editions include their read-aloud panels in the HTML.
  const inlinePanel = document.getElementById('read-aloud-panel');
  if (inlinePanel) makePanelMovable(inlinePanel, inlinePanel.querySelector('.read-aloud-panel-head'), document.querySelector('.topbar'));
})(window);
