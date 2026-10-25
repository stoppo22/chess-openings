import React, { useMemo, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess, type Square } from 'chess.js';
import type { CommonMistake, OpeningRepertoireFile } from '../types/repertoire';
import { getLastMoveInfo } from '../services/fen';
import { buildMiddlegameGuide } from '../services/middlegameIdeas';
import {
  analyzeWrongPlayerMove,
  explainOpponentMistake,
  getNodeEvalForBlack,
  type WrongMoveAnalysis,
} from '../services/moveAnalyzer';
import { EvalBar } from './EvalBar';

interface LearnModeProps {
  opening: OpeningRepertoireFile;
  initialVariationId?: string;
  onBack: () => void;
}

export const LearnMode: React.FC<LearnModeProps> = ({ opening, initialVariationId, onBack }) => {
  const initialHistory = useMemo(() => {
    if (initialVariationId) {
      const v = opening.variations.find((item) => item.id === initialVariationId);
      if (v) {
        const chess = new Chess();
        const fens: string[] = [];
        for (const san of v.rootMovesSan) {
          chess.move(san);
          const norm = chess.fen().split(/\s+/).slice(0, 4).join(' ');
          if (opening.positions[norm]) {
            fens.push(norm);
          }
        }
        if (fens.length > 0) return fens;
      }
    }
    return [opening.rootNormalizedFen];
  }, [opening, initialVariationId]);

  const [historyFens, setHistoryFens] = useState<string[]>(initialHistory);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [moveFeedback, setMoveFeedback] = useState<string | null>(null);
  const [wrongMoveAnalysis, setWrongMoveAnalysis] = useState<WrongMoveAnalysis | null>(null);
  const [showInaccuracies, setShowInaccuracies] = useState<boolean>(false);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string>('all');
  const [continuationStep, setContinuationStep] = useState<number>(0);
  const [activeMistakePreview, setActiveMistakePreview] = useState<{
    mistake: CommonMistake;
    pvStep: number;
  } | null>(null);

  const currentNormFen = historyFens[historyFens.length - 1] || opening.rootNormalizedFen;
  const previousNormFen = historyFens.length > 1 ? historyFens[historyFens.length - 2] : undefined;
  const currentNode = opening.positions[currentNormFen];
  const isLeafNode = Boolean(
    currentNode &&
      !currentNode.isPlayerTurn &&
      (!currentNode.opponentMoves || currentNode.opponentMoves.length === 0)
  );

  const middlegameGuide = useMemo(() => {
    if (!currentNode || !isLeafNode) return null;
    return buildMiddlegameGuide(opening, currentNode, previousNormFen);
  }, [opening, currentNode, isLeafNode, previousNormFen]);

  const previewBoardState = useMemo(() => {
    if (!activeMistakePreview || !currentNode) return null;
    const { mistake, pvStep } = activeMistakePreview;
    const chess = new Chess(mistake.afterMistakeFullFen);
    const appliedPv: string[] = [];
    for (let i = 0; i < pvStep && i < mistake.pvSan.length; i++) {
      const m = chess.move(mistake.pvSan[i]);
      if (!m) break;
      appliedPv.push(m.san);
    }
    return {
      fen: chess.fen(),
      appliedPv,
      arrows:
        pvStep === 0
          ? ([[mistake.punishFrom, mistake.punishTo, 'rgba(179, 52, 48, 0.85)']] as Array<
              [string, string, string?]
            >)
          : ([] as Array<[string, string, string?]>),
    };
  }, [activeMistakePreview, currentNode]);

  if (!currentNode) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <button onClick={onBack} className="text-sm text-[#e8e6e3] hover:underline">
          ← Torna alla Dashboard
        </button>
        <p className="mt-4 text-[#9e9c99]">Posizione fine linea raggiunta.</p>
      </div>
    );
  }

  const displayFen = useMemo(() => {
    if (previewBoardState) return previewBoardState.fen;
    if (
      isLeafNode &&
      middlegameGuide &&
      continuationStep > 0 &&
      middlegameGuide.continuationSteps[continuationStep - 1]
    ) {
      return middlegameGuide.continuationSteps[continuationStep - 1].fenAfter;
    }
    return currentNode.fullFen;
  }, [previewBoardState, isLeafNode, middlegameGuide, continuationStep, currentNode.fullFen]);

  const customArrows = useMemo(() => {
    if (previewBoardState) {
      return previewBoardState.arrows as Array<[any, any, string?]>;
    }
    if (currentNode.isPlayerTurn && currentNode.playerMove) {
      const pm = currentNode.playerMove;
      const baseArrow: [any, any, string?] = [pm.from, pm.to, 'rgba(129, 182, 76, 0.85)'];
      const extra = (pm.arrows || []) as Array<[any, any, string?]>;
      return [baseArrow, ...extra];
    }
    if (isLeafNode && middlegameGuide) {
      if (continuationStep > 0) {
        const nextStep = middlegameGuide.continuationSteps[continuationStep];
        if (nextStep) {
          return [
            [
              nextStep.from,
              nextStep.to,
              nextStep.turn === 'b' ? 'rgba(129, 182, 76, 0.88)' : 'rgba(54, 146, 231, 0.85)',
            ],
          ] as Array<[any, any, string?]>;
        }
        return [];
      }
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
        if (merged.length > 0) return merged;
      }
      const found = middlegameGuide.ideas.find((i) => i.id === selectedIdeaId);
      if (found) {
        return found.arrows as Array<[any, any, string?]>;
      }
    }
    return [];
  }, [currentNode, previewBoardState, isLeafNode, middlegameGuide, continuationStep, selectedIdeaId]);

  const navigateToFen = (nextNormFen: string) => {
    setSelectedSquare(null);
    setMoveFeedback(null);
    setWrongMoveAnalysis(null);
    setSelectedIdeaId('all');
    setContinuationStep(0);
    setActiveMistakePreview(null);
    if (opening.positions[nextNormFen]) {
      setHistoryFens((prev) => [...prev, nextNormFen]);
    }
  };

  const handleStepBack = () => {
    setSelectedSquare(null);
    setMoveFeedback(null);
    setWrongMoveAnalysis(null);
    setSelectedIdeaId('all');
    setContinuationStep(0);
    setActiveMistakePreview(null);
    if (historyFens.length > 1) {
      setHistoryFens((prev) => prev.slice(0, -1));
    }
  };

  const handleResetToRoot = (variationId?: string) => {
    setSelectedSquare(null);
    setMoveFeedback(null);
    setWrongMoveAnalysis(null);
    setSelectedIdeaId('all');
    setContinuationStep(0);
    setActiveMistakePreview(null);
    if (!variationId) {
      setHistoryFens([opening.rootNormalizedFen]);
      return;
    }
    const v = opening.variations.find((item) => item.id === variationId);
    if (!v) return;
    const chess = new Chess();
    const fens: string[] = [];
    for (const san of v.rootMovesSan) {
      chess.move(san);
      const norm = chess.fen().split(/\s+/).slice(0, 4).join(' ');
      if (opening.positions[norm]) {
        fens.push(norm);
      }
    }
    if (fens.length > 0) setHistoryFens(fens);
  };

  const attemptLearnMove = (from: string, to: string): boolean => {
    if (previewBoardState) return false;
    const chess = new Chess(displayFen);
    let moveObj = null;
    try {
      moveObj = chess.move({ from, to, promotion: 'q' });
    } catch {
      return false;
    }
    if (!moveObj) return false;

    if (currentNode.isPlayerTurn && currentNode.playerMove) {
      if (moveObj.san === currentNode.playerMove.san) {
        setSelectedSquare(null);
        setMoveFeedback(null);
        setWrongMoveAnalysis(null);
        if (opening.positions[currentNode.playerMove.nextNormalizedFen]) {
          navigateToFen(currentNode.playerMove.nextNormalizedFen);
        }
        return true;
      } else {
        setSelectedSquare(null);
        const analysis = analyzeWrongPlayerMove(currentNode, moveObj.san);
        setWrongMoveAnalysis(analysis);
        setMoveFeedback(analysis.explanation);
        return false;
      }
    }

    if (!currentNode.isPlayerTurn && currentNode.opponentMoves) {
      const matchingOpp = currentNode.opponentMoves.find(
        (m) => m.san === moveObj.san && opening.positions[m.nextNormalizedFen]
      );
      if (matchingOpp) {
        setSelectedSquare(null);
        setMoveFeedback(null);
        setWrongMoveAnalysis(null);
        navigateToFen(matchingOpp.nextNormalizedFen);
        return true;
      } else {
        // Se il Bianco gioca sulla scacchiera uno degli errori comuni presenti nel nodo, apri subito l'analisi dell'errore!
        const matchingMistake = (currentNode.commonMistakes || []).find(
          (m) => m.opponentMoveSan === moveObj.san
        );
        if (matchingMistake) {
          setSelectedSquare(null);
          setWrongMoveAnalysis(null);
          setActiveMistakePreview({ mistake: matchingMistake, pvStep: 0 });
          setMoveFeedback(explainOpponentMistake(matchingMistake));
          return false;
        }
        setSelectedSquare(null);
        setMoveFeedback(
          `No, non è questa (${moveObj.san}). Gioca una delle risposte del Bianco presenti nel repertorio.`
        );
        return false;
      }
    }

    return false;
  };

  const handlePieceDrop = (sourceSquare: Square, targetSquare: Square): boolean => {
    return attemptLearnMove(sourceSquare, targetSquare);
  };

  const handleSquareClick = (square: Square) => {
    if (previewBoardState) return;
    if (selectedSquare === square) {
      setSelectedSquare(null);
      return;
    }
    try {
      const chess = new Chess(displayFen);
      if (selectedSquare) {
        const moved = attemptLearnMove(selectedSquare, square);
        if (moved) return;
      }
      const piece = chess.get(square);
      if (piece && piece.color === chess.turn()) {
        setSelectedSquare(square);
      } else {
        setSelectedSquare(null);
      }
    } catch {
      setSelectedSquare(null);
    }
  };

  const lastMove = useMemo(
    () => (currentNode ? getLastMoveInfo(currentNode.moveSequenceSan) : null),
    [currentNode]
  );

  const customSquareStyles: Record<string, React.CSSProperties> = {};
  if (!previewBoardState && continuationStep === 0 && lastMove) {
    customSquareStyles[lastMove.from] = {
      backgroundColor: 'rgba(155, 199, 0, 0.41)',
    };
    customSquareStyles[lastMove.to] = {
      backgroundColor: 'rgba(155, 199, 0, 0.41)',
    };
  }
  if (selectedSquare) {
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
      // ignore invalid FEN
    }
  }

  const visibleCommonMistakes = useMemo(() => {
    const all = currentNode.commonMistakes || [];
    return all.filter(
      (m) => showInaccuracies || m.severity === 'mistake' || m.severity === 'blunder'
    );
  }, [currentNode.commonMistakes, showInaccuracies]);

  const hasHiddenInaccuracies = useMemo(() => {
    const all = currentNode.commonMistakes || [];
    return all.some((m) => m.severity === 'inaccuracy');
  }, [currentNode.commonMistakes]);

  const baseEvalForBlack = useMemo(
    () => getNodeEvalForBlack(opening, currentNode, previousNormFen),
    [opening, currentNode, previousNormFen]
  );

  const activeEvalForBlack = useMemo(() => {
    if (activeMistakePreview) {
      return activeMistakePreview.mistake.finalEvalForPlayer;
    }
    if (wrongMoveAnalysis) {
      return wrongMoveAnalysis.estimatedEvalForBlack;
    }
    return baseEvalForBlack;
  }, [activeMistakePreview, wrongMoveAnalysis, baseEvalForBlack]);

  const activeEvalDelta = useMemo(() => {
    if (activeMistakePreview) {
      return activeMistakePreview.mistake.evalLoss;
    }
    if (wrongMoveAnalysis) {
      return wrongMoveAnalysis.evalDrop;
    }
    return null;
  }, [activeMistakePreview, wrongMoveAnalysis]);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
      {/* Top Header Bar */}
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
            <div className="text-sm font-bold text-[#e8e6e3]">{currentNode.variationName}</div>
            <div className="text-sm font-mono text-[#9e9c99] truncate max-w-xs sm:max-w-xl">
              {currentNode.pgnPath || '1. e4'}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {opening.variations.map((v) => (
            <button
              key={v.id}
              onClick={() => handleResetToRoot(v.id)}
              className={`px-3 py-1.5 rounded text-xs sm:text-sm font-semibold border transition ${
                currentNode.variationId === v.id
                  ? 'bg-[#383633] text-[#ffffff] border-[#6b6966]'
                  : 'bg-[#1e1c1a] text-[#9e9c99] border-[#33302c] hover:text-[#e8e6e3]'
              }`}
            >
              {v.name.split('(')[0].trim()}
            </button>
          ))}
        </div>
      </div>

      {/* Main Layout: Board Left + Explorer/Trainer Panel Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Chessboard + EvalBar Column */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full max-w-[min(78vh,720px)] flex items-stretch gap-2.5">
            <EvalBar evalForBlack={activeEvalForBlack} deltaForBlack={activeEvalDelta} />
            <div className="flex-1 aspect-square rounded overflow-hidden shadow-xl border border-[#3c3934] bg-[#262421]">
              <Chessboard
                id="learn-board"
                position={displayFen}
                boardOrientation={opening.playerColor}
                arePiecesDraggable={!previewBoardState}
                onPieceDragBegin={(_piece, sourceSquare) => {
                  if (!previewBoardState) {
                    setSelectedSquare(sourceSquare);
                  }
                }}
                onPieceDrop={handlePieceDrop}
                onSquareClick={handleSquareClick}
                customSquareStyles={customSquareStyles}
                customArrows={customArrows}
                customDarkSquareStyle={{ backgroundColor: '#739552' }}
                customLightSquareStyle={{ backgroundColor: '#ebecd0' }}
              />
            </div>
          </div>

          {moveFeedback && (
            <div className="w-full max-w-[min(78vh,720px)] mt-3 bg-[#b33430]/20 border border-[#b33430] text-[#f29b98] rounded px-4 py-3 text-sm font-semibold">
              {moveFeedback}
            </div>
          )}

          {/* Board Control Bar (Lichess / Chessable style) */}
          <div className="flex items-center justify-between w-full max-w-[min(78vh,720px)] mt-3 bg-[#262421] border border-[#3c3934] rounded-md p-2">
            <button
              onClick={() => handleResetToRoot()}
              className="px-4 py-2 rounded bg-[#1e1c1a] hover:bg-[#312e2b] text-sm font-semibold text-[#bababa] transition"
              title="Torna a 1.e4"
            >
              |◀ Inizio
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleStepBack}
                disabled={historyFens.length <= 1}
                className="px-4 py-2 rounded bg-[#383633] hover:bg-[#45423e] disabled:opacity-40 text-sm font-semibold text-[#e8e6e3] transition"
              >
                ◀ Indietro
              </button>

              {currentNode.isPlayerTurn && currentNode.playerMove && (
                <button
                  onClick={() => navigateToFen(currentNode.playerMove!.nextNormalizedFen)}
                  disabled={!opening.positions[currentNode.playerMove.nextNormalizedFen]}
                  className="px-5 py-2 rounded bg-[#81b64c] hover:bg-[#95bb4a] disabled:opacity-40 text-sm font-bold text-[#ffffff] transition"
                >
                  Gioca {currentNode.playerMove.san} ▶
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Explorer & Repertoire Column */}
        <div className="lg:col-span-5 space-y-5">
          {/* Main Panel */}
          <div className="bg-[#262421] border border-[#3c3934] rounded-md overflow-hidden">
            {/* Panel Header */}
            <div className="px-5 py-3.5 bg-[#1e1c1a] border-b border-[#3c3934] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-3 h-3 rounded-sm inline-block border ${
                    currentNode.isPlayerTurn
                      ? 'bg-[#161512] border-[#9e9c99]'
                      : 'bg-[#e8e6e3] border-[#9e9c99]'
                  }`}
                />
                <span className="text-sm font-bold uppercase tracking-wider text-[#e8e6e3]">
                  Mossa {currentNode.moveNumber} •{' '}
                  {currentNode.isPlayerTurn
                    ? 'Tocca al Nero (Tua mossa)'
                    : `Tocca al Bianco (Avversario ${opening.buildConfig.ratingBandLabel})`}
                </span>
              </div>
              {currentNode.ecoCode && (
                <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-[#262421] text-[#9e9c99] border border-[#3c3934]">
                  {currentNode.ecoCode}
                </span>
              )}
            </div>

            <div className="p-5 space-y-5">
              {/* PLAYER TURN: Show repertoire move + Opening Explorer bars + Engine */}
              {currentNode.isPlayerTurn && currentNode.playerMove && (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-[#1e1c1a] border border-[#33302c] rounded p-4">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-[#8c8a87]">
                        Mossa del repertorio (giocala sulla scacchiera o premi Prosegui)
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5">
                        <span className="text-3xl font-bold text-[#ffffff] font-mono">
                          {currentNode.moveNumber}...{currentNode.playerMove.san}
                        </span>
                        <span className="px-2.5 py-1 rounded bg-[#312e2b] border border-[#4a4742] text-sm font-mono font-bold text-[#e8e6e3] tabular-nums">
                          {currentNode.playerMove.engine.evalFromPlayerPerspective >= 0 ? '+' : ''}
                          {currentNode.playerMove.engine.evalFromPlayerPerspective.toFixed(2)}
                        </span>
                        {currentNode.playerMove.engine.bestMoveSan !==
                          currentNode.playerMove.san && (
                          <span className="text-sm text-[#9e9c99] font-mono">
                            1ª scelta SF:{' '}
                            <strong className="text-[#e8e6e3]">
                              {currentNode.playerMove.engine.bestMoveSan}
                            </strong>{' '}
                            (
                            {-currentNode.playerMove.engine.bestEvalPawns >= 0 ? '+' : ''}
                            {(-currentNode.playerMove.engine.bestEvalPawns).toFixed(2)})
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => navigateToFen(currentNode.playerMove!.nextNormalizedFen)}
                      disabled={!opening.positions[currentNode.playerMove.nextNormalizedFen]}
                      className="px-5 py-2.5 rounded bg-[#81b64c] hover:bg-[#95bb4a] disabled:opacity-40 text-white font-bold text-sm transition"
                    >
                      Prosegui →
                    </button>
                  </div>

                  {/* Opening Explorer Bars (Masters + Band 0-1400) */}
                  <div className="border border-[#33302c] rounded overflow-hidden">
                    <div className="bg-[#1e1c1a] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#8c8a87] border-b border-[#33302c]">
                      Database Partite & Risultati (Bianco / Patta / Nero)
                    </div>

                    <div className="divide-y divide-[#33302c] text-sm">
                      {/* Masters Row */}
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#e8e6e3]">Database Masters GM</span>
                          <span className="text-[#9e9c99] tabular-nums">
                            {currentNode.playerMove.gmStats.totalGames.toLocaleString('it-IT')}{' '}
                            partite
                          </span>
                        </div>
                        {currentNode.playerMove.gmStats.totalGames > 0 ? (
                          <div className="w-full h-5 rounded-sm overflow-hidden flex text-xs font-bold tabular-nums border border-[#3c3934]">
                            <div
                              style={{ width: `${currentNode.playerMove.gmStats.whitePct}%` }}
                              className="bg-[#e8e6e3] text-[#161512] flex items-center justify-center overflow-hidden"
                            >
                              {currentNode.playerMove.gmStats.whitePct >= 12
                                ? `${currentNode.playerMove.gmStats.whitePct}%`
                                : ''}
                            </div>
                            <div
                              style={{ width: `${currentNode.playerMove.gmStats.drawPct}%` }}
                              className="bg-[#6b6966] text-[#ffffff] flex items-center justify-center overflow-hidden"
                            >
                              {currentNode.playerMove.gmStats.drawPct >= 12
                                ? `${currentNode.playerMove.gmStats.drawPct}%`
                                : ''}
                            </div>
                            <div
                              style={{ width: `${currentNode.playerMove.gmStats.blackPct}%` }}
                              className="bg-[#1e1c1a] text-[#e8e6e3] flex items-center justify-center overflow-hidden"
                            >
                              {currentNode.playerMove.gmStats.blackPct >= 12
                                ? `${currentNode.playerMove.gmStats.blackPct}%`
                                : ''}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-[#8c8a87]">
                            Linea rara tra Grandi Maestri (0 partite)
                          </div>
                        )}
                      </div>

                      {/* Band 0-1400 Row */}
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#e8e6e3]">
                            Lichess Fascia {opening.buildConfig.ratingBandLabel}
                          </span>
                          <span className="text-[#9e9c99] tabular-nums">
                            {(currentNode.playerMove.bandStats?.totalGames || 0).toLocaleString(
                              'it-IT'
                            )}{' '}
                            partite
                          </span>
                        </div>
                        {currentNode.playerMove.bandStats &&
                        currentNode.playerMove.bandStats.totalGames > 0 ? (
                          <div className="w-full h-5 rounded-sm overflow-hidden flex text-xs font-bold tabular-nums border border-[#3c3934]">
                            <div
                              style={{ width: `${currentNode.playerMove.bandStats.whitePct}%` }}
                              className="bg-[#e8e6e3] text-[#161512] flex items-center justify-center overflow-hidden"
                            >
                              {currentNode.playerMove.bandStats.whitePct >= 12
                                ? `${currentNode.playerMove.bandStats.whitePct}%`
                                : ''}
                            </div>
                            <div
                              style={{ width: `${currentNode.playerMove.bandStats.drawPct}%` }}
                              className="bg-[#6b6966] text-[#ffffff] flex items-center justify-center overflow-hidden"
                            >
                              {currentNode.playerMove.bandStats.drawPct >= 12
                                ? `${currentNode.playerMove.bandStats.drawPct}%`
                                : ''}
                            </div>
                            <div
                              style={{ width: `${currentNode.playerMove.bandStats.blackPct}%` }}
                              className="bg-[#1e1c1a] text-[#e8e6e3] flex items-center justify-center overflow-hidden"
                            >
                              {currentNode.playerMove.bandStats.blackPct >= 12
                                ? `${currentNode.playerMove.bandStats.blackPct}%`
                                : ''}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-[#8c8a87]">Dati non disponibili</div>
                        )}
                      </div>

                      {/* Engine Row */}
                      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 bg-[#1e1c1a]/60">
                        <span className="text-xs text-[#8c8a87]">
                          Stockfish 16 (depth {currentNode.playerMove.engine.depth})
                        </span>
                        <span className="text-sm font-mono text-[#bababa] truncate">
                          PV: {currentNode.playerMove.engine.pvSan.join(' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* OPPONENT TURN: Lichess Opening Explorer Table or Middlegame Ideas on Leaf */}
              {!currentNode.isPlayerTurn && (
                <div className="space-y-4">
                  {currentNode.opponentMoves && currentNode.opponentMoves.length > 0 ? (
                    <>
                      <div className="text-sm text-[#9e9c99]">
                        Mosse più giocate dal Bianco nella fascia{' '}
                        <strong className="text-[#e8e6e3]">
                          {opening.buildConfig.ratingBandLabel}
                        </strong>{' '}
                        (clicca una riga o gioca la mossa sulla scacchiera):
                      </div>

                      <div className="border border-[#33302c] rounded overflow-hidden">
                        <div className="grid grid-cols-12 bg-[#1e1c1a] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#8c8a87] border-b border-[#33302c]">
                          <div className="col-span-3">Mossa</div>
                          <div className="col-span-2 text-right">Freq.</div>
                          <div className="col-span-3 text-right pr-3">Partite</div>
                          <div className="col-span-4">B / P / N</div>
                        </div>
                        <div className="divide-y divide-[#33302c]">
                          {currentNode.opponentMoves.map((opp) => {
                            const canFollow = Boolean(opening.positions[opp.nextNormalizedFen]);
                            return (
                              <button
                                key={opp.san}
                                onClick={() => canFollow && navigateToFen(opp.nextNormalizedFen)}
                                disabled={!canFollow}
                                className="w-full grid grid-cols-12 items-center px-4 py-3 text-left text-sm bg-[#262421] hover:bg-[#312e2b] disabled:opacity-45 transition"
                              >
                                <div className="col-span-3 font-mono font-bold text-[#ffffff]">
                                  {currentNode.moveNumber}.{opp.san}
                                </div>
                                <div className="col-span-2 text-right font-semibold text-[#e8e6e3] tabular-nums">
                                  {opp.frequencyPct}%
                                </div>
                                <div className="col-span-3 text-right pr-3 text-[#9e9c99] tabular-nums">
                                  {opp.bandStats.totalGames.toLocaleString('it-IT')}
                                </div>
                                <div className="col-span-4">
                                  <div className="w-full h-4 rounded-sm overflow-hidden flex border border-[#3c3934]">
                                    <div
                                      style={{ width: `${opp.bandStats.whitePct}%` }}
                                      className="bg-[#e8e6e3]"
                                      title={`Bianco: ${opp.bandStats.whitePct}%`}
                                    />
                                    <div
                                      style={{ width: `${opp.bandStats.drawPct}%` }}
                                      className="bg-[#6b6966]"
                                      title={`Patta: ${opp.bandStats.drawPct}%`}
                                    />
                                    <div
                                      style={{ width: `${opp.bandStats.blackPct}%` }}
                                      className="bg-[#161512]"
                                      title={`Nero: ${opp.bandStats.blackPct}%`}
                                    />
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  ) : (
                    middlegameGuide && (
                      <div className="space-y-4">
                        <div className="bg-[#1e1c1a] border border-[#33302c] rounded p-4 space-y-3">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div>
                              <span className="text-xs font-bold uppercase tracking-wider text-[#81b64c]">
                                Fine linea teorica • Idee per il Mediogioco
                              </span>
                              <h3 className="text-base font-bold text-[#ffffff] mt-0.5">
                                Come proseguire da qui: piani, rotture e attacchi
                              </h3>
                            </div>
                            {middlegameGuide.evalFromBlackPerspective !== null && (
                              <span className="px-2.5 py-1 rounded bg-[#262421] border border-[#3c3934] text-xs font-mono font-bold text-[#e8e6e3] tabular-nums">
                                Eval Nero:{' '}
                                {middlegameGuide.evalFromBlackPerspective >= 0 ? '+' : ''}
                                {middlegameGuide.evalFromBlackPerspective.toFixed(2)}
                              </span>
                            )}
                          </div>

                          {/* Step-by-step Stockfish Continuation */}
                          {middlegameGuide.continuationSteps.length > 0 && (
                            <div className="pt-3 border-t border-[#33302c] space-y-2.5">
                              <div className="text-xs font-bold uppercase tracking-wider text-[#9e9c99]">
                                Continuazione consigliata da Stockfish (sfoglia sulla scacchiera):
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 font-mono text-sm bg-[#161512] p-2.5 rounded border border-[#33302c]">
                                {middlegameGuide.continuationSteps.map((step, idx) => {
                                  const isActive = continuationStep === idx + 1;
                                  return (
                                    <button
                                      key={step.plyOffset}
                                      onClick={() => {
                                        setActiveMistakePreview(null);
                                        setContinuationStep(idx + 1);
                                      }}
                                      className={`px-2 py-0.5 rounded transition ${
                                        isActive
                                          ? 'bg-[#81b64c] text-[#ffffff] font-bold'
                                          : step.turn === 'b'
                                            ? 'text-[#e8e6e3] hover:bg-[#262421]'
                                            : 'text-[#9e9c99] hover:bg-[#262421]'
                                      }`}
                                    >
                                      {step.turn === 'w'
                                        ? `${step.moveNumber}.${step.san}`
                                        : `${step.moveNumber}...${step.san}`}
                                    </button>
                                  );
                                })}
                              </div>

                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      setActiveMistakePreview(null);
                                      setContinuationStep((prev) => Math.max(0, prev - 1));
                                    }}
                                    disabled={continuationStep === 0}
                                    className="px-3 py-1.5 rounded bg-[#262421] hover:bg-[#312e2b] disabled:opacity-40 border border-[#3c3934] text-xs font-semibold text-[#e8e6e3]"
                                  >
                                    ◀ Mossa prec.
                                  </button>
                                  <span className="text-xs font-mono text-[#e8e6e3] tabular-nums">
                                    Step {continuationStep}/
                                    {middlegameGuide.continuationSteps.length}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setActiveMistakePreview(null);
                                      setContinuationStep((prev) =>
                                        Math.min(
                                          middlegameGuide.continuationSteps.length,
                                          prev + 1
                                        )
                                      );
                                    }}
                                    disabled={
                                      continuationStep >= middlegameGuide.continuationSteps.length
                                    }
                                    className="px-3 py-1.5 rounded bg-[#262421] hover:bg-[#312e2b] disabled:opacity-40 border border-[#3c3934] text-xs font-semibold text-[#e8e6e3]"
                                  >
                                    Mossa succ. ▶
                                  </button>
                                </div>
                                {continuationStep > 0 && (
                                  <button
                                    onClick={() => setContinuationStep(0)}
                                    className="px-3 py-1.5 rounded bg-[#383633] hover:bg-[#45423e] text-xs font-semibold text-[#e8e6e3]"
                                  >
                                    Torna a fine linea
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Clickable Middlegame Ideas with Arrows */}
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#9e9c99]">
                              Tocca un piano per vedere le frecce sulla scacchiera:
                            </span>
                            <button
                              onClick={() => {
                                setActiveMistakePreview(null);
                                setContinuationStep(0);
                                setSelectedIdeaId('all');
                              }}
                              className={`px-3 py-1 rounded text-xs font-semibold border transition ${
                                selectedIdeaId === 'all' && continuationStep === 0
                                  ? 'bg-[#81b64c] text-[#ffffff] border-[#81b64c]'
                                  : 'bg-[#1e1c1a] text-[#bababa] border-[#3c3934] hover:text-[#ffffff]'
                              }`}
                            >
                              Mostra tutte le frecce
                            </button>
                          </div>

                          <div className="space-y-2.5">
                            {middlegameGuide.ideas.map((idea) => {
                              const isSelected =
                                selectedIdeaId === idea.id && continuationStep === 0;
                              return (
                                <button
                                  key={idea.id}
                                  type="button"
                                  onClick={() => {
                                    setActiveMistakePreview(null);
                                    setContinuationStep(0);
                                    setSelectedIdeaId(idea.id);
                                  }}
                                  className={`w-full text-left rounded p-4 border transition space-y-1.5 ${
                                    isSelected
                                      ? 'bg-[#1e1c1a] border-[#81b64c]'
                                      : 'bg-[#1e1c1a] border-[#33302c] hover:border-[#4a4742]'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#262421] text-[#81b64c] border border-[#3c3934]">
                                      {idea.category}
                                    </span>
                                    <span className="text-xs font-mono text-[#e8e6e3] bg-[#161512] px-2.5 py-0.5 rounded border border-[#33302c]">
                                      {idea.movesLabel}
                                    </span>
                                  </div>
                                  <div className="text-base font-bold text-[#ffffff]">
                                    {idea.title}
                                  </div>
                                  <p className="text-sm text-[#bababa] leading-relaxed">
                                    {idea.description}
                                  </p>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Strategic Note (Unverified AI comment, repertoire only) */}
          {!activeMistakePreview &&
            currentNode.isPlayerTurn &&
            (currentNode.aiCommentUnverified || currentNode.playerMove?.aiCommentUnverified) && (
              <div className="bg-[#262421] border border-[#3c3934] rounded-md p-5 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-[#9e9c99]">
                  Piano strategico (Commento AI, non verificato)
                </div>
                <p className="text-sm text-[#bababa] leading-relaxed">
                  {currentNode.aiCommentUnverified || currentNode.playerMove?.aiCommentUnverified}
                </p>
              </div>
            )}

          {/* Common Mistakes Panel (Checkpoint B) */}
          {!currentNode.isPlayerTurn &&
            currentNode.commonMistakes &&
            currentNode.commonMistakes.length > 0 && (
              <div className="bg-[#262421] border border-[#3c3934] rounded-md overflow-hidden">
                <div className="px-5 py-3 bg-[#1e1c1a] border-b border-[#3c3934] flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#e8e6e3]">
                    Errori comuni avversario ({opening.buildConfig.ratingBandLabel})
                  </h3>
                  {hasHiddenInaccuracies && (
                    <label className="inline-flex items-center gap-2 text-xs text-[#9e9c99] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showInaccuracies}
                        onChange={(e) => setShowInaccuracies(e.target.checked)}
                        className="rounded border-[#4a4742] bg-[#161512]"
                      />
                      Mostra imprecisioni (0.4–1.0)
                    </label>
                  )}
                </div>

                <div className="p-5">
                  {visibleCommonMistakes.length === 0 ? (
                    <p className="text-sm text-[#9e9c99]">
                      Nessun errore &ge; 1.0 pedoni in questa posizione. Attiva &ldquo;Mostra
                      imprecisioni&rdquo; per vedere le imprecisioni minori.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {visibleCommonMistakes.map((m) => {
                        const isSelected =
                          activeMistakePreview?.mistake.opponentMoveSan === m.opponentMoveSan;
                        return (
                          <div
                            key={m.opponentMoveSan}
                            className={`rounded p-4 border transition ${
                              isSelected
                                ? 'bg-[#1e1c1a] border-[#b33430]'
                                : 'bg-[#1e1c1a] border-[#33302c]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <span className="text-base font-mono font-bold text-[#ffffff]">
                                  {currentNode.moveNumber}.{m.opponentMoveSan}?
                                </span>
                                <span className="text-xs px-2.5 py-0.5 rounded bg-[#b33430]/25 text-[#f29b98] border border-[#b33430]/50 font-semibold tabular-nums">
                                  {m.evalLoss.toFixed(2)} pedoni persi ({m.severity})
                                </span>
                                <span className="text-sm text-[#9e9c99] tabular-nums">
                                  Freq: {m.frequencyPct}%
                                </span>
                              </div>
                              <button
                                onClick={() =>
                                  setActiveMistakePreview(
                                    isSelected ? null : { mistake: m, pvStep: 0 }
                                  )
                                }
                                className="px-3.5 py-1.5 rounded bg-[#383633] hover:bg-[#45423e] text-[#e8e6e3] text-xs font-semibold border border-[#4a4742] transition"
                              >
                                {isSelected ? 'Chiudi PV' : `Punisci con ${m.punishMoveSan}`}
                              </button>
                            </div>

                            <div className="text-sm text-[#bababa] mt-2">
                              Punizione:{' '}
                              <strong className="text-[#81b64c] font-mono">
                                {m.punishMoveSan}
                              </strong>{' '}
                              • PV (d{m.depth}):{' '}
                              <span className="font-mono text-[#9e9c99]">{m.pvSan.join(' ')}</span>{' '}
                              (Eval Nero: {m.finalEvalForPlayer >= 0 ? '+' : ''}
                              {m.finalEvalForPlayer.toFixed(2)})
                            </div>

                            <div className="text-xs text-[#9e9c99] mt-1.5 leading-relaxed bg-[#161512] px-3 py-2 rounded border border-[#33302c]">
                              {explainOpponentMistake(m)}
                            </div>

                            {isSelected && (
                              <div className="flex items-center gap-2.5 mt-3 pt-3 border-t border-[#33302c]">
                                <button
                                  onClick={() =>
                                    setActiveMistakePreview((prev) =>
                                      prev
                                        ? { ...prev, pvStep: Math.max(0, prev.pvStep - 1) }
                                        : null
                                    )
                                  }
                                  className="px-3 py-1.5 rounded bg-[#262421] hover:bg-[#312e2b] border border-[#3c3934] text-xs text-[#e8e6e3]"
                                >
                                  ◀ Mossa prec.
                                </button>
                                <span className="text-xs font-mono text-[#e8e6e3] tabular-nums">
                                  Step {activeMistakePreview.pvStep}/{m.pvSan.length}
                                </span>
                                <button
                                  onClick={() =>
                                    setActiveMistakePreview((prev) =>
                                      prev
                                        ? {
                                            ...prev,
                                            pvStep: Math.min(m.pvSan.length, prev.pvStep + 1),
                                          }
                                        : null
                                    )
                                  }
                                  className="px-3 py-1.5 rounded bg-[#262421] hover:bg-[#312e2b] border border-[#3c3934] text-xs text-[#e8e6e3]"
                                >
                                  Mossa succ. ▶
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};
