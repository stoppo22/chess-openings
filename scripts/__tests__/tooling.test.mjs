import { describe, it, expect } from 'vitest';
import { parsePgn, walkGame } from '../lib/pgn.mjs';
import { verifyLessons, verifyConcept } from '../lib/verify.mjs';
import { Chess } from 'chess.js';
import { buildFacts, assertLegal, buildBoardFacts } from '../facts/facts-lib.mjs';

describe('pgn', () => {
  const g = parsePgn(`[Event "x"]
[Orientation "black"]

1. e4 { [%cal Gc7c6,Rd7d5] [%csl Ge4] Il centro. } c6! $14 (1... e5 2. Nf3 {ok}) 2. d4 d5 *`)[0];
  it('parses headers, comments, arrows, NAGs, variations', () => {
    expect(g.headers.Orientation).toBe('black');
    expect(g.moves.map((m) => m.san)).toEqual(['e4', 'c6', 'd4', 'd5']);
    expect(g.moves[0].comment).toBe('Il centro.');
    expect(g.moves[0].arrows).toEqual([
      { color: 'G', from: 'c7', to: 'c6' }, { color: 'R', from: 'd7', to: 'd5' }, { color: 'G', from: 'e4', to: 'e4' }]);
    expect(g.moves[1].nags).toEqual([1, 14]);
    expect(g.moves[1].variations[0].map((m) => m.san)).toEqual(['e5', 'Nf3']);
  });
  it('walks with legality + lines', () => {
    const lines = walkGame(g);
    expect(lines).toHaveLength(2);
    expect(lines[1].movesSan).toEqual(['e4', 'c6', 'd4', 'd5']);
  });
  it('rejects illegal moves', () => {
    expect(() => walkGame(parsePgn('1. e4 e4 *')[0])).toThrow(/illegal/);
  });
});

const FEN = 'rnbqkbnr/pp1ppppp/2p5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq -';
const facts = {
  factsHash: 'h1', positions: [{
    normalizedFen: FEN, allowedSan: ['d4', 'Nc3', 'Bc4'], allowedNumbers: [0.3, 11.9],
    myMove: { san: 'd4' }, alternatives: [{ san: 'Nc3' }], opponentMistakes: [{ san: 'Bc4', punishSan: 'd5' }],
  }],
};
const concept = { approved: true, principles: [{ id: 'p1' }, { id: 'p2' }], sources: [], summary: 'Gioco [[d4]] al centro.' };
const lesson = (over = {}) => ({ factsHash: 'h1', lessons: [{ normalizedFen: FEN, why: 'Con [[d4]] (+0,3) prendo spazio, 12% dei casi.', conceptRefs: ['p1'], ...over }] });
const fails = (l, c = concept) => verifyLessons(l, c, facts).map((x) => x.reason).join('|');

describe('verifier', () => {
  it('accepts a good lesson', () => {
    expect(verifyLessons(lesson({ whyNot: { san: 'Nc3', text: 'meno forte' }, opponentMistake: { san: 'Bc4', punishSan: 'd5', text: 'x' } }), concept, facts)).toEqual([]);
    expect(verifyConcept(concept, { positions: facts.positions })).toEqual([]);
  });
  it('rejects unknown SAN', () => expect(fails(lesson({ why: 'Gioco [[Nf6]]' }))).toMatch(/SAN \[\[Nf6\]\]/));
  it('rejects bare move', () => expect(fails(lesson({ why: 'Gioco Nf6 subito' }))).toMatch(/bare move/));
  it('rejects invented eval', () => expect(fails(lesson({ why: 'vale +1.7' }))).toMatch(/number \+1.7/));
  it('rejects stale hash', () => expect(fails({ ...lesson(), factsHash: 'old' })).toMatch(/stale/));
  it('rejects unapproved concept', () => expect(fails(lesson(), { ...concept, approved: false })).toMatch(/not approved/));
  it('checks refs, whyNot, quiz', () => {
    const r = fails(lesson({ conceptRefs: ['zz'], whyNot: { san: 'd4', text: 'a' }, planQuiz: { correct: 'a', distractors: ['b'], distractorPrincipleIds: [] } }));
    expect(r).toMatch(/conceptRef zz/); expect(r).toMatch(/equals my move/); expect(r).toMatch(/length mismatch/);
  });
  it('concept page forbids decimals', () => {
    expect(verifyConcept({ ...concept, summary: 'vale 0.5' }, facts).length).toBe(1);
  });
});

describe('facts legality', () => {
  it('asserts SAN legality', () => {
    expect(() => assertLegal('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', ['e4', 'Qh5'], 't')).toThrow(/ILLEGAL/);
    expect(() => assertLegal('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', ['e4', 'c5'], 't')).not.toThrow();
  });
  it('buildFacts fails on an illegal alternative', () => {
    const start = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const op = (alt) => ({ id: 'o', buildConfig: {}, ratingBand: {}, positions: { a: { variationId: 'v', isPlayerTurn: true, normalizedFen: 'a', fullFen: start, ply: 0, moveSequenceSan: [],
      playerMove: { san: 'e4', nextNormalizedFen: 'b', engine: { evalFromPlayerPerspective: 0, evalLossVsBest: 0 }, alternatives: [alt] } } } });
    const a = { san: 'd4', evalFromPlayerPerspective: 0, evalLossVsBest: 0.1, pvSan: ['d4', 'd5'] };
    expect(buildFacts(op(a), 'v').positions[0].allowedSan).toContain('d4');
    expect(() => buildFacts(op({ ...a, pvSan: ['d4', 'Nf6', 'Nf6'] }), 'v')).toThrow(/ILLEGAL/);
  });
});

describe('boardFacts', () => {
  const play = (sans) => { const c = new Chess(); sans.forEach((s) => c.move(s)); return c; };
  it('knight on g5 does not attack f5', async () => {
    const { Chess: C } = await import('chess.js');
    const ch = new C('4k3/8/8/5bN1/8/8/8/4K3 w - - 0 1');
    const { attacksFrom } = await import('../facts/facts-lib.mjs');
    expect(attacksFrom(ch, 'g5')).not.toContain('f5');
    expect(attacksFrom(ch, 'g5')).toEqual([]);
  });
  it('after Bd3 in the Classical the pawn d4 is undefended and hanging', () => {
    const seq = ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5', 'f3'];
    const bf = buildBoardFacts({
      fullFen: play(seq).fen(), moveSequenceSan: seq, myMoveSan: 'e6',
      mistakes: [{ san: 'Bd3', afterFen: play([...seq, 'e6', 'Bd3']).fen() }],
    });
    expect(bf.s2.Bd3.join('|')).toContain('Pedone bianco d4 (attaccato 1, difeso 0');
    expect(bf.s1.join('|')).toContain('Pedone nero e6 difende: Alfiere f5');
  });
});
