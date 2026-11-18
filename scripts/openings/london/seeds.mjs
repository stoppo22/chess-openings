import { Chess } from 'chess.js';
import { normalizeFen } from '../../lib/fen.mjs';
import { OPENING_CONFIG, SEED_LINES } from './config.mjs';

const PLAYER_TURN = OPENING_CONFIG.playerColor === 'white' ? 'w' : 'b';

// BEGIN_APPROVED_BY_FEN
export const APPROVED_MOVES_BY_FEN = {
  "rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR w KQkq -": "Bf4",
  "rnbqkb1r/pppppppp/5n2/8/3P4/8/PPP1PPPP/RNBQKBNR w KQkq -": "Bf4",
  "rnbqkbnr/ppp1pppp/3p4/8/3P4/8/PPP1PPPP/RNBQKBNR w KQkq -": "Bf4",
  "rnbqkbnr/pppp1ppp/4p3/8/3P4/8/PPP1PPPP/RNBQKBNR w KQkq -": "Bf4",
  "rnbqkbnr/pppp1ppp/8/4p3/3P4/8/PPP1PPPP/RNBQKBNR w KQkq -": "dxe5",
  "rn1qkbnr/ppp1pppp/8/3p1b2/3P1B2/8/PPP1PPPP/RN1QKBNR w KQkq -": "e3",
  "r1bqkb1r/pppppppp/2n2n2/8/3P1B2/8/PPP1PPPP/RN1QKBNR w KQkq -": "e3",
  "rnbqkb1r/ppp1pppp/5n2/3p4/3P1B2/8/PPP1PPPP/RN1QKBNR w KQkq -": "e3",
  "rnbqkb1r/pp1ppppp/5n2/2p5/3P1B2/8/PPP1PPPP/RN1QKBNR w KQkq -": "e3",
  "r1bqkbnr/ppp1pppp/2n5/3p4/3P1B2/8/PPP1PPPP/RN1QKBNR w KQkq -": "e3",
  "rnbqkb1r/ppp1pppp/3p1n2/8/3P1B2/8/PPP1PPPP/RN1QKBNR w KQkq -": "e3",
  "rnbqkb1r/pppppp1p/5np1/8/3P1B2/8/PPP1PPPP/RN1QKBNR w KQkq -": "e3",
  "rnbqkbnr/pp2pppp/2p5/3p4/3P1B2/8/PPP1PPPP/RN1QKBNR w KQkq -": "e3",
  "rnbqkb1r/pppp1ppp/4pn2/8/3P1B2/8/PPP1PPPP/RN1QKBNR w KQkq -": "e3",
  "rnbqkbnr/ppp1p1pp/5p2/3p4/3P1B2/8/PPP1PPPP/RN1QKBNR w KQkq -": "e3",
  "rnbqkbnr/ppp2ppp/4p3/3p4/3P1B2/8/PPP1PPPP/RN1QKBNR w KQkq -": "e3",
  "rnbqkbnr/pp2pppp/8/2pp4/3P1B2/8/PPP1PPPP/RN1QKBNR w KQkq -": "e3",
  "r1bqkbnr/ppp2ppp/2n5/3pp3/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "dxe5",
  "rn1qkb1r/ppp1pppp/5n2/3p4/3P1Bb1/4P3/PPP2PPP/RN1QKBNR w KQkq -": "Nf3",
  "rnbqkb1r/1pp1pppp/p4n2/3p4/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "Nf3",
  "rnbqkb1r/ppp1pppp/8/3p4/3PnB2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "Nf3",
  "r1bqkbnr/1pp1pppp/p1n5/3p4/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "Nf3",
  "rnbqkbnr/pp3ppp/4p3/2pp4/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "c3",
  "rnbqk1nr/ppp2ppp/4p3/3p4/1b1P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "c3",
  "rnbqkbnr/1pp2ppp/p3p3/3p4/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "Nf3",
  "rnbqkbnr/pp3ppp/2p1p3/3p4/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "Nf3",
  "rnbqkbnr/ppp2p1p/4p3/3p2p1/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "Bg3",
  "rnbqkbnr/ppp2pp1/4p2p/3p4/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "Nf3",
  "rn1qkbnr/1pp1pppp/p7/3p1b2/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "Nf3",
  "rnbqkbnr/pp2pppp/8/3p4/3p1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "exd4",
  "rnbqkbnr/ppp3pp/5p2/3pp3/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "dxe5",
  "rnbqkbnr/ppp1p2p/5p2/3p2p1/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "Qh5+",
  "r1bqkbnr/ppp1p1pp/2n2p2/3p4/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "Nf3",
  "r1bqkb1r/pppp1ppp/2n1pn2/8/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "Nf3",
  "rnbqk2r/pppp1ppp/4pn2/8/1b1P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "c3",
  "r1bqkb1r/ppp1pppp/2n2n2/3p4/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "Nf3",
  "rnbqkb1r/ppp2ppp/3ppn2/8/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "Nf3",
  "rnbqkb1r/pppp1p1p/4pnp1/8/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "Nf3",
  "rnbqkb1r/pppp1ppp/4p3/8/3PnB2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "Bd3",
  "rnbqkb1r/pppp1ppp/4p3/3n4/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "Bg3",
  "r1bqkb1r/ppp1pppp/2np1n2/8/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "Nf3",
  "rnbqkb1r/ppp2ppp/3p1n2/4p3/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "dxe5",
  "rnbqkb1r/pp2pppp/2pp1n2/8/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "Nf3",
  "r1bqkb1r/pppnpppp/3p1n2/8/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "Nf3",
  "rn1qkb1r/ppp1pppp/3p1n2/5b2/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "Nf3",
  "rn1qkb1r/ppp1pppp/3p1n2/8/3P1Bb1/4P3/PPP2PPP/RN1QKBNR w KQkq -": "Nf3",
  "rnbqkb1r/pp2pppp/3p1n2/2p5/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "c3",
  "r1bqkb1r/pppp1ppp/2n2n2/4p3/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "dxe5",
  "r1bqkb1r/pppppppp/2n5/8/3PnB2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "Bd3",
  "r1bqkb1r/pppppp1p/2n2np1/8/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "Nf3",
  "rnbqkb1r/pp1ppppp/5n2/8/3p1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "exd4",
  "rnb1kb1r/pp1ppppp/1q3n2/2p5/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "Nf3",
  "r1bqkb1r/pp1ppppp/2n2n2/2p5/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "d5",
  "rn1qkb1r/ppp1pppp/5n2/3p1b2/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "Nf3",
  "rnbqkb1r/pp2pppp/5n2/2pp4/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "c3",
  "rnbqkb1r/pp2pppp/2p2n2/3p4/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "Bd3",
  "r1bqkbnr/ppp2ppp/2n1p3/3p4/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "Nf3",
  "rnbqkb1r/pp1p1ppp/4pn2/2p5/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "c3",
  "rnbqk2r/ppppbppp/4pn2/8/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "Bd3",
  "rn1qkbnr/ppp2ppp/4p3/3p1b2/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "Nf3",
  "r1bqkbnr/pp2pppp/2n5/2pp4/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "c3",
  "rn1qkbnr/pp2pppp/2p5/3p1b2/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "Nf3",
  "rnbqkb1r/p1pp1ppp/1p2pn2/8/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "Nf3",
  "r2qkbnr/ppp1pppp/2n5/3p1b2/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "Bd3",
  "rnbqk2r/pppp1ppp/3bpn2/8/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "Bg3",
  "rnbqkb1r/ppp2ppp/4pn2/3p4/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "Nf3",
  "rnbqkb1r/ppp1pp1p/5np1/3p4/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "Nf3",
  "rnbqk2r/ppppppbp/5np1/8/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "Nf3",
  "rnbqk1nr/ppp2ppp/3bp3/3p4/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "Bg3",
  "rnbqkb1r/ppp1pp1p/3p1np1/8/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "Nf3",
  "r2qkb1r/ppp1pppp/2n2n2/3p4/3P1Bb1/4PN2/PPP2PPP/RN1QKB1R w KQkq -": "Nbd2",
  "r2qkbnr/ppp1pppp/2n5/3p4/3P1B2/3bP3/PPP2PPP/RN1QK1NR w KQkq -": "Qxd3",
  "r2qkbnr/ppp2ppp/2n1p3/3p1b2/3P1B2/3BP3/PPP2PPP/RN1QK1NR w KQkq -": "Bxf5",
  "r3kbnr/pppqpppp/2n5/3p1b2/3P1B2/3BP3/PPP2PPP/RN1QK1NR w KQkq -": "Nf3",
  "r2qkbnr/ppp1pppp/2n3b1/3p4/3P1B2/3BP3/PPP2PPP/RN1QK1NR w KQkq -": "Nf3",
  "r2qkb1r/ppp1pppp/2n2n2/3p1b2/3P1B2/3BP3/PPP2PPP/RN1QK1NR w KQkq -": "Bxf5",
  "r2qkbnr/ppp1pp1p/2n3p1/3p1b2/3P1B2/3BP3/PPP2PPP/RN1QK1NR w KQkq -": "Nf3",
  "r1bqk1nr/ppp2ppp/2nbp3/3p4/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": "Bg3",
  "r1bqk1nr/ppp2ppp/2n1p3/3p4/1b1P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": "c3",
  "r1bqkbnr/ppp3pp/2n2p2/3pp3/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": "dxe5",
  "r2qkbnr/ppp1p1pp/2n2p2/3p4/3P1Bb1/4PN2/PPP2PPP/RN1QKB1R w KQkq -": "Be2",
  "r1bqkbnr/ppp1p2p/2n2p2/3p2p1/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": "Bg3",
  "r1bqkbnr/ppp3pp/2n1pp2/3p4/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": "h3",
  "r2qkbnr/1pp1pppp/p1n5/3p1b2/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": "Bd3",
  "r2qkbnr/1pp1pppp/p1n5/3p4/3P1Bb1/4PN2/PPP2PPP/RN1QKB1R w KQkq -": "Nbd2",
  "r1bqkb1r/ppp2ppp/2n2n2/3pp3/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": "dxe5",
  "rnbqk2r/ppp1bppp/4pn2/3p4/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": "Nbd2",
  "rnbqk2r/ppp2ppp/4pn2/3p4/1b1P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": "c3",
  "rnbqkb1r/ppp2ppp/4p3/3p4/3PnB2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": "Nbd2",
  "rnbqkb1r/ppp2pp1/4pn1p/3p4/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": "c4",
  "rnbqkb1r/1pp2ppp/p3pn2/3p4/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": "Nbd2",
  "r1bqkb1r/pppn1ppp/4pn2/3p4/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": "c3",
  "r1bqkb1r/ppp1pp1p/2n2np1/3p4/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": "h3",
  "rn1qkb1r/ppp1ppp1/5n1p/3p1b2/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": "Bd3",
  "r1bqkb1r/1pp1pppp/p1n2n2/3p4/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": "Nbd2",
  "rn1qkb1r/ppp2ppp/4pn2/3p4/3P1Bb1/4PN2/PPP2PPP/RN1QKB1R w KQkq -": "Nbd2",
  "rn1qkb1r/ppp1pppp/5n2/3p4/3P1B2/4Pb2/PPP2PPP/RN1QKB1R w KQkq -": "Qxf3",
  "rn1qkb1r/pp2pppp/2p2n2/3p4/3P1Bb1/3BP3/PPP2PPP/RN1QK1NR w KQkq -": "Nf3",
  "rnbqkb1r/pp3ppp/2p1pn2/3p4/3P1B2/3BP3/PPP2PPP/RN1QK1NR w KQkq -": "Nf3",
  "rnbqk1nr/ppp2ppp/4p3/3p4/3P4/4P1b1/PPP2PPP/RN1QKBNR w KQkq -": "hxg3",
  "rnbqk2r/ppp2ppp/3bpn2/3p4/3P4/4P1B1/PPP2PPP/RN1QKBNR w KQkq -": "Nf3",
  "r1bqkbnr/pp3ppp/2n1p3/2pp4/3P1B2/2P1P3/PP3PPP/RN1QKBNR w KQkq -": "Nf3",
  "rnbqkbnr/pp3ppp/4p3/3p4/3p1B2/2P1P3/PP3PPP/RN1QKBNR w KQkq -": "exd4",
  "rnbqkbnr/pp3ppp/4p3/3p4/2pP1B2/2P1P3/PP3PPP/RN1QKBNR w KQkq -": "Nf3",
  "r1bqkb1r/ppp1pppp/2n5/3p4/3PnB2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": "Nbd2",
  "rn1qkbnr/pp3ppp/4p3/2pp1b2/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": "Bb5+",
  "rn1qk1nr/ppp2ppp/4p3/3p1b2/1b1P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": "Nbd2",
  "r1bqkbnr/pp2pppp/2n5/3p4/3P1B2/8/PPP2PPP/RN1QKBNR w KQkq -": "c3",
  "rnbqkbnr/ppp3pp/8/3pp3/5B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "Qh5+",
  "rnbq1bnr/pppkp2p/5p2/3p2pQ/3P1B2/4P3/PPP2PPP/RN2KBNR w KQ -": "Bg3",
  "r2qkb1r/ppp1pppp/2n2n2/3p1b2/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": "Nbd2",
  "r1bqk2r/ppppppbp/2n2np1/8/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": "h3",
  "r1bqk2r/pppp1ppp/2n1pn2/8/1b1P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": "c3",
  "rnbqkb1r/pp1p1ppp/4pn2/8/3p1B2/2P1P3/PP3PPP/RN1QKBNR w KQkq -": "exd4",
  "rnbqk2r/pppp1ppp/4pn2/b7/3P1B2/2P1P3/PP3PPP/RN1QKBNR w KQkq -": "Nf3",
  "rnbqk2r/ppppbppp/4pn2/8/3P1B2/2P1P3/PP3PPP/RN1QKBNR w KQkq -": "Bd3",
  "rnbq1rk1/ppppbppp/4pn2/8/3P1B2/3BP3/PPP2PPP/RN1QK1NR w KQ -": "Nf3",
  "rn1qkb1r/pbpp1ppp/1p2pn2/8/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": "Nbd2",
  "rnbqk2r/ppp1bppp/3ppn2/8/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": "h3",
  "rnbqk2r/pppp1pbp/4pnp1/8/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": "h3",
  "r1bqkb1r/ppp2ppp/2np1n2/4p3/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": "dxe5",
  "r2qkb1r/ppp1pppp/2np1n2/8/3P1Bb1/4PN2/PPP2PPP/RN1QKB1R w KQkq -": "Be2",
  "r2qkb1r/ppp1pppp/2np1n2/5b2/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": "Bd3",
  "r1bqkb1r/ppp1pp1p/2np1np1/8/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": "h3",
  "r1bqkb1r/ppp2ppp/2nppn2/8/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": "h3",
  "rnbqkb1r/ppp2ppp/5n2/4p3/5B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": "Qxd8+",
  "r1bqkb1r/pppnpp1p/3p1np1/8/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": "h3",
  "rnbqkb1r/pp2pppp/5n2/3p4/3P1B2/8/PPP2PPP/RN1QKBNR w KQkq -": "c3",
  "r1bqkb1r/pp1ppppp/2n2n2/8/3P1B2/8/PPP2PPP/RN1QKBNR w KQkq -": "c3",
  "rnb1kb1r/pp1ppppp/5n2/2p5/3P1B2/4PN2/PqP2PPP/RN1QKB1R w KQkq -": "Nbd2",
  "rnbqk2r/ppp2ppp/3bpn2/3p4/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": "Bg3",
  "r1bqkb1r/ppp2ppp/2n1pn2/3p4/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": "Nbd2",
  "rn1qk1nr/ppp2ppp/3bp3/3p1b2/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": "Bg3",
  "r1bqkb1r/ppp1ppp1/2n2n1p/3p4/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": "c3",
  "r1bqkb1r/pp1p1ppp/2n1pn2/2p5/3P1B2/2P1P3/PP3PPP/RN1QKBNR w KQkq -": "Nf3",
  "rn1qkb1r/ppp2ppp/4pn2/3p1b2/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": "Bd3",
  "r1bqkb1r/pp2pppp/2n2n2/2pp4/3P1B2/2P1P3/PP3PPP/RN1QKBNR w KQkq -": "Nf3",
  "rn1qkbnr/pp3ppp/2p1p3/3p1b2/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": "Bd3",
  "rnbqk2r/ppp1ppbp/3p1np1/8/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": "h3",
  "rn1qkb1r/1pp1pppp/p4n2/3p1b2/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": "Bd3",
  "rnbqk2r/ppp1ppbp/5np1/3p4/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": "h3",
  "rnbq1rk1/ppppppbp/5np1/8/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQ -": "h3",
  "rnbqkb1r/pp3ppp/4pn2/2pp4/3P1B2/2P1P3/PP3PPP/RN1QKBNR w KQkq -": "Nf3",
  "rnbqkb1r/pp3ppp/4pn2/2pp4/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": "c3",
  "r2qkbnr/ppp2ppp/2n1p3/3p1b2/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": "Bd3",
  "r1bqk2r/ppp2ppp/2n1pn2/3p4/1b1P1B2/4PN2/PPPN1PPP/R2QKB1R w KQkq -": "c3",
  "r2qkb1r/ppp2ppp/2n1pn2/3p1b2/3P1B2/4PN2/PPPN1PPP/R2QKB1R w KQkq -": "Bd3",
  "r2qkb1r/ppp1pppp/5n2/3p1b2/1n1P1B2/4PN2/PPPN1PPP/R2QKB1R w KQkq -": "Bb5+",
  "r2qkb1r/ppp1pppp/2n5/3p1b2/3PnB2/4PN2/PPPN1PPP/R2QKB1R w KQkq -": "Nxe4",
  "r2qkb1r/ppp1ppp1/2n2n1p/3p1b2/3P1B2/4PN2/PPPN1PPP/R2QKB1R w KQkq -": "Bb5",
  "r2qkb1r/ppp2ppp/2n1pn2/3p4/3P1Bb1/4PN2/PPPN1PPP/R2QKB1R w KQkq -": "c3",
  "r2qkb1r/ppp1pppp/2n5/3p4/3PnBb1/4PN2/PPPN1PPP/R2QKB1R w KQkq -": "h3",
  "r2qkb1r/ppp1pppp/2n2n2/3p4/3P1B2/4Pb2/PPPN1PPP/R2QKB1R w KQkq -": "Qxf3",
  "r2qkb1r/ppp2ppp/2n2n2/3pp3/3P1Bb1/4PN2/PPPN1PPP/R2QKB1R w KQkq -": "dxe5",
  "r1bqkb1r/ppp1pppp/2n5/3p4/3P1B2/4PN2/PPPn1PPP/R2QKB1R w KQkq -": "Qxd2",
  "r2qkb1r/1pp1pppp/p1n2n2/3p1b2/3P1B2/4PN2/PPPN1PPP/R2QKB1R w KQkq -": "Bd3",
  "r2qkb1r/1pp1pppp/p1n2n2/3p4/3P1Bb1/4PN2/PPPN1PPP/R2QKB1R w KQkq -": "h3",
  "r1bqkb1r/ppp1pp2/2n2n1p/3p2p1/3P1B2/2P1PN2/PP3PPP/RN1QKB1R w KQkq -": "Bg3",
  "r1bqk2r/ppp1ppbp/2n2np1/3p4/3P1B2/4PN1P/PPP2PP1/RN1QKB1R w KQkq -": "Nbd2",
  "r1bqkb1r/ppp2ppp/2n5/3pP3/4nB2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": "Nbd2",
  "r2qkb1r/ppp1pppp/2n2n2/3p4/3P1B2/3QP3/PPP2PPP/RN2K1NR w KQkq -": "Nf3",
  "r2qkbnr/ppp2ppp/2n1p3/3p4/3P1B2/3QP3/PPP2PPP/RN2K1NR w KQkq -": "Nf3",
  "r2qkbnr/ppp1pppp/8/3p4/1n1P1B2/3QP3/PPP2PPP/RN2K1NR w KQkq -": "Qb5+",
  "r2qkbnr/ppp2ppp/2n5/3p1p2/3P1B2/4P3/PPP2PPP/RN1QK1NR w KQkq -": "h3",
  "2kr1bnr/pppqpppp/2n5/3p1b2/3P1B2/3BPN2/PPP2PPP/RN1QK2R w KQ -": "Bxf5",
  "r2qkb1r/ppp1pppp/2n2nb1/3p4/3P1B2/3BPN2/PPP2PPP/RN1QK2R w KQkq -": "O-O",
  "r2qkbnr/ppp2ppp/2n1p1b1/3p4/3P1B2/3BPN2/PPP2PPP/RN1QK2R w KQkq -": "O-O",
  "r2qkb1r/ppp2ppp/2n1pn2/3p1B2/3P1B2/4P3/PPP2PPP/RN1QK1NR w KQkq -": "Bd3",
  "r1bqk1nr/ppp2ppp/2n1p3/3p4/3P4/4PNb1/PPP2PPP/RN1QKB1R w KQkq -": "hxg3",
  "r1bqk2r/ppp2ppp/2nbpn2/3p4/3P4/4PNB1/PPP2PPP/RN1QKB1R w KQkq -": "Nbd2",
  "r1bqk1nr/ppp2ppp/2n1p3/b2p4/3P1B2/2P1PN2/PP3PPP/RN1QKB1R w KQkq -": "a4",
  "r1bqkbnr/ppp3pp/2n5/3pp3/5B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": "Nxe5",
  "r2qkbnr/ppp1p1pp/2n2p2/3p4/3P1B2/4Pb2/PPP1BPPP/RN1QK2R w KQkq -": "Bxf3",
  "rnbqk2r/ppp2ppp/4pn2/3p4/3P4/4PNb1/PPP2PPP/RN1QKB1R w KQkq -": "hxg3",
  "rnbq1rk1/ppp2ppp/3bpn2/3p4/3P4/4PNB1/PPP2PPP/RN1QKB1R w KQ -": "Nbd2",
  "r2qkb1r/pppb1ppp/2n1pn2/3p4/3P1B2/4PN2/PPPN1PPP/R2QKB1R w KQkq -": "c3",
  "rnbqkb1r/pp3ppp/4pn2/3p4/3p1B2/2P1PN2/PP3PPP/RN1QKB1R w KQkq -": "exd4",
  "rnbqkb1r/pp3ppp/4pn2/3p4/2pP1B2/2P1PN2/PP3PPP/RN1QKB1R w KQkq -": "Nbd2",
  "rnbq1rk1/ppp1bppp/4pn2/3p4/3P1B2/4PN2/PPPN1PPP/R2QKB1R w KQ -": "Bd3",
  "rnbqk2r/ppp2ppp/4pn2/b2p4/3P1B2/2P1PN2/PP3PPP/RN1QKB1R w KQkq -": "Nbd2",
  "rnbqk2r/ppp2ppp/3bpn2/3p4/3P1B2/2P1PN2/PP3PPP/RN1QKB1R w KQkq -": "Bg3",
  "rnbqk2r/ppp2ppp/4p3/3p4/1b1PnB2/4PN2/PPPN1PPP/R2QKB1R w KQkq -": "c3",
  "rn1qkb1r/ppp2ppp/4pn2/3p4/3P1B2/3bPN2/PPP2PPP/RN1QK2R w KQkq -": "Qxd3",
  "rn1qk2r/ppp2ppp/3bpn2/3p1b2/3P1B2/3BPN2/PPP2PPP/RN1QK2R w KQkq -": "Bg3",
  "r1bqkb1r/ppp2pp1/2n1pn1p/3p4/3P1B2/4PN2/PPPN1PPP/R2QKB1R w KQkq -": "c3",
  "rn1qkb1r/ppp2ppp/4p3/3p1b2/3PnB2/3BPN2/PPP2PPP/RN1QK2R w KQkq -": "O-O",
  "rn1qkb1r/ppp2ppp/4pn2/3p4/3P1Bb1/3BPN2/PPP2PPP/RN1QK2R w KQkq -": "Nbd2",
  "rn1qk2r/ppp2ppp/4pn2/3p1b2/1b1P1B2/3BPN2/PPP2PPP/RN1QK2R w KQkq -": "c3",
  "r2qkb1r/pp2pppp/2n2n2/2pp4/3P1Bb1/2P1PN2/PP3PPP/RN1QKB1R w KQkq -": "Nbd2",
  "rnbqk2r/ppp2ppp/4pn2/3p4/3P4/4P1P1/PPP2PP1/RN1QKBNR w KQkq -": "c4",
  "r1bqk1nr/ppp2ppp/2n1p3/3p4/3P4/4P1P1/PPP2PP1/RN1QKBNR w KQkq -": "Nf3",
  "rn1qk1nr/ppp2ppp/4p3/3p1b2/3P4/4PNb1/PPP2PPP/RN1QKB1R w KQkq -": "hxg3",
  "rn1qk2r/ppp2ppp/3bpn2/3p1b2/3P4/4PNB1/PPP2PPP/RN1QKB1R w KQkq -": "Bd3",
  "r2qkbnr/ppp2ppp/2n1p3/3p4/3P1B2/3bPN2/PPP2PPP/RN1QK2R w KQkq -": "Qxd3",
  "r2qkbnr/pp3ppp/2n1p3/1Bpp1b2/3P1B2/4PN2/PPP2PPP/RN1QK2R w KQkq -": "O-O",
  "rnbqkbnr/ppp4p/6p1/3pp2Q/5B2/4P3/PPP2PPP/RN2KBNR w KQkq -": "Qxe5+",
  "r1bqk2r/ppp2ppp/2nbpn2/3p4/3P1B2/4PN2/PPPN1PPP/R2QKB1R w KQkq -": "Bg3",
  "rnbqr1k1/ppppppbp/5np1/8/3P1B2/4PN1P/PPP2PP1/RN1QKB1R w KQ -": "c3",
  "rnbq1rk1/p1ppppbp/1p3np1/8/3P1B2/4PN1P/PPP2PP1/RN1QKB1R w KQ -": "Nbd2",
  "rnbq1rk1/pppp1pbp/4pnp1/8/3P1B2/4PN1P/PPP2PP1/RN1QKB1R w KQ -": "Nbd2",
  "r1bqkb1r/ppp2ppp/2n1p3/3p4/3PnB2/4PN2/PPPN1PPP/R2QKB1R w KQkq -": "Bd3",
  "rnbqk2r/p1p1ppbp/1p1p1np1/8/3P1B2/4PN1P/PPP2PP1/RN1QKB1R w KQkq -": "c4",
  "rn1qk2r/ppp1ppbp/3p1np1/5b2/3P1B2/4PN1P/PPP2PP1/RN1QKB1R w KQkq -": "Bd3",
  "rnbqk2r/pp2ppbp/2pp1np1/8/3P1B2/4PN1P/PPP2PP1/RN1QKB1R w KQkq -": "Nbd2",
  "r1bqk2r/pppp1ppp/2n1pn2/b7/3P1B2/2P1PN2/PP3PPP/RN1QKB1R w KQkq -": "Bd3",
  "r1bqkb1r/ppp2ppp/2n2n2/4p3/5B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": "Qxd8+",
  "r2qkb1r/ppp1pppp/2np1n2/8/3P1B2/4Pb2/PPP1BPPP/RN1QK2R w KQkq -": "Bxf3",
  "rnbk1b1r/ppp2ppp/5n2/4p3/5B2/4P3/PPP2PPP/RN2KBNR w KQ -": "Bxe5",
  "rnbqk2r/ppp2ppp/3bp3/3p4/3Pn3/4PNB1/PPP2PPP/RN1QKB1R w KQkq -": "Nbd2",
  "rnbq1rk1/ppp1ppbp/5np1/3p4/3P1B2/4PN1P/PPP2PP1/RN1QKB1R w KQ -": "Nbd2",
  "rnbq1rk1/ppp1ppbp/3p1np1/8/3P1B2/4PN1P/PPP2PP1/RN1QKB1R w KQ -": "c3",
  "r1bqk2r/ppp1bppp/2n1pn2/3p4/3P1B2/4PN2/PPPN1PPP/R2QKB1R w KQkq -": "c3",
  "r1bqkb1r/1pp2ppp/p1n1pn2/3p4/3P1B2/4PN2/PPPN1PPP/R2QKB1R w KQkq -": "c3",
  "rn1qkb1r/ppp2ppp/4pnb1/3p4/3P1B2/3BPN2/PPP2PPP/RN1QK2R w KQkq -": "O-O",
  "r1bqkb1r/ppp2p1p/2n1pnp1/3p4/3P1B2/4PN2/PPPN1PPP/R2QKB1R w KQkq -": "c3",
  "r2qkb1r/ppp2ppp/2n1pn2/3p1b2/3P1B2/3BPN2/PPP2PPP/RN1QK2R w KQkq -": "O-O",
  "r1bq1rk1/ppppppbp/2n2np1/8/3P1B2/4PN1P/PPP2PP1/RN1QKB1R w KQ -": "c3",
  "r1bqk2r/ppp1ppbp/2np1np1/8/3P1B2/4PN1P/PPP2PP1/RN1QKB1R w KQkq -": "Bg3",
  "r1bqk2r/pppnppbp/3p1np1/8/3P1B2/4PN1P/PPP2PP1/RN1QKB1R w KQkq -": "Nbd2",
  "r1bqkb1r/pp3ppp/2n1pn2/2pp4/3P1B2/2P1PN2/PP3PPP/RN1QKB1R w KQkq -": "Nbd2",
  "r1bq1rk1/ppp2ppp/2nbpn2/3p4/3P4/4PNB1/PPPN1PPP/R2QKB1R w KQ -": "c3",
  "r2qk2r/ppp2ppp/2n1pn2/3p1b2/1b1P1B2/3BPN2/PPPN1PPP/R2QK2R w KQkq -": "O-O",
  "r2qk2r/ppp2ppp/2nbpn2/3p1b2/3P1B2/3BPN2/PPPN1PPP/R2QK2R w KQkq -": "Bxf5",
  "r2qkb1r/pp2pppp/2p2n2/1B1p1b2/1n1P1B2/4PN2/PPPN1PPP/R2QK2R w KQkq -": "Ba4",
  "r2qkb1r/ppp1pppp/2n5/3p4/3PbB2/4PN2/PPP2PPP/R2QKB1R w KQkq -": "Bb5",
  "r2qkb1r/ppp1pppp/2n5/5b2/3PpB2/4PN2/PPP2PPP/R2QKB1R w KQkq -": "Ne5",
  "r2qk2r/ppp2ppp/2nbpn2/3p4/3P1Bb1/2P1PN2/PP1N1PPP/R2QKB1R w KQkq -": "Bg3",
  "r2qk2r/ppp1bppp/2n1pn2/3p4/3P1Bb1/2P1PN2/PP1N1PPP/R2QKB1R w KQkq -": "Bd3",
  "r2qkb1r/ppp2ppp/2n1p3/3p4/3PnBb1/2P1PN2/PP1N1PPP/R2QKB1R w KQkq -": "Nxe4",
  "r2qkb1r/ppp1pppp/2n5/3p4/3PnB2/4Pb1P/PPPN1PP1/R2QKB1R w KQkq -": "Nxf3",
  "r2qkb1r/ppp1pppp/2n5/3p4/3P1Bb1/4PN1P/PPPn1PP1/R2QKB1R w KQkq -": "hxg4",
  "r2qkb1r/ppp1pppp/2n5/3p3b/3PnB2/4PN1P/PPPN1PP1/R2QKB1R w KQkq -": "Bd3",
  "r2qkb1r/ppp2ppp/2n1pn2/3p4/3P1B2/4PQ2/PPPN1PPP/R3KB1R w KQkq -": "c3",
  "r2qkb1r/1pp1pppp/p1n2n2/3p4/3P1B2/3bPN2/PPPN1PPP/R2QK2R w KQkq -": "cxd3",
  "r1bq1rk1/ppp1ppbp/2n2np1/3p4/3P1B2/4PN1P/PPPN1PP1/R2QKB1R w KQ -": "c3",
  "r2qkb1r/ppp2ppp/2n1pn2/3p4/3P1B2/3QPN2/PPP2PPP/RN2K2R w KQkq -": "O-O",
  "r2qkb1r/ppp1pppp/5n2/3p4/1n1P1B2/3QPN2/PPP2PPP/RN2K2R w KQkq -": "Qb5+",
  "r2qkbnr/ppp2ppp/4p3/3p4/1n1P1B2/3QPN2/PPP2PPP/RN2K2R w KQkq -": "Qb5+",
  "r2qk1nr/ppp2ppp/2nbp3/3p4/3P1B2/3QPN2/PPP2PPP/RN2K2R w KQkq -": "Bg3",
  "r2qkbnr/ppp1pppp/2n5/1Q1p4/3P1B2/4P3/PPP2PPP/RN2K1NR w KQkq -": "Qxb7",
  "2kr1bnr/ppp1pppp/2n5/3p1q2/3P1B2/4PN2/PPP2PPP/RN1QK2R w KQ -": "Bg3",
  "r1bqk2r/ppp2ppp/2n1pn2/3p4/3P4/4PNP1/PPP2PP1/RN1QKB1R w KQkq -": "Bd3",
  "r1bqkbnr/ppp3pp/8/3pn3/5B2/4P3/PPP2PPP/RN1QKB1R w KQkq -": "Bxe5",
  "r2qkbnr/ppp3pp/2n2p2/3pp3/3P1B2/4PB2/PPP2PPP/RN1QK2R w KQkq -": "Bg3",
  "rnbq1rk1/ppp2ppp/4pn2/3p4/3P4/4PNP1/PPP2PP1/RN1QKB1R w KQ -": "Bd3",
  "rnbqk2r/ppp2ppp/3bp3/3p4/3P4/4PNn1/PPPN1PPP/R2QKB1R w KQkq -": "hxg3",
  "rnbq1rk1/ppp2ppp/4pn2/b2p4/3P1B2/2P1PN2/PP1N1PPP/R2QKB1R w KQ -": "Bd3",
  "rn1qk2r/ppp2ppp/3bpn2/3p4/3P1B2/3QPN2/PPP2PPP/RN2K2R w KQkq -": "O-O",
  "rn1qk2r/ppp2ppp/3bpnb1/3p4/3P1B2/3BPN2/PPP2PPP/RN1Q1RK1 w kq -": "Nbd2",
  "rn1q1rk1/ppp1ppbp/5np1/3p1b2/3P1B2/4PN1P/PPPN1PP1/R2QKB1R w KQ -": "Bd3",
  "r1bq1rk1/pppnppbp/5np1/3p4/3P1B2/4PN1P/PPPN1PP1/R2QKB1R w KQ -": "Bd3",
  "rnbq1rk1/p1p1ppbp/1p3np1/3p4/3P1B2/4PN1P/PPPN1PP1/R2QKB1R w KQ -": "Bd3",
  "rnbqr1k1/ppp1ppbp/3p1np1/8/3P1B2/2P1PN1P/PP3PP1/RN1QKB1R w KQ -": "Nbd2",
  "rnbq1rk1/pp2ppbp/3p1np1/2p5/3P1B2/2P1PN1P/PP3PP1/RN1QKB1R w KQ -": "Nbd2",
  "rn1q1rk1/ppp1ppbp/3p1np1/5b2/3P1B2/2P1PN1P/PP3PP1/RN1QKB1R w KQ -": "Nbd2",
  "r2qkb1r/ppp2ppp/2n1pn2/3p4/3P1B2/3bPN2/PPPN1PPP/R2QK2R w KQkq -": "cxd3",
  "rnbq1rk1/pp2ppbp/2pp1np1/8/3P1B2/2P1PN1P/PP3PP1/RN1QKB1R w KQ -": "Nbd2",
  "rnbq1rk1/ppp1ppbp/3p2p1/8/3PnB2/2P1PN1P/PP3PP1/RN1QKB1R w KQ -": "Bd3",
  "rnbq1rk1/ppp1ppbp/3p2p1/7n/3P1B2/2P1PN1P/PP3PP1/RN1QKB1R w KQ -": "Bh2",
  "rnbq1rk1/1pp1ppbp/p2p1np1/8/3P1B2/2P1PN1P/PP3PP1/RN1QKB1R w KQ -": "Nbd2",
  "r1bnkb1r/ppp2ppp/5n2/4p3/5B2/4PN2/PPP2PPP/RN2KB1R w KQkq -": "Bxe5",
  "r1bk1b1r/ppp2ppp/2n2n2/4p3/5B2/4PN2/PPP2PPP/RN2KB1R w KQ -": "Nxe5",
  "r2qkb1r/ppp2ppp/2np1n2/4p3/3P1B2/4PB2/PPP2PPP/RN1QK2R w KQkq -": "dxe5",
  "rnbq1rk1/pp3ppp/3bpn2/2pp4/3P4/4PNB1/PPPN1PPP/R2QKB1R w KQ -": "c3",
  "r1bq1rk1/ppp1bppp/2n1pn2/3p4/3P1B2/2P1PN2/PP1N1PPP/R2QKB1R w KQ -": "Bd3",
  "r1bq1rk1/pppnppbp/3p1np1/8/3P1B2/2P1PN1P/PP3PP1/RN1QKB1R w KQ -": "Nbd2",
  "r1bq1rk1/pppnppbp/3p1np1/8/3P1B2/4PN1P/PPPN1PP1/R2QKB1R w KQ -": "c3",
  "r1bqk2r/pp3ppp/2nbpn2/2pp4/3P1B2/2P1PN2/PP1N1PPP/R2QKB1R w KQkq -": "Bg3",
  "r1bq1rk1/ppp1ppbp/2np1np1/8/3P1B2/2P1PN1P/PP3PP1/RN1QKB1R w KQ -": "Nbd2",
  "rnbq1rk1/p1p1ppbp/1p1p1np1/8/3P1B2/2P1PN1P/PP3PP1/RN1QKB1R w KQ -": "Nbd2",
  "r1bqk2r/ppp2ppp/2n1pn2/3p4/3P4/4PNb1/PPPN1PPP/R2QKB1R w KQkq -": "hxg3",
  "r1bqk2r/ppp2ppp/2nbpn2/3p4/3P1B2/2P1PN2/PP1N1PPP/R2QKB1R w KQkq -": "Bg3",
  "r1bqk2r/ppp2ppp/2n1pn2/b2p4/3P1B2/2P1PN2/PP1N1PPP/R2QKB1R w KQkq -": "Bd3",
  "r1bqk2r/ppp2ppp/2nbp3/3p4/3Pn3/4PNB1/PPPN1PPP/R2QKB1R w KQkq -": "Bd3",
  "r1bqk2r/1pp2ppp/p1nbpn2/3p4/3P1B2/2P1PN2/PP1N1PPP/R2QKB1R w KQkq -": "Bd3",
  "rnbq1rk1/ppp2pbp/3p1np1/4p3/3P1B2/2P1PN1P/PP3PP1/RN1QKB1R w KQ -": "dxe5",
  "r1bqk2r/pp2bppp/2n1pn2/2pp4/3P1B2/2P1PN2/PP1N1PPP/R2QKB1R w KQkq -": "Bd3",
  "r1bqk2r/ppp2ppp/2n1p3/3p4/3Pn3/4PNP1/PPPN1PP1/R2QKB1R w KQkq -": "Nxe4",
  "r2qk2r/ppp2ppp/2n1pn2/3p4/1b1P1B2/3PPN2/PP1N1PPP/R2QK2R w KQkq -": "O-O",
  "r2qk2r/ppp2ppp/2nbpn2/3p4/3P1B2/3PPN2/PP1N1PPP/R2QK2R w KQkq -": "Ne5",
  "r2q1rk1/ppp2ppp/2n1pn2/3p1b2/1b1P1B2/3BPN2/PPPN1PPP/R2Q1RK1 w - -": "a3",
  "r2qk2r/ppp2ppp/2nb1n2/3p1p2/3P1B2/4PN2/PPPN1PPP/R2QK2R w KQkq -": "Bxd6",
  "r2qkb1r/p3pppp/2p2n2/1p1p1b2/Bn1P1B2/4PN2/PPPN1PPP/R2QK2R w KQkq -": "Bb3",
  "r2qk2r/ppp2ppp/2n1pn2/3p4/3P2b1/2P1PNb1/PP1N1PPP/R2QKB1R w KQkq -": "hxg3",
  "r2q1rk1/ppp2ppp/2nbpn2/3p4/3P2b1/2P1PNB1/PP1N1PPP/R2QKB1R w KQ -": "Be2",
  "r2qkb1r/ppp2ppp/2n1p3/8/3PpBb1/2P1PN2/PP3PPP/R2QKB1R w KQkq -": "h3",
  "r2qkb1r/ppp2ppp/2n1p3/3p4/3PnB2/4PN1P/PPP2PP1/R2QKB1R w KQkq -": "Bd3",
  "r2qk2r/ppp2ppp/2nbpn2/3p4/3P1B2/2P1PQ2/PP1N1PPP/R3KB1R w KQkq -": "Bg3",
  "r2q1rk1/ppp1ppbp/2n2np1/3p1b2/3P1B2/2P1PN1P/PP1N1PP1/R2QKB1R w KQ -": "Be2",
  "r1bqr1k1/ppp1ppbp/2n2np1/3p4/3P1B2/2P1PN1P/PP1N1PP1/R2QKB1R w KQ -": "Be2",
  "r2qk2r/ppp2ppp/2nbpn2/3p4/3P1B2/3QPN2/PPP2PPP/RN3RK1 w kq -": "Bg3",
  "r2qkb1r/ppp2ppp/4pn2/3p4/1n1P1B2/3QPN2/PPP2PPP/RN3RK1 w kq -": "Qb5+",
  "r1bq1rk1/ppp2ppp/2n1pn2/3p4/3P4/3BPNP1/PPP2PP1/RN1QK2R w KQ -": "Ne5",
  "rn1qk2r/ppp2ppp/4pn2/3p4/3P1b2/3QPN2/PPP2PPP/RN3RK1 w kq -": "exf4",
  "r1bqr1k1/pppnppbp/3p1np1/8/3P1B2/2P1PN1P/PP1N1PP1/R2QKB1R w KQ -": "Be2",
  "r1bq1rk1/pp1nppbp/3p1np1/2p5/3P1B2/2P1PN1P/PP1N1PP1/R2QKB1R w KQ -": "Be2",
  "r1bq1rk1/p1pnppbp/1p1p1np1/8/3P1B2/2P1PN1P/PP1N1PP1/R2QKB1R w KQ -": "Be2",
  "r1bq1rk1/pppn1pbp/3p1np1/4p3/3P1B2/2P1PN1P/PP1N1PP1/R2QKB1R w KQ -": "dxe5",
  "r1bqr1k1/ppp1ppbp/2np1np1/8/3P1B2/2P1PN1P/PP1N1PP1/R2QKB1R w KQ -": "Be2",
  "r1bq1rk1/ppp2pbp/2np1np1/4p3/3P1B2/2P1PN1P/PP1N1PP1/R2QKB1R w KQ -": "dxe5",
  "r2q1rk1/ppp1ppbp/2np1np1/5b2/3P1B2/2P1PN1P/PP1N1PP1/R2QKB1R w KQ -": "Be2",
  "rnbqr1k1/ppp2pbp/3p1np1/4p3/3P1B2/2P1PN1P/PP1N1PP1/R2QKB1R w KQ -": "dxe5",
  "rnbq1rk1/pp2ppbp/3p1np1/8/3p1B2/2P1PN1P/PP1N1PP1/R2QKB1R w KQ -": "exd4",
  "r2q1rk1/pppnppbp/3p1np1/5b2/3P1B2/2P1PN1P/PP1N1PP1/R2QKB1R w KQ -": "g4",
  "rnbq1rk1/ppp2pbp/5np1/4p3/5B2/2P1PN1P/PP3PP1/RN1QKB1R w KQ -": "Qxd8",
  "r1bk1b1r/ppp2ppp/5n2/4n3/5B2/4P3/PPP2PPP/RN2KB1R w KQ -": "Bxe5",
  "r1bq1rk1/pp2ppbp/2np1np1/2p5/3P1B2/2P1PN1P/PP1N1PP1/R2QKB1R w KQ -": "Be2",
  "rn1q1rk1/pbp1ppbp/1p1p1np1/8/3P1B2/2P1PN1P/PP1N1PP1/R2QKB1R w KQ -": "Be2",
  "r2qk2r/pppb1ppp/2n1pn2/3p4/3P4/4PNP1/PPPN1PP1/R2QKB1R w KQkq -": "c3",
  "r1bq1rk1/ppp2ppp/2n1pn2/3p4/3P4/4PNP1/PPPN1PP1/R2QKB1R w KQ -": "Bd3",
  "r1bq1rk1/ppp2ppp/2nbpn2/3p4/3P4/2P1PNB1/PP1N1PPP/R2QKB1R w KQ -": "Bd3",
  "r1bqk2r/ppp2ppp/2n1pn2/3p4/3P4/2P1PNb1/PP1N1PPP/R2QKB1R w KQkq -": "hxg3",
  "r1bq1rk1/ppp2ppp/2n1pn2/b2p4/3P1B2/2PBPN2/PP1N1PPP/R2QK2R w KQ -": "a4",
  "r1bq1rk1/ppp2ppp/2nbp3/3p4/3Pn3/2P1PNB1/PP1N1PPP/R2QKB1R w KQ -": "Nxe4",
  "r1bqr1k1/ppp2ppp/2nbpn2/3p4/3P4/2P1PNB1/PP1N1PPP/R2QKB1R w KQ -": "Ne5",
  "r2qkb1r/4pppp/2p2n2/pp1p1b2/1n1P1B2/1B2PN2/PPPN1PPP/R2QK2R w KQkq -": "a3",
  "r3k2r/ppp2ppp/2nq1n2/3p1p2/3P4/4PN2/PPPN1PPP/R2QK2R w KQkq -": "O-O",
  "r2q1rk1/pbpnppbp/1p1p1np1/8/3P1B2/2P1PN1P/PP1NBPP1/R2QK2R w KQ -": "O-O",
  "r1bqk2r/ppp2ppp/2n1p3/8/3Pp3/4PNP1/PPP2PP1/R2QKB1R w KQkq -": "Nd2",
  "r1bq1rk1/ppp2ppp/2nbp3/8/3Pp3/2P1PNB1/PP3PPP/R2QKB1R w KQ -": "Nd2",
  "r2q1rk1/ppp2ppp/2n1pn2/3p4/1b1P1B2/3PPN2/PP1N1PPP/R2Q1RK1 w - -": "a3",
  "r2q1rk1/ppp2ppp/2n1pn2/3p4/3P2b1/2P1PNP1/PP1N1PP1/R2QKB1R w KQ -": "Qc2",
  "r2qk2r/ppp2ppp/2n1pn2/3p4/3P4/2P1PQb1/PP1N1PPP/R3KB1R w KQkq -": "hxg3",
  "r2qk2r/ppp2ppp/2n1pn2/3p4/3P4/3QPNb1/PPP2PPP/RN3RK1 w kq -": "fxg3",
  "r1bqr1k1/pppn1pbp/3p1np1/4p3/3P1B2/2P1PN1P/PP1NBPP1/R2QK2R w KQ -": "dxe5",
  "r1bq1rk1/pppn1pbp/5np1/4p3/5B2/2P1PN1P/PP1N1PP1/R2QKB1R w KQ -": "Nxe5",
  "r1bqr1k1/ppp2pbp/2np1np1/4p3/3P1B2/2P1PN1P/PP1NBPP1/R2QK2R w KQ -": "dxe5",
  "r1bq1rk1/ppp2pbp/2n2np1/4p3/5B2/2P1PN1P/PP1N1PP1/R2QKB1R w KQ -": "Nxe5"
};

