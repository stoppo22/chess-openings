import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { Chess } from 'chess.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const CACHE_DIR = path.join(ROOT_DIR, '.cache', 'stockfish');

const require = createRequire(import.meta.url);

export const STOCKFISH_PACKAGE_INFO = 'stockfish@16.0.0 (stockfish-nnue-16-single.wasm)';

export function normalizeFenForKey(fen) {
  const parts = fen.trim().split(/\s+/);
  return `${parts[0]} ${parts[1]} ${parts[2]} ${parts[3]}`;
}

function getCacheFilePath(normalizedFen, depth, multipv) {
  const key = `${normalizedFen}|depth=${depth}|multipv=${multipv}`;
  const hash = crypto.createHash('sha256').update(key).digest('hex').slice(0, 24);
  return path.join(CACHE_DIR, `${hash}.json`);
}

export class StockfishRunner {
  constructor({ useCache = true } = {}) {
    this.useCache = useCache;
    this.engine = null;
    this.listeners = new Set();
    this.totalEvalCalls = 0;
    this.cacheHits = 0;
    this.totalComputeMs = 0;
    if (this.useCache) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
  }

  async init() {
    if (this.engine) return;
    const savedFetch = globalThis.fetch;
    const stockfishDir = path.join(ROOT_DIR, 'node_modules', 'stockfish', 'src');
    const wasmPath = path.join(stockfishDir, 'stockfish-nnue-16-single.wasm');
    const initFactory = require(path.join(stockfishDir, 'stockfish-nnue-16-single.js'));

    const sf = await initFactory()({
      locateFile: (file) => (file.endsWith('.wasm') ? wasmPath : file),
    });

    if (savedFetch) {
      globalThis.fetch = savedFetch;
    }

    sf.addMessageListener((line) => {
      for (const listener of this.listeners) {
        listener(line);
      }
    });

    this.engine = sf;
    await this.sendAndWait('uci', (line) => line === 'uciok');
    await this.sendAndWait('isready', (line) => line === 'readyok');
  }

  send(cmd) {
    if (!this.engine) throw new Error('StockfishRunner not initialized');
    if (this.engine.__IS_SINGLE_THREADED__ || this.engine.__IS_NON_NESTED__) {
      this.engine.onCustomMessage(cmd);
    } else {
      this.engine.postMessage(cmd, true);
    }
  }

  sendAndWait(cmd, predicate) {
    return new Promise((resolve) => {
      const handler = (line) => {
        if (predicate(line)) {
          this.listeners.delete(handler);
          resolve(line);
        }
      };
      this.listeners.add(handler);
      this.send(cmd);
    });
  }

