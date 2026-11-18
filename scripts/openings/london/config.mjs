export const OPENING_CONFIG = {
  id: 'london',
  name: 'Sistema Londra',
  playerColor: 'white',
  description:
    'Repertorio solido col Bianco basato sul Database Lichess (fascia 0-1400 per le risposte avversarie) e validato con Database Grandi Maestri + Stockfish 16 (depth 18): 1.d4 e sistema di sviluppo con Alfiere in f4.',
  maxPositionsCap: 900, // solo per Londra (Caro-Kann resta a 600)
  rootMovesSan: ['d4'],
  // 1.d4 è la mia prima mossa, forzata: l'albero parte dopo di essa.
  startMovesSan: ['d4'],
  // Nessuna restrizione sulle risposte al ply 1: entrano tutte quelle che passano MIN_BAND_GAMES / MIN_BRANCH_FREQ.
  leadIn: { maxPly: 0, unconditionalPlies: [] },
  // Entro la tolleranza della regola normale, preferisci mosse di sistema fino a questo ply.
  preferredPlayerMovesSan: ['Bf4', 'e3', 'Nf3', 'c3', 'Bd3', 'Nbd2', 'h3', 'O-O', 'Bg3'],
  preferredMaxPly: 12,
  // Dopo 1.d4 e5 vale la regola normale (2.dxe5), niente preferenza di sistema.
  preferredExcludePrefixes: [['d4', 'e5']],
  // Scelta dell'utente: Londra accelerato, 2.Bf4 subito (se la perdita vs best resta <= 0.35).
  forcedPlayerMoves: [{ ply: 2, san: 'Bf4', maxLoss: 0.35, excludePrefixes: [['d4', 'e5']] }],
  fallbackVariation: {
    id: 'london-other',
    name: 'Londra: altre risposte a 1.d4',
    minReach: 0.004, // come london-d5
  },
  variations: [
    {
      id: 'london-d5',
      name: 'Londra contro 1...d5',
      subtitle: '2.Bf4 subito: Alfiere fuori dalla catena e struttura solida e-d-c',
      ecoCode: 'D02',
      rootMovesSan: ['d4', 'd5', 'Bf4'],
      matchPrefixes: [['d4', 'd5']],
      // reach riparte da 1.0 dopo la mia risposta anche contro 1...e6 / 1...e5 (varianti 'altre')
      reachResetMovesSan: [['d4', 'e6', 'Bf4'], ['d4', 'e5', 'dxe5']],
      minReach: 0.004, // tiene l'albero sotto MAX_POSITIONS_CAP
    },
    {
      id: 'london-nf6',
      name: 'Londra contro 1...Nf6',
      subtitle: '2.Bf4 subito contro le Indiane: Alfiere fuori prima di e3',
      ecoCode: 'A46',
      rootMovesSan: ['d4', 'Nf6', 'Bf4'],
      matchPrefixes: [['d4', 'Nf6']],
      minReach: 0.006,
    },
  ],
};

export const SEED_LINES = [];
