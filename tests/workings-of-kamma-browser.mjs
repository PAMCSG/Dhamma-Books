import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const repo=path.resolve(process.env.BOOK_REPO||'.');
const output=path.resolve(process.env.BOOK_TEST_OUTPUT||'/tmp/workings-of-kamma-check');fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'],headless:true});
const report=[];
try {
 for(const width of [1440,320,360,412]) {
  const context=await browser.newContext({viewport:{width,height:900},hasTouch:width<721,isMobile:width<721,deviceScaleFactor:1});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',async route=>{
   const u=new URL(route.request().url());
   if(u.host==='reader.test') {
    const filename=path.join(repo,decodeURIComponent(u.pathname).replace(/^\//,''));
    if(!filename.startsWith(repo)||!fs.existsSync(filename)){await route.fulfill({status:404,body:'Not found'});return;}
    const ext=path.extname(filename);await route.fulfill({body:fs.readFileSync(filename),contentType:({'.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg'})[ext]||'application/octet-stream'});
   } else await route.fulfill({status:200,body:'{}',contentType:'application/json'});
  });
  await page.addInitScript(()=>{
   window.__speech=[];window.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
   const voices=[{name:'Test English',voiceURI:'en',lang:'en-GB'},{name:'Test Hindi',voiceURI:'hi',lang:'hi-IN'}];
   Object.defineProperty(window,'speechSynthesis',{value:{speaking:false,paused:false,getVoices:()=>voices,cancel(){this.speaking=false;},pause(){this.paused=true;},resume(){this.paused=false;},addEventListener(){},speak(u){this.speaking=true;window.__utterance=u;window.__speech.push({text:u.text,lang:u.lang,voice:u.voice?.lang});}}});
  });
  await page.goto('http://reader.test/workings-of-kamma.html',{waitUntil:'load',timeout:60000});
  await page.waitForFunction(()=>window.PAMCPopupMovement&&window.DhammaBooksReadAloudVoice);
  await page.screenshot({path:`${output}/reader-${width}-cover.png`});
  const layout=await page.evaluate(()=>{
   const ids=['contentsBtn','fontMinus','fontPlus','dbReadAloudButton','db-bookmark-button','db-search-input','db-search-button'];
   const rects=ids.map(id=>{const r=document.getElementById(id).getBoundingClientRect();return {id,x:r.x,y:r.y,w:r.width,h:r.height};});
   return {viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth,headerHeight:document.querySelector('.topbar').getBoundingClientRect().height,rects,cover:document.querySelector('.official-book-cover').getBoundingClientRect().toJSON(),title:document.querySelector('.cover-text').getBoundingClientRect().toJSON()};
  });
  assert.ok(layout.documentWidth<=width&&layout.bodyWidth<=width,`no overflow at ${width}: ${JSON.stringify(layout)}`);
  assert.ok(layout.cover.x<layout.title.x,`cover remains left at ${width}`);
  const first=layout.rects.slice(0,5);assert.ok(first.every(r=>Math.abs(r.y-first[0].y)<6),`controls stay on first row ${width}: ${JSON.stringify(layout.rects)}`);
  assert.ok(first.every((r,i)=>!i||r.x>first[i-1].x),`correct control order ${width}`);
  if(width<721)assert.ok(layout.rects[5].y>first[0].y+20,'search on second row');
  const before=await page.locator('#source-p-816').evaluate(el=>getComputedStyle(el).fontSize);
  const tocBefore=await page.locator('.toc-row').first().evaluate(el=>getComputedStyle(el).fontSize);
  await page.locator('#fontPlus').click();
  assert.ok(parseFloat(await page.locator('#source-p-816').evaluate(el=>getComputedStyle(el).fontSize))>parseFloat(before));
  assert.ok(parseFloat(await page.locator('.toc-row').first().evaluate(el=>getComputedStyle(el).fontSize))>parseFloat(tocBefore));
  await page.locator('#fontMinus').click();
  await page.locator('#contentsBtn').click();
  await page.locator('#contentsToggle').click();assert.equal(await page.locator('.contents-scroll').isVisible(),false);
  await page.locator('#contentsBtn').click();assert.equal(await page.locator('.contents-scroll').isVisible(),true);
  await page.locator('.toc-row').first().click();
  await page.waitForTimeout(80);
  const heading=await page.locator('#section-1').boundingBox();
  const header=await page.locator('.topbar').boundingBox();assert.ok(heading.y>=header.height&&heading.y<header.height+35,`heading below header ${width}`);
  const note=page.locator('#book-body .fn-marker').first();await note.click();
  assert.equal(await page.locator('#noteModal').isVisible(),true);
  const noteLayout=await page.locator('#noteModal .panel').boundingBox();assert.ok(noteLayout.y>=header.height);
  assert.ok(await page.locator('#noteBody').innerText());
  assert.equal(await page.locator('#noteModal').evaluate(el=>getComputedStyle(el).backgroundColor),'rgba(0, 0, 0, 0)');
  await page.screenshot({path:`${output}/reader-${width}-note.png`});
  await page.locator('#noteClose').click();
  await page.locator('#db-bookmark-button').click();
  await page.waitForSelector('#db-bookmark-overlay');
  const bm=page.locator('#db-bookmark-overlay');
  assert.equal(await bm.isVisible(),true);
  const btnText=await bm.locator('button').allTextContents();
  const add=bm.getByText('Add book mark here',{exact:true});if(await add.count())await add.click();
  assert.ok(await page.evaluate(()=>Object.keys(localStorage).some(k=>k.includes('bookmarks:')&&localStorage.getItem(k).length>2)));
  await page.keyboard.press('Escape');
  const bmclose=bm.locator('button').filter({hasText:'×'});if(await bm.isVisible()&&await bmclose.count())await bmclose.first().click();
  await page.locator('#db-search-input').fill('paṭiccasamuppāda');await page.locator('#db-search-button').click();
  await page.waitForTimeout(80);assert.ok(await page.locator('mark.db-search-hit').count());
  await page.locator('#db-search-input').fill('');await page.waitForTimeout(80);assert.equal(await page.locator('mark.db-search-hit').count(),0);
  // Speech uses existing language runs, starts at a chosen partial selection.
  const expected=await page.locator('#source-p-816').evaluate(el=>{
   el.scrollIntoView();const node=el.querySelector('.source-run').firstChild;
   const range=document.createRange();range.setStart(node,7);range.setEnd(node,20);const sel=getSelection();sel.removeAllRanges();sel.addRange(range);return node.data.slice(7);
  });
  await page.locator('#dbReadAloudButton').click();
  await page.locator('#db-readaloud-panel [data-action="start"]').click();
  await page.waitForFunction(()=>window.__speech.length>0);
  let spoken=await page.evaluate(()=>window.__speech[0]);assert.ok(spoken.text.startsWith(expected.trimStart()),`exact selected start ${width}: ${spoken.text}`);assert.equal(spoken.voice,'en-GB');
  await page.evaluate(()=>window.__utterance.onend());await page.waitForFunction(()=>window.__speech.length>1);assert.equal(await page.evaluate(()=>window.__speech[1].voice),'hi-IN','inline Pāli uses preferred Indic voice');
  await page.locator('.db-readaloud-close').click();assert.equal(await page.evaluate(()=>speechSynthesis.paused),true);
  await page.locator('#dbReadAloudButton').click();await page.locator('#db-readaloud-panel [data-action="stop"]').click();await page.locator('.db-readaloud-close').click();
  await page.locator('#section-1').scrollIntoViewIfNeeded();
  const word=page.locator('#source-p-820 .pali-word').first();
  await page.evaluate(()=>getSelection().removeAllRanges());await word.click();
  await page.waitForTimeout(350);
  assert.equal(await page.locator('#dictModal').isVisible(),true);
  const dictionary=await page.locator('#dictBody').innerText();assert.ok(!dictionary.includes('No reliable PCED')&&!dictionary.includes('Looking up'),`dictionary replaced placeholder ${width}`);
  await page.screenshot({path:`${output}/reader-${width}-dictionary.png`});
  const panelBefore=await page.locator('#dictModal .panel').boundingBox();
  const drag=await page.locator('#dictModal .panel-head').boundingBox();
  await page.mouse.move(drag.x+40,drag.y+15);await page.mouse.down();await page.mouse.move(drag.x+55,drag.y+65,{steps:5});await page.mouse.up();
  const panelAfter=await page.locator('#dictModal .panel').boundingBox();assert.ok(panelAfter.y>panelBefore.y+20,'dictionary panel draggable');assert.ok(panelAfter.y>=header.height);
  await page.locator('#dictClose').click();
  const sticky=await page.locator('.topbar').boundingBox();assert.equal(sticky.y,0,'header remains at top');
  if(width<721){
   const session=await context.newCDPSession(page);
   await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:width*.75,y:650}]});
   await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:width*.25,y:650}]});
   await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   assert.equal(await page.evaluate(()=>scrollX),0);
  }
  assert.equal(errors.length,0,errors.join('\n'));
  report.push({width,layout,passed:['header order and sticky position','cover left','no document overflow','font controls and Contents resize','Contents expand/collapse and link offset','footnote popup and transparent overlay','saved bookmark','Search and clear','selected speech start and close-to-pause','PCED lookup',...(width<721?['one-finger horizontal swipe containment']:[])],dictionaryExcerpt:dictionary.slice(0,100)});
  console.log('PASS',width);await context.close();
 }
 fs.writeFileSync(path.join(output,'browser-report.json'),JSON.stringify(report,null,2));
}finally{await browser.close();}
