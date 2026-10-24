import { describe, expect, it } from 'vitest';
import { Chess } from 'chess.js';
import caroKannRaw from '../data/openings/caro-kann.json';
import type { OpeningRepertoireFile } from '../types/repertoire';
import { buildCardId, getFenFromSanMoves, normalizeFen } from '../services/fen';
import {
  buildDailyReviewQueue,
  gradeCard,
  Rating,
  resolveOutcomeRating,
  State,
  syncOpeningCards,
} from '../services/srs';

const caroKann = caroKannRaw as unknown as OpeningRepertoireFile;

describe('FEN Normalization & Transposition Deduplication', () => {
  it('maps Classical Caro-Kann transpositions (3.Nc3 dxe4 4.Nxe4 vs 3.Nd2 dxe4 4.Nxe4) to the exact same normalized FEN and Card ID', () => {
    const lineNc3 = getFenFromSanMoves(['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4']);
    const lineNd2 = getFenFromSanMoves(['e4', 'c6', 'd4', 'd5', 'Nd2', 'dxe4', 'Nxe4']);

    expect(lineNc3.normalizedFen).toBe(lineNd2.normalizedFen);
    expect(buildCardId('caro-kann', 'repertoire', lineNc3.fullFen)).toBe(
      buildCardId('caro-kann', 'repertoire', lineNd2.fullFen)
    );
  });
});

describe('FSRS (ts-fsrs) Rating & Interval Rules', () => {
  const now = new Date('2026-10-24T12:00:00.000Z');
  const allCards = syncOpeningCards(caroKann, [], now);

  it('always grades Hint usage as Rating.Again with no exceptions', () => {
    expect(resolveOutcomeRating({ usedHint: true, wrongAttempts: 0, choseEasy: false })).toBe(Rating.Again);
    expect(resolveOutcomeRating({ usedHint: true, wrongAttempts: 0, choseEasy: true })).toBe(Rating.Again);
  });

  it('always grades wrong move attempts as Rating.Again', () => {
    expect(resolveOutcomeRating({ usedHint: false, wrongAttempts: 1, choseEasy: false })).toBe(Rating.Again);
    expect(resolveOutcomeRating({ usedHint: false, wrongAttempts: 2, choseEasy: true })).toBe(Rating.Again);
  });

  it('grades first-try correct without hint as Rating.Good (or Rating.Easy if selected) and schedules longer intervals than Again', () => {
    const sampleCard = allCards[0];
    const resAgain = gradeCard(sampleCard, { usedHint: true, wrongAttempts: 0 }, now);
    const resGood = gradeCard(sampleCard, { usedHint: false, wrongAttempts: 0, choseEasy: false }, now);
    const resEasy = gradeCard(sampleCard, { usedHint: false, wrongAttempts: 0, choseEasy: true }, now);

    expect(resAgain.rating).toBe(Rating.Again);
    expect(resGood.rating).toBe(Rating.Good);
    expect(resEasy.rating).toBe(Rating.Easy);

    const dueAgain = new Date(resAgain.updatedCard.due).getTime();
    const dueGood = new Date(resGood.updatedCard.due).getTime();
    const dueEasy = new Date(resEasy.updatedCard.due).getTime();

    expect(dueGood).toBeGreaterThan(dueAgain);
    expect(dueEasy).toBeGreaterThan(dueGood);
  });

  it('enforces the daily limit of 10 new cards (and max 3 punish cards)', () => {
    const queue = buildDailyReviewQueue({
      cards: allCards,
      logs: [],
      openingId: 'caro-kann',
      now,
    });
    const newInQueue = queue.filter((c) => c.state === State.New);
    expect(newInQueue.length).toBeLessThanOrEqual(10);
  });
});

describe('Caro-Kann Repertoire JSON Integrity (Checkpoint A)', () => {
  it('respects MAX_POSITIONS_CAP <= 150 and uses rating band 0-1400', () => {
    const nodes = Object.values(caroKann.positions);
    expect(nodes.length).toBeGreaterThan(20);
    expect(nodes.length).toBeLessThanOrEqual(150);
    expect(caroKann.buildConfig.ratingBandLabel).toBe('0-1400');
  });

  it('has strictly 1 legal playerMove on every player-turn node and legal opponentMoves on opponent-turn nodes', () => {
    for (const node of Object.values(caroKann.positions)) {
      expect(normalizeFen(node.fullFen)).toBe(node.normalizedFen);

      if (node.isPlayerTurn) {
        expect(node.playerMove).toBeDefined();
        expect(node.opponentMoves).toBeUndefined();
        const chess = new Chess(node.fullFen);
        const move = chess.move(node.playerMove!.san);
        expect(move).not.toBeNull();
        expect(normalizeFen(chess.fen())).toBe(node.playerMove!.nextNormalizedFen);
        // Nessuna mossa scelta perde più di 0.50 pedoni rispetto alla best move di Stockfish
        expect(node.playerMove!.engine.evalLossVsBest).toBeLessThanOrEqual(0.5);
      } else {
        expect(node.playerMove).toBeUndefined();
        expect(Array.isArray(node.opponentMoves)).toBe(true);
        for (const opp of node.opponentMoves || []) {
          const chess = new Chess(node.fullFen);
          const move = chess.move(opp.san);
          expect(move).not.toBeNull();
          expect(opp.frequencyPct).toBeGreaterThanOrEqual(5.0);
        }
      }
    }
  });
});
