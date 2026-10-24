import { Chess } from 'chess.js';

export function normalizeFen(fen) {
  const parts = fen.trim().split(/\s+/);
  return `${parts[0]} ${parts[1]} ${parts[2]} ${parts[3]}`;
}

export const CARO_KANN_CONFIG = {
  id: 'caro-kann',
  name: 'Caro-Kann Defence',
  playerColor: 'black',
  description:
    'Repertorio solido col Nero contro 1.e4 basato sul Database Lichess (fascia 0-1400 per le risposte avversarie) e validato con Database Grandi Maestri + Stockfish 16 (depth 18).',
  rootMovesSan: ['e4', 'c6', 'd4', 'd5'],
  allowedWhiteMove3San: ['e5', 'Nc3', 'Nd2'],
  variations: [
    {
      id: 'advance-bf5',
      name: 'Variante di Spinta (3.e5 Bf5)',
      subtitle: "Sviluppo attivo dell'alfiere camposcuro fuori dalla catena di pedoni prima di ...e6",
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
 */
export const SEED_LINES = [
  ['e4', 'c6', 'd4', 'd5', 'e5', 'Bf5'],
  ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5'],
  ['e4', 'c6', 'd4', 'd5', 'Nd2', 'dxe4', 'Nxe4', 'Bf5'],
  ['e4', 'c6', 'd4', 'd5', 'e5', 'Bf5', 'Nf3', 'e6', 'Be2', 'Nd7', 'O-O', 'Ne7', 'Nbd2', 'h6'],
  ['e4', 'c6', 'd4', 'd5', 'e5', 'Bf5', 'Nf3', 'e6', 'Be2', 'Nd7', 'O-O', 'Ne7', 'c3', 'h6'],
  ['e4', 'c6', 'd4', 'd5', 'e5', 'Bf5', 'Nc3', 'e6', 'g4', 'Bg6', 'Nge2', 'c5', 'h4', 'h6'],
  ['e4', 'c6', 'd4', 'd5', 'e5', 'Bf5', 'h4', 'h5', 'Bd3', 'Bxd3', 'Qxd3', 'e6', 'Nf3', 'Qa5+'],
  ['e4', 'c6', 'd4', 'd5', 'e5', 'Bf5', 'h4', 'h5', 'c4', 'e6', 'Nc3', 'Nd7'],
  ['e4', 'c6', 'd4', 'd5', 'e5', 'Bf5', 'Nd2', 'e6', 'Nb3', 'Nd7', 'Nf3', 'h6'],
  ['e4', 'c6', 'd4', 'd5', 'e5', 'Bf5', 'Bd3', 'Bxd3', 'Qxd3', 'e6', 'Nf3', 'Qa5+'],
  ['e4', 'c6', 'd4', 'd5', 'e5', 'Bf5', 'c3', 'e6', 'Be3', 'Qb6'],
  ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5', 'Ng3', 'Bg6', 'h4', 'h6', 'Nf3', 'Nd7', 'h5', 'Bh7'],
  ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5', 'Ng3', 'Bg6', 'Nf3', 'Nd7', 'h4', 'h6', 'h5', 'Bh7'],
  ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5', 'Ng3', 'Bg6', 'Bc4', 'e6', 'N1e2', 'Nf6'],
];

// BEGIN_APPROVED_BY_FEN
export const APPROVED_MOVES_BY_FEN = {
  "rn1qkbnr/pp2pppp/2p5/3pPb2/3P2P1/8/PPP2P1P/RNBQKBNR b KQkq -": "Be4",
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P4/2P2N2/PP3PPP/RNBQKB1R b KQkq -": "Nd7",
  "rn1qkbnr/pp2pppp/2p5/2N2b2/3P4/8/PPP2PPP/R1BQKBNR b KQkq -": "b6",
  "rn1qkbnr/pp2pppp/2p5/5b2/3PN3/5Q2/PPP2PPP/R1B1KBNR b KQkq -": "e6",
  "rn1qkbnr/pp2pppp/2p3b1/8/3P4/2P3N1/PP3PPP/R1BQKBNR b KQkq -": "e6",
  "r2qkbnr/pp1npppp/2p3b1/8/3P4/3B1NN1/PPP2PPP/R1BQK2R b KQkq -": "e6",
  "r2qkbnr/pp1npppp/2p3b1/8/2BP4/5NN1/PPP2PPP/R1BQK2R b KQkq -": "e6",
  "r2qkbnr/pp1npppp/2p3b1/8/3P4/5NN1/PPP1BPPP/R1BQK2R b KQkq -": "e6",
  "rn1qkbnr/pp2ppp1/2p3bp/7P/3P4/6N1/PPP2PP1/R1BQKBNR b KQkq -": "Bh7",
  "rn1qkbnr/pp2pppp/2p5/3pP3/3Pb1P1/5P2/PPP4P/RNBQKBNR b KQkq -": "Bg6",
  "rn1qkbnr/p3pppp/1pp5/5b2/3P4/1N6/PPP2PPP/R1BQKBNR b KQkq -": "e6",
  "r2qkbnr/pp1n1ppp/2p1p1b1/8/2BP4/5NN1/PPP2PPP/R1BQ1RK1 b kq -": "Ngf6",
  "rn1qkbnr/pp2pppb/2p4p/7P/3P4/5NN1/PPP2PP1/R1BQKB1R b KQkq -": "Nd7",
  "rn1qkbnr/p4ppp/1pp1p3/5b2/3P4/1N3N2/PPP2PPP/R1BQKB1R b KQkq -": "Bd6",
  "rn1qkbnr/pp2pppp/2p5/3pPb2/2PP4/8/PP3PPP/RNBQKBNR b KQkq -": "e6",
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P4/P4N2/1PP2PPP/RNBQKB1R b KQkq -": "Nd7",
  "r2qkbnr/pp1n1ppp/2p1p3/3pPb2/3P4/2P2N2/PP2BPPP/RNBQK2R b KQkq -": "Ne7",
  "rn1qkbnr/pp3ppp/2p1p3/3pP3/3P4/3Q4/PPP1NPPP/RNB1K2R b KQkq -": "c5",
  "r2qkbnr/pp1nppp1/2p3bp/8/3P3P/3B1NN1/PPP2PP1/R1BQK2R b KQkq -": "Bxd3",
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/2PP4/2N5/PP3PPP/R1BQKBNR b KQkq -": "Ne7",
  "rn1qkbnr/pp2pppp/2p5/3pPb2/3P1P2/8/PPP3PP/RNBQKBNR b KQkq -": "e6",
  "rn1qkbnr/pp2pppp/2p5/3pPb2/3P4/7P/PPP2PP1/RNBQKBNR b KQkq -": "e6",
  "rnbqkbnr/pp2pppp/2p5/8/3Pp3/2N2P2/PPP3PP/R1BQKBNR b KQkq -": "exf3",
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P4/3B1N2/PPP2PPP/RNBQK2R b KQkq -": "Bxd3",
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P4/2N2N2/PPP2PPP/R1BQKB1R b KQkq -": "Nd7",
  "rn1qkbnr/pp3ppp/2p1p3/3pPbB1/3P4/5N2/PPP2PPP/RN1QKB1R b KQkq -": "Qb6",
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P4/5N1P/PPP2PP1/RNBQKB1R b KQkq -": "h6",
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/2PP4/5N2/PP3PPP/RNBQKB1R b KQkq -": "Ne7",
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P1B2/5N2/PPP2PPP/RN1QKB1R b KQkq -": "Nd7",
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P3N/8/PPP2PPP/RNBQKB1R b KQkq -": "Qxh4",
  "rn1qkbnr/pp2pppp/2p5/3pP3/3P4/3P4/PP3PPP/RNBQK1NR b KQkq -": "e6",
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P4/2NB4/PPP2PPP/R1BQK1NR b KQkq -": "Bxd3",
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P1B2/2N5/PPP2PPP/R2QKBNR b KQkq -": "Bb4",
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P4/P1N5/1PP2PPP/R1BQKBNR b KQkq -": "c5",
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P4/2N4P/PPP2PP1/R1BQKBNR b KQkq -": "Nd7",
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P1P2/2N5/PPP3PP/R1BQKBNR b KQkq -": "h5",
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P1P2/5N2/PPP3PP/RNBQKB1R b KQkq -": "c5",
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P1P2/3B4/PPP3PP/RNBQK1NR b KQkq -": "Nh6",
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P1PP1/8/PPP4P/RNBQKBNR b KQkq -": "Qh4+",
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P4/2PB4/PP3PPP/RNBQK1NR b KQkq -": "Bxd3",
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P4/2P5/PP1N1PPP/R1BQKBNR b KQkq -": "c5",
  "rn1qkbnr/pp2pppp/2p5/3pP3/3Pb1P1/5N2/PPP2P1P/RNBQKB1R b KQkq -": "e6",
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P2P1/7P/PPP2P2/RNBQKBNR b KQkq -": "Bg6",
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P4/P6P/1PP2PP1/RNBQKBNR b KQkq -": "c5",
  "rn1qkbnr/pp3ppp/2p1p3/3PPb2/3P4/8/PP3PPP/RNBQKBNR b KQkq -": "cxd5",
  "rn1qkbnr/pp3ppp/2p1p3/2PpPb2/3P4/8/PP3PPP/RNBQKBNR b KQkq -": "b6",
  "rn1qkbnr/pp2ppp1/2p5/3pPb1p/3P3P/5N2/PPP2PP1/RNBQKB1R b KQkq -": "e6",
  "rn1qkbnr/pp2pppp/2p5/5b2/3PN3/3B4/PPP2PPP/R1BQK1NR b KQkq -": "e6",
  "rn1qkbnr/pp2pppp/2p5/5b2/3PN3/5P2/PPP3PP/R1BQKBNR b KQkq -": "e6",
  "rn1qkbnr/pp2pppp/2p5/5b2/3P4/2N5/PPP2PPP/R1BQKBNR b KQkq -": "Nf6",
  "rn1qkbnr/pp2pppp/2p5/5bN1/3P4/8/PPP2PPP/R1BQKBNR b KQkq -": "e6",
  "rn1qkbnr/pp2pppp/2p5/5b2/3PN3/3Q4/PPP2PPP/R1B1KBNR b KQkq -": "e6",
  "rnbqkbnr/pp2pppp/2p5/8/3P4/2N2N2/PPP3PP/R1BQKB1R b KQkq -": "Nf6",
  "rnbqkbnr/pp2pppp/2p5/8/3P4/2N2Q2/PPP3PP/R1B1KBNR b KQkq -": "Nf6",
  "rn1qkbnr/pp3ppp/2p1p3/3pP3/3P4/3P1N2/PP3PPP/RNBQK2R b KQkq -": "Ne7",
  "r2qkbnr/pp1n1ppp/2p1p3/3pPb2/3P4/2NB1N2/PPP2PPP/R1BQK2R b KQkq -": "Bxd3",
  "r2qkbnr/pp1n1ppp/2p1p3/3pPbB1/3P4/2N2N2/PPP2PPP/R2QKB1R b KQkq -": "Be7",
  "r2qkbnr/pp1n1ppp/2p1p3/3pPb2/3P1B2/2N2N2/PPP2PPP/R2QKB1R b KQkq -": "Bb4",
  "r2qkbnr/pp1n1ppp/2p1p3/3pPb2/3P4/2N2N2/PPP1BPPP/R1BQK2R b KQkq -": "Ne7",
  "r2qkbnr/pp1n1ppp/2p1p3/3pPb2/3P4/2N2N1P/PPP2PP1/R1BQKB1R b KQkq -": "h6",
  "r2qkbnr/pp1n1ppp/2p1p3/3pPb2/3P4/2N1BN2/PPP2PPP/R2QKB1R b KQkq -": "Ne7",
  "r2qkbnr/pp1n1ppp/2p1p3/3pPb2/3P4/P1N2N2/1PP2PPP/R1BQKB1R b KQkq -": "c5",
  "r2qkbnr/pp1n1ppp/2p1p3/3pPb2/3P3N/2N5/PPP2PPP/R1BQKB1R b KQkq -": "Qxh4",
  "r2qkbnr/pp1n1ppp/2p1p3/3pPb2/3P4/2N2NP1/PPP2P1P/R1BQKB1R b KQkq -": "c5",
  "rn2kbnr/pp3ppp/1qp1p3/3pPbB1/3P4/1P3N2/P1P2PPP/RN1QKB1R b KQkq -": "c5",
  "rn2kbnr/pp3ppp/1qp1p3/3pPbB1/3P4/2N2N2/PPP2PPP/R2QKB1R b KQkq -": "Qxb2",
  "r2qkbnr/pp1n1ppp/2p1p3/3pPb2/3P4/2PB1N2/PP3PPP/RNBQK2R b KQkq -": "Bxd3",
  "r2qkbnr/pp1n1ppp/2p1p3/3pPbB1/3P4/2P2N2/PP3PPP/RN1QKB1R b KQkq -": "Be7",
  "r2qkbnr/pp1n1ppp/2p1p3/3pPb2/3P4/2P2N2/PP1N1PPP/R1BQKB1R b KQkq -": "Ne7",
  "rn1qkbnr/pp3pp1/2p1p2p/3pPb2/3P4/3B1N1P/PPP2PP1/RNBQK2R b KQkq -": "Bxd3",
  "rn1qkbnr/pp3pp1/2p1p2p/3pPb2/3P2P1/5N1P/PPP2P2/RNBQKB1R b KQkq -": "Bh7",
  "rn1qkbnr/pp3pp1/2p1p2p/3pPb2/3P4/2N2N1P/PPP2PP1/R1BQKB1R b KQkq -": "Nd7",
  "rn1qkbnr/pp3pp1/2p1p2p/3pPb2/3P4/P4N1P/1PP2PP1/RNBQKB1R b KQkq -": "c5",
  "rn1qkb1r/pp2nppp/2p1p3/3pPb2/2PP4/2N2N2/PP3PPP/R1BQKB1R b KQkq -": "Nd7",
  "rn1qkb1r/pp2nppp/2p1p3/3PPb2/3P4/5N2/PP3PPP/RNBQKB1R b KQkq -": "Nxd5",
  "rn1qkb1r/pp2nppp/2p1p3/2PpPb2/3P4/5N2/PP3PPP/RNBQKB1R b KQkq -": "Ng6",
  "r2qkbnr/pp1n1ppp/2p1p3/3pPb2/3P1B2/3B1N2/PPP2PPP/RN1QK2R b KQkq -": "Bxd3",
  "rn2kbnr/pp3ppp/2p1p3/3pPb2/3P3q/6P1/PPP2P1P/RNBQKB1R b KQkq -": "Qe4+",
  "rn1qkbnr/pp3ppp/2p1p3/3pP3/3P1P2/3Q4/PPP3PP/RNB1K1NR b KQkq -": "c5",
  "rn1qkbnr/pp3ppp/2p1p3/3pP3/3P4/2NQ4/PPP2PPP/R1B1K1NR b KQkq -": "c5",
  "rn1qkbnr/pp3ppp/2p1p3/3pP3/3P4/2PQ4/PP3PPP/RNB1K1NR b KQkq -": "c5",
  "rn1qkbnr/pp3ppp/2p1p3/3pP3/2PP4/3Q4/PP3PPP/RNB1K1NR b KQkq -": "dxc4",
  "rn1qkbnr/pp3ppp/2p1p3/3pP3/3P4/P2Q4/1PP2PPP/RNB1K1NR b KQkq -": "c5",
  "rn1qkbnr/pp3ppp/4p3/2ppPb2/3P1P2/2P2N2/PP4PP/RNBQKB1R b KQkq -": "Nc6",
  "rn1qkbnr/pp3ppp/4p3/2ppPb2/3P1P2/3B1N2/PPP3PP/RNBQK2R b KQkq -": "Nh6",
  "rn1qkbnr/pp3ppp/4p3/1BppPb2/3P1P2/5N2/PPP3PP/RNBQK2R b KQkq -": "Nc6",
  "rn2kbnr/pp3ppp/2p1p3/3pPb2/3P1PPq/8/PPPK3P/RNBQ1BNR b kq -": "Be4",
  "rn1qkbnr/pp2pppp/2p3b1/3pP3/3P2PP/5P2/PPP5/RNBQKBNR b KQkq -": "h5",
  "rn1qkbnr/pp2pppp/2p3b1/3pP3/3P1PP1/8/PPP4P/RNBQKBNR b KQkq -": "e6",
  "rn1qkbnr/pp2pppp/2p3b1/3pP3/3P2P1/3B1P2/PPP4P/RNBQK1NR b KQkq -": "Bxd3",
  "rn1qkbnr/p4ppp/1pp1p3/2PpPb2/1P1P4/8/P4PPP/RNBQKBNR b KQkq -": "a5",
  "rn1qkbnr/pp3ppp/2p1p3/5b2/3PN3/3B1N2/PPP2PPP/R1BQK2R b KQkq -": "Nd7",
  "rn1qkbnr/pp3ppp/2p1p3/5b2/3PNB2/3B4/PPP2PPP/R2QK1NR b KQkq -": "Nf6",
  "rn1qkbnr/pp3ppp/2p1p3/5b2/3PN3/2PB4/PP3PPP/R1BQK1NR b KQkq -": "Nd7",
  "rn1qkbnr/pp3ppp/2p1p3/5bB1/3PN3/3B4/PPP2PPP/R2QK1NR b KQkq -": "Qxd4",
  "rn1qkbnr/pp3ppp/2p1p3/5b2/3PN3/3BB3/PPP2PPP/R2QK1NR b KQkq -": "Nf6",
  "rn1qkbnr/pp3ppp/2p1p3/2N2b2/3P4/3B4/PPP2PPP/R1BQK1NR b KQkq -": "Qxd4",
  "rn1qkbnr/pp3ppp/2p1p3/5b2/3P4/3B2N1/PPP2PPP/R1BQK1NR b KQkq -": "Bxd3",
  "rn1qkbnr/pp3ppp/2p1p3/5b2/3PN1P1/3B4/PPP2P1P/R1BQK1NR b KQkq -": "Bg6",
  "rn1qkbnr/pp2pppp/2p3b1/8/3P4/3B2N1/PPP2PPP/R1BQK1NR b KQkq -": "Qxd4",
  "rn1qkbnr/pp3ppp/2p1p3/5b2/3PN1P1/5P2/PPP4P/R1BQKBNR b KQkq -": "Bxe4",
  "rn1qkbnr/pp3ppp/2p1p3/5b2/3PNB2/5P2/PPP3PP/R2QKBNR b KQkq -": "Nf6",
  "rn1qkbnr/pp3ppp/2p1p3/5b2/2BPN3/5P2/PPP3PP/R1BQK1NR b KQkq -": "Bxe4",
  "rn1qkbnr/pp3ppp/2p1p3/5b2/3PN3/3B1P2/PPP3PP/R1BQK1NR b KQkq -": "Qxd4",
  "rn1qkbnr/pp3ppp/2p1p3/5bB1/3PN3/5P2/PPP3PP/R2QKBNR b KQkq -": "Be7",
  "rn1qkbnr/pp3ppp/2p1p3/5b2/3PN3/5P2/PPP1N1PP/R1BQKB1R b KQkq -": "Nf6",
  "rn1qkbnr/pp3ppp/2p1p3/5b2/3PN3/4BP2/PPP3PP/R2QKBNR b KQkq -": "Nd7",
  "rn1qkbnr/pp3ppp/2p1p3/5b2/3PN3/2P2P2/PP4PP/R1BQKBNR b KQkq -": "Bxe4",
  "rn1qkb1r/pp2pppp/2p2n2/5b2/3P4/2N2N2/PPP2PPP/R1BQKB1R b KQkq -": "e6",
  "rn1qkb1r/pp2pppp/2p2n2/5b2/3P4/2NB4/PPP2PPP/R1BQK1NR b KQkq -": "Bxd3",
  "rn1qkb1r/pp2pppp/2p2n2/5b2/2BP4/2N5/PPP2PPP/R1BQK1NR b KQkq -": "e6",
  "rn1qkb1r/pp2pppp/2p2n2/5bB1/3P4/2N5/PPP2PPP/R2QKBNR b KQkq -": "e6",
  "rn1qkb1r/pp2pppp/2p2n2/5b2/3P1B2/2N5/PPP2PPP/R2QKBNR b KQkq -": "e6",
  "rn1qkbnr/pp3ppp/2p1p3/5bN1/3P4/5N2/PPP2PPP/R1BQKB1R b KQkq -": "h6",
  "rn1qkbnr/pp3Npp/2p1p3/5b2/3P4/8/PPP2PPP/R1BQKBNR b KQkq -": "Kxf7",
  "rn1qkbnr/pp3ppp/2p1p3/5bN1/2BP4/8/PPP2PPP/R1BQK1NR b KQkq -": "Be7",
  "rn1qkbnr/pp3ppp/2p1p3/5bN1/3P4/3B4/PPP2PPP/R1BQK1NR b KQkq -": "Qxd4",
  "rn1qkbnr/pN2pppp/1pp5/5b2/3P4/8/PPP2PPP/R1BQKBNR b KQkq -": "Qc7",
  "rn1qkbnr/p3pppp/1pp5/5b2/3P4/3N4/PPP2PPP/R1BQKBNR b KQkq -": "Qxd4",
  "rn1qkbnr/pp3ppp/2p1p3/5b2/3PN3/3B1Q2/PPP2PPP/R1B1K1NR b KQkq -": "Qxd4",
  "rn1qkbnr/pp3ppp/2p1p3/5b2/3PN3/4BQ2/PPP2PPP/R3KBNR b KQkq -": "Nd7",
  "rn1qkbnr/pp3ppp/2p1p3/5b2/3PN3/2P2Q2/PP3PPP/R1B1KBNR b KQkq -": "Nd7",
  "rn1qkbnr/pp3ppp/2p1p3/5b2/3PNB2/5Q2/PPP2PPP/R3KBNR b KQkq -": "Qxd4",
  "rn1qkbnr/pp3ppp/2p1p3/5bB1/3PN3/5Q2/PPP2PPP/R3KBNR b KQkq -": "Bxe4",
  "rn1qkbnr/pp3ppp/2p1p3/5b2/2BPN3/5Q2/PPP2PPP/R1B1K1NR b KQkq -": "Qxd4",
  "rn1qkbnr/pp3ppp/2p1p3/5b2/3PN3/3Q1N2/PPP2PPP/R1B1KB1R b KQkq -": "Nd7",
  "rn1qkbnr/pp3ppp/2p1p3/5b2/3PNB2/3Q4/PPP2PPP/R3KBNR b KQkq -": "Nd7",
  "rnbqkb1r/pp2pppp/2p2n2/8/2BP4/2N2N2/PPP3PP/R1BQK2R b KQkq -": "Bf5",
  "rnbqkb1r/pp2pppp/2p2n2/8/3P4/2NB1N2/PPP3PP/R1BQK2R b KQkq -": "Bg4",
  "rnbqkb1r/pp2pppp/2p2n2/6B1/3P4/2N2N2/PPP3PP/R2QKB1R b KQkq -": "Bg4",
  "rn2kbnr/pp3ppp/2p1p3/q2pP3/3P4/3Q1N2/PPPB1PPP/RN2K2R b KQkq -": "Qb5",
  "rn2kbnr/pp3ppp/2p1p3/q2pP3/3P4/2PQ1N2/PP3PPP/RNB1K2R b KQkq -": "Qa6",
  "rn2kbnr/pp3ppp/2p1p3/q2pP3/3P4/2NQ1N2/PPP2PPP/R1B1K2R b KQkq -": "Qa6",
  "rn1qkb1r/pp2nppp/2p1p3/3pP3/3P4/3P1N2/PP3PPP/RNBQ1RK1 b kq -": "Nf5",
  "r2qkbnr/pp1n1ppp/2p1p3/3pP3/3P4/2NQ1N2/PPP2PPP/R1B1K2R b KQkq -": "Ne7",
  "r2qkbnr/pp1n1ppp/2p1p3/3pP3/3P4/2NP1N2/PP3PPP/R1BQK2R b KQkq -": "Ne7",
  "r2qk1nr/pp1nBppp/2p1p3/3pPb2/3P4/2N2N2/PPP2PPP/R2QKB1R b KQkq -": "Nxe7",
  "r2qk1nr/pp1nbppp/2p1p3/3pPb2/3P1B2/2N2N2/PPP2PPP/R2QKB1R b KQkq -": "Qb6",
  "r2qk1nr/pp1nbppp/2p1p3/3pPbB1/3P4/2N2N2/PPPQ1PPP/R3KB1R b KQkq -": "Bxg5",
  "r2qk1nr/pp1nbppp/2p1p3/3pPbB1/3P3P/2N2N2/PPP2PP1/R2QKB1R b KQkq -": "h6",
  "r2qk1nr/pp1n1ppp/2p1p3/3pPb2/1b1P1B2/2N2N2/PPPQ1PPP/R3KB1R b KQkq -": "Ne7",
  "r2qk1nr/pp1n1ppp/2p1p3/3pPb2/1b1P1B2/2NB1N2/PPP2PPP/R2QK2R b KQkq -": "Bxd3",
  "r2qk1nr/pp1n1ppp/2p1p3/3pPb2/1b1P1B2/P1N2N2/1PP2PPP/R2QKB1R b KQkq -": "Bxc3+",
  "r2qkb1r/pp1nnppp/2p1p3/3pPb2/3P4/2N2N2/PPP1BPPP/R1BQ1RK1 b kq -": "h6",
  "rn2kbnr/pp3ppp/1q2p3/2ppPbB1/3P4/1PP2N2/P4PPP/RN1QKB1R b KQkq -": "Nc6",
  "rn2kbnr/pp3ppp/1q2p3/2ppPbB1/3P4/1PN2N2/P1P2PPP/R2QKB1R b KQkq -": "Bg4",
  "r2qkb1r/pp1nnppp/2p1p3/3pPbB1/3P4/5N2/PPP1BPPP/RN1Q1RK1 b kq -": "Qb6",
  "r2qkbnr/pp1n1ppp/2p1p3/3pP3/3P4/2PQ1N2/PP3PPP/RNB1K2R b KQkq -": "Ne7",
  "rn1qkbnr/pp3pp1/2p1p2p/3pP3/3P4/3Q1N1P/PPP2PP1/RNB1K2R b KQkq -": "Nd7",
  "r2qkbnr/pp1n1ppp/2p1p3/3pP3/3P1B2/3Q1N2/PPP2PPP/RN2K2R b KQkq -": "c5",
  "rn1qkbnr/pp3ppp/4p3/2ppP3/3P1P2/2PQ4/PP4PP/RNB1K1NR b KQkq -": "Nc6",
  "rn1qkbnr/pp3ppp/4p3/2ppP3/3P4/2NQ1N2/PPP2PPP/R1B1K2R b KQkq -": "Nc6",
  "rn1qkbnr/pp3ppp/4p3/2PpP3/8/2NQ4/PPP2PPP/R1B1K1NR b KQkq -": "Bxc5",
  "rn1qkbnr/pp3ppp/4p3/1QppP3/3P4/2N5/PPP2PPP/R1B1K1NR b KQkq -": "Qd7",
  "rn1qkbnr/pp3ppp/4p3/2ppP3/3P4/2NQB3/PPP2PPP/R3K1NR b KQkq -": "Nc6",
  "rn1qkbnr/pp3ppp/4p3/2ppP3/3P4/2PQ1N2/PP3PPP/RNB1K2R b KQkq -": "Nc6",
  "rn1qkbnr/pp3ppp/2p1p3/4P3/2QP4/8/PP3PPP/RNB1K1NR b KQkq -": "Nd7",
  "r2qkbnr/pp3ppp/2n1p3/1BppPb2/3P1P2/2P2N2/PP4PP/RNBQK2R b KQkq -": "Qb6",
  "r2qkbnr/pp3ppp/2n1p3/2ppPb2/3P1P2/2PB1N2/PP4PP/RNBQK2R b KQkq -": "Bxd3",
  "rn1qkbnr/pp2ppp1/2p3b1/3pP1Pp/3P3P/5P2/PPP5/RNBQKBNR b KQkq -": "e6",
  "r2qkbnr/pp1n1ppp/2p1p3/5b2/3PN3/3B1N2/PPP2PPP/R1BQ1RK1 b kq -": "Ngf6",
  "r2qkbnr/pp1n1ppp/2p1p3/5b2/3PNB2/3B1N2/PPP2PPP/R2QK2R b KQkq -": "Ngf6",
  "r2qkbnr/pp1n1ppp/2p1p3/5bB1/3PN3/3B1N2/PPP2PPP/R2QK2R b KQkq -": "Ngf6",
  "rn1qkb1r/pp3ppp/2p1pN2/5b2/3P1B2/3B4/PPP2PPP/R2QK1NR b KQkq -": "Qxf6",
  "r2qkbnr/pp1n1ppp/2p1p3/5b2/3PN3/2PB1N2/PP3PPP/R1BQK2R b KQkq -": "Ngf6",
  "rn1qkb1r/pp3ppp/2p1pN2/5b2/3P4/3BB3/PPP2PPP/R2QK1NR b KQkq -": "Qxf6",
  "rn1qkbnr/pp3ppp/2p1p3/8/3P4/3Q2N1/PPP2PPP/R1B1K1NR b KQkq -": "Nf6",
  "r2qkbnr/pp1npppp/2p3b1/8/3P4/2P2NN1/PP3PPP/R1BQKB1R b KQkq -": "e6",
  "r2qkbnr/pp1npppp/2p3b1/8/3P3N/6N1/PPP2PPP/R1BQKB1R b KQkq -": "e6",
  "r2qkbnr/pp1npppp/2p3b1/8/3P1B2/5NN1/PPP2PPP/R2QKB1R b KQkq -": "e6",
  "rn1qkbnr/pp3ppp/2p1p1b1/8/2BP4/5NN1/PPP2PPP/R1BQK2R b KQkq -": "Nd7",
  "rn1qkbnr/pp3ppp/2p1p1b1/8/3P4/2PB2N1/PP3PPP/R1BQK1NR b KQkq -": "Nf6",
  "rn1qkbnr/pp3ppp/2p1p1b1/8/3P4/2P2NN1/PP3PPP/R1BQKB1R b KQkq -": "Nd7",
  "rn1qkbnr/pp3ppp/2p1p3/8/3PP1P1/8/PPP4P/R1BQKBNR b KQkq -": "Qh4+",
  "rn1qkb1r/pp3ppp/2p1pN2/5b2/3P1B2/5P2/PPP3PP/R2QKBNR b KQkq -": "Qxf6",
  "rn1qkb1r/pp3ppp/2p1pn2/5b2/3PNB2/3B1P2/PPP3PP/R2QK1NR b KQkq -": "Qxd4",
  "rn1qkbnr/pp3ppp/2p1p3/8/2BPP3/8/PPP3PP/R1BQK1NR b KQkq -": "Qh4+",
  "rn2kbnr/pp3ppp/2p1p3/5b2/3qN3/3B1P2/PPP1N1PP/R1BQK2R b KQkq -": "Qb6",
  "rn1qk1nr/pp2Bppp/2p1p3/5b2/3PN3/5P2/PPP3PP/R2QKBNR b KQkq -": "Nxe7",
  "rn1qkb1r/pp3ppp/2p1pN2/5b2/3P4/5P2/PPP1N1PP/R1BQKB1R b KQkq -": "Qxf6",
  "rn1qkbnr/pp3ppp/2p1p3/8/3PP3/2P5/PP4PP/R1BQKBNR b KQkq -": "Qh4+",
  "rn1qkb1r/pp3ppp/2p1pn2/5b2/3P4/2NB1N2/PPP2PPP/R1BQK2R b KQkq -": "Bxd3",
  "rn1qkb1r/pp3ppp/2p1pn2/5bB1/3P4/2N2N2/PPP2PPP/R2QKB1R b KQkq -": "Be7",
  "rn1qkb1r/pp3ppp/2p1pn2/5b2/2BP4/2N2N2/PPP2PPP/R1BQK2R b KQkq -": "Nbd7",
  "rn1qkb1r/pp3ppp/2p1pn2/5b2/3P1B2/2N2N2/PPP2PPP/R2QKB1R b KQkq -": "Bd6",
  "rn1qkb1r/pp2pppp/2p2n2/8/3P4/2NQ4/PPP2PPP/R1B1K1NR b KQkq -": "e6",
  "rn1qkbnr/pp3Np1/2p1p2p/5b2/3P4/5N2/PPP2PPP/R1BQKB1R b KQkq -": "Kxf7",
  "rn1qkbnr/pp3pp1/2p1p2p/5b2/3P4/5N1N/PPP2PPP/R1BQKB1R b KQkq -": "Nf6",
  "rn1q1bnr/pp3kpp/2p1p3/5b2/3P4/5N2/PPP2PPP/R1BQKB1R b KQ -": "Nf6",
  "rn2kbnr/pp3ppp/2p1p3/5b2/3qN3/3B1Q2/PPP1NPPP/R1B1K2R b KQkq -": "Bxe4",
  "rn1qkb1r/pp2pppp/2p2n2/5b2/2BP4/2N2N2/PPP3PP/R1BQ1RK1 b kq -": "e6",
  "rn1qkb1r/pp2pppp/2p2n2/8/3P2b1/2NB1N2/PPP3PP/R1BQ1RK1 b kq -": "e6",
  "rn2kbnr/pp3ppp/Q1p1p3/3pP3/3P4/2P2N2/PP3PPP/RNB1K2R b KQkq -": "Nxa6",
  "rn2kbnr/pp3ppp/Q1p1p3/3pP3/3P4/2N2N2/PPP2PPP/R1B1K2R b KQkq -": "Nxa6",
  "r2qkb1r/pp1nnppp/2p1p3/3pP1B1/3P4/2NQ1N2/PPP2PPP/R3K2R b KQkq -": "h6",
  "r2qkb1r/pp1nnppp/2p1p3/3pP3/3P4/2NQ1N2/PPP2PPP/R1B2RK1 b kq -": "c5",
  "r2qk2r/pp1nnppp/2p1p3/3pPb2/3P4/2NB1N2/PPP2PPP/R2QK2R b KQkq -": "O-O",
  "r2qk1nr/pp1n1ppp/2p1p3/3pPb2/3P1B2/P1P2N2/2P2PPP/R2QKB1R b KQkq -": "Ne7",
  "r2qkb1r/pp1nnppp/2p1p3/3pP3/3P4/2PQ1N2/PP3PPP/RNB2RK1 b kq -": "c5",
  "r2qkb1r/pp1nnppp/2p1p3/3pP1B1/3P4/2PQ1N2/PP3PPP/RN2K2R b KQkq -": "Qb6",
  "r2qkbnr/pp1n1pp1/2p1p2p/3pP3/3P4/3Q1N1P/PPP2PP1/RNB2RK1 b kq -": "Ne7",
  "r2qkbnr/pp3ppp/2n1p3/2ppP3/3P1P2/2PQ1N2/PP4PP/RNB1K2R b KQkq -": "Nh6",
  "r2qkbnr/pp3ppp/2n1p3/2ppP3/3P4/2PQ1N2/PP3PPP/RNB2RK1 b kq -": "cxd4",
  "rn1qkbnr/pp3pp1/2p1p1b1/3pP1Pp/3P1P1P/8/PPP5/RNBQKBNR b KQkq -": "Ne7",
  "r2qkb1r/pp1n1ppp/2p1pN2/5b2/3P4/3B1N2/PPP2PPP/R1BQ1RK1 b kq -": "Qxf6",
  "rn2kb1r/pp3ppp/2p1pq2/5b2/3P4/3BBN2/PPP2PPP/R2QK2R b KQkq -": "Bxd3",
  "rn1qkb1r/pp3ppp/2p1pn2/8/3P4/3Q1NN1/PPP2PPP/R1B1K2R b KQkq -": "Nbd7",
  "rn1qkb1r/pp3ppp/2p1pn2/6B1/3P4/3Q2N1/PPP2PPP/R3K1NR b KQkq -": "Be7",
  "rn1qkbnr/pp2pppb/2p4p/7P/3P4/3B2N1/PPP2PP1/R1BQK1NR b KQkq -": "Bxd3",
  "rn2kbnr/pp3ppp/2p1p3/8/3PP1Pq/8/PPPK3P/R1BQ1BNR b kq -": "Nf6",
  "rn2kbnr/pp3ppp/2p1p3/8/2BPP2q/6P1/PPP4P/R1BQK1NR b KQkq -": "Qxe4+",
  "rn1qkb1r/pp3ppp/2p1pn2/8/3P4/2NQ1N2/PPP2PPP/R1B1K2R b KQkq -": "Nbd7",
  "rn1qk2r/pp2bppp/2p1pn2/5bB1/3P4/2NB1N2/PPP2PPP/R2QK2R b KQkq -": "Bxd3",
  "r2qkb1r/pp1n1ppp/2p1pn2/5b2/2BP4/2N2N2/PPP2PPP/R1BQ1RK1 b kq -": "Bd6",
  "rn1q1bnr/pp3kp1/2p1p2p/4Nb2/3P4/8/PPP2PPP/R1BQKB1R b KQ -": "Ke8",
  "rn1q1bnr/pp3kp1/2p1p2p/5b2/2BP4/5N2/PPP2PPP/R1BQK2R b KQ -": "Nd7"
};

export const APPROVED_META_BY_FEN = {
  "rn1qkbnr/pp2pppp/2p5/3pPb2/3P2P1/8/PPP2P1P/RNBQKBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 357
  },
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P4/2P2N2/PP3PPP/RNBQKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 161
  },
  "rn1qkbnr/pp2pppp/2p5/2N2b2/3P4/8/PPP2PPP/R1BQKBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 681
  },
  "rn1qkbnr/pp2pppp/2p5/5b2/3PN3/5Q2/PPP2PPP/R1B1KBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 153
  },
  "rn1qkbnr/pp2pppp/2p3b1/8/3P4/2P3N1/PP3PPP/R1BQKBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 76
  },
  "r2qkbnr/pp1npppp/2p3b1/8/3P4/3B1NN1/PPP2PPP/R1BQK2R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 704
  },
  "r2qkbnr/pp1npppp/2p3b1/8/2BP4/5NN1/PPP2PPP/R1BQK2R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 153
  },
  "r2qkbnr/pp1npppp/2p3b1/8/3P4/5NN1/PPP1BPPP/R1BQK2R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 51
  },
  "rn1qkbnr/pp2ppp1/2p3bp/7P/3P4/6N1/PPP2PP1/R1BQKBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 517
  },
  "rn1qkbnr/pp2pppp/2p5/3pP3/3Pb1P1/5P2/PPP4P/RNBQKBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 162
  },
  "rn1qkbnr/p3pppp/1pp5/5b2/3P4/1N6/PPP2PPP/R1BQKBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 272
  },
  "r2qkbnr/pp1n1ppp/2p1p1b1/8/2BP4/5NN1/PPP2PPP/R1BQ1RK1 b kq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 133
  },
  "rn1qkbnr/pp2pppb/2p4p/7P/3P4/5NN1/PPP2PP1/R1BQKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 481
  },
  "rn1qkbnr/p4ppp/1pp1p3/5b2/3P4/1N3N2/PPP2PPP/R1BQKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 170
  },
  "rn1qkbnr/pp2pppp/2p5/3pPb2/2PP4/8/PP3PPP/RNBQKBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 773
  },
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P4/P4N2/1PP2PPP/RNBQKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 254
  },
  "r2qkbnr/pp1n1ppp/2p1p3/3pPb2/3P4/2P2N2/PP2BPPP/RNBQK2R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 123
  },
  "rn1qkbnr/pp3ppp/2p1p3/3pP3/3P4/3Q4/PPP1NPPP/RNB1K2R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 126
  },
  "r2qkbnr/pp1nppp1/2p3bp/8/3P3P/3B1NN1/PPP2PP1/R1BQK2R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 461
  },
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/2PP4/2N5/PP3PPP/R1BQKBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 687
  },
  "rn1qkbnr/pp2pppp/2p5/3pPb2/3P1P2/8/PPP3PP/RNBQKBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 26
  },
  "rn1qkbnr/pp2pppp/2p5/3pPb2/3P4/7P/PPP2PP1/RNBQKBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 1
  },
  "rnbqkbnr/pp2pppp/2p5/8/3Pp3/2N2P2/PPP3PP/R1BQKBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 24
  },
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P4/3B1N2/PPP2PPP/RNBQK2R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 34
  },
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P4/2N2N2/PPP2PPP/R1BQKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 29
  },
  "rn1qkbnr/pp3ppp/2p1p3/3pPbB1/3P4/5N2/PPP2PPP/RN1QKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P4/5N1P/PPP2PP1/RNBQKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/2PP4/5N2/PP3PPP/RNBQKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 30
  },
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P1B2/5N2/PPP2PPP/RN1QKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P3N/8/PPP2PPP/RNBQKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp2pppp/2p5/3pP3/3P4/3P4/PP3PPP/RNBQK1NR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 11
  },
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P4/2NB4/PPP2PPP/R1BQK1NR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 21
  },
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P1B2/2N5/PPP2PPP/R2QKBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P4/P1N5/1PP2PPP/R1BQKBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 1
  },
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P4/2N4P/PPP2PP1/R1BQKBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P1P2/2N5/PPP3PP/R1BQKBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P1P2/5N2/PPP3PP/RNBQKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 31
  },
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P1P2/3B4/PPP3PP/RNBQK1NR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P1PP1/8/PPP4P/RNBQKBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P4/2PB4/PP3PPP/RNBQK1NR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 15
  },
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P4/2P5/PP1N1PPP/R1BQKBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 4
  },
  "rn1qkbnr/pp2pppp/2p5/3pP3/3Pb1P1/5N2/PPP2P1P/RNBQKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 5
  },
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P2P1/7P/PPP2P2/RNBQKBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp3ppp/2p1p3/3pPb2/3P4/P6P/1PP2PP1/RNBQKBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 1
  },
  "rn1qkbnr/pp3ppp/2p1p3/3PPb2/3P4/8/PP3PPP/RNBQKBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 1
  },
  "rn1qkbnr/pp3ppp/2p1p3/2PpPb2/3P4/8/PP3PPP/RNBQKBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp2ppp1/2p5/3pPb1p/3P3P/5N2/PPP2PP1/RNBQKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 8
  },
  "rn1qkbnr/pp2pppp/2p5/5b2/3PN3/3B4/PPP2PPP/R1BQK1NR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 22
  },
  "rn1qkbnr/pp2pppp/2p5/5b2/3PN3/5P2/PPP3PP/R1BQKBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp2pppp/2p5/5b2/3P4/2N5/PPP2PPP/R1BQKBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 4
  },
  "rn1qkbnr/pp2pppp/2p5/5bN1/3P4/8/PPP2PPP/R1BQKBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 4
  },
  "rn1qkbnr/pp2pppp/2p5/5b2/3PN3/3Q4/PPP2PPP/R1B1KBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rnbqkbnr/pp2pppp/2p5/8/3P4/2N2N2/PPP3PP/R1BQKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 13
  },
  "rnbqkbnr/pp2pppp/2p5/8/3P4/2N2Q2/PPP3PP/R1B1KBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp3ppp/2p1p3/3pP3/3P4/3P1N2/PP3PPP/RNBQK2R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 4
  },
  "r2qkbnr/pp1n1ppp/2p1p3/3pPb2/3P4/2NB1N2/PPP2PPP/R1BQK2R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 7
  },
  "r2qkbnr/pp1n1ppp/2p1p3/3pPbB1/3P4/2N2N2/PPP2PPP/R2QKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkbnr/pp1n1ppp/2p1p3/3pPb2/3P1B2/2N2N2/PPP2PPP/R2QKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkbnr/pp1n1ppp/2p1p3/3pPb2/3P4/2N2N2/PPP1BPPP/R1BQK2R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 8
  },
  "r2qkbnr/pp1n1ppp/2p1p3/3pPb2/3P4/2N2N1P/PPP2PP1/R1BQKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkbnr/pp1n1ppp/2p1p3/3pPb2/3P4/2N1BN2/PPP2PPP/R2QKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 3
  },
  "r2qkbnr/pp1n1ppp/2p1p3/3pPb2/3P4/P1N2N2/1PP2PPP/R1BQKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 1
  },
  "r2qkbnr/pp1n1ppp/2p1p3/3pPb2/3P3N/2N5/PPP2PPP/R1BQKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkbnr/pp1n1ppp/2p1p3/3pPb2/3P4/2N2NP1/PPP2P1P/R1BQKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn2kbnr/pp3ppp/1qp1p3/3pPbB1/3P4/1P3N2/P1P2PPP/RN1QKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn2kbnr/pp3ppp/1qp1p3/3pPbB1/3P4/2N2N2/PPP2PPP/R2QKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkbnr/pp1n1ppp/2p1p3/3pPb2/3P4/2PB1N2/PP3PPP/RNBQK2R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 5
  },
  "r2qkbnr/pp1n1ppp/2p1p3/3pPbB1/3P4/2P2N2/PP3PPP/RN1QKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkbnr/pp1n1ppp/2p1p3/3pPb2/3P4/2P2N2/PP1N1PPP/R1BQKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 2
  },
  "rn1qkbnr/pp3pp1/2p1p2p/3pPb2/3P4/3B1N1P/PPP2PP1/RNBQK2R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp3pp1/2p1p2p/3pPb2/3P2P1/5N1P/PPP2P2/RNBQKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp3pp1/2p1p2p/3pPb2/3P4/2N2N1P/PPP2PP1/R1BQKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp3pp1/2p1p2p/3pPb2/3P4/P4N1P/1PP2PP1/RNBQKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkb1r/pp2nppp/2p1p3/3pPb2/2PP4/2N2N2/PP3PPP/R1BQKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 54
  },
  "rn1qkb1r/pp2nppp/2p1p3/3PPb2/3P4/5N2/PP3PPP/RNBQKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkb1r/pp2nppp/2p1p3/2PpPb2/3P4/5N2/PP3PPP/RNBQKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkbnr/pp1n1ppp/2p1p3/3pPb2/3P1B2/3B1N2/PPP2PPP/RN1QK2R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn2kbnr/pp3ppp/2p1p3/3pPb2/3P3q/6P1/PPP2P1P/RNBQKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp3ppp/2p1p3/3pP3/3P1P2/3Q4/PPP3PP/RNB1K1NR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 9
  },
  "rn1qkbnr/pp3ppp/2p1p3/3pP3/3P4/2NQ4/PPP2PPP/R1B1K1NR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 26
  },
  "rn1qkbnr/pp3ppp/2p1p3/3pP3/3P4/2PQ4/PP3PPP/RNB1K1NR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 31
  },
  "rn1qkbnr/pp3ppp/2p1p3/3pP3/2PP4/3Q4/PP3PPP/RNB1K1NR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 3
  },
  "rn1qkbnr/pp3ppp/2p1p3/3pP3/3P4/P2Q4/1PP2PPP/RNB1K1NR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp3ppp/4p3/2ppPb2/3P1P2/2P2N2/PP4PP/RNBQKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 2
  },
  "rn1qkbnr/pp3ppp/4p3/2ppPb2/3P1P2/3B1N2/PPP3PP/RNBQK2R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 1
  },
  "rn1qkbnr/pp3ppp/4p3/1BppPb2/3P1P2/5N2/PPP3PP/RNBQK2R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn2kbnr/pp3ppp/2p1p3/3pPb2/3P1PPq/8/PPPK3P/RNBQ1BNR b kq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp2pppp/2p3b1/3pP3/3P2PP/5P2/PPP5/RNBQKBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 30
  },
  "rn1qkbnr/pp2pppp/2p3b1/3pP3/3P1PP1/8/PPP4P/RNBQKBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 8
  },
  "rn1qkbnr/pp2pppp/2p3b1/3pP3/3P2P1/3B1P2/PPP4P/RNBQK1NR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/p4ppp/1pp1p3/2PpPb2/1P1P4/8/P4PPP/RNBQKBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp3ppp/2p1p3/5b2/3PN3/3B1N2/PPP2PPP/R1BQK2R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 7
  },
  "rn1qkbnr/pp3ppp/2p1p3/5b2/3PNB2/3B4/PPP2PPP/R2QK1NR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp3ppp/2p1p3/5b2/3PN3/2PB4/PP3PPP/R1BQK1NR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp3ppp/2p1p3/5bB1/3PN3/3B4/PPP2PPP/R2QK1NR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp3ppp/2p1p3/5b2/3PN3/3BB3/PPP2PPP/R2QK1NR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp3ppp/2p1p3/2N2b2/3P4/3B4/PPP2PPP/R1BQK1NR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp3ppp/2p1p3/5b2/3P4/3B2N1/PPP2PPP/R1BQK1NR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp3ppp/2p1p3/5b2/3PN1P1/3B4/PPP2P1P/R1BQK1NR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp2pppp/2p3b1/8/3P4/3B2N1/PPP2PPP/R1BQK1NR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 1
  },
  "rn1qkbnr/pp3ppp/2p1p3/5b2/3PN1P1/5P2/PPP4P/R1BQKBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp3ppp/2p1p3/5b2/3PNB2/5P2/PPP3PP/R2QKBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp3ppp/2p1p3/5b2/2BPN3/5P2/PPP3PP/R1BQK1NR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp3ppp/2p1p3/5b2/3PN3/3B1P2/PPP3PP/R1BQK1NR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp3ppp/2p1p3/5bB1/3PN3/5P2/PPP3PP/R2QKBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp3ppp/2p1p3/5b2/3PN3/5P2/PPP1N1PP/R1BQKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp3ppp/2p1p3/5b2/3PN3/4BP2/PPP3PP/R2QKBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp3ppp/2p1p3/5b2/3PN3/2P2P2/PP4PP/R1BQKBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkb1r/pp2pppp/2p2n2/5b2/3P4/2N2N2/PPP2PPP/R1BQKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 5
  },
  "rn1qkb1r/pp2pppp/2p2n2/5b2/3P4/2NB4/PPP2PPP/R1BQK1NR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkb1r/pp2pppp/2p2n2/5b2/2BP4/2N5/PPP2PPP/R1BQK1NR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 1
  },
  "rn1qkb1r/pp2pppp/2p2n2/5bB1/3P4/2N5/PPP2PPP/R2QKBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkb1r/pp2pppp/2p2n2/5b2/3P1B2/2N5/PPP2PPP/R2QKBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp3ppp/2p1p3/5bN1/3P4/5N2/PPP2PPP/R1BQKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp3Npp/2p1p3/5b2/3P4/8/PPP2PPP/R1BQKBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp3ppp/2p1p3/5bN1/2BP4/8/PPP2PPP/R1BQK1NR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp3ppp/2p1p3/5bN1/3P4/3B4/PPP2PPP/R1BQK1NR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pN2pppp/1pp5/5b2/3P4/8/PPP2PPP/R1BQKBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/p3pppp/1pp5/5b2/3P4/3N4/PPP2PPP/R1BQKBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp3ppp/2p1p3/5b2/3PN3/3B1Q2/PPP2PPP/R1B1K1NR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 17
  },
  "rn1qkbnr/pp3ppp/2p1p3/5b2/3PN3/4BQ2/PPP2PPP/R3KBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 5
  },
  "rn1qkbnr/pp3ppp/2p1p3/5b2/3PN3/2P2Q2/PP3PPP/R1B1KBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 37
  },
  "rn1qkbnr/pp3ppp/2p1p3/5b2/3PNB2/5Q2/PPP2PPP/R3KBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp3ppp/2p1p3/5bB1/3PN3/5Q2/PPP2PPP/R3KBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp3ppp/2p1p3/5b2/2BPN3/5Q2/PPP2PPP/R1B1K1NR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp3ppp/2p1p3/5b2/3PN3/3Q1N2/PPP2PPP/R1B1KB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp3ppp/2p1p3/5b2/3PNB2/3Q4/PPP2PPP/R3KBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rnbqkb1r/pp2pppp/2p2n2/8/2BP4/2N2N2/PPP3PP/R1BQK2R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 18
  },
  "rnbqkb1r/pp2pppp/2p2n2/8/3P4/2NB1N2/PPP3PP/R1BQK2R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 14
  },
  "rnbqkb1r/pp2pppp/2p2n2/6B1/3P4/2N2N2/PPP3PP/R2QKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn2kbnr/pp3ppp/2p1p3/q2pP3/3P4/3Q1N2/PPPB1PPP/RN2K2R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 7
  },
  "rn2kbnr/pp3ppp/2p1p3/q2pP3/3P4/2PQ1N2/PP3PPP/RNB1K2R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 9
  },
  "rn2kbnr/pp3ppp/2p1p3/q2pP3/3P4/2NQ1N2/PPP2PPP/R1B1K2R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 1
  },
  "rn1qkb1r/pp2nppp/2p1p3/3pP3/3P4/3P1N2/PP3PPP/RNBQ1RK1 b kq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 2
  },
  "r2qkbnr/pp1n1ppp/2p1p3/3pP3/3P4/2NQ1N2/PPP2PPP/R1B1K2R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 4
  },
  "r2qkbnr/pp1n1ppp/2p1p3/3pP3/3P4/2NP1N2/PP3PPP/R1BQK2R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qk1nr/pp1nBppp/2p1p3/3pPb2/3P4/2N2N2/PPP2PPP/R2QKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qk1nr/pp1nbppp/2p1p3/3pPb2/3P1B2/2N2N2/PPP2PPP/R2QKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qk1nr/pp1nbppp/2p1p3/3pPbB1/3P4/2N2N2/PPPQ1PPP/R3KB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qk1nr/pp1nbppp/2p1p3/3pPbB1/3P3P/2N2N2/PPP2PP1/R2QKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qk1nr/pp1n1ppp/2p1p3/3pPb2/1b1P1B2/2N2N2/PPPQ1PPP/R3KB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qk1nr/pp1n1ppp/2p1p3/3pPb2/1b1P1B2/2NB1N2/PPP2PPP/R2QK2R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qk1nr/pp1n1ppp/2p1p3/3pPb2/1b1P1B2/P1N2N2/1PP2PPP/R2QKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkb1r/pp1nnppp/2p1p3/3pPb2/3P4/2N2N2/PPP1BPPP/R1BQ1RK1 b kq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 15
  },
  "rn2kbnr/pp3ppp/1q2p3/2ppPbB1/3P4/1PP2N2/P4PPP/RN1QKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn2kbnr/pp3ppp/1q2p3/2ppPbB1/3P4/1PN2N2/P1P2PPP/R2QKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkb1r/pp1nnppp/2p1p3/3pPbB1/3P4/5N2/PPP1BPPP/RN1Q1RK1 b kq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkbnr/pp1n1ppp/2p1p3/3pP3/3P4/2PQ1N2/PP3PPP/RNB1K2R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp3pp1/2p1p2p/3pP3/3P4/3Q1N1P/PPP2PP1/RNB1K2R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkbnr/pp1n1ppp/2p1p3/3pP3/3P1B2/3Q1N2/PPP2PPP/RN2K2R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp3ppp/4p3/2ppP3/3P1P2/2PQ4/PP4PP/RNB1K1NR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 2
  },
  "rn1qkbnr/pp3ppp/4p3/2ppP3/3P4/2NQ1N2/PPP2PPP/R1B1K2R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 2
  },
  "rn1qkbnr/pp3ppp/4p3/2PpP3/8/2NQ4/PPP2PPP/R1B1K1NR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 1
  },
  "rn1qkbnr/pp3ppp/4p3/1QppP3/3P4/2N5/PPP2PPP/R1B1K1NR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp3ppp/4p3/2ppP3/3P4/2NQB3/PPP2PPP/R3K1NR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 1
  },
  "rn1qkbnr/pp3ppp/4p3/2ppP3/3P4/2PQ1N2/PP3PPP/RNB1K2R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 6
  },
  "rn1qkbnr/pp3ppp/2p1p3/4P3/2QP4/8/PP3PPP/RNB1K1NR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 3
  },
  "r2qkbnr/pp3ppp/2n1p3/1BppPb2/3P1P2/2P2N2/PP4PP/RNBQK2R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkbnr/pp3ppp/2n1p3/2ppPb2/3P1P2/2PB1N2/PP4PP/RNBQK2R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp2ppp1/2p3b1/3pP1Pp/3P3P/5P2/PPP5/RNBQKBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkbnr/pp1n1ppp/2p1p3/5b2/3PN3/3B1N2/PPP2PPP/R1BQ1RK1 b kq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 4
  },
  "r2qkbnr/pp1n1ppp/2p1p3/5b2/3PNB2/3B1N2/PPP2PPP/R2QK2R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 2
  },
  "r2qkbnr/pp1n1ppp/2p1p3/5bB1/3PN3/3B1N2/PPP2PPP/R2QK2R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkb1r/pp3ppp/2p1pN2/5b2/3P1B2/3B4/PPP2PPP/R2QK1NR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkbnr/pp1n1ppp/2p1p3/5b2/3PN3/2PB1N2/PP3PPP/R1BQK2R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkb1r/pp3ppp/2p1pN2/5b2/3P4/3BB3/PPP2PPP/R2QK1NR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp3ppp/2p1p3/8/3P4/3Q2N1/PPP2PPP/R1B1K1NR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkbnr/pp1npppp/2p3b1/8/3P4/2P2NN1/PP3PPP/R1BQKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 8
  },
  "r2qkbnr/pp1npppp/2p3b1/8/3P3N/6N1/PPP2PPP/R1BQKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 22
  },
  "r2qkbnr/pp1npppp/2p3b1/8/3P1B2/5NN1/PPP2PPP/R2QKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 26
  },
  "rn1qkbnr/pp3ppp/2p1p1b1/8/2BP4/5NN1/PPP2PPP/R1BQK2R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 38
  },
  "rn1qkbnr/pp3ppp/2p1p1b1/8/3P4/2PB2N1/PP3PPP/R1BQK1NR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 1
  },
  "rn1qkbnr/pp3ppp/2p1p1b1/8/3P4/2P2NN1/PP3PPP/R1BQKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 8
  },
  "rn1qkbnr/pp3ppp/2p1p3/8/3PP1P1/8/PPP4P/R1BQKBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkb1r/pp3ppp/2p1pN2/5b2/3P1B2/5P2/PPP3PP/R2QKBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkb1r/pp3ppp/2p1pn2/5b2/3PNB2/3B1P2/PPP3PP/R2QK1NR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp3ppp/2p1p3/8/2BPP3/8/PPP3PP/R1BQK1NR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn2kbnr/pp3ppp/2p1p3/5b2/3qN3/3B1P2/PPP1N1PP/R1BQK2R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qk1nr/pp2Bppp/2p1p3/5b2/3PN3/5P2/PPP3PP/R2QKBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkb1r/pp3ppp/2p1pN2/5b2/3P4/5P2/PPP1N1PP/R1BQKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp3ppp/2p1p3/8/3PP3/2P5/PP4PP/R1BQKBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkb1r/pp3ppp/2p1pn2/5b2/3P4/2NB1N2/PPP2PPP/R1BQK2R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 1
  },
  "rn1qkb1r/pp3ppp/2p1pn2/5bB1/3P4/2N2N2/PPP2PPP/R2QKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 1
  },
  "rn1qkb1r/pp3ppp/2p1pn2/5b2/2BP4/2N2N2/PPP2PPP/R1BQK2R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 1
  },
  "rn1qkb1r/pp3ppp/2p1pn2/5b2/3P1B2/2N2N2/PPP2PPP/R2QKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkb1r/pp2pppp/2p2n2/8/3P4/2NQ4/PPP2PPP/R1B1K1NR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp3Np1/2p1p2p/5b2/3P4/5N2/PPP2PPP/R1BQKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp3pp1/2p1p2p/5b2/3P4/5N1N/PPP2PPP/R1BQKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1q1bnr/pp3kpp/2p1p3/5b2/3P4/5N2/PPP2PPP/R1BQKB1R b KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn2kbnr/pp3ppp/2p1p3/5b2/3qN3/3B1Q2/PPP1NPPP/R1B1K2R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 4
  },
  "rn1qkb1r/pp2pppp/2p2n2/5b2/2BP4/2N2N2/PPP3PP/R1BQ1RK1 b kq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 12
  },
  "rn1qkb1r/pp2pppp/2p2n2/8/3P2b1/2NB1N2/PPP3PP/R1BQ1RK1 b kq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 4
  },
  "rn2kbnr/pp3ppp/Q1p1p3/3pP3/3P4/2P2N2/PP3PPP/RNB1K2R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 9
  },
  "rn2kbnr/pp3ppp/Q1p1p3/3pP3/3P4/2N2N2/PPP2PPP/R1B1K2R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 3
  },
  "r2qkb1r/pp1nnppp/2p1p3/3pP1B1/3P4/2NQ1N2/PPP2PPP/R3K2R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 2
  },
  "r2qkb1r/pp1nnppp/2p1p3/3pP3/3P4/2NQ1N2/PPP2PPP/R1B2RK1 b kq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 12
  },
  "r2qk2r/pp1nnppp/2p1p3/3pPb2/3P4/2NB1N2/PPP2PPP/R2QK2R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qk1nr/pp1n1ppp/2p1p3/3pPb2/3P1B2/P1P2N2/2P2PPP/R2QKB1R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkb1r/pp1nnppp/2p1p3/3pP3/3P4/2PQ1N2/PP3PPP/RNB2RK1 b kq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 1
  },
  "r2qkb1r/pp1nnppp/2p1p3/3pP1B1/3P4/2PQ1N2/PP3PPP/RN2K2R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 1
  },
  "r2qkbnr/pp1n1pp1/2p1p2p/3pP3/3P4/3Q1N1P/PPP2PP1/RNB2RK1 b kq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkbnr/pp3ppp/2n1p3/2ppP3/3P1P2/2PQ1N2/PP4PP/RNB1K2R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 1
  },
  "r2qkbnr/pp3ppp/2n1p3/2ppP3/3P4/2PQ1N2/PP3PPP/RNB2RK1 b kq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 6
  },
  "rn1qkbnr/pp3pp1/2p1p1b1/3pP1Pp/3P1P1P/8/PPP5/RNBQKBNR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkb1r/pp1n1ppp/2p1pN2/5b2/3P4/3B1N2/PPP2PPP/R1BQ1RK1 b kq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn2kb1r/pp3ppp/2p1pq2/5b2/3P4/3BBN2/PPP2PPP/R2QK2R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkb1r/pp3ppp/2p1pn2/8/3P4/3Q1NN1/PPP2PPP/R1B1K2R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkb1r/pp3ppp/2p1pn2/6B1/3P4/3Q2N1/PPP2PPP/R3K1NR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp2pppb/2p4p/7P/3P4/3B2N1/PPP2PP1/R1BQK1NR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 21
  },
  "rn2kbnr/pp3ppp/2p1p3/8/3PP1Pq/8/PPPK3P/R1BQ1BNR b kq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn2kbnr/pp3ppp/2p1p3/8/2BPP2q/6P1/PPP4P/R1BQK1NR b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkb1r/pp3ppp/2p1pn2/8/3P4/2NQ1N2/PPP2PPP/R1B1K2R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 1
  },
  "rn1qk2r/pp2bppp/2p1pn2/5bB1/3P4/2NB1N2/PPP2PPP/R2QK2R b KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkb1r/pp1n1ppp/2p1pn2/5b2/2BP4/2N2N2/PPP2PPP/R1BQ1RK1 b kq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1q1bnr/pp3kp1/2p1p2p/4Nb2/3P4/8/PPP2PPP/R1BQKB1R b KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1q1bnr/pp3kp1/2p1p2p/5b2/2BP4/5N2/PPP2PPP/R1BQK2R b KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  }
};
// END_APPROVED_BY_FEN

