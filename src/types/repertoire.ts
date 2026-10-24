export type PlayerColor = 'white' | 'black';

export interface RatingBandConfig {
  label: string; // e.g. "0-1400"
  buckets: number[]; // e.g. [0, 1000, 1200]
  speeds: string[]; // e.g. ["blitz", "rapid", "classical"]
}

export interface MoveStats {
  white: number;
  draws: number;
  black: number;
  totalGames: number;
  whitePct: number;
  drawPct: number;
  blackPct: number;
  topGames?: Array<{
    id: string;
    white: { name: string; rating: number };
    black: { name: string; rating: number };
    winner: 'white' | 'black' | null;
    year: number;
    month?: string;
  }>;
}

export interface EngineMoveEvaluation {
  evalPawns: number; // From White's perspective (+ = White better, - = Black better)
  evalFromPlayerPerspective: number; // + = good for repertoire player, - = bad for repertoire player
  bestMoveSan: string;
  bestMoveUci: string;
  bestEvalPawns: number;
  evalLossVsBest: number; // >= 0: how many pawns worse than engine #1 move
  depth: number;
  pvSan: string[];
}

export interface PlayerMoveChoice {
  san: string;
  uci: string;
  from: string;
  to: string;
  promotion?: string;
  nextNormalizedFen: string;
  nextFullFen: string;
  /**
   * Statistiche dal database Masters per la mia mossa scelta.
   */
  gmStats: MoveStats;
  /**
   * Statistiche nella fascia di rating configurata (0-1400 su /lichess) per la mia mossa scelta.
   */
  bandStats?: MoveStats;
  engine: EngineMoveEvaluation;
  arrows?: Array<[string, string, string?]>;
  /**
   * ⚠️ Commento didattico generato dall'AI e NON verificato da fonte ufficiale.
   * Massimo 1-2 frasi sull'idea strategica della posizione.
   */
  aiCommentUnverified?: string;
}

export interface OpponentMoveBranch {
  san: string;
  uci: string;
  from: string;
  to: string;
  promotion?: string;
  nextNormalizedFen: string;
  nextFullFen: string;
  /**
   * Statistiche reali nella fascia di rating configurata (0-1400 su /lichess).
   */
  bandStats: MoveStats;
  /**
   * Frequenza % della mossa avversaria nella posizione all'interno della fascia 0-1400.
   */
  frequencyPct: number;
}

export type MistakeSeverity = 'inaccuracy' | 'mistake' | 'blunder';

export interface CommonMistake {
  opponentMoveSan: string;
  opponentMoveUci: string;
  from: string;
  to: string;
  afterMistakeNormalizedFen: string;
  afterMistakeFullFen: string;
  /**
   * Frequenza % della mossa avversaria nella fascia di rating (0-1400, >= 5%).
   */
  frequencyPct: number;
  totalBandGames: number;
  evalLoss: number; // Perdita in pedoni rispetto alla migliore mossa avversaria (a depth 20)
  impactScore: number; // frequencyPct * evalLoss (usato per ordinare i top 3)
  severity: MistakeSeverity;
  punishMoveSan: string;
  punishMoveUci: string;
  punishFrom: string;
  punishTo: string;
  pvSan: string[]; // Max 6 mosse
  finalEvalPawns: number; // Valutazione dal punto di vista del Bianco a depth 20
  finalEvalForPlayer: number; // Valutazione dal punto di vista del Giocatore a depth 20
  depth: number;
  /**
   * ⚠️ Spiegazione didattica generata dall'AI e NON verificata.
   */
  aiCommentUnverified?: string;
}

export interface PositionNode {
  normalizedFen: string;
  fullFen: string;
  moveNumber: number;
  ply: number;
  turn: 'w' | 'b';
  isPlayerTurn: boolean;
  pgnPath: string;
  moveSequenceSan: string[];
  variationId: string;
  variationName: string;
  ecoCode?: string;
  ecoName?: string;
  positionGmStats?: MoveStats;
  positionBandStats?: MoveStats;
  /**
   * Presente SOLO quando isPlayerTurn === true.
   * Esattamente UNA mossa scelta per il repertorio.
   */
  playerMove?: PlayerMoveChoice;
  /**
   * Presente SOLO quando isPlayerTurn === false.
   * Contiene TUTTE le risposte avversarie nella fascia 0-1400 sopra MIN_BAND_GAMES e MIN_BRANCH_FREQ.
   */
  opponentMoves?: OpponentMoveBranch[];
  /**
   * Presente nel Checkpoint B quando isPlayerTurn === false.
   * Primi 3 errori comuni nella fascia 0-1400 ordinati per (frequencyPct * evalLoss).
   */
  commonMistakes?: CommonMistake[];
  /**
   * ⚠️ Breve nota strategica AI non verificata sulla posizione.
   */
  aiCommentUnverified?: string;
}

export interface VariationSummary {
  id: string;
  name: string;
  subtitle: string;
  ecoCode: string;
  rootMovesSan: string[];
  rootNormalizedFen: string;
}

export interface OpeningRepertoireFile {
  id: string;
  name: string;
  playerColor: PlayerColor;
  description: string;
  checkpoint: 'A' | 'B';
  generatedAt: string;
  ratingBand: RatingBandConfig;
  buildConfig: {
    ratingBandLabel: string;
    ratingBuckets: number[];
    maxMovesDepth: number;
    minBandGames: number;
    minBranchFreq: number;
    maxPositionsCap: number;
    stockfishPackage: string;
    stockfishDepth: number;
    avgStockfishMsPerPosition: number;
  };
  variations: VariationSummary[];
  rootNormalizedFen: string;
  positions: Record<string, PositionNode>;
}

export type SRSCardType = 'repertoire' | 'punish';

export interface StoredFSRSCard {
  /**
   * Chiave deterministica: `${openingId}:${cardType}:${normalizedFen}`
   */
  id: string;
  openingId: string;
  variationId: string;
  cardType: SRSCardType;
  normalizedFen: string;
  fullFen: string;
  pgnPath: string;
  moveSequenceSan: string[];
  correctMoveSan: string;
  correctMoveUci: string;
  correctFrom: string;
  correctTo: string;
  mistakeContext?: {
    beforeMistakeFen: string;
    opponentMistakeSan: string;
    evalLoss: number;
    severity: MistakeSeverity;
    frequencyPct: number;
    pvSan: string[];
  };
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: number; // 0=New, 1=Learning, 2=Review, 3=Relearning
  last_review?: string;
}

export interface ReviewLogEntry {
  id: string;
  cardId: string;
  openingId: string;
  cardType: SRSCardType;
  rating: number; // 1=Again, 2=Hard, 3=Good, 4=Easy
  usedHint: boolean;
  wrongAttempts: number;
  reviewedAt: string;
}

export interface BackupPayload {
  version: 1;
  exportedAt: string;
  cards: StoredFSRSCard[];
  logs: ReviewLogEntry[];
}
