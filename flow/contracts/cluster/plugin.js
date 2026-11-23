// Cluster — sporeprotocol/spore-contract contracts/cluster/src/entry.rs, lib/errors/src/error.rs
// @requires spore
(function (R) {
  const H = R.hexToBytes;
  function parse(g, ctx) {
    const p = { op: g.inputs.length === 0 ? 'mint' : g.outputs.length === 0 ? 'burn' : 'transfer' };
    p.dIn = g.inputs.length ? R.spore.clusterData(ctx.inputs[g.inputs[0]].data) : null; p.dOut = g.outputs.length ? R.spore.clusterData(ctx.tx.outputs_data[g.outputs[0]]) : null;
    const d = p.dOut || p.dIn;
    p.fields = [['cluster_id', R.spore.id32(g.script)], [{ zh: '操作', en: 'operation' }, { mint: { zh: '创建', en: 'create' }, burn: { zh: '销毁（不允许）', en: 'destroy (not allowed)' }, transfer: { zh: '转移 / 引用', en: 'transfer / reference' } }[p.op]]];
    if (d) p.fields.push(['name', d.name], ['description', d.description.length > 120 ? d.description.slice(0, 120) + '…' : d.description], ['mutant_id', d.mutantId || 'None']);
    p.layouts = [{ label: 'ClusterData (molecule table)', layout: [{ name: 'name', size: 'Bytes', color: 1, flex: 2 }, { name: 'description', size: 'Bytes', color: 3, flex: 4 }, { name: 'mutant_id? (v2)', size: 'BytesOpt', color: 4, flex: 2 }], hex: [] }];
    return p;
  }
  function check(g, ctx, p) {
    const c = [R.check(g.inputs.length <= 1 && g.outputs.length <= 1, 'group 输入、输出各 ≤ 1', 'group inputs and outputs ≤ 1 each', 50)];
    if (p.op === 'burn') { c.push(R.check(false, 'cluster 不能被销毁（1 → 0）', 'a cluster cannot be destroyed (1 → 0)', 50)); return c; }
    if (p.op === 'mint') { const d = p.dOut;
      c.push(R.check(!!d, 'output data 为合法 ClusterData', 'output data is a valid ClusterData', 5));
      if (d) c.push(R.check(d.name.length > 0, 'name 非空', 'name is non-empty', 52));
      c.push(R.check(H(g.script.args).length >= 32 && R.spore.id32(g.script) === R.typeId(ctx, g.outputs[0]), 'args[0..32] = type_id(inputs[0], 输出序号)', 'args[0..32] = type_id(inputs[0], output index)', 53));
      if (d && d.mutantId) c.push(R.NOT_CHECKED('cell_deps 中有对应 Lua 扩展（mutant）cell（未检查）', 'matching Lua extension (mutant) cell in cell_deps (not checked)', 54));
      c.push(R.NOT_CHECKED('co-build Action MintCluster{cluster_id, to, data_hash}（未检查）', 'co-build Action MintCluster{cluster_id, to, data_hash} (not checked)', '8–13'));
    } else {
      c.push(R.check(!!p.dIn, 'input data 为合法 ClusterData', 'input data is a valid ClusterData', 5), R.check(ctx.inputs[g.inputs[0]].data === ctx.tx.outputs_data[g.outputs[0]], 'data 完全不变', 'data is byte-identical', 51),
        R.NOT_CHECKED('co-build Action TransferCluster{cluster_id, from, to}（未检查）', 'co-build Action TransferCluster{cluster_id, from, to} (not checked)', '8–13'));
    }
    return c;
  }
  R.register({ id: 'cluster', kind: 'type', name: 'Spore Cluster', match: [
    { code_hash: '0x7366a61534fa7c7e6225ecc0d828ea3b5366adec2b58206f2ee84995fe030075', hash_type: 'data1', net: 'mainnet', src: 'spore-sdk predefined.ts (Cluster v2)' },
    { code_hash: '0x0bbe768b519d8ea7b96d58f1182eb7e6ef96c541fbd9526975077ee09f049058', hash_type: 'data1', net: 'testnet', src: 'spore-sdk predefined.ts (Cluster v2 preview)' },
    { code_hash: '0x598d793defef36e2eeba54a9b45130e4ca92822e1d193671f490950c3b856080', hash_type: 'data1', net: 'testnet', src: 'spore-sdk predefined.ts (Cluster v1)' }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));