export const AI_COMMENTS_UNVERIFIED_BY_FEN = {
  'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq -':
    "1...c6 prepara la spinta centrale ...d5 al tratto successivo mantenendo aperta la diagonale per lo sviluppo dell'alfiere camposcuro.",
  'rnbqkbnr/pp1ppppp/2p5/8/3PP3/8/PPP2PPP/RNBQKBNR b KQkq -':
    "Con 2...d5 contestiamo subito il centro del Bianco mantenendo libera la diagonale c8-h3.",
  'rnbqkbnr/pp2pppp/2p5/3pP3/3P4/8/PPP2PPP/RNBQKBNR b KQkq -':
    "Nella Variante di Spinta giochiamo 3...Bf5 per sviluppare l'alfiere fuori dalla catena di pedoni prima di consolidare con ...e6.",
  'rnbqkbnr/pp2pppp/2p5/3p4/3PP3/2N5/PPP2PPP/R1BQKBNR b KQkq -':
    "Con 3...dxe4 apriamo la colonna d e prepariamo lo sviluppo attivo dell'alfiere camposcuro nella Variante Classica.",
  'rnbqkbnr/pp2pppp/2p5/3p4/3PP3/8/PPPN1PPP/R1BQKBNR b KQkq -':
    'Anche contro 3.Nd2 semplifichiamo al centro per rientrare nella struttura della Variante Classica.',
  'rnbqkbnr/pp2pppp/2p5/8/3PN3/8/PPP2PPP/R1BQKBNR b KQkq -':
    "4...Bf5 sviluppa attivamente l'alfiere camposcuro fuori dalla catena di pedoni prima di chiudere con ...e6.",
};

export const ARROWS_BY_FEN = {
  'rnbqkbnr/pp2pppp/2p5/3pP3/3P4/8/PPP2PPP/RNBQKBNR b KQkq -': [
    ['c8', 'f5', '#f59e0b'],
    ['e7', 'e6', '#38bdf8'],
  ],
  'rnbqkbnr/pp2pppp/2p5/8/3PN3/8/PPP2PPP/R1BQKBNR b KQkq -': [
    ['c8', 'f5', '#f59e0b'],
    ['f5', 'g6', '#38bdf8'],
  ],
};

export function getInitialSeedFensSet() {
  const set = new Set();
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
        set.add(normFen);
      }
    }
  }
  return set;
}

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
        map.set(normFen, { san: m.san, source: 'seed' });
      }
    }
  }

  for (const [normFen, san] of Object.entries(APPROVED_MOVES_BY_FEN)) {
    const meta = APPROVED_META_BY_FEN[normFen] || {};
    map.set(normFen, {
      san,
      source: meta.source || 'accepted_proposal',
      selectionRule: meta.selectionRule || 'masters_freq',
      acceptedVia: meta.acceptedVia || 'manual',
    });
  }

  return map;
}
