import fs from 'node:fs';
import path from 'node:path';
import { cachedJson, cachedText, politeFetch } from '../lib/cache.mjs';
import { parsePgn, walkGame } from '../lib/pgn.mjs';
import { compare } from './compare.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const args = process.argv.slice(2);
const cmp = args.find((a) => a.startsWith('--compare='))?.split('=')[1];
const ids = args.filter((a) => !a.startsWith('--')).map((a) => a.match(/study\/([A-Za-z0-9]{8})/)?.[1] ?? a);
if (!ids.length) { console.error('usage: studies:import <urlOrId...> [--compare=<openingId>]'); process.exit(2); }
const out = (id, ext, data) => fs.writeFileSync(path.join(root, '.cache/studies', `${id}.${ext}.json`), JSON.stringify(data, null, 1));
const opening = cmp && JSON.parse(fs.readFileSync(path.join(root, 'src/data/openings', `${cmp}.json`), 'utf8'));

for (const id of ids) {
  const pgn = await cachedText('studies', `${id}.pgn`, () => politeFetch(`https://lichess.org/api/study/${id}.pgn`));
  const games = parsePgn(pgn);
  const allMoves = [];
  const chapters = games.map((g) => {
    const annotated = [];
    const lines = walkGame(g, (m) => {
      allMoves.push(m);
      if (m.comment || m.nags.length || m.arrows.length) annotated.push({ fenBefore: m.fenBefore, san: m.san, nags: m.nags, arrows: m.arrows, comment: m.comment });
    });
    return { name: g.headers.ChapterName ?? g.headers.Event, annotator: g.headers.Annotator ?? null, orientation: g.headers.Orientation ?? 'white', lines, annotated };
  });
  const annotator = chapters.find((c) => c.annotator)?.annotator ?? '';
  const user = annotator.match(/@\/([\w-]+)/)?.[1] ?? annotator.trim();
  let title = null;
  if (user) title = (await cachedJson('studies', `user-${user}.json`, async () => JSON.parse(await politeFetch(`https://lichess.org/api/user/${user}`)))).title ?? null;
  out(id, 'notes', { studyName: games[0]?.headers.StudyName ?? games[0]?.headers.Event ?? id, annotator: user, annotatorTitle: title, chapters });
  console.log(`${id}: ${chapters.length} chapters, ${allMoves.length} moves, annotator ${user || '?'} title ${title ?? 'none'}`);
  if (opening) {
    const d = compare(opening, allMoves);
    out(id, 'divergence', d);
    console.log(`  agree ${d.counts.agree}, player divergences ${d.counts.diverge}, opponent moves not in repertoire ${d.counts.opponentMissing}, positions matched ${d.counts.matched}`);
    d.diverge.slice(0, 10).forEach((x) => console.log(`  ${x.fen.slice(0, 20)} | studio: ${x.studySan} | noi: ${x.ourSan}${x.loss != null ? ` (loss ${x.loss})` : ''}`));
  }
}
