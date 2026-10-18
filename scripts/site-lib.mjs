import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';

export const root=fs.realpathSync(fileURLToPath(new URL('../',import.meta.url)));
export const output=path.resolve(root,'dist');
export function assert(condition,message){if(!condition)throw new Error(message);}
export function read(relative){return fs.readFileSync(path.join(root,relative),'utf8');}
const inside=(base,target)=>{const relative=path.relative(base,target);return relative!==''&&!relative.startsWith('..'+path.sep)&&relative!=='..'&&!path.isAbsolute(relative);};
const blocked=/(^|\/)(?:docs|work|\.git|\.github|scripts|config|node_modules|dist)(\/|$)|(?:^|\/)\.env(?:\.|$)|admin|(?:^|\/)(?:learning(?:-tasks)?\.(?:html|js)|spotify\.html|script\.js|styles\.css)$/i;
export function manifest(){
 const files=JSON.parse(read('config/public-files.json'));
 assert(Array.isArray(files)&&files.length>0,'The public file list is empty.');
 assert(new Set(files).size===files.length,'The public file list contains duplicates.');
 for(const file of files){
  assert(typeof file==='string'&&file===file.trim()&&!file.startsWith('/')&&!file.includes('\\')&&!file.split('/').includes('..')&&!blocked.test(file),'A private or invalid path is in the public file list.');
  assert(file==='_headers'||/\.(?:html|css|js|svg|png|jpeg|jpg|webp|txt)$/.test(file),'An unsupported file type is in the public file list.');
 }
 return files;
}
function sourceFile(file){
 const target=path.resolve(root,file);
 assert(inside(root,target)&&fs.existsSync(target),'A public file is missing: '+file);
 const actual=fs.realpathSync(target);
 assert(inside(root,actual)&&fs.statSync(actual).isFile()&&!fs.lstatSync(target).isSymbolicLink(),'Public files must be regular files inside the repository.');
 return actual;
}
export function publicData(){
 const context=vm.createContext({window:{}},{codeGeneration:{strings:false,wasm:false}});
 for(const file of ['data/portfolio-projects.js','data/contact-links.js'])vm.runInContext(read(file),context,{timeout:1000});
 return {projects:context.window.portfolioProjects,contacts:context.window.portfolioContacts};
}
function secureUrl(value){try{return new URL(value).protocol==='https:';}catch{return false;}}
export function validateSource(){
 const files=manifest();const allowed=new Set(files);
 for(const file of files)sourceFile(file);
 for(const file of [...files.filter(f=>f.endsWith('.js')),'script.js']){
  const check=spawnSync(process.execPath,['--check',path.join(root,file)],{encoding:'utf8',windowsHide:true});
  assert(check.status===0,'JavaScript syntax check failed: '+file);
 }
 const {projects,contacts}=publicData();
 assert(Array.isArray(projects)&&projects.length>0&&Array.isArray(contacts),'Public data must contain project and contact arrays.');
 const ids=new Set();
 for(const project of projects){
  assert(project.id!==undefined&&!ids.has(String(project.id)),'Project IDs must be unique.');ids.add(String(project.id));
  for(const field of ['title','purpose','built'])assert(typeof project[field]==='string'&&project[field].trim(),'A required project field is empty.');
  if(project.image)assert(allowed.has(project.image.src)&&project.image.alt?.trim(),'A project image or its description is missing from the public file list.');
  for(const link of project.links||[])assert(link.label?.trim()&&secureUrl(link.url),'Project links must have a label and an HTTPS URL.');
 }
 for(const contact of contacts){
  if(!contact.url)continue;
  assert(contact.label?.trim()&&secureUrl(contact.url),'Contact links must have a label and an HTTPS URL.');
  if(contact.icon)assert(allowed.has(contact.icon),'A contact icon is not in the public file list.');
 }
 const htmlFiles=files.filter(f=>f.endsWith('.html'));
 const idsByFile=new Map();
 for(const file of htmlFiles){
  const ids=[...read(file).matchAll(/\bid=["']([^"']+)["']/g)].map(m=>m[1]);
  assert(new Set(ids).size===ids.length,'Duplicate HTML IDs: '+file);idsByFile.set(file,new Set(ids));
 }
 for(const file of htmlFiles){
  const html=read(file);
  assert((html.match(/<h1\b/g)||[]).length===1,'Each public page needs one main heading: '+file);
  for(const match of html.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)){
   const value=match[1].replaceAll('&amp;','&');
   const url=new URL(value,'https://portfolio.invalid/'+file);
   if(url.origin!=='https://portfolio.invalid'){assert(url.protocol==='https:','External links must use HTTPS.');continue;}
   const target=decodeURIComponent(url.pathname.slice(1))||'index.html';
   assert(allowed.has(target),'A public reference is outside the file list: '+target);
   if(url.hash&&idsByFile.has(target))assert(idsByFile.get(target).has(decodeURIComponent(url.hash.slice(1))),'A page anchor does not exist: '+target+url.hash);
  }
 }
 for(const file of ['public.js','project-cards.js'])assert(!/\blocalStorage\b|showSaveFilePicker|readStoredArray|portfolioStorageKey|createPortfolioDataSource/.test(read(file)),'Developer processing must not be shipped in public JavaScript.');
 const wrangler=JSON.parse(read('wrangler.json'));
 assert(wrangler.assets?.directory==='./dist'&&wrangler.assets?.not_found_handling==='404-page'&&!wrangler.main,'Cloudflare must serve only dist with real 404 responses.');
 return {files,projects,contacts};
}
function assertOutputTarget(){
 assert(output===path.join(root,'dist')&&path.dirname(output)===root,'Refusing to modify a path outside the generated dist directory.');
 if(fs.existsSync(output))assert(!fs.lstatSync(output).isSymbolicLink()&&fs.realpathSync(output)===output&&fs.statSync(output).isDirectory(),'The generated dist directory must not be redirected.');
}
export function buildSite(files){
 assertOutputTarget();
 if(fs.existsSync(output))fs.rmSync(output,{recursive:true,force:true});
 fs.mkdirSync(output,{recursive:true});
 for(const file of files){const target=path.join(output,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(sourceFile(file),target);}
}
const hash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
export function verifyDistribution(files=manifest()){
 assertOutputTarget();assert(fs.existsSync(output),'Build dist before checking the public distribution.');
 const expected=new Set(files);const found=[];
 function visit(directory){for(const item of fs.readdirSync(directory,{withFileTypes:true})){
  const full=path.join(directory,item.name);const relative=path.relative(output,full).split(path.sep).join('/');
  assert(!item.isSymbolicLink(),'The public distribution contains a symbolic link.');
  if(item.isDirectory()){assert(files.some(f=>f.startsWith(relative+'/')),'Unexpected directory in dist: '+relative);visit(full);}else{assert(item.isFile()&&expected.has(relative),'Unexpected file in dist: '+relative);found.push(relative);}
 }}
 visit(output);assert(found.length===files.length,'The public distribution is incomplete.');
 for(const file of files)assert(hash(path.join(output,file))===hash(sourceFile(file)),'The public distribution is stale: '+file);
 return found;
}
export function createPreviewServer({developer=false}={}){
 const files=manifest();if(!developer)verifyDistribution(files);
 const allowed=new Set(files);const base=developer?root:output;
 if(developer)for(const file of ['developer-admin.html','portfolio-admin.html','learning-admin.html','learning.html','script.js','styles.css','data/learning-tasks.js','favicon.png'])allowed.add(file);
 const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpeg':'image/jpeg','.jpg':'image/jpeg','.webp':'image/webp','.txt':'text/plain; charset=utf-8'};
 return http.createServer((req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  let relative;
  try{relative=decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1)||'index.html';}catch{res.writeHead(400);res.end();return;}
  if(!path.posix.extname(relative)&&allowed.has(relative+'.html'))relative+='.html';
  let status=200;
  if(!allowed.has(relative)||relative==='_headers'){relative='404.html';status=404;}
  const target=path.resolve(base,relative);
  if(!inside(base,target)||!fs.existsSync(target)||!inside(base,fs.realpathSync(target))){res.writeHead(404);res.end();return;}
  res.writeHead(status,{'Content-Type':types[path.extname(relative)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'strict-origin-when-cross-origin'});
  if(req.method==='HEAD')res.end();else fs.createReadStream(target).pipe(res);
 });
}