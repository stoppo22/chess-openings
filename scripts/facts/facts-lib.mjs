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

// ---- Board facts (deterministic, chess.js): compact Italian lines used to check lesson claims ----
const VAL = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };
const NAME = { p: 'Pedone', n: 'Cavallo', b: 'Alfiere', r: 'Torre', q: 'Donna', k: 'Re' };
const COL = { w: 'bianco', b: 'nero' };
const FILES = 'abcdefgh';
const SQS = [...Array(64)].map((_, i) => FILES[i % 8] + (8 - Math.floor(i / 8)));
const pn = (p, sq) => `${NAME[p.type]} ${COL[p.color]} ${sq}`;
const opp = (c) => (c === 'w' ? 'b' : 'w');
const occupied = (ch) => SQS.map((sq) => ({ sq, p: ch.get(sq) })).filter((x) => x.p);
/** Squares of pieces of `color` attacking/defending `sq` (ignores pins). */
export const attackersOf = (ch, sq, color) => ch.attackers(sq, color);
/** Squares occupied by a piece (any color) that the piece on `from` attacks. */
export function attacksFrom(ch, from) {
  const c = ch.get(from).color;
  return occupied(ch).filter((x) => attackersOf(ch, x.sq, c).includes(from)).map((x) => x.sq);
}
/** Piece on sq is hanging: attacked and (undefended or attacked by a cheaper piece). King excluded. */
export function isHanging(ch, sq) {
  const p = ch.get(sq);
  if (!p || p.type === 'k') return false;
  const att = attackersOf(ch, sq, opp(p.color));
  if (!att.length) return false;
  return !attackersOf(ch, sq, p.color).length || Math.min(...att.map((a) => VAL[ch.get(a).type])) < VAL[p.type];
}
const cnt = (ch, sq) => {
  const p = ch.get(sq);
  return `attaccato ${attackersOf(ch, sq, opp(p.color)).length}, difeso ${attackersOf(ch, sq, p.color).length}`;
};
const RAYS = { b: [[1, 1], [1, -1], [-1, 1], [-1, -1]], r: [[1, 0], [-1, 0], [0, 1], [0, -1]] };
RAYS.q = [...RAYS.b, ...RAYS.r];
/** First piece seen along each ray of a sliding piece: [{sq,p}]. */
export function sees(ch, from) {
  const pc = ch.get(from); const out = [];
  for (const [df, dr] of RAYS[pc.type] ?? []) {
    let f = FILES.indexOf(from[0]) + df, r = +from[1] + dr;
    while (f >= 0 && f < 8 && r >= 1 && r <= 8) {
      const sq = FILES[f] + r, q = ch.get(sq);
      if (q) { out.push({ sq, p: q }); break; }
      f += df; r += dr;
    }
  }
  return out;
}
/** Pins made by the sliding piece on `from`: enemy piece in front of a more valuable enemy piece (or the king). */
export function pinsFrom(ch, from) {
  const pc = ch.get(from); const out = [];
  for (const [df, dr] of RAYS[pc.type] ?? []) {
    let f = FILES.indexOf(from[0]) + df, r = +from[1] + dr; const hit = [];
    while (f >= 0 && f < 8 && r >= 1 && r <= 8 && hit.length < 2) {
      const sq = FILES[f] + r, q = ch.get(sq);
      if (q) hit.push({ sq, p: q });
      f += df; r += dr;
    }
    const [a, b] = hit;
    if (!(a && b && a.p.color !== pc.color && b.p.color !== pc.color && a.p.type !== 'k')) continue;
    // Absolute pins (king behind) always count; relative ones only for a piece in front of a queen or rook.
    if (b.p.type === 'k' || ('qr'.includes(b.p.type) && a.p.type !== 'p' && VAL[b.p.type] > VAL[a.p.type]))
      out.push({ pinned: a, behind: b, absolute: b.p.type === 'k' });
  }
  return out;
}
/** Fork: the piece on `from` attacks two or more enemy targets that matter (king, or worth ≥ its own value, or undefended). */
export function forkTargets(ch, from) {
  const pc = ch.get(from);
  const t = attackedBy(ch, from).filter((s) => {
    const q = ch.get(s);
    return q.type === 'k' || VAL[q.type] > VAL[pc.type] || (VAL[q.type] >= 3 && !attackersOf(ch, s, q.color).length);
  });
  return t.length >= 2 ? t : [];
}
const hangingLines = (ch) => occupied(ch).filter((x) => isHanging(ch, x.sq)).map((x) => {
  const cheap = Math.min(...attackersOf(ch, x.sq, opp(x.p.color)).map((a) => VAL[ch.get(a).type])) < VAL[x.p.type];
  // 'in presa' in Italian means capturable for free: use it only for undefended pieces.
  return cheap && attackersOf(ch, x.sq, x.p.color).length > 0
    ? `minacciato da un pezzo di minor valore (deve spostarsi o va difeso meglio): ${pn(x.p, x.sq)} (${cnt(ch, x.sq)})`
    : `in presa (senza difesa sufficiente): ${pn(x.p, x.sq)} (${cnt(ch, x.sq)})`;
});
const attackedBy = (ch, sq) => attacksFrom(ch, sq).filter((t) => ch.get(t).color !== ch.get(sq).color);

