import crypto from 'node:crypto';
import { Chess } from 'chess.js';

const r2 = (x) => Math.round(Math.abs(x) * 100) / 100;
const r1 = (x) => Math.round(x * 10) / 10;

/** Replay sans from fen; throws if any is illegal. Returns the SANs as played. */
export function assertLegal(fen, sans, what) {
  const ch = new Chess(fen);
  for (const san of sans) {
    try { ch.move(san); } catch { throw new Error(`ILLEGAL SAN "${san}" in ${what} at ${fen}`); }
  }
}

/** Fact sheet for one variation: one entry per player-turn node. Pure; throws on illegal SAN. */
export function buildFacts(opening, variationId, warn = () => {}) {
  const nodes = Object.values(opening.positions);
  const byFen = opening.positions;
  const positions = [];
  let noAlt = 0;
  for (const n of nodes.filter((x) => x.variationId === variationId && x.isPlayerTurn && x.playerMove)) {
    const pm = n.playerMove, fen = n.fullFen, where = `${variationId} ${n.pgnPath}`;
    const nums = new Set(), sans = new Set();
    const num = (x) => x != null && nums.add(r2(x));
    const pct = (x) => x != null && nums.add(r1(x));
    const pv = (start, list, label) => { assertLegal(start, list, label); list.forEach((s) => sans.add(s)); };

    const alts = pm.alternatives ?? [];
    if (!alts.length) noAlt++;
    const mine = alts.find((a) => a.san === pm.san);
    const myMove = {
      san: pm.san, evalForMe: pm.engine.evalFromPlayerPerspective, lossVsBest: pm.engine.evalLossVsBest,
      selectionRule: pm.selectionRule ?? null, gmPct: mine?.gmPct ?? null, bandPct: mine?.bandPct ?? null,
    };
    pv(fen, [pm.san], `${where} myMove`);
    num(myMove.evalForMe); num(myMove.lossVsBest); pct(myMove.gmPct); pct(myMove.bandPct);

    const alternatives = alts.map((a) => ({
      san: a.san, evalForMe: a.evalFromPlayerPerspective, lossVsBest: a.evalLossVsBest, pvSan: a.pvSan, gmPct: a.gmPct ?? null, bandPct: a.bandPct ?? null,
    }));
    for (const a of alternatives) {
      pv(fen, a.pvSan.length ? a.pvSan : [a.san], `${where} alt ${a.san}`);
      sans.add(a.san); num(a.evalForMe); num(a.lossVsBest); pct(a.gmPct); pct(a.bandPct);
    }

    const opp = byFen[pm.nextNormalizedFen];
    const opponentReplies = (opp?.opponentMoves ?? []).map((m) => ({ san: m.san, freqPct: m.frequencyPct }));
    for (const m of opponentReplies) { pv(pm.nextFullFen, [m.san], `${where} reply`); pct(m.freqPct); }
    const opponentMistakes = (opp?.commonMistakes ?? []).map((m) => ({
      san: m.opponentMoveSan, freqPct: m.frequencyPct, evalLoss: m.evalLoss, severity: m.severity,
      punishSan: m.punishMoveSan, pvSan: m.pvSan, finalEvalForMe: m.finalEvalForPlayer,
    }));
    for (const m of opponentMistakes) {
      pv(pm.nextFullFen, [m.san], `${where} mistake`);
      const after = opp.commonMistakes.find((c) => c.opponentMoveSan === m.san).afterMistakeFullFen;
      pv(after, m.pvSan.length ? m.pvSan : [m.punishSan], `${where} punish ${m.san}`);
      sans.add(m.punishSan); pct(m.freqPct); num(m.evalLoss); num(m.finalEvalForMe);
    }
    positions.push({
      normalizedFen: n.normalizedFen, fullFen: fen, moveSequenceSan: n.moveSequenceSan, ply: n.ply,
      myMove, alternatives, opponentReplies, opponentMistakes,
      allowedSan: [...sans], allowedNumbers: [...nums].sort((a, b) => a - b),
    });
  }
  if (noAlt) warn(`${variationId}: ${noAlt}/${positions.length} positions without playerMove.alternatives`);
  const factsHash = crypto.createHash('sha256').update(JSON.stringify(positions)).digest('hex');
  return {
    openingId: opening.id, variationId,
    engine: { package: opening.buildConfig.stockfishPackage, depth: opening.buildConfig.stockfishDepth },
    ratingBand: opening.ratingBand.label, factsHash, positions, _noAlt: noAlt,
  };
}
