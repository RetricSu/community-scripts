// DOTBIT_INCOME — .bit IncomeCell type; dotbitHQ/did-contracts contracts/income-cell-type/src/entry.rs
// @requires dotbit_reverse_record
(function (R) {
  const AS = { mainnet: '0x303ead37be5eebfcf3504847155538cb623a26f237609df24bd296750c123078', testnet: '0xf1ef61b6977508d9ec56fe43399a01e576086a76cf0f7c687d1418335e8c401f' };
  const same = (a, b) => a && b && a.code_hash === b.code_hash && a.hash_type === b.hash_type && a.args === b.args;
  const REQ = { confirm_proposal: 'ProposalCell', buy_account: 'AccountSaleCell', accept_offer: 'OfferCell', renew_account: 'AccountCell' };
  function parse(g, ctx) {
    const p = { act: R.dotbit.action(ctx), ins: [], outs: [] };
    ctx.inputs.forEach((x, i) => { if (x.output && same(x.output.type, g.script)) p.ins.push(i); });
    ctx.tx.outputs.forEach((o, i) => { if (same(o.type, g.script)) p.outs.push(i); });
    p.net = g.script.code_hash === '0x6c1d69a358954fc471a2ffa82a98aed5a4912e6002a5e761524f2304ab53bf39' ? 'mainnet' : 'testnet';
    p.fields = [['action', p.act ? (p.act.name || p.act.error) : '—'], [{ zh: '本类型输入', en: 'inputs of this type' }, p.ins.join(', ') || '—'], [{ zh: '本类型输出', en: 'outputs of this type' }, p.outs.join(', ') || '—']];
    return p;
  }
  function check(g, ctx, p) {
    const c = [R.check(!!(p.act && p.act.name), '能读出 das ActionData witness', 'the das ActionData witness can be read', 46),
      R.NOT_CHECKED('系统开关 ConfigCellMain.status ≠ off（配置在 cell_deps）', 'system switch ConfigCellMain.status ≠ off (config lives in cell_deps)', -1)];
    if (!p.act || !p.act.name) return c;
    const a = p.act.name;
    if (a === 'create_income') {
      c.push(R.check(p.ins.length === 0 && p.outs.length === 1, `输入 0 个、输出 1 个 IncomeCell（当前 ${p.ins.length} / ${p.outs.length}）`, `0 IncomeCells in inputs and 1 in outputs (got ${p.ins.length} / ${p.outs.length})`, 6));
      if (p.outs.length === 1) { const l = ctx.tx.outputs[p.outs[0]].lock; c.push(R.check(l.code_hash === AS[p.net] && l.hash_type === 'type', '新 IncomeCell 使用 always-success lock（code_hash 与 hash_type）', 'the new IncomeCell uses the always-success lock (code_hash and hash_type)', 30)); }
      c.push(R.NOT_CHECKED('IncomeCell witness 只有 1 条记录，属于 creator，金额 = basic_capacity（未解码 witness；basic_capacity 来自配置）', 'the IncomeCell witness has exactly 1 record, owned by the creator, amount = basic_capacity (witness not decoded; basic_capacity comes from config)', 6));
      c.push(R.NOT_CHECKED('IncomeCell 容量 = ConfigCellIncome.basic_capacity（配置）', 'IncomeCell capacity = ConfigCellIncome.basic_capacity (config)', -122));
    } else if (a === 'consolidate_income') {
      c.push(R.check(p.ins.length >= 2, `输入中至少 2 个 IncomeCell（当前 ${p.ins.length}）`, `at least 2 IncomeCells in inputs (got ${p.ins.length})`, -126));
      c.push(R.check(p.ins.length >= p.outs.length, `输出 IncomeCell 数 ≤ 输入（${p.outs.length} ≤ ${p.ins.length}）`, `output IncomeCells ≤ input IncomeCells (${p.outs.length} ≤ ${p.ins.length})`, -126));
      c.push(R.NOT_CHECKED('合并记录、按费率转账与保留、填充与浪费检查（需要解码 IncomeCell witness 和配置里的 max_records / min_transfer_capacity / 费率）', 'merging records, transfers after fee vs. kept records, padding and waste checks (need decoded IncomeCell witnesses and config max_records / min_transfer_capacity / profit rate)', '-125 · -124 · -123'));
    } else if (REQ[a]) {
      c.push(R.NOT_CHECKED(`输入中必须有 ${REQ[a]}（按配置里的 type id 查找）`, `inputs must include a cell of type ${REQ[a]} (looked up by the type id in config)`, 6));
    } else c.push(R.check(false, `action ${a} 不被 IncomeCell 支持`, `action ${a} is not supported by IncomeCell`, 27));
    return c;
  }
  R.register({ id: 'dotbit_income', kind: 'type', name: '.bit IncomeCell Type', match: [
    { code_hash: '0x6c1d69a358954fc471a2ffa82a98aed5a4912e6002a5e761524f2304ab53bf39', hash_type: 'type', net: 'mainnet', src: 'dotbitHQ/das-lib core/env.go EnvMainNet IncomeCellType type-id args 0x108fba6a…; code hash = Type ID script hash; live code cell 0x0266b5a1…:0' },
    { code_hash: '0x08d1cdc6ab92d9cabe0096a2c7642f73d0ef1b24c94c43f21c6c3a32ffe0bb5e', hash_type: 'type', net: 'testnet', src: 'dotbitHQ/das-lib core/env.go EnvTestnet2 IncomeCellType type-id args 0xd7b9d821…' }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));