/** Facts about one position (fen), optionally centred on the piece that just moved to `sq`. */
export function boardFactLines(fen, sq, { slidersToo = true } = {}) {
  const ch = new Chess(fen); const L = [];
  if (sq && ch.get(sq)) {
    const p = ch.get(sq);
    const hit = attackedBy(ch, sq).map((t) => `${pn(ch.get(t), t)} (${cnt(ch, t)})`);
    L.push(`${pn(p, sq)} attacca: ${hit.join('; ') || 'nessun pezzo'}`);
    const def = attacksFrom(ch, sq).filter((t) => ch.get(t).color === p.color).map((t) => `${NAME[ch.get(t).type]} ${t}`);
    if (def.length) L.push(`${pn(p, sq)} difende: ${def.join(', ')}`);
    if (slidersToo && RAYS[p.type]) L.push(`${pn(p, sq)} vede: ${sees(ch, sq).map((x) => `${x.sq} (${x.p.color === p.color ? 'suo ' : ''}${NAME[x.p.type]})`).join(', ') || 'niente'}`);
    for (const pin of pinsFrom(ch, sq))
      L.push(`${pn(p, sq)} inchioda: ${pn(pin.pinned.p, pin.pinned.sq)} contro ${NAME[pin.behind.p.type]} ${pin.behind.sq} (${pin.absolute ? 'inchiodatura assoluta: non può muoversi' : 'inchiodatura relativa: se si muove, perde il pezzo dietro'})`);
    const fork = forkTargets(ch, sq);
    if (fork.length) L.push(`Forchetta: ${pn(p, sq)} attacca insieme ${fork.map((t) => `${NAME[ch.get(t).type]} ${t}`).join(', ')}`);
  }
  if (ch.inCheck()) L.push(`Scacco al Re ${COL[ch.turn()]}`);
  L.push(...hangingLines(ch));
  return L;
}

/** boardFacts for one fact-sheet position: s0 (before my move), s1 (after), s2 per opponent mistake. */
export function buildBoardFacts({ fullFen, moveSequenceSan, myMoveSan, mistakes = [] }) {
  const me = fullFen.split(' ')[1];
  const lines = (a, cap = 15) => (a.length > cap ? [...a.slice(0, cap - 1), `(+${a.length - cap + 1} altre righe omesse)`] : a);
  // S0: replay to find the opponent's last move
  const rp = new Chess(); let last = null;
  for (const s of moveSequenceSan) last = rp.move(s);
  const s0 = [];
  if (last) s0.push(`Ultima mossa avversaria: ${last.san}`, ...boardFactLines(fullFen, last.to));
  else s0.push(...boardFactLines(fullFen));
  // S1
  const ch = new Chess(fullFen); const before = new Chess(fullFen);
  const mv = ch.move(myMoveSan);
  const s1 = [`Mia mossa: ${mv.san}`, ...boardFactLines(ch.fen(), mv.to)];
  // discovered attacks: other own pieces newly attacking enemy pieces
  for (const { sq: s, p } of occupied(ch)) {
    if (p.color !== me || s === mv.to || !before.get(s) || before.get(s).type !== p.type) continue;
    const nw = attackedBy(ch, s).filter((t) => !before.get(t) || !attackedBy(before, s).includes(t));
    if (nw.length) s1.push(`Scoperto: ${pn(p, s)} ora attacca ${nw.map((t) => `${NAME[ch.get(t).type]} ${t}`).join(', ')}`);
  }
  if (mv.flags.includes('c') || mv.flags.includes('e')) s1.push(`Cattura: ${mv.captured ? NAME[mv.captured] : 'pedone'} in ${mv.to}`);
  if (mv.flags.includes('k') || mv.flags.includes('q')) s1.push('Arrocco');
  // other own sliders' view if they changed? keep only the moved piece's view (above) to stay compact
  const s2 = {};
  for (const m of mistakes) {
    const c = new Chess(m.afterFen);
    const L = [`Dopo ${m.san}:`, ...boardFactLines(m.afterFen, m.to ?? null, { slidersToo: false }).filter((l) => !l.includes(' attacca:') && !l.includes(' difende:'))];
    const loose = occupied(c).filter((x) => x.p.type !== 'k' && !isHanging(c, x.sq)
      && (attackersOf(c, x.sq, opp(x.p.color)).length || (!'pr'.includes(x.p.type) && !attackersOf(c, x.sq, x.p.color).length)))
      .map((x) => `${pn(x.p, x.sq)}: ${cnt(c, x.sq)}`);
    s2[m.san] = lines([...L, ...loose]);
  }
  return { s0: lines(s0), s1: lines(s1), s2 };
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
    const mk = opp?.commonMistakes ?? [];
    const boardFacts = buildBoardFacts({
      fullFen: fen, moveSequenceSan: n.moveSequenceSan, myMoveSan: pm.san,
      mistakes: opponentMistakes.map((m) => ({ san: m.san, afterFen: mk.find((c) => c.opponentMoveSan === m.san).afterMistakeFullFen })),
    });
    positions.push({
      normalizedFen: n.normalizedFen, fullFen: fen, moveSequenceSan: n.moveSequenceSan, ply: n.ply,
      myMove, alternatives, opponentReplies, opponentMistakes, boardFacts,
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
