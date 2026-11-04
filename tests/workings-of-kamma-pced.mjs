import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const repo = path.resolve(process.env.BOOK_REPO || '.');
const output = path.resolve(process.env.BOOK_TEST_OUTPUT || '/tmp/workings-of-kamma-pced');
const baseline = process.env.PCED_BASELINE_DIR;
fs.mkdirSync(output, {recursive: true});
const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH,
  headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage']});
const report = [];
try {
  for (const width of baseline ? [1440] : [1440, 320, 360, 412]) {
    const context = await browser.newContext({viewport: {width, height: 900},
      isMobile: width < 721, hasTouch: width < 721});
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.host !== 'reader.test') {
        await route.fulfill({body: '{}', contentType: 'application/json'});
        return;
      }
      const relative = decodeURIComponent(url.pathname).replace(/^\//, '');
      const root = baseline && ['workings-of-kamma.html', 'workings-of-kamma.js'].includes(relative)
        ? path.resolve(baseline) : repo;
      const filename = path.resolve(root, relative);
      assert.ok(filename.startsWith(root + path.sep));
      if (!fs.existsSync(filename)) {
        await route.fulfill({status: 404, body: 'Not found'});
        return;
      }
      // Deferred scripts must retain their order even when the data loads slowly.
      if (relative === 'pced-standard-data.js') await new Promise(resolve => setTimeout(resolve, 150));
      await route.fulfill({body: fs.readFileSync(filename), contentType:
        ({'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
          '.jpg': 'image/jpeg', '.png': 'image/png'})[path.extname(filename)] || 'application/octet-stream'});
    });
    await page.goto('http://reader.test/workings-of-kamma.html', {waitUntil: 'load', timeout: 60000});
    await page.waitForFunction(() => window.PaliLookupMorphology && window.PAMCPopupMovement);
    assert.ok(await page.evaluate(() => Object.keys(window.PCED_ENTRIES).length > 0));
    const styled = await page.locator('#pamc-pced-standard-style').count();
    const word = page.locator('#book-body .pali-word[data-word="Magga"]').first();
    await word.click();
    await page.waitForSelector('.pced-inflection-toggle');
    const toggle = page.locator('#dictBody .pced-inflection-toggle').first();
    if (!baseline) await page.screenshot({path: path.join(output, `pced-definitions-${width}.png`)});
    await toggle.click();
    const expanded = await toggle.getAttribute('aria-expanded');
    if (baseline) {
      assert.equal(styled, 0);
      assert.equal(expanded, 'false');
      report.push({width, reproduced: ['standard popup styles absent', 'Inflections click has no effect']});
    } else {
      assert.equal(styled, 1, 'standard styling initialized before the first lookup');
      assert.equal(expanded, 'true');
      const inflections = page.locator('#dictBody .pced-inflection-panel').first();
      assert.equal(await inflections.isVisible(), true);
      assert.ok((await inflections.innerText()).includes('maggo'));
      assert.ok(await inflections.locator('table').count());
      const languageOrder = await page.locator('#dictBody .group-title').allTextContents();
      assert.equal(languageOrder[0], 'English');
      assert.equal(languageOrder[1], '中文');
      assert.match(await page.locator('#dictMeta').innerText(), /PCED 2\.0\.5\.0/);
      const color = await page.locator('#dictModal .panel-head').evaluate(el => getComputedStyle(el).backgroundColor);
      assert.equal(color, 'rgb(117, 72, 45)');
      assert.equal(await page.locator('#dictClose').evaluate(el => getComputedStyle(el).color), 'rgb(255, 255, 255)');
      const header = await page.locator('.topbar').boundingBox();
      const panel = await page.locator('#dictModal .panel').boundingBox();
      assert.ok(panel.y >= header.y + header.height - 1, 'popup opens below the full book header');
      assert.ok(panel.y < header.y + header.height + 25, 'header offset is applied only once');
      assert.ok(panel.y + panel.height <= 901, 'long tables stay inside the viewport');
      assert.ok(panel.x >= -1 && panel.x + panel.width <= width + 1, 'popup fits viewport');
      await page.screenshot({path: path.join(output, `pced-magga-${width}.png`)});
      await toggle.click();
      assert.equal(await inflections.isVisible(), false);
      assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
      await page.locator('#dictClose').click();
      await word.click();
      assert.equal(await toggle.getAttribute('aria-expanded'), 'false', 'reopening resets the table');
      assert.equal(await page.locator('#dictBody').evaluate(el => el.scrollTop), 0);
      await toggle.click();
      assert.equal(await inflections.isVisible(), true, 'button still works after reopening');
      assert.equal(await page.locator('#dictModal').evaluate(el => getComputedStyle(el).backgroundColor), 'rgba(0, 0, 0, 0)');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      report.push({width, languageOrder, color, passed: ['synchronous dictionary initialization',
        'standard popup presentation', 'Inflections expand/collapse', 'declension table contents',
        'reopen and reset', 'version and language metadata', 'below-header placement',
        'viewport containment', 'transparent overlay']});
    }
    assert.deepEqual(errors, []);
    console.log('PASS', baseline ? 'reproduced original bug' : 'corrected popup', width);
    await context.close();
  }
  fs.writeFileSync(path.join(output, baseline ? 'baseline-report.json' : 'pced-report.json'), JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
