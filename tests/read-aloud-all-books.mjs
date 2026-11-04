import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const repo=path.resolve(process.env.BOOK_REPO||'.');
const out=path.resolve(process.env.BOOK_TEST_OUTPUT||'/tmp/read-aloud-all-books');
fs.mkdirSync(out,{recursive:true});
const files=fs.readdirSync(repo).filter(name=>name.endsWith('.html')&&fs.readFileSync(path.join(repo,name),'utf8').includes('dhamma-books-read-aloud-standard.js')&&(!process.env.BOOK_FILTER||name.includes(process.env.BOOK_FILTER))).sort();
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const checkpoint=path.join(out,'partial.json');
const report=process.env.BOOK_RESUME&&fs.existsSync(checkpoint)?JSON.parse(fs.readFileSync(checkpoint,'utf8')):[];
const saveCheckpoint=()=>fs.writeFileSync(checkpoint,JSON.stringify(report,null,2));
function existingCounterErrors(file,errors){
 return errors.filter(error=>{
  const match=error.match(/\.html:(\d+):\d+/);
  return match&&error.includes("Cannot set properties of null")&&fs.readFileSync(path.join(repo,file),'utf8').split('\n')[Number(match[1])-1]?.includes("getElementById('resultCount')");
 });
}
async function setup(file,width){
 const context=await browser.newContext({viewport:{width,height:900},hasTouch:width<721,isMobile:width<721});
 const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.stack||error.message));
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.host!=='reader.test')return route.fulfill({body:'{}',contentType:'application/json'});
  const name=path.resolve(repo,decodeURIComponent(url.pathname).slice(1));assert.ok(name.startsWith(repo+path.sep));
  if(!fs.existsSync(name))return route.fulfill({status:404,body:'Not found'});
  await route.fulfill({body:fs.readFileSync(name),contentType:({'.js':'text/javascript','.css':'text/css','.html':'text/html','.jpg':'image/jpeg','.png':'image/png'})[path.extname(name)]||'application/octet-stream'});
 });
 await page.addInitScript(()=>{
  window.__spoken=[];window.__utterances=[];window.__audios=[];window.__deferTTS=false;
  window.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
  const voices=[{voiceURI:'zh',name:'Chinese test',lang:'zh-CN'},{voiceURI:'hi',name:'Indic test',lang:'hi-IN'},{voiceURI:'en',name:'English test',lang:'en-GB'},{voiceURI:'my',name:'Burmese test',lang:'my-MM'}];
  Object.defineProperty(window,'speechSynthesis',{value:{speaking:false,paused:false,onvoiceschanged:null,getVoices:()=>voices,addEventListener(){},removeEventListener(){},
   pause(){this.speaking=false;this.paused=true;},resume(){this.paused=false;},cancel(){this.speaking=false;},
   speak(u){this.speaking=true;window.__utterances.push(u);window.__spoken.push({text:u.text,voice:u.voice?.lang,lang:u.lang,rate:u.rate});}}});
  window.Audio=class{constructor(){this.currentTime=0;this.paused=true;this.plays=0;window.__audios.push(this);}pause(){this.paused=true;}play(){this.paused=false;this.plays++;return Promise.resolve();}removeAttribute(){}load(){}};
  const fetch=window.fetch.bind(window);
  window.fetch=(url,...args)=>String(url).includes('/api/burmese-tts')?new Promise(resolve=>{
   const done=()=>resolve(new Response(new Blob(['audio'],{type:'audio/mpeg'}),{status:200}));
   if(window.__deferTTS)window.__releaseTTS=done;else done();
  }):fetch(url,...args);
 });
 await page.goto(`http://reader.test/${file}`,{waitUntil:'load',timeout:90000});
 await page.evaluate(()=>{const reader=document.getElementById('readerView');if(reader&&getComputedStyle(reader).display==='none')document.getElementById('btnReader')?.click();});
 const legacy=await page.locator('#readAloudBtn').count()>0;
 const selectors=legacy?{open:'#readAloudBtn',close:'#read-aloud-close',start:'#read-aloud-start',selection:'#read-aloud-selection',pause:'#read-aloud-pause',stop:'#read-aloud-stop',pali:'#read-aloud-read-pali',voice:'#read-aloud-voice'}:
  {open:'#dbReadAloudButton',close:'.db-readaloud-close',start:'[data-action="start"]',selection:'[data-action="selection"]',pause:'[data-action="pause"]',stop:'[data-action="stop"]',pali:'#db-readaloud-read-pali',voice:'#db-readaloud-voice'};
 await page.locator(selectors.open).click();
 await page.selectOption(selectors.pali,'yes');
 return{context,page,errors,s:selectors};
}
try{
 for(const file of files)for(const width of [1440,360]){
  if(report.some(row=>row.file===file&&row.width===width&&row.mode==='installed voice'))continue;
  const {context,page,errors,s}=await setup(file,width);
  if(await page.locator(`${s.voice} option[value="my"]`).count())await page.selectOption(s.voice,'my');
  await page.locator(s.start).click();
  await page.waitForFunction(()=>window.__spoken.length>0,{},{timeout:15000});
  const first=await page.evaluate(()=>window.__spoken.at(-1));
  const offset=Math.min(3,first.text.length-1);
  await page.evaluate(i=>window.__utterances.at(-1).onboundary({charIndex:i,name:'word'}),offset);
  const count=await page.evaluate(()=>window.__spoken.length);
  await page.locator(s.pause).click();const pausedLabel=await page.locator(s.pause).innerText();
  assert.equal(await page.evaluate(()=>speechSynthesis.speaking),false);
  assert.equal(await page.evaluate(()=>DhammaBooksReadAloudVoice.isSpeechPaused()),true);
  await page.evaluate(()=>{window.__canceled=window.__utterances.at(-1);window.__canceled.onend?.();window.__canceled.onerror?.({error:'voice-unavailable'});});
  assert.equal(await page.evaluate(()=>window.__spoken.length),count);
  await page.locator(s.pause).click();
  assert.equal(await page.evaluate(()=>window.__spoken.length),count+1);
  const resumed=await page.evaluate(()=>window.__spoken.at(-1));
  assert.equal(resumed.text,first.text.slice(offset));assert.equal(resumed.voice,first.voice);assert.equal(resumed.rate,first.rate);
  assert.notEqual(await page.locator(s.pause).innerText(),pausedLabel);
  await page.locator(s.close).click();await page.locator(s.open).click();await page.locator(s.pause).click();
  assert.deepEqual(await page.evaluate(()=>window.__spoken.at(-1)),resumed);
  await page.locator(s.pause).click();await page.locator(s.pause).click();
  assert.deepEqual(await page.evaluate(()=>window.__spoken.at(-1)),resumed);
  await page.locator(s.stop).click();const stopped=await page.evaluate(()=>window.__spoken.length);
  await page.evaluate(()=>window.__utterances.forEach(u=>{u.onend?.();u.onerror?.({error:'voice-unavailable'});}));
  assert.equal(await page.evaluate(()=>window.__spoken.length),stopped);
  assert.equal(await page.locator(s.pause).isDisabled(),true);
  await page.locator(s.start).click();assert.equal(await page.evaluate(()=>window.__spoken.length),stopped+1);
  await page.locator(s.stop).click();
  const languageModes=[];
  for(const id of ['#langEn','#langZh'])if(await page.locator(id).count()){
   await page.locator(id).click();
   const before=await page.evaluate(()=>window.__spoken.length);
   await page.locator(s.start).click();assert.equal(await page.evaluate(()=>window.__spoken.length),before+1);
   const segment=await page.evaluate(()=>window.__spoken.at(-1));
   await page.locator(s.pause).click();await page.locator(s.pause).click();
   assert.deepEqual(await page.evaluate(()=>window.__spoken.at(-1)),segment);
   await page.locator(s.stop).click();languageModes.push({control:id,voice:segment.voice,passed:true});
  }
  const legacyErrors=existingCounterErrors(file,errors);
  assert.deepEqual(errors.filter(error=>!legacyErrors.includes(error)),[]);
  report.push({file,width,mode:'installed voice',voice:first.voice,languageModes,preexistingPageErrors:legacyErrors,passed:['pause/Continue with native speaking=false and broken resume','word-boundary continuation','voice and rate retained','close/reopen','repeated pause','stale callbacks ignored','Stop/restart']});
  saveCheckpoint();
  console.log('PASS',file,width);await context.close();
 }
 const burmese=files.filter(file=>file.includes('burmese'));
 for(const file of burmese){
  if(report.some(row=>row.file===file&&row.mode==='Burmese online audio'))continue;
  const {context,page,errors,s}=await setup(file,360);
  await page.selectOption(s.voice,'__azure_thiha__');
  const selectMyanmar=async()=>page.evaluate(()=>{
   const candidates=[...document.querySelectorAll('main p,.reader p,#readerView p,.my-cell,.my-text,.source-line,.gatha-line,.chanting-my')].filter(el=>
    /[က-႟]/.test(el.textContent)&&el.textContent.length>20&&el.getClientRects().length&&!el.closest('.contents,.contents-panel,[hidden]'));
   const el=candidates.find(el=>el.textContent.length>200&&el.textContent.length<1200)||candidates[0];if(!el)throw Error('No Myanmar selection found');
   el.scrollIntoView();const range=document.createRange();range.selectNodeContents(el);getSelection().removeAllRanges();getSelection().addRange(range);
  });
  await selectMyanmar();await page.locator(s.selection).click();
  await page.waitForFunction(()=>window.__audios.length>0);
  await page.evaluate(()=>{window.__audios.at(-1).currentTime=12.5;});
  await page.locator(s.pause).click();assert.equal(await page.evaluate(()=>window.__audios.at(-1).paused),true);
  await page.locator(s.pause).click();assert.equal(await page.evaluate(()=>window.__audios.at(-1).currentTime),12.5);
  assert.equal(await page.evaluate(()=>window.__audios.at(-1).paused),false);
  await page.locator(s.close).click();await page.locator(s.open).click();await page.locator(s.pause).click();
  assert.equal(await page.evaluate(()=>window.__audios.at(-1).currentTime),12.5);
  const audioCount=await page.evaluate(()=>window.__audios.length);
  await page.locator(s.pause).click();await page.evaluate(()=>window.__audios.at(-1).onended());
  await page.locator(s.pause).click();await page.waitForFunction(({count,selector})=>window.__audios.length>count||document.querySelector(selector).disabled,{count:audioCount,selector:s.stop});
  await page.locator(s.stop).click();
  // Pause/Continue also works before the online response arrives.
  await page.evaluate(()=>{window.__deferTTS=true;});await selectMyanmar();await page.locator(s.selection).click();
  await page.waitForFunction(()=>!!window.__releaseTTS);await page.locator(s.pause).click();await page.locator(s.pause).click();
  const before=await page.evaluate(()=>window.__audios.length);await page.evaluate(()=>{window.__deferTTS=false;window.__releaseTTS();});
  await page.waitForFunction(n=>window.__audios.length>n,before);assert.equal(await page.evaluate(()=>window.__audios.at(-1).paused),false);
  await page.locator(s.stop).click();const legacyErrors=existingCounterErrors(file,errors);
  assert.deepEqual(errors.filter(error=>!legacyErrors.includes(error)),[]);
  report.push({file,width:360,mode:'Burmese online audio',preexistingPageErrors:legacyErrors,passed:['same audio position retained','close/reopen','ended while paused','pause/Continue during pending response','Stop']});
  saveCheckpoint();
  console.log('PASS online Burmese',file);await context.close();
 }
 fs.writeFileSync(path.join(out,'all-books-verification.json'),JSON.stringify({books:files.length,cases:report.length,report},null,2));
}finally{await browser.close();}
