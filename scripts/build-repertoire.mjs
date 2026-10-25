import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { Chess } from 'chess.js';
import {
  CARO_KANN_CONFIG,
  AI_COMMENTS_UNVERIFIED_BY_FEN,
  ARROWS_BY_FEN,
  APPROVED_MOVES_BY_FEN,
  APPROVED_META_BY_FEN,
  getApprovedSeedMap,
  normalizeFen,
} from './repertoire-seeds.mjs';
import { StockfishRunner, STOCKFISH_PACKAGE_INFO } from './stockfish-runner.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const SEEDS_FILE_PATH = path.join(__dirname, 'repertoire-seeds.mjs');

/**
 * UNICO PARAMETRO DI CONFIGURAZIONE PER LA FASCIA DI RATING (0-1400)
 */
export const RATING_BAND = {
  label: '0-1400',
  buckets: (process.env.RATING_BUCKETS || '0,1000,1200')
    .split(',')
    .map((x) => Number(x.trim()))
    .filter((n) => !Number.isNaN(n)),
  speeds: ['blitz', 'rapid', 'classical'],
};

/**
 * Fascia Lichess 2200+ usata per scegliere le mie mosse quando Masters < 50 partite
 */
export const HIGH_RATING_BAND = {
  label: '2200+',
  buckets: (process.env.HIGH_RATING_BUCKETS || '2200,2500')
    .split(',')
    .map((x) => Number(x.trim()))
    .filter((n) => !Number.isNaN(n)),
  speeds: ['blitz', 'rapid', 'classical'],
};

/**
 * Parametri di configurazione Checkpoint A + B aggiornati
 */
export const BUILD_DEFAULTS = {
  RATING_BAND,
  HIGH_RATING_BAND,
  CHECKPOINT: process.env.CHECKPOINT || 'B',
  MAX_MOVES_DEPTH: Number(process.env.MAX_MOVES_DEPTH || 8), // 8 mosse = 16 semimosse
  MIN_BAND_GAMES: Number(process.env.MIN_BAND_GAMES || 500), // 500 partite nella fascia 0-1400
  MIN_BRANCH_FREQ: Number(process.env.MIN_BRANCH_FREQ || 0.02), // 2% frequenza minima locale nella posizione
  MIN_REACH: Number(process.env.MIN_REACH || 0.003), // 0.3% probabilità cumulativa del ramo dall'inizio della variante
  MAX_POSITIONS_CAP: Number(process.env.MAX_POSITIONS_CAP || 600), // tetto massimo 600 posizioni
  STOCKFISH_DEPTH: Number(process.env.STOCKFISH_DEPTH || 18), // depth 18 per le mie mosse
  STOCKFISH_MULTIPV: Number(process.env.STOCKFISH_MULTIPV || 6), // multipv unica alla stessa profondità
  MIN_MASTERS_FOR_FREQ: Number(process.env.MIN_MASTERS_FOR_FREQ || 50), // sotto 50 partite Masters usa regola 2200+ / 0-1400 / motore
  LOW_MASTERS_MAX_LOSS: Number(process.env.LOW_MASTERS_MAX_LOSS || 0.15), // candidate con loss <= 0.15 rispetto alla best (depth 18, multipv 6)
  MIN_HIGH_BAND_GAMES: Number(process.env.MIN_HIGH_BAND_GAMES || 100), // >= 100 partite in 2200+ (ratings=2200,2500)
  MIN_LOW_BAND_GAMES_FOR_CHOICE: Number(process.env.MIN_LOW_BAND_GAMES_FOR_CHOICE || 100), // >= 100 partite in 0-1400
  CANDIDATE_MAX_LOSS: 0.30, // entro 0.30 pedoni dalla migliore per posizioni Masters >= 50
  WARNING_MAX_LOSS: 0.50, // segnala se una mia mossa perde > 0.50 pedoni
  // Parametri Checkpoint B (Errori comuni dell'avversario nella fascia 0-1400)
  MIN_MISTAKE_FREQ: Number(process.env.MIN_MISTAKE_FREQ || 0.05), // 5% frequenza minima nella fascia 0-1400
  MISTAKE_SCREEN_DEPTH: Number(process.env.MISTAKE_SCREEN_DEPTH || 14), // screening a depth 14
  MISTAKE_CONFIRM_DEPTH: Number(process.env.MISTAKE_CONFIRM_DEPTH || 20), // rivalutazione a depth 20
  MISTAKE_CONFIRM_MULTIPV: Number(process.env.MISTAKE_CONFIRM_MULTIPV || 2), // multipv 2 a depth 20
  MISTAKE_MIN_LOSS: 0.40, // >= 0.40 inaccuracy, >= 1.00 mistake, >= 2.50 blunder
  MAX_MISTAKES_PER_POS: 3, // primi 3 per posizione ordinati per frequenza * perdita
  MAX_PUNISH_PV_MOVES: 6, // PV max 6 mosse
  API_DELAY_MS: 950,
};

const LICHESS_CACHE_DIR = path.join(ROOT_DIR, '.cache', 'lichess');
const REVIEW_MOVES_PATH = path.join(ROOT_DIR, 'review-moves.json');
const BUILD_WARNINGS_PATH = path.join(ROOT_DIR, 'build-warnings.json');
const OUTPUT_DIR = path.join(ROOT_DIR, 'src', 'data', 'openings');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'caro-kann.json');

