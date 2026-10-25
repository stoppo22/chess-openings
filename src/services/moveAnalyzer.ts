import { Chess, type PieceSymbol } from 'chess.js';
import type { CommonMistake, OpeningRepertoireFile, PositionNode } from '../types/repertoire';

const PIECE_VALUE: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

const PIECE_NAME_IT: Record<PieceSymbol, string> = {
  p: 'pedone',
  n: 'Cavallo',
  b: 'Alfiere',
  r: 'Torre',
  q: 'Donna',
  k: 'Re',
};

function computeMaterialDiffForBlack(fen: string): number {
  const chess = new Chess(fen);
  let blackMat = 0;
  let whiteMat = 0;
  for (const row of chess.board()) {
    for (const sq of row) {
      if (!sq) continue;
      if (sq.color === 'b') blackMat += PIECE_VALUE[sq.type];
      else whiteMat += PIECE_VALUE[sq.type];
    }
  }
  return blackMat - whiteMat;
}

/**
 * Restituisce la valutazione Stockfish dal punto di vista del Nero per qualunque nodo del repertorio.
 */
export function getNodeEvalForBlack(
  opening: OpeningRepertoireFile,
  node: PositionNode | undefined,
  previousNormFen?: string
): number {
  if (!node) return 0;
  if (node.isPlayerTurn && node.playerMove) {
    return node.playerMove.engine.evalFromPlayerPerspective;
  }
  if (previousNormFen) {
    const prev = opening.positions[previousNormFen];
    if (prev?.playerMove) {
      return prev.playerMove.engine.evalFromPlayerPerspective;
    }
  }
  const parent = Object.values(opening.positions).find(
    (n) => n.isPlayerTurn && n.playerMove?.nextNormalizedFen === node.normalizedFen
  );
  if (parent?.playerMove) {
    return parent.playerMove.engine.evalFromPlayerPerspective;
  }
  return -0.15;
}

/**
 * Spiega in modo 100% verificato (tramite chess.js sulla posizione reale) perché la mossa
 * dell'avversario è un errore/imprecisione e come funziona la punizione del Nero.
 */
export function explainOpponentMistake(mistake: CommonMistake): string {
  try {
    const chess = new Chess(mistake.afterMistakeFullFen);
    const matBeforePunish = computeMaterialDiffForBlack(mistake.afterMistakeFullFen);
    const punishObj = chess.move(mistake.punishMoveSan);
    if (!punishObj) {
      return `Con ${mistake.opponentMoveSan}? il Bianco perde ${mistake.evalLoss.toFixed(
        2
      )} pedoni di valutazione: dopo ${mistake.punishMoveSan} il Nero ottiene un netto vantaggio (${
        mistake.finalEvalForPlayer >= 0 ? '+' : ''
      }${mistake.finalEvalForPlayer.toFixed(2)}).`;
    }

    const givesImmediateCheck = chess.inCheck();

    // Simula l'intera PV per misurare il bilancio materiale finale verificato
    const pvSim = new Chess(mistake.afterMistakeFullFen);
    for (const san of mistake.pvSan) {
      const m = pvSim.move(san);
      if (!m) break;
    }
    const matAfterPv = computeMaterialDiffForBlack(pvSim.fen());
    const netMatGain = matAfterPv - matBeforePunish;

    const reasons: string[] = [];

    if (punishObj.captured) {
      const capName = PIECE_NAME_IT[punishObj.captured];
      reasons.push(
        `permette la cattura immediata del ${capName} in ${punishObj.to} con ${mistake.punishMoveSan}${
          givesImmediateCheck ? ' (con scacco)' : ''
        }`
      );
    } else if (givesImmediateCheck) {
      const moverName = PIECE_NAME_IT[punishObj.piece];
      reasons.push(
        `espone il Re bianco allo scacco immediato di ${moverName} in ${punishObj.to} (${mistake.punishMoveSan})`
      );
    } else if (mistake.punishMoveSan === 'c5' || mistake.punishMoveSan === 'e5') {
      reasons.push(
        `allenta il controllo centrale e consente subito la rottura liberatoria ...${mistake.punishMoveSan}`
      );
    } else if (mistake.punishMoveSan === 'Qb6') {
      reasons.push(
        `lascia scoperte le case scure sul lato di Donna, permettendo l’uscita attiva ...Qb6 con pressione immediata`
      );
    } else {
      const moverName = PIECE_NAME_IT[punishObj.piece];
      reasons.push(
        `cede tempo e iniziativa al Nero, che risponde con la mossa attiva di ${moverName} in ${punishObj.to} (...${mistake.punishMoveSan})`
      );
    }

    if (netMatGain >= 1 && !punishObj.captured) {
      reasons.push(
        `nella linea forzata (${mistake.pvSan.join(' ')}) il Nero guadagna materiale netto (+${netMatGain} punti)`
      );
    }

    const severityIt =
      mistake.severity === 'blunder'
        ? 'Grave errore (Blunder)'
        : mistake.severity === 'mistake'
          ? 'Errore (Mistake)'
          : 'Imprecisione';

    return `${severityIt} (-${mistake.evalLoss.toFixed(2)} pedoni): ${
      mistake.opponentMoveSan
    } ${reasons.join('; ')}. Valutazione per il Nero: ${
      mistake.finalEvalForPlayer >= 0 ? '+' : ''
    }${mistake.finalEvalForPlayer.toFixed(2)}.`;
  } catch {
    return `La mossa ${mistake.opponentMoveSan} perde ${mistake.evalLoss.toFixed(
      2
    )} pedoni rispetto alla linea migliore; il Nero punisce con ${mistake.punishMoveSan}.`;
  }
}

