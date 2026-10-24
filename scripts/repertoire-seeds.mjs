import { Chess } from 'chess.js';

export function normalizeFen(fen) {
  const parts = fen.trim().split(/\s+/);
  return `${parts[0]} ${parts[1]} ${parts[2]} ${parts[3]}`;
}

/**
 * Configurazione Scope Fase 1 (Checkpoint A):
 * UNA sola apertura: Caro-Kann (Nero), limitata a:
 *  1) Variante di Spinta (Advance): 1. e4 c6 2. d4 d5 3. e5 Bf5
 *  2) Variante Classica (Classical): 1. e4 c6 2. d4 d5 3. Nc3 (o 3. Nd2) dxe4 4. Nxe4 Bf5
 */
export const CARO_KANN_CONFIG = {
  id: 'caro-kann',
  name: 'Caro-Kann Defence',
  playerColor: 'black',
  description: 'Repertorio solido col Nero contro 1.e4 basato sul Database Grandi Maestri (Variante di Spinta 3...Bf5 e Variante Classica 4...Bf5).',
  rootMovesSan: ['e4', 'c6', 'd4', 'd5'],
  /**
   * Al tratto 3 del Bianco (dopo 1.e4 c6 2.d4 d5), nella Fase 1 includiamo solo le mosse
   * che entrano nella Variante di Spinta (e5) e nella Variante Classica (Nc3, Nd2).
   * Dai tratti successivi in poi, vengono esplorate TUTTE le risposte del Bianco sopra soglia.
   */
  allowedWhiteMove3San: ['e5', 'Nc3', 'Nd2'],
  variations: [
    {
      id: 'advance-bf5',
      name: 'Variante di Spinta (3.e5 Bf5)',
      subtitle: 'Sviluppo attivo dell\'alfiere camposcuro fuori dalla catena di pedoni prima di ...e6',
      ecoCode: 'B12',
      rootMovesSan: ['e4', 'c6', 'd4', 'd5', 'e5', 'Bf5'],
    },
    {
      id: 'classical-bf5',
      name: 'Variante Classica (4.Nxe4 Bf5)',
      subtitle: 'Cambio centrale 3...dxe4 seguito da 4...Bf5 per sfidare subito il cavallo centralizzato',
      ecoCode: 'B18',
      rootMovesSan: ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5'],
    },
  ],
};

/**
 * Linee principali di partenza (seed espliciti verificati).
 * Ogni sequenza definisce la mossa scelta dal Nero quando tocca a lui.
 */
const SEED_LINES = [
  // Trunk iniziale e ramificazione Advance / Classica
  ['e4', 'c6', 'd4', 'd5', 'e5', 'Bf5'],
  ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5'],
  ['e4', 'c6', 'd4', 'd5', 'Nd2', 'dxe4', 'Nxe4', 'Bf5'],

  // Advance: 4.Nf3 e6 (Short System)
  ['e4', 'c6', 'd4', 'd5', 'e5', 'Bf5', 'Nf3', 'e6', 'Be2', 'Nd7', 'O-O', 'Ne7', 'Nbd2', 'h6'],
  ['e4', 'c6', 'd4', 'd5', 'e5', 'Bf5', 'Nf3', 'e6', 'Be2', 'Nd7', 'O-O', 'Ne7', 'c3', 'h6'],

  // Advance: 4.Nc3 e6 5.g4 Bg6 (Bayonet / Shirov)
  ['e4', 'c6', 'd4', 'd5', 'e5', 'Bf5', 'Nc3', 'e6', 'g4', 'Bg6', ' Nge2', 'c5', 'h4', 'h6'],

  // Advance: 4.h4 h5 (Tal Variation)
  ['e4', 'c6', 'd4', 'd5', 'e5', 'Bf5', 'h4', 'h5', 'Bd3', 'Bxd3', 'Qxd3', 'e6', 'Nf3', 'Qa5+'],
  ['e4', 'c6', 'd4', 'd5', 'e5', 'Bf5', 'h4', 'h5', 'c4', 'e6', 'Nc3', 'Nd7'],

  // Advance: 4.Nd2 e6 5.Nb3 Nd7 6.Nf3
  ['e4', 'c6', 'd4', 'd5', 'e5', 'Bf5', 'Nd2', 'e6', 'Nb3', 'Nd7', 'Nf3', 'h6'],

  // Advance: 4.Bd3 Bxd3 5.Qxd3 e6
  ['e4', 'c6', 'd4', 'd5', 'e5', 'Bf5', 'Bd3', 'Bxd3', 'Qxd3', 'e6', 'Nf3', 'Qa5+'],

  // Advance: 4.c3 e6 5.Be3 Qb6
  ['e4', 'c6', 'd4', 'd5', 'e5', 'Bf5', 'c3', 'e6', 'Be3', 'Qb6'],

  // Classical: linea principale 5.Ng3 Bg6 6.h4 h6 7.Nf3 Nd7 8.h5 Bh7
  ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5', 'Ng3', 'Bg6', 'h4', 'h6', 'Nf3', 'Nd7', 'h5', 'Bh7'],
  ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5', 'Ng3', 'Bg6', 'Nf3', 'Nd7', 'h4', 'h6', 'h5', 'Bh7'],
  ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5', 'Ng3', 'Bg6', 'Bc4', 'e6', 'N1e2', 'Nf6'],
];

