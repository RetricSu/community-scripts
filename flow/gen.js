#!/usr/bin/env node
// Zero-dependency generator / 零依赖生成器
//   node gen.js specs/dao.json [out/dao.html]
//   node gen.js --all [out]   (builds contracts/*/spec.json + tx.html + index.html)
// 任意文本字段可为字符串（语言无关）或 {"zh": "...", "en": "..."}。
'use strict';
const fs = require('fs'), path = require('path');
const META = require('./lib/meta.js'), AG = require('./lib/agent.js');
let _mh; const MH = () => _mh || (_mh = require('./lib/meta-html.js')(T, esc));
const pluginOf = id => { try { return require('./lib/contracts.js').loadAll().PLUGINS.find(p => p.id === id); } catch (e) { return null; } };

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// {{text}} → highlight
const hl = s => esc(s).replace(/\{\{([\s\S]*?)\}\}(?!\})/g, '<span class="hl">$1</span>');
const isI18n = x => x && typeof x === 'object' && !Array.isArray(x) && ('zh' in x || 'en' in x);
// render text: bilingual → two spans; plain string → as is
const T = (x, f = hl) => x == null ? '' : isI18n(x)
  ? `<span data-l="zh">${f(x.zh != null ? x.zh : x.en)}</span><span data-l="en">${f(x.en != null ? x.en : x.zh)}</span>` : f(x);
