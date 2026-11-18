import type { OpeningRepertoireFile, PositionNode, StoredFSRSCard } from '../types/repertoire';
import { getFenFromSanMoves } from '../services/fen';

function node(moves: string[], isPlayerTurn: boolean, extra: Partial<PositionNode> = {}): PositionNode {
  const { fullFen, normalizedFen } = getFenFromSanMoves(moves);
  return {
    normalizedFen, fullFen, moveNumber: 1, ply: moves.length, turn: isPlayerTurn ? 'w' : 'b', isPlayerTurn,
    pgnPath: moves.join(' '), moveSequenceSan: moves, variationId: 'v', variationName: 'V', reachPct: 100, ...extra,
  };
}

export function fakeOpening(): OpeningRepertoireFile {
  const afterF6 = getFenFromSanMoves(['e4', 'f6']);
  const list = [
    node([], true, { playerMove: { san: 'e4' } as never }),
    node(['e4'], false, {
      reachPct: 50,
      commonMistakes: [{
        opponentMoveSan: 'f6', afterMistakeNormalizedFen: afterF6.normalizedFen, afterMistakeFullFen: afterF6.fullFen,
        frequencyPct: 10, evalLoss: 2, severity: 'mistake', punishMoveSan: 'd4', pvSan: [],
      } as never],
    }),
    node(['e4', 'e5'], true, { reachPct: 40, playerMove: { san: 'Nf3' } as never }),
    node(['e4', 'e5', 'Nf3'], false, { reachPct: 40 }),
  ];
  return {
    id: 'fake', name: 'Fake', playerColor: 'white', rootNormalizedFen: list[0].normalizedFen,
    positions: Object.fromEntries(list.map((n) => [n.normalizedFen, n])),
  } as unknown as OpeningRepertoireFile;
}

export function card(id: string, over: Partial<StoredFSRSCard>): StoredFSRSCard {
  return {
    id, openingId: 'fake', variationId: 'v', cardType: 'repertoire', normalizedFen: id, fullFen: id, pgnPath: '',
    moveSequenceSan: [], correctMoveSan: 'e4', correctMoveUci: '', correctFrom: '', correctTo: '',
    due: new Date(0).toISOString(), stability: 0, difficulty: 0, elapsed_days: 0, scheduled_days: 0, reps: 0, lapses: 0,
    state: 0, ...over,
  };
}
