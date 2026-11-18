import fs from 'node:fs';
import path from 'node:path';
import { verifyConcept, verifyLessons } from '../lib/verify.mjs';
import { writeFacts } from '../facts/build-facts.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const id = process.argv.find((a) => a.startsWith('--opening='))?.split('=')[1];
if (!id) { console.error('usage: lessons:verify --opening=<id>'); process.exit(2); }

const dir = path.join(root, 'src/data/lessons', id);
const read = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const lessonFiles = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')) : [];
if (!lessonFiles.length) { console.log('nessuna lezione'); process.exit(0); }

const factsDir = path.join(root, '.cache/facts', id);
// Always rebuild facts quietly so staleness is judged against the current opening JSON.
const orig = console.log; console.log = () => {};
let facts; try { facts = writeFacts(id); } finally { console.log = orig; }

let fails = 0, n = 0;
const report = (file, items) => items.forEach((i) => { fails++; console.log(`FAIL ${file} ${i.fen.slice(0, 20)} ${i.reason}`); });
const cdir = path.join(dir, 'concepts');
for (const f of fs.existsSync(cdir) ? fs.readdirSync(cdir).filter((x) => x.endsWith('.json')) : []) {
  const vid = f.replace('.json', '');
  if (facts[vid]) { n++; report(`concepts/${f}`, verifyConcept(read(path.join(cdir, f)), facts[vid])); }
  else report(`concepts/${f}`, [{ fen: '-', reason: `unknown variation ${vid}` }]);
}
for (const f of lessonFiles) {
  const vid = f.replace('.json', '');
  const cf = path.join(cdir, f);
  if (!facts[vid]) { report(f, [{ fen: '-', reason: `unknown variation ${vid}` }]); continue; }
  n++;
  report(f, verifyLessons(read(path.join(dir, f)), fs.existsSync(cf) ? read(cf) : null, facts[vid]));
}
console.log(`${n} file(s) checked, ${fails} failure(s)`);
process.exit(fails ? 1 : 0);