const plain = (x, lang) => x == null ? '' : isI18n(x) ? (x[lang] != null ? x[lang] : x.zh || x.en) : String(x);
const UI = {
  limits: { zh: '限制', en: 'Constraints' },
  contracts: { zh: '合约', en: 'Contracts' },
  none: { zh: '（无）', en: '(none)' },
  defTitle: { zh: 'CKB 合约约束', en: 'CKB Contract Constraints' },
  txTitle: { zh: '链上交易解码器', en: 'On-chain Transaction Decoder' },
  indexTitle: { zh: 'CKB 合约 Cell 流转约束', en: 'CKB Contract Cell-Flow Constraints' },
  indexSub: { zh: '把每个 CKB 合约拆成状态转换：输入 Cell → 输出 Cell，高亮被约束的字段，逐条列出条件与错误码。', en: 'Every CKB contract broken into state transitions: input cells → output cells, constrained fields highlighted, each condition listed with its error code.' },
};
// shared inline icons (paths closed explicitly: scripts/check.js balances every tag)
const ARROW = '<div class="arrow" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"></path></svg></div>';
// pointers to the agent-readable files written by lib/agent.js (--all only): a line under the title with the files and a
// "copy for AI" button (a prompt with absolute links, in the page language, to paste into any LLM) + <link rel=alternate>
const attr = s => esc(s).replace(/"/g, '&quot;');
const agentLine = (files, ask) => `<p class="agent">${T({ zh: '给 AI agent：', en: 'For AI agents:' }, esc)} ${files.map(f => `<a href="${f}">${f}</a>`).join(' · ')}<button class="copyl agent-cp" type="button" data-zh="${attr(ask.zh)}" data-en="${attr(ask.en)}">${T({ zh: '复制给 AI', en: 'Copy for AI' }, esc)}<span class="okm"> ✓</span></button></p>`;
const ASK = {
  index: { zh: `先阅读 ${AG.SITE}llms.txt（CKB 合约知识库：主网 / 测试网有哪些合约、怎么用、怎么解析交易），再回答我的问题：`, en: `First read ${AG.SITE}llms.txt (a CKB contract knowledge base: which contracts are on mainnet / testnet, how to use them, how to decode a transaction), then answer my question: ` },
  tx: { zh: `先阅读 ${AG.SITE}llms.txt（CKB 合约知识库），按其中的方法用 decode-tx.js 解析这笔交易并解释它做了什么：`, en: `First read ${AG.SITE}llms.txt (a CKB contract knowledge base), then decode this transaction with its decode-tx.js and explain what it does: ` },
  contract: id => ({ zh: `先阅读 ${AG.SITE}${id}.md（CKB 合约 ${id} 的文档：部署、用法、约束与错误码；全部合约见 ${AG.SITE}llms.txt），再回答我的问题：`, en: `First read ${AG.SITE}${id}.md (docs for the CKB contract ${id}: deployments, how to use it, constraints and error codes; all contracts: ${AG.SITE}llms.txt), then answer my question: ` }),
};
const mdLink = f => `<link rel="alternate" type="text/markdown" href="${f}" title="Markdown for AI agents">`;

function loadSpec(file) {
  const txt = fs.readFileSync(file, 'utf8');
  if (/\.ya?ml$/i.test(file)) return parseYaml(txt);
  return JSON.parse(txt);
}

// 极简 YAML 子集（缩进映射 / "- " 列表 / 标量 / "|" 多行块）。复杂需求请用 JSON。
function parseYaml(src) {
  const lines = src.replace(/\t/g, '  ').split('\n').filter(l => !/^\s*(#.*)?$/.test(l) || /^\s*$/.test(l) && false);
  let i = 0;
  const ind = l => l.match(/^ */)[0].length;
  const scalar = v => {
    v = v.trim();
    if (/^".*"$/.test(v)) return JSON.parse(v);
    if (/^'.*'$/.test(v)) return v.slice(1, -1).replace(/''/g, "'");
    if (v === 'null' || v === '~') return null;
    if (v === 'true') return true; if (v === 'false') return false;
    if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
    return v;
  };
  function block(level) {
    const out = [];
    while (i < lines.length && (lines[i].trim() === '' || ind(lines[i]) > level)) { out.push(lines[i].slice(level + 1 > 0 ? Math.min(ind(lines[i]), level + 2) : 0)); i++; }
    return out.join('\n').replace(/\n+$/, '');
  }
  function node(level) {
    if (i >= lines.length) return null;
    const isList = lines[i].trimStart().startsWith('- ') || lines[i].trim() === '-';
    if (isList) {
      const arr = [];
      while (i < lines.length && ind(lines[i]) === level && /^\s*-( |$)/.test(lines[i])) {
        const rest = lines[i].trimStart().slice(1).trim();
        if (!rest) { i++; arr.push(node(ind(lines[i]))); continue; }
        if (/^[^"'][^:]*:( |$)/.test(rest)) { // 列表项为映射
          lines[i] = ' '.repeat(level + 2) + rest;
          arr.push(map(level + 2));
        } else { i++; arr.push(scalar(rest)); }
      }
      return arr;
    }
    return map(level);
  }
  function map(level) {
    const obj = {};
    while (i < lines.length && ind(lines[i]) === level && !/^\s*- /.test(lines[i])) {
      const m = lines[i].trim().match(/^([^:]+):\s*(.*)$/);
      if (!m) throw new Error('YAML 解析失败: ' + lines[i]);
      i++;
      const k = m[1].trim(), v = m[2];
      if (v === '|') obj[k] = block(level);
      else if (v === '') {
        while (i < lines.length && lines[i].trim() === '') i++;
        obj[k] = i < lines.length && ind(lines[i]) > level ? node(ind(lines[i])) :
          (i < lines.length && ind(lines[i]) === level && /^\s*- /.test(lines[i]) ? node(level) : null);
      } else obj[k] = scalar(v);
    }
    return obj;
  }
  for (let j = 0; j < lines.length; j++) lines[j] = lines[j].replace(/\s+#.*$/, m => /["']/.test(m) ? m : '');
  lines.splice(0, lines.length, ...lines.filter(l => !/^\s*#/.test(l)));
  while (i < lines.length && lines[i].trim() === '') i++;
  return node(ind(lines[i] || ''));
}

// Byte-layout box / 字节布局 box：{ label, layout:[{name,size,color,flex,role,cons,err}], hex?:[[k,v]], note? }
const col = (f, i) => f.color != null ? f.color : i % 8;
const layoutBox = b => `<div class="layout"><span class="n">${T(b.label)}</span>
<div class="strip">${b.layout.map((f, i) => `<div class="seg c${col(f, i)}" style="flex:${f.flex || 1}"><b>${T(f.name, esc)}</b><small>${T(f.size, esc)}</small></div>`).join('')}</div>
<ul class="fields">${b.layout.filter(f => f.role || f.cons || f.err).map(f => `<li><span class="fk"><span class="dot c${col(f, b.layout.indexOf(f))}"></span><b>${T(f.name, esc)}</b><span class="sz">${T(f.size, esc)}</span></span><span class="fd">${T(f.role)}${f.cons ? `<span class="cons">${T(f.cons)}</span>` : ''}</span><span class="e">${f.err ? T(f.err, esc) : ''}</span></li>`).join('')}</ul>
${b.hex ? `<div class="hex">${b.hex.map(h => `<div><span class="hk">${T(h[0], esc)}</span><span class="hv">${T(h[1])}</span></div>`).join('')}</div>` : ''}
${b.note ? `<div class="note">${T(b.note)}</div>` : ''}</div>`;
const box = b => b.layout ? layoutBox(b) : `<div class="cell"><span class="n">${T(b.label)}</span>${T(b.body)}</div>`;
const none = `<div class="none">${T(UI.none, esc)}</div>`;

function render(spec, id) {
  const meta = id ? META.load(id) : null, plugin = id ? pluginOf(id) : null;
  const head = meta ? MH().chips(META.tagsOf(meta, plugin)) + MH().credit(meta) : '';
  const prov = meta ? `<div class="card">${MH().provenance(meta)}</div>` : '';
  const ts = spec.transitions || [];
  const crumb = id ? `<nav class="crumb"><a href="index.html">${T(UI.contracts, esc)}</a><span aria-hidden="true">/</span><code>${esc(id)}</code></nav>` : '';
  const toc = ts.length > 1 ? `<nav class="toc">${ts.map((t, i) => `<a href="#t${i + 1}"><span class="tg">${T(t.tag, esc)}</span>${T(t.title, esc)}</a>`).join('')}</nav>` : '';
  const cards = ts.map((t, i) => `
<div class="card" id="t${i + 1}">
<h2><span class="tg">${T(t.tag, esc)}</span>${T(t.title, esc)}</h2>
<div class="flow">
<div class="col cin"><div class="colh">${T({ zh: 'Inputs 输入', en: 'Inputs' }, esc)}</div>${(t.inputs || []).map(box).join('\n') || none}</div>
${ARROW}
<div class="col cout"><div class="colh">${T({ zh: 'Outputs 输出', en: 'Outputs' }, esc)}</div>${(t.outputs || []).map(box).join('\n') || none}</div>
</div>
${(t.sections || []).map(sc => `<div class="sec"><h3>${T(sc.title, esc)}</h3><div class="secgrid">${(sc.boxes || []).map(box).join('\n')}</div></div>`).join('\n')}
${(t.layouts || []).map(layoutBox).join('\n')}
${(t.extras || []).map(x => `<div class="extra">${T(x)}</div>`).join('\n')}
${t.limits && t.limits.length ? `<div class="limits"><h3>${T(UI.limits, esc)}</h3><ul>
${t.limits.map(l => `<li><b>${T(l.field, esc)}</b><span class="lc">${T(l.cond)}${l.note ? `<span class="note">${T(l.note)}</span>` : ''}</span><span class="e">${l.err != null && l.err !== '' ? T(l.err, esc) : ''}</span></li>`).join('\n')}
</ul></div>` : ''}
</div>`).join('\n');
  const title = spec.title || UI.defTitle;
  const tpl = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8');
  return tpl.replace('{{DOC_TITLE}}', esc(plain(title, 'zh') === plain(title, 'en') ? plain(title, 'en') : plain(title, 'zh') + ' / ' + plain(title, 'en')))
    .replace('{{HEAD}}', id ? mdLink(id + '.md') : '').replace('{{AGENT}}', id ? agentLine([id + '.md', 'llms.txt'], ASK.contract(id)) : '')
    .replace('{{CRUMB}}', () => crumb)
    .replace('{{TITLE}}', T(title, esc))
    .replace('{{SUBTITLE}}', T(spec.subtitle) + head)
    .replace('{{CARDS}}', () => toc + cards + prov)
    .replace('{{FOOTER}}', spec.notes ? `<div class="notes"><div>${(Array.isArray(spec.notes) ? spec.notes : [spec.notes]).map(n => T(n)).join('<br>')}</div></div>` : '');
}

function build(inFile, outFile, id) {
  const spec = loadSpec(inFile);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, render(spec, id));
  console.log(`${inFile} -> ${outFile}`);
  return spec;
}

// On-chain tx decoder page (same look & toggle)
function buildTx(outFile) {
  const tpl = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8');
  const extra = fs.readFileSync(path.join(__dirname, 'tx-template.html'), 'utf8');
  const css = extra.slice(extra.indexOf('<style>'), extra.indexOf('</style>') + 8);
  const lib = fs.readFileSync(path.join(__dirname, 'lib/ckb.js'), 'utf8'), app = fs.readFileSync(path.join(__dirname, 'tx-app.js'), 'utf8');
  const C = require('./lib/contracts.js');
  const EX = C.list().filter(c => c.tests).flatMap(c => JSON.parse(fs.readFileSync(c.tests, 'utf8')).map(t => [t.tx, t.name || c.id, t.net || 'mainnet', c.id])).filter((x, i, a) => a.findIndex(y => y[0] === x[0]) === i);
  const EXG = {}; for (const [h, n, net, id] of EX) (EXG[id] = EXG[id] || []).push(`<a href="#" class="ex" data-h="${h}" data-net="${net}">${esc(n)}</a>`);
  const METAHTML = Object.fromEntries(C.list().map(c => { const m = META.load(c.id); return m ? [c.id, MH().chips(META.tagsOf(m, pluginOf(c.id))) + MH().credit(m) + MH().provenance(m, { compact: true })] : null; }).filter(Boolean));
  const plugins = C.ordered().map(c => `// ---- contracts/${c.id}/plugin.js ----\n` + fs.readFileSync(c.plugin, 'utf8')).join('\n');
  const ids = C.ordered().map(c => c.id);
  const form = `<div class="card dec"><div class="bar">
<select id="net" aria-label="RPC"><option value="https://mainnet.ckb.dev/rpc">mainnet · https://mainnet.ckb.dev/rpc</option><option value="https://testnet.ckb.dev/rpc">testnet · https://testnet.ckb.dev/rpc</option><option value="custom">custom RPC</option></select>
<input id="hash" placeholder="0x… tx hash" aria-label="tx hash" spellcheck="false" autocomplete="off"><button class="btn" id="go">${T({ zh: '解码', en: 'Decode' }, esc)}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg></button></div>
<input id="custom" class="inp" style="display:none" placeholder="http://127.0.0.1:8114" aria-label="custom RPC" spellcheck="false">
<details class="exs"><summary>${T({ zh: '示例交易', en: 'Example transactions' }, esc)}<span class="cnt">${EX.length}</span></summary><div class="exl">${Object.entries(EXG).map(([id, xs]) => `<div class="exg"><code>${esc(id)}</code><div>${xs.join('')}</div></div>`).join('')}</div></details>
<p class="small dnote">${T({ zh: '按 lock / type script hash 分组；签名不校验（标记 ○）；数据仅从你选择的 RPC 读取。', en: 'Grouped by lock / type script hash; signatures are NOT verified (marked ○); data is read only from the RPC you choose.' })}</p>
<details class="more"><summary>${T({ zh: '已加载插件', en: 'Loaded plugins' }, esc)}<span class="cnt">${ids.length}</span></summary><p class="plg">${ids.map(x => `<code>${esc(x)}</code>`).join(' ')}</p></details></div>
<div id="result"></div>`;
  const html = tpl.replace('{{DOC_TITLE}}', esc(UI.txTitle.zh + ' / ' + UI.txTitle.en)).replace('{{HEAD}}', '').replace('{{AGENT}}', agentLine(['decode-tx.js', 'llms.txt'], ASK.tx)).replace('{{CRUMB}}', '')
    .replace('{{TITLE}}', T(UI.txTitle, esc)).replace('{{SUBTITLE}}', T({ zh: '输入交易 hash，解码为 cell 流转卡片并做无签名约束检查', en: 'Enter a tx hash to decode it into cell-flow cards with signature-free constraint checks' }))
    .replace('{{CARDS}}', form).replace('{{FOOTER}}', '')
    .replace('</style>', () => css.replace('<style>', '').replace('</style>', '') + '</style>');
    const scripts = `<script>window.CKB_META_HTML=${JSON.stringify(METAHTML).replace(/</g, '\\u003c')};</script><script>\n${lib.replace(/<\/script/gi, '<\\/script')}\n</script><script>\n${plugins.replace(/<\/script/gi, '<\\/script')}\n</script><script>\n${app.replace(/<\/script/gi, '<\\/script')}\n</script>`;
  const html2 = html.replace('</body>', () => scripts + '</body>');
  fs.mkdirSync(path.dirname(outFile), { recursive: true }); fs.writeFileSync(outFile, html2); console.log(`(tx decoder) -> ${outFile}`);
}

function main() {
  const a = process.argv.slice(2);
  if (!a.length) { console.error('Usage / 用法: node gen.js <spec.json|yaml> [out.html]\n                 node gen.js --all [outDir=out]   (discovers contracts/*/spec.json)'); process.exit(1); }
  if (a[0] === '--all') {
    const od = a[1] || 'out', items = [], specs = {};
    for (const c of require('./lib/contracts.js').list()) if (c.spec) items.push([c.id, (specs[c.id] = build(c.spec, path.join(od, c.id + '.html'), c.id)).title || c.id]);
    buildTx(path.join(od, 'tx.html'));
    items.push(['tx', UI.txTitle]);
    const tpl = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8'), mh = MH(), counts = {};
    const cards = items.filter(([n]) => n !== 'tx').map(([n, t]) => { const m = META.load(n) || {}, tags = META.tagsOf(m, pluginOf(n));
      (m.contributors || []).forEach(u => counts[u] = (counts[u] || 0) + 1);
      const text = [n, plain(t, 'zh'), plain(t, 'en'), ...tags.map(x => META.TAX.tags[x] ? META.TAX.tags[x].zh + ' ' + META.TAX.tags[x].en : x)].join(' ').toLowerCase();
      return `<li class="ci" data-tags="${esc(tags.join(' '))}" data-text="${esc(text)}"><a href="${n}.html">${T(t, esc)}</a>${mh.badge(m)}<div class="mono">${esc(n)}</div>${mh.chips(tags)}${(m.contributors || []).length ? `<div class="avs">${m.contributors.map(mh.avatar).join('')}</div>` : ''}</li>`; }).join('');
    const groups = Object.entries(META.TAX.groups).map(([g, d]) => `<div class="fg"><b>${T(d.label, esc)}</b>${Object.entries(META.TAX.tags).filter(([, x]) => x.group === g).map(([k, x]) => `<button class="tag g-${g}" data-f="${k}" data-g="${g}" aria-pressed="false">${T({ zh: x.zh, en: x.en }, esc)}</button>`).join('')}</div>`).join('');
    const people = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const go = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>`;
    const hero = `<section class="hero"><div class="hero-h"><span class="hero-ic"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"></path><path d="M8 9h5M8 12h8M8 15h6"></path></svg></span>
<div><h2>${T(UI.txTitle, esc)}</h2><p>${T({ zh: '粘贴交易 hash，一键拆成 cell 流转卡片，并按合约规则逐条检查', en: 'Paste a tx hash to split it into cell-flow cards and check each contract rule' }, esc)}</p></div></div>
<div class="bar"><input id="hx" placeholder="0x… tx hash" aria-label="tx hash" spellcheck="false" autocomplete="off"><select id="hn" aria-label="network"><option value="https://mainnet.ckb.dev/rpc">mainnet</option><option value="https://testnet.ckb.dev/rpc">testnet</option></select><button class="btn" id="hg">${T({ zh: '解码', en: 'Decode' }, esc)}${go}</button></div>
<a class="hero-link" href="tx.html">${T({ zh: '打开完整解码器 →', en: 'Open full decoder →' }, esc)}</a></section>
<script>(function(){var i=document.getElementById('hx'),n=document.getElementById('hn');function g(){var h=i.value.trim();if(!h)return i.focus();location.href='tx.html#'+new URLSearchParams({tx:h,rpc:n.value})}document.getElementById('hg').onclick=g;i.onkeydown=function(e){if(e.key==='Enter')g()}})();</script>`;
    // AI generator: one sentence (SKILL.md + the user's repo) for any coding agent, or install the skill
    const ic = (d, c) => `<svg${c ? ` class="${c}"` : ''} viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
    const copyIc = ic('<rect x="8.5" y="8.5" width="11" height="11" rx="2.2"></rect><path d="M15.5 8.5V6.2a1.7 1.7 0 0 0-1.7-1.7H6.2a1.7 1.7 0 0 0-1.7 1.7v7.6a1.7 1.7 0 0 0 1.7 1.7h2.3"></path>', 'i-cp') + ic('<path d="M5 12.5l4.2 4.2L19 7"></path>', 'i-ok');
    const steps = [[{ zh: '填入合约仓库', en: 'Enter the contract repo' }, { zh: 'GitHub 链接或本地路径都可以', en: 'A GitHub URL or a local path' }],
      [{ zh: '复制这句话', en: 'Copy the sentence' }, { zh: '点「复制」或在输入框里按回车', en: 'Click Copy, or press Enter in the field' }],
      [{ zh: '发给你的 coding agent', en: 'Paste it into your coding agent' }, 'Claude Code · Cursor · Codex …']];
    const inst = [['npx', 'npx skills add gpBlockchain/ckb-contract-flow-html -g -y -a claude-code cursor codex'],
      ['curl', 'curl -fsSL https://raw.githubusercontent.com/gpBlockchain/ckb-contract-flow-html/main/install.sh | sh'],
      ['Claude Code', '/plugin marketplace add gpBlockchain/ckb-contract-flow-html'], ['', '/plugin install ckb-contract-flow@ckb-contract-flow-html']];
    const gen = `<section class="gen" id="skill"><div class="gen-t"><span class="eyebrow">${ic('<path d="M12 2.8l2.1 6.1 6.1 2.1-6.1 2.1L12 19.2l-2.1-6.1L3.8 11l6.1-2.1z"></path><path d="M19 15.6l.8 2.1 2.1.8-2.1.8-.8 2.1-.8-2.1-2.1-.8 2.1-.8z"></path>')}${T({ zh: 'AI 生成', en: 'Generate with AI' }, esc)}</span>
<h2>${T({ zh: '没找到你的合约？\n一句话让 AI 生成', en: 'Contract not listed?\nGenerate it in one sentence' }, s => esc(s).replace('\n', '<br>'))}</h2>
<p>${T({ zh: '把这句话发给任意 coding agent：它会按 SKILL.md 的步骤读取合约源码，在本地生成和这里同样格式的 cell 流转页面。无需安装。', en: 'Paste this sentence into any coding agent: it follows SKILL.md, reads the contract source and builds the same kind of cell-flow page locally. No install needed.' }, esc)}</p>
<ol class="steps">${steps.map(([b, s]) => `<li><b>${T(b, esc)}</b><span>${T(s, esc)}</span></li>`).join('')}</ol></div>
<div class="gen-box"><label class="gen-f">${ic('<path d="M3.5 7.5a2 2 0 0 1 2-2h3.6l2 2h7.4a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"></path>')}<span>${T({ zh: '合约仓库', en: 'Repo' }, esc)}</span><input id="sku" placeholder="https://github.com/owner/repo  ·  /path/to/repo" spellcheck="false" autocomplete="off"></label>
<p class="gen-p" id="skp"></p>
<div class="gen-a"><span>${T({ zh: '复制的是完整句子，含 SKILL.md 链接', en: 'Copies the full sentence, SKILL.md link included' }, esc)}</span><button id="skc" class="btn" type="button">${copyIc}<span class="l-cp">${T({ zh: '复制', en: 'Copy' }, esc)}</span><span class="l-ok">${T({ zh: '已复制', en: 'Copied' }, esc)}</span></button></div></div>
<details class="more gen-more"><summary>${T({ zh: '可选：安装为 skill', en: 'Optional: install as a skill' }, esc)}</summary>
<p class="small">${T({ zh: '任选一种装好后，只需对 agent 说「用 ckb-contract-flow 给 <仓库> 生成合约流转 HTML」。', en: 'Pick any one; afterwards just tell your agent "use ckb-contract-flow for <repo>".' }, esc)}</p>
<ul class="inst">${inst.map(([k, c]) => `<li><span>${esc(k)}</span><code>${esc(c)}</code><button class="cpi" type="button" aria-label="copy" title="copy">${copyIc}</button></li>`).join('')}</ul>
<a href="https://github.com/gpBlockchain/ckb-contract-flow-html/blob/main/skills/ckb-contract-flow/SKILL.md">SKILL.md →</a></details></section>
<script>(function(){var R='https://raw.githubusercontent.com/gpBlockchain/ckb-contract-flow-html/main/skills/ckb-contract-flow/SKILL.md',d=document,u=d.getElementById('sku'),p=d.getElementById('skp'),c=d.getElementById('skc');
// the sentence as [text, SKILL.md url, text, repo or placeholder, text]: the preview shows the url as a SKILL.md chip, copying gives the full text
function parts(){var v=u.value.trim(),zh=d.documentElement.getAttribute('data-lang')==='zh',r=v||(zh?'<合约仓库 URL 或本地路径>':'<contract repo URL or local path>');return zh?['阅读 ',R,' 并按其步骤为 ',r,' 生成合约 cell 流转 HTML']:['Read ',R,' and follow it to generate a cell-flow HTML for ',r,'']}
function text(){return parts().join('')}
function draw(){var a=parts(),v=u.value.trim(),l=d.createElement('a'),s=d.createElement('span');l.className='tk';l.href=R;l.target='_blank';l.rel='noopener';l.title=R;l.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z"></path><path d="M13.5 3.5V9H19"></path></svg>SKILL.md';
s.className=v?'tk-r':'tk-r tk-e';s.textContent=v||a[3].slice(1,-1);s.onclick=function(){u.focus()};p.textContent='';p.append(a[0],l,a[2],s,a[4])}
function copy(t,b){var f=function(){prompt('',t)};if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(function(){b.setAttribute('data-ok','1');clearTimeout(b._t);b._t=setTimeout(function(){b.removeAttribute('data-ok')},1600)},f);else f()}
u.oninput=draw;u.onkeydown=function(e){if(e.key==='Enter')copy(text(),c)};c.onclick=function(){copy(text(),c)};
p.addEventListener('copy',function(e){if(e.clipboardData){e.clipboardData.setData('text/plain',text());e.preventDefault()}});
[].forEach.call(d.querySelectorAll('.inst button'),function(b){b.onclick=function(){copy(b.previousElementSibling.textContent,b)}});
new MutationObserver(draw).observe(d.documentElement,{attributes:true,attributeFilter:['data-lang']});draw()})();</script>`;
    const list = hero + `<section class="browse"><div class="sh"><h2>${T(UI.contracts, esc)}</h2><a class="sh-a" href="#skill">${T({ zh: '没找到你的合约？用 AI 生成 →', en: 'Not listed? Generate it with AI →' }, esc)}</a></div>
<div class="card fpanel"><div class="search"><input id="q" class="inp" type="search" placeholder="search / 搜索 (id, name, tag)" aria-label="search" autocomplete="off" spellcheck="false"><kbd class="kbd">/</kbd></div>
<div class="filters">${groups}</div><div id="projsel">${Object.keys(mh.PROJ).filter(k => META.TAX.tags[k]).map(mh.projectPanel).join('')}</div></div>
<div class="cntrow"><span id="cnt"></span><button id="copylink" class="copyl" type="button" title="copy a link to this filtered view">${T({ zh: '复制链接', en: 'Copy link' }, esc)}<span class="okm">${T({ zh: ' ✓ 已复制', en: ' ✓ copied' }, esc)}</span></button></div>
<div class="empty" id="empty" hidden><b>${T({ zh: '没有匹配的合约', en: 'No matching contracts' }, esc)}</b><span>${T({ zh: '换个关键词或清除筛选。还没收录？', en: 'Try another keyword or clear the filters. Not listed yet? ' }, esc)}<a href="#skill">${T({ zh: '用 AI 生成它的流转页 →', en: 'Generate its flow page with AI →' }, esc)}</a></span></div><ul class="cards">${cards}</ul></section>
${gen}
<div class="card"><h2>${T({ zh: '贡献者', en: 'Contributors' }, esc)}</h2>${people.length ? `<ul class="people">${people.map(([u, k]) => `<li>${mh.avatar(u)}<a href="https://github.com/${esc(u)}">@${esc(u)}</a><span class="k">${k}</span></li>`).join('')}</ul>` : ''}
<div class="small">${T({ zh: '欢迎贡献新合约：见 docs/ADD_CONTRACT.md，并在 meta.json 的 contributors 中加上你的 GitHub 用户名。', en: 'New contracts welcome: see docs/ADD_CONTRACT.md and add your GitHub username to contributors in meta.json.' }, esc)}</div></div>
<script>(function(){var on={},q=document.getElementById('q'),li=[].slice.call(document.querySelectorAll('.ci')),cnt=document.getElementById('cnt'),bs=[].slice.call(document.querySelectorAll('.filters button'));
// URL sync: ?<group>=a,b (project values without the "p-" prefix) &q=text; location.hash is left untouched
var pre=function(g){return g==='project'?'p-':''};
function panels(){var ps=on.project||[];[].forEach.call(document.querySelectorAll('#projsel .projp'),function(p){p.hidden=ps.indexOf(p.getAttribute('data-projp'))<0})}
function run(){var s=(q.value||'').toLowerCase().trim(),n=0;li.forEach(function(e){var t=' '+e.getAttribute('data-tags')+' ',ok=Object.keys(on).every(function(g){var a=on[g];return !a.length||a.some(function(k){return t.indexOf(' '+k+' ')>=0})})&&(!s||e.getAttribute('data-text').indexOf(s)>=0);e.style.display=ok?'':'none';if(ok)n++});cnt.textContent=n+' / '+li.length;document.getElementById('empty').hidden=n>0;panels()}
function toURL(){var u=new URLSearchParams();Object.keys(on).sort().forEach(function(g){if(on[g].length)u.set(g,on[g].map(function(k){return k.slice(pre(g).length)}).join(','))});var s=(q.value||'').trim();if(s)u.set('q',s);var qs=u.toString();try{history.replaceState(history.state,'',location.pathname+(qs?'?'+qs:'')+location.hash)}catch(e){}}
function fromURL(){var u=new URLSearchParams(location.search);on={};bs.forEach(function(b){var g=b.getAttribute('data-g'),k=b.getAttribute('data-f'),v=(u.get(g)||'').split(',').filter(Boolean).map(function(x){return pre(g)+x}),a=v.indexOf(k)>=0;if(a)(on[g]=on[g]||[]).push(k);b.setAttribute('aria-pressed',a)});q.value=u.get('q')||'';run()}
bs.forEach(function(b){b.onclick=function(){var g=b.getAttribute('data-g'),k=b.getAttribute('data-f'),a=on[g]=on[g]||[],i=a.indexOf(k);if(i>=0)a.splice(i,1);else a.push(k);b.setAttribute('aria-pressed',i<0);run();toURL()}});
q.oninput=function(){run();toURL()};window.addEventListener('popstate',fromURL);
document.addEventListener('keydown',function(e){var t=e.target;if(e.key==='/'&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName||'')&&!t.isContentEditable){e.preventDefault();q.focus()}});
var cp=document.getElementById('copylink');if(cp)cp.onclick=function(){var url=location.href,done=function(){cp.setAttribute('data-ok','1');setTimeout(function(){cp.removeAttribute('data-ok')},1500)};if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(url).then(done,function(){prompt('URL',url)});else prompt('URL',url)};
fromURL()})();</script>`;
    fs.writeFileSync(path.join(od, 'index.html'), tpl.replace('{{DOC_TITLE}}', esc(UI.indexTitle.zh + ' / ' + UI.indexTitle.en))
      .replace('{{HEAD}}', mdLink('llms.txt')).replace('{{AGENT}}', agentLine(['llms.txt', 'contracts.json', 'decode-tx.js'], ASK.index))
      .replace('{{CRUMB}}', '').replace('{{TITLE}}', T(UI.indexTitle, esc)).replace('{{SUBTITLE}}', () => `<p class="lead">${T(UI.indexSub, esc)}</p>`)
      .replace('{{CARDS}}', () => list).replace('{{FOOTER}}', ''));
    AG.write(od, specs);
  } else {
    build(a[0], a[1] || path.join('out', path.basename(a[0]).replace(/\.(json|ya?ml)$/i, '') + '.html'));
  }
}
if (require.main === module) main();
module.exports = { render, parseYaml, T, buildTx };
