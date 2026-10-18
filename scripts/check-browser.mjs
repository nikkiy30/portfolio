import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {setTimeout as pause} from 'node:timers/promises';
import {root,publicData,createPreviewServer,assert,verifyDistribution} from './site-lib.mjs';

let publicServer;
let developerServer;
let browser,socket;
const errors=[];
async function listen(server){await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return 'http://127.0.0.1:'+server.address().port;}
try{
 verifyDistribution(); publicServer=createPreviewServer(); developerServer=createPreviewServer({developer:true});
 const origin=await listen(publicServer);
 const devOrigin=await listen(developerServer);
 const browserPath=[process.env.PORTFOLIO_BROWSER,'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe','/usr/bin/google-chrome','/usr/bin/microsoft-edge','/usr/bin/chromium','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(p=>p&&fs.existsSync(p));
 assert(browserPath,'Chrome or Edge is required. Set PORTFOLIO_BROWSER to its executable path.');
 fs.mkdirSync(path.join(root,'work'),{recursive:true});
 const profile=fs.mkdtempSync(path.join(root,'work','release-browser-'));
 const flags=['--headless=new','--disable-gpu','--disable-background-networking','--disable-component-update','--disable-sync','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'];
 browser=spawn(browserPath,flags,{windowsHide:true,stdio:'ignore'});browser.on('error',()=>{});
 const portFile=path.join(profile,'DevToolsActivePort');
 for(let n=0;n<100&&!fs.existsSync(portFile);n++)await pause(100);
 assert(fs.existsSync(portFile),'The browser could not start.');
 const port=fs.readFileSync(portFile,'utf8').split('\n')[0];
 const info=await(await fetch('http://127.0.0.1:'+port+'/json/version')).json();
 socket=new WebSocket(info.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
 const pending=new Map();let serial=0;
 socket.onmessage=event=>{const message=JSON.parse(event.data);if(message.method==='Runtime.exceptionThrown')errors.push('Page script error');if(message.id&&pending.has(message.id)){const {resolve,reject,timer}=pending.get(message.id);pending.delete(message.id);clearTimeout(timer);message.error?reject(new Error('Browser command failed.')):resolve(message.result);}};
 const call=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const id=++serial;const timer=setTimeout(()=>{pending.delete(id);reject(new Error('Browser command timed out.'));},15000);pending.set(id,{resolve,reject,timer});socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));});
 const {targetId}=await call('Target.createTarget',{url:'about:blank'});
 const {sessionId}=await call('Target.attachToTarget',{targetId,flatten:true});
 const send=(method,params)=>call(method,params,sessionId);
 await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
 // Public data and images are local. External player availability must not decide CI results.
 await send('Network.setBlockedURLs',{urls:['https://*']});
 const evaluate=async expression=>{const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});assert(!result.exceptionDetails,'Browser assertion could not run.');return result.result.value;};
 const {projects,contacts}=publicData();const contactCount=contacts.filter(c=>c.url).length;
 async function navigate(url,width,ready){
  await send('Emulation.setDeviceMetricsOverride',{width,height:960,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url});
  const complete=await evaluate(`new Promise(resolve=>{let n=0;const ready=()=>{if(document.readyState==='complete'&&(${ready||'true'}))resolve(true);else if(n++>100)resolve(false);else setTimeout(ready,40)};ready()})`);
  assert(complete,'The page did not finish loading: '+new URL(url).pathname);
 }
 const results=[];
 for(const width of [320,375,768,1280,1440])for(const page of ['index.html','about.html','portfolio.html']){
  await navigate(origin+'/'+page,width,`document.querySelectorAll('#contact-links a').length===${contactCount}`);
  await evaluate(`Promise.all([...document.images].map(async image=>{image.loading='eager';try{await image.decode()}catch{}}))`);
  const state=await evaluate(`(()=>{const roleTexts=[...document.querySelectorAll('.profile-role-name,.profile-role-detail')];const logo=document.querySelector('.community-logo');return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,mainHeadings:document.querySelectorAll('h1').length,works:document.querySelectorAll('[data-work-card]').length,missingImages:[...document.images].filter(i=>!i.naturalWidth||!i.hasAttribute('alt')).length,roleLefts:roleTexts.map(e=>e.getBoundingClientRect().left),logo:logo?logo.getBoundingClientRect().width:null,externalLinks:[...document.querySelectorAll('a[target="_blank"]')].every(a=>a.rel.includes('noopener')),adminForms:document.querySelectorAll('#portfolio-form,#task-form').length}})()`);
  assert(state.scrollWidth<=state.width&&state.mainHeadings===1&&!state.missingImages&&state.externalLinks&&!state.adminForms,'Layout or public content check failed: '+page+' / '+width);
  assert(state.works===(page==='index.html'?projects.filter(p=>p.awards?.length).length:page==='portfolio.html'?projects.length:0),'Project rendering changed: '+page);
  if(page!=='portfolio.html')assert(state.logo>=48&&state.roleLefts.length===6&&Math.max(...state.roleLefts)-Math.min(...state.roleLefts)<1,'The affiliation text or ChoTech mark is misaligned.');
  results.push({page,width});
  if(process.argv.includes('--screenshots')&&[320,1280].includes(width)){
   const height=await evaluate('Math.ceil(document.documentElement.scrollHeight)');
   const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width,height,scale:1}});
   fs.writeFileSync(path.join(root,'work',`release-${page.replace('.html','')}-${width}.png`),Buffer.from(shot.data,'base64'));
  }
 }
 for(const width of [320,640,1280])for(const page of ['index.html','about.html','portfolio.html']){
  await navigate(origin+'/'+page,width,`document.querySelectorAll('#contact-links a').length===${contactCount}`);
  const fits=await evaluate(`(()=>{document.documentElement.style.fontSize='200%';return document.documentElement.scrollWidth<=innerWidth})()`);
  assert(fits,'Text zoom causes overflow: '+page+' / '+width);
 }
 await navigate(origin+'/portfolio.html',1280,`document.querySelectorAll('[data-work-card]').length===${projects.length}`);
 const search=await evaluate(`(()=>{const input=document.querySelector('#portfolio-search');input.value='Chop';input.dispatchEvent(new Event('input'));const matches=[...document.querySelectorAll('[data-work-card]')].filter(e=>!e.hidden).map(e=>e.querySelector('h2').textContent);input.value='no-matching-project-123';input.dispatchEvent(new Event('input'));return {matches,empty:!document.querySelector('#portfolio-empty').hidden,visible:[...document.querySelectorAll('[data-work-card]')].filter(e=>!e.hidden).length}})()`);
 assert(search.matches.includes('Chop')&&search.empty&&search.visible===0,'Project search or its empty state failed.');
 await evaluate(`localStorage.setItem('studyfolio-portfolio-admin-projects-v1',JSON.stringify([{id:999,title:'PRIVATE_DRAFT_CANARY',purpose:'private',built:'test',next:''}]))`);
 await navigate(origin+'/portfolio.html',1280,`document.querySelectorAll('[data-work-card]').length===${projects.length}`);
 assert(await evaluate(`!document.body.textContent.includes('PRIVATE_DRAFT_CANARY')`),'A draft appeared on the public site.');
 await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
 assert(await evaluate(`(()=>{const element=document.activeElement;return element.classList.contains('skip-link')&&getComputedStyle(element).outlineStyle!=='none'&&element.getBoundingClientRect().top>=0})()`),'Keyboard focus is not visible.');
 const privateRoutes=['/developer-admin.html','/portfolio-admin.html','/learning-admin.html','/learning.html','/data/learning-tasks.js','/script.js','/styles.css','/spotify.html','/work/','/docs/','/config/public-files.json'];
 for(const route of privateRoutes){const response=await fetch(origin+route);const text=await response.text();assert(response.status===404&&!text.includes('id="portfolio-form"')&&!text.includes('id="task-form"'),'A private route was served: '+route);}
 await navigate(devOrigin+'/portfolio-admin.html',1280,`!!document.querySelector('[data-edit-project]')`);
 await evaluate(`localStorage.setItem('studyfolio-portfolio-admin-projects-v1',JSON.stringify([{id:999,title:'PRIVATE_DRAFT_CANARY',purpose:'private',built:'test',next:''}]))`);
 await navigate(devOrigin+'/portfolio-admin.html',1280,`!!document.querySelector('[data-edit-project]')`);
 assert(await evaluate(`(()=>{document.querySelector('[data-edit-project]').click();const form=document.querySelector('#portfolio-form');form.elements.namedItem('title').value='PRIVATE_DRAFT_UPDATED';form.requestSubmit();return document.querySelector('#portfolio-export-output').value.includes('PRIVATE_DRAFT_UPDATED')})()`),'Local developer editing or export failed.');
 assert(!errors.length,'A page script raised an error.');
 const report={viewports:results.length,textZoomChecks:9,privateRoutes:privateRoutes.length,search:true,keyboard:true,draftIsolation:true,developerEdit:true,scriptErrors:errors.length,externalPlayback:'not checked'};
 fs.writeFileSync(path.join(root,'work','release-verification.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify(report,null,2));
 await call('Browser.close');
}catch(error){console.error('Browser check failed: '+error.message);process.exitCode=1;}
finally{if(socket)socket.close();if(browser)browser.kill();publicServer?.close();developerServer?.close();}