function loadEnvToken() {
  if (process.env.LICHESS_TOKEN && process.env.LICHESS_TOKEN.trim()) {
    return process.env.LICHESS_TOKEN.trim();
  }
  const envPath = path.join(ROOT_DIR, '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
        if (key === 'LICHESS_TOKEN' && val) {
          return val;
        }
      }
    }
  }
  return null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchLichessEndpoint(endpointType, fen, token, statsCounter) {
  fs.mkdirSync(LICHESS_CACHE_DIR, { recursive: true });
  const normFen = normalizeFen(fen);
  const bandObj = endpointType === 'lichess_high' ? HIGH_RATING_BAND : RATING_BAND;
  const bucketsStr = bandObj.buckets.join(',');
  const speedsStr = bandObj.speeds.join(',');

  const cacheKey =
    endpointType === 'masters'
      ? `masters|${normFen}`
      : `lichess|band=${bandObj.label}|buckets=${bucketsStr}|speeds=${speedsStr}|${normFen}`;

  const hash = crypto.createHash('sha256').update(cacheKey).digest('hex').slice(0, 24);
  const cacheFile = path.join(LICHESS_CACHE_DIR, `${endpointType}_${hash}.json`);

  if (fs.existsSync(cacheFile)) {
    try {
      const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      statsCounter.apiCacheHits += 1;
      return cached;
    } catch {
      // Fall through to re-fetch
    }
  }

  if (!token) {
    throw new Error(
      'LICHESS_TOKEN mancante in .env e posizione non presente in cache (.cache/lichess/). Inserisci LICHESS_TOKEN in .env.'
    );
  }

  const url =
    endpointType === 'masters'
      ? `https://explorer.lichess.ovh/masters?fen=${encodeURIComponent(fen)}&moves=20&topGames=4`
      : `https://explorer.lichess.ovh/lichess?variant=standard&fen=${encodeURIComponent(fen)}&ratings=${encodeURIComponent(bucketsStr)}&speeds=${encodeURIComponent(speedsStr)}&moves=20&topGames=0&recentGames=0`;

  while (true) {
    await sleep(BUILD_DEFAULTS.API_DELAY_MS);
    statsCounter.apiLiveCalls += 1;
    let res;
    try {
      res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
    } catch (err) {
      console.warn(`⚠️  [Network Retry] Errore connessione Lichess (${err.message}), riprovo tra 5s...`);
      await sleep(5_000);
      continue;
    }

    if (res.status === 429) {
      console.warn('⚠️  [Rate Limit 429] Lichess Explorer: attendo 61 secondi prima di riprovare...');
      await sleep(61_000);
      continue;
    }

    if (res.status >= 500) {
      console.warn(`⚠️  [HTTP ${res.status}] Lichess Explorer temporaneamente non disponibile, riprovo tra 5s...`);
      await sleep(5_000);
      continue;
    }

    if (!res.ok) {
      throw new Error(`Errore API Lichess (${endpointType}, HTTP ${res.status}) per FEN: ${fen}`);
    }

    const json = await res.json();
    const payload = {
      normFen,
      endpointType,
      ratingBand: bandObj.label,
      fetchedAt: new Date().toISOString(),
      data: json,
    };
    fs.writeFileSync(cacheFile, JSON.stringify(payload, null, 2));
    return payload;
  }
}

function saveUpdatedSeedsFile(updatedMoves, updatedMeta) {
  const currentContent = fs.readFileSync(SEEDS_FILE_PATH, 'utf8');
  const beginMarker = '// BEGIN_APPROVED_BY_FEN';
  const endMarker = '// END_APPROVED_BY_FEN';
  const beginIdx = currentContent.indexOf(beginMarker);
  const endIdx = currentContent.indexOf(endMarker);
  if (beginIdx === -1 || endIdx === -1) {
    throw new Error('Markers BEGIN_APPROVED_BY_FEN / END_APPROVED_BY_FEN non trovati');
  }
  const movesJson = JSON.stringify(updatedMoves, null, 2);
  const metaJson = JSON.stringify(updatedMeta, null, 2);
  const replacement = `${beginMarker}\nexport const APPROVED_MOVES_BY_FEN = ${movesJson};\n\nexport const APPROVED_META_BY_FEN = ${metaJson};\n${endMarker}`;
  const nextContent =
    currentContent.slice(0, beginIdx) + replacement + currentContent.slice(endIdx + endMarker.length);
  fs.writeFileSync(SEEDS_FILE_PATH, nextContent, 'utf8');
}

function formatMoveStats(raw) {
  const white = Number(raw?.white || 0);
  const draws = Number(raw?.draws || 0);
  const black = Number(raw?.black || 0);
  const totalGames = white + draws + black;
  const whitePct = totalGames > 0 ? Number(((white / totalGames) * 100).toFixed(1)) : 0;
  const drawPct = totalGames > 0 ? Number(((draws / totalGames) * 100).toFixed(1)) : 0;
  const blackPct = totalGames > 0 ? Number(((black / totalGames) * 100).toFixed(1)) : 0;

  const topGames = Array.isArray(raw?.topGames)
    ? raw.topGames.slice(0, 3).map((g) => ({
        id: g.id,
        white: { name: g.white?.name || 'Unknown', rating: g.white?.rating || 0 },
        black: { name: g.black?.name || 'Unknown', rating: g.black?.rating || 0 },
        winner: g.winner || null,
        year: g.year || 0,
        month: g.month,
      }))
    : undefined;

  return {
    white,
    draws,
    black,
    totalGames,
    whitePct,
    drawPct,
    blackPct,
    ...(topGames && topGames.length > 0 ? { topGames } : {}),
  };
}

function detectVariation(moveSequenceSan) {
  const seq = moveSequenceSan.join(' ');
  if (seq.startsWith('e4 c6 d4 d5 e5')) {
    return {
      variationId: 'advance-bf5',
      variationName: 'Variante di Spinta (3.e5 Bf5)',
    };
  }
  if (seq.startsWith('e4 c6 d4 d5 Nc3') || seq.startsWith('e4 c6 d4 d5 Nd2')) {
    return {
      variationId: 'classical-bf5',
      variationName: 'Variante Classica (4.Nxe4 Bf5)',
    };
  }
  if (seq.startsWith('e4 c6 d4 d5 exd5')) {
    return {
      variationId: 'exchange-cxd5',
      variationName: 'Variante di Cambio & Panov (3.exd5 cxd5)',
    };
  }
  if (seq.startsWith('e4 c6 Bc4')) {
    return {
      variationId: 'hillbilly-bc4',
      variationName: "Attacco dell'Alfiere / Hillbilly (2.Bc4 d5)",
    };
  }
  return {
    variationId: 'caro-kann-root',
    variationName: 'Caro-Kann: Impianto Principale (1.e4 c6 2.d4 d5)',
  };
}

/**
 * Valuta una mossa specifica alla STESSA profondità della ricerca multipv (depth 18).
 * Se la mossa è già presente nelle prime N linee multipv, legge direttamente il suo punteggio.
 * Altrimenti usa `searchmoves <uci>` alla stessa identica profondità (depth 18).
 */
async function getMoveEvalAtSameDepth(sfRunner, fullFen, moveSan, moveUci, multiPvEval, depth) {
  const existingLine = (multiPvEval.lines || []).find(
    (l) => l.moveUci === moveUci || l.moveSan === moveSan
  );
  if (existingLine) {
    return {
      scoreSideToMovePawns: existingLine.scoreSideToMovePawns,
      scoreWhitePawns: existingLine.scoreWhitePawns,
      pvSan: existingLine.pvSan,
      fromMultiPv: true,
    };
  }

  const smEval = await sfRunner.evaluatePosition(fullFen, {
    depth,
    multipv: 1,
    searchMoves: [moveUci],
  });
  const smLine = smEval.lines?.[0];
  return {
    scoreSideToMovePawns: smLine ? smLine.scoreSideToMovePawns : smEval.scoreSideToMovePawns,
    scoreWhitePawns: smLine ? smLine.scoreWhitePawns : smEval.scoreWhitePawns,
    pvSan: smLine?.pvSan?.length ? smLine.pvSan : [moveSan],
    fromMultiPv: false,
  };
}

