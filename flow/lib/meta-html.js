// HTML for tags / provenance / contributors (used by gen.js for pages, index and decoder cards)
'use strict';
const M = require('./meta.js');
const PROJ = (() => { try { return JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '..', 'contracts', 'projects.json'), 'utf8')); } catch (e) { return {}; } })();
module.exports = function (T, esc) {
  const L = (zh, en) => T({ zh, en }, esc);
  const short = h => h && h.length > 22 ? h.slice(0, 12) + '…' + h.slice(-8) : h;
  const EXP = { mainnet: 'https://explorer.nervos.org', testnet: 'https://testnet.explorer.nervos.org' };
  const BADGE = { verified: ['已核验', 'verified'], unverified: ['未核验', 'unverified'], mismatch: ['不一致', 'mismatch'], 'no-source': ['无源码', 'no source'], builtin: ['内置', 'built-in'] };
  const chip = t => { const d = M.TAX.tags[t]; return d ? `<span class="tag g-${d.group}" data-tag="${esc(t)}"${PROJ[t] ? ' role="button" tabindex="0" aria-expanded="false" title="project info"' : ''}>${T({ zh: d.zh, en: d.en }, esc)}</span>` : ''; };
  // project registry (contracts/projects.json): clickable project chip toggles a panel with the project's official links
  const PF = [['website', '官网', 'Website'], ['docs', '文档', 'Docs'], ['github', 'GitHub', 'GitHub'], ['talk', 'Nervos Talk 帖子', 'Nervos Talk thread'], ['talk_profile', 'Nervos Talk 作者', 'Nervos Talk author'], ['x', 'X', 'X'], ['discord', 'Discord', 'Discord']];
  const projectPanel = t => { const p = PROJ[t], d = M.TAX.tags[t]; if (!p || !d) return '';
    const rows = PF.filter(([k]) => p[k]).map(([k, zh, en]) => `<li><span class="pk">${L(zh, en)}</span><a href="${esc(p[k])}" rel="noopener" target="_blank">${esc(p[k].replace(/^https?:\/\//, ''))}</a></li>`).join('');
    return `<div class="projp" data-projp="${esc(t)}" hidden><b>${esc(p.name || d.en)}</b>${p.desc ? ` · ${T(p.desc, esc)}` : ''}<ul>${rows}</ul>${p.author ? `<div class="small">${L('作者：', 'Author: ')}${esc(p.author)}</div>` : ''}<div class="small">${L('来源：', 'Source: ')}${esc(p.source || '')}</div></div>`; };
  const chips = tags => `<div class="tags">${tags.map(chip).join('')}</div>${tags.filter(t => PROJ[t]).map(projectPanel).join('')}`;
  const status = meta => (meta && meta.source && meta.source.binary && meta.source.binary.status) || (meta && meta.source && meta.source.status) || 'unverified';
  const badge = meta => { const s = status(meta), b = BADGE[s] || [s, s]; return `<span class="badge b-${esc(s)}" title="binary vs source">${L(b[0], b[1])}</span>`; };
  const avatar = u => `<a class="av" href="https://github.com/${esc(u)}" title="@${esc(u)}"><img loading="lazy" width="20" height="20" alt="@${esc(u)}" src="https://github.com/${esc(u)}.png?size=40"></a>`;
  const credit = meta => meta && meta.contributors && meta.contributors.length ? `<div class="credit">${L('贡献者：', 'Contributed by ')}${meta.contributors.map(u => `${avatar(u)} <a href="https://github.com/${esc(u)}">@${esc(u)}</a>`).join(', ')}</div>` : '';
  const tx = (net, h) => `<a href="${EXP[net]}/transaction/${esc(h)}">${esc(short(h))}</a>`;
  function provenance(meta, { compact = false } = {}) {
    if (!meta) return '';
    const s = meta.source || {}, b = s.binary || {};
    const src = s.repo ? `<a href="${esc(s.repo)}/tree/${esc(s.commit || s.tag)}">${esc(s.repo.replace('https://github.com/', ''))}@${esc((s.commit || s.tag || '').slice(0, 8))}</a>`
      + (s.paths || []).map(p => ` · <a href="${esc(s.repo)}/blob/${esc(s.commit || s.tag)}/${esc(p)}">${esc(p)}</a>`).join('')
      : s.local ? L('本地源码', 'local source') + ` @${esc(s.commit === 'uncommitted' ? 'uncommitted' : (s.commit || '').slice(0, 8))}` + (s.paths || []).map(p => ` · ${esc(p)}`).join('') : L('无公开源码', 'no public source');
    const rows = (meta.deployments || []).map(d => d.builtin ? `<tr><td>${esc(d.network)}</td><td colspan="5">${esc(short(d.code_hash))} (${esc(d.hash_type)}) — ${L('CKB 内置，无 code cell', 'built into CKB, no code cell')}</td></tr>`
      : `<tr><td>${esc(d.network)}</td><td><code>${esc(compact ? short(d.code_hash) : d.code_hash)}</code> <small>${esc(d.hash_type)}</small></td>`
      + `<td>${d.cell_dep ? tx(d.network, d.cell_dep.out_point.tx_hash) + ':' + parseInt(d.cell_dep.out_point.index, 16) + ` <small>${esc(d.cell_dep.dep_type)}</small>` : '—'}</td>`
      + `<td>${d.type_script ? `<code>${esc(short(d.type_script.args))}</code>` : '—'}</td><td><code>${esc(short(d.data_hash || '—'))}</code></td>`
      + `<td>${d.deploy_tx ? tx(d.network, d.deploy_tx) + (d.deploy_block != null ? ` <small>#${d.deploy_block}</small>` : '') : '—'}</td></tr>`).join('');
    const ev = (b.per || []).filter(x => x.evidence && x.evidence.length).map(x => `${esc(short(x.data_hash))}: ${esc(x.evidence.join('; '))}`).join('<br>');
    return `<details class="prov"${compact ? '' : ' open'}><summary>${L('部署与来源', 'Deployments & source')} ${badge(meta)}</summary>
<div class="kv"><span>${L('源码', 'source')}</span><div>${src}${s.commit_note ? ` <small>(${esc(s.commit_note)})</small>` : ''}</div></div>
<div class="kv"><span>${L('二进制核验', 'binary check')}</span><div>${badge(meta)} <small>${esc(b.note || '')}</small>${ev ? `<br><small>${ev}</small>` : ''}</div></div>
${rows ? `<div class="tbl"><table><tr><th>${L('网络', 'network')}</th><th>code_hash</th><th>cell_dep</th><th>type_id args</th><th>${L('数据哈希', 'data hash')}</th><th>${L('部署交易', 'deploy tx')}</th></tr>${rows}</table></div>` : `<div class="small">${L('未在链上找到部署', 'no on-chain deployment resolved')}</div>`}
${meta.checked_at ? `<div class="small">${L('链上数据核对于 ', 'on-chain data checked ')}${esc(meta.checked_at)}</div>` : ''}</details>`;
  }
  return { chip, chips, projectPanel, PROJ, badge, status, avatar, credit, provenance };
};
