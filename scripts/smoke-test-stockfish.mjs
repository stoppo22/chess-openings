import { StockfishRunner, STOCKFISH_PACKAGE_INFO } from './stockfish-runner.mjs';

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

async function main() {
  console.log('==========================================================');
  console.log('🔥 SMOKE TEST STOCKFISH IN NODE.JS');
  console.log(`📦 Pacchetto: ${STOCKFISH_PACKAGE_INFO}`);
  console.log('==========================================================');

  const runner = new StockfishRunner({ useCache: false });
  const initStart = performance.now();
  await runner.init();
  const initMs = Math.round(performance.now() - initStart);
  console.log(`✅ Motore UCI inizializzato in ${initMs} ms`);

  console.log(`\n🔍 Valutazione posizione iniziale a depth 14...`);
  const result = await runner.evaluatePosition(INITIAL_FEN, { depth: 14, multipv: 1, bypassCache: true });

  console.log('----------------------------------------------------------');
  console.log(`⏱️  Tempo calcolo (depth 14): ${result.elapsedMs} ms`);
  console.log(`♟️  Best Move:                ${result.bestMoveSan} (${result.bestMoveUci})`);
  console.log(`📊 Valutazione (Bianco):     ${result.scoreWhitePawns >= 0 ? '+' : ''}${result.scoreWhitePawns.toFixed(2)} pedoni`);
  console.log(`📈 Linea principale (PV):    ${result.lines[0]?.pvSan.join(' ') || '-'}`);
  console.log('==========================================================');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Errore durante lo smoke test di Stockfish:', err);
  process.exit(1);
});
