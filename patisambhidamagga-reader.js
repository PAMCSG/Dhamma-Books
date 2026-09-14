/* Shared controls for the Pāli–Chinese and full-Chinese Paṭisambhidāmagga readers. */
(function () {
  'use strict';

  const FONT_KEY = 'patisambhidamagga_reader_font_px_v2';
  const POSITION_KEY = 'patisambhidamagga_edition_position_v1';
  const PARALLEL = 'patisambhidamagga.html';
  const CHINESE = 'patisambhidamagga-chinese.html';
  const currentFile = location.pathname.split('/').pop().toLowerCase();

  function headerHeight() {
    return Math.ceil(document.querySelector('.topbar')?.getBoundingClientRect().height || 0);
  }

  function installHeaderMeasurement() {
    const header = document.querySelector('.topbar');
    const measure = () => document.documentElement.style.setProperty('--db-patisambhidamagga-header-height', headerHeight() + 'px');
    measure();
    addEventListener('resize', measure, { passive: true });
    if (header && window.ResizeObserver) new ResizeObserver(measure).observe(header);
  }

  function installContents() {
    const contents = document.getElementById('contents');
    const toggle = contents?.querySelector('.contents-toggle');
    const setOpen = open => {
      if (!contents || !toggle) return;
      contents.classList.toggle('collapsed', !open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? '收起' : '展开';
    };
    toggle?.addEventListener('click', () => setOpen(contents.classList.contains('collapsed')));
    document.getElementById('contentsBtn')?.addEventListener('click', event => {
      event.preventDefault();
      setOpen(true);
      contents?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    setOpen(true);
  }

  function installFontControls() {
    const nodes = () => document.querySelectorAll('.source-paragraph,.book-body li,.book-body td,.row article,.closing article,.matika-summary article,.patis-contents');
    const setSize = value => {
      const size = Math.max(13, Math.min(27, Math.round(value)));
      nodes().forEach(node => node.style.setProperty('font-size', size + 'px', 'important'));
      localStorage.setItem(FONT_KEY, String(size));
    };
    const size = () => Number(localStorage.getItem(FONT_KEY)) || Math.round(parseFloat(getComputedStyle(nodes()[0] || document.body).fontSize)) || 19;
    window.setReaderFontSize = setSize;
    window.decreaseReaderFont = () => setSize(size() - 1);
    window.increaseReaderFont = () => setSize(size() + 1);
    const minus = document.getElementById('fontMinus');
    const plus = document.getElementById('fontPlus');
    if (minus && !minus.hasAttribute('onclick')) minus.addEventListener('click', window.decreaseReaderFont);
    if (plus && !plus.hasAttribute('onclick')) plus.addEventListener('click', window.increaseReaderFont);
    if (localStorage.getItem(FONT_KEY)) setSize(size());
  }

  function semanticMarkers() {
    if (currentFile === PARALLEL) {
      document.querySelectorAll('.section-head[id],#introduction[id],.intro-section-heading[id]').forEach(node => {
        node.dataset.editionSection = node.id;
      });
    }
    return [...document.querySelectorAll('[data-edition-section]')];
  }

  function readingPosition() {
    const markers = semanticMarkers();
    if (!markers.length) return { section: '', ratio: 0 };
    const y = scrollY + headerHeight() + 8;
    let index = 0;
    for (let i = 0; i < markers.length; i += 1) {
      if (markers[i].getBoundingClientRect().top + scrollY <= y) index = i;
      else break;
    }
    const start = markers[index].getBoundingClientRect().top + scrollY;
    const end = index + 1 < markers.length
      ? markers[index + 1].getBoundingClientRect().top + scrollY
      : Math.max(document.documentElement.scrollHeight, start + innerHeight);
    return {
      section: markers[index].dataset.editionSection,
      ratio: Math.max(0, Math.min(1, (y - start) / Math.max(1, end - start)))
    };
  }

  function installEditionSwitch() {
    document.querySelectorAll('#editionParallel,#editionChinese').forEach(link => link.addEventListener('click', () => {
      const position = readingPosition();
      position.target = new URL(link.href, location.href).pathname.split('/').pop().toLowerCase();
      sessionStorage.setItem(POSITION_KEY, JSON.stringify(position));
    }));
    let saved;
    try { saved = JSON.parse(sessionStorage.getItem(POSITION_KEY) || 'null'); } catch (_) {}
    if (!saved || saved.target !== currentFile) return;
    sessionStorage.removeItem(POSITION_KEY);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const markers = semanticMarkers();
      let index = markers.findIndex(node => node.dataset.editionSection === saved.section);
      if (index < 0) index = Math.max(0, markers.length - 1);
      const start = markers[index]?.getBoundingClientRect().top + scrollY || 0;
      const end = index + 1 < markers.length
        ? markers[index + 1].getBoundingClientRect().top + scrollY
        : document.documentElement.scrollHeight;
      scrollTo({ top: Math.max(0, start + (end - start) * (Number(saved.ratio) || 0) - headerHeight() - 8), behavior: 'auto' });
    }));
  }

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }

  function installFootnotes() {
    const overlay = document.getElementById('noteModal');
    if (!overlay) return;
    const title = document.getElementById('noteTitle');
    const body = document.getElementById('noteBody');
    let returnY = 0;
    const close = () => {
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      scrollTo({ top: returnY, behavior: 'auto' });
    };
    document.addEventListener('click', event => {
      const ref = event.target.closest('.fn-link');
      if (!ref) return;
      const number = ref.dataset.fn;
      const source = document.getElementById('fn' + number);
      if (!source) return;
      returnY = scrollY;
      title.textContent = '註释 ' + number;
      body.innerHTML = source.innerHTML;
      overlay.classList.add('open');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && overlay.classList.contains('open')) close();
      if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('.fn-link')) {
        event.preventDefault(); event.target.click();
      }
    });
    document.getElementById('noteClose')?.addEventListener('click', close);
    overlay.addEventListener('click', event => { if (event.target === overlay) close(); });
  }

  function installPced() {
    if (currentFile === PARALLEL) return;
    const dictionary = window.PATISAMBHIDAMAGGA_PCED || {};
    const core = window.PCEDLookupCore;
    const modal = document.getElementById('pced-modal');
    if (!core || !modal || !Object.keys(dictionary).length) return;
    window.PCED = dictionary;
    window.PCEDStandardData?.applyTo?.(dictionary);
    const index = core.createExactIndex(dictionary);
    const close = () => { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; };
    const renderEntry = head => {
      const entry = dictionary[head];
      if (!entry) return '';
      const groups = core.dictionaryGroups(entry, 'zh');
      return '<div class="pced-entry"><div class="pced-headword">' + esc(entry.headword || head) + '</div>' +
        groups.map(group => '<div class="pced-analysis">' + esc(group.title || group.key) + '</div>' + group.entries.map(item =>
          '<div class="pced-source">' + esc(item.source_label || item.source || '') + '</div><div class="pced-definition">' + (item.definition || '') + '</div>'
        ).join('')).join('') + '</div>';
    };
    const open = word => {
      const result = core.resolve(word, { dictionary, index, inflections: window.PCEDStandardData?.inflections });
      const heads = result.allHeads || result.heads || [];
      document.getElementById('pced-title').textContent = word;
      document.getElementById('pced-meta').textContent = heads.length ? 'PCED 2.0.5.0' : 'PCED';
      document.getElementById('pced-body').innerHTML = heads.length ? heads.map(renderEntry).join('') : '<div class="pced-note">没有找到可靠的 PCED 词条：' + esc(word) + '</div>';
      modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden';
    };
    document.addEventListener('click', event => {
      const word = event.target.closest('.pali-word');
      if (!word) return;
      event.preventDefault(); event.stopPropagation(); open(word.dataset.word || word.textContent);
    });
    document.addEventListener('keydown', event => {
      const word = event.target.closest?.('.pali-word');
      if (word && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); open(word.dataset.word || word.textContent); }
      if (event.key === 'Escape' && modal.classList.contains('open')) close();
    });
    document.getElementById('pced-close')?.addEventListener('click', close);
    modal.addEventListener('click', event => { if (event.target === modal) close(); });
  }

  function init() {
    installHeaderMeasurement();
    installContents();
    installFontControls();
    installEditionSwitch();
    installFootnotes();
    installPced();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