/**
 * Mappa addizionale di mosse approvate tramite `scripts/review-moves-cli.mjs`
 * (chiave: FEN normalizzato -> valore: mossa SAN del Nero).
 */
// BEGIN_APPROVED_BY_FEN
export const APPROVED_MOVES_BY_FEN = {
  "rnbqkbnr/pp1ppppp/2p5/8/3PP3/8/PPP2PPP/RNBQKBNR b KQkq -": "d5",
  "rnbqkbnr/pp2pppp/2p5/3pP3/3P4/8/PPP2PPP/RNBQKBNR b KQkq -": "Bf5",
  "rnbqkbnr/pp2pppp/2p5/3p4/3PP3/2N5/PPP2PPP/R1BQKBNR b KQkq -": "dxe4",
  "rnbqkbnr/pp2pppp/2p5/3p4/3PP3/8/PPPN1PPP/R1BQKBNR b KQkq -": "dxe4",
  "rnbqkbnr/pp2pppp/2p5/8/3PN3/8/PPP2PPP/R1BQKBNR b KQkq -": "Bf5",
  "rn1qkbnr/pp2pppp/2p5/3pPb2/3P1P2/8/PPP3PP/RNBQKBNR b KQkq -": "e6",
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P4/3B1N2/PPP2PPP/RNBQK2R b KQkq -": "Bxd3",
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P4/2N2N2/PPP2PPP/R1BQKB1R b KQkq -": "Nd7",
  "rn1qkbnr/pp3ppp/2p1p3/3pPbB1/3P4/5N2/PPP2PPP/RN1QKB1R b KQkq -": "Qb6",
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P4/2P2N2/PP3PPP/RNBQKB1R b KQkq -": "Nd7",
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P4/5N1P/PPP2PP1/RNBQKB1R b KQkq -": "Nd7",
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P4/2NB4/PPP2PPP/R1BQK1NR b KQkq -": "Bxd3",
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P1B2/2N5/PPP2PPP/R2QKBNR b KQkq -": "Ne7",
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P4/P1N5/1PP2PPP/R1BQKBNR b KQkq -": "Nd7",
  "rn1qkbnr/pp2pppp/2p5/5b2/3PN3/3B4/PPP2PPP/R1BQK1NR b KQkq -": "Qxd4",
  "rn1qkbnr/pp2pppp/2p5/5b2/3PN3/5P2/PPP3PP/R1BQKBNR b KQkq -": "Nf6",
  "rn1qkbnr/pp2pppp/2p5/5b2/3P4/2N5/PPP2PPP/R1BQKBNR b KQkq -": "Nf6",
  "rn1qkbnr/pp2pppp/2p5/5bN1/3P4/8/PPP2PPP/R1BQKBNR b KQkq -": "Bg6",
  "rn1qkbnr/pp2pppp/2p5/2N2b2/3P4/8/PPP2PPP/R1BQKBNR b KQkq -": "b6",
  "rn1qkbnr/pp3ppp/2p1p3/3pP3/3P1P2/3Q4/PPP3PP/RNB1K1NR b KQkq -": "c5",
  "rn1qkbnr/pp3ppp/2p1p3/3pP3/3P4/2NQ4/PPP2PPP/R1B1K1NR b KQkq -": "Nd7",
  "rn1qkbnr/pp2pppp/2p3b1/8/3P4/3B2N1/PPP2PPP/R1BQK1NR b KQkq -": "Qxd4",
  "rn2kbnr/pp3ppp/2p1p3/q2pP3/3P4/3Q1N2/PPPB1PPP/RN2K2R b KQkq -": "Qa6",
  "rn1qkbnr/pp2ppp1/2p3bp/7P/3P4/6N1/PPP2PP1/R1BQKBNR b KQkq -": "Bh7",
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P1P2/5N2/PPP3PP/RNBQKB1R b KQkq -": "c5",
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P1P2/3B4/PPP3PP/RNBQK1NR b KQkq -": "Nh6",
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P1PP1/8/PPP4P/RNBQKBNR b KQkq -": "Qh4+",
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P1P2/2N5/PPP3PP/R1BQKBNR b KQkq -": "Be7",
  "r2qkbnr/pp1n1ppp/2p1p3/3pPb2/3P4/2NB1N2/PPP2PPP/R1BQK2R b KQkq -": "Ne7",
  "r2qkbnr/pp1n1ppp/2p1p3/3pPbB1/3P4/2N2N2/PPP2PPP/R2QKB1R b KQkq -": "Ne7",
  "r2qkbnr/pp1n1ppp/2p1p3/3pPb2/3P1B2/2N2N2/PPP2PPP/R2QKB1R b KQkq -": "Bb4",
  "r2qkbnr/pp1n1ppp/2p1p3/3pPb2/3P4/2N2N2/PPP1BPPP/R1BQK2R b KQkq -": "Ne7",
  "r2qkbnr/pp1n1ppp/2p1p3/3pPb2/3P4/2N2N1P/PPP2PP1/R1BQKB1R b KQkq -": "a6",
  "rn2kbnr/pp3ppp/1qp1p3/3pPbB1/3P4/1P3N2/P1P2PPP/RN1QKB1R b KQkq -": "c5",
  "r2qkbnr/pp1n1ppp/2p1p3/3pPb2/3P4/2PB1N2/PP3PPP/RNBQK2R b KQkq -": "Ne7",
  "r2qkbnr/pp1n1ppp/2p1p3/3pPbB1/3P4/2P2N2/PP3PPP/RN1QKB1R b KQkq -": "f6",
  "r2qkbnr/pp1n1ppp/2p1p3/3pPb2/3P4/2P2N2/PP2BPPP/RNBQK2R b KQkq -": "Ne7",
  "r2qkbnr/pp1n1ppp/2p1p3/3pPb2/3P2P1/5N1P/PPP2P2/RNBQKB1R b KQkq -": "Bg6",
  "rn2kbnr/pp2pppp/2p5/5b2/3qN3/3B1N2/PPP2PPP/R1BQK2R b KQkq -": "Qd8",
  "rn2kbnr/pp2pppp/2p5/5b2/3qN3/3BB3/PPP2PPP/R2QK1NR b KQkq -": "Qxb2",
  "rn2kbnr/pp2pppp/2p5/5b2/3qN3/3B1Q2/PPP2PPP/R1B1K1NR b KQkq -": "Bxe4",
  "rn2kbnr/pp2pppp/2p5/5b2/3qN3/3B1P2/PPP3PP/R1BQK1NR b KQkq -": "e6",
  "rn1qkb1r/pp2pppp/2p2N2/5b2/3P4/5P2/PPP3PP/R1BQKBNR b KQkq -": "exf6",
  "rn1qkb1r/pp2pppp/2p2n2/5b2/3PN3/3B1P2/PPP3PP/R1BQK1NR b KQkq -": "Qxd4",
  "rn1qkb1r/pp2pppp/2p2n2/5b2/3P4/2N2N2/PPP2PPP/R1BQKB1R b KQkq -": "e6",
  "rn1qkbnr/pp3ppp/4p3/2ppP3/3P1P2/2PQ4/PP4PP/RNB1K1NR b KQkq -": "Nc6",
  "r2qkbnr/pp1n1ppp/2p1p3/3pP3/3P4/2NQ1N2/PPP2PPP/R1B1K2R b KQkq -": "Ne7",
  "rn1qkbnr/pp2pppb/2p4p/7P/3P4/5NN1/PPP2PP1/R1BQKB1R b KQkq -": "Nd7",
  "rn1qkbnr/pp3ppp/4p3/2ppPb2/3P1P2/2P2N2/PP4PP/RNBQKB1R b KQkq -": "Nc6",
  "rn1qkbnr/pp3ppp/4p3/2ppPb2/3P1P2/3B1N2/PPP3PP/RNBQK2R b KQkq -": "Nh6",
  "rn1qkbnr/pp3ppp/4p3/1BppPb2/3P1P2/5N2/PPP3PP/RNBQK2R b KQkq -": "Nd7",
  "rn1qkbnr/pp3ppp/4p3/2ppPb2/3P1P2/4BN2/PPP3PP/RN1QKB1R b KQkq -": "Qb6",
  "rn1qkbnr/pp2pppp/2p5/5b2/4N3/3B1N2/PPP2PPP/R1BQ1RK1 b kq -": "Bxe4",
  "rn1qkb1r/pp3ppp/2p1pn2/5b2/3P4/2NB1N2/PPP2PPP/R1BQK2R b KQkq -": "Bxd3",
  "rn1qkb1r/pp3ppp/2p1pn2/5bB1/3P4/2N2N2/PPP2PPP/R2QKB1R b KQkq -": "Bb4",
  "r2qkbnr/pp3ppp/2n1p3/1BppPb2/3P1P2/2P2N2/PP4PP/RNBQK2R b KQkq -": "Be7",
  "r2qkbnr/pp3ppp/2n1p3/2ppPb2/3P1P2/2PB1N2/PP4PP/RNBQK2R b KQkq -": "Nh6",
  "r2qkbnr/pp3ppp/2n1p3/2ppPb2/3P1P2/2P1BN2/PP4PP/RN1QKB1R b KQkq -": "Qb6"
};
// END_APPROVED_BY_FEN