export const APPROVED_META_BY_FEN = {
  "rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "user_choice",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 280086
  },
  "rnbqkb1r/pppppppp/5n2/8/3P4/8/PPP1PPPP/RNBQKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "user_choice",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 649930
  },
  "rnbqkbnr/ppp1pppp/3p4/8/3P4/8/PPP1PPPP/RNBQKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "user_choice",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 29005
  },
  "rnbqkbnr/pppp1ppp/4p3/8/3P4/8/PPP1PPPP/RNBQKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "user_choice",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 42784
  },
  "rnbqkbnr/pppp1ppp/8/4p3/3P4/8/PPP1PPPP/RNBQKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 121
  },
  "rn1qkbnr/ppp1pppp/8/3p1b2/3P1B2/8/PPP1PPPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 139
  },
  "r1bqkb1r/pppppppp/2n2n2/8/3P1B2/8/PPP1PPPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 6
  },
  "rnbqkb1r/ppp1pppp/5n2/3p4/3P1B2/8/PPP1PPPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 7195
  },
  "rnbqkb1r/pp1ppppp/5n2/2p5/3P1B2/8/PPP1PPPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 1192
  },
  "r1bqkbnr/ppp1pppp/2n5/3p4/3P1B2/8/PPP1PPPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 63
  },
  "rnbqkb1r/ppp1pppp/3p1n2/8/3P1B2/8/PPP1PPPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 468
  },
  "rnbqkb1r/pppppp1p/5np1/8/3P1B2/8/PPP1PPPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 2632
  },
  "rnbqkbnr/pp2pppp/2p5/3p4/3P1B2/8/PPP1PPPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 307
  },
  "rnbqkb1r/pppp1ppp/4pn2/8/3P1B2/8/PPP1PPPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 1553
  },
  "rnbqkbnr/ppp1p1pp/5p2/3p4/3P1B2/8/PPP1PPPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rnbqkbnr/ppp2ppp/4p3/3p4/3P1B2/8/PPP1PPPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 486
  },
  "rnbqkbnr/pp2pppp/8/2pp4/3P1B2/8/PPP1PPPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 2251
  },
  "r1bqkbnr/ppp2ppp/2n5/3pp3/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkb1r/ppp1pppp/5n2/3p4/3P1Bb1/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 138
  },
  "rnbqkb1r/1pp1pppp/p4n2/3p4/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 5
  },
  "rnbqkb1r/ppp1pppp/8/3p4/3PnB2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 1
  },
  "r1bqkbnr/1pp1pppp/p1n5/3p4/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rnbqkbnr/pp3ppp/4p3/2pp4/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 110
  },
  "rnbqk1nr/ppp2ppp/4p3/3p4/1b1P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rnbqkbnr/1pp2ppp/p3p3/3p4/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 2
  },
  "rnbqkbnr/pp3ppp/2p1p3/3p4/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 9
  },
  "rnbqkbnr/ppp2p1p/4p3/3p2p1/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rnbqkbnr/ppp2pp1/4p2p/3p4/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/1pp1pppp/p7/3p1b2/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rnbqkbnr/pp2pppp/8/3p4/3p1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 460
  },
  "rnbqkbnr/ppp3pp/5p2/3pp3/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rnbqkbnr/ppp1p2p/5p2/3p2p1/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r1bqkbnr/ppp1p1pp/2n2p2/3p4/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 4
  },
  "r1bqkb1r/pppp1ppp/2n1pn2/8/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 2
  },
  "rnbqk2r/pppp1ppp/4pn2/8/1b1P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r1bqkb1r/ppp1pppp/2n2n2/3p4/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 21
  },
  "rnbqkb1r/ppp2ppp/3ppn2/8/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 7
  },
  "rnbqkb1r/pppp1p1p/4pnp1/8/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 2
  },
  "rnbqkb1r/pppp1ppp/4p3/8/3PnB2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rnbqkb1r/pppp1ppp/4p3/3n4/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r1bqkb1r/ppp1pppp/2np1n2/8/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 6
  },
  "rnbqkb1r/ppp2ppp/3p1n2/4p3/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rnbqkb1r/pp2pppp/2pp1n2/8/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 11
  },
  "r1bqkb1r/pppnpppp/3p1n2/8/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 38
  },
  "rn1qkb1r/ppp1pppp/3p1n2/5b2/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 2
  },
  "rn1qkb1r/ppp1pppp/3p1n2/8/3P1Bb1/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 3
  },
  "rnbqkb1r/pp2pppp/3p1n2/2p5/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 15
  },
  "r1bqkb1r/pppp1ppp/2n2n2/4p3/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r1bqkb1r/pppppppp/2n5/8/3PnB2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r1bqkb1r/pppppp1p/2n2np1/8/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rnbqkb1r/pp1ppppp/5n2/8/3p1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 72
  },
  "rnb1kb1r/pp1ppppp/1q3n2/2p5/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 261
  },
  "r1bqkb1r/pp1ppppp/2n2n2/2p5/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkb1r/ppp1pppp/5n2/3p1b2/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 301
  },
  "rnbqkb1r/pp2pppp/5n2/2pp4/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 3979
  },
  "rnbqkb1r/pp2pppp/2p2n2/3p4/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 201
  },
  "r1bqkbnr/ppp2ppp/2n1p3/3p4/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 6
  },
  "rnbqkb1r/pp1p1ppp/4pn2/2p5/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 694
  },
  "rnbqk2r/ppppbppp/4pn2/8/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 52
  },
  "rn1qkbnr/ppp2ppp/4p3/3p1b2/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 84
  },
  "r1bqkbnr/pp2pppp/2n5/2pp4/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 1390
  },
  "rn1qkbnr/pp2pppp/2p5/3p1b2/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 104
  },
  "rnbqkb1r/p1pp1ppp/1p2pn2/8/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 324
  },
  "r2qkbnr/ppp1pppp/2n5/3p1b2/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 29
  },
  "rnbqk2r/pppp1ppp/3bpn2/8/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 12
  },
  "rnbqkb1r/ppp2ppp/4pn2/3p4/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 2246
  },
  "rnbqkb1r/ppp1pp1p/5np1/3p4/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 272
  },
  "rnbqk2r/ppppppbp/5np1/8/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 811
  },
  "rnbqk1nr/ppp2ppp/3bp3/3p4/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 238
  },
  "rnbqkb1r/ppp1pp1p/3p1np1/8/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 134
  },
  "r2qkb1r/ppp1pppp/2n2n2/3p4/3P1Bb1/4PN2/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 40
  },
  "r2qkbnr/ppp1pppp/2n5/3p4/3P1B2/3bP3/PPP2PPP/RN1QK1NR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 2
  },
  "r2qkbnr/ppp2ppp/2n1p3/3p1b2/3P1B2/3BP3/PPP2PPP/RN1QK1NR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 1
  },
  "r3kbnr/pppqpppp/2n5/3p1b2/3P1B2/3BP3/PPP2PPP/RN1QK1NR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkbnr/ppp1pppp/2n3b1/3p4/3P1B2/3BP3/PPP2PPP/RN1QK1NR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkb1r/ppp1pppp/2n2n2/3p1b2/3P1B2/3BP3/PPP2PPP/RN1QK1NR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkbnr/ppp1pp1p/2n3p1/3p1b2/3P1B2/3BP3/PPP2PPP/RN1QK1NR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r1bqk1nr/ppp2ppp/2nbp3/3p4/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 17
  },
  "r1bqk1nr/ppp2ppp/2n1p3/3p4/1b1P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r1bqkbnr/ppp3pp/2n2p2/3pp3/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkbnr/ppp1p1pp/2n2p2/3p4/3P1Bb1/4PN2/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 38
  },
  "r1bqkbnr/ppp1p2p/2n2p2/3p2p1/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 1
  },
  "r1bqkbnr/ppp3pp/2n1pp2/3p4/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkbnr/1pp1pppp/p1n5/3p1b2/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 5
  },
  "r2qkbnr/1pp1pppp/p1n5/3p4/3P1Bb1/4PN2/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 4
  },
  "r1bqkb1r/ppp2ppp/2n2n2/3pp3/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rnbqk2r/ppp1bppp/4pn2/3p4/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 267
  },
  "rnbqk2r/ppp2ppp/4pn2/3p4/1b1P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 1
  },
  "rnbqkb1r/ppp2ppp/4p3/3p4/3PnB2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 3
  },
  "rnbqkb1r/ppp2pp1/4pn1p/3p4/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 2
  },
  "rnbqkb1r/1pp2ppp/p3pn2/3p4/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 29
  },
  "r1bqkb1r/pppn1ppp/4pn2/3p4/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 46
  },
  "r1bqkb1r/ppp1pp1p/2n2np1/3p4/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 1
  },
  "rn1qkb1r/ppp1ppp1/5n1p/3p1b2/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r1bqkb1r/1pp1pppp/p1n2n2/3p4/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 4
  },
  "rn1qkb1r/ppp2ppp/4pn2/3p4/3P1Bb1/4PN2/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 48
  },
  "rn1qkb1r/ppp1pppp/5n2/3p4/3P1B2/4Pb2/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 1
  },
  "rn1qkb1r/pp2pppp/2p2n2/3p4/3P1Bb1/3BP3/PPP2PPP/RN1QK1NR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 15
  },
  "rnbqkb1r/pp3ppp/2p1pn2/3p4/3P1B2/3BP3/PPP2PPP/RN1QK1NR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 1
  },
  "rnbqk1nr/ppp2ppp/4p3/3p4/3P4/4P1b1/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 5
  },
  "rnbqk2r/ppp2ppp/3bpn2/3p4/3P4/4P1B1/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 76
  },
  "r1bqkbnr/pp3ppp/2n1p3/2pp4/3P1B2/2P1P3/PP3PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 82
  },
  "rnbqkbnr/pp3ppp/4p3/3p4/3p1B2/2P1P3/PP3PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rnbqkbnr/pp3ppp/4p3/3p4/2pP1B2/2P1P3/PP3PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r1bqkb1r/ppp1pppp/2n5/3p4/3PnB2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkbnr/pp3ppp/4p3/2pp1b2/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 2
  },
  "rn1qk1nr/ppp2ppp/4p3/3p1b2/1b1P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r1bqkbnr/pp2pppp/2n5/3p4/3P1B2/8/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 604
  },
  "rnbqkbnr/ppp3pp/8/3pp3/5B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rnbq1bnr/pppkp2p/5p2/3p2pQ/3P1B2/4P3/PPP2PPP/RN2KBNR w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkb1r/ppp1pppp/2n2n2/3p1b2/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 2
  },
  "r1bqk2r/ppppppbp/2n2np1/8/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r1bqk2r/pppp1ppp/2n1pn2/8/1b1P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rnbqkb1r/pp1p1ppp/4pn2/8/3p1B2/2P1P3/PP3PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 32
  },
  "rnbqk2r/pppp1ppp/4pn2/b7/3P1B2/2P1P3/PP3PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rnbqk2r/ppppbppp/4pn2/8/3P1B2/2P1P3/PP3PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rnbq1rk1/ppppbppp/4pn2/8/3P1B2/3BP3/PPP2PPP/RN1QK1NR w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 4
  },
  "rn1qkb1r/pbpp1ppp/1p2pn2/8/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 1690
  },
  "rnbqk2r/ppp1bppp/3ppn2/8/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 5
  },
  "rnbqk2r/pppp1pbp/4pnp1/8/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 4
  },
  "r1bqkb1r/ppp2ppp/2np1n2/4p3/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkb1r/ppp1pppp/2np1n2/8/3P1Bb1/4PN2/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 1
  },
  "r2qkb1r/ppp1pppp/2np1n2/5b2/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r1bqkb1r/ppp1pp1p/2np1np1/8/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 6
  },
  "r1bqkb1r/ppp2ppp/2nppn2/8/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 1
  },
  "rnbqkb1r/ppp2ppp/5n2/4p3/5B2/4P3/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r1bqkb1r/pppnpp1p/3p1np1/8/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 26
  },
  "rnbqkb1r/pp2pppp/5n2/3p4/3P1B2/8/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 56
  },
  "r1bqkb1r/pp1ppppp/2n2n2/8/3P1B2/8/PPP2PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 2
  },
  "rnb1kb1r/pp1ppppp/5n2/2p5/3P1B2/4PN2/PqP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 2
  },
  "rnbqk2r/ppp2ppp/3bpn2/3p4/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 2047
  },
  "r1bqkb1r/ppp2ppp/2n1pn2/3p4/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 13
  },
  "rn1qk1nr/ppp2ppp/3bp3/3p1b2/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 96
  },
  "r1bqkb1r/ppp1ppp1/2n2n1p/3p4/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r1bqkb1r/pp1p1ppp/2n1pn2/2p5/3P1B2/2P1P3/PP3PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 162
  },
  "rn1qkb1r/ppp2ppp/4pn2/3p1b2/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 617
  },
  "r1bqkb1r/pp2pppp/2n2n2/2pp4/3P1B2/2P1P3/PP3PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 2504
  },
  "rn1qkbnr/pp3ppp/2p1p3/3p1b2/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 187
  },
  "rnbqk2r/ppp1ppbp/3p1np1/8/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 1801
  },
  "rn1qkb1r/1pp1pppp/p4n2/3p1b2/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 7
  },
  "rnbqk2r/ppp1ppbp/5np1/3p4/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 495
  },
  "rnbq1rk1/ppppppbp/5np1/8/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 2826
  },
  "rnbqkb1r/pp3ppp/4pn2/2pp4/3P1B2/2P1P3/PP3PPP/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 253
  },
  "rnbqkb1r/pp3ppp/4pn2/2pp4/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 2608
  },
  "r2qkbnr/ppp2ppp/2n1p3/3p1b2/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 78
  },
  "r1bqk2r/ppp2ppp/2n1pn2/3p4/1b1P1B2/4PN2/PPPN1PPP/R2QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 1
  },
  "r2qkb1r/ppp2ppp/2n1pn2/3p1b2/3P1B2/4PN2/PPPN1PPP/R2QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkb1r/ppp1pppp/5n2/3p1b2/1n1P1B2/4PN2/PPPN1PPP/R2QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 1
  },
  "r2qkb1r/ppp1pppp/2n5/3p1b2/3PnB2/4PN2/PPPN1PPP/R2QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkb1r/ppp1ppp1/2n2n1p/3p1b2/3P1B2/4PN2/PPPN1PPP/R2QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkb1r/ppp2ppp/2n1pn2/3p4/3P1Bb1/4PN2/PPPN1PPP/R2QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 13
  },
  "r2qkb1r/ppp1pppp/2n5/3p4/3PnBb1/4PN2/PPPN1PPP/R2QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkb1r/ppp1pppp/2n2n2/3p4/3P1B2/4Pb2/PPPN1PPP/R2QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkb1r/ppp2ppp/2n2n2/3pp3/3P1Bb1/4PN2/PPPN1PPP/R2QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r1bqkb1r/ppp1pppp/2n5/3p4/3P1B2/4PN2/PPPn1PPP/R2QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkb1r/1pp1pppp/p1n2n2/3p1b2/3P1B2/4PN2/PPPN1PPP/R2QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkb1r/1pp1pppp/p1n2n2/3p4/3P1Bb1/4PN2/PPPN1PPP/R2QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 2
  },
  "r1bqkb1r/ppp1pp2/2n2n1p/3p2p1/3P1B2/2P1PN2/PP3PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r1bqk2r/ppp1ppbp/2n2np1/3p4/3P1B2/4PN1P/PPP2PP1/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 4
  },
  "r1bqkb1r/ppp2ppp/2n5/3pP3/4nB2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkb1r/ppp1pppp/2n2n2/3p4/3P1B2/3QP3/PPP2PPP/RN2K1NR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkbnr/ppp2ppp/2n1p3/3p4/3P1B2/3QP3/PPP2PPP/RN2K1NR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 4
  },
  "r2qkbnr/ppp1pppp/8/3p4/1n1P1B2/3QP3/PPP2PPP/RN2K1NR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkbnr/ppp2ppp/2n5/3p1p2/3P1B2/4P3/PPP2PPP/RN1QK1NR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "2kr1bnr/pppqpppp/2n5/3p1b2/3P1B2/3BPN2/PPP2PPP/RN1QK2R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkb1r/ppp1pppp/2n2nb1/3p4/3P1B2/3BPN2/PPP2PPP/RN1QK2R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkbnr/ppp2ppp/2n1p1b1/3p4/3P1B2/3BPN2/PPP2PPP/RN1QK2R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 6
  },
  "r2qkb1r/ppp2ppp/2n1pn2/3p1B2/3P1B2/4P3/PPP2PPP/RN1QK1NR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r1bqk1nr/ppp2ppp/2n1p3/3p4/3P4/4PNb1/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 1
  },
  "r1bqk2r/ppp2ppp/2nbpn2/3p4/3P4/4PNB1/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 9
  },
  "r1bqk1nr/ppp2ppp/2n1p3/b2p4/3P1B2/2P1PN2/PP3PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "punish_consistency",
    "acceptedVia": "punish-consistency",
    "masterGamesAtPosition": 0
  },
  "r1bqkbnr/ppp3pp/2n5/3pp3/5B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkbnr/ppp1p1pp/2n2p2/3p4/3P1B2/4Pb2/PPP1BPPP/RN1QK2R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 4
  },
  "rnbqk2r/ppp2ppp/4pn2/3p4/3P4/4PNb1/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 14
  },
  "rnbq1rk1/ppp2ppp/3bpn2/3p4/3P4/4PNB1/PPP2PPP/RN1QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 552
  },
  "r2qkb1r/pppb1ppp/2n1pn2/3p4/3P1B2/4PN2/PPPN1PPP/R2QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rnbqkb1r/pp3ppp/4pn2/3p4/3p1B2/2P1PN2/PP3PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 3
  },
  "rnbqkb1r/pp3ppp/4pn2/3p4/2pP1B2/2P1PN2/PP3PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rnbq1rk1/ppp1bppp/4pn2/3p4/3P1B2/4PN2/PPPN1PPP/R2QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 59
  },
  "rnbqk2r/ppp2ppp/4pn2/b2p4/3P1B2/2P1PN2/PP3PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rnbqk2r/ppp2ppp/3bpn2/3p4/3P1B2/2P1PN2/PP3PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rnbqk2r/ppp2ppp/4p3/3p4/1b1PnB2/4PN2/PPPN1PPP/R2QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkb1r/ppp2ppp/4pn2/3p4/3P1B2/3bPN2/PPP2PPP/RN1QK2R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 147
  },
  "rn1qk2r/ppp2ppp/3bpn2/3p1b2/3P1B2/3BPN2/PPP2PPP/RN1QK2R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 37
  },
  "r1bqkb1r/ppp2pp1/2n1pn1p/3p4/3P1B2/4PN2/PPPN1PPP/R2QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qkb1r/ppp2ppp/4p3/3p1b2/3PnB2/3BPN2/PPP2PPP/RN1QK2R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 19
  },
  "rn1qkb1r/ppp2ppp/4pn2/3p4/3P1Bb1/3BPN2/PPP2PPP/RN1QK2R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 2
  },
  "rn1qk2r/ppp2ppp/4pn2/3p1b2/1b1P1B2/3BPN2/PPP2PPP/RN1QK2R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkb1r/pp2pppp/2n2n2/2pp4/3P1Bb1/2P1PN2/PP3PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 69
  },
  "rnbqk2r/ppp2ppp/4pn2/3p4/3P4/4P1P1/PPP2PP1/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 4
  },
  "r1bqk1nr/ppp2ppp/2n1p3/3p4/3P4/4P1P1/PPP2PP1/RN1QKBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qk1nr/ppp2ppp/4p3/3p1b2/3P4/4PNb1/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 2
  },
  "rn1qk2r/ppp2ppp/3bpn2/3p1b2/3P4/4PNB1/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 38
  },
  "r2qkbnr/ppp2ppp/2n1p3/3p4/3P1B2/3bPN2/PPP2PPP/RN1QK2R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 7
  },
  "r2qkbnr/pp3ppp/2n1p3/1Bpp1b2/3P1B2/4PN2/PPP2PPP/RN1QK2R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 1
  },
  "rnbqkbnr/ppp4p/6p1/3pp2Q/5B2/4P3/PPP2PPP/RN2KBNR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r1bqk2r/ppp2ppp/2nbpn2/3p4/3P1B2/4PN2/PPPN1PPP/R2QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 8
  },
  "rnbqr1k1/ppppppbp/5np1/8/3P1B2/4PN1P/PPP2PP1/RN1QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rnbq1rk1/p1ppppbp/1p3np1/8/3P1B2/4PN1P/PPP2PP1/RN1QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 43
  },
  "rnbq1rk1/pppp1pbp/4pnp1/8/3P1B2/4PN1P/PPP2PP1/RN1QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r1bqkb1r/ppp2ppp/2n1p3/3p4/3PnB2/4PN2/PPPN1PPP/R2QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rnbqk2r/p1p1ppbp/1p1p1np1/8/3P1B2/4PN1P/PPP2PP1/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 18
  },
  "rn1qk2r/ppp1ppbp/3p1np1/5b2/3P1B2/4PN1P/PPP2PP1/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 3
  },
  "rnbqk2r/pp2ppbp/2pp1np1/8/3P1B2/4PN1P/PPP2PP1/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 11
  },
  "r1bqk2r/pppp1ppp/2n1pn2/b7/3P1B2/2P1PN2/PP3PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r1bqkb1r/ppp2ppp/2n2n2/4p3/5B2/4PN2/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkb1r/ppp1pppp/2np1n2/8/3P1B2/4Pb2/PPP1BPPP/RN1QK2R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rnbk1b1r/ppp2ppp/5n2/4p3/5B2/4P3/PPP2PPP/RN2KBNR w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rnbqk2r/ppp2ppp/3bp3/3p4/3Pn3/4PNB1/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 54
  },
  "rnbq1rk1/ppp1ppbp/5np1/3p4/3P1B2/4PN1P/PPP2PP1/RN1QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 208
  },
  "rnbq1rk1/ppp1ppbp/3p1np1/8/3P1B2/4PN1P/PPP2PP1/RN1QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 1972
  },
  "r1bqk2r/ppp1bppp/2n1pn2/3p4/3P1B2/4PN2/PPPN1PPP/R2QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 2
  },
  "r1bqkb1r/1pp2ppp/p1n1pn2/3p4/3P1B2/4PN2/PPPN1PPP/R2QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 1
  },
  "rn1qkb1r/ppp2ppp/4pnb1/3p4/3P1B2/3BPN2/PPP2PPP/RN1QK2R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 50
  },
  "r1bqkb1r/ppp2p1p/2n1pnp1/3p4/3P1B2/4PN2/PPPN1PPP/R2QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkb1r/ppp2ppp/2n1pn2/3p1b2/3P1B2/3BPN2/PPP2PPP/RN1QK2R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 2
  },
  "r1bq1rk1/ppppppbp/2n2np1/8/3P1B2/4PN1P/PPP2PP1/RN1QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 1
  },
  "r1bqk2r/ppp1ppbp/2np1np1/8/3P1B2/4PN1P/PPP2PP1/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 19
  },
  "r1bqk2r/pppnppbp/3p1np1/8/3P1B2/4PN1P/PPP2PP1/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 94
  },
  "r1bqkb1r/pp3ppp/2n1pn2/2pp4/3P1B2/2P1PN2/PP3PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 1858
  },
  "r1bq1rk1/ppp2ppp/2nbpn2/3p4/3P4/4PNB1/PPPN1PPP/R2QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 4
  },
  "r2qk2r/ppp2ppp/2n1pn2/3p1b2/1b1P1B2/3BPN2/PPPN1PPP/R2QK2R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qk2r/ppp2ppp/2nbpn2/3p1b2/3P1B2/3BPN2/PPPN1PPP/R2QK2R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkb1r/pp2pppp/2p2n2/1B1p1b2/1n1P1B2/4PN2/PPPN1PPP/R2QK2R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 1
  },
  "r2qkb1r/ppp1pppp/2n5/3p4/3PbB2/4PN2/PPP2PPP/R2QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkb1r/ppp1pppp/2n5/5b2/3PpB2/4PN2/PPP2PPP/R2QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qk2r/ppp2ppp/2nbpn2/3p4/3P1Bb1/2P1PN2/PP1N1PPP/R2QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 15
  },
  "r2qk2r/ppp1bppp/2n1pn2/3p4/3P1Bb1/2P1PN2/PP1N1PPP/R2QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkb1r/ppp2ppp/2n1p3/3p4/3PnBb1/2P1PN2/PP1N1PPP/R2QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkb1r/ppp1pppp/2n5/3p4/3PnB2/4Pb1P/PPPN1PP1/R2QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkb1r/ppp1pppp/2n5/3p4/3P1Bb1/4PN1P/PPPn1PP1/R2QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkb1r/ppp1pppp/2n5/3p3b/3PnB2/4PN1P/PPPN1PP1/R2QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkb1r/ppp2ppp/2n1pn2/3p4/3P1B2/4PQ2/PPPN1PPP/R3KB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkb1r/1pp1pppp/p1n2n2/3p4/3P1B2/3bPN2/PPPN1PPP/R2QK2R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r1bq1rk1/ppp1ppbp/2n2np1/3p4/3P1B2/4PN1P/PPPN1PP1/R2QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 2
  },
  "r2qkb1r/ppp2ppp/2n1pn2/3p4/3P1B2/3QPN2/PPP2PPP/RN2K2R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkb1r/ppp1pppp/5n2/3p4/1n1P1B2/3QPN2/PPP2PPP/RN2K2R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkbnr/ppp2ppp/4p3/3p4/1n1P1B2/3QPN2/PPP2PPP/RN2K2R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qk1nr/ppp2ppp/2nbp3/3p4/3P1B2/3QPN2/PPP2PPP/RN2K2R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 7
  },
  "r2qkbnr/ppp1pppp/2n5/1Q1p4/3P1B2/4P3/PPP2PPP/RN2K1NR w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "2kr1bnr/ppp1pppp/2n5/3p1q2/3P1B2/4PN2/PPP2PPP/RN1QK2R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r1bqk2r/ppp2ppp/2n1pn2/3p4/3P4/4PNP1/PPP2PP1/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r1bqkbnr/ppp3pp/8/3pn3/5B2/4P3/PPP2PPP/RN1QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkbnr/ppp3pp/2n2p2/3pp3/3P1B2/4PB2/PPP2PPP/RN1QK2R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 4
  },
  "rnbq1rk1/ppp2ppp/4pn2/3p4/3P4/4PNP1/PPP2PP1/RN1QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 1
  },
  "rnbqk2r/ppp2ppp/3bp3/3p4/3P4/4PNn1/PPPN1PPP/R2QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 26
  },
  "rnbq1rk1/ppp2ppp/4pn2/b2p4/3P1B2/2P1PN2/PP1N1PPP/R2QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qk2r/ppp2ppp/3bpn2/3p4/3P1B2/3QPN2/PPP2PPP/RN2K2R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 28
  },
  "rn1qk2r/ppp2ppp/3bpnb1/3p4/3P1B2/3BPN2/PPP2PPP/RN1Q1RK1 w kq -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 22
  },
  "rn1q1rk1/ppp1ppbp/5np1/3p1b2/3P1B2/4PN1P/PPPN1PP1/R2QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 2
  },
  "r1bq1rk1/pppnppbp/5np1/3p4/3P1B2/4PN1P/PPPN1PP1/R2QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 16
  },
  "rnbq1rk1/p1p1ppbp/1p3np1/3p4/3P1B2/4PN1P/PPPN1PP1/R2QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 10
  },
  "rnbqr1k1/ppp1ppbp/3p1np1/8/3P1B2/2P1PN1P/PP3PP1/RN1QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 1
  },
  "rnbq1rk1/pp2ppbp/3p1np1/2p5/3P1B2/2P1PN1P/PP3PP1/RN1QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 254
  },
  "rn1q1rk1/ppp1ppbp/3p1np1/5b2/3P1B2/2P1PN1P/PP3PP1/RN1QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 3
  },
  "r2qkb1r/ppp2ppp/2n1pn2/3p4/3P1B2/3bPN2/PPPN1PPP/R2QK2R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rnbq1rk1/pp2ppbp/2pp1np1/8/3P1B2/2P1PN1P/PP3PP1/RN1QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 11
  },
  "rnbq1rk1/ppp1ppbp/3p2p1/8/3PnB2/2P1PN1P/PP3PP1/RN1QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rnbq1rk1/ppp1ppbp/3p2p1/7n/3P1B2/2P1PN1P/PP3PP1/RN1QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rnbq1rk1/1pp1ppbp/p2p1np1/8/3P1B2/2P1PN1P/PP3PP1/RN1QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r1bnkb1r/ppp2ppp/5n2/4p3/5B2/4PN2/PPP2PPP/RN2KB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r1bk1b1r/ppp2ppp/2n2n2/4p3/5B2/4PN2/PPP2PPP/RN2KB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkb1r/ppp2ppp/2np1n2/4p3/3P1B2/4PB2/PPP2PPP/RN1QK2R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rnbq1rk1/pp3ppp/3bpn2/2pp4/3P4/4PNB1/PPPN1PPP/R2QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 467
  },
  "r1bq1rk1/ppp1bppp/2n1pn2/3p4/3P1B2/2P1PN2/PP1N1PPP/R2QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r1bq1rk1/pppnppbp/3p1np1/8/3P1B2/2P1PN1P/PP3PP1/RN1QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 239
  },
  "r1bq1rk1/pppnppbp/3p1np1/8/3P1B2/4PN1P/PPPN1PP1/R2QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 100
  },
  "r1bqk2r/pp3ppp/2nbpn2/2pp4/3P1B2/2P1PN2/PP1N1PPP/R2QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 2438
  },
  "r1bq1rk1/ppp1ppbp/2np1np1/8/3P1B2/2P1PN1P/PP3PP1/RN1QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 69
  },
  "rnbq1rk1/p1p1ppbp/1p1p1np1/8/3P1B2/2P1PN1P/PP3PP1/RN1QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 141
  },
  "r1bqk2r/ppp2ppp/2n1pn2/3p4/3P4/4PNb1/PPPN1PPP/R2QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r1bqk2r/ppp2ppp/2nbpn2/3p4/3P1B2/2P1PN2/PP1N1PPP/R2QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 1
  },
  "r1bqk2r/ppp2ppp/2n1pn2/b2p4/3P1B2/2P1PN2/PP1N1PPP/R2QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r1bqk2r/ppp2ppp/2nbp3/3p4/3Pn3/4PNB1/PPPN1PPP/R2QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "system_move",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r1bqk2r/1pp2ppp/p1nbpn2/3p4/3P1B2/2P1PN2/PP1N1PPP/R2QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rnbq1rk1/ppp2pbp/3p1np1/4p3/3P1B2/2P1PN1P/PP3PP1/RN1QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r1bqk2r/pp2bppp/2n1pn2/2pp4/3P1B2/2P1PN2/PP1N1PPP/R2QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 595
  },
  "r1bqk2r/ppp2ppp/2n1p3/3p4/3Pn3/4PNP1/PPPN1PP1/R2QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qk2r/ppp2ppp/2n1pn2/3p4/1b1P1B2/3PPN2/PP1N1PPP/R2QK2R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qk2r/ppp2ppp/2nbpn2/3p4/3P1B2/3PPN2/PP1N1PPP/R2QK2R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2q1rk1/ppp2ppp/2n1pn2/3p1b2/1b1P1B2/3BPN2/PPPN1PPP/R2Q1RK1 w - -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qk2r/ppp2ppp/2nb1n2/3p1p2/3P1B2/4PN2/PPPN1PPP/R2QK2R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkb1r/p3pppp/2p2n2/1p1p1b2/Bn1P1B2/4PN2/PPPN1PPP/R2QK2R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qk2r/ppp2ppp/2n1pn2/3p4/3P2b1/2P1PNb1/PP1N1PPP/R2QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2q1rk1/ppp2ppp/2nbpn2/3p4/3P2b1/2P1PNB1/PP1N1PPP/R2QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 5
  },
  "r2qkb1r/ppp2ppp/2n1p3/8/3PpBb1/2P1PN2/PP3PPP/R2QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkb1r/ppp2ppp/2n1p3/3p4/3PnB2/4PN1P/PPP2PP1/R2QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qk2r/ppp2ppp/2nbpn2/3p4/3P1B2/2P1PQ2/PP1N1PPP/R3KB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2q1rk1/ppp1ppbp/2n2np1/3p1b2/3P1B2/2P1PN1P/PP1N1PP1/R2QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 1
  },
  "r1bqr1k1/ppp1ppbp/2n2np1/3p4/3P1B2/2P1PN1P/PP1N1PP1/R2QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qk2r/ppp2ppp/2nbpn2/3p4/3P1B2/3QPN2/PPP2PPP/RN3RK1 w kq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkb1r/ppp2ppp/4pn2/3p4/1n1P1B2/3QPN2/PPP2PPP/RN3RK1 w kq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r1bq1rk1/ppp2ppp/2n1pn2/3p4/3P4/3BPNP1/PPP2PP1/RN1QK2R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rn1qk2r/ppp2ppp/4pn2/3p4/3P1b2/3QPN2/PPP2PPP/RN3RK1 w kq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r1bqr1k1/pppnppbp/3p1np1/8/3P1B2/2P1PN1P/PP1N1PP1/R2QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 12
  },
  "r1bq1rk1/pp1nppbp/3p1np1/2p5/3P1B2/2P1PN1P/PP1N1PP1/R2QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 18
  },
  "r1bq1rk1/p1pnppbp/1p1p1np1/8/3P1B2/2P1PN1P/PP1N1PP1/R2QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 20
  },
  "r1bq1rk1/pppn1pbp/3p1np1/4p3/3P1B2/2P1PN1P/PP1N1PP1/R2QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r1bqr1k1/ppp1ppbp/2np1np1/8/3P1B2/2P1PN1P/PP1N1PP1/R2QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 3
  },
  "r1bq1rk1/ppp2pbp/2np1np1/4p3/3P1B2/2P1PN1P/PP1N1PP1/R2QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2q1rk1/ppp1ppbp/2np1np1/5b2/3P1B2/2P1PN1P/PP1N1PP1/R2QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rnbqr1k1/ppp2pbp/3p1np1/4p3/3P1B2/2P1PN1P/PP1N1PP1/R2QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "rnbq1rk1/pp2ppbp/3p1np1/8/3p1B2/2P1PN1P/PP1N1PP1/R2QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 23
  },
  "r2q1rk1/pppnppbp/3p1np1/5b2/3P1B2/2P1PN1P/PP1N1PP1/R2QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 1
  },
  "rnbq1rk1/ppp2pbp/5np1/4p3/5B2/2P1PN1P/PP3PP1/RN1QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r1bk1b1r/ppp2ppp/5n2/4n3/5B2/4P3/PPP2PPP/RN2KB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r1bq1rk1/pp2ppbp/2np1np1/2p5/3P1B2/2P1PN1P/PP1N1PP1/R2QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 93
  },
  "rn1q1rk1/pbp1ppbp/1p1p1np1/8/3P1B2/2P1PN1P/PP1N1PP1/R2QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 97
  },
  "r2qk2r/pppb1ppp/2n1pn2/3p4/3P4/4PNP1/PPPN1PP1/R2QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r1bq1rk1/ppp2ppp/2n1pn2/3p4/3P4/4PNP1/PPPN1PP1/R2QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r1bq1rk1/ppp2ppp/2nbpn2/3p4/3P4/2P1PNB1/PP1N1PPP/R2QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r1bqk2r/ppp2ppp/2n1pn2/3p4/3P4/2P1PNb1/PP1N1PPP/R2QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r1bq1rk1/ppp2ppp/2n1pn2/b2p4/3P1B2/2PBPN2/PP1N1PPP/R2QK2R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r1bq1rk1/ppp2ppp/2nbp3/3p4/3Pn3/2P1PNB1/PP1N1PPP/R2QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r1bqr1k1/ppp2ppp/2nbpn2/3p4/3P4/2P1PNB1/PP1N1PPP/R2QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qkb1r/4pppp/2p2n2/pp1p1b2/1n1P1B2/1B2PN2/PPPN1PPP/R2QK2R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r3k2r/ppp2ppp/2nq1n2/3p1p2/3P4/4PN2/PPPN1PPP/R2QK2R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2q1rk1/pbpnppbp/1p1p1np1/8/3P1B2/2P1PN1P/PP1NBPP1/R2QK2R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "masters_freq",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 62
  },
  "r1bqk2r/ppp2ppp/2n1p3/8/3Pp3/4PNP1/PPP2PP1/R2QKB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r1bq1rk1/ppp2ppp/2nbp3/8/3Pp3/2P1PNB1/PP3PPP/R2QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2q1rk1/ppp2ppp/2n1pn2/3p4/1b1P1B2/3PPN2/PP1N1PPP/R2Q1RK1 w - -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2q1rk1/ppp2ppp/2n1pn2/3p4/3P2b1/2P1PNP1/PP1N1PP1/R2QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qk2r/ppp2ppp/2n1pn2/3p4/3P4/2P1PQb1/PP1N1PPP/R3KB1R w KQkq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r2qk2r/ppp2ppp/2n1pn2/3p4/3P4/3QPNb1/PPP2PPP/RN3RK1 w kq -": {
    "source": "accepted_proposal",
    "selectionRule": "band_0_1400",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r1bqr1k1/pppn1pbp/3p1np1/4p3/3P1B2/2P1PN1P/PP1NBPP1/R2QK2R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r1bq1rk1/pppn1pbp/5np1/4p3/5B2/2P1PN1P/PP1N1PP1/R2QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r1bqr1k1/ppp2pbp/2np1np1/4p3/3P1B2/2P1PN1P/PP1NBPP1/R2QK2R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  },
  "r1bq1rk1/ppp2pbp/2n2np1/4p3/5B2/2P1PN1P/PP1N1PP1/R2QKB1R w KQ -": {
    "source": "accepted_proposal",
    "selectionRule": "lichess_2200_plus",
    "acceptedVia": "accept-top",
    "masterGamesAtPosition": 0
  }
};
// END_APPROVED_BY_FEN

export const ARROWS_BY_FEN = {};

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
      if (turn === PLAYER_TURN) {
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
      if (turn === PLAYER_TURN) {
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