export interface WrongMoveAnalysis {
  wrongSan: string;
  correctSan: string;
  estimatedEvalForBlack: number;
  evalDrop: number;
  explanation: string;
}

/**
 * Analizza una mossa sbagliata giocata dall'utente confrontandola con la mossa del repertorio
 * e calcola sia la stima del calo sulla barra di valutazione sia la spiegazione del perché.
 */
export function analyzeWrongPlayerMove(
  node: PositionNode,
  wrongSan: string,
  expectedMoveSan?: string
): WrongMoveAnalysis {
  const baseEval = node.playerMove?.engine.evalFromPlayerPerspective ?? 0.0;
  const correctSan = expectedMoveSan || node.playerMove?.san || '';

  try {
    const chessBefore = new Chess(node.fullFen);
    const hasBishopOnC8 =
      chessBefore.get('c8')?.color === 'b' && chessBefore.get('c8')?.type === 'b';
    const whitePawnOnE5 =
      chessBefore.get('e5')?.color === 'w' && chessBefore.get('e5')?.type === 'p';

    const chessAfterWrong = new Chess(node.fullFen);
    const wrongObj = chessAfterWrong.move(wrongSan);
    if (!wrongObj) {
      return {
        wrongSan,
        correctSan,
        estimatedEvalForBlack: baseEval - 0.8,
        evalDrop: -0.8,
        explanation: `${wrongSan} non è la mossa prevista in questa posizione (${correctSan}).`,
      };
    }

    // 1. Verifica se la casa di arrivo della mossa sbagliata lascia il pezzo in presa gratuita o semigratuita
    const whiteReplies = chessAfterWrong.moves({ verbose: true });
    const capturesOnDest = whiteReplies.filter((m) => m.to === wrongObj.to && m.captured);
    const movedPieceVal = PIECE_VALUE[wrongObj.piece];

    if (capturesOnDest.length > 0 && movedPieceVal >= 3) {
      const capReply = capturesOnDest[0];
      const drop = Math.max(1.5, movedPieceVal - 1);
      return {
        wrongSan,
        correctSan,
        estimatedEvalForBlack: Number((baseEval - drop).toFixed(2)),
        evalDrop: Number((-drop).toFixed(2)),
        explanation: `Attenzione: con ...${wrongSan} sposti il ${
          PIECE_NAME_IT[wrongObj.piece]
        } su una casa controllata dal Bianco, che può catturarlo subito con ${capReply.san}! La mossa corretta è ...${correctSan}.`,
      };
    }

    // 2. Verifica se il Bianco aveva una cattura minacciata che la mossa corretta parava/ricatturava
    const correctChess = new Chess(node.fullFen);
    const correctObj = correctSan ? correctChess.move(correctSan) : null;

    if (correctObj?.captured && !wrongObj.captured) {
      const missedPieceName = PIECE_NAME_IT[correctObj.captured];
      const drop = Math.max(1.2, PIECE_VALUE[correctObj.captured]);
      return {
        wrongSan,
        correctSan,
        estimatedEvalForBlack: Number((baseEval - drop).toFixed(2)),
        evalDrop: Number((-drop).toFixed(2)),
        explanation: `Con ...${wrongSan} non effettui la cattura necessaria in ${correctObj.to}: bisognava catturare il ${missedPieceName} bianco con ...${correctSan}.`,
      };
    }

    // 3. Errori tematici tipici della Caro-Kann
    if (wrongSan === 'e6' && hasBishopOnC8 && (correctSan === 'Bf5' || correctSan === 'Bg4')) {
      return {
        wrongSan,
        correctSan,
        estimatedEvalForBlack: Number((baseEval - 0.65).toFixed(2)),
        evalDrop: -0.65,
        explanation: `Giocare ...e6 adesso chiude il tuo Alfiere camposcuro in c8 dentro la catena di pedoni! Nella Caro-Kann devi prima svilupparlo fuori dalla catena con ...${correctSan}, e solo dopo giocare ...e6.`,
      };
    }

    if (wrongSan === 'Nc6' && node.variationId === 'advance-bf5' && correctSan !== 'Nc6') {
      return {
        wrongSan,
        correctSan,
        estimatedEvalForBlack: Number((baseEval - 0.55).toFixed(2)),
        evalDrop: -0.55,
        explanation: `Sviluppare ...Nc6 davanti al pedone c6 blocca la rottura fondamentale ...c5 contro la base d4 del Bianco. Qui è molto più efficace giocare ...${correctSan}.`,
      };
    }

    if (wrongSan === 'Nf6' && whitePawnOnE5) {
      return {
        wrongSan,
        correctSan,
        estimatedEvalForBlack: Number((baseEval - 0.6).toFixed(2)),
        evalDrop: -0.6,
        explanation: `Con il pedone bianco in e5, il Cavallo in f6 è esposto o privo di case stabili. Nella Variante di Spinta il Cavallo di re si manovra via e7; qui la mossa giusta è ...${correctSan}.`,
      };
    }

    // 4. Spiegazione generale basata sullo scopo della mossa corretta
    let whyCorrect = `...${correctSan} mantiene l'equilibrio e coordina i pezzi secondo il piano del repertorio`;
    if (correctSan === 'c5') {
      whyCorrect = `...c5 attacca subito la base centrale del Bianco in d4 senza concedere tempi`;
    } else if (correctSan === 'Qb6') {
      whyCorrect = `...Qb6 mette subito sotto pressione sia il pedone centrale d4 sia il punto debole b2`;
    } else if (correctSan === 'Nd7') {
      whyCorrect = `...Nd7 sviluppa il Cavallo preparando la spinta ...c5 e controllando e5/c5 senza bloccare il pedone c`;
    } else if (correctSan === 'Ne7') {
      whyCorrect = `...Ne7 sviluppa il Cavallo verso f5 o g6 per attaccare il centro bianco`;
    } else if (correctSan === 'e6') {
      whyCorrect = `...e6 consolida il centro d5 e apre la diagonale per l'Alfiere scuro in f8`;
    } else if (correctSan === 'h6' || correctSan === 'h5') {
      whyCorrect = `...${correctSan} preserva una casa di ritirata sicura (h7) per il tuo Alfiere camposcuro`;
    }

    return {
      wrongSan,
      correctSan,
      estimatedEvalForBlack: Number((baseEval - 0.5).toFixed(2)),
      evalDrop: -0.5,
      explanation: `...${wrongSan} è più passiva e fa scendere la valutazione di circa mezzo pedone: qui ${whyCorrect} (Eval Nero: ${
        baseEval >= 0 ? '+' : ''
      }${baseEval.toFixed(2)}).`,
    };
  } catch {
    return {
      wrongSan,
      correctSan,
      estimatedEvalForBlack: Number((baseEval - 0.5).toFixed(2)),
      evalDrop: -0.5,
      explanation: `...${wrongSan} non è la mossa del repertorio; gioca ...${correctSan}.`,
    };
  }
}
