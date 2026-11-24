// Spore — sporeprotocol/spore-contract contracts/spore/src/entry.rs, lib/utils, lib/errors/src/error.rs
// Also exposes R.spore (molecule helpers) for cluster.
// @requires type_id
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex, dec = b => { try { return new TextDecoder().decode(b); } catch (e) { return X(b); } };
  // SporeData { content_type: Bytes, content: Bytes, cluster_id: BytesOpt } ; ClusterData(V2) { name, description, mutant_id? }
  function table(hex, n) { try { return R.parseTable(H(hex || '0x'), n); } catch (e) { return null; } }
  function sporeData(hex) { const f = table(hex, 2); if (!f) return null;
    try { return { contentType: dec(R.parseBytes(f[0])), contentLen: R.parseBytes(f[1]).length, clusterId: f[2] && f[2].length ? X(R.parseBytes(f[2])) : null }; } catch (e) { return null; } }
  function clusterData(hex) { const f = table(hex, 2); if (!f) return null;
    try { return { name: dec(R.parseBytes(f[0])), description: dec(R.parseBytes(f[1])), mutantId: f[2] && f[2].length ? X(R.parseBytes(f[2])) : null, fields: f.length }; } catch (e) { return null; } }
  const id32 = s => X(H(s.args).subarray(0, 32));
  R.spore = { sporeData, clusterData, id32 };
  const ACTION = (zh, en, c) => R.NOT_CHECKED(zh + '（co-build Action，未检查）', en + ' (co-build Action, not checked)', c);
  function parse(g, ctx) {
    const p = { op: g.inputs.length === 0 ? 'mint' : g.outputs.length === 0 ? 'burn' : 'transfer' };
    p.dIn = g.inputs.length ? sporeData(ctx.inputs[g.inputs[0]].data) : null; p.dOut = g.outputs.length ? sporeData(ctx.tx.outputs_data[g.outputs[0]]) : null;
    const d = p.dOut || p.dIn;
    p.fields = [['spore_id', id32(g.script)], [{ zh: '操作', en: 'operation' }, { mint: { zh: '铸造', en: 'mint' }, burn: { zh: '销毁', en: 'burn' }, transfer: { zh: '转移', en: 'transfer' } }[p.op]]];
    if (d) p.fields.push(['content_type', d.contentType], ['content', d.contentLen + ' B'], ['cluster_id', d.clusterId || 'None']);
    p.layouts = [{ label: 'SporeData (molecule table)', layout: [{ name: 'content_type', size: 'Bytes', color: 1, flex: 2 }, { name: 'content', size: 'Bytes', color: 3, flex: 4 }, { name: 'cluster_id?', size: 'BytesOpt(32B)', color: 4, flex: 2 }], hex: [] }];
    return p;
  }
  function check(g, ctx, p) {
    const c = [R.check(g.outputs.length <= 1, `group 输出 ${g.outputs.length} ≤ 1`, `group outputs ${g.outputs.length} ≤ 1`, 67), R.check(g.inputs.length <= 1, `group 输入 ${g.inputs.length} ≤ 1`, `group inputs ${g.inputs.length} ≤ 1`, 68)];
    if (g.inputs.length > 1 || g.outputs.length > 1) return c;
    if (p.op === 'mint') { const d = p.dOut, j = g.outputs[0];
      c.push(R.check(!!d, 'output data 为合法 SporeData', 'output data is a valid SporeData', 62));
      if (!d) return c;
      c.push(R.check(d.contentLen > 0, 'content 非空', 'content is non-empty', 66), R.check(d.contentType.length > 0, 'content_type 非空', 'content_type is non-empty', 64),
        R.check(H(g.script.args).length >= 32 && id32(g.script) === R.typeId(ctx, j), 'args[0..32] = type_id(inputs[0], 输出序号)', 'args[0..32] = type_id(inputs[0], output index)', 63));
      if (d.clusterId) {
        const hasIn = ctx.inputs.some(x => x.output && x.output.type && id32(x.output.type) === d.clusterId), hasOut = ctx.tx.outputs.some(o => o.type && H(o.type.args).length >= 32 && id32(o.type) === d.clusterId);
        c.push(R.NOT_CHECKED('cell_deps 中有 type args = cluster_id 的 cluster cell（未检查 cell_deps 内容）', 'a cluster cell with type args = cluster_id is in cell_deps (cell_deps contents not checked)', 6));
        c.push(hasIn && hasOut ? R.check(true, 'cluster cell 同时出现在输入与输出（直接授权）', 'cluster cell appears in both inputs and outputs (direct authorization)', 7)
          : R.NOT_CHECKED('cluster lock（或 agent lock）同时出现在输入与输出（lock-proxy 模式，未检查）', 'cluster lock (or agent lock) appears in inputs and outputs (lock-proxy mode, not checked)', 7));
      }
      c.push(R.NOT_CHECKED('mutant / 扩展（content_type 带 mutant[] 参数时执行，未检查）', 'mutant extensions (run when content_type has mutant[] params, not checked)', '71 / 72 / 73'), ACTION('MintSpore{spore_id, to, data_hash} 与本 cell 一致', 'MintSpore{spore_id, to, data_hash} matches this cell', '8–13'));
    } else if (p.op === 'transfer') {
      const a = ctx.inputs[g.inputs[0]].data, b = ctx.tx.outputs_data[g.outputs[0]];
      c.push(R.check(!!p.dIn, 'input data 为合法 SporeData', 'input data is a valid SporeData', 62), R.check(a === b, '转移：data 完全不变', 'transfer: data is byte-identical', 61), ACTION('TransferSpore{spore_id, from, to}', 'TransferSpore{spore_id, from, to}', '8–13'));
    } else {
      const imm = !!p.dIn && /(^|;)\s*immortal\s*=\s*true\s*(;|$)/.test(p.dIn.contentType);
      c.push(R.check(!!p.dIn, 'input data 为合法 SporeData', 'input data is a valid SporeData', 62), R.check(!imm, '销毁：content_type 未声明 immortal=true（简化解析）', 'burn: content_type does not declare immortal=true (simplified parsing)', 65), ACTION('BurnSpore{spore_id, from}', 'BurnSpore{spore_id, from}', '8–13'));
    }
    return c;
  }
  R.register({ id: 'spore', kind: 'type', name: 'Spore', match: [
    { code_hash: '0x4a4dce1df3dffff7f8b2cd7dff7303df3b6150c9788cb75dcf6747247132b9f5', hash_type: 'data1', net: 'mainnet', src: 'spore-sdk predefined.ts (Spore v2)' },
    { code_hash: '0x685a60219309029d01310311dba953d67029170ca4848a4ff638e57002130a0d', hash_type: 'data1', net: 'testnet', src: 'spore-sdk predefined.ts (Spore v2 preview)' },
    { code_hash: '0xbbad126377d45f90a8ee120da988a2d7332c78ba8fd679aab478a19d6c133494', hash_type: 'data1', net: 'testnet', src: 'spore-sdk predefined.ts (Spore v1)' },
    { code_hash: '0xcfba73b58b6f30e70caed8a999748781b164ef9a1e218424a6fb55ebf641cb33', hash_type: 'type', net: 'mainnet', src: 'spore-sdk predefined.ts (Spore v2, tag did — dotbit deployment)' },
    { code_hash: '0x0b1f412fbae26853ff7d082d422c2bdd9e2ff94ee8aaec11240a5b34cc6e890f', hash_type: 'type', net: 'testnet', src: 'spore-sdk predefined.ts (Spore v2, tag did — dotbit deployment)' }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));
