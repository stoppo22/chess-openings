import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { APPROVED_MOVES_BY_FEN } from './repertoire-seeds.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const REVIEW_MOVES_PATH = path.join(ROOT_DIR, 'review-moves.json');
const SEEDS_FILE_PATH = path.join(__dirname, 'repertoire-seeds.mjs');

function updateSeedsFile(updatedMap) {
  const currentContent = fs.readFileSync(SEEDS_FILE_PATH, 'utf8');
  const beginMarker = '// BEGIN_APPROVED_BY_FEN';
  const endMarker = '// END_APPROVED_BY_FEN';
  const beginIdx = currentContent.indexOf(beginMarker);
  const endIdx = currentContent.indexOf(endMarker);

  if (beginIdx === -1 || endIdx === -1) {
    throw new Error('Markers BEGIN_APPROVED_BY_FEN / END_APPROVED_BY_FEN non trovati in scripts/repertoire-seeds.mjs');
  }

  const formattedJson = JSON.stringify(updatedMap, null, 2);
  const replacement = `${beginMarker}\nexport const APPROVED_MOVES_BY_FEN = ${formattedJson};\n${endMarker}`;

  const nextContent =
    currentContent.slice(0, beginIdx) + replacement + currentContent.slice(endIdx + endMarker.length);
  fs.writeFileSync(SEEDS_FILE_PATH, nextContent, 'utf8');
}

async function main() {
  if (!fs.existsSync(REVIEW_MOVES_PATH)) {
    console.log('✅ Nessun file review-moves.json presente: tutte le posizioni sono già confermate nei seed!');
    return;
  }

  const reviewData = JSON.parse(fs.readFileSync(REVIEW_MOVES_PATH, 'utf8'));
  const items = reviewData.positions || [];

  if (items.length === 0) {
    console.log('✅ Nessuna posizione da rivedere in review-moves.json.');
    return;
  }

  const args = process.argv.slice(2);
  const acceptAllTop = args.includes('--accept-top');
  const listOnly = args.includes('--list');

  console.log('==========================================================');
  console.log(`🧐 REVIEW MOSSE REPERTORIO (${items.length} posizioni da confermare)`);
  console.log('==========================================================');

  if (listOnly) {
    items.forEach((item, idx) => {
      console.log(`\n[${idx + 1}/${items.length}] ${item.variationName}`);
      console.log(`  PGN: ${item.pgnPath}`);
      console.log(`  FEN: ${item.fullFen}`);
      console.log(`  Best Stockfish: ${item.engineBestMoveSan} (${item.engineBestEvalForBlack >= 0 ? '+' : ''}${item.engineBestEvalForBlack})`);
      console.log('  Proposte (entro 0.30 pedoni, ordinate per frequenza GM):');
      item.proposedMoves.forEach((m, mIdx) => {
        console.log(
          `    (${mIdx + 1}) ${m.san.padEnd(6)} | GM: ${String(m.masterGames).padStart(5)} partite | Eval Nero: ${m.evalForBlackPawns >= 0 ? '+' : ''}${m.evalForBlackPawns.toFixed(2)} (loss: ${m.evalLossVsBest.toFixed(2)}) | PV: ${m.pvSan.join(' ')}`
        );
      });
    });
    return;
  }

  const updatedMap = { ...APPROVED_MOVES_BY_FEN };
  let addedCount = 0;

  if (acceptAllTop) {
    for (const item of items) {
      const topProposal = item.proposedMoves[0];
      if (!topProposal) continue;
      updatedMap[item.normalizedFen] = topProposal.san;
      addedCount += 1;
      console.log(
        `✅ [${addedCount}/${items.length}] ${item.pgnPath} -> ${topProposal.san} (GM: ${topProposal.masterGames} partite, Eval Nero: ${topProposal.evalForBlackPawns >= 0 ? '+' : ''}${topProposal.evalForBlackPawns.toFixed(2)}, loss: ${topProposal.evalLossVsBest.toFixed(2)})`
      );
    }
    updateSeedsFile(updatedMap);
    console.log('----------------------------------------------------------');
    console.log(`💾 Salvate ${addedCount} mosse in scripts/repertoire-seeds.mjs!`);
    return;
  }

  // Modalità interattiva CLI
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const ask = (q) => new Promise((res) => rl.question(q, res));

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    console.log(`\n----------------------------------------------------------`);
    console.log(`Posizione [${i + 1}/${items.length}] — ${item.variationName}`);
    console.log(`Sequenza: ${item.pgnPath}`);
    console.log(`FEN:      ${item.fullFen}`);
    console.log(`Proposte validate da Stockfish + GM DB:`);
    item.proposedMoves.forEach((m, idx) => {
      console.log(
        `  [${idx + 1}] ${m.san.padEnd(6)} — ${m.masterGames} partite GM | Eval Nero: ${m.evalForBlackPawns >= 0 ? '+' : ''}${m.evalForBlackPawns.toFixed(2)} (loss ${m.evalLossVsBest.toFixed(2)}) | PV: ${m.pvSan.join(' ')}`
      );
    });

    const ans = (
      await ask(`Scegli [Invio = accetta #1 (${item.proposedMoves[0]?.san}), 2..N = scegli altra, s = salta, q = salva ed esci]: `)
    ).trim();

    if (ans.toLowerCase() === 'q') break;
    if (ans.toLowerCase() === 's') continue;

    if (ans === '' || ans === '1') {
      const chosen = item.proposedMoves[0];
      if (chosen) {
        updatedMap[item.normalizedFen] = chosen.san;
        addedCount += 1;
        console.log(`  -> Confermata: ${chosen.san}`);
      }
    } else {
      const idx = Number(ans) - 1;
      if (!Number.isNaN(idx) && item.proposedMoves[idx]) {
        updatedMap[item.normalizedFen] = item.proposedMoves[idx].san;
        addedCount += 1;
        console.log(`  -> Confermata: ${item.proposedMoves[idx].san}`);
      } else {
        // Permette anche di digitare direttamente una mossa SAN presente tra tutte le mosse valutate
        const bySan = item.allEvaluatedMoves.find((m) => m.san === ans);
        if (bySan) {
          updatedMap[item.normalizedFen] = bySan.san;
          addedCount += 1;
          console.log(`  -> Confermata: ${bySan.san}`);
        } else {
          console.log(`  ⚠️ Scelta non riconosciuta, posizione saltata.`);
        }
      }
    }
  }

  rl.close();
  if (addedCount > 0) {
    updateSeedsFile(updatedMap);
    console.log(`\n💾 Salvate ${addedCount} mosse in scripts/repertoire-seeds.mjs!`);
  } else {
    console.log('\nNessuna modifica salvata.');
  }
}

main().catch((err) => {
  console.error('❌ Errore in review-moves-cli.mjs:', err);
  process.exit(1);
});
