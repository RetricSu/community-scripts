#!/usr/bin/env node
// Build the unified portal entry (portal/index.html): security posture +
// contract directory + tx decode entry, all joined from three sources:
//   - src/deployments/*.json   canonical monitored baseline (security SSOT)
//   - flow/contracts/<id>/     vendored flow knowledge base (spec/meta/plugin)
//   - results/latest-report.json  latest security monitor run (optional)
// The join is build-time only; no source data is merged or rewritten here.
//
// Usage: node scripts/build-portal.js [outDir=portal]
'use strict';
const fs = require('fs'), path = require('path');
const L = require('./flow-lib.js');

const ROOT = L.ROOT;
const OUT = path.resolve(process.argv[2] || path.join(ROOT, 'portal'));
const DEPLOYMENTS_DIR = process.env.DEPLOYMENTS_DIR || path.join(ROOT, 'src', 'deployments');
const RESULTS = path.join(ROOT, 'results');
const RPC = { mainnet: 'https://mainnet.ckb.dev/rpc', testnet: 'https://testnet.ckb.dev/rpc' };
const UPSTREAM_REPO = 'https://github.com/gpBlockchain/ckb-contract-flow-html';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
// flow ids become hrefs: strict whitelist, anything else simply gets no link
const SAFE_ID = /^[a-z0-9][a-z0-9_-]*$/;
const safeId = (id) => (typeof id === 'string' && SAFE_ID.test(id) ? id : null);
const NETS = new Set(['mainnet', 'testnet']);
const isI18n = (x) => x && typeof x === 'object' && !Array.isArray(x) && ('zh' in x || 'en' in x);
const text = (x, lang) => x == null ? '' : isI18n(x) ? (x[lang] ?? x.zh ?? x.en) : String(x);

// ---------- data assembly --------------------------------------------------

function loadMonitor() {
  const reportFile = path.join(RESULTS, 'latest-report.json');
  if (!fs.existsSync(reportFile)) return null;
  try { return JSON.parse(fs.readFileSync(reportFile, 'utf8')); } catch { return null; }
}

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
      meta: meta ? {
        checked_at: meta.checked_at || null,
        repo: meta.source && meta.source.repo || null,
        binary: meta.source && meta.source.binary && meta.source.binary.status || null,
        generated: !!meta.generated_from,
      } : null,
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
      // health badges must be computed against the BASELINE networks (the
      // security SSOT), not the flow meta: the two can legitimately differ
      monNetworks: m ? m.networks : null,
      hasSpec: !!spec,
      specTransitions: spec && spec.transitions ? spec.transitions.length : 0,
      checkedAt: meta && meta.checked_at || null,
      monitored: m ? m.name : null,
    };
  });
}

function monitorPerContract(report, monitoredNames) {
  const per = {};
  if (!report) return per;
  const bump = (name) => per[name] || (per[name] = { mismatches: [], upgrades: [], unverifiedNets: [] });
  // whole-source failures are recorded against scriptName '*'; an on-chain RPC
  // outage means every contract on that network is UNVERIFIED, not "green"
  const onchainDown = new Set(
    (report.mismatches || [])
      .filter((m) => m.scriptName === '*' && m.kind === 'SOURCE_UNAVAILABLE' && m.sourceId === 'onchain-rpc' && NETS.has(m.network))
      .map((m) => m.network)
  );
  for (const name of monitoredNames) bump(name).unverifiedNets = [...onchainDown];
  for (const m of report.mismatches || []) {
    if (m.scriptName === '*' || !monitoredNames.has(m.scriptName)) continue;
    bump(m.scriptName).mismatches.push({
      network: m.network, level: m.riskLevel, kind: m.kind, field: m.field,
      source: m.sourceId, desc: m.description, action: m.actionRequired,
    });
  }
  for (const u of report.upgrades || []) {
    if (!monitoredNames.has(u.scriptName)) continue;
    bump(u.scriptName).upgrades.push({
      network: u.network, status: u.status, authorized: u.authorized,
      tx: u.consumingTxHash || null, upgradedAt: u.upgradedAt || null,
      latest: u.latestOutPoint ? `${u.latestOutPoint.txHash}:${parseInt(u.latestOutPoint.index, 16)}` : null,
    });
  }
  return per;
}

// ---------- render ----------------------------------------------------------

