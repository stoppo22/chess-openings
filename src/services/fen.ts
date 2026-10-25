import { Chess, type Square } from 'chess.js';

/**
 * Normalizes a FEN string by stripping the halfmove clock and fullmove number (fields 5 and 6),
 * keeping only the first 4 fields:
 *   1. Piece placement
 *   2. Active color ('w' | 'b')
 *   3. Castling availability
 *   4. En passant target square (normalized so ep square is only kept if a legal ep capture exists, or standard chess.js 4-field FEN)
 *
 * This guarantees that transpositions reaching the exact same board state map to the exact same SRS card key.
 */
export function normalizeFen(fen: string): string {
  const trimmed = fen.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length < 4) {
    throw new Error(`Invalid FEN string: "${fen}"`);
  }
  return `${parts[0]} ${parts[1]} ${parts[2]} ${parts[3]}`;
}

/**
 * Plays a sequence of SAN moves from the initial position and returns both the full FEN and normalized FEN.
 */
export function getFenFromSanMoves(movesSan: string[]): { fullFen: string; normalizedFen: string; pgn: string } {
  const chess = new Chess();
  for (const san of movesSan) {
    const result = chess.move(san);
    if (!result) {
      throw new Error(`Illegal move "${san}" in sequence: ${movesSan.join(' ')}`);
    }
  }
  const fullFen = chess.fen();
  return {
    fullFen,
    normalizedFen: normalizeFen(fullFen),
    pgn: chess.pgn(),
  };
}

/**
 * Builds the deterministic SRS card ID from openingId, cardType, and normalized FEN.
 */
export function buildCardId(
  openingId: string,
  cardType: 'repertoire' | 'punish',
  fenOrNormalizedFen: string
): string {
  const norm = normalizeFen(fenOrNormalizedFen);
  return `${openingId}:${cardType}:${norm}`;
}

export interface LastMoveInfo {
  from: Square;
  to: Square;
  san: string;
  moveNumber: number;
  color: 'w' | 'b';
  fenBefore: string;
  fenAfter: string;
}

export function getLastMoveInfo(pgnOrMoves: string | string[]): LastMoveInfo | null {
  try {
    const tokens = Array.isArray(pgnOrMoves)
      ? pgnOrMoves
      : pgnOrMoves
          .replace(/\d+\.(\.\.)?/g, ' ')
          .trim()
          .split(/\s+/)
          .filter(Boolean);
    if (tokens.length === 0) return null;

    const chess = new Chess();
    let lastInfo: LastMoveInfo | null = null;
    for (const rawToken of tokens) {
      const cleanSan = rawToken.replace(/[?!]+$/g, '');
      const fenBefore = chess.fen();
      const moveNumber = chess.moveNumber();
      const color = chess.turn();
      const m = chess.move(cleanSan);
      if (!m) break;
      lastInfo = {
        from: m.from as Square,
        to: m.to as Square,
        san: m.san,
        moveNumber,
        color,
        fenBefore,
        fenAfter: chess.fen(),
      };
    }
    return lastInfo;
  } catch {
    return null;
  }
}
