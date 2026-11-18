import { Chess, type Square } from 'chess.js';
import type { OpeningRepertoireFile, PositionNode } from '../types/repertoire';
import { formatMoveLabel } from './fen';

export interface MiddlegameIdea {
  id: string;
  category: 'Piano del motore';
  title: string;
  movesLabel: string;
  description: string;
  arrows: Array<[Square, Square, string]>;
}

export interface MiddlegameContinuationStep {
  plyOffset: number;
  san: string;
  from: Square;
  to: Square;
  turn: 'w' | 'b';
  moveNumber: number;
  fenAfter: string;
}

export interface MiddlegameGuide {
  continuationSteps: MiddlegameContinuationStep[];
  evalForPlayer: number | null;
  engineDepth: number | null;
  /** Solo il piano del motore (dati Stockfish); le idee tematiche arriveranno dalle pagine concettuali. */
  ideas: MiddlegameIdea[];
}

const COLOR_GREEN = 'rgba(129, 182, 76, 0.88)';
const COLOR_BLUE = 'rgba(54, 146, 231, 0.85)';

export function buildMiddlegameGuide(
  opening: OpeningRepertoireFile,
  leafNode: PositionNode,
  previousNormFen?: string
): MiddlegameGuide {
  let parentNode = previousNormFen ? opening.positions[previousNormFen] : undefined;
  if (!parentNode || !parentNode.playerMove) {
    parentNode = Object.values(opening.positions).find(
      (n) => n.isPlayerTurn && n.playerMove?.nextNormalizedFen === leafNode.normalizedFen
    );
  }

  const continuationSteps: MiddlegameContinuationStep[] = [];
  let evalForPlayer: number | null = null;
  let engineDepth: number | null = null;
  const playerTurn = opening.playerColor === 'white' ? 'w' : 'b';

  if (parentNode?.playerMove?.engine) {
    evalForPlayer = parentNode.playerMove.engine.evalFromPlayerPerspective;
    engineDepth = parentNode.playerMove.engine.depth;
    const rawPv = parentNode.playerMove.engine.pvSan.slice(1);
    const sim = new Chess(leafNode.fullFen);
    for (let i = 0; i < rawPv.length; i++) {
      const turnBefore = sim.turn();
      const moveNum = sim.moveNumber();
      try {
        const m = sim.move(rawPv[i]);
        if (!m) break;
        continuationSteps.push({
          plyOffset: i + 1,
          san: m.san,
          from: m.from as Square,
          to: m.to as Square,
          turn: turnBefore,
          moveNumber: moveNum,
          fenAfter: sim.fen(),
        });
      } catch {
        break;
      }
    }
  }

  const ideas: MiddlegameIdea[] = [];
  const mine = continuationSteps.filter((s) => s.turn === playerTurn);
  if (mine.length > 0) {
    const arrows: Array<[Square, Square, string]> = [];
    const seen = new Set<string>();
    mine.forEach((s, idx) => {
      const key = `${s.from}-${s.to}`;
      if (!seen.has(key)) {
        seen.add(key);
        arrows.push([s.from, s.to, idx === 0 ? COLOR_GREEN : COLOR_BLUE]);
      }
    });
    ideas.push({
      id: 'engine-plan',
      category: 'Piano del motore',
      title: `Continuazione del motore: ${mine.map((m) => formatMoveLabel(m.moveNumber, m.turn, m.san)).join(' → ')}`,
      movesLabel: continuationSteps.map((s) => formatMoveLabel(s.moveNumber, s.turn, s.san)).join(' '),
      description: `Linea principale di Stockfish${engineDepth ? ` (profondità ${engineDepth})` : ''} da questa posizione.`,
      arrows,
    });
  }

  return { continuationSteps, evalForPlayer, engineDepth, ideas };
}
