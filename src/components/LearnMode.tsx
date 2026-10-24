import React, { useMemo, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess, type Square } from 'chess.js';
import type { CommonMistake, OpeningRepertoireFile } from '../types/repertoire';

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
  const [showInaccuracies, setShowInaccuracies] = useState<boolean>(false);
  const [activeMistakePreview, setActiveMistakePreview] = useState<{
    mistake: CommonMistake;
    pvStep: number;
  } | null>(null);

  const currentNormFen = historyFens[historyFens.length - 1] || opening.rootNormalizedFen;
  const currentNode = opening.positions[currentNormFen];

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
      <div className="max-w-4xl mx-auto p-6">
        <button onClick={onBack} className="text-sm text-[#e8e6e3] hover:underline">
          ← Torna alla Dashboard
        </button>
        <p className="mt-4 text-[#9e9c99]">Posizione fine linea raggiunta.</p>
      </div>
    );
  }

  const displayFen = previewBoardState ? previewBoardState.fen : currentNode.fullFen;

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
    return [];
  }, [currentNode, previewBoardState]);

  const navigateToFen = (nextNormFen: string) => {
    setSelectedSquare(null);
    setMoveFeedback(null);
    setActiveMistakePreview(null);
    if (opening.positions[nextNormFen]) {
      setHistoryFens((prev) => [...prev, nextNormFen]);
    }
  };

  const handleStepBack = () => {
    setSelectedSquare(null);
    setMoveFeedback(null);
    setActiveMistakePreview(null);
    if (historyFens.length > 1) {
      setHistoryFens((prev) => prev.slice(0, -1));
    }
  };

  const handleResetToRoot = (variationId?: string) => {
    setSelectedSquare(null);
    setMoveFeedback(null);
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
        if (opening.positions[currentNode.playerMove.nextNormalizedFen]) {
          navigateToFen(currentNode.playerMove.nextNormalizedFen);
        }
        return true;
      } else {
        setSelectedSquare(null);
        setMoveFeedback(
          `No, non è questa (${moveObj.san}). La mossa del repertorio è ${currentNode.playerMove.san}.`
        );
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
        navigateToFen(matchingOpp.nextNormalizedFen);
        return true;
      } else {
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

  const customSquareStyles: Record<string, React.CSSProperties> = {};
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#262421] border border-[#3c3934] rounded-md px-4 py-2.5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="px-3 py-1.5 rounded bg-[#383633] hover:bg-[#45423e] text-xs font-semibold text-[#e8e6e3] border border-[#4a4742] transition"
          >
            ← Dashboard
          </button>
          <div className="h-4 w-px bg-[#3c3934]" />
          <div>
            <div className="text-xs font-bold text-[#e8e6e3]">{currentNode.variationName}</div>
            <div className="text-xs font-mono text-[#9e9c99] truncate max-w-xs sm:max-w-md">
              {currentNode.pgnPath || '1. e4'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {opening.variations.map((v) => (
            <button
              key={v.id}
              onClick={() => handleResetToRoot(v.id)}
              className={`px-3 py-1.5 rounded text-xs font-semibold border transition ${
                currentNode.variationId === v.id
                  ? 'bg-[#383633] text-[#ffffff] border-[#6b6966]'
                  : 'bg-[#1e1c1a] text-[#9e9c99] border-[#33302c] hover:text-[#e8e6e3]'
              }`}
            >
              {v.id === 'advance-bf5' ? 'Spinta 3...Bf5' : 'Classica 4...Bf5'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Layout: Board Left + Explorer/Trainer Panel Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Chessboard Column */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <div className="w-full max-w-[460px] aspect-square rounded overflow-hidden shadow-xl border border-[#3c3934] bg-[#262421]">
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

          {moveFeedback && (
            <div className="w-full max-w-[460px] mt-2.5 bg-[#b33430]/20 border border-[#b33430] text-[#f29b98] rounded px-3.5 py-2 text-xs font-semibold">
              {moveFeedback}
            </div>
          )}

          {/* Board Control Bar (Lichess / Chessable style) */}
          <div className="flex items-center justify-between w-full max-w-[460px] mt-2.5 bg-[#262421] border border-[#3c3934] rounded-md p-1.5">
            <button
              onClick={() => handleResetToRoot()}
              className="px-3 py-1.5 rounded bg-[#1e1c1a] hover:bg-[#312e2b] text-xs font-semibold text-[#bababa] transition"
              title="Torna a 1.e4"
            >
              |◀ Inizio
            </button>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleStepBack}
                disabled={historyFens.length <= 1}
                className="px-3.5 py-1.5 rounded bg-[#383633] hover:bg-[#45423e] disabled:opacity-40 text-xs font-semibold text-[#e8e6e3] transition"
              >
                ◀ Indietro
              </button>

              {currentNode.isPlayerTurn && currentNode.playerMove && (
                <button
                  onClick={() => navigateToFen(currentNode.playerMove!.nextNormalizedFen)}
                  disabled={!opening.positions[currentNode.playerMove.nextNormalizedFen]}
                  className="px-4 py-1.5 rounded bg-[#81b64c] hover:bg-[#95bb4a] disabled:opacity-40 text-xs font-bold text-[#ffffff] transition"
                >
                  Gioca {currentNode.playerMove.san} ▶
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Explorer & Repertoire Column */}
        <div className="lg:col-span-6 space-y-4">
          {/* Main Panel */}
          <div className="bg-[#262421] border border-[#3c3934] rounded-md overflow-hidden">
            {/* Panel Header */}
            <div className="px-4 py-3 bg-[#1e1c1a] border-b border-[#3c3934] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-sm inline-block border ${
                    currentNode.isPlayerTurn
                      ? 'bg-[#161512] border-[#9e9c99]'
                      : 'bg-[#e8e6e3] border-[#9e9c99]'
                  }`}
                />
                <span className="text-xs font-bold uppercase tracking-wider text-[#e8e6e3]">
                  Mossa {currentNode.moveNumber} •{' '}
                  {currentNode.isPlayerTurn
                    ? 'Tocca al Nero (Tua mossa)'
                    : `Tocca al Bianco (Avversario ${opening.buildConfig.ratingBandLabel})`}
                </span>
              </div>
              {currentNode.ecoCode && (
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#262421] text-[#9e9c99] border border-[#3c3934]">
                  {currentNode.ecoCode}
                </span>
              )}
            </div>

            <div className="p-4 space-y-4">
              {/* PLAYER TURN: Show repertoire move + Opening Explorer bars + Engine */}
              {currentNode.isPlayerTurn && currentNode.playerMove && (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-[#1e1c1a] border border-[#33302c] rounded p-3.5">
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-[#8c8a87]">
                        Mossa del repertorio
                      </div>
                      <div className="flex flex-wrap items-center gap-2.5 mt-1">
                        <span className="text-2xl font-bold text-[#ffffff] font-mono">
                          {currentNode.moveNumber}...{currentNode.playerMove.san}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[#312e2b] border border-[#4a4742] text-xs font-mono font-bold text-[#e8e6e3] tabular-nums">
                          {currentNode.playerMove.engine.evalFromPlayerPerspective >= 0 ? '+' : ''}
                          {currentNode.playerMove.engine.evalFromPlayerPerspective.toFixed(2)}
                        </span>
                        {currentNode.playerMove.engine.bestMoveSan !==
                          currentNode.playerMove.san && (
                          <span className="text-xs text-[#9e9c99] font-mono">
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
                      className="px-4 py-2 rounded bg-[#81b64c] hover:bg-[#95bb4a] disabled:opacity-40 text-white font-bold text-xs transition"
                    >
                      Prosegui →
                    </button>
                  </div>

                  {/* Opening Explorer Bars (Masters + Band 0-1400) */}
                  <div className="border border-[#33302c] rounded overflow-hidden">
                    <div className="bg-[#1e1c1a] px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[#8c8a87] border-b border-[#33302c]">
                      Database Partite & Risultati (Bianco / Patta / Nero)
                    </div>

                    <div className="divide-y divide-[#33302c] text-xs">
                      {/* Masters Row */}
                      <div className="p-3 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#e8e6e3]">Database Masters GM</span>
                          <span className="text-[#9e9c99] tabular-nums">
                            {currentNode.playerMove.gmStats.totalGames.toLocaleString('it-IT')}{' '}
                            partite
                          </span>
                        </div>
                        {currentNode.playerMove.gmStats.totalGames > 0 ? (
                          <div className="w-full h-4 rounded-sm overflow-hidden flex text-[10px] font-bold tabular-nums border border-[#3c3934]">
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
                          <div className="text-[11px] text-[#8c8a87]">
                            Linea rara tra Grandi Maestri (0 partite)
                          </div>
                        )}
                      </div>

                      {/* Band 0-1400 Row */}
                      <div className="p-3 space-y-1.5">
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
                          <div className="w-full h-4 rounded-sm overflow-hidden flex text-[10px] font-bold tabular-nums border border-[#3c3934]">
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
                          <div className="text-[11px] text-[#8c8a87]">Dati non disponibili</div>
                        )}
                      </div>

                      {/* Engine Row */}
                      <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 bg-[#1e1c1a]/60">
                        <span className="text-[11px] text-[#8c8a87]">
                          Stockfish 16 (depth {currentNode.playerMove.engine.depth})
                        </span>
                        <span className="text-xs font-mono text-[#bababa] truncate">
                          PV: {currentNode.playerMove.engine.pvSan.join(' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* OPPONENT TURN: Lichess Opening Explorer Table */}
              {!currentNode.isPlayerTurn && (
                <div className="space-y-2">
                  <div className="text-xs text-[#9e9c99]">
                     Mosse più giocate dal Bianco nella fascia{' '}
                    <strong className="text-[#e8e6e3]">
                      {opening.buildConfig.ratingBandLabel}
                    </strong>
                    :
                  </div>

                  {currentNode.opponentMoves && currentNode.opponentMoves.length > 0 ? (
                    <div className="border border-[#33302c] rounded overflow-hidden">
                      <div className="grid grid-cols-12 bg-[#1e1c1a] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#8c8a87] border-b border-[#33302c]">
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
                              className="w-full grid grid-cols-12 items-center px-3 py-2.5 text-left text-xs bg-[#262421] hover:bg-[#312e2b] disabled:opacity-45 transition"
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
                                <div className="w-full h-3.5 rounded-sm overflow-hidden flex border border-[#3c3934]">
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
                  ) : (
                    <div className="text-xs text-[#9e9c99] bg-[#1e1c1a] rounded p-3 border border-[#33302c]">
                      Fine della linea nel repertorio.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Strategic Note (Unverified AI comment, repertoire only) */}
          {!activeMistakePreview &&
            currentNode.isPlayerTurn &&
            (currentNode.aiCommentUnverified || currentNode.playerMove?.aiCommentUnverified) && (
              <div className="bg-[#262421] border border-[#3c3934] rounded-md p-4 space-y-1.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#9e9c99]">
                  Piano strategico (Commento AI, non verificato)
                </div>
                <p className="text-xs text-[#bababa] leading-relaxed">
                  {currentNode.aiCommentUnverified || currentNode.playerMove?.aiCommentUnverified}
                </p>
              </div>
            )}

          {/* Common Mistakes Panel (Checkpoint B) */}
          {!currentNode.isPlayerTurn &&
            currentNode.commonMistakes &&
            currentNode.commonMistakes.length > 0 && (
              <div className="bg-[#262421] border border-[#3c3934] rounded-md overflow-hidden">
                <div className="px-4 py-2.5 bg-[#1e1c1a] border-b border-[#3c3934] flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#e8e6e3]">
                    Errori comuni avversario ({opening.buildConfig.ratingBandLabel})
                  </h3>
                  {hasHiddenInaccuracies && (
                    <label className="inline-flex items-center gap-1.5 text-xs text-[#9e9c99] cursor-pointer">
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

                <div className="p-4">
                  {visibleCommonMistakes.length === 0 ? (
                    <p className="text-xs text-[#9e9c99]">
                      Nessun errore &ge; 1.0 pedoni in questa posizione. Attiva &ldquo;Mostra
                      imprecisioni&rdquo; per vedere le imprecisioni minori.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {visibleCommonMistakes.map((m) => {
                        const isSelected =
                          activeMistakePreview?.mistake.opponentMoveSan === m.opponentMoveSan;
                        return (
                          <div
                            key={m.opponentMoveSan}
                            className={`rounded p-3 border transition ${
                              isSelected
                                ? 'bg-[#1e1c1a] border-[#b33430]'
                                : 'bg-[#1e1c1a] border-[#33302c]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-mono font-bold text-[#ffffff]">
                                  {currentNode.moveNumber}.{m.opponentMoveSan}?
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded bg-[#b33430]/25 text-[#f29b98] border border-[#b33430]/50 font-semibold tabular-nums">
                                  {m.evalLoss.toFixed(2)} pedoni persi ({m.severity})
                                </span>
                                <span className="text-xs text-[#9e9c99] tabular-nums">
                                  Freq: {m.frequencyPct}%
                                </span>
                              </div>
                              <button
                                onClick={() =>
                                  setActiveMistakePreview(
                                    isSelected ? null : { mistake: m, pvStep: 0 }
                                  )
                                }
                                className="px-3 py-1 rounded bg-[#383633] hover:bg-[#45423e] text-[#e8e6e3] text-xs font-semibold border border-[#4a4742] transition"
                              >
                                {isSelected ? 'Chiudi PV' : `Punisci con ${m.punishMoveSan}`}
                              </button>
                            </div>

                            <div className="text-xs text-[#bababa] mt-2">
                              Punizione:{' '}
                              <strong className="text-[#81b64c] font-mono">
                                {m.punishMoveSan}
                              </strong>{' '}
                              • PV (d{m.depth}):{' '}
                              <span className="font-mono text-[#9e9c99]">{m.pvSan.join(' ')}</span>{' '}
                              (Eval Nero: {m.finalEvalForPlayer >= 0 ? '+' : ''}
                              {m.finalEvalForPlayer.toFixed(2)})
                            </div>

                            {isSelected && (
                              <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-[#33302c]">
                                <button
                                  onClick={() =>
                                    setActiveMistakePreview((prev) =>
                                      prev
                                        ? { ...prev, pvStep: Math.max(0, prev.pvStep - 1) }
                                        : null
                                    )
                                  }
                                  className="px-2.5 py-1 rounded bg-[#262421] hover:bg-[#312e2b] border border-[#3c3934] text-xs text-[#e8e6e3]"
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
                                  className="px-2.5 py-1 rounded bg-[#262421] hover:bg-[#312e2b] border border-[#3c3934] text-xs text-[#e8e6e3]"
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
