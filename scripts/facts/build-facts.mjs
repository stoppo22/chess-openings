import fs from 'node:fs';
import path from 'node:path';
import { buildFacts } from './facts-lib.mjs';

const root = path.resolve(import.meta.dirname, '../..');
export function writeFacts(openingId) {
  const opening = JSON.parse(fs.readFileSync(path.join(root, 'src/data/openings', `${openingId}.json`), 'utf8'));
  const dir = path.join(root, '.cache/facts', openingId);
  fs.mkdirSync(dir, { recursive: true });
  const out = {};
  // Every variation that has positions, including the fallback one (e.g. london-other, caro-kann-root).
  const ids = [...new Set(Object.values(opening.positions).map((p) => p.variationId))];
  for (const id of ids) {
    const { _noAlt, ...facts } = buildFacts(opening, id, (w) => console.warn('WARN', w));
    if (!facts.positions.length) continue;
    fs.writeFileSync(path.join(dir, `${id}.json`), JSON.stringify(facts, null, 1));
    out[id] = facts;
    console.log(`${id}: ${facts.positions.length} positions, alternatives ${_noAlt ? `missing in ${_noAlt}` : 'present'}, hash ${facts.factsHash.slice(0, 8)}`);
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const id = process.argv.find((a) => a.startsWith('--opening='))?.split('=')[1];
  if (!id) { console.error('usage: facts --opening=<id>'); process.exit(2); }
  try { writeFacts(id); } catch (e) { console.error('FAIL', e.message); process.exit(1); }
}