  /**
   * Evaluates a FEN position at the given depth and multipv.
   * All scores returned in `lines` are normalized to WHITE's perspective in pawns (+ = White better, - = Black better),
   * AND also provided from the side-to-move's perspective (`scoreSideToMovePawns`).
   */
  async evaluatePosition(fen, { depth = 14, multipv = 1, bypassCache = false } = {}) {
    await this.init();
    const normalizedFen = normalizeFenForKey(fen);
    const cacheFile = getCacheFilePath(normalizedFen, depth, multipv);

    if (this.useCache && !bypassCache && fs.existsSync(cacheFile)) {
      try {
        const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
        if (cached && cached.normalizedFen === normalizedFen && cached.depth === depth && cached.multipv === multipv) {
          this.cacheHits += 1;
          return { ...cached, fromCache: true, elapsedMs: 0 };
        }
      } catch {
        // Ignore corrupted cache file
      }
    }

    const startTime = performance.now();
    const turn = normalizedFen.split(' ')[1]; // 'w' or 'b'

    // Check if position is already game over (checkmate/stalemate)
    const chessCheck = new Chess(fen);
    if (chessCheck.isGameOver()) {
      const isMate = chessCheck.isCheckmate();
      const scoreSidePawns = isMate ? -99.0 : 0.0;
      const scoreWhitePawns = turn === 'w' ? scoreSidePawns : -scoreSidePawns;
      const emptyResult = {
        normalizedFen,
        fen,
        turn,
        depth,
        multipv,
        bestMoveUci: null,
        bestMoveSan: null,
        scoreWhitePawns,
        scoreSideToMovePawns: scoreSidePawns,
        lines: [],
      };
      return { ...emptyResult, fromCache: false, elapsedMs: 0 };
    }

    this.send(`setoption name MultiPV value ${multipv}`);
    await this.sendAndWait('isready', (line) => line === 'readyok');
    this.send(`position fen ${fen}`);

    const multipvMap = new Map();

    await new Promise((resolve) => {
      const handler = (line) => {
        if (line.startsWith('info ') && line.includes(' score ') && line.includes(' pv ')) {
          const depthMatch = line.match(/\bdepth\s+(\d+)/);
          const selPvMatch = line.match(/\bmultipv\s+(\d+)/);
          const cpMatch = line.match(/\bscore\s+cp\s+(-?\d+)/);
          const mateMatch = line.match(/\bscore\s+mate\s+(-?\d+)/);
          const pvMatch = line.match(/\bpv\s+(.+)$/);

          if (depthMatch && pvMatch) {
            const infoDepth = Number(depthMatch[1]);
            const pvIndex = selPvMatch ? Number(selPvMatch[1]) : 1;
            let scoreSidePawns = 0;
            let isMate = false;
            let mateIn = null;

            if (cpMatch) {
              scoreSidePawns = Number(cpMatch[1]) / 100;
            } else if (mateMatch) {
              isMate = true;
              mateIn = Number(mateMatch[1]);
              scoreSidePawns = mateIn > 0 ? 99 - Math.min(Math.abs(mateIn), 20) * 0.1 : -99 + Math.min(Math.abs(mateIn), 20) * 0.1;
            }

            const scoreWhitePawns = Number((turn === 'w' ? scoreSidePawns : -scoreSidePawns).toFixed(2));
            scoreSidePawns = Number(scoreSidePawns.toFixed(2));

            const pvUci = pvMatch[1].trim().split(/\s+/);
            const prev = multipvMap.get(pvIndex);
            if (!prev || infoDepth >= prev.infoDepth) {
              multipvMap.set(pvIndex, {
                multipv: pvIndex,
                infoDepth,
                scoreSideToMovePawns: scoreSidePawns,
                scoreWhitePawns,
                isMate,
                mateIn,
                pvUci,
              });
            }
          }
        } else if (line.startsWith('bestmove ')) {
          this.listeners.delete(handler);
          resolve(line);
        }
      };
      this.listeners.add(handler);
      this.send(`go depth ${depth}`);
    });

    const elapsedMs = Math.round(performance.now() - startTime);
    this.totalEvalCalls += 1;
    this.totalComputeMs += elapsedMs;

    // Convert UCI PVs to SAN using chess.js
    const sortedLines = Array.from(multipvMap.values())
      .sort((a, b) => a.multipv - b.multipv)
      .map((entry) => {
        const tempChess = new Chess(fen);
        const pvSan = [];
        for (const uci of entry.pvUci.slice(0, 8)) {
          try {
            const from = uci.slice(0, 2);
            const to = uci.slice(2, 4);
            const promotion = uci.length > 4 ? uci[4] : undefined;
            const m = tempChess.move({ from, to, promotion });
            if (!m) break;
            pvSan.push(m.san);
          } catch {
            break;
          }
        }
        return {
          multipv: entry.multipv,
          depth: entry.infoDepth,
          moveUci: entry.pvUci[0] || null,
          moveSan: pvSan[0] || null,
          scoreSideToMovePawns: entry.scoreSideToMovePawns,
          scoreWhitePawns: entry.scoreWhitePawns,
          isMate: entry.isMate,
          mateIn: entry.mateIn,
          pvUci: entry.pvUci.slice(0, 8),
          pvSan,
        };
      });

    const topLine = sortedLines[0] || {
      moveUci: null,
      moveSan: null,
      scoreWhitePawns: 0,
      scoreSideToMovePawns: 0,
      pvSan: [],
    };

    const result = {
      normalizedFen,
      fen,
      turn,
      depth,
      multipv,
      bestMoveUci: topLine.moveUci,
      bestMoveSan: topLine.moveSan,
      scoreWhitePawns: topLine.scoreWhitePawns,
      scoreSideToMovePawns: topLine.scoreSideToMovePawns,
      lines: sortedLines,
      computedAt: new Date().toISOString(),
    };

    if (this.useCache && !bypassCache) {
      fs.writeFileSync(cacheFile, JSON.stringify(result, null, 2), 'utf8');
    }

    return { ...result, fromCache: false, elapsedMs };
  }

  getStats() {
    const avgMs = this.totalEvalCalls > 0 ? Math.round(this.totalComputeMs / this.totalEvalCalls) : 0;
    return {
      totalEvalCalls: this.totalEvalCalls,
      cacheHits: this.cacheHits,
      totalComputeMs: this.totalComputeMs,
      avgMsPerPosition: avgMs,
    };
  }
}
