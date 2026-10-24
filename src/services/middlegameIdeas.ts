import { Chess, type Square } from 'chess.js';
import type { OpeningRepertoireFile, PositionNode } from '../types/repertoire';

export interface MiddlegameIdea {
  id: string;
  category: 'Piano del motore' | 'Rottura centrale' | 'Manovra & Sviluppo' | "Strategia d'attacco";
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
  evalFromBlackPerspective: number | null;
  engineDepth: number | null;
  ideas: MiddlegameIdea[];
}

const COLOR_GREEN = 'rgba(129, 182, 76, 0.88)';
const COLOR_BLUE = 'rgba(54, 146, 231, 0.85)';
const COLOR_RED = 'rgba(201, 60, 56, 0.85)';
const COLOR_AMBER = 'rgba(230, 157, 0, 0.85)';

export function buildMiddlegameGuide(
  opening: OpeningRepertoireFile,
  leafNode: PositionNode,
  previousNormFen?: string
): MiddlegameGuide {
  // 1. Find parent player node to extract Stockfish continuation PV
  let parentNode = previousNormFen ? opening.positions[previousNormFen] : undefined;
  if (!parentNode || !parentNode.playerMove) {
    parentNode = Object.values(opening.positions).find(
      (n) => n.isPlayerTurn && n.playerMove?.nextNormalizedFen === leafNode.normalizedFen
    );
  }

  const continuationSteps: MiddlegameContinuationStep[] = [];
  let evalFromBlackPerspective: number | null = null;
  let engineDepth: number | null = null;

  if (parentNode?.playerMove?.engine) {
    evalFromBlackPerspective = parentNode.playerMove.engine.evalFromPlayerPerspective;
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

  const chess = new Chess(leafNode.fullFen);
  const hasPiece = (sq: Square, color: 'w' | 'b', type: string): boolean => {
    const p = chess.get(sq);
    return Boolean(p && p.color === color && p.type === type);
  };

  const ideas: MiddlegameIdea[] = [];

  // Idea 1: Sequenza consigliata da Stockfish per il Nero
  const blackPvMoves = continuationSteps.filter((s) => s.turn === 'b');
  if (blackPvMoves.length > 0) {
    const pvArrows: Array<[Square, Square, string]> = [];
    const seenPairs = new Set<string>();
    blackPvMoves.forEach((bm, idx) => {
      const key = `${bm.from}-${bm.to}`;
      if (!seenPairs.has(key)) {
        seenPairs.add(key);
        pvArrows.push([bm.from, bm.to, idx === 0 ? COLOR_GREEN : COLOR_BLUE]);
      }
    });

    const formattedLine = continuationSteps
      .map((s) => (s.turn === 'w' ? `${s.moveNumber}.${s.san}` : `${s.moveNumber}...${s.san}`))
      .join(' ');

    ideas.push({
      id: 'engine-plan',
      category: 'Piano del motore',
      title: `Piano principale consigliato: ${blackPvMoves.map((m) => `...${m.san}`).join(' → ')}`,
      movesLabel: formattedLine,
      description:
        'Sequenza di sviluppo e manovra calcolata da Stockfish a partire da questa posizione contro le risposte ottimali del Bianco.',
      arrows: pvArrows,
    });
  }

  // Idea 2: Rottura centrale ...c5 o pressione su d4
  const whiteHasD4Pawn = hasPiece('d4', 'w', 'p');
  if (hasPiece('c6', 'b', 'p')) {
    const arrows: Array<[Square, Square, string]> = [['c6', 'c5', COLOR_GREEN]];
    if (whiteHasD4Pawn) {
      arrows.push(['c5', 'd4', COLOR_RED]);
    }
    if (hasPiece('b8', 'b', 'n')) {
      arrows.push(['b8', 'c6', COLOR_BLUE]);
    }
    ideas.push({
      id: 'break-c5',
      category: 'Rottura centrale',
      title: 'Rottura tematica ...c5 contro il centro bianco',
      movesLabel: '...c5 (seguita da ...Nc6, ...cxd4 o ...Rc8)',
      description:
        'La spinta liberatoria fondamentale della Caro-Kann: attacca alla base il centro del Bianco in d4, apre la colonna c per le Torri e libera la casa c6 per il Cavallo.',
      arrows,
    });
  } else if (hasPiece('c5', 'b', 'p') && whiteHasD4Pawn) {
    const arrows: Array<[Square, Square, string]> = [['c5', 'd4', COLOR_RED]];
    if (hasPiece('b8', 'b', 'n')) {
      arrows.push(['b8', 'c6', COLOR_BLUE]);
      arrows.push(['c6', 'd4', COLOR_RED]);
    } else if (hasPiece('c6', 'b', 'n')) {
      arrows.push(['c6', 'd4', COLOR_RED]);
    }
    ideas.push({
      id: 'pressure-d4',
      category: 'Rottura centrale',
      title: 'Assedio al pedone centrale d4',
      movesLabel: '...Nc6 + ...Qb6 + ...cxd4',
      description:
        'Con il pedone già in c5, aumenta la pressione sul punto d4 combinando Cavallo in c6, Donna in b6 e Cavallo in f5 per forzare il Bianco a cedere il centro.',
      arrows,
    });
  }

  // Idea 3: Attacco sul lato di Donna con ...Qb6 e colonna c
  if (hasPiece('d8', 'b', 'q')) {
    const arrows: Array<[Square, Square, string]> = [['d8', 'b6', COLOR_AMBER]];
    if (whiteHasD4Pawn) {
      arrows.push(['b6', 'd4', COLOR_RED]);
    }
    if (hasPiece('b2', 'w', 'p')) {
      arrows.push(['b6', 'b2', COLOR_RED]);
    }
    ideas.push({
      id: 'queen-b6-attack',
      category: "Strategia d'attacco",
      title: 'Sortita ...Qb6: doppio mirino su d4 e b2',
      movesLabel: '...Qb6 + ...Rc8',
      description:
        "La Donna in b6 crea una doppia minaccia classica: aumenta l'attacco sul pedone centrale d4 e punta contemporaneamente sul pedone b2, spesso lasciato indifeso dall'Alfiere bianco.",
      arrows,
    });
  } else if (hasPiece('b6', 'b', 'q')) {
    const arrows: Array<[Square, Square, string]> = [];
    if (whiteHasD4Pawn) arrows.push(['b6', 'd4', COLOR_RED]);
    if (hasPiece('b2', 'w', 'p')) arrows.push(['b6', 'b2', COLOR_RED]);
    if (hasPiece('a8', 'b', 'r')) arrows.push(['a8', 'c8', COLOR_BLUE]);
    if (arrows.length > 0) {
      ideas.push({
        id: 'queenside-initiative',
        category: "Strategia d'attacco",
        title: 'Iniziativa sul lato di Donna (...Qxb2 / ...Rc8)',
        movesLabel: '...Rc8 + pressione su b2 e d4',
        description:
          'Sfrutta la Donna già attiva in b6 portando la Torre in c8 per dominare la colonna c e costringere i pezzi bianchi sulla difensiva.',
        arrows,
      });
    }
  }

  // Idea 4: Manovra dei Cavalli (Ne7-f5/g6 nella Spinta, Ngf6-e4 nella Classica)
  if (hasPiece('g8', 'b', 'n')) {
    if (leafNode.variationId === 'advance-bf5') {
      ideas.push({
        id: 'knight-maneuver-e7-f5',
        category: 'Manovra & Sviluppo',
        title: 'Manovra tipica del Cavallo: ...Ne7 → ...Nf5 (o ...Ng6)',
        movesLabel: '...Ne7 → ...Nf5 / ...Ng6',
        description:
          'Poiché la casa f6 è controllata dal pedone bianco in e5, il Cavallo di re si sviluppa in e7 per saltare nell’avamposto ideale in f5 (attaccando d4) o in g6.',
        arrows: [
          ['g8', 'e7', COLOR_BLUE],
          ['e7', 'f5', COLOR_GREEN],
          ['e7', 'g6', COLOR_AMBER],
        ],
      });
    } else {
      ideas.push({
        id: 'knight-f6-e4',
        category: 'Manovra & Sviluppo',
        title: 'Sviluppo attivo ...Ngf6 e controllo della casa centrale e4',
        movesLabel: '...Ngf6 → ...Ne4',
        description:
          'Nella Variante Classica la casa f6 è libera: sviluppa il Cavallo in f6 per controllare l’avamposto centrale e4 e preparare l’arrocco corto.',
        arrows: [
          ['g8', 'f6', COLOR_BLUE],
          ['f6', 'e4', COLOR_GREEN],
        ],
      });
    }
  } else if (hasPiece('e7', 'b', 'n')) {
    ideas.push({
      id: 'knight-jump-f5',
      category: 'Manovra & Sviluppo',
      title: 'Ingresso del Cavallo in ...Nf5 o ...Ng6',
      movesLabel: '...Nf5 (pressione su d4/g2) o ...Ng6',
      description:
        'Completa la manovra portando il Cavallo da e7 in f5 (da cui attacca d4 e disturba gli Alfieri bianchi) oppure in g6 per sfidare l’Alfiere camposcuro.',
      arrows: [
        ['e7', 'f5', COLOR_GREEN],
        ['e7', 'g6', COLOR_BLUE],
      ],
    });
  }

  // Idea 5: Rottura ...f6 contro la punta e5 (nella Spinta) oppure Torri al centro (nella Classica)
  if (hasPiece('e5', 'w', 'p') && hasPiece('f7', 'b', 'p')) {
    ideas.push({
      id: 'break-f6',
      category: 'Rottura centrale',
      title: 'Rottura ...f6 per demolire la punta in e5',
      movesLabel: '...f6 → ...fxe5',
      description:
        'Se il Bianco difende solidamente d4, colpisci la testa della catena pedonale con ...f6: dopo il cambio in e5 si apre la colonna f per la Torre nera arroccata.',
      arrows: [
        ['f7', 'f6', COLOR_GREEN],
        ['f6', 'e5', COLOR_RED],
      ],
    });
  } else if (hasPiece('a8', 'b', 'r')) {
    ideas.push({
      id: 'rook-c8-file',
      category: "Strategia d'attacco",
      title: 'Torre sulla colonna semiaperta (...Rc8)',
      movesLabel: '...Rc8 + ...Rfd8',
      description:
        'Centralizza le Torri sulle colonne c e d: la Torre in c8 sostiene la spinta ...c5 e crea minacce tattiche dirette lungo la colonna contro c2 e c3.',
      arrows: [
        ['a8', 'c8', COLOR_BLUE],
        ['c8', 'c2', COLOR_RED],
      ],
    });
  }

  // Idea 6: Sviluppo dell'Alfiere f8 e Arrocco del Re
  if (hasPiece('e8', 'b', 'k')) {
    const arrows: Array<[Square, Square, string]> = [['e8', 'g8', COLOR_GREEN]];
    if (hasPiece('f8', 'b', 'b')) {
      arrows.unshift(['f8', 'e7', COLOR_BLUE]);
    }
    ideas.push({
      id: 'castle-and-bishop',
      category: 'Manovra & Sviluppo',
      title: 'Messa in sicurezza del Re (...Be7/...Bd6 e ...O-O)',
      movesLabel: hasPiece('f8', 'b', 'b') ? '...Be7 / ...Bd6 → ...O-O' : '...O-O',
      description:
        'Completa lo sviluppo dell’ala di Re e metti il Re al sicuro con l’arrocco corto prima di aprire completamente il centro con le rotture di pedone.',
      arrows,
    });
  }

  return {
    continuationSteps,
    evalFromBlackPerspective,
    engineDepth,
    ideas,
  };
}