const RISK_META = {
  P0_CRITICAL: { rank: 0, cls: 'p0', zh: 'P0 严重', en: 'P0 Critical' },
  P1_HIGH: { rank: 1, cls: 'p1', zh: 'P1 高', en: 'P1 High' },
  P2_MEDIUM: { rank: 2, cls: 'p2', zh: 'P2 中', en: 'P2 Medium' },
  P3_INFO: { rank: 3, cls: 'p3', zh: 'P3 正常', en: 'P3 Info' },
  UNVERIFIED: { rank: 4, cls: 'unk', zh: '未核验', en: 'Unverified' },
};
const worst = (items) => items.reduce((w, x) => {
  const r = RISK_META[x.level] ? RISK_META[x.level].rank : 3;
  return r < w.rank ? { rank: r, level: x.level } : w;
}, { rank: 3, level: 'P3_INFO' }).level;
// a contract's display level: real mismatches win; else grey "unverified" when
// the on-chain source was down for one of its networks; else green P3
const contractLevel = (name, networks, per) => {
  const p = per[name];
  if (p && p.mismatches.length) return worst(p.mismatches);
  if (p && p.unverifiedNets && p.unverifiedNets.some((n) => networks.includes(n))) return 'UNVERIFIED';
  return 'P3_INFO';
};

function badge(level, lang) {
  const m = RISK_META[level] || RISK_META.P3_INFO;
  return `<span class="badge ${m.cls}">${lang === 'zh' ? m.zh : m.en}</span>`;
}
// one badge per language, toggled by the global data-l mechanism
const badgeLang = (level, sm = false) =>
  `<span data-l="zh">${badge(level, 'zh').replace('badge ', sm ? 'badge sm ' : 'badge ')}</span><span data-l="en">${badge(level, 'en').replace('badge ', sm ? 'badge sm ' : 'badge ')}</span>`;

const T = (zh, en) => `<span data-l="zh">${esc(zh)}</span><span data-l="en">${esc(en)}</span>`;

