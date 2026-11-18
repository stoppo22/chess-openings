import { normFen } from '../lib/pgn.mjs';

/** Compare study moves ({fenBefore, san}) against an opening JSON. Pure. */
export function compare(opening, moves) {
  const seen = new Set();
  const r = { counts: { matched: 0, agree: 0, diverge: 0, opponentMissing: 0 }, diverge: [], opponentMissing: [] };
  for (const m of moves) {
    const fen = normFen(m.fenBefore), node = opening.positions[fen];
    const key = fen + '|' + m.san;
    if (!node || seen.has(key)) continue;
    seen.add(key); r.counts.matched++;
    if (node.isPlayerTurn && node.playerMove) {
      if (node.playerMove.san === m.san) { r.counts.agree++; continue; }
      const alt = node.playerMove.alternatives?.find((a) => a.san === m.san);
      r.counts.diverge++;
      r.diverge.push({ fen, studySan: m.san, ourSan: node.playerMove.san, loss: alt?.evalLossVsBest ?? null, evalForMe: alt?.evalFromPlayerPerspective ?? null });
    } else if (node.opponentMoves) {
      if (node.opponentMoves.some((o) => o.san === m.san)) r.counts.agree++;
      else { r.counts.opponentMissing++; r.opponentMissing.push({ fen, studySan: m.san }); }
    }
  }
  return r;
}
