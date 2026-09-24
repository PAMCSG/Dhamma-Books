/* Keep the screen awake during read-aloud on phones and tablets. */
(() => {
  'use strict';
  if (!/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) return;
  const panel = document.getElementById('read-aloud-panel') || document.getElementById('db-readaloud-panel');
  if (!panel) return;
  const start = panel.querySelector('#read-aloud-start,[data-action="start"]');
  const pause = panel.querySelector('#read-aloud-pause,[data-action="pause"]');
  const stop = panel.querySelector('#read-aloud-stop,[data-action="stop"]');
  if (!start || !pause || !stop) return;
  let lock = null, reading = false, generation = 0;
  async function release() {
    generation++;
    const current = lock;
    lock = null;
    if (current) await current.release().catch(() => {});
  }
  async function keepAwake() {
    if (!reading || document.hidden || lock || !navigator.wakeLock?.request) return;
    const request = ++generation;
    try {
      const next = await navigator.wakeLock.request('screen');
      if (request !== generation || !reading || document.hidden) {
        await next.release();
      } else {
        lock = next;
        next.addEventListener('release', () => { if (lock === next) lock = null; });
      }
    } catch (_) { /* Browsers can deny wake locks; reading remains usable. */ }
  }
  start.addEventListener('click', () => {
    queueMicrotask(() => {
      reading = !stop.disabled;
      if (reading) keepAwake();
      else release();
    });
  });
  pause.addEventListener('click', () => {
    queueMicrotask(() => { if (speechSynthesis.paused) release(); else if (reading) keepAwake(); });
  });
  stop.addEventListener('click', () => { reading = false; release(); });
  new MutationObserver(() => { if (stop.disabled && reading) { reading = false; release(); } })
    .observe(stop, {attributes:true, attributeFilter:['disabled']});
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) release();
    else if (reading && !speechSynthesis.paused) keepAwake();
  });
  addEventListener('pagehide', () => { reading = false; release(); });
})();
