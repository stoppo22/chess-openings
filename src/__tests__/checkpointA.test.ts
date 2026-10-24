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
      includePunish: true,
      now,
    });
    const newInQueue = queue.filter((c) => c.state === State.New);
    const punishInNew = newInQueue.filter((c) => c.cardType === 'punish');
    expect(newInQueue.length).toBeLessThanOrEqual(10);
    expect(punishInNew.length).toBeLessThanOrEqual(3);

    const queueNoPunish = buildDailyReviewQueue({
      cards: allCards,
      logs: [],
      openingId: 'caro-kann',
      includePunish: false,
      now,
    });
    expect(queueNoPunish.every((c) => c.cardType !== 'punish')).toBe(true);
  });
});

describe('Caro-Kann Repertoire JSON Integrity (Checkpoint A + B)', () => {
  it('respects MAX_POSITIONS_CAP <= 600 and uses rating band 0-1400', () => {
    const nodes = Object.values(caroKann.positions);
    expect(nodes.length).toBeGreaterThan(20);
    expect(nodes.length).toBeLessThanOrEqual(600);
    expect(caroKann.buildConfig.ratingBandLabel).toBe('0-1400');
  });

  it('has strictly 1 legal playerMove on every player-turn node and legal opponentMoves + commonMistakes on opponent-turn nodes', () => {
    let totalCommonMistakes = 0;

    for (const node of Object.values(caroKann.positions)) {
      expect(normalizeFen(node.fullFen)).toBe(node.normalizedFen);

      if (node.isPlayerTurn) {
        expect(node.playerMove).toBeDefined();
        expect(node.opponentMoves).toBeUndefined();
        const chess = new Chess(node.fullFen);
        const move = chess.move(node.playerMove!.san);
        expect(move).not.toBeNull();
        expect(normalizeFen(chess.fen())).toBe(node.playerMove!.nextNormalizedFen);
        expect(node.playerMove!.engine.evalLossVsBest).toBeLessThanOrEqual(0.5);
        expect(node.playerMove!.engine.evalLossVsBest).toBeGreaterThanOrEqual(0);
      } else {
        expect(node.playerMove).toBeUndefined();
        expect(Array.isArray(node.opponentMoves)).toBe(true);
        for (const opp of node.opponentMoves || []) {
          const chess = new Chess(node.fullFen);
          const move = chess.move(opp.san);
          expect(move).not.toBeNull();
          expect(opp.frequencyPct).toBeGreaterThanOrEqual(2.0);
        }

        const mistakes = node.commonMistakes || [];
        expect(mistakes.length).toBeLessThanOrEqual(3);
        totalCommonMistakes += mistakes.length;

        for (let i = 0; i < mistakes.length; i++) {
          const m = mistakes[i];
          expect(m.frequencyPct).toBeGreaterThanOrEqual(5.0);
          expect(m.evalLoss).toBeGreaterThanOrEqual(0.4);
          expect(m.depth).toBe(20);
          expect(m.pvSan.length).toBeGreaterThanOrEqual(1);
          expect(m.pvSan.length).toBeLessThanOrEqual(6);

          const chessBefore = new Chess(node.fullFen);
          const oppMove = chessBefore.move(m.opponentMoveSan);
          expect(oppMove).not.toBeNull();
          expect(normalizeFen(chessBefore.fen())).toBe(m.afterMistakeNormalizedFen);

          const chessAfter = new Chess(m.afterMistakeFullFen);
          const punishMove = chessAfter.move(m.punishMoveSan);
          expect(punishMove).not.toBeNull();

          if (i > 0) {
            expect(mistakes[i - 1].impactScore).toBeGreaterThanOrEqual(m.impactScore);
          }
        }
      }
    }

    if (caroKann.checkpoint === 'B') {
      expect(totalCommonMistakes).toBeGreaterThan(0);
    }
  });
});