function classifyMistakeSeverity(evalLoss) {
  if (evalLoss >= 2.5) return 'blunder';
  if (evalLoss >= 1.0) return 'mistake';
  if (evalLoss >= 0.4) return 'inaccuracy';
  return null;
}

async function main() {
  console.log('==========================================================');
  console.log(`🏗️  BUILD REPERTORIO — FASE 1 (CHECKPOINT ${BUILD_DEFAULTS.CHECKPOINT}: CARO-KANN)`);
  console.log('==========================================================');
  console.log('Configurazione parametri:');
  console.log(`  • Fascia di rating (unica): ${RATING_BAND.label} (buckets API: ${RATING_BAND.buckets.join(',')})`);
  console.log(`  • Profondità massima:       ${BUILD_DEFAULTS.MAX_MOVES_DEPTH} mosse (${BUILD_DEFAULTS.MAX_MOVES_DEPTH * 2} semimosse)`);
  console.log(`  • MIN_BAND_GAMES (0-1400):  ${BUILD_DEFAULTS.MIN_BAND_GAMES}`);
  console.log(`  • MIN_BRANCH_FREQ (0-1400): ${(BUILD_DEFAULTS.MIN_BRANCH_FREQ * 100).toFixed(1)}%`);
  console.log(`  • MIN_REACH (cumulativa):   ${(BUILD_DEFAULTS.MIN_REACH * 100).toFixed(2)}%`);
  console.log(`  • MAX_POSITIONS_CAP:        ${BUILD_DEFAULTS.MAX_POSITIONS_CAP}`);
  console.log(`  • MIN_MASTERS_FOR_FREQ:     ${BUILD_DEFAULTS.MIN_MASTERS_FOR_FREQ} partite GM`);
  console.log(
    `  • Stockfish Engine:         ${STOCKFISH_PACKAGE_INFO} (depth ${BUILD_DEFAULTS.STOCKFISH_DEPTH}, multipv ${BUILD_DEFAULTS.STOCKFISH_MULTIPV})`
  );
  if (BUILD_DEFAULTS.CHECKPOINT === 'B') {
    console.log(
      `  • Errori comuni (0-1400):   freq >= ${(BUILD_DEFAULTS.MIN_MISTAKE_FREQ * 100).toFixed(0)}%, screen d${BUILD_DEFAULTS.MISTAKE_SCREEN_DEPTH} -> confirm d${BUILD_DEFAULTS.MISTAKE_CONFIRM_DEPTH} multipv ${BUILD_DEFAULTS.MISTAKE_CONFIRM_MULTIPV}, max ${BUILD_DEFAULTS.MAX_MISTAKES_PER_POS}/pos`
    );
  }
  console.log('----------------------------------------------------------');

  const token = loadEnvToken();
  const autoAccept = process.argv.includes('--auto-accept');
  const approvedMap = getApprovedSeedMap();
  const updatedSeedMoves = { ...APPROVED_MOVES_BY_FEN };
  const updatedSeedMeta = { ...APPROVED_META_BY_FEN };
  let autoAcceptedCount = 0;

  const sfRunner = new StockfishRunner({ useCache: true });
  await sfRunner.init();

  const statsCounter = {
    apiCacheHits: 0,
    apiLiveCalls: 0,
  };

  const positions = {};
  const unresolvedForReview = [];
  const buildWarnings = [];

  const initialChess = new Chess();
  initialChess.move('e4');
  const rootFullFen = initialChess.fen();
  const rootNormalizedFen = normalizeFen(rootFullFen);

  // Mappa della probabilità cumulativa (reach) dall'inizio della variante per ogni FEN normalizzato
  const reachByFen = new Map([[rootNormalizedFen, 1.0]]);

  const queue = [
    {
      fullFen: rootFullFen,
      normalizedFen: rootNormalizedFen,
      moveSequenceSan: ['e4'],
      ply: 1,
    },
  ];
  const visitedFens = new Set([rootNormalizedFen]);

  while (queue.length > 0) {
    if (visitedFens.size > BUILD_DEFAULTS.MAX_POSITIONS_CAP) {
      console.error(
        `❌ STOP DI SICUREZZA: Il numero di posizioni (${visitedFens.size}) supera MAX_POSITIONS_CAP (${BUILD_DEFAULTS.MAX_POSITIONS_CAP})!`
      );
      process.exit(1);
    }

    const current = queue.shift();
    const { fullFen, normalizedFen, moveSequenceSan, ply } = current;
    const nodeReach = reachByFen.get(normalizedFen) ?? 1.0;

    const chess = new Chess(fullFen);
    const turn = chess.turn();
    const isPlayerTurn = turn === 'b'; // Nero nella Caro-Kann
    const moveNumber = Math.floor(ply / 2) + 1;
    const { variationId, variationName } = detectVariation(moveSequenceSan);
    const isSecondaryVariation =
      variationId === 'exchange-cxd5' || variationId === 'hillbilly-bc4';
    const maxPly = isSecondaryVariation ? 10 : BUILD_DEFAULTS.MAX_MOVES_DEPTH * 2;
    const effectiveMinReach = isSecondaryVariation ? 0.035 : BUILD_DEFAULTS.MIN_REACH;
    const pgnChess = new Chess();
    for (const m of moveSequenceSan) pgnChess.move(m);
    const pgnPath = pgnChess
      .pgn()
      .replace(/^\[.*?\]\s*/gms, '')
      .replace(/\s*\*$/, '')
      .replace(/\s+/g, ' ')
      .trim();

    const node = {
      normalizedFen,
      fullFen,
      moveNumber,
      ply,
      turn,
      isPlayerTurn,
      pgnPath,
      moveSequenceSan,
      variationId,
      variationName,
      reachPct: Number((nodeReach * 100).toFixed(2)),
      ...(AI_COMMENTS_UNVERIFIED_BY_FEN[normalizedFen]
        ? { aiCommentUnverified: AI_COMMENTS_UNVERIFIED_BY_FEN[normalizedFen] }
        : {}),
    };

    if (isPlayerTurn) {
      const mastersRes = await fetchLichessEndpoint('masters', fullFen, token, statsCounter);
      const mastersData = mastersRes.data;
      const positionGmStats = formatMoveStats(mastersData);
      node.positionGmStats = positionGmStats;
      if (mastersData.opening?.eco) {
        node.ecoCode = mastersData.opening.eco;
        node.ecoName = mastersData.opening.name;
      }

      let approvedEntry = approvedMap.get(normalizedFen);

      if (!approvedEntry) {
        // Posizione non coperta nei seed: ricerca multipv unica a depth 18
        const posEval = await sfRunner.evaluatePosition(fullFen, {
          depth: BUILD_DEFAULTS.STOCKFISH_DEPTH,
          multipv: BUILD_DEFAULTS.STOCKFISH_MULTIPV,
        });
        const bestBlackEval = posEval.scoreSideToMovePawns;
        const hasEnoughMasters = positionGmStats.totalGames >= BUILD_DEFAULTS.MIN_MASTERS_FOR_FREQ;

        let selectionRule = 'masters_freq';
        let recommended = [];
        let evaluatedCandidates = [];

        if (hasEnoughMasters) {
          // >= 50 partite Masters: regola Masters invariata (più giocata nei GM entro 0.30)
          const rawMastersMoves = Array.isArray(mastersData.moves) ? mastersData.moves : [];
          const candidateSanSet = new Set();
          for (const m of rawMastersMoves.slice(0, 6)) {
            candidateSanSet.add(m.san);
          }
          for (const line of posEval.lines || []) {
            if (line.moveSan) candidateSanSet.add(line.moveSan);
          }

          for (const san of candidateSanSet) {
            const nextChess = new Chess(fullFen);
            const moveObj = nextChess.move(san);
            if (!moveObj) continue;

            const uci = `${moveObj.from}${moveObj.to}${moveObj.promotion || ''}`;
            const sameDepthEval = await getMoveEvalAtSameDepth(
              sfRunner,
              fullFen,
              moveObj.san,
              uci,
              posEval,
              BUILD_DEFAULTS.STOCKFISH_DEPTH
            );

            const moveBlackEval = sameDepthEval.scoreSideToMovePawns;
            const evalLossVsBest = Number((bestBlackEval - moveBlackEval).toFixed(2));

            const rawGmMove = rawMastersMoves.find((m) => m.san === moveObj.san || m.uci === uci);
            const gmStats = rawGmMove
              ? formatMoveStats(rawGmMove)
              : { totalGames: 0, blackPct: 0, drawPct: 0, whitePct: 0 };

            evaluatedCandidates.push({
              san: moveObj.san,
              uci,
              masterGames: gmStats.totalGames,
              gmWinBlackPct: gmStats.blackPct,
              gmDrawPct: gmStats.drawPct,
              gmWinWhitePct: gmStats.whitePct,
              evalForBlackPawns: moveBlackEval,
              evalWhitePawns: sameDepthEval.scoreWhitePawns,
              evalLossVsBest,
              within030Threshold: evalLossVsBest <= BUILD_DEFAULTS.CANDIDATE_MAX_LOSS,
              pvSan: sameDepthEval.pvSan,
            });
          }

          recommended = evaluatedCandidates
            .filter((c) => c.within030Threshold)
            .sort((a, b) => b.masterGames - a.masterGames || a.evalLossVsBest - b.evalLossVsBest);
          if (recommended.length === 0) {
            recommended = [...evaluatedCandidates].sort((a, b) => a.evalLossVsBest - b.evalLossVsBest);
          }
        } else {
          // < 50 partite Masters — NUOVA REGOLA A 4 PASSI:
          // 1) candidate = mosse con loss <= 0.15 rispetto alla best (depth 18, multipv 6, stessa ricerca)
          // 2) tra le candidate scegli la più giocata in Lichess 2200+ (ratings=2200,2500), se la posizione ha >= 100 partite lì
          // 3) altrimenti la più giocata nella fascia 0-1400, se ha >= 100 partite
          // 4) altrimenti la migliore del motore
          const highBandRes = await fetchLichessEndpoint('lichess_high', fullFen, token, statsCounter);
          const highBandData = highBandRes.data;
          const highBandPosStats = formatMoveStats(highBandData);
          const rawHighMoves = Array.isArray(highBandData.moves) ? highBandData.moves : [];

          const lowBandRes = await fetchLichessEndpoint('lichess', fullFen, token, statsCounter);
          const lowBandData = lowBandRes.data;
          const lowBandPosStats = formatMoveStats(lowBandData);
          const rawLowMoves = Array.isArray(lowBandData.moves) ? lowBandData.moves : [];
          const rawMastersMoves = Array.isArray(mastersData.moves) ? mastersData.moves : [];

          for (const line of posEval.lines || []) {
            if (!line.moveSan) continue;
            const nextChess = new Chess(fullFen);
            const moveObj = nextChess.move(line.moveSan);
            if (!moveObj) continue;

            const uci = `${moveObj.from}${moveObj.to}${moveObj.promotion || ''}`;
            const moveBlackEval = line.scoreSideToMovePawns;
            const evalLossVsBest = Number((bestBlackEval - moveBlackEval).toFixed(2));

            const rawGmMove = rawMastersMoves.find((m) => m.san === moveObj.san || m.uci === uci);
            const gmStats = rawGmMove
              ? formatMoveStats(rawGmMove)
              : { totalGames: 0, blackPct: 0, drawPct: 0, whitePct: 0 };

            const rawHighMove = rawHighMoves.find((m) => m.san === moveObj.san || m.uci === uci);
            const highStats = rawHighMove ? formatMoveStats(rawHighMove) : { totalGames: 0 };

            const rawLowMove = rawLowMoves.find((m) => m.san === moveObj.san || m.uci === uci);
            const lowStats = rawLowMove ? formatMoveStats(rawLowMove) : { totalGames: 0 };

            evaluatedCandidates.push({
              san: moveObj.san,
              uci,
              masterGames: gmStats.totalGames,
              highBandGames: highStats.totalGames,
              lowBandGames: lowStats.totalGames,
              gmWinBlackPct: gmStats.blackPct,
              gmDrawPct: gmStats.drawPct,
              gmWinWhitePct: gmStats.whitePct,
              evalForBlackPawns: moveBlackEval,
              evalWhitePawns: line.scoreWhitePawns,
              evalLossVsBest,
              within015Threshold: evalLossVsBest <= BUILD_DEFAULTS.LOW_MASTERS_MAX_LOSS,
              pvSan: line.pvSan,
            });
          }

          const candidates015 = evaluatedCandidates.filter((c) => c.within015Threshold);
          const pool = candidates015.length > 0 ? candidates015 : evaluatedCandidates;

          const byHighBand = [...pool].sort(
            (a, b) => b.highBandGames - a.highBandGames || a.evalLossVsBest - b.evalLossVsBest
          );
          const byLowBand = [...pool].sort(
            (a, b) => b.lowBandGames - a.lowBandGames || a.evalLossVsBest - b.evalLossVsBest
          );
          const byEngine = [...pool].sort((a, b) => a.evalLossVsBest - b.evalLossVsBest);

          if (
            highBandPosStats.totalGames >= BUILD_DEFAULTS.MIN_HIGH_BAND_GAMES &&
            byHighBand[0] &&
            byHighBand[0].highBandGames > 0
          ) {
            selectionRule = 'lichess_2200_plus';
            recommended = byHighBand;
          } else if (
            lowBandPosStats.totalGames >= BUILD_DEFAULTS.MIN_LOW_BAND_GAMES_FOR_CHOICE &&
            byLowBand[0] &&
            byLowBand[0].lowBandGames > 0
          ) {
            selectionRule = 'band_0_1400';
            recommended = byLowBand;
          } else {
            selectionRule = 'engine_best';
            recommended = byEngine;
          }
        }

        if (autoAccept && recommended[0]) {
          const topProposal = recommended[0];
          approvedEntry = {
            san: topProposal.san,
            source: 'accepted_proposal',
            selectionRule,
            acceptedVia: 'accept-top',
          };
          approvedMap.set(normalizedFen, approvedEntry);
          updatedSeedMoves[normalizedFen] = topProposal.san;
          updatedSeedMeta[normalizedFen] = {
            source: 'accepted_proposal',
            selectionRule,
            acceptedVia: 'accept-top',
            masterGamesAtPosition: positionGmStats.totalGames,
          };
          autoAcceptedCount += 1;
        } else {
          unresolvedForReview.push({
            normalizedFen,
            fullFen,
            pgnPath,
            moveSequenceSan,
            variationName,
            positionMasterGames: positionGmStats.totalGames,
            selectionRule,
            engineBestMoveSan: posEval.bestMoveSan,
            engineBestEvalForBlack: bestBlackEval,
            proposedMoves: recommended,
            allEvaluatedMoves: evaluatedCandidates,
          });

          positions[normalizedFen] = node;
          continue;
        }
      }

      // Mossa approvata nei seed: verifichiamola con ricerca multipv unica a depth 18
      const approvedSan = approvedEntry.san;
      const moveCheckChess = new Chess(fullFen);
      const moveObj = moveCheckChess.move(approvedSan);
      if (!moveObj) {
        throw new Error(`Mossa approvata illegale "${approvedSan}" per FEN: ${fullFen}`);
      }

      const nextFullFen = moveCheckChess.fen();
      const nextNormalizedFen = normalizeFen(nextFullFen);
      const uci = `${moveObj.from}${moveObj.to}${moveObj.promotion || ''}`;

      const rawMoveEntry = (mastersData.moves || []).find((m) => m.san === moveObj.san || m.uci === uci);
      const moveGmStats = rawMoveEntry
        ? formatMoveStats(rawMoveEntry)
        : { white: 0, draws: 0, black: 0, totalGames: 0, whitePct: 0, drawPct: 0, blackPct: 0 };

      const bandForPlayerRes = await fetchLichessEndpoint('lichess', fullFen, token, statsCounter);
      const bandForPlayerData = bandForPlayerRes.data;
      const rawBandMoveEntry = (bandForPlayerData.moves || []).find((m) => m.san === moveObj.san || m.uci === uci);
      const moveBandStats = rawBandMoveEntry
        ? formatMoveStats(rawBandMoveEntry)
        : { white: 0, draws: 0, black: 0, totalGames: 0, whitePct: 0, drawPct: 0, blackPct: 0 };

      // Ricerca multipv unica a depth 18 sulla posizione corrente
      const multiPvEval = await sfRunner.evaluatePosition(fullFen, {
        depth: BUILD_DEFAULTS.STOCKFISH_DEPTH,
        multipv: BUILD_DEFAULTS.STOCKFISH_MULTIPV,
      });
      const bestBlackEval = multiPvEval.scoreSideToMovePawns;
      const bestWhiteEval = multiPvEval.scoreWhitePawns;

      const chosenSameDepth = await getMoveEvalAtSameDepth(
        sfRunner,
        fullFen,
        moveObj.san,
        uci,
        multiPvEval,
        BUILD_DEFAULTS.STOCKFISH_DEPTH
      );

      const chosenBlackEval = chosenSameDepth.scoreSideToMovePawns;
      const chosenWhiteEval = chosenSameDepth.scoreWhitePawns;
      // Niente Math.max(0, ...): differenza reale alla stessa profondità
      const evalLossVsBest = Number((bestBlackEval - chosenBlackEval).toFixed(2));

      if (evalLossVsBest < 0) {
        const msg = `⚠️ Warning di incoerenza (${pgnPath}): la tua mossa ${moveObj.san} (${chosenBlackEval}) risulta migliore della bestMove ${multiPvEval.bestMoveSan} (${bestBlackEval}) di ${Math.abs(evalLossVsBest).toFixed(2)} pedoni.`;
        console.warn(msg);
        buildWarnings.push({
          type: 'inconsistency',
          normalizedFen,
          pgnPath,
          chosenMoveSan: moveObj.san,
          engineBestMoveSan: multiPvEval.bestMoveSan,
          chosenBlackEval,
          bestBlackEval,
          evalLossVsBest,
          message: msg,
        });
      } else if (evalLossVsBest > BUILD_DEFAULTS.WARNING_MAX_LOSS) {
        const msg = `⚠️ Warning perdita valutazione (${pgnPath}): la tua mossa ${moveObj.san} perde ${evalLossVsBest.toFixed(2)} pedoni rispetto a ${multiPvEval.bestMoveSan}.`;
        console.warn(msg);
        buildWarnings.push({
          type: 'eval_loss_exceeded',
          normalizedFen,
          pgnPath,
          chosenMoveSan: moveObj.san,
          engineBestMoveSan: multiPvEval.bestMoveSan,
          chosenBlackEval,
          bestBlackEval,
          evalLossVsBest,
          message: msg,
        });
      }

      // Determina il criterio di selezione effettivo per il report
      const effectiveSelectionRule =
        approvedEntry.source === 'seed'
          ? 'seed'
          : approvedEntry.selectionRule ||
            (positionGmStats.totalGames >= BUILD_DEFAULTS.MIN_MASTERS_FOR_FREQ
              ? 'masters_freq'
              : 'engine_best');

      node.playerMove = {
        san: moveObj.san,
        uci,
        from: moveObj.from,
        to: moveObj.to,
        ...(moveObj.promotion ? { promotion: moveObj.promotion } : {}),
        nextNormalizedFen,
        nextFullFen,
        selectionSource: approvedEntry.source,
        selectionRule: effectiveSelectionRule,
        acceptedVia: approvedEntry.acceptedVia || (approvedEntry.source === 'seed' ? 'seed' : 'manual'),
        gmStats: moveGmStats,
        bandStats: moveBandStats,
        engine: {
          evalPawns: chosenWhiteEval,
          evalFromPlayerPerspective: chosenBlackEval,
          bestMoveSan: multiPvEval.bestMoveSan || moveObj.san,
          bestMoveUci: multiPvEval.bestMoveUci || uci,
          bestEvalPawns: bestWhiteEval,
          evalLossVsBest,
          depth: BUILD_DEFAULTS.STOCKFISH_DEPTH,
          pvSan: chosenSameDepth.pvSan,
        },
        ...(ARROWS_BY_FEN[normalizedFen] ? { arrows: ARROWS_BY_FEN[normalizedFen] } : {}),
        ...(AI_COMMENTS_UNVERIFIED_BY_FEN[normalizedFen]
          ? { aiCommentUnverified: AI_COMMENTS_UNVERIFIED_BY_FEN[normalizedFen] }
          : {}),
      };

      positions[normalizedFen] = node;

      // Il giocatore gioca la sua unica mossa con probabilità 1.0 nel repertorio:
      // se siamo sul tronco di ingresso (fino a 3...Bf5 o 4...Bf5), la radice della variante parte con reach = 1.0
      const isVariationRootAfterMove =
        (ply === 3 && variationId === 'hillbilly-bc4' && moveObj.san === 'd5') ||
        (ply === 5 && (moveObj.san === 'Bf5' || moveObj.san === 'cxd5')) ||
        (ply === 7 && moveObj.san === 'Bf5');
      const nextReach = isVariationRootAfterMove ? 1.0 : nodeReach;

      reachByFen.set(
        nextNormalizedFen,
        isVariationRootAfterMove
          ? 1.0
          : Math.max(reachByFen.get(nextNormalizedFen) || 0, nextReach)
      );

      if (ply + 1 <= maxPly && !visitedFens.has(nextNormalizedFen)) {
        visitedFens.add(nextNormalizedFen);
        if (visitedFens.size > BUILD_DEFAULTS.MAX_POSITIONS_CAP) {
          console.error(
            `❌ STOP DI SICUREZZA: Il numero di posizioni (${visitedFens.size}) supera MAX_POSITIONS_CAP (${BUILD_DEFAULTS.MAX_POSITIONS_CAP})!`
          );
          process.exit(1);
        }
        queue.push({
          fullFen: nextFullFen,
          normalizedFen: nextNormalizedFen,
          moveSequenceSan: [...moveSequenceSan, moveObj.san],
          ply: ply + 1,
        });
      }
    } else {
      // Turno dell'AVVERSARIO (Bianco): albero delle risposte dalla fascia 0-1400
      const bandRes = await fetchLichessEndpoint('lichess', fullFen, token, statsCounter);
      const bandData = bandRes.data;
      const positionBandStats = formatMoveStats(bandData);
      node.positionBandStats = positionBandStats;
      if (bandData.opening?.eco) {
        node.ecoCode = bandData.opening.eco;
        node.ecoName = bandData.opening.name;
      }

      const rawMoves = Array.isArray(bandData.moves) ? bandData.moves : [];
      const totalPosBandGames = positionBandStats.totalGames;
      const opponentMoves = [];

      if (ply < maxPly) {
        for (const m of rawMoves) {
          const mBandStats = formatMoveStats(m);
          const freq = totalPosBandGames > 0 ? mBandStats.totalGames / totalPosBandGames : 0;

          // Calcola la probabilità cumulativa (reach) dall'inizio della variante
          // Nei primi tratti di definizione della variante (ply 2 = 2.d4, ply 4 = 3.e5/Nc3, ply 6 in Classica = 4.Nxe4),
          // se è la mossa che definisce la variante, reach parte da 1.0; altrimenti nodeReach * freq.
          let branchReach = nodeReach * freq;
          let allowBranch = false;

          if (ply === 2) {
            allowBranch = (CARO_KANN_CONFIG.allowedWhiteMove2San || ['d4']).includes(m.san);
            if (allowBranch) branchReach = 1.0;
          } else if (ply === 4 && variationId !== 'hillbilly-bc4') {
            allowBranch =
              CARO_KANN_CONFIG.allowedWhiteMove3San.includes(m.san) &&
              mBandStats.totalGames >= BUILD_DEFAULTS.MIN_BAND_GAMES &&
              freq >= BUILD_DEFAULTS.MIN_BRANCH_FREQ;
            if (allowBranch) branchReach = 1.0;
          } else {
            allowBranch =
              mBandStats.totalGames >= BUILD_DEFAULTS.MIN_BAND_GAMES &&
              freq >= BUILD_DEFAULTS.MIN_BRANCH_FREQ &&
              branchReach >= effectiveMinReach;
          }

          if (!allowBranch) continue;

          const nextChess = new Chess(fullFen);
          const moveObj = nextChess.move(m.san);
          if (!moveObj) continue;

          const nextFullFen = nextChess.fen();
          const nextNormalizedFen = normalizeFen(nextFullFen);
          const uci = `${moveObj.from}${moveObj.to}${moveObj.promotion || ''}`;

          opponentMoves.push({
            san: moveObj.san,
            uci,
            from: moveObj.from,
            to: moveObj.to,
            ...(moveObj.promotion ? { promotion: moveObj.promotion } : {}),
            nextNormalizedFen,
            nextFullFen,
            bandStats: mBandStats,
            frequencyPct: Number((freq * 100).toFixed(1)),
            reachPct: Number((branchReach * 100).toFixed(2)),
          });

          reachByFen.set(
            nextNormalizedFen,
            (reachByFen.get(nextNormalizedFen) || 0) + branchReach
          );

          if (!visitedFens.has(nextNormalizedFen)) {
            visitedFens.add(nextNormalizedFen);
            if (visitedFens.size > BUILD_DEFAULTS.MAX_POSITIONS_CAP) {
              console.error(
                `❌ STOP DI SICUREZZA: Il numero di posizioni (${visitedFens.size}) supera MAX_POSITIONS_CAP (${BUILD_DEFAULTS.MAX_POSITIONS_CAP})!`
              );
              process.exit(1);
            }
            queue.push({
              fullFen: nextFullFen,
              normalizedFen: nextNormalizedFen,
              moveSequenceSan: [...moveSequenceSan, moveObj.san],
              ply: ply + 1,
            });
          }
        }
      }

      node.opponentMoves = opponentMoves;
      positions[normalizedFen] = node;
    }
  }

  if (autoAcceptedCount > 0) {
    saveUpdatedSeedsFile(updatedSeedMoves, updatedSeedMeta);
    console.log(`💾 Salvate ${autoAcceptedCount} mosse in scripts/repertoire-seeds.mjs (--auto-accept).`);
  }

  const sfStats = sfRunner.getStats();
  console.log(
    `\n📊 Posizioni stimate/esplorate nell'albero: ${Object.keys(positions).length} / ${BUILD_DEFAULTS.MAX_POSITIONS_CAP}`
  );
  console.log(
    `🌐 Richieste Lichess API:     ${statsCounter.apiLiveCalls} live, ${statsCounter.apiCacheHits} da cache disco`
  );
  console.log(
    `🤖 Valutazioni Stockfish:     ${sfStats.totalEvalCalls} totali (media ${sfStats.avgMsPerPosition} ms/pos), ${sfStats.cacheHits} da cache disco`
  );

  if (buildWarnings.length > 0) {
    fs.writeFileSync(BUILD_WARNINGS_PATH, JSON.stringify(buildWarnings, null, 2), 'utf8');
    console.warn(`⚠️  Generato build-warnings.json con ${buildWarnings.length} segnalazioni.`);
  } else if (fs.existsSync(BUILD_WARNINGS_PATH)) {
    fs.unlinkSync(BUILD_WARNINGS_PATH);
  }

  if (unresolvedForReview.length > 0) {
    fs.writeFileSync(
      REVIEW_MOVES_PATH,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          openingId: CARO_KANN_CONFIG.id,
          ratingBand: RATING_BAND.label,
          unresolvedCount: unresolvedForReview.length,
          positions: unresolvedForReview,
        },
        null,
        2
      ),
      'utf8'
    );
    console.log('\n==========================================================');
    console.log(
      `🛑 BUILD FERMATO: Trovate ${unresolvedForReview.length} posizioni in cui tocca a te non ancora confermate nei seed.`
    );
    console.log(`📄 Proposte salvate in: review-moves.json`);
    console.log(
      `👉 Usa "npm run review:moves" per rivederle in blocco e salvarle in scripts/repertoire-seeds.mjs.`
    );
    console.log('==========================================================');
    process.exit(2);
  }

  if (fs.existsSync(REVIEW_MOVES_PATH)) {
    fs.unlinkSync(REVIEW_MOVES_PATH);
  }

  // ============================================================================
  // CHECKPOINT B: Estrazione Errori Comuni dell'Avversario nella fascia 0-1400
  // - Frequenza minima >= 5% nella fascia 0-1400
  // - Screening a depth 14 (ricerca unica + searchmoves alla stessa profondità)
  // - Rivalutazione a depth 20 con multipv 2 di tutte le candidate (vale depth 20)
  // - Ordinati per (frequencyPct * evalLoss) decrescente, max 3 per posizione
  // ============================================================================
  if (BUILD_DEFAULTS.CHECKPOINT === 'B') {
    const maxPly = BUILD_DEFAULTS.MAX_MOVES_DEPTH * 2;
    const opponentNodesList = Object.values(positions).filter((n) => !n.isPlayerTurn);
    console.log(
      `\n🔍 Avvio estrazione Errori Comuni (Checkpoint B, fascia ${RATING_BAND.label}) su ${opponentNodesList.length} nodi avversario...`
    );

    let totalMistakesFound = 0;
    for (let idx = 0; idx < opponentNodesList.length; idx++) {
      const node = opponentNodesList[idx];
      if (node.ply >= maxPly) {
        node.commonMistakes = [];
        continue;
      }

      const bandRes = await fetchLichessEndpoint('lichess', node.fullFen, token, statsCounter);
      const bandData = bandRes.data;
      const rawMoves = Array.isArray(bandData.moves) ? bandData.moves : [];
      const totalPosBandGames = node.positionBandStats?.totalGames || 0;

      if (totalPosBandGames === 0 || rawMoves.length === 0) {
        node.commonMistakes = [];
        continue;
      }

      const frequentMoves = [];
      for (const m of rawMoves) {
        const mBandStats = formatMoveStats(m);
        const freq = mBandStats.totalGames / totalPosBandGames;
        if (freq < BUILD_DEFAULTS.MIN_MISTAKE_FREQ) continue;

        const nextChess = new Chess(node.fullFen);
        const moveObj = nextChess.move(m.san);
        if (!moveObj) continue;

        const uci = `${moveObj.from}${moveObj.to}${moveObj.promotion || ''}`;
        const afterMistakeFullFen = nextChess.fen();
        const afterMistakeNormalizedFen = normalizeFen(afterMistakeFullFen);

        frequentMoves.push({
          moveObj,
          uci,
          mBandStats,
          freq,
          frequencyPct: Number((freq * 100).toFixed(1)),
          afterMistakeFullFen,
          afterMistakeNormalizedFen,
        });
      }

      if (frequentMoves.length === 0) {
        node.commonMistakes = [];
        continue;
      }

      // 1) Screening a depth 14 (ricerca unica sulla posizione prima della mossa)
      const screenEval = await sfRunner.evaluatePosition(node.fullFen, {
        depth: BUILD_DEFAULTS.MISTAKE_SCREEN_DEPTH,
        multipv: BUILD_DEFAULTS.STOCKFISH_MULTIPV,
      });
      const bestWhiteScoreD14 = screenEval.scoreSideToMovePawns;

      const screenedCandidates = [];
      for (const fm of frequentMoves) {
        const evalD14 = await getMoveEvalAtSameDepth(
          sfRunner,
          node.fullFen,
          fm.moveObj.san,
          fm.uci,
          screenEval,
          BUILD_DEFAULTS.MISTAKE_SCREEN_DEPTH
        );
        const screenLoss = Number((bestWhiteScoreD14 - evalD14.scoreSideToMovePawns).toFixed(2));
        if (screenLoss >= BUILD_DEFAULTS.MISTAKE_MIN_LOSS) {
          screenedCandidates.push({
            ...fm,
            screenLoss,
          });
        }
      }

      if (screenedCandidates.length === 0) {
        node.commonMistakes = [];
        continue;
      }

      // 2) Rivalutazione a depth 20 con multipv 2 di tutte le candidate (vale la classificazione più profonda)
      const deepBeforeEval = await sfRunner.evaluatePosition(node.fullFen, {
        depth: BUILD_DEFAULTS.MISTAKE_CONFIRM_DEPTH,
        multipv: BUILD_DEFAULTS.MISTAKE_CONFIRM_MULTIPV,
      });
      const bestWhiteScoreD20 = deepBeforeEval.scoreSideToMovePawns;

      const confirmedMistakes = [];
      for (const cand of screenedCandidates) {
        const evalD20 = await getMoveEvalAtSameDepth(
          sfRunner,
          node.fullFen,
          cand.moveObj.san,
          cand.uci,
          deepBeforeEval,
          BUILD_DEFAULTS.MISTAKE_CONFIRM_DEPTH
        );

        const deepLoss = Number((bestWhiteScoreD20 - evalD20.scoreSideToMovePawns).toFixed(2));
        if (deepLoss < 0) {
          const msg = `⚠️ Warning di incoerenza errore comune (${node.pgnPath}): ${cand.moveObj.san} (${evalD20.scoreSideToMovePawns}) risulta migliore della bestMove ${deepBeforeEval.bestMoveSan} (${bestWhiteScoreD20}) a depth ${BUILD_DEFAULTS.MISTAKE_CONFIRM_DEPTH}.`;
          console.warn(msg);
          buildWarnings.push({
            type: 'mistake_inconsistency',
            normalizedFen: node.normalizedFen,
            pgnPath: node.pgnPath,
            chosenMoveSan: cand.moveObj.san,
            engineBestMoveSan: deepBeforeEval.bestMoveSan,
            evalLossVsBest: deepLoss,
            message: msg,
          });
        }

        const severity = classifyMistakeSeverity(deepLoss);
        if (!severity) {
          // Scartata a depth 20 perché perde < 0.40 pedoni
          continue;
        }

        // Estrai la punizione del Nero e la PV (max 6 mosse) a depth 20
        let rawPunishPv = Array.isArray(evalD20.pvSan) ? evalD20.pvSan.slice(1) : [];
        if (rawPunishPv.length === 0) {
          const afterEvalD20 = await sfRunner.evaluatePosition(cand.afterMistakeFullFen, {
            depth: BUILD_DEFAULTS.MISTAKE_CONFIRM_DEPTH,
            multipv: BUILD_DEFAULTS.MISTAKE_CONFIRM_MULTIPV,
          });
          rawPunishPv = Array.isArray(afterEvalD20.pvSan) ? afterEvalD20.pvSan : [];
        }

        const punishChess = new Chess(cand.afterMistakeFullFen);
        const validPvSan = [];
        let punishMoveObj = null;

        for (const san of rawPunishPv) {
          if (validPvSan.length >= BUILD_DEFAULTS.MAX_PUNISH_PV_MOVES) break;
          try {
            const mObj = punishChess.move(san);
            if (!mObj) break;
            if (!punishMoveObj) punishMoveObj = mObj;
            validPvSan.push(mObj.san);
          } catch {
            break;
          }
        }

        if (!punishMoveObj) continue;

        const punishMoveUci = `${punishMoveObj.from}${punishMoveObj.to}${punishMoveObj.promotion || ''}`;
        const finalEvalPawns = evalD20.scoreWhitePawns;
        const finalEvalForPlayer = Number((-finalEvalPawns).toFixed(2));
        const impactScore = Number((cand.frequencyPct * deepLoss).toFixed(2));

        confirmedMistakes.push({
          opponentMoveSan: cand.moveObj.san,
          opponentMoveUci: cand.uci,
          from: cand.moveObj.from,
          to: cand.moveObj.to,
          afterMistakeNormalizedFen: cand.afterMistakeNormalizedFen,
          afterMistakeFullFen: cand.afterMistakeFullFen,
          frequencyPct: cand.frequencyPct,
          totalBandGames: cand.mBandStats.totalGames,
          evalLoss: deepLoss,
          impactScore,
          severity,
          punishMoveSan: punishMoveObj.san,
          punishMoveUci,
          punishFrom: punishMoveObj.from,
          punishTo: punishMoveObj.to,
          pvSan: validPvSan,
          finalEvalPawns,
          finalEvalForPlayer,
          depth: BUILD_DEFAULTS.MISTAKE_CONFIRM_DEPTH,
        });
      }

      confirmedMistakes.sort((a, b) => b.impactScore - a.impactScore || b.evalLoss - a.evalLoss);
      node.commonMistakes = confirmedMistakes.slice(0, BUILD_DEFAULTS.MAX_MISTAKES_PER_POS);
      totalMistakesFound += node.commonMistakes.length;
    }

    console.log(`✅ Checkpoint B completato: ${totalMistakesFound} errori comuni confermati a depth ${BUILD_DEFAULTS.MISTAKE_CONFIRM_DEPTH}.`);
  }

  if (buildWarnings.length > 0) {
    fs.writeFileSync(BUILD_WARNINGS_PATH, JSON.stringify(buildWarnings, null, 2), 'utf8');
  } else if (fs.existsSync(BUILD_WARNINGS_PATH)) {
    fs.unlinkSync(BUILD_WARNINGS_PATH);
  }

  const finalSfStats = sfRunner.getStats();

  const variationsWithFen = CARO_KANN_CONFIG.variations.map((v) => {
    const c = new Chess();
    for (const s of v.rootMovesSan) c.move(s);
    return {
      ...v,
      rootNormalizedFen: normalizeFen(c.fen()),
    };
  });

  const repertoirePayload = {
    id: CARO_KANN_CONFIG.id,
    name: CARO_KANN_CONFIG.name,
    playerColor: CARO_KANN_CONFIG.playerColor,
    description: CARO_KANN_CONFIG.description,
    checkpoint: BUILD_DEFAULTS.CHECKPOINT,
    generatedAt: new Date().toISOString(),
    ratingBand: RATING_BAND,
    buildConfig: {
      ratingBandLabel: RATING_BAND.label,
      ratingBuckets: RATING_BAND.buckets,
      maxMovesDepth: BUILD_DEFAULTS.MAX_MOVES_DEPTH,
      minBandGames: BUILD_DEFAULTS.MIN_BAND_GAMES,
      minBranchFreq: BUILD_DEFAULTS.MIN_BRANCH_FREQ,
      minReach: BUILD_DEFAULTS.MIN_REACH,
      minMastersForFreq: BUILD_DEFAULTS.MIN_MASTERS_FOR_FREQ,
      minMistakeFreq: BUILD_DEFAULTS.MIN_MISTAKE_FREQ,
      mistakeScreenDepth: BUILD_DEFAULTS.MISTAKE_SCREEN_DEPTH,
      mistakeConfirmDepth: BUILD_DEFAULTS.MISTAKE_CONFIRM_DEPTH,
      mistakeConfirmMultiPv: BUILD_DEFAULTS.MISTAKE_CONFIRM_MULTIPV,
      maxMistakesPerPos: BUILD_DEFAULTS.MAX_MISTAKES_PER_POS,
      maxPositionsCap: BUILD_DEFAULTS.MAX_POSITIONS_CAP,
      stockfishPackage: STOCKFISH_PACKAGE_INFO,
      stockfishDepth: BUILD_DEFAULTS.STOCKFISH_DEPTH,
      avgStockfishMsPerPosition: finalSfStats.avgMsPerPosition,
    },
    variations: variationsWithFen,
    rootNormalizedFen,
    positions,
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const jsonString = JSON.stringify(repertoirePayload, null, 2);
  fs.writeFileSync(OUTPUT_FILE, jsonString, 'utf8');

  const fileSizeBytes = Buffer.byteLength(jsonString, 'utf8');
  const fileSizeKB = (fileSizeBytes / 1024).toFixed(2);

  console.log('\n==========================================================');
  console.log('✅ BUILD REPERTORIO COMPLETATO CON SUCCESSO!');
  console.log(`📁 File generato:          src/data/openings/caro-kann.json`);
  console.log(`📦 Dimensione file:        ${fileSizeBytes} bytes (${fileSizeKB} KB)`);
  console.log(`⏱️  Tempo medio Stockfish:  ${sfStats.avgMsPerPosition} ms / posizione`);
  console.log('==========================================================');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Errore fatale in build-repertoire.mjs:', err);
  process.exit(1);
});
