export const OPENING_CONFIG = {
  id: 'caro-kann',
  name: 'Caro-Kann Defence',
  playerColor: 'black',
  description:
    'Repertorio solido col Nero contro 1.e4 basato sul Database Lichess (fascia 0-1400 per le risposte avversarie) e validato con Database Grandi Maestri + Stockfish 16 (depth 18).',
  rootMovesSan: ['e4', 'c6', 'd4', 'd5'],
  // Mosse giocate prima della radice dell'albero (qui 1.e4; per il Bianco: []).
  startMovesSan: ['e4'],
  // Fase d'ingresso: finché la sequenza è prefisso stretto di una root (o altRoot) di variante e ply <= maxPly,
  // l'avversario può giocare solo mosse che restano su una root. Reach riparte da 1.0.
  // unconditionalPlies: ply in cui non si applicano MIN_BAND_GAMES / MIN_BRANCH_FREQ.
  // unconditionalSeqs: mosse d'ingresso rare ma volute (ignorano MIN_BAND_GAMES / MIN_BRANCH_FREQ).
  leadIn: { maxPly: 4, unconditionalPlies: [2], unconditionalSeqs: [['e4', 'c6', 'd4', 'd5', 'f3']] },
  maxPositionsCap: 900, // override per-apertura (default 600)
  fallbackVariation: {
    id: 'caro-kann-root',
    name: 'Caro-Kann: Impianto Principale (1.e4 c6 2.d4 d5)',
  },
  variations: [
    {
      id: 'advance-bf5',
      name: 'Variante di Spinta (3.e5 Bf5)',
      subtitle: "Sviluppo attivo dell'alfiere campochiaro fuori dalla catena di pedoni prima di ...e6",
      ecoCode: 'B12',
      rootMovesSan: ['e4', 'c6', 'd4', 'd5', 'e5', 'Bf5'],
      matchPrefixes: [['e4', 'c6', 'd4', 'd5', 'e5']],
    },
    {
      id: 'classical-bf5',
      name: 'Variante Classica (4.Nxe4 Bf5)',
      subtitle: 'Cambio centrale 3...dxe4 seguito da 4...Bf5 per sfidare subito il cavallo centralizzato',
      ecoCode: 'B18',
      rootMovesSan: ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5'],
      altRootMovesSan: [['e4', 'c6', 'd4', 'd5', 'Nd2', 'dxe4', 'Nxe4', 'Bf5']],
      matchPrefixes: [
        ['e4', 'c6', 'd4', 'd5', 'Nc3'],
        ['e4', 'c6', 'd4', 'd5', 'Nd2'],
      ],
    },
    {
      id: 'exchange-cxd5',
      name: 'Variante di Cambio & Panov (3.exd5 cxd5)',
      subtitle: 'Struttura simmetrica solida con sviluppo naturale ...Nc6, ...Nf6, ...Bg4 e controllo della colonna c',
      ecoCode: 'B13',
      rootMovesSan: ['e4', 'c6', 'd4', 'd5', 'exd5', 'cxd5'],
      matchPrefixes: [['e4', 'c6', 'd4', 'd5', 'exd5']],
      maxPly: 10,
      minReach: 0.035,
    },
    {
      id: 'hillbilly-bc4',
      name: "Attacco dell'Alfiere / Hillbilly (2.Bc4 d5)",
      subtitle: "Controgioco immediato al centro con 2...d5 guadagnando tempo sull'Alfiere in c4",
      ecoCode: 'B10',
      rootMovesSan: ['e4', 'c6', 'Bc4', 'd5'],
      matchPrefixes: [['e4', 'c6', 'Bc4']],
      // Posizioni extra in cui la reach riparte da 1.0 (senza vincolare la fase d'ingresso).
      reachResetMovesSan: [['e4', 'c6', 'Bc4', 'd5', 'exd5', 'cxd5']],
      maxPly: 10,
      minReach: 0.035,
    },
    {
      id: 'two-knights-nf3',
      name: 'Due Cavalli (2.Nf3 d5)',
      subtitle: 'Sviluppo del cavallo prima di d4: rispondi 2...d5 e sfida il centro',
      ecoCode: 'B10',
      rootMovesSan: ['e4', 'c6', 'Nf3', 'd5'],
      matchPrefixes: [['e4', 'c6', 'Nf3']],
      maxPly: 10,
      minReach: 0.035,
    },
    {
      id: 'two-knights-nc3',
      name: 'Due Cavalli (2.Nc3 d5)',
      subtitle: 'Cavallo in c3 al posto di d4: 2...d5 e poi ...dxe4 o ...Nf6',
      ecoCode: 'B10',
      rootMovesSan: ['e4', 'c6', 'Nc3', 'd5'],
      matchPrefixes: [['e4', 'c6', 'Nc3']],
      maxPly: 10,
      minReach: 0.035,
    },
    {
      id: 'queen-sorties',
      name: 'Uscite di Donna (2.Qf3 / 2.Qh5)',
      subtitle: 'Donna sviluppata presto: sviluppa i pezzi e guadagna tempi sulla donna',
      ecoCode: 'B10',
      rootMovesSan: ['e4', 'c6', 'Qf3'],
      altRootMovesSan: [['e4', 'c6', 'Qh5']],
      matchPrefixes: [['e4', 'c6', 'Qf3'], ['e4', 'c6', 'Qh5']],
      maxPly: 10,
      minReach: 0.035,
    },
    {
      id: 'fantasy-f3',
      name: 'Variante Fantasia (3.f3)',
      subtitle: 'Il bianco sostiene e4 con f3: contrattacca il centro con ...dxe4 o ...e6',
      ecoCode: 'B12',
      rootMovesSan: ['e4', 'c6', 'd4', 'd5', 'f3'],
      matchPrefixes: [['e4', 'c6', 'd4', 'd5', 'f3']],
      maxPly: 10,
      minReach: 0.035,
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
  ['e4', 'c6', 'd4', 'd5', 'exd5', 'cxd5'],
  ['e4', 'c6', 'Bc4', 'd5'],
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
