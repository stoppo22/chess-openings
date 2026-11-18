import { describe, expect, it } from 'vitest';
import type { PositionNode } from '../types/repertoire';
import { formatMoveLabel } from '../services/fen';
import {
  analyzeWrongPlayerMove,
  computeMaterialDiffForPlayer,
  nodeMoveLabel,
} from '../services/moveAnalyzer';

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

function whiteNode(alternatives?: unknown): PositionNode {
  return {
    normalizedFen: 'x',
    fullFen: START,
    moveNumber: 1,
    ply: 0,
    turn: 'w',
    isPlayerTurn: true,
    pgnPath: '',
    moveSequenceSan: [],
    variationId: 'v',
    variationName: 'v',
    playerMove: {
      san: 'd4',
      uci: 'd2d4',
      alternatives,
      engine: { evalFromPlayerPerspective: 0.3 },
    },
  } as unknown as PositionNode;
}

const alts = [
  { san: 'd4', uci: 'd2d4', evalFromPlayerPerspective: 0.3, evalLossVsBest: 0, depth: 18, pvSan: ['d4', 'd5'] },
  { san: 'a3', uci: 'a2a3', evalFromPlayerPerspective: -0.1, evalLossVsBest: 0.4, depth: 18, pvSan: ['a3', 'e5', 'Nf3'] },
];

describe('analyzeWrongPlayerMove', () => {
  it('uses real engine numbers when the wrong move is in alternatives (SAN match)', () => {
    const r = analyzeWrongPlayerMove(whiteNode(alts), 'a3');
    expect(r.evalForPlayer).toBe(-0.1);
    expect(r.evalDrop).toBeCloseTo(-0.4);
    expect(r.explanation).toContain('il motore risponde con e5');
  });

  it('matches by UCI too (different SAN spelling is irrelevant)', () => {
    const r = analyzeWrongPlayerMove(whiteNode([{ ...alts[1], san: 'a2-a3' }]), 'a3');
    expect(r.evalForPlayer).toBe(-0.1);
  });

  it('explains repertoire choice when the wrong move is as good as the best', () => {
    const equal = [
      { ...alts[0], gmPct: 77.6 },
      { san: 'e4', uci: 'e2e4', evalFromPlayerPerspective: 0.3, evalLossVsBest: 0, depth: 18, pvSan: ['e4'], gmPct: 21 },
    ];
    const r = analyzeWrongPlayerMove(whiteNode(equal), 'e4');
    expect(r.explanation).toContain('buona quanto');
    expect(r.explanation).toContain('77.6%');
    expect(r.evalDrop).toBe(-0);
  });

  it('gives no number when the move is not among alternatives', () => {
    const r = analyzeWrongPlayerMove(whiteNode(alts), 'h4');
    expect(r.evalForPlayer).toBeNull();
    expect(r.evalDrop).toBeNull();
    expect(r.explanation).toContain('non è tra le 2 migliori del motore');
    expect(r.explanation).toContain('d4');
    expect(r.explanation).not.toMatch(/\d\.\d/);
  });

  it('gives no number when alternatives are missing', () => {
    const r = analyzeWrongPlayerMove(whiteNode(undefined), 'h4');
    expect(r.evalForPlayer).toBeNull();
    expect(r.evalDrop).toBeNull();
  });
});

describe('player-perspective helpers (white player)', () => {
  it('formats move labels by colour', () => {
    expect(formatMoveLabel(5, 'w', 'Nf3')).toBe('5.Nf3');
    expect(formatMoveLabel(5, 'b', 'Nf6')).toBe('5...Nf6');
    expect(nodeMoveLabel(whiteNode(), 'd4')).toBe('1.d4');
  });

  it('computes material from the player colour', () => {
    const noWhiteQueen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNB1KBNR w KQkq - 0 1';
    expect(computeMaterialDiffForPlayer(noWhiteQueen, 'white')).toBe(-9);
    expect(computeMaterialDiffForPlayer(noWhiteQueen, 'black')).toBe(9);
  });
});
