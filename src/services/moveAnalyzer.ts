import { Chess, type PieceSymbol } from 'chess.js';
import type {
  CommonMistake,
  OpeningRepertoireFile,
  PlayerColor,
  PositionNode,
} from '../types/repertoire';
import { formatMoveLabel } from './fen';

const PIECE_VALUE: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

const PIECE_NAME_IT: Record<PieceSymbol, string> = {
  p: 'pedone',
  n: 'Cavallo',
  b: 'Alfiere',
  r: 'Torre',
  q: 'Donna',
  k: 'Re',
};

const fmt = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}`;

export const colorLetter = (c: PlayerColor): 'w' | 'b' => (c === 'white' ? 'w' : 'b');

/** Notazione della mossa dell'apertura con numero (5.Nf3 / 5...Nf6) in base al turno del nodo. */
export function nodeMoveLabel(node: PositionNode, san: string): string {
  return formatMoveLabel(node.moveNumber, node.turn, san);
}

/** Bilancio materiale (pedine = 1, N/B = 3, R = 5, Q = 9) dal punto di vista del colore dato. */
export function computeMaterialDiffForPlayer(fen: string, color: PlayerColor): number {
  const me = colorLetter(color);
  let diff = 0;
  for (const row of new Chess(fen).board()) {
    for (const sq of row) {
      if (sq) diff += (sq.color === me ? 1 : -1) * PIECE_VALUE[sq.type];
    }
  }
  return diff;
}

/**
 * Valutazione Stockfish dal punto di vista del giocatore per un nodo del repertorio.
 * null se il dato non esiste (mai un valore inventato).
 */
export function getNodeEvalForPlayer(
  opening: OpeningRepertoireFile,
  node: PositionNode | undefined,
  previousNormFen?: string
): number | null {
  if (!node) return null;
  if (node.isPlayerTurn && node.playerMove) {
    return node.playerMove.engine.evalFromPlayerPerspective;
  }
  const prev = previousNormFen ? opening.positions[previousNormFen] : undefined;
  if (prev?.playerMove) return prev.playerMove.engine.evalFromPlayerPerspective;
  const parent = Object.values(opening.positions).find(
    (n) => n.isPlayerTurn && n.playerMove?.nextNormalizedFen === node.normalizedFen
  );
  return parent?.playerMove?.engine.evalFromPlayerPerspective ?? null;
}

/**
 * Spiega un errore avversario usando solo i campi di CommonMistake e fatti verificati con chess.js
 * (cattura, scacco, materiale lungo la PV).
 */
export function explainOpponentMistake(
  mistake: CommonMistake,
  playerColor: PlayerColor = 'black'
): string {
  const severityIt =
    mistake.severity === 'blunder'
      ? 'Grave errore'
      : mistake.severity === 'mistake'
        ? 'Errore'
        : 'Imprecisione';
  const head = `${severityIt} (-${mistake.evalLoss.toFixed(2)} pedoni): ${mistake.opponentMoveSan}.`;
  const tail = `Valutazione per te: ${fmt(mistake.finalEvalForPlayer)} (profondità ${mistake.depth}).`;
  try {
    const chess = new Chess(mistake.afterMistakeFullFen);
    const matBefore = computeMaterialDiffForPlayer(mistake.afterMistakeFullFen, playerColor);
    const m = chess.move(mistake.punishMoveSan);
    if (!m) return `${head} La punizione è ${mistake.punishMoveSan}. ${tail}`;
    const facts: string[] = [];
    if (m.captured) facts.push(`${mistake.punishMoveSan} cattura il ${PIECE_NAME_IT[m.captured]} in ${m.to}`);
    if (chess.inCheck()) facts.push('dà scacco');
    const pv = new Chess(mistake.afterMistakeFullFen);
    for (const san of mistake.pvSan) if (!pv.move(san)) break;
    const gain = computeMaterialDiffForPlayer(pv.fen(), playerColor) - matBefore;
    if (gain >= 1) facts.push(`nella linea (${mistake.pvSan.join(' ')}) guadagni ${gain} punti di materiale`);
    const why = facts.length ? ` ${facts.join('; ')}.` : ` La punizione è ${mistake.punishMoveSan}.`;
    return `${head}${why} ${tail}`;
  } catch {
    return `${head} La punizione è ${mistake.punishMoveSan}. ${tail}`;
  }
}

export interface WrongMoveAnalysis {
  wrongSan: string;
  correctSan: string;
  /** Valutazione reale (motore) dopo la mossa sbagliata, per il giocatore; null se non nota. */
  evalForPlayer: number | null;
  /** Variazione rispetto alla migliore (<= 0, in pedoni); null se non nota. */
  evalDrop: number | null;
  explanation: string;
  /** Spazio per una futura spiegazione concettuale (non usato per ora). */
  conceptHint?: string;
}

/**
 * Valuta una mossa sbagliata SOLO con dati del motore: se la mossa è tra le alternative
 * (multipv) del nodo usa i numeri reali, altrimenti non mostra nessun numero.
 */
export function analyzeWrongPlayerMove(
  node: PositionNode,
  wrongSan: string,
  expectedMoveSan?: string
): WrongMoveAnalysis {
  const correctSan = expectedMoveSan || node.playerMove?.san || '';
  const alternatives = node.playerMove?.alternatives;
  let wrongUci: string | undefined;
  try {
    const m = new Chess(node.fullFen).move(wrongSan);
    wrongUci = m ? `${m.from}${m.to}${m.promotion ?? ''}` : undefined;
  } catch {
    wrongUci = undefined;
  }
  const found = alternatives?.find((a) => a.san === wrongSan || (wrongUci && a.uci === wrongUci));

  if (found && found.evalLossVsBest <= 0.1) {
    // Mossa valida quanto quella del repertorio: spiegare la scelta, non "punire" l'utente.
    const mine = alternatives?.find((a) => a.san === correctSan);
    const gmNote =
      mine?.gmPct != null && found.gmPct != null
        ? ` (GM: ${correctSan} ${mine.gmPct.toFixed(1)}%, ${wrongSan} ${found.gmPct.toFixed(1)}%)`
        : '';
    return {
      wrongSan,
      correctSan,
      evalForPlayer: found.evalFromPlayerPerspective,
      evalDrop: -found.evalLossVsBest,
      explanation: `${wrongSan} è buona quanto la mossa del repertorio secondo il motore (${fmt(
        found.evalFromPlayerPerspective
      )}), ma nel repertorio giochiamo ${correctSan}, la scelta più giocata dai Grandi Maestri${gmNote}.`,
    };
  }

  if (found) {
    const reply = found.pvSan[1];
    return {
      wrongSan,
      correctSan,
      evalForPlayer: found.evalFromPlayerPerspective,
      evalDrop: -found.evalLossVsBest,
      explanation: `${wrongSan} vale ${fmt(found.evalFromPlayerPerspective)} per te, ${found.evalLossVsBest.toFixed(2)} pedoni meno della migliore${
        reply ? `; il motore risponde con ${reply}` : ''
      }. La mossa del repertorio è ${correctSan}.`,
    };
  }

  return {
    wrongSan,
    correctSan,
    evalForPlayer: null,
    evalDrop: null,
    explanation: alternatives?.length
      ? `Questa mossa non è tra le ${alternatives.length} migliori del motore in questa posizione: la mossa del repertorio è ${correctSan}.`
      : `${wrongSan} non è la mossa del repertorio: la mossa del repertorio è ${correctSan}.`,
  };
}
