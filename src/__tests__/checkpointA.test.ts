import { describe, expect, it } from 'vitest';
import { Chess } from 'chess.js';
import caroKannRaw from '../data/openings/caro-kann.json';
import type { OpeningRepertoireFile } from '../types/repertoire';
import { buildCardId, getFenFromSanMoves, normalizeFen } from '../services/fen';
import { buildMiddlegameGuide } from '../services/middlegameIdeas';
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

  it('creates punish cards ONLY for mistakes with evalLoss >= 1.0 (mistake and blunder, never inaccuracy)', () => {
    const punishCards = allCards.filter((c) => c.cardType === 'punish');
    expect(punishCards.length).toBeGreaterThan(0);
    for (const pc of punishCards) {
      expect(pc.mistakeContext).toBeDefined();
      expect(pc.mistakeContext!.evalLoss).toBeGreaterThanOrEqual(1.0);
      expect(['mistake', 'blunder']).toContain(pc.mistakeContext!.severity);
    }
  });

  it('orders new cards by descending reach (repertoire) and reach * freq * loss (punish) while respecting daily limit of 10 (max 3 punish)', () => {
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
    for (let i = 1; i < queueNoPunish.length; i++) {
      expect(queueNoPunish[i - 1].priorityScore ?? 0).toBeGreaterThanOrEqual(
        queueNoPunish[i].priorityScore ?? 0
      );
    }

    const punishOnlyCards = allCards.filter((c) => c.cardType === 'punish');
    const punishQueue = buildDailyReviewQueue({
      cards: punishOnlyCards,
      logs: [],
      openingId: 'caro-kann',
      includePunish: true,
      maxNewPerDay: 10,
      maxNewPunishPerDay: 10,
      now,
    });
    for (let i = 1; i < punishQueue.length; i++) {
      expect(punishQueue[i - 1].priorityScore ?? 0).toBeGreaterThanOrEqual(
        punishQueue[i].priorityScore ?? 0
      );
    }
  });

  it('cleanly removes orphaned cards and resets cards whose repertoire move changed during migration', () => {
    const orphanCard = {
      ...allCards[0],
      id: 'caro-kann:repertoire:8/8/8/8/8/8/8/8 b - -',
      normalizedFen: '8/8/8/8/8/8/8/8 b - -',
      state: State.Review,
      reps: 5,
    };
    const changedMoveCard = {
      ...allCards[0],
      correctMoveSan: 'a6',
      state: State.Review,
      reps: 4,
    };

    const migrated = syncOpeningCards(caroKann, [orphanCard, changedMoveCard], now);
    expect(migrated.some((c) => c.id === orphanCard.id)).toBe(false);

    const updatedFirst = migrated.find((c) => c.id === allCards[0].id);
    expect(updatedFirst).toBeDefined();
    expect(updatedFirst!.correctMoveSan).toBe(allCards[0].correctMoveSan);
    expect(updatedFirst!.state).toBe(State.New);
    expect(updatedFirst!.reps).toBe(0);
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

  it('builds verified middlegame continuations and strategic ideas with arrows for every leaf node', () => {
    const leaves = Object.values(caroKann.positions).filter(
      (n) => !n.isPlayerTurn && (!n.opponentMoves || n.opponentMoves.length === 0)
    );
    expect(leaves.length).toBeGreaterThan(0);

    for (const leaf of leaves) {
      const guide = buildMiddlegameGuide(caroKann, leaf);
      expect(guide.continuationSteps.length).toBeGreaterThan(0);
      expect(guide.ideas.length).toBeGreaterThanOrEqual(2);
      for (const idea of guide.ideas) {
        expect(idea.arrows.length).toBeGreaterThan(0);
        for (const [from, to] of idea.arrows) {
          expect(from).toMatch(/^[a-h][1-8]$/);
          expect(to).toMatch(/^[a-h][1-8]$/);
        }
      }
    }
  });
});
