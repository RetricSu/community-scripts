// A reviewed upstream version is NOT a new deployment/build pin.
'use strict';
const sha = x => /^[0-9a-f]{40}$/.test(x || '');
const samePaths = (a, b) => Array.isArray(a) && Array.isArray(b) && JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
function validateReview(source) {
  const r = source.upstream_review;
  if (r == null) return [];
  const e = [];
  if (r.repo !== source.repo || r.base_commit !== source.commit || !samePaths(r.paths, source.paths)) e.push('review must bind the current repo, source commit and exact tracked paths');
  if (!sha(r.commit)) e.push('review commit must be a full SHA');
  if (r.disposition !== 'retain-deployed-version') e.push('review disposition must be retain-deployed-version');
  if (!r.reason || !['zh', 'en'].every(k => typeof r.reason[k] === 'string' && r.reason[k].trim())) e.push('review needs a bilingual reason');
  if (!Array.isArray(r.evidence) || !r.evidence.length || !r.evidence.every(x => typeof x === 'string' && /^https:\/\//.test(x))) e.push('review needs evidence URLs');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.reviewed_at || '')) e.push('review needs reviewed_at YYYY-MM-DD');
  return e;
}
function baseline(source) { return source.upstream_review && !validateReview(source).length ? source.upstream_review.commit : source.commit; }
const matches = (name, p) => name === p.replace(/\/$/, '') || name.startsWith(p.replace(/\/$/, '') + '/');
function changedPaths(paths, cmp) {
  if (!cmp || !Array.isArray(cmp.files)) return { error: 'upstream comparison could not be read' };
  // GitHub caps compare.files at 300; a three-dot diff on diverged history is not a tree-to-tree comparison.
  if (!['ahead', 'identical'].includes(cmp.status) || cmp.files.length >= 300) return { error: 'upstream comparison is diverged, behind or potentially truncated' };
  return { paths: cmp.files.filter(f => paths.some(p => matches(f.filename, p) || (f.previous_filename && matches(f.previous_filename, p)))).map(f => f.filename) };
}
module.exports = { validateReview, baseline, changedPaths };
