import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess, type Square } from 'chess.js';
import type { CommonMistake, OpeningRepertoireFile, OpponentMoveBranch } from '../types/repertoire';
import { getLastMoveInfo, normalizeFen } from '../services/fen';
import { buildMiddlegameGuide } from '../services/middlegameIdeas';

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
            message: `L'avversario (0-1400) ha commesso un errore: ${currentNode.moveNumber}. ${chosenMistake.opponentMoveSan}? (${chosenMistake.evalLoss.toFixed(2)} pedoni persi). Trova la punizione!`,
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

      if (activeTrap) {
        setActiveTrap({ ...activeTrap, solved: true });
        setGamesCompleted((prev) => prev + 1);
        setFeedback({
          type: 'correct',
          message: `Ottimo! Hai punito ${activeTrap.mistake.opponentMoveSan}? con ${expectedMove.san} (Eval Nero: ${
            activeTrap.mistake.finalEvalForPlayer >= 0 ? '+' : ''
          }${activeTrap.mistake.finalEvalForPlayer.toFixed(2)}).`,
        });
        return true;
      }

      const nextNorm = currentNode.playerMove!.nextNormalizedFen;
      setFeedback({
        type: 'correct',
        message: `Esatto: ${ currentNode.moveNumber}...${expectedMove.san}`,
      });
      if (opening.positions[nextNorm]) {
        setHistoryFens((prev) => [...prev, nextNorm]);
      }
      return true;
    } else {
      setSelectedSquare(null);
      setTotalMistakesMade((prev) => prev + 1);
      setFeedback({
        type: 'wrong',
        message: `No, non è questa (${moveObj.san}). Riprova o usa il suggerimento.`,
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
      backgroundColor: 'rgba(155, 199, 0, 0.41)',
    };
    customSquareStyles[lastMove.to] = {
      backgroundColor: 'rgba(155, 199, 0, 0.41)',
    };
  }
  if (selectedSquare && canPlayerMoveNow) {
    customSquareStyles[selectedSquare] = {
      backgroundColor: 'rgba(255, 255, 51, 0.45)',
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
      boxShadow: 'inset 0 0 0 3px #3692e7',
    };
  }

  const customArrows = useMemo(() => {
    if (activeTrap && activeTrap.solved) {
      return [
        [activeTrap.mistake.punishFrom, activeTrap.mistake.punishTo, 'rgba(129, 182, 76, 0.88)'],
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
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#262421] border border-[#3c3934] rounded-md px-5 py-3.5">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="px-4 py-2 rounded bg-[#383633] hover:bg-[#45423e] text-sm font-semibold text-[#e8e6e3] border border-[#4a4742] transition"
          >
            ← Dashboard
          </button>
          <div className="h-5 w-px bg-[#3c3934]" />
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-bold text-[#ffffff]">
                Sparring da 1.e4 (Avversario Fascia {opening.buildConfig.ratingBandLabel})
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded bg-[#161512] text-[#81b64c] border border-[#3c3934] font-semibold tabular-nums">
                Linee completate: {gamesCompleted}
              </span>
            </div>
            <div className="text-sm font-mono text-[#9e9c99] truncate max-w-xs sm:max-w-xl">
              {activeTrap
                ? `${currentNode.pgnPath} ${currentNode.moveNumber}. ${activeTrap.mistake.opponentMoveSan}?`
                : currentNode.pgnPath || '1. e4'}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-[#9e9c99] cursor-pointer">
            <input
              type="checkbox"
              checked={includeTraps}
              onChange={(e) => setIncludeTraps(e.target.checked)}
              className="rounded border-[#4a4742] bg-[#161512]"
            />
            Simula anche errori avversari da punire
          </label>

          <button
            onClick={() => startNewGame(selectedVariationId)}
            className="px-4 py-2 rounded bg-[#81b64c] hover:bg-[#95bb4a] text-[#ffffff] text-sm font-bold transition"
          >
            Nuova partita da 1.e4
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Chessboard */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full max-w-[min(78vh,680px)] aspect-square rounded overflow-hidden shadow-xl border border-[#3c3934] bg-[#262421]">
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
              customDarkSquareStyle={{ backgroundColor: '#739552' }}
              customLightSquareStyle={{ backgroundColor: '#ebecd0' }}
            />
          </div>
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-5 space-y-5">
          {/* Variation Filter */}
          <div className="bg-[#262421] border border-[#3c3934] rounded-md p-4 space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-[#9e9c99]">
              Filtra variante da allenare:
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => startNewGame(undefined)}
                className={`px-3 py-1.5 rounded text-xs font-semibold border transition ${
                  !selectedVariationId
                    ? 'bg-[#81b64c] text-[#ffffff] border-[#81b64c]'
                    : 'bg-[#1e1c1a] text-[#bababa] border-[#3c3934] hover:text-[#ffffff]'
                }`}
              >
                Tutte (Casuale 0-1400)
              </button>
              {opening.variations.map((v) => (
                <button
                  key={v.id}
                  onClick={() => startNewGame(v.id)}
                  className={`px-3 py-1.5 rounded text-xs font-semibold border transition ${
                    selectedVariationId === v.id
                      ? 'bg-[#81b64c] text-[#ffffff] border-[#81b64c]'
                      : 'bg-[#1e1c1a] text-[#bababa] border-[#3c3934] hover:text-[#ffffff]'
                  }`}
                >
                  {v.name.split('(')[0].trim()}
                </button>
              ))}
            </div>
          </div>

          {/* Active Game Status Panel */}
          <div className="bg-[#262421] border border-[#3c3934] rounded-md overflow-hidden">
            <div className="px-5 py-3.5 bg-[#1e1c1a] border-b border-[#3c3934] flex items-center justify-between">
              <span className="text-sm font-bold uppercase tracking-wider text-[#e8e6e3]">
                {isLineFinished || (activeTrap && activeTrap.solved)
                  ? 'Linea completata!'
                  : canPlayerMoveNow
                    ? `Mossa ${currentNode.moveNumber} • Tocca a TE (Nero)`
                    : 'Il Bianco sta muovendo...'}
              </span>
              {totalMistakesMade > 0 && (
                <span className="text-xs text-[#f29b98] font-semibold tabular-nums">
                  Imprecisioni in questa partita: {totalMistakesMade}
                </span>
              )}
            </div>

            <div className="p-5 space-y-4">
              {lastMove && !isLineFinished && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#161512] border border-[#3c3934] text-xs font-mono text-[#e8e6e3]">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#9bc700] inline-block" />
                  <span>
                    Ultima mossa del Bianco:{' '}
                    <strong className="text-[#ffffff]">
                      {lastMove.moveNumber}. {lastMove.san}
                    </strong>
                  </span>
                </div>
              )}

              {feedback.type !== 'idle' && feedback.message && (
                <div
                  className={`rounded px-4 py-3 text-sm font-semibold border ${
                    feedback.type === 'wrong'
                      ? 'bg-[#b33430]/20 border-[#b33430] text-[#f29b98]'
                      : feedback.type === 'trap-triggered'
                        ? 'bg-[#e69d00]/20 border-[#e69d00] text-[#f5d076]'
                        : 'bg-[#81b64c]/20 border-[#81b64c] text-[#e8e6e3]'
                  }`}
                >
                  {feedback.message}
                </div>
              )}

              {canPlayerMoveNow && expectedMove && (
                <div className="space-y-3">
                  <p className="text-base text-[#e8e6e3]">
                    {activeTrap
                      ? 'Trova la mossa che punisce l’errore del Bianco sulla scacchiera.'
                      : 'Gioca la mossa del tuo repertorio sulla scacchiera.'}
                  </p>
                  <button
                    onClick={() => {
                      setUsedHintInMove(true);
                      setSelectedSquare(expectedMove.from);
                    }}
                    disabled={usedHintInMove}
                    className="px-4 py-2 rounded bg-[#383633] hover:bg-[#45423e] disabled:opacity-50 text-sm font-semibold text-[#e8e6e3] border border-[#4a4742] transition"
                  >
                    {usedHintInMove
                      ? `Suggerimento: muovi il pezzo da ${expectedMove.from.toUpperCase()}`
                      : 'Mostra suggerimento'}
                  </button>
                </div>
              )}

              {/* End of Trap or End of Line */}
              {activeTrap && activeTrap.solved && (
                <div className="space-y-4 pt-2 border-t border-[#33302c]">
                  <div className="bg-[#1e1c1a] border border-[#33302c] rounded p-4 text-sm space-y-1">
                    <div className="font-semibold text-[#ffffff]">
                      Sequenza punitiva consigliata da Stockfish:
                    </div>
                    <div className="font-mono text-[#81b64c]">
                      {activeTrap.mistake.pvSan.join(' ')}
                    </div>
                  </div>
                  <button
                    onClick={() => startNewGame(selectedVariationId)}
                    className="w-full py-3 px-5 rounded bg-[#81b64c] hover:bg-[#95bb4a] text-[#ffffff] font-bold text-base shadow-[0_2px_0_0_#537a2b] transition"
                  >
                    Gioca un&rsquo;altra partita da 1.e4 →
                  </button>
                </div>
              )}

              {isLineFinished && middlegameGuide && (
                <div className="space-y-4">
                  <div className="bg-[#1e1c1a] border border-[#81b64c]/50 rounded p-4 space-y-2">
                    <div className="text-sm font-bold text-[#81b64c]">
                      Hai completato tutta la linea d&rsquo;apertura fino a fine repertorio!
                    </div>
                    <p className="text-sm text-[#bababa]">
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
                          className={`w-full text-left rounded p-3.5 border transition space-y-1 ${
                            isSelected
                              ? 'bg-[#1e1c1a] border-[#81b64c]'
                              : 'bg-[#1e1c1a] border-[#33302c] hover:border-[#4a4742]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#81b64c]">
                              {idea.category}
                            </span>
                            <span className="text-xs font-mono text-[#e8e6e3]">
                              {idea.movesLabel}
                            </span>
                          </div>
                          <div className="text-sm font-bold text-[#ffffff]">{idea.title}</div>
                          <p className="text-xs text-[#bababa]">{idea.description}</p>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => startNewGame(selectedVariationId)}
                    className="w-full py-3 px-5 rounded bg-[#81b64c] hover:bg-[#95bb4a] text-[#ffffff] font-bold text-base shadow-[0_2px_0_0_#537a2b] transition"
                  >
                    Gioca un&rsquo;altra partita da 1.e4 →
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