function page(data) {
  const { monitored, directory, monitor, generatedAt, upstreamCommit } = data;
  const hasMonitor = !!monitor;
  const per = data.perContract;
  const monNames = new Set(monitored.map((m) => m.name));

  const monRows = monitored.map((m) => {
    const p = per[m.name];
    const level = contractLevel(m.name, m.networks, per);
    const ups = p ? p.upgrades : [];
    const flowLink = m.flowId && safeId(m.flowId) ? `<a href="${esc(safeId(m.flowId))}.html">${esc(m.flowId)}.html</a>` : `<span class="dim">${T('无 flow 规范', 'no flow spec')}</span>`;
    const nets = m.networks.map((n) => `<span class="net ${n}">${n}</span>`).join(' ');
    const upCells = ups.map((u) => {
      const rpc = RPC[u.network] || RPC.mainnet;
      const txLink = u.tx ? `<a href="tx.html#${esc(new URLSearchParams({ tx: u.tx, rpc }).toString())}" title="在解码器中查看 / inspect in decoder">${esc(u.tx.slice(0, 10))}…</a>` : '—';
      const st = u.status === 'destroyed' ? `🔴 ${T('已销毁', 'destroyed')}` : u.authorized ? `🟡 ${T('授权升级', 'authorized upgrade')}` : `🔴 ${T('未授权升级', 'UNAUTHORIZED upgrade')}`;
      return `<div class="up">${u.network === 'mainnet' ? 'M' : 'T'} ${st} · ${txLink}${u.latest ? ` → <code>${esc(u.latest.slice(0, 12))}…</code>` : ''}</div>`;
    }).join('');
    return `<tr data-name="${esc(m.name)}" data-level="${level}">
      <td><b>${esc(m.name)}</b><div class="dim small">${esc(m.description)}</div></td>
      <td>${nets}</td>
      <td>${badgeLang(level)}</td>
      <td>${flowLink}${m.meta && m.meta.binary ? `<div class="dim small">${T('二进制:', 'binary:')}${esc(m.meta.binary)}</div>` : ''}</td>
      <td class="ups">${upCells || `<span class="dim">—</span>`}</td>
    </tr>`;
  }).join('\n');

  const counts = hasMonitor ? monitor.counts : {};
  const stat = (k, label) => `<div class="stat ${RISK_META[k].cls}"><b>${counts[k] ?? 0}</b><span>${label}</span></div>`;
  const monitorHtml = hasMonitor ? `
  <section id="security">
    <h2>${T('安全态势', 'Security posture')}</h2>
    <p class="dim">${T('最近巡检', 'Last run')}: <time>${esc(monitor.finishedAt || monitor.startedAt || '')}</time> · ${esc((monitor.networks || []).join(' + '))} · ${T('基线合约', 'baseline scripts')}: ${monitor.baselineScripts}</p>
    <div class="stats">${stat('P0_CRITICAL', 'P0')}${stat('P1_HIGH', 'P1')}${stat('P2_MEDIUM', 'P2')}${stat('P3_INFO', 'P3')}</div>
    <table id="montable">
      <thead><tr><th>${T('合约', 'Contract')}</th><th>${T('网络', 'Network')}</th><th>${T('风险', 'Risk')}</th><th>${T('flow 规范 / 溯源', 'Flow spec / provenance')}</th><th>${T('升级事件', 'Upgrades')}</th></tr></thead>
      <tbody>${monRows}</tbody>
    </table>
    <p class="dim small">${T('原始报告', 'Raw report')}: <a href="latest-report.json">latest-report.json</a></p>
  </section>` : `
  <section id="security">
    <h2>${T('安全态势', 'Security posture')}</h2>
    <p class="dim">${T('尚未运行安全巡检。运行', 'No security report yet. Run')} <code>pnpm run monitor -- --network both --no-notify --fail-on none</code> ${T('后重新构建门户', 'then rebuild the portal')} (<code>pnpm run flow:build</code>)。</p>
  </section>`;

  const cards = directory.map((c) => {
    const linkId = safeId(c.id);
    const level = c.monitored ? contractLevel(c.monitored, (c.monNetworks || c.networks).filter((n) => NETS.has(n)), per) : null;
    const netsAttr = c.networks.filter((n) => NETS.has(n)).join(',');
    const titleZh = c.title ? c.title.zh : c.id, titleEn = c.title ? c.title.en : c.id;
    return `<article class="card" data-id="${esc(c.id)}" data-mon="${c.monitored ? 1 : 0}" data-level="${level || ''}"
      data-nets="${esc(netsAttr)}" data-tags="${esc(c.tags.join(','))}" data-text="${esc((c.id + ' ' + titleZh + ' ' + titleEn + ' ' + c.tags.join(' ')).toLowerCase())}">
      <h3>${esc(titleZh)}<span data-l="en" class="entitle">${esc(titleEn)}</span></h3>
      <code class="cid">${esc(c.id)}</code>
      <div class="tags">${c.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}${c.networks.filter((n) => NETS.has(n)).map((n) => `<span class="net ${n}">${n}</span>`).join('')}</div>
      <div class="badges">${c.monitored ? `<span class="badge mon"><span data-l="zh">🛡 监控中</span><span data-l="en">🛡 monitored</span></span>` : ''}${level ? badgeLang(level, true) : ''}</div>
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
<title>CKB Contract Hub · 合约安全与流转门户</title>
<style>
:root{--bg:#f7f6f3;--card:#fff;--ink:#1c2430;--dim:#6b7280;--line:#e5e2da;--acc:#1d4ed8;--p0:#dc2626;--p1:#ea580c;--p2:#ca8a04;--p3:#16a34a;--mon:#7c3aed}
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
.stats{display:flex;gap:10px;flex-wrap:wrap;margin:12px 0 18px}
.stat{background:var(--card);border:1px solid var(--line);border-left:4px solid var(--dim);border-radius:10px;padding:8px 16px;min-width:76px}
.stat b{font-size:22px;display:block}.stat span{color:var(--dim);font-size:12px}
.stat.p0{border-left-color:var(--p0)}.stat.p1{border-left-color:var(--p1)}.stat.p2{border-left-color:var(--p2)}.stat.p3{border-left-color:var(--p3)}
table{width:100%;border-collapse:collapse;background:var(--card);border:1px solid var(--line);border-radius:10px;overflow:hidden}
th,td{padding:9px 12px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top;font-size:13.5px}
th{background:color-mix(in srgb,var(--card) 70%,var(--line));color:var(--dim);font-weight:600}
tr:last-child td{border-bottom:0}
.dim{color:var(--dim)}.small{font-size:12px}
.badge{display:inline-block;border-radius:20px;padding:2px 10px;font-size:12px;font-weight:600;color:#fff;margin:1px 2px}
.badge.sm{font-size:11px;padding:1px 8px}
.badge.p0{background:var(--p0)}.badge.p1{background:var(--p1)}.badge.p2{background:var(--p2)}.badge.p3{background:var(--p3)}
.badge.mon{background:var(--mon)}
.badge.unk{background:var(--dim)}
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
.up{font-size:12px;margin:2px 0}
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
    <h2 style="font-size:26px">${T('CKB 生态核心合约：安全监控 × 状态流转 × 交易诊断，一个入口', 'CKB core contracts: security monitoring × cell-flow specs × tx diagnosis, one entry')}</h2>
    <p>${T('左侧是每日链上安全巡检的实时健康度，下方是全合约知识库的约束流转规范；粘贴任意交易哈希即可图形化解码并校验合约约束。', 'Live health from the daily on-chain security scan on top, constraint specs for the whole contract KB below; paste any tx hash to decode and verify contract constraints graphically.')}</p>
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

  ${monitorHtml}

  <section id="directory">
    <h2>${T('合约目录', 'Contract directory')}</h2>
    <div class="filters">
      <input id="q" size="24">
      <select id="fnet"><option value="" id="fnet-all">all</option><option value="mainnet">mainnet</option><option value="testnet">testnet</option></select>
      <label><input type="checkbox" id="fmon"> ${T('仅看监控中', 'monitored only')}</label>
      <select id="frisk"><option value="" id="frisk-all">all</option><option value="P0_CRITICAL">P0</option><option value="P1_HIGH">P1</option><option value="P2_MEDIUM">P2</option><option value="P3_INFO">P3</option></select>
      <span class="dim" id="cnt"></span>
    </div>
    <div class="grid" id="cards">
${cards}
    </div>
  </section>

  <footer>
    <p>${T('合约流转规范与解码器来自', 'Flow specs and decoder vendored from')} <a href="${UPSTREAM_REPO}">gpBlockchain/ckb-contract-flow-html</a> @ <code>${esc(upstreamCommit)}</code>；${T('安全巡检来自本仓库 monitor。数据在构建时合并，源数据互不污染。', 'security scan from this repo’s monitor. Data is joined at build time; source datasets stay separate.')}</p>
  </footer>
</div>

<script>
(function(){
  var lang=localStorage.getItem('hub-lang')||'zh',theme=localStorage.getItem('hub-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
  var PH={q:{zh:'搜索名称 / 标签…',en:'Search name / tags…'},'fnet-all':{zh:'全部网络',en:'all networks'},'frisk-all':{zh:'全部风险',en:'all risks'}};
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
  var q=document.getElementById('q'),fnet=document.getElementById('fnet'),fmon=document.getElementById('fmon'),frisk=document.getElementById('frisk');
  var cards=[].slice.call(document.querySelectorAll('.card')),cnt=document.getElementById('cnt');
  function filter(){var t=q.value.trim().toLowerCase(),n=fnet.value,mo=fmon.checked,rk=frisk.value,shown=0;
    cards.forEach(function(c){var ok=(!t||c.getAttribute('data-text').indexOf(t)>=0)
      &&(!n||c.getAttribute('data-nets').split(',').indexOf(n)>=0)
      &&(!mo||c.getAttribute('data-mon')==='1')&&(!rk||c.getAttribute('data-level')===rk);
      c.style.display=ok?'':'none';if(ok)shown++;});
    cnt.textContent=shown+' / '+cards.length;}
  [q,fnet,fmon,frisk].forEach(function(el){el.addEventListener('input',filter);el.addEventListener('change',filter);});
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
  const monitor = loadMonitor();
  const perContract = monitorPerContract(monitor, new Set(monitored.map((m) => m.name)));
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'index.html'), page({
    monitored, directory, monitor, perContract,
    generatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16) + 'Z',
    upstreamCommit: upstreamCommit(),
  }));
  // raw report next to the portal for download / external dashboards
  for (const f of ['latest-report.json', 'latest-status.json']) {
    const src = path.join(RESULTS, f);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(OUT, f));
  }
  const joined = monitored.filter((m) => m.flowId).length;
  console.log(`portal/index.html written (${directory.length} contracts, ${monitored.length} monitored, ${joined} joined, monitor: ${monitor ? 'yes' : 'no'})`);
}

main();
