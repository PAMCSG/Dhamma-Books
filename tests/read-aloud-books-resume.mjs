import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const repo = path.resolve(process.env.BOOK_REPO || '.');
const output = path.resolve(process.env.BOOK_TEST_OUTPUT || '/tmp/read-aloud-books-resume');
const baseline = process.env.READ_ALOUD_BASELINE;
fs.mkdirSync(output, {recursive: true});
const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH,
  headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage']});
const files = baseline ? ['the-requisites-of-enlightenment.html'] : [
  'the-requisites-of-enlightenment.html', 'the-buddhas-twelve-kinds-of-evil-retribution.html', 'zhiguan-fayao.html'];
const report = [];
try {
  for (const file of files) for (const width of baseline ? [1440] : [1440, 360]) {
    const context = await browser.newContext({viewport: {width, height: 900}, isMobile: width < 721, hasTouch: width < 721});
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.host !== 'reader.test') return route.fulfill({body: '{}', contentType: 'application/json'});
      const relative = decodeURIComponent(url.pathname).slice(1);
      const filename = path.resolve(repo, relative);
      assert.ok(filename.startsWith(repo + path.sep));
      if (!fs.existsSync(filename)) return route.fulfill({status: 404, body: 'Not found'});
      const body = baseline && relative === 'dhamma-books-read-aloud-books.js'
        ? fs.readFileSync(baseline) : fs.readFileSync(filename);
      await route.fulfill({body, contentType: ({'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg'})[path.extname(filename)] || 'application/octet-stream'});
    });
    await page.addInitScript(() => {
      window.__spoken = []; window.__utterances = []; window.__nativeResume = 0;
      window.SpeechSynthesisUtterance = class {constructor(text) {this.text = text;}};
      const voices = [{name: 'Chinese test', voiceURI: 'zh', lang: 'zh-CN'},
        {name: 'English test', voiceURI: 'en', lang: 'en-GB'},
        {name: 'Indic test', voiceURI: 'hi', lang: 'hi-IN'}];
      Object.defineProperty(window, 'speechSynthesis', {value: {
        speaking: false, paused: false, onvoiceschanged: null,
        getVoices: () => voices, addEventListener() {},
        speak(utterance) {this.speaking = true; window.__utterances.push(utterance);
          window.__spoken.push({text: utterance.text, lang: utterance.lang, voice: utterance.voice?.lang, rate: utterance.rate});},
        // Reproduce a browser that loses speaking state and cannot natively resume.
        pause() {this.speaking = false; this.paused = true;},
        resume() {window.__nativeResume++; this.paused = false;},
        cancel() {this.speaking = false;}
      }});
    });
    await page.goto(`http://reader.test/${file}`, {waitUntil: 'load', timeout: 60000});
    const zhButton = page.locator('#zhBtn');
    if (await zhButton.count()) await zhButton.click();
    await page.locator('#dbReadAloudButton').click();
    await page.selectOption('#db-readaloud-pali-voice', 'hi');
    await page.selectOption('#db-readaloud-rate', '1.15');
    const selectParagraph = async () => page.evaluate(() => {
      const root = document.querySelector('#zhPanel:not([hidden]),#reader-zh');
      const paragraph = [...root.querySelectorAll('p.text-block')].find(el =>
        el.textContent.length > 80 && el.querySelector('.pali-word') && /[\u3400-\u9fff]/.test(el.textContent));
      if (!paragraph) throw new Error('No mixed Chinese/Pāli paragraph found');
      paragraph.scrollIntoView();
      const range = document.createRange(); range.selectNodeContents(paragraph);
      getSelection().removeAllRanges(); getSelection().addRange(range);
    });
    await selectParagraph();
    await page.locator('[data-action="selection"]').click();
    await page.waitForFunction(() => window.__spoken.length > 0);
    const original = await page.evaluate(() => window.__spoken[0]);
    assert.equal(original.voice, 'zh-CN');
    const boundary = Math.min(3, original.text.length - 1);
    if (!baseline) await page.evaluate(index => window.__utterances.at(-1).onboundary({charIndex: index, name: 'word'}), boundary);
    const toggle = page.locator('[data-action="pause"]');
    await toggle.click();
    assert.equal(await toggle.innerText(), '继续');
    assert.equal(await page.evaluate(() => speechSynthesis.speaking), false);
    if (!baseline) {
      // Delayed completion and failure from canceled speech must not advance or retry.
      await page.evaluate(() => {window.__utterances[0].onend?.(); window.__utterances[0].onerror?.({error: 'voice-unavailable'});});
      assert.equal(await page.evaluate(() => window.__spoken.length), 1);
    }
    await toggle.click();
    if (baseline) {
      assert.equal(await page.evaluate(() => window.__spoken.length), 1);
      assert.equal(await toggle.innerText(), '继续');
      report.push({file, width, reproduced: 'Continue does nothing when paused browser reports speaking=false'});
    } else {
      let spoken = await page.evaluate(() => window.__spoken);
      assert.equal(spoken.length, 2);
      assert.equal(spoken[1].text, original.text.slice(boundary));
      assert.equal(spoken[1].voice, original.voice); assert.equal(spoken[1].rate, original.rate);
      assert.equal(await toggle.innerText(), '暂停');
      await page.evaluate(() => {window.__utterances[0].onend?.(); window.__utterances[0].onerror?.({error: 'voice-unavailable'});});
      assert.equal(await page.evaluate(() => window.__spoken.length), 2);
      // Closing controls pauses speech; reopening and Continue replays the current remainder.
      await page.locator('.db-readaloud-close').click();
      await page.locator('#dbReadAloudButton').click();
      await toggle.click();
      assert.equal(await page.evaluate(() => window.__spoken.length), 3);
      assert.equal(await page.evaluate(() => window.__spoken.at(-1).text), spoken[1].text);
      // Completion advances to subsequent Chinese and Pāli chunks with their own voice.
      for (let i = 0; i < 20; i++) {
        const last = await page.evaluate(() => window.__spoken.at(-1));
        if (last.voice === 'hi-IN') break;
        await page.evaluate(() => window.__utterances.at(-1).onend?.());
      }
      assert.equal(await page.evaluate(() => window.__spoken.at(-1).voice), 'hi-IN');
      const pali = await page.evaluate(() => window.__spoken.at(-1));
      await toggle.click(); await toggle.click();
      assert.deepEqual(await page.evaluate(() => window.__spoken.at(-1)), pali, 'resume preserves Pāli voice and rate');
      await page.locator('[data-action="stop"]').click();
      const count = await page.evaluate(() => window.__spoken.length);
      await page.evaluate(() => window.__utterances.forEach(utterance => {utterance.onend?.(); utterance.onerror?.({error: 'voice-unavailable'});}));
      assert.equal(await page.evaluate(() => window.__spoken.length), count);
      assert.equal(await toggle.isDisabled(), true);
      // Engines without boundary events safely repeat only the current small chunk.
      await selectParagraph(); await page.locator('[data-action="selection"]').click();
      const wholeChunk = await page.evaluate(() => window.__spoken.at(-1));
      await toggle.click(); await toggle.click();
      assert.deepEqual(await page.evaluate(() => window.__spoken.at(-1)), wholeChunk);
      // Repeated pauses retain offsets relative to the complete original chunk.
      const step = Math.min(2, wholeChunk.text.length - 1);
      await page.evaluate(index => window.__utterances.at(-1).onboundary({charIndex: index}), step);
      await toggle.click(); await toggle.click();
      assert.equal(await page.evaluate(() => window.__spoken.at(-1).text), wholeChunk.text.slice(step));
      // A restart also clears a native paused flag left by the browser.
      await toggle.click();
      await page.evaluate(() => {speechSynthesis.paused = true;});
      await selectParagraph(); await page.locator('[data-action="start"]').click();
      assert.equal(await page.evaluate(() => speechSynthesis.paused), false);
      assert.equal(await toggle.innerText(), '暂停');
      if (file === 'the-requisites-of-enlightenment.html') {
        await page.locator('#enBtn').click();
        await page.waitForFunction(() => document.querySelector('[data-action="selection"]').textContent === 'Read Selected Text');
        for (const mixed of [false, true]) {
          const selected = await page.evaluate(mixed => {
            const paragraph = [...document.querySelectorAll('#enPanel p.text-block')].find(el =>
              el.textContent.length > 80 && !!el.querySelector('.pali-word') === mixed && /^[A-Za-z“"'\s]/.test(el.textContent));
            paragraph.scrollIntoView();
            const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT);
            const node = walker.nextNode();
            const range = document.createRange(); range.selectNodeContents(paragraph);
            range.setStart(node, Math.min(2, node.length - 1));
            getSelection().removeAllRanges(); getSelection().addRange(range);
            return getSelection().toString().replace(/\s+/g, ' ').trim();
          }, mixed);
          await page.locator('[data-action="selection"]').click();
          let english = await page.evaluate(() => window.__spoken.at(-1));
          assert.equal(english.voice, 'en-GB');
          assert.ok(selected.startsWith(english.text));
          await page.evaluate(() => window.__utterances.at(-1).onboundary({charIndex: 4}));
          await toggle.click(); await toggle.click();
          assert.equal(await page.evaluate(() => window.__spoken.at(-1).text), english.text.slice(4));
          assert.equal(await page.evaluate(() => window.__spoken.at(-1).voice), 'en-GB');
          await page.locator('[data-action="stop"]').click();
        }
        await page.locator('#zhBtn').click();
      }
      await page.screenshot({path: path.join(output, `${file}-${width}.png`)});
      report.push({file, width, passed: ['Continue with speaking=false and broken native resume',
        'last word boundary retained', 'same voice and rate', 'stale speech callbacks ignored',
        'close/reopen/Continue', 'Chinese to Pāli voice transition', 'Pāli Continue',
        'Stop invalidates callbacks', 'no-boundary fallback', 'repeated pauses', 'restart clears native pause',
        ...(file === 'the-requisites-of-enlightenment.html' ? ['English and mixed English/Pāli partial selections', 'language switching'] : [])]});
    }
    assert.deepEqual(errors, []);
    console.log('PASS', baseline ? 'original failure reproduced' : 'pause/Continue', file, width);
    await context.close();
  }
  fs.writeFileSync(path.join(output, baseline ? 'baseline.json' : 'verification.json'), JSON.stringify(report, null, 2));
} finally {await browser.close();}
