#!/usr/bin/env node
// Build the unified portal entry (portal/index.html): contract directory +
// tx decode entry. Security monitoring stays in CI (security-monitor.yml +
// its report artifacts); the portal intentionally does not render posture.
// Sources:
//   - src/deployments/*.json   canonical monitored baseline (security SSOT)
//   - flow/contracts/<id>/     vendored flow knowledge base (spec/meta/plugin)
// The join is build-time only; no source data is merged or rewritten here.
//
// Usage: node scripts/build-portal.js [outDir=portal]
'use strict';
const fs = require('fs'), path = require('path');
const L = require('./flow-lib.js');

const ROOT = L.ROOT;
const OUT = path.resolve(process.argv[2] || path.join(ROOT, 'portal'));
const DEPLOYMENTS_DIR = process.env.DEPLOYMENTS_DIR || path.join(ROOT, 'src', 'deployments');
const UPSTREAM_REPO = 'https://github.com/gpBlockchain/ckb-contract-flow-html';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
// flow ids become hrefs: strict whitelist, anything else simply gets no link
const SAFE_ID = /^[a-z0-9][a-z0-9_-]*$/;
const safeId = (id) => (typeof id === 'string' && SAFE_ID.test(id) ? id : null);
const NETS = new Set(['mainnet', 'testnet']);
const isI18n = (x) => x && typeof x === 'object' && !Array.isArray(x) && ('zh' in x || 'en' in x);
const text = (x, lang) => x == null ? '' : isI18n(x) ? (x[lang] ?? x.zh ?? x.en) : String(x);

// ---------- data assembly --------------------------------------------------

function loadBaselines() {
  return fs.readdirSync(DEPLOYMENTS_DIR).filter((f) => f.endsWith('.json')).sort().map((f) => {
    const data = JSON.parse(fs.readFileSync(path.join(DEPLOYMENTS_DIR, f), 'utf8'));
    const res = L.resolveFlowId(data.name, data);
    const meta = res ? L.loadMeta(res.id) : null;
    return {
      name: data.name, description: data.description || '', scriptType: data.scriptType,
      networks: ['mainnet', 'testnet'].filter((n) => data[n]),
      flowId: res ? res.id : null,
      via: res ? res.via : null,
    };
  });
}

function loadDirectory(monitored) {
  const byFlowId = new Map(monitored.filter((m) => m.flowId).map((m) => [m.flowId, m]));
  return L.flowIds().map((id) => {
    const meta = L.loadMeta(id), spec = L.loadSpec(id);
    const m = byFlowId.get(id);
    return {
      id,
      title: spec && spec.title ? { zh: text(spec.title, 'zh'), en: text(spec.title, 'en') } : null,
      tags: (meta && meta.tags || []).filter((t) => !['mainnet', 'testnet'].includes(t)),
      networks: meta && meta.deployments ? [...new Set(meta.deployments.map((d) => d.network))] : [],
      hasSpec: !!spec,
      specTransitions: spec && spec.transitions ? spec.transitions.length : 0,
      checkedAt: meta && meta.checked_at || null,
      monitored: m ? m.name : null,
    };
  });
}

// ---------- render ----------------------------------------------------------

const T = (zh, en) => `<span data-l="zh">${esc(zh)}</span><span data-l="en">${esc(en)}</span>`;

