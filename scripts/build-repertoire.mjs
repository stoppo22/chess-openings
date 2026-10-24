import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { Chess } from 'chess.js';
import {
  CARO_KANN_CONFIG,
  AI_COMMENTS_UNVERIFIED_BY_FEN,
  ARROWS_BY_FEN,
  getApprovedSeedMap,
  normalizeFen,
} from './repertoire-seeds.mjs';
import { StockfishRunner, STOCKFISH_PACKAGE_INFO } from './stockfish-runner.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

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
 * Parametri di configurazione Checkpoint A aggiornati
 */
export const BUILD_DEFAULTS = {
  RATING_BAND,
  MAX_MOVES_DEPTH: Number(process.env.MAX_MOVES_DEPTH || 8), // 8 mosse = 16 semimosse
  MIN_BAND_GAMES: Number(process.env.MIN_BAND_GAMES || 500), // 500 partite nella fascia 0-1400
  MIN_BRANCH_FREQ: Number(process.env.MIN_BRANCH_FREQ || 0.03), // 3% frequenza minima locale nella posizione
  MIN_REACH: Number(process.env.MIN_REACH || 0.005), // 0.5% probabilità cumulativa del ramo dall'inizio della variante
  MAX_POSITIONS_CAP: Number(process.env.MAX_POSITIONS_CAP || 400), // tetto massimo 400 posizioni
  STOCKFISH_DEPTH: Number(process.env.STOCKFISH_DEPTH || 18), // depth 18 per le mie mosse
  STOCKFISH_MULTIPV: Number(process.env.STOCKFISH_MULTIPV || 6), // multipv unica alla stessa profondità
  MIN_MASTERS_FOR_FREQ: Number(process.env.MIN_MASTERS_FOR_FREQ || 50), // sotto 50 partite Masters sceglie la migliore per il motore (depth 18)
  CANDIDATE_MAX_LOSS: 0.30, // entro 0.30 pedoni dalla migliore per review-moves.json
  WARNING_MAX_LOSS: 0.50, // segnala se una mia mossa perde > 0.50 pedoni
  API_DELAY_MS: 350,
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
  const bucketsStr = RATING_BAND.buckets.join(',');
  const speedsStr = RATING_BAND.speeds.join(',');

  const cacheKey =
    endpointType === 'masters'
      ? `masters|${normFen}`
      : `lichess|band=${RATING_BAND.label}|buckets=${bucketsStr}|speeds=${speedsStr}|${normFen}`;

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
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (res.status === 429) {
      console.warn('⚠️  [Rate Limit 429] Lichess Explorer: attendo 60 secondi prima di riprovare...');
      await sleep(60_000);
      continue;
    }

    if (!res.ok) {
      throw new Error(`Errore API Lichess (${endpointType}, HTTP ${res.status}) per FEN: ${fen}`);
    }

    const json = await res.json();
    const payload = {
      normFen,
      endpointType,
      ratingBand: RATING_BAND.label,
      fetchedAt: new Date().toISOString(),
      data: json,
    };
    fs.writeFileSync(cacheFile, JSON.stringify(payload, null, 2));
    return payload;
  }
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

async function main() {
  console.log('==========================================================');
  console.log('🏗️  BUILD REPERTORIO — FASE 1 (CHECKPOINT A: CARO-KANN)');
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
  console.log('----------------------------------------------------------');

  const token = loadEnvToken();
  const approvedMap = getApprovedSeedMap();
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
    const maxPly = BUILD_DEFAULTS.MAX_MOVES_DEPTH * 2;

    const { variationId, variationName } = detectVariation(moveSequenceSan);
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

      const approvedEntry = approvedMap.get(normalizedFen);

      if (!approvedEntry) {
        // Posizione non coperta nei seed: ricerca multipv unica a depth 18
        const posEval = await sfRunner.evaluatePosition(fullFen, {
          depth: BUILD_DEFAULTS.STOCKFISH_DEPTH,
          multipv: BUILD_DEFAULTS.STOCKFISH_MULTIPV,
        });
        const bestBlackEval = posEval.scoreSideToMovePawns;

        const rawMastersMoves = Array.isArray(mastersData.moves) ? mastersData.moves : [];
        const candidateSanSet = new Set();
        for (const m of rawMastersMoves.slice(0, 6)) {
          candidateSanSet.add(m.san);
        }
        for (const line of posEval.lines || []) {
          if (line.moveSan) candidateSanSet.add(line.moveSan);
        }

        const evaluatedCandidates = [];
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

        // REGOLA #3: Se nel database Masters la posizione ha meno di 50 partite,
        // NON scegliere la più frequente ma la MIGLIORE secondo il motore (depth 18) tra le candidate entro 0.30!
        const hasEnoughMasters = positionGmStats.totalGames >= BUILD_DEFAULTS.MIN_MASTERS_FOR_FREQ;
        const selectionRule = hasEnoughMasters ? 'masters_freq' : 'engine_best_low_masters';

        let recommended = evaluatedCandidates.filter((c) => c.within030Threshold);
        if (hasEnoughMasters) {
          recommended.sort((a, b) => b.masterGames - a.masterGames || a.evalLossVsBest - b.evalLossVsBest);
        } else {
          recommended.sort((a, b) => a.evalLossVsBest - b.evalLossVsBest || b.masterGames - a.masterGames);
        }

        if (recommended.length === 0) {
          recommended = [...evaluatedCandidates].sort((a, b) => a.evalLossVsBest - b.evalLossVsBest);
        }

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
          : positionGmStats.totalGames < BUILD_DEFAULTS.MIN_MASTERS_FOR_FREQ
          ? 'engine_best_low_masters'
          : approvedEntry.selectionRule || 'masters_freq';

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
        (ply === 5 && moveObj.san === 'Bf5') || (ply === 7 && moveObj.san === 'Bf5');
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
            allowBranch = m.san === 'd4';
            if (allowBranch) branchReach = 1.0;
          } else if (ply === 4) {
            allowBranch =
              CARO_KANN_CONFIG.allowedWhiteMove3San.includes(m.san) &&
              mBandStats.totalGames >= BUILD_DEFAULTS.MIN_BAND_GAMES &&
              freq >= BUILD_DEFAULTS.MIN_BRANCH_FREQ;
            if (allowBranch) branchReach = 1.0;
          } else {
            allowBranch =
              mBandStats.totalGames >= BUILD_DEFAULTS.MIN_BAND_GAMES &&
              freq >= BUILD_DEFAULTS.MIN_BRANCH_FREQ &&
              branchReach >= BUILD_DEFAULTS.MIN_REACH;
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
    checkpoint: 'A',
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
      maxPositionsCap: BUILD_DEFAULTS.MAX_POSITIONS_CAP,
      stockfishPackage: STOCKFISH_PACKAGE_INFO,
      stockfishDepth: BUILD_DEFAULTS.STOCKFISH_DEPTH,
      avgStockfishMsPerPosition: sfStats.avgMsPerPosition,
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
