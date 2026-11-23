#!/usr/bin/env node
// Zero-dependency static server for the built portal.
// Usage: node scripts/serve-portal.js [port=4173] [dir=portal]
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');

const ROOT = path.join(__dirname, '..');
const DIR = path.resolve(process.argv[3] || path.join(ROOT, 'portal'));
const PORT = parseInt(process.argv[2] || process.env.PORT || '4173', 10);
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json',
  '.css': 'text/css', '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
};

if (!fs.existsSync(path.join(DIR, 'index.html'))) {
  console.error(`portal not built: run \`pnpm run flow:build\` first (${DIR})`);
  process.exit(1);
}

http.createServer((req, res) => {
  let urlPath;
  try {
    urlPath = decodeURIComponent((req.url || '/').split('?')[0].split('#')[0]);
  } catch {
    res.writeHead(400); return res.end('bad request');
  }
  let file = path.normalize(path.join(DIR, urlPath));
  // containment: reject anything escaping DIR (prefix match alone is not enough:
  // DIR=/a/b would also prefix /a/b-evil)
  const rel = path.relative(DIR, file);
  if (rel === '..' || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) { res.writeHead(403); return res.end('forbidden'); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { res.writeHead(404); return res.end('not found: ' + urlPath); }
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, '127.0.0.1', () => console.log(`portal at http://localhost:${PORT}/ (serving ${DIR})`));
