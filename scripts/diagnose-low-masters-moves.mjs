import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { Chess } from 'chess.js';
import { normalizeFen } from './repertoire-seeds.mjs';
import { StockfishRunner } from './stockfish-runner.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const CARO_KANN_FILE = path.join(ROOT_DIR, 'src', 'data', 'openings', 'caro-kann.json');

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
  const data = JSON.parse(fs.readFileSync(CARO_KANN_FILE, 'utf8'));
  const nodes = Object.values(data.positions || {});
  const engineLowMastersNodes = nodes.filter(
    (n) => n.isPlayerTurn && n.playerMove && n.playerMove.selectionRule === 'engine_best_low_masters'
  );

  const sfRunner = new StockfishRunner({ useCache: true });
  await sfRunner.init();

  const matchingCases = [];

  for (const node of engineLowMastersNodes) {
    const bandData = getBandCache(node.fullFen);
    if (!bandData || !Array.isArray(bandData.moves) || bandData.moves.length === 0) continue;

    const totalPosGames =
      Number(bandData.white || 0) + Number(bandData.draws || 0) + Number(bandData.black || 0);
    if (totalPosGames === 0) continue;

    const sortedBandMoves = [...bandData.moves].sort((a, b) => {
      const ga = Number(a.white || 0) + Number(a.draws || 0) + Number(a.black || 0);
      const gb = Number(b.white || 0) + Number(b.draws || 0) + Number(b.black || 0);
      return gb - ga;
    });

    const topBandRaw = sortedBandMoves[0];
    if (!topBandRaw || topBandRaw.san === node.playerMove.san) continue;

    const chess = new Chess(node.fullFen);
    const moveObj = chess.move(topBandRaw.san);
    if (!moveObj) continue;
    const uci = `${moveObj.from}${moveObj.to}${moveObj.promotion || ''}`;

    const multiPvEval = await sfRunner.evaluatePosition(node.fullFen, {
      depth: 18,
      multipv: 6,
    });
    const bestBlackEval = multiPvEval.scoreSideToMovePawns;

    const topBandEval = await getMoveEvalAtSameDepth(
      sfRunner,
      node.fullFen,
      moveObj.san,
      uci,
      multiPvEval,
      18
    );
    const topBandBlackEval = topBandEval.scoreSideToMovePawns;
    const topBandLoss = Number((bestBlackEval - topBandBlackEval).toFixed(2));

    if (topBandLoss <= 0.15) {
      const topGames =
        Number(topBandRaw.white || 0) + Number(topBandRaw.draws || 0) + Number(topBandRaw.black || 0);
      const topFreqPct = Number(((topGames / totalPosGames) * 100).toFixed(1));
      const myGames = node.playerMove.bandStats?.totalGames || 0;
      const myFreqPct =
        totalPosGames > 0 ? Number(((myGames / totalPosGames) * 100).toFixed(1)) : 0;

      matchingCases.push({
        pgnPath: node.pgnPath,
        moveNumber: node.moveNumber,
        myMoveSan: node.playerMove.san,
        myLoss: node.playerMove.engine.evalLossVsBest,
        myEvalForBlack: node.playerMove.engine.evalFromPlayerPerspective,
        myFreqPct,
        myGames,
        popularMoveSan: moveObj.san,
        popularLoss: topBandLoss,
        popularEvalForBlack: topBandBlackEval,
        popularFreqPct: topFreqPct,
        popularGames: topGames,
      });
    }
  }

  console.log('========================================================================');
  console.log(
    `🔎 DIAGNOSTICA MOSSE SCELTE COL MOTORE (< 50 GM): ${matchingCases.length} casi su ${engineLowMastersNodes.length}`
  );
  console.log(
    '   (La mossa più giocata nella fascia 0-1400 ha loss <= 0.15 a depth 18 ma NON è quella scelta)'
  );
  console.log('========================================================================');

  matchingCases.forEach((c, idx) => {
    console.log(
      `${String(idx + 1).padStart(2, ' ')}. PGN: ${c.pgnPath} | Mia mossa: ${c.myMoveSan} (loss: ${c.myLoss.toFixed(2)}, freq 0-1400: ${c.myFreqPct}%) | Più popolare 0-1400: ${c.popularMoveSan} (loss: ${c.popularLoss.toFixed(2)}, freq 0-1400: ${c.popularFreqPct}%, ${c.popularGames} partite)`
    );
  });

  console.log('========================================================================');
  console.log(`TOTALE CASI TROVATI: ${matchingCases.length} / ${engineLowMastersNodes.length}`);
  console.log('========================================================================');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
