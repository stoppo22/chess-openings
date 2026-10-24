import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const CARO_KANN_FILE = path.join(ROOT_DIR, 'src', 'data', 'openings', 'caro-kann.json');

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

function main() {
  if (!fs.existsSync(CARO_KANN_FILE)) {
    console.error(`❌ File non trovato: ${CARO_KANN_FILE}. Esegui prima "npm run build:repertoire".`);
    process.exit(1);
  }

  const stat = fs.statSync(CARO_KANN_FILE);
  const data = JSON.parse(fs.readFileSync(CARO_KANN_FILE, 'utf8'));
  const nodes = Object.values(data.positions || {});
  const bandLabel = data.buildConfig?.ratingBandLabel || '0-1400';

  const playerNodes = nodes.filter((n) => n.isPlayerTurn && n.playerMove);
  const opponentNodes = nodes.filter((n) => !n.isPlayerTurn);
  const totalOpponentBranches = opponentNodes.reduce(
    (acc, n) => acc + (Array.isArray(n.opponentMoves) ? n.opponentMoves.length : 0),
    0
  );

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
  console.log(`🎯 Fascia di rating (unica):   ${bandLabel} (buckets: ${data.buildConfig.ratingBuckets?.join(',')})`);
  console.log(`⚙️  Pacchetto Stockfish:        ${data.buildConfig.stockfishPackage}`);
  console.log(`⏱️  Tempo medio Stockfish/pos:  ${data.buildConfig.avgStockfishMsPerPosition} ms (depth ${data.buildConfig.stockfishDepth})`);
  console.log(`🔢 Numero totale posizioni:    ${nodes.length} (tetto max: ${data.buildConfig.maxPositionsCap})`);
  console.log(`♟️  Numero di MIE mosse:        ${playerNodes.length}`);
  console.log(`⚔️  Numero di mosse avversarie: ${totalOpponentBranches} (fascia ${bandLabel}, in ${opponentNodes.length} nodi avversario)`);
  console.log(`⚡ Numero di errori comuni:    ${allCommonMistakes.length}`);
  if (data.checkpoint === 'B' || allCommonMistakes.length > 0) {
    console.log(
      `   • Distribuzione severità:   Inaccuracy: ${severityDist.inaccuracy} | Mistake: ${severityDist.mistake} | Blunder: ${severityDist.blunder}`
    );
    console.log(
      `   • Posizioni per N errori:   0 errori: ${mistakeCountHistogram[0]} | 1 errore: ${mistakeCountHistogram[1]} | 2 errori: ${mistakeCountHistogram[2]} | 3 errori: ${mistakeCountHistogram[3]}`
    );
  }
  console.log('========================================================================');

  const samples = pickRandomItems(playerNodes, Math.min(10, playerNodes.length), 20261024);
  console.log(`\n🎲 ELENCO ${samples.length} POSIZIONI A CASO (CONTROLLO MANUALE MIE MOSSE):`);

  samples.forEach((node, idx) => {
    const pm = node.playerMove;
    const gm = pm.gmStats;
    const eng = pm.engine;
    console.log(`\n------------------------------------------------------------------------`);
    console.log(`#${idx + 1} [${node.variationName}] (Mossa ${node.moveNumber})`);
    console.log(`  Sequenza mosse:  ${node.pgnPath}`);
    console.log(`  FEN completo:    ${node.fullFen}`);
    console.log(`  MIA MOSSA:       ${pm.san} (${pm.uci})`);
    console.log(
      `  Statistiche GM:  ${gm.totalGames} partite Masters | Bianco: ${gm.whitePct}% | Patta: ${gm.drawPct}% | Nero: ${gm.blackPct}%`
    );
    console.log(
      `  Stockfish (d${eng.depth}): Eval Nero ${eng.evalFromPlayerPerspective >= 0 ? '+' : ''}${eng.evalFromPlayerPerspective.toFixed(2)} (Eval Bianco: ${eng.evalPawns >= 0 ? '+' : ''}${eng.evalPawns.toFixed(2)}) | Best Engine: ${eng.bestMoveSan} (perdita: ${eng.evalLossVsBest.toFixed(2)})`
    );
    console.log(`  PV Motore:       ${eng.pvSan.join(' ')}`);
  });

  if (allCommonMistakes.length > 0) {
    const punishSamples = pickRandomItems(allCommonMistakes, Math.min(3, allCommonMistakes.length), 99);
    console.log('\n========================================================================');
    console.log(`⚡ CAMPIONI POSIZIONI "PUNISH" (${punishSamples.length} ERRORI COMUNI FASCIA ${bandLabel}):`);
    punishSamples.forEach(({ node, mistake }, idx) => {
      console.log(`\n------------------------------------------------------------------------`);
      console.log(`Punish #${idx + 1} [${node.variationName}] — Severità: ${mistake.severity.toUpperCase()}`);
      console.log(`  Sequenza prima:  ${node.pgnPath}`);
      console.log(`  FEN prima:       ${node.fullFen}`);
      console.log(
        `  Errore Avv.:     ${mistake.opponentMoveSan} (freq. ${bandLabel}: ${mistake.frequencyPct}%, perdita: -${mistake.evalLoss.toFixed(2)}, score: ${mistake.impactScore.toFixed(2)})`
      );
      console.log(`  FEN dopo errore: ${mistake.afterMistakeFullFen}`);
      console.log(`  MIA PUNIZIONE:   ${mistake.punishMoveSan} (${mistake.punishMoveUci})`);
      console.log(`  PV (depth ${mistake.depth}):   ${mistake.pvSan.join(' ')}`);
      console.log(
        `  Valutazione fin: Eval Nero ${mistake.finalEvalForPlayer >= 0 ? '+' : ''}${mistake.finalEvalForPlayer.toFixed(2)} (Eval Bianco: ${mistake.finalEvalPawns >= 0 ? '+' : ''}${mistake.finalEvalPawns.toFixed(2)})`
      );
    });
  }

  console.log('\n========================================================================');
}

main();
