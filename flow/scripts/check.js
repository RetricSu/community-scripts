// tag balance + bilingual coverage (no jsdom)
const fs=require('fs');const VOID=new Set(['meta','br','input','img','hr','link']);let bad=0;
for(const f of fs.readdirSync('out').filter(f=>f.endsWith('.html'))){const h=fs.readFileSync('out/'+f,'utf8');
 const body=h.replace(/<button id="lang"[\s\S]*?<\/button>/,'').replace(/<script[\s\S]*?<\/script>/g,'').replace(/<style[\s\S]*?<\/style>/g,'').replace(/<title>[\s\S]*?<\/title>/,'').replace(/<!DOCTYPE[^>]*>/,'');
 const st=[];let mis=0,zhOut=0,enOnly=0,zhCnt=0,enCnt=0;const re=/<(\/?)([a-zA-Z0-9]+)([^>]*)>|([^<]+)/g;let m;
 while(m=re.exec(body)){
  if(m[2]){const t=m[2].toLowerCase();if(VOID.has(t))continue;
   if(m[1]){const x=st.pop();if(!x||x.t!==t)mis++}else{const l=(m[3].match(/data-l="(\w+)"/)||[])[1];st.push({t,l});if(l==='zh')zhCnt++;if(l==='en')enCnt++}}
  else{const txt=m[4];const langs=st.map(s=>s.l).filter(Boolean);
   if(/[\u4e00-\u9fff]/.test(txt)&&!langs.includes('zh')){zhOut++;console.log(f,'CJK outside zh:',txt.trim().slice(0,60))}
   if(langs.includes('en')&&/[\u4e00-\u9fff]/.test(txt)){enOnly++;console.log(f,'CJK in en:',txt.trim().slice(0,60))}}}
 if(st.length)mis+=st.length;
 const objStr=(body.match(/\[object Object\]/g)||[]).length;if(objStr){zhOut+=objStr;console.log(f,'unrendered object: [object Object] x'+objStr)}
 const ok=!mis&&!zhOut&&!enOnly&&zhCnt===enCnt;if(!ok)bad++;
 console.log(f.padEnd(14),'tags',mis?'BAD':'ok','zh/en spans',zhCnt,enCnt,ok?'OK':'FAIL');}
// meta.json: tags (contracts/tags.json), contributors (optional, valid GitHub usernames), source + deployments provenance
{const M=require('../lib/meta.js'),CK=require('../lib/contracts.js').loadAll();
 for(const c of require('../lib/contracts.js').list()){const errs=M.validate(c.id,M.load(c.id),CK.PLUGINS.find(p=>p.id===c.id));errs.forEach(e=>console.log('META',e));if(errs.length)bad++;}
 console.log('meta.json',bad?'see above':'OK');}
// agent outputs (lib/agent.js): llms.txt + <id>.md per contract + contracts.json + decode-tx.js; English only, links into the site resolve
{const A=require('../lib/agent.js'),need=['llms.txt','contracts.json','decode-tx.js',...require('../lib/contracts.js').list().map(c=>c.id+'.md')];let n=0;
 for(const f of need){if(!fs.existsSync('out/'+f)){n++;console.log('AGENT missing out/'+f);continue}if(!/\.(md|txt)$/.test(f))continue;const t=fs.readFileSync('out/'+f,'utf8'),cjk=t.match(/.*[\u4e00-\u9fff].*/);
  if(cjk){n++;console.log('AGENT CJK in out/'+f+':',cjk[0].trim().slice(0,60))}
  if(/\[object Object\]/.test(t)){n++;console.log('AGENT unrendered object in out/'+f)}
  for(const m of t.matchAll(/https?:\/\/[^\s)`|<>]+/g)){const u=m[0].replace(/[.,;:]+$/,'');if(u.startsWith(A.SITE)&&!fs.existsSync('out/'+u.slice(A.SITE.length))){n++;console.log('AGENT broken link in out/'+f+':',u)}}}
 try{JSON.parse(fs.readFileSync('out/contracts.json','utf8'))}catch(e){n++;console.log('AGENT contracts.json:',e.message)}
 try{require('child_process').execFileSync(process.execPath,['--check','out/decode-tx.js'],{stdio:'ignore'})}catch(e){n++;console.log('AGENT out/decode-tx.js does not parse')}
 if(n)bad++;console.log('agent outputs',n?'see above':'OK ('+need.length+' files)');}
process.exit(bad?1:0);