function page(data) {
  const { monitored, directory, generatedAt, upstreamCommit } = data;

  const cards = directory.map((c) => {
    const linkId = safeId(c.id);
    const netsAttr = c.networks.filter((n) => NETS.has(n)).join(',');
    const titleZh = c.title ? c.title.zh : c.id, titleEn = c.title ? c.title.en : c.id;
    return `<article class="card" data-id="${esc(c.id)}" data-mon="${c.monitored ? 1 : 0}"
      data-nets="${esc(netsAttr)}" data-tags="${esc(c.tags.join(','))}" data-text="${esc((c.id + ' ' + titleZh + ' ' + titleEn + ' ' + c.tags.join(' ')).toLowerCase())}">
      <h3>${esc(titleZh)}<span data-l="en" class="entitle">${esc(titleEn)}</span></h3>
      <code class="cid">${esc(c.id)}</code>
      <div class="tags">${c.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}${c.networks.filter((n) => NETS.has(n)).map((n) => `<span class="net ${n}">${n}</span>`).join('')}</div>
      <div class="badges">${c.monitored ? `<span class="badge mon"><span data-l="zh">🛡 监控中</span><span data-l="en">🛡 monitored</span></span>` : ''}</div>
      <div class="links">
        ${c.hasSpec && linkId ? `<a href="${esc(linkId)}.html">${T('约束流转 →', 'Constraints →')}</a>` : `<span class="dim">${T('无规范页', 'no spec page')}</span>`}
        <a href="tx.html">${T('解码交易 →', 'Decode tx →')}</a>
      </div>
      ${c.checkedAt ? `<div class="dim small">${T('核对于', 'checked')} ${esc(c.checkedAt)}</div>` : ''}
    </article>`;
  }).join('\n');

  return `<!doctype html>
<html lang="zh" data-theme="light">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src https:; img-src data:">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>CKB Contract Hub · 合约流转门户</title>
<style>
:root{--bg:#f7f6f3;--card:#fff;--ink:#1c2430;--dim:#6b7280;--line:#e5e2da;--acc:#1d4ed8;--mon:#7c3aed}
[data-theme=dark]{--bg:#12151b;--card:#1b2029;--ink:#e6e8ec;--dim:#8b93a1;--line:#2a303b;--acc:#60a5fa}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.6 -apple-system,"Segoe UI",Roboto,"PingFang SC","Noto Sans SC",sans-serif}
.wrap{max-width:1100px;margin:0 auto;padding:0 20px}
header.site{border-bottom:1px solid var(--line);background:var(--card);position:sticky;top:0;z-index:5}
header.site .wrap{display:flex;align-items:center;gap:14px;padding:12px 20px;flex-wrap:wrap}
header.site h1{font-size:18px;margin:0}
header.site nav{margin-left:auto;display:flex;gap:12px;flex-wrap:wrap}
a{color:var(--acc);text-decoration:none}a:hover{text-decoration:underline}
button,.btn{background:var(--acc);color:#fff;border:0;border-radius:8px;padding:7px 14px;cursor:pointer;font-size:14px}
button.ghost,.tgl{background:transparent;color:var(--ink);border:1px solid var(--line)}
.hero{padding:36px 0 8px}
.hero p{color:var(--dim);max-width:640px}
.decode{display:flex;gap:8px;margin:18px 0 6px;flex-wrap:wrap}
.decode input{flex:1;min-width:220px;padding:9px 12px;border:1px solid var(--line);border-radius:8px;background:var(--card);color:var(--ink);font-family:ui-monospace,monospace}
.decode select{padding:9px;border:1px solid var(--line);border-radius:8px;background:var(--card);color:var(--ink)}
section{padding:26px 0;border-top:1px solid var(--line)}
h2{font-size:20px;margin:0 0 10px}
.dim{color:var(--dim)}.small{font-size:12px}
.badge{display:inline-block;border-radius:20px;padding:2px 10px;font-size:12px;font-weight:600;color:#fff;margin:1px 2px}
.badge.mon{background:var(--mon)}
.net{display:inline-block;border:1px solid var(--line);border-radius:5px;padding:0 6px;font-size:11px;color:var(--dim);margin:1px}
.net.mainnet{border-color:var(--acc);color:var(--acc)}
.filters{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0 18px}
.filters input,.filters select{padding:8px 10px;border:1px solid var(--line);border-radius:8px;background:var(--card);color:var(--ink)}
.filters label{display:flex;align-items:center;gap:5px;font-size:13px;color:var(--dim)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px 16px}
.card h3{margin:0 0 2px;font-size:15px}.card .entitle{display:block;color:var(--dim);font-size:13px;font-weight:400}
.card .cid{font-size:12px;color:var(--dim)}
.tags{margin:6px 0}.tag{display:inline-block;background:color-mix(in srgb,var(--acc) 12%,transparent);color:var(--acc);border-radius:5px;padding:0 6px;font-size:11px;margin:1px}
.links{display:flex;gap:10px;margin-top:8px;font-size:13px}
footer{border-top:1px solid var(--line);margin-top:30px;padding:18px 0 40px;color:var(--dim);font-size:13px}
[data-l=en]{display:none}html[data-lang=en] [data-l=zh]{display:none}html[data-lang=en] [data-l=en]{display:inline}
html[data-lang=en] .entitle{display:block}
code{background:color-mix(in srgb,var(--line) 60%,transparent);border-radius:5px;padding:1px 5px;font-size:12.5px}
</style>
</head>
<body>
<header class="site"><div class="wrap">
  <h1>🛡 CKB Contract Hub</h1>
  <nav>
    <a href="tx.html">${T('交易解码器', 'Tx decoder')}</a>
    <a href="llms.txt">llms.txt</a>
    <a href="${UPSTREAM_REPO}">upstream</a>
    <button class="tgl" id="lang" type="button">EN</button>
    <button class="tgl" id="theme" type="button">◐</button>
  </nav>
</div></header>

<div class="wrap">
  <div class="hero">
    <h2 style="font-size:26px">${T('CKB 生态核心合约：状态流转 × 交易诊断，一个入口', 'CKB core contracts: cell-flow specs × tx diagnosis, one entry')}</h2>
    <p>${T('下方是全合约知识库的约束流转规范；粘贴任意交易哈希即可图形化解码并校验合约约束。链上安全巡检结果请关注 CI。', 'Constraint specs for the whole contract KB below; paste any tx hash to decode and verify contract constraints graphically. On-chain security scan results live in CI.')}</p>
    <div class="decode">
      <input id="tx" placeholder="0x…" spellcheck="false">
      <select id="net">
        <option value="https://mainnet.ckb.dev/rpc">mainnet</option>
        <option value="https://testnet.ckb.dev/rpc">testnet</option>
      </select>
      <button id="go" type="button">${T('解码 →', 'Decode →')}</button>
    </div>
    <p class="dim small">${T('共', 'Total')}: ${monitored.length} ${T('个受监控合约', 'monitored contracts')} · ${directory.length} ${T('个知识库合约', 'KB contracts')} · ${T('生成于', 'built')} ${esc(generatedAt)}</p>
  </div>

  <section id="directory">
    <h2>${T('合约目录', 'Contract directory')}</h2>
    <div class="filters">
      <input id="q" size="24">
      <select id="fnet"><option value="" id="fnet-all">all</option><option value="mainnet">mainnet</option><option value="testnet">testnet</option></select>
      <label><input type="checkbox" id="fmon"> ${T('仅看监控中', 'monitored only')}</label>
      <span class="dim" id="cnt"></span>
    </div>
    <div class="grid" id="cards">
${cards}
    </div>
  </section>

  <footer>
    <p>${T('合约流转规范与解码器来自', 'Flow specs and decoder vendored from')} <a href="${UPSTREAM_REPO}">gpBlockchain/ckb-contract-flow-html</a> @ <code>${esc(upstreamCommit)}</code>；${T('安全巡检由本仓库 CI 工作流负责，不在门户展示。', 'on-chain security scanning is handled by this repo’s CI workflows and is not rendered here.')}</p>
  </footer>
</div>

<script>
(function(){
  var lang=localStorage.getItem('hub-lang')||'zh',theme=localStorage.getItem('hub-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
  var PH={q:{zh:'搜索名称 / 标签…',en:'Search name / tags…'},'fnet-all':{zh:'全部网络',en:'all networks'}};
  function apply(){document.documentElement.setAttribute('data-lang',lang);document.documentElement.setAttribute('data-theme',theme);
    document.getElementById('lang').textContent=lang==='zh'?'EN':'中';
    Object.keys(PH).forEach(function(id){var el=document.getElementById(id);if(!el)return;
      if(el.tagName==='INPUT')el.placeholder=PH[id][lang];else el.textContent=PH[id][lang];});}
  document.getElementById('lang').onclick=function(){lang=lang==='zh'?'en':'zh';localStorage.setItem('hub-lang',lang);apply();};
  document.getElementById('theme').onclick=function(){theme=theme==='dark'?'light':'dark';localStorage.setItem('hub-theme',theme);apply();};
  apply();
  document.getElementById('go').onclick=function(){var v=document.getElementById('tx').value.trim();
    if(v)location.href='tx.html#'+new URLSearchParams({tx:v,rpc:document.getElementById('net').value});};
  document.getElementById('tx').onkeydown=function(e){if(e.key==='Enter')document.getElementById('go').click();};
  var q=document.getElementById('q'),fnet=document.getElementById('fnet'),fmon=document.getElementById('fmon');
  var cards=[].slice.call(document.querySelectorAll('.card')),cnt=document.getElementById('cnt');
  function filter(){var t=q.value.trim().toLowerCase(),n=fnet.value,mo=fmon.checked,shown=0;
    cards.forEach(function(c){var ok=(!t||c.getAttribute('data-text').indexOf(t)>=0)
      &&(!n||c.getAttribute('data-nets').split(',').indexOf(n)>=0)
      &&(!mo||c.getAttribute('data-mon')==='1');
      c.style.display=ok?'':'none';if(ok)shown++;});
    cnt.textContent=shown+' / '+cards.length;}
  [q,fnet,fmon].forEach(function(el){el.addEventListener('input',filter);el.addEventListener('change',filter);});
  filter();
})();
</script>
</body>
</html>`;
}

// ---------- main -------------------------------------------------------------

function upstreamCommit() {
  // flow/ is vendored without .git; the upstream commit is recorded in NOTICE.md
  try {
    const notice = fs.readFileSync(path.join(ROOT, 'flow', 'NOTICE.md'), 'utf8');
    const m = notice.match(/Upstream commit\*\*: `([0-9a-f]+)`/) || notice.match(/Upstream commit[^`]*`([0-9a-f]+)`/);
    if (m) return m[1].slice(0, 12);
  } catch { /* fall through */ }
  return 'vendored';
}

function main() {
  const monitored = loadBaselines();
  const directory = loadDirectory(monitored);
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'index.html'), page({
    monitored, directory,
    generatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16) + 'Z',
    upstreamCommit: upstreamCommit(),
  }));
  const joined = monitored.filter((m) => m.flowId).length;
  console.log(`portal/index.html written (${directory.length} contracts, ${monitored.length} monitored, ${joined} joined)`);
}

main();