/**
 * Commenti didattici AI brevi (1-2 frasi) per posizioni chiave.
 * ⚠️ NOTA: Tutti questi commenti sono generati dall'AI e marcati nell'app come "Commento AI, non verificato".
 */
export const AI_COMMENTS_UNVERIFIED_BY_FEN = {
  "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq -":
    "1...c6 prepara la spinta centrale ...d5 al tratto successivo mantenendo aperta la diagonale c8-h3 per l'alfiere camposcuro.",
  "rnbqkbnr/pp1ppppp/2p5/8/3PP3/8/PPP2PPP/RNBQKBNR b KQkq -":
    "Con 2...d5 sfidiamo subito il centro del Bianco senza bloccare l'alfiere in c8.",
  "rnbqkbnr/pp2pppp/2p5/3pP3/3P4/8/PPP2PPP/RNBQKBNR b KQkq -":
    "Nella Variante di Spinta giochiamo 3...Bf5 per sviluppare l'alfiere fuori dalla catena di pedoni prima di chiudere con ...e6.",
  "rnbqkbnr/pp2pppp/2p5/3p4/3PP3/2N5/PPP2PPP/R1BQKBNR b KQkq -":
    "Con 3...dxe4 eliminiamo la tensione centrale per poi sfidare subito il cavallo in e4 con ...Bf5.",
  "rnbqkbnr/pp2pppp/2p5/3p4/3PP3/8/PPPN1PPP/R1BQKBNR b KQkq -":
    "Anche contro 3.Nd2 cambiamo in e4 per rientrare nella Variante Classica con 4...Bf5.",
  "rnbqkbnr/pp2pppp/2p5/8/3PN3/8/PPP2PPP/R1BQKBNR b KQkq -":
    "4...Bf5 attacca immediatamente il cavallo centralizzato del Bianco e conquista una solida casa in g6/h7 per l'alfiere."
};

