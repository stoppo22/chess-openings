const MOVE = /\[\[([^\]]+)\]\]/g;
const BARE = /\b[KQRBN][a-h]?[1-8]?x?[a-h][1-8]\b|O-O/;
const PCT = /(\d+(?:[.,]\d+)?)\s*%/g;
const DEC = /[+\-−]?\d+[.,]\d+/g;

export const cleanSan = (s) => s.trim().replace(/^(\d+\.+|\.{2,3}|…)\s*/, '').replace(/[+#!?]+$/, '');
const num = (s) => parseFloat(s.replace(',', '.').replace('−', '-'));

/** Problems in one text; allowedSan/allowedNumbers are Sets/arrays (null allowedSan = skip SAN membership). */
export function checkText(text, allowedSan, allowedNumbers, { decimals = true } = {}) {
  const errs = [];
  for (const [, raw] of text.matchAll(MOVE)) {
    const s = cleanSan(raw);
    if (allowedSan && !allowedSan.has(s)) errs.push(`SAN [[${raw}]] not in facts`);
  }
  const plain = text.replace(MOVE, ' ');
  const bare = plain.match(BARE);
  if (bare) errs.push(`bare move "${bare[0]}" outside [[ ]]`);
  for (const [, p] of plain.matchAll(PCT)) {
    if (!allowedNumbers.some((a) => Math.abs(a - num(p)) <= 1)) errs.push(`pct ${p}% not in facts`);
  }
  const noPct = plain.replace(PCT, ' ');
  for (const [d] of noPct.matchAll(DEC)) {
    if (!decimals) errs.push(`decimal number ${d} not allowed in concept page`);
    else if (!allowedNumbers.some((a) => Math.abs(a - Math.abs(num(d))) <= 0.05)) errs.push(`number ${d} not in facts`);
  }
  return errs;
}

const strings = (v, skip = []) =>
  typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap((x) => strings(x, skip))
  : v && typeof v === 'object' ? Object.entries(v).filter(([k]) => !skip.includes(k)).flatMap(([, x]) => strings(x, skip)) : [];

/** Returns [{fen, reason}] */
export function verifyConcept(concept, facts) {
  const out = [];
  const bad = (reason) => out.push({ fen: '-', reason });
  if (concept.approved !== true) bad('concept page not approved');
  const allowed = new Set(facts.positions.flatMap((p) => p.allowedSan.map(cleanSan)));
  for (const t of strings(concept, ['sources', 'id'])) checkText(t, allowed, [], { decimals: false }).forEach(bad);
  const ids = (concept.principles ?? []).map((p) => p.id);
  if (new Set(ids).size !== ids.length) bad('duplicate principle ids');
  (concept.sources ?? []).forEach((s, i) => {
    if (!/^https:\/\//.test(s.url ?? '')) bad(`source ${i} missing https url`);
    if (!s.authorTitle) bad(`source ${i} missing authorTitle`);
    if (!s.verifiedOn) bad(`source ${i} missing verifiedOn`);
  });
  return out;
}

export function verifyLessons(lessonFile, concept, facts) {
  const out = [];
  if (!concept || concept.approved !== true) return [{ fen: '-', reason: 'concept page missing or not approved' }];
  if (lessonFile.factsHash !== facts.factsHash) out.push({ fen: '-', reason: 'stale: factsHash differs from current facts' });
  const principleIds = new Set((concept.principles ?? []).map((p) => p.id));
  const byFen = new Map(facts.positions.map((p) => [p.normalizedFen, p]));
  for (const l of lessonFile.lessons) {
    const fen = (l.normalizedFen ?? '').slice(0, 20);
    const bad = (reason) => out.push({ fen, reason });
    const pos = byFen.get(l.normalizedFen);
    if (!pos) { bad('fen not in facts'); continue; }
    const allowed = new Set(pos.allowedSan.map(cleanSan));
    const texts = [l.why, l.whyNot?.text, l.opponentMistake?.text, l.planQuiz?.correct, ...(l.planQuiz?.distractors ?? [])].filter(Boolean);
    for (const t of texts) checkText(t, allowed, pos.allowedNumbers).forEach(bad);
    if (l.whyNot) {
      const s = cleanSan(l.whyNot.san);
      if (!pos.alternatives.some((a) => a.san === s)) bad(`whyNot.san ${s} not in alternatives`);
      if (s === pos.myMove.san) bad('whyNot.san equals my move');
    }
    if (l.opponentMistake) {
      const m = pos.opponentMistakes.find((x) => x.san === cleanSan(l.opponentMistake.san));
      if (!m) bad(`opponentMistake.san ${l.opponentMistake.san} not in opponentMistakes`);
      else if (m.punishSan !== cleanSan(l.opponentMistake.punishSan)) bad(`punishSan ${l.opponentMistake.punishSan} != ${m.punishSan}`);
    }
    for (const r of l.conceptRefs ?? []) if (!principleIds.has(r)) bad(`conceptRef ${r} not in concept page`);
    const q = l.planQuiz;
    if (q) {
      if ((q.distractorPrincipleIds ?? []).length !== q.distractors.length) bad('planQuiz distractorPrincipleIds length mismatch');
      for (const r of q.distractorPrincipleIds ?? []) if (!principleIds.has(r)) bad(`distractorPrincipleId ${r} not in concept page`);
    }
  }
  return out;
}
