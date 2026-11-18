import wt, { parentPort } from 'node:worker_threads';
import { StockfishRunner } from './stockfish-runner.mjs';

// stockfish.js, se non è sul main thread, si comporta da worker e non esporta la factory
wt.isMainThread = true;

const runner = new StockfishRunner({ useCache: true });
await runner.init();
parentPort.postMessage({ type: 'ready' });
parentPort.on('message', async ({ id, fen, opts }) => {
  try {
    parentPort.postMessage({ id, result: await runner.evaluatePosition(fen, opts) });
  } catch (e) {
    parentPort.postMessage({ id, error: String(e?.stack || e) });
  }
});