/**
 * Frecce didattiche opzionali per alcune mosse chiave del repertorio.
 */
export const ARROWS_BY_FEN = {
  "rnbqkbnr/pp2pppp/2p5/3pP3/3P4/8/PPP2PPP/RNBQKBNR b KQkq -": [
    ["c8", "f5", "#f59e0b"],
    ["e7", "e6", "#38bdf8"]
  ],
  "rnbqkbnr/pp2pppp/2p5/8/3PN3/8/PPP2PPP/R1BQKBNR b KQkq -": [
    ["c8", "f5", "#f59e0b"],
    ["f5", "g6", "#38bdf8"]
  ]
};

/**
 * Costruisce il dizionario completo (NormalizedFEN -> SAN move) combinando SEED_LINES e APPROVED_MOVES_BY_FEN.
 */
export function getApprovedSeedMap() {
  const map = new Map();

  for (const line of SEED_LINES) {
    const chess = new Chess();
    for (const rawSan of line) {
      const san = rawSan.trim();
      const normFen = normalizeFen(chess.fen());
      const turn = chess.turn();
      const m = chess.move(san);
      if (!m) {
        throw new Error(`Invalid seed move "${san}" at FEN ${normFen}`);
      }
      if (turn === 'b') {
        map.set(normFen, m.san);
      }
    }
  }

  for (const [normFen, san] of Object.entries(APPROVED_MOVES_BY_FEN)) {
    map.set(normFen, san);
  }

  return map;
}
