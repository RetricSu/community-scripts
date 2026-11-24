<!-- Contract-KB PR (adding/editing flow/contracts/<id>/): keep the checklist below and tick every item.
     Other PRs (monitor engine, CI, baseline changes, ...): delete the checklist and describe your change. -->

## Contract

- id: `flow/contracts/<id>/`
- kind: lock / type
- Source (pinned commit): <!-- https://github.com/…/blob/<commit>/… -->
- Deployment constants source: <!-- RFC / official docs / official SDK -->

## Checklist

- [ ] Sources cited (source at a pinned commit + official code_hash/hash_type source)
- [ ] `spec.json` limits checked line-by-line against every `return ERROR_*` in the source — nothing invented
- [ ] All natural-language text is bilingual `{"zh","en"}`
- [ ] `meta.json`: tags from `flow/contracts/tags.json`; source.repo + full commit + paths; ran `node flow/scripts/check-deployments.js --write --only <id>`
- [ ] (optional, encouraged) add your GitHub username to `contributors` in `meta.json`
- [ ] `node flow/gen.js --all out` succeeds
- [ ] `node flow/scripts/check.js` passes
- [ ] `node flow/scripts/test-tx.js <id>` passes (`tests.json` has ≥ 1 real tx)
- [ ] Build artifacts (`out/`, `portal/`) not committed

## Notes
<!-- unverified or unchecked items -->
