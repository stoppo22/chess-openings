import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess, type Square } from 'chess.js';
import type { CommonMistake, OpeningRepertoireFile, OpponentMoveBranch } from '../types/repertoire';
import { getLastMoveInfo, normalizeFen } from '../services/fen';
import { formatMoveLabel } from '../services/fen';
import { buildMiddlegameGuide } from '../services/middlegameIdeas';
import { ModeHeader } from './ModeHeader';
import { EvalBar } from './EvalBar';
import {
  analyzeWrongPlayerMove,
  explainOpponentMistake,
  getNodeEvalForPlayer,
  nodeMoveLabel,
  type WrongMoveAnalysis,
} from '../services/moveAnalyzer';

interface DrillModeProps {
  opening: OpeningRepertoireFile;
  initialVariationId?: string;
  onBack: () => void;
}

interface ActiveTrapState {
  parentNormFen: string;
  mistake: CommonMistake;
  solved: boolean;
}

export const DrillMode: React.FC<DrillModeProps> = ({ opening, initialVariationId, onBack }) => {
  const [selectedVariationId, setSelectedVariationId] = useState<string | undefined>(
    initialVariationId
  );
  const [includeTraps, setIncludeTraps] = useState<boolean>(true);
  const [historyFens, setHistoryFens] = useState<string[]>([opening.rootNormalizedFen]);
  const [activeTrap, setActiveTrap] = useState<ActiveTrapState | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [usedHintInMove, setUsedHintInMove] = useState<boolean>(false);
  const [totalMistakesMade, setTotalMistakesMade] = useState<number>(0);
  const [gamesCompleted, setGamesCompleted] = useState<number>(0);
  const [feedback, setFeedback] = useState<{
    type: 'idle' | 'wrong' | 'correct' | 'trap-triggered';
    message?: string;
  }>({ type: 'idle' });
  const [wrongMoveAnalysis, setWrongMoveAnalysis] = useState<WrongMoveAnalysis | null>(null);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string>('all');

  const visitedBranchesRef = useRef<Set<string>>(new Set());
  const botTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentNormFen = historyFens[historyFens.length - 1] || opening.rootNormalizedFen;
  const currentNode = opening.positions[currentNormFen];

  // Prefisso mosse forzate se l'utente ha scelto di allenare una variante specifica
  const targetVariation = useMemo(
    () => opening.variations.find((v) => v.id === selectedVariationId),
    [opening.variations, selectedVariationId]
  );

  const startNewGame = (nextVarId: string | undefined = selectedVariationId) => {
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    setActiveTrap(null);
    setSelectedSquare(null);
    setUsedHintInMove(false);
    setTotalMistakesMade(0);
    setSelectedIdeaId('all');
    setWrongMoveAnalysis(null);
    setFeedback({ type: 'idle' });

    // Tutte le partite iniziano da 1.e4 (rootNormalizedFen)
    setHistoryFens([opening.rootNormalizedFen]);
    if (nextVarId !== selectedVariationId) {
      setSelectedVariationId(nextVarId);
    }
  };

  useEffect(() => {
    return () => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
    };
  }, []);

  // Scelta automatica della mossa del Bianco (Bot 0-1400) quando tocca all'avversario
  useEffect(() => {
    if (!currentNode || activeTrap) return;
    if (currentNode.isPlayerTurn) return;

    const availableBranches = (currentNode.opponentMoves || []).filter((m) =>
      Boolean(opening.positions[m.nextNormalizedFen])
    );

    const seriousMistakes = (currentNode.commonMistakes || []).filter((m) => m.evalLoss >= 1.0);

    // Se siamo ancora nei primi turni del tronco della variante selezionata, segui il tronco della variante
    if (targetVariation && currentNode.ply < targetVariation.rootMovesSan.length) {
      const expectedWhiteSan = targetVariation.rootMovesSan[currentNode.ply];
      const forcedBranch = availableBranches.find((b) => b.san === expectedWhiteSan);
      if (forcedBranch) {
        botTimerRef.current = setTimeout(() => {
          setHistoryFens((prev) => [...prev, forcedBranch.nextNormalizedFen]);
          setFeedback({ type: 'idle' });
        }, 380);
        return;
      }
      // Se il tronco usa mosse prima del root dell'albero (es. 2.d4), calcola il prossimo FEN
      try {
        const chess = new Chess(currentNode.fullFen);
        const moved = chess.move(expectedWhiteSan);
        if (moved) {
          const nextNorm = normalizeFen(chess.fen());
          if (opening.positions[nextNorm]) {
            botTimerRef.current = setTimeout(() => {
              setHistoryFens((prev) => [...prev, nextNorm]);
              setFeedback({ type: 'idle' });
            }, 380);
            return;
          }
        }
      } catch {
        // fallback ai rami normali
      }
    }

    // Se non ci sono più rami nel repertorio, la linea è completata!
    if (availableBranches.length === 0) {
      return;
    }

    // Con probabilità 28% (se attivo includeTraps e siamo almeno alla mossa 3), il bot 0-1400 gioca un errore comune grave!
    if (includeTraps && seriousMistakes.length > 0 && currentNode.moveNumber >= 3) {
      const roll = Math.random();
      if (roll < 0.28) {
        const chosenMistake =
          seriousMistakes[Math.floor(Math.random() * seriousMistakes.length)];
        botTimerRef.current = setTimeout(() => {
          setActiveTrap({
            parentNormFen: currentNode.normalizedFen,
            mistake: chosenMistake,
            solved: false,
          });
          setFeedback({
            type: 'trap-triggered',
            message: `L'avversario (0-1400) ha commesso un errore: ${formatMoveLabel(currentNode.moveNumber, currentNode.turn, chosenMistake.opponentMoveSan)}? (${chosenMistake.evalLoss.toFixed(2)} pedoni persi). Trova la punizione!`,
          });
        }, 420);
        return;
      }
    }

    // Altrimenti scegli una risposta del Bianco pesata per frequenza reale 0-1400
    // (privilegiando i rami non ancora visti nella sessione corrente)
    const unvisited = availableBranches.filter(
      (b) => !visitedBranchesRef.current.has(b.nextNormalizedFen)
    );
    const pool: OpponentMoveBranch[] = unvisited.length > 0 ? unvisited : availableBranches;

    const totalWeight = pool.reduce((acc, b) => acc + Math.max(1, b.frequencyPct), 0);
    let r = Math.random() * totalWeight;
    let chosenBranch = pool[0];
    for (const b of pool) {
      r -= Math.max(1, b.frequencyPct);
      if (r <= 0) {
        chosenBranch = b;
        break;
      }
    }

    botTimerRef.current = setTimeout(() => {
      visitedBranchesRef.current.add(chosenBranch.nextNormalizedFen);
      setHistoryFens((prev) => [...prev, chosenBranch.nextNormalizedFen]);
      setFeedback({ type: 'idle' });
    }, 420);
  }, [currentNode, activeTrap, includeTraps, opening.positions, targetVariation]);

  const isLineFinished = Boolean(
    currentNode &&
      !activeTrap &&
      !currentNode.isPlayerTurn &&
      (!currentNode.opponentMoves ||
        currentNode.opponentMoves.filter((m) => Boolean(opening.positions[m.nextNormalizedFen]))
          .length === 0)
  );

  // Incrementa il contatore quando si raggiunge la fine della linea o si risolve una trappola
  useEffect(() => {
    if (isLineFinished) {
      setGamesCompleted((prev) => prev + 1);
    }
  }, [isLineFinished]);

  const middlegameGuide = useMemo(() => {
    if (!currentNode || !isLineFinished) return null;
    const prevNorm = historyFens.length > 1 ? historyFens[historyFens.length - 2] : undefined;
    return buildMiddlegameGuide(opening, currentNode, prevNorm);
  }, [opening, currentNode, isLineFinished, historyFens]);

  if (!currentNode) return null;

  const displayFen = useMemo(() => {
    if (activeTrap) {
      if (activeTrap.solved) {
        const chess = new Chess(activeTrap.mistake.afterMistakeFullFen);
        chess.move(activeTrap.mistake.punishMoveSan);
        return chess.fen();
      }
      return activeTrap.mistake.afterMistakeFullFen;
    }
    return currentNode.fullFen;
  }, [activeTrap, currentNode.fullFen]);

  const lastMove = useMemo(() => {
    if (activeTrap) {
      return {
        from: activeTrap.mistake.from as Square,
        to: activeTrap.mistake.to as Square,
        san: activeTrap.mistake.opponentMoveSan,
        moveNumber: currentNode.moveNumber,
        color: (opening.playerColor === 'white' ? 'b' : 'w') as 'w' | 'b',
      };
    }
    return getLastMoveInfo(currentNode.moveSequenceSan);
  }, [activeTrap, currentNode]);

  const expectedMove = useMemo(() => {
    if (activeTrap) {
      return {
        san: activeTrap.mistake.punishMoveSan,
        from: activeTrap.mistake.punishFrom as Square,
        to: activeTrap.mistake.punishTo as Square,
      };
    }
    if (currentNode.isPlayerTurn && currentNode.playerMove) {
      return {
        san: currentNode.playerMove.san,
        from: currentNode.playerMove.from as Square,
        to: currentNode.playerMove.to as Square,
      };
    }
    return null;
  }, [activeTrap, currentNode]);

  const canPlayerMoveNow = Boolean(
    (activeTrap && !activeTrap.solved) || (currentNode.isPlayerTurn && currentNode.playerMove)
  );

  // Calcola l'evaluazione corrente di Stockfish dal punto di vista del Nero
  const prevNormFen = historyFens.length > 1 ? historyFens[historyFens.length - 2] : undefined;
  const baseEvalForPlayer = getNodeEvalForPlayer(opening, currentNode, prevNormFen);

  const activeEvalForPlayer = useMemo(() => {
    if (activeTrap) {
      return activeTrap.mistake.finalEvalForPlayer;
    }
    if (wrongMoveAnalysis) {
      return wrongMoveAnalysis.evalForPlayer ?? baseEvalForPlayer;
    }
    return baseEvalForPlayer;
  }, [activeTrap, wrongMoveAnalysis, baseEvalForPlayer]);

  const activeEvalDelta = useMemo(() => {
    if (activeTrap) {
      return activeTrap.mistake.evalLoss;
    }
    if (wrongMoveAnalysis) {
      return wrongMoveAnalysis.evalDrop;
    }
    return null;
  }, [activeTrap, wrongMoveAnalysis]);

  const attemptPlayerMove = (from: string, to: string): boolean => {
    if (!canPlayerMoveNow || !expectedMove) return false;

    const baseFen = activeTrap ? activeTrap.mistake.afterMistakeFullFen : currentNode.fullFen;
    const chess = new Chess(baseFen);
    let moveObj = null;
    try {
      moveObj = chess.move({ from, to, promotion: 'q' });
    } catch {
      return false;
    }
    if (!moveObj) return false;

    if (moveObj.san === expectedMove.san) {
      setSelectedSquare(null);
      setUsedHintInMove(false);
      setWrongMoveAnalysis(null);

      if (activeTrap) {
        setActiveTrap({ ...activeTrap, solved: true });
        setGamesCompleted((prev) => prev + 1);
        const whyExplanation = explainOpponentMistake(activeTrap.mistake, opening.playerColor);
        setFeedback({
          type: 'correct',
          message: `Ottimo! Hai punito ${activeTrap.mistake.opponentMoveSan}? con ${expectedMove.san} (Eval per te: ${
            activeTrap.mistake.finalEvalForPlayer >= 0 ? '+' : ''
          }${activeTrap.mistake.finalEvalForPlayer.toFixed(2)}). ${whyExplanation}`,
        });
        return true;
      }

      const nextNorm = currentNode.playerMove!.nextNormalizedFen;
      setFeedback({
        type: 'correct',
        message: `Esatto: ${nodeMoveLabel(currentNode, expectedMove.san)}`,
      });
      if (opening.positions[nextNorm]) {
        setHistoryFens((prev) => [...prev, nextNorm]);
      }
      return true;
    } else {
      setSelectedSquare(null);
      setTotalMistakesMade((prev) => prev + 1);
      const analysis = analyzeWrongPlayerMove(
        activeTrap
          ? {
              ...currentNode,
              playerMove: undefined,
              fullFen: activeTrap.mistake.afterMistakeFullFen,
            }
          : currentNode,
        moveObj.san,
        expectedMove.san
      );
      setWrongMoveAnalysis(analysis);
      setFeedback({
        type: 'wrong',
        message: `No, non è questa (${moveObj.san}). ${analysis.explanation}`,
      });
      return false;
    }
  };

  const handleSquareClick = (square: Square) => {
    if (!canPlayerMoveNow) return;
    if (selectedSquare === square) {
      setSelectedSquare(null);
      return;
    }
    if (selectedSquare) {
      const moved = attemptPlayerMove(selectedSquare, square);
      if (moved) return;
    }
    try {
      const chess = new Chess(displayFen);
      const piece = chess.get(square);
      if (piece && piece.color === 'b') {
        setSelectedSquare(square);
      } else {
        setSelectedSquare(null);
      }
    } catch {
      setSelectedSquare(null);
    }
  };

  const customSquareStyles: Record<string, React.CSSProperties> = {};
  if (lastMove) {
    customSquareStyles[lastMove.from] = {
      backgroundColor: 'rgba(214, 178, 74, 0.45)',
    };
    customSquareStyles[lastMove.to] = {
      backgroundColor: 'rgba(214, 178, 74, 0.45)',
    };
  }
  if (selectedSquare && canPlayerMoveNow) {
    customSquareStyles[selectedSquare] = {
      backgroundColor: 'rgba(214, 178, 74, 0.7)',
    };
    try {
      const chess = new Chess(displayFen);
      const legalMoves = chess.moves({ square: selectedSquare as Square, verbose: true });
      for (const move of legalMoves) {
        const isCapture = Boolean(move.captured);
        customSquareStyles[move.to] = {
          background: isCapture
            ? 'radial-gradient(circle, transparent 58%, rgba(0, 0, 0, 0.26) 60%, rgba(0, 0, 0, 0.26) 74%, transparent 76%)'
            : 'radial-gradient(circle, rgba(0, 0, 0, 0.22) 19%, transparent 21%)',
        };
      }
    } catch {
      // ignore
    }
  }
  if (usedHintInMove && expectedMove && canPlayerMoveNow) {
    customSquareStyles[expectedMove.from] = {
      backgroundColor: 'rgba(54, 146, 231, 0.45)',
      boxShadow: 'inset 0 0 0 3px rgb(var(--accent))',
    };
  }

  const customArrows = useMemo(() => {
    if (activeTrap && activeTrap.solved) {
      return [
        [activeTrap.mistake.punishFrom, activeTrap.mistake.punishTo, 'rgba(46, 94, 78, 0.9)'],
      ] as Array<[any, any, string?]>;
    }
    if (isLineFinished && middlegameGuide) {
      if (selectedIdeaId === 'all') {
        const merged: Array<[any, any, string?]> = [];
        const seen = new Set<string>();
        for (const idea of middlegameGuide.ideas) {
          if (idea.id === 'engine-plan') continue;
          for (const arr of idea.arrows) {
            const key = `${arr[0]}-${arr[1]}`;
            if (!seen.has(key)) {
              seen.add(key);
              merged.push(arr);
            }
          }
        }
        return merged;
      }
      const found = middlegameGuide.ideas.find((i) => i.id === selectedIdeaId);
      if (found) return found.arrows as Array<[any, any, string?]>;
    }
    return [];
  }, [activeTrap, isLineFinished, middlegameGuide, selectedIdeaId]);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-5 space-y-3 sm:space-y-5">
      {/* Top Bar */}
      <ModeHeader
        onBack={onBack}
        title={`Partita di allenamento · fascia ${opening.buildConfig.ratingBandLabel}`}
        line={
          activeTrap
            ? `${currentNode.pgnPath} ${formatMoveLabel(currentNode.moveNumber, currentNode.turn, activeTrap.mistake.opponentMoveSan)}?`
            : currentNode.pgnPath
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-1">
          <label className="inline-flex items-center gap-2 text-sm text-muted cursor-pointer min-h-[32px]">
            <input
              type="checkbox"
              checked={includeTraps}
              onChange={(e) => setIncludeTraps(e.target.checked)}
              className="accent-[rgb(var(--accent))] w-4 h-4"
            />
            Includi errori da punire
          </label>
          <span className="text-[13px] text-muted">Linee completate: {gamesCompleted}</span>
          <button onClick={() => startNewGame(selectedVariationId)} className="btn-secondary w-full sm:w-auto">
            Nuova partita
          </button>
        </div>
      </ModeHeader>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* EvalBar + Chessboard */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full max-w-[560px] lg:max-w-[620px] flex flex-col lg:flex-row items-stretch gap-3">
            <EvalBar
              evalForPlayer={activeEvalForPlayer}
              deltaForPlayer={activeEvalDelta}
              playerColor={opening.playerColor}
            />
            <div className="order-1 lg:order-2 flex-1 aspect-square rounded-[10px] overflow-hidden border border-border bg-surface">
              <Chessboard
                id="drill-board"
                position={displayFen}
                boardOrientation={opening.playerColor}
                arePiecesDraggable={canPlayerMoveNow}
                onPieceDragBegin={(_piece, sourceSquare) => {
                  if (canPlayerMoveNow) {
                    setSelectedSquare(sourceSquare);
                  }
                }}
                onPieceDrop={(s, t) => attemptPlayerMove(s, t)}
                onSquareClick={handleSquareClick}
                customSquareStyles={customSquareStyles}
                customArrows={customArrows}
                customNotationStyle={{ fontSize: '11px', fontWeight: 500, color: '#4A3F33' }}
                customDarkSquareStyle={{ backgroundColor: '#b0957a' }}
                customLightSquareStyle={{ backgroundColor: '#eee6d3' }}
              />
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-5 space-y-5">
          {/* Variation Filter */}
          <div className="space-y-2">
            <div className="text-[13px] text-muted">Variante da allenare</div>
            <div className="scroll-row -mx-4 px-4 sm:mx-0 sm:px-0">
              {[{ id: undefined as string | undefined, name: 'Tutte' }, ...opening.variations].map((v) => (
                <button
                  key={v.id ?? 'all'}
                  onClick={() => startNewGame(v.id)}
                  className={`shrink-0 min-h-[44px] px-4 rounded-[10px] text-sm font-medium border transition ${
                    selectedVariationId === v.id
                      ? 'bg-accent text-accent-ink border-accent'
                      : 'bg-surface text-text border-border'
                  }`}
                >
                  {v.name.split('(')[0].trim()}
                </button>
              ))}
            </div>
          </div>

          {/* Active Game Status Panel */}
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 bg-bg border-b border-border flex items-center justify-between">
              <span className="text-sm font-semibold  text-text">
                {isLineFinished || (activeTrap && activeTrap.solved)
                  ? 'Linea completata'
                  : canPlayerMoveNow
                    ? `Mossa ${currentNode.moveNumber} • Tocca a te`
                    : 'L\'avversario sta muovendo...'}
              </span>
              {totalMistakesMade > 0 && (
                <span className="text-[13px] text-danger font-semibold tabular-nums">
                  Errori in questa partita: {totalMistakesMade}
                </span>
              )}
            </div>

            <div className="p-5 space-y-4">
              {lastMove && !isLineFinished && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[10px] bg-bg border border-border text-[13px] text-text">
                  <span>
                    Ultima mossa dell'avversario:{' '}
                    <strong className="text-text">
                      {formatMoveLabel(lastMove.moveNumber, lastMove.color, lastMove.san)}
                    </strong>
                  </span>
                </div>
              )}

              {feedback.type !== 'idle' && feedback.message && (
                <div
                  className={`rounded-[10px] px-4 py-3 text-sm font-semibold border ${
                    feedback.type === 'wrong'
                      ? 'bg-danger/20 border-danger text-danger'
                      : feedback.type === 'trap-triggered'
                        ? 'bg-warn/15 border-warn text-warn'
                        : 'bg-accent/20 border-accent text-text'
                  }`}
                >
                  {feedback.message}
                </div>
              )}

              {canPlayerMoveNow && expectedMove && (
                <div className="space-y-3">
                  <p className="text-base text-text">
                    {activeTrap
                      ? 'Trova la mossa che punisce l’errore dell’avversario sulla scacchiera.'
                      : 'Gioca la mossa del tuo repertorio sulla scacchiera.'}
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => {
                        setUsedHintInMove(true);
                        setSelectedSquare(expectedMove.from);
                      }}
                      disabled={usedHintInMove}
                      className="btn-secondary"
                    >
                      {usedHintInMove
                        ? `Muovi il pezzo da ${expectedMove.from.toUpperCase()}`
                        : 'Suggerimento'}
                    </button>
                    <span className="text-[13px] text-muted">conta come errore nel ripasso</span>
                  </div>
                </div>
              )}

              {/* End of Trap or End of Line */}
              {activeTrap && activeTrap.solved && (
                <div className="space-y-4 pt-2 border-t border-border">
                  <div className="bg-bg border border-border rounded-[10px] p-4 text-sm space-y-1">
                    <div className="font-semibold text-text">
                      Sequenza consigliata da Stockfish
                    </div>
                    <div className="text-accent">
                      {activeTrap.mistake.pvSan.join(' ')}
                    </div>
                  </div>
                  <button
                    onClick={() => startNewGame(selectedVariationId)}
                    className="btn-primary w-full"
                  >
                    Un&rsquo;altra partita
                  </button>
                </div>
              )}

              {isLineFinished && middlegameGuide && (
                <div className="space-y-4">
                  <div className="bg-bg border border-accent/50 rounded-[10px] p-4 space-y-2">
                    <div className="text-sm font-semibold text-accent">
                      Hai completato tutta la linea d&rsquo;apertura fino a fine repertorio!
                    </div>
                    <p className="text-sm text-text">
                      Ecco i piani di mediogioco e le frecce d&rsquo;attacco da questa posizione:
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {middlegameGuide.ideas.map((idea) => {
                      const isSelected = selectedIdeaId === idea.id;
                      return (
                        <button
                          key={idea.id}
                          type="button"
                          onClick={() => setSelectedIdeaId(idea.id)}
                          className={`w-full text-left rounded-[10px] p-3.5 border transition space-y-1 ${
                            isSelected
                              ? 'bg-bg border-accent'
                              : 'bg-bg border-border hover:border-border'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-semibold  text-accent">
                              {idea.category}
                            </span>
                            <span className="text-[13px] text-text">
                              {idea.movesLabel}
                            </span>
                          </div>
                          <div className="text-sm font-semibold text-text">{idea.title}</div>
                          <p className="text-[13px] text-text">{idea.description}</p>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => startNewGame(selectedVariationId)}
                    className="btn-primary w-full"
                  >
                    Un&rsquo;altra partita
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
