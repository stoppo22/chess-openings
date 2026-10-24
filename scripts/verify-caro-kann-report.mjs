import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { Chess } from 'chess.js';
import { normalizeFen } from './repertoire-seeds.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const CARO_KANN_FILE = path.join(ROOT_DIR, 'src', 'data', 'openings', 'caro-kann.json');
const BUILD_WARNINGS_FILE = path.join(ROOT_DIR, 'build-warnings.json');

function pickRandomItems(arr, count, seed = 42) {
  const copy = [...arr];
  let s = seed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

function getBandCache(fen, bandLabel = '0-1400', bucketsStr = '0,1000,1200') {
  const normFen = normalizeFen(fen);
  const cacheKey = `lichess|band=${bandLabel}|buckets=${bucketsStr}|speeds=blitz,rapid,classical|${normFen}`;
  const hash = crypto.createHash('sha256').update(cacheKey).digest('hex').slice(0, 24);
  const f = path.join(ROOT_DIR, '.cache', 'lichess', `lichess_${hash}.json`);
  if (fs.existsSync(f)) {
    try {
      return JSON.parse(fs.readFileSync(f, 'utf8')).data;
    } catch {
      return null;
    }
  }
  return null;
}

function computeCoverage(positions, rootSeq, startMoveNum) {
  const c = new Chess();
  for (const s of rootSeq) c.move(s);
  const startNorm = normalizeFen(c.fen());

  let currentLevel = [{ normFen: startNorm, weight: 1.0 }];
  const coverageByMove = {};

  for (let moveNum = startMoveNum; moveNum <= 8; moveNum++) {
    const nextLevel = [];
    let survivingWeightAfterWhiteMove = 0;

    for (const item of currentLevel) {
      const node = positions[item.normFen];
      if (!node || node.isPlayerTurn) continue;
      const oppMoves = node.opponentMoves || [];
      for (const om of oppMoves) {
        const branchWeight = item.weight * (om.frequencyPct / 100);
        survivingWeightAfterWhiteMove += branchWeight;
        const blackNode = positions[om.nextNormalizedFen];
        if (blackNode && blackNode.playerMove) {
          nextLevel.push({
            normFen: blackNode.playerMove.nextNormalizedFen,
            weight: branchWeight,
          });
        }
      }
    }
    coverageByMove[`dopo_mossa_${moveNum}`] = `${Number((survivingWeightAfterWhiteMove * 100).toFixed(1))}%`;
    currentLevel = nextLevel;
  }
  return coverageByMove;
}

function main() {
  if (!fs.existsSync(CARO_KANN_FILE)) {
    console.error(`❌ File non trovato: ${CARO_KANN_FILE}. Esegui prima "npm run build:repertoire".`);
    process.exit(1);
  }

  const stat = fs.statSync(CARO_KANN_FILE);
  const data = JSON.parse(fs.readFileSync(CARO_KANN_FILE, 'utf8'));
  const positions = data.positions || {};
  const nodes = Object.values(positions);
  const bandLabel = data.buildConfig?.ratingBandLabel || '0-1400';
  const bucketsStr = (data.buildConfig?.ratingBuckets || [0, 1000, 1200]).join(',');

  const playerNodes = nodes.filter((n) => n.isPlayerTurn && n.playerMove);
  const opponentNodes = nodes.filter((n) => !n.isPlayerTurn);
  const totalOpponentBranches = opponentNodes.reduce(
    (acc, n) => acc + (Array.isArray(n.opponentMoves) ? n.opponentMoves.length : 0),
    0
  );

  // Conteggio origine/criterio mie mosse
  let fromSeedCount = 0;
  let fromMastersFreqCount = 0;
  let fromEngineLowMastersCount = 0;

  for (const n of playerNodes) {
    const rule = n.playerMove.selectionRule;
    if (n.playerMove.selectionSource === 'seed' || rule === 'seed') {
      fromSeedCount += 1;
    } else if (rule === 'engine_best_low_masters') {
      fromEngineLowMastersCount += 1;
    } else {
      fromMastersFreqCount += 1;
    }
  }

  // Warnings
  const warnings = fs.existsSync(BUILD_WARNINGS_FILE)
    ? JSON.parse(fs.readFileSync(BUILD_WARNINGS_FILE, 'utf8'))
    : [];

  const allCommonMistakes = [];
  const mistakeCountHistogram = { 0: 0, 1: 0, 2: 0, 3: 0 };
  const severityDist = { inaccuracy: 0, mistake: 0, blunder: 0 };

  for (const n of opponentNodes) {
    const list = Array.isArray(n.commonMistakes) ? n.commonMistakes : [];
    const c = Math.min(3, list.length);
    mistakeCountHistogram[c] = (mistakeCountHistogram[c] || 0) + 1;
    for (const m of list) {
      allCommonMistakes.push({ node: n, mistake: m });
      if (severityDist[m.severity] !== undefined) {
        severityDist[m.severity] += 1;
      }
    }
  }

  console.log('========================================================================');
  console.log(`📊 REPORT DI VERIFICA REPERTORIO — ${data.name.toUpperCase()} (CHECKPOINT ${data.checkpoint})`);
  console.log('========================================================================');
  console.log(`📁 File:                       src/data/openings/caro-kann.json`);
  console.log(`📦 Dimensione file:            ${stat.size} bytes (${(stat.size / 1024).toFixed(2)} KB)`);
  console.log(`🎯 Fascia di rating (unica):   ${bandLabel} (buckets: ${bucketsStr})`);
  console.log(
    `⚙️  Soglie copertura:           MIN_BAND_GAMES=${data.buildConfig.minBandGames}, MIN_BRANCH_FREQ=${(data.buildConfig.minBranchFreq * 100).toFixed(1)}%, MIN_REACH=${((data.buildConfig.minReach || 0.005) * 100).toFixed(2)}%`
  );
  console.log(`⚙️  Pacchetto Stockfish:        ${data.buildConfig.stockfishPackage}`);
  console.log(
    `⏱️  Tempo medio Stockfish/pos:  ${data.buildConfig.avgStockfishMsPerPosition} ms (depth ${data.buildConfig.stockfishDepth})`
  );
  console.log(`🔢 Numero totale posizioni:    ${nodes.length} (tetto max: ${data.buildConfig.maxPositionsCap})`);
  console.log(`♟️  Numero di MIE mosse:        ${playerNodes.length}`);
  console.log(`   • Da seed iniziali:         ${fromSeedCount}`);
  console.log(`   • Da proposte (GM >= 50):   ${fromMastersFreqCount}`);
  console.log(`   • Scelte col motore (< 50 GM, depth 18): ${fromEngineLowMastersCount}`);
  console.log(`⚠️  Mie mosse con warning:      ${warnings.length}`);
  if (warnings.length > 0) {
    warnings.forEach((w, idx) => {
      console.log(`     [${idx + 1}] ${w.message}`);
    });
  }
  console.log(
    `⚔️  Numero di mosse avversarie: ${totalOpponentBranches} (fascia ${bandLabel}, in ${opponentNodes.length} nodi avversario)`
  );
  console.log(`⚡ Numero di errori comuni:    ${allCommonMistakes.length}`);
  if (data.checkpoint === 'B' || allCommonMistakes.length > 0) {
    console.log(
      `   • Distribuzione severità:   Inaccuracy: ${severityDist.inaccuracy} | Mistake: ${severityDist.mistake} | Blunder: ${severityDist.blunder}`
    );
    console.log(
      `   • Posizioni per N errori:   0 errori: ${mistakeCountHistogram[0]} | 1 errore: ${mistakeCountHistogram[1]} | 2 errori: ${mistakeCountHistogram[2]} | 3 errori: ${mistakeCountHistogram[3]}`
    );
  }

  // Copertura % dopo mossa 4, 5, 6, 8
  const covAdvance = computeCoverage(positions, ['e4', 'c6', 'd4', 'd5', 'e5', 'Bf5'], 4);
  const covClassicaFrom3 = computeCoverage(positions, ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4'], 4);
  const covClassicaFrom4 = computeCoverage(
    positions,
    ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5'],
    5
  );

  console.log('\n------------------------------------------------------------------------');
  console.log(`📈 COPERTURA % PARTITE FASCIA ${bandLabel} CHE RESTANO NELL'ALBERO:`);
  console.log(
    `  • Advance (da 3.e5 Bf5):          Mossa 4: ${covAdvance.dopo_mossa_4} | Mossa 5: ${covAdvance.dopo_mossa_5} | Mossa 6: ${covAdvance.dopo_mossa_6} | Mossa 8: ${covAdvance.dopo_mossa_8}`
  );
  console.log(
    `  • Classica (da 3.Nc3 dxe4):       Mossa 4: ${covClassicaFrom3.dopo_mossa_4} | Mossa 5: ${covClassicaFrom3.dopo_mossa_5} | Mossa 6: ${covClassicaFrom3.dopo_mossa_6} | Mossa 8: ${covClassicaFrom3.dopo_mossa_8}`
  );
  console.log(
    `  • Classica (da 4.Nxe4 Bf5):       Mossa 5: ${covClassicaFrom4.dopo_mossa_5} | Mossa 6: ${covClassicaFrom4.dopo_mossa_6} | Mossa 8: ${covClassicaFrom4.dopo_mossa_8}`
  );

  // Top 5 risposte avversarie ancora escluse (dentro Advance e Classica, ply >= 6)
  const excluded = [];
  for (const n of opponentNodes) {
    if (n.ply < 6 || n.ply >= 16) continue;
    const bandData = getBandCache(n.fullFen, bandLabel, bucketsStr);
    if (!bandData || !bandData.moves) continue;
    const totalPosGames = (bandData.white || 0) + (bandData.draws || 0) + (bandData.black || 0);
    if (totalPosGames === 0) continue;
    const includedSans = new Set((n.opponentMoves || []).map((m) => m.san));
    const nodeReach = (n.reachPct || 100) / 100;

    for (const m of bandData.moves) {
      if (includedSans.has(m.san)) continue;
      const mGames = (m.white || 0) + (m.draws || 0) + (m.black || 0);
      if (mGames === 0) continue;
      const freq = mGames / totalPosGames;
      const freqPct = Number((freq * 100).toFixed(1));
      const branchReachPct = Number((nodeReach * freq * 100).toFixed(2));
      let reason = '';
      if (mGames < data.buildConfig.minBandGames) {
        reason = `games ${mGames} < ${data.buildConfig.minBandGames}`;
      } else if (freq < data.buildConfig.minBranchFreq) {
        reason = `freq ${freqPct}% < ${(data.buildConfig.minBranchFreq * 100).toFixed(1)}%`;
      } else {
        reason = `reach ${branchReachPct}% < ${((data.buildConfig.minReach || 0.005) * 100).toFixed(2)}%`;
      }

      excluded.push({
        pgnPath: n.pgnPath,
        moveNumber: n.moveNumber,
        san: m.san,
        freqPct,
        branchReachPct,
        gamesInBand: mGames,
        reason,
      });
    }
  }

  console.log('\n------------------------------------------------------------------------');
  console.log('🚫 TOP 5 RISPOSTE AVVERSARIE PIÙ FREQUENTI ANCORA ESCLUSE (per frequenza % nel nodo):');
  excluded
    .sort((a, b) => b.freqPct - a.freqPct)
    .slice(0, 5)
    .forEach((item, idx) => {
      console.log(
        `  ${idx + 1}. Dopo "${item.pgnPath}" -> ${item.moveNumber}. ${item.san} | Freq nodo: ${item.freqPct}% (${item.gamesInBand} partite, reach: ${item.branchReachPct}%) | Motivo: ${item.reason}`
      );
    });

  console.log('\n🚫 TOP 5 RISPOSTE AVVERSARIE ANCORA ESCLUSE (per impatto globale / numero partite 0-1400):');
  excluded
    .sort((a, b) => b.gamesInBand - a.gamesInBand)
    .slice(0, 5)
    .forEach((item, idx) => {
      console.log(
        `  ${idx + 1}. Dopo "${item.pgnPath}" -> ${item.moveNumber}. ${item.san} | Freq nodo: ${item.freqPct}% (${item.gamesInBand} partite, reach: ${item.branchReachPct}%) | Motivo: ${item.reason}`
      );
    });
  console.log('========================================================================');

  const samples = pickRandomItems(playerNodes, Math.min(10, playerNodes.length), 20261024);
  console.log(`\n🎲 ELENCO ${samples.length} POSIZIONI A CASO (CONTROLLO MANUALE MIE MOSSE):`);

  samples.forEach((node, idx) => {
    const pm = node.playerMove;
    const gm = pm.gmStats;
    const band = pm.bandStats || { totalGames: 0, whitePct: 0, drawPct: 0, blackPct: 0 };
    const eng = pm.engine;
    console.log(`\n------------------------------------------------------------------------`);
    console.log(
      `#${idx + 1} [${node.variationName}] (Mossa ${node.moveNumber} • Criterio: ${pm.selectionRule})`
    );
    console.log(`  Sequenza mosse:  ${node.pgnPath}`);
    console.log(`  FEN completo:    ${node.fullFen}`);
    console.log(`  MIA MOSSA:       ${pm.san} (${pm.uci})`);
    console.log(
      `  Statistiche GM:  ${gm.totalGames} partite Masters | Bianco: ${gm.whitePct}% | Patta: ${gm.drawPct}% | Nero: ${gm.blackPct}%`
    );
    console.log(
      `  Fascia ${bandLabel}:   ${band.totalGames} partite | Bianco: ${band.whitePct}% | Patta: ${band.drawPct}% | Nero: ${band.blackPct}%`
    );
    console.log(
      `  Stockfish (d${eng.depth}): Eval Nero ${eng.evalFromPlayerPerspective >= 0 ? '+' : ''}${eng.evalFromPlayerPerspective.toFixed(2)} (Eval Bianco: ${eng.evalPawns >= 0 ? '+' : ''}${eng.evalPawns.toFixed(2)}) | Best Engine: ${eng.bestMoveSan} (loss: ${eng.evalLossVsBest.toFixed(2)})`
    );
    console.log(`  PV Motore:       ${eng.pvSan.join(' ')}`);
  });

  console.log('\n========================================================================');
}

main();
