import React, { useEffect, useMemo, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess, type Square } from 'chess.js';
import type { OpeningRepertoireFile, ReviewLogEntry, StoredFSRSCard } from '../types/repertoire';
import { getLastMoveInfo } from '../services/fen';
import { analyzeWrongPlayerMove, type WrongMoveAnalysis } from '../services/moveAnalyzer';
import { buildDailyReviewQueue, gradeCard } from '../services/srs';
import { EvalBar } from './EvalBar';

interface ReviewModeProps {
  opening: OpeningRepertoireFile;
  cards: StoredFSRSCard[];
  logs: ReviewLogEntry[];
  variationId?: string;
  onCardReviewed: (updatedCard: StoredFSRSCard, log: ReviewLogEntry) => Promise<void>;
  onBack: () => void;
  onSessionFinished?: () => void;
}

export const ReviewMode: React.FC<ReviewModeProps> = ({
  opening,
  cards,
  logs,
  variationId,
  onCardReviewed,
  onBack,
  onSessionFinished,
}) => {
  const [includePunish, setIncludePunish] = useState<boolean>(true);
  const [sessionQueue, setSessionQueue] = useState<StoredFSRSCard[]>(() =>
    buildDailyReviewQueue({
      cards,
      logs,
      openingId: opening.id,
      variationId,
      includePunish: true,
    })
  );
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const [boardFen, setBoardFen] = useState<string>('');
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [usedHint, setUsedHint] = useState<boolean>(false);
  const [wrongAttempts, setWrongAttempts] = useState<number>(0);
  const [wrongMoveAnalysis, setWrongMoveAnalysis] = useState<WrongMoveAnalysis | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'idle' | 'wrong' | 'solved';
    message?: string;
  }>({ type: 'idle' });

  const hasPunishCards = useMemo(() => cards.some((c) => c.cardType === 'punish'), [cards]);

  useEffect(() => {
    const q = buildDailyReviewQueue({
      cards,
      logs,
      openingId: opening.id,
      variationId,
      includePunish,
    });
    setSessionQueue(q);
    setCurrentIndex(0);
    if (q.length === 0) {
      onSessionFinished?.();
    }
  }, [opening.id, variationId, includePunish]);

  const currentCard = sessionQueue[currentIndex];
  const currentNode = currentCard ? opening.positions[currentCard.normalizedFen] : undefined;
  const lastOpponentMove = useMemo(
    () => (currentCard ? getLastMoveInfo(currentCard.pgnPath) : null),
    [currentCard]
  );

  useEffect(() => {
    if (!currentCard) return;
    setSelectedSquare(null);
    setUsedHint(false);
    setWrongAttempts(0);
    setWrongMoveAnalysis(null);
    setFeedback({ type: 'idle' });

    if (lastOpponentMove && lastOpponentMove.fenBefore !== currentCard.fullFen) {
      setBoardFen(lastOpponentMove.fenBefore);
      const timer = setTimeout(() => {
        setBoardFen(currentCard.fullFen);
      }, 280);
      return () => clearTimeout(timer);
    } else {
      setBoardFen(currentCard.fullFen);
    }
  }, [currentCard, lastOpponentMove]);

  if (sessionQueue.length === 0 || currentIndex >= sessionQueue.length) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <div className="bg-[#262421] border border-[#3c3934] rounded-md p-8 text-center space-y-5">
          <div className="text-sm font-bold uppercase tracking-wider text-[#81b64c]">
            Sessione terminata
          </div>
          <h2 className="text-2xl font-bold text-[#ffffff]">Ripasso giornaliero completato</h2>
          <p className="text-base text-[#9e9c99]">
            Hai completato tutte le posizioni in scadenza per oggi (incluso il limite giornaliero di
            10 nuove card).
          </p>
          <button
            onClick={onBack}
            className="inline-flex items-center justify-center px-6 py-3 rounded bg-[#81b64c] hover:bg-[#95bb4a] text-[#ffffff] font-bold text-base transition"
          >
            ← Torna alla Dashboard
          </button>
        </div>
      </div>
    );
  }

  const attemptMove = (from: string, to: string): boolean => {
    if (feedback.type === 'solved') return false;

    const chess = new Chess(currentCard.fullFen);
    let moveObj = null;
    try {
      moveObj = chess.move({ from, to, promotion: 'q' });
    } catch {
      return false;
    }

    if (!moveObj) return false;

    if (moveObj.san === currentCard.correctMoveSan) {
      setBoardFen(chess.fen());
      setSelectedSquare(null);
      setWrongMoveAnalysis(null);
      setFeedback({
        type: 'solved',
        message: `Mossa corretta: ${currentCard.correctMoveSan}`,
      });
      return true;
    } else {
      setWrongAttempts((prev) => prev + 1);
      setSelectedSquare(null);
      const fakeNode = currentNode || {
        normalizedFen: currentCard.normalizedFen,
        fullFen: currentCard.fullFen,
        moveNumber: lastOpponentMove?.moveNumber || 4,
        ply: 8,
        turn: 'b' as const,
        isPlayerTurn: true,
        pgnPath: currentCard.pgnPath,
        moveSequenceSan: [],
        variationId: currentCard.variationId,
        variationName: '',
      };
      const analysis = analyzeWrongPlayerMove(
        fakeNode,
        moveObj.san,
        currentCard.correctMoveSan
      );
      setWrongMoveAnalysis(analysis);
      setFeedback({
        type: 'wrong',
        message: analysis.explanation,
      });
      return false;
    }
  };

  const handlePieceDrop = (sourceSquare: Square, targetSquare: Square): boolean => {
    return attemptMove(sourceSquare, targetSquare);
  };

  const handleSquareClick = (square: Square) => {
    if (feedback.type === 'solved') return;
    if (!selectedSquare) {
      const chess = new Chess(boardFen);
      const piece = chess.get(square);
      if (piece && piece.color === (opening.playerColor === 'black' ? 'b' : 'w')) {
        setSelectedSquare(square);
      }
      return;
    }
    if (selectedSquare === square) {
      setSelectedSquare(null);
      return;
    }
    const moved = attemptMove(selectedSquare, square);
    if (!moved) {
      const chess = new Chess(boardFen);
      const piece = chess.get(square);
      if (piece && piece.color === (opening.playerColor === 'black' ? 'b' : 'w')) {
        setSelectedSquare(square);
      } else {
        setSelectedSquare(null);
      }
    }
  };

  const handleUseHint = () => {
    if (feedback.type === 'solved') return;
    setUsedHint(true);
    setSelectedSquare(currentCard.correctFrom);
  };

  const handleAdvance = async (choseEasy: boolean) => {
    const { updatedCard, logEntry } = gradeCard(currentCard, {
      usedHint,
      wrongAttempts,
      choseEasy,
    });
    await onCardReviewed(updatedCard, logEntry);
    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    if (nextIndex >= sessionQueue.length) {
      onSessionFinished?.();
    }
  };

  const customSquareStyles: Record<string, React.CSSProperties> = {};
  if (lastOpponentMove && feedback.type !== 'solved') {
    customSquareStyles[lastOpponentMove.from] = {
      backgroundColor: 'rgba(155, 199, 0, 0.41)',
    };
    customSquareStyles[lastOpponentMove.to] = {
      backgroundColor: 'rgba(155, 199, 0, 0.41)',
    };
  }
  if (selectedSquare && feedback.type !== 'solved') {
    customSquareStyles[selectedSquare] = {
      backgroundColor: 'rgba(255, 255, 51, 0.45)',
    };
    try {
      const chess = new Chess(boardFen);
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
  if (usedHint && feedback.type !== 'solved') {
    customSquareStyles[currentCard.correctFrom] = {
      backgroundColor: 'rgba(54, 146, 231, 0.45)',
      boxShadow: 'inset 0 0 0 3px #3692e7',
    };
  }

  const isForcedAgain = usedHint || wrongAttempts > 0;
  const progressPct = Math.round(((currentIndex + 1) / sessionQueue.length) * 100);

  const baseEvalForBlack = useMemo(() => {
    if (currentCard.cardType === 'punish' && currentCard.mistakeContext) {
      return currentCard.mistakeContext.finalEvalForPlayer ?? 1.5;
    }
    return currentNode?.playerMove?.engine.evalFromPlayerPerspective ?? 0.0;
  }, [currentCard, currentNode]);

  const activeEvalForBlack = wrongMoveAnalysis
    ? wrongMoveAnalysis.estimatedEvalForBlack
    : baseEvalForBlack;

  const activeEvalDelta = useMemo(() => {
    if (wrongMoveAnalysis) return wrongMoveAnalysis.evalDrop;
    if (currentCard.cardType === 'punish' && currentCard.mistakeContext) {
      return currentCard.mistakeContext.evalLoss;
    }
    return null;
  }, [wrongMoveAnalysis, currentCard]);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
      {/* Top Bar */}
      <div className="bg-[#262421] border border-[#3c3934] rounded-md px-5 py-3.5 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="px-4 py-2 rounded bg-[#383633] hover:bg-[#45423e] text-sm font-semibold text-[#e8e6e3] border border-[#4a4742] transition"
            >
              ← Esci
            </button>
            <div className="h-5 w-px bg-[#3c3934]" />
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-bold text-[#e8e6e3] tabular-nums">
                  Posizione {currentIndex + 1} / {sessionQueue.length}
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded font-semibold border ${
                    currentCard.cardType === 'punish'
                      ? 'bg-[#b33430]/20 text-[#f29b98] border-[#b33430]/40'
                      : 'bg-[#1e1c1a] text-[#bababa] border-[#3c3934]'
                  }`}
                >
                  {currentCard.cardType === 'punish' ? 'Punisci Errore' : 'Repertorio'}
                </span>
              </div>
              <div className="text-sm font-mono text-[#9e9c99] truncate max-w-xs sm:max-w-xl">
                {currentCard.pgnPath}
              </div>
            </div>
          </div>

          {hasPunishCards && (
            <label className="inline-flex items-center gap-2 text-sm text-[#9e9c99] cursor-pointer">
              <input
                type="checkbox"
                checked={includePunish}
                onChange={(e) => setIncludePunish(e.target.checked)}
                className="rounded border-[#4a4742] bg-[#161512]"
              />
              Includi card &ldquo;Punisci Errori&rdquo;
            </label>
          )}
        </div>

        <div className="w-full h-1.5 bg-[#161512] rounded-sm overflow-hidden">
          <div className="h-full bg-[#81b64c] transition-all" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Chessboard + EvalBar */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full max-w-[min(78vh,720px)] flex items-stretch gap-2.5">
            <EvalBar evalForBlack={activeEvalForBlack} deltaForBlack={activeEvalDelta} />
            <div className="flex-1 aspect-square rounded overflow-hidden shadow-xl border border-[#3c3934] bg-[#262421]">
              <Chessboard
                id="review-board"
                position={boardFen}
                boardOrientation={opening.playerColor}
                arePiecesDraggable={feedback.type !== 'solved'}
                onPieceDragBegin={(_piece, sourceSquare) => {
                  if (feedback.type !== 'solved') {
                    setSelectedSquare(sourceSquare);
                  }
                }}
                onPieceDrop={handlePieceDrop}
                onSquareClick={handleSquareClick}
                customSquareStyles={customSquareStyles}
                customArrows={
                  feedback.type === 'solved'
                    ? [
                        [
                          currentCard.correctFrom as Square,
                          currentCard.correctTo as Square,
                          'rgba(129, 182, 76, 0.85)',
                        ],
                      ]
                    : []
                }
                customDarkSquareStyle={{ backgroundColor: '#739552' }}
                customLightSquareStyle={{ backgroundColor: '#ebecd0' }}
              />
            </div>
          </div>
        </div>

        {/* MoveTrainer Prompt & Evaluation Panel */}
        <div className="lg:col-span-5">
          <div className="bg-[#262421] border border-[#3c3934] rounded-md overflow-hidden">
            <div className="px-5 py-3.5 bg-[#1e1c1a] border-b border-[#3c3934] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-sm bg-[#161512] border border-[#9e9c99] inline-block" />
                <span className="text-sm font-bold uppercase tracking-wider text-[#e8e6e3]">
                  {currentCard.cardType === 'punish'
                    ? `Punisci l'errore (${opening.buildConfig.ratingBandLabel})`
                    : 'Tocca al Nero — Trova la mossa'}
                </span>
              </div>
              {wrongAttempts > 0 && (
                <span className="text-sm text-[#f29b98] font-semibold tabular-nums">
                  Errori: {wrongAttempts}
                </span>
              )}
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-2">
                {lastOpponentMove && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#161512] border border-[#3c3934] text-xs font-mono text-[#e8e6e3]">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#9bc700] inline-block" />
                    <span>
                      Ultima mossa del Bianco:{' '}
                      <strong className="text-[#ffffff]">
                        {lastOpponentMove.moveNumber}. {lastOpponentMove.san}
                      </strong>
                    </span>
                  </div>
                )}
                <h2 className="text-lg font-bold text-[#ffffff] leading-snug">
                  {currentCard.cardType === 'punish' && currentCard.mistakeContext
                    ? `Il Bianco ha giocato ${currentCard.mistakeContext.opponentMistakeSan}? (${currentCard.mistakeContext.evalLoss.toFixed(2)} pedoni persi). Gioca la confutazione.`
                    : 'Esegui la mossa del tuo repertorio sulla scacchiera.'}
                </h2>
                <p className="text-sm text-[#9e9c99]">
                  Tocca un pezzo per vedere le mosse legali o trascinalo sulla casa di destinazione.
                </p>
              </div>

              {/* Wrong Move Feedback */}
              {feedback.type === 'wrong' && (
                <div className="bg-[#b33430]/20 border border-[#b33430] text-[#f29b98] rounded px-4 py-3 text-sm font-semibold">
                  {feedback.message}
                </div>
              )}

              {/* Hint Button (before solving) */}
              {feedback.type !== 'solved' && (
                <div className="pt-3 border-t border-[#33302c] flex items-center justify-between">
                  <button
                    onClick={handleUseHint}
                    disabled={usedHint}
                    className="px-4 py-2.5 rounded bg-[#383633] hover:bg-[#45423e] disabled:opacity-50 text-sm font-semibold text-[#e8e6e3] border border-[#4a4742] transition"
                  >
                    {usedHint
                      ? `Suggerimento attivo: muovi da ${currentCard.correctFrom.toUpperCase()}`
                      : 'Mostra suggerimento (valuta Again)'}
                  </button>
                </div>
              )}

              {/* Solved Feedback + Stats + FSRS Scheduling Buttons */}
              {feedback.type === 'solved' && (
                <div className="space-y-5 pt-3 border-t border-[#33302c]">
                  <div className="bg-[#81b64c]/20 border border-[#81b64c] text-[#e8e6e3] rounded px-4 py-3 text-base font-bold">
                    {feedback.message}
                  </div>

                  {/* Stats Table for Repertoire Card */}
                  {currentCard.cardType === 'repertoire' && currentNode?.playerMove && (
                    <div className="border border-[#33302c] rounded divide-y divide-[#33302c] text-sm bg-[#1e1c1a]">
                      <div className="px-4 py-2.5 flex items-center justify-between">
                        <span className="text-[#9e9c99]">Database Masters GM</span>
                        <span className="font-semibold text-[#e8e6e3] tabular-nums">
                          {currentNode.playerMove.gmStats.totalGames.toLocaleString('it-IT')}{' '}
                          partite
                          {currentNode.playerMove.gmStats.totalGames > 0 &&
                            ` (B ${currentNode.playerMove.gmStats.whitePct}% • P ${currentNode.playerMove.gmStats.drawPct}% • N ${currentNode.playerMove.gmStats.blackPct}%)`}
                        </span>
                      </div>

                      <div className="px-4 py-2.5 flex items-center justify-between">
                        <span className="text-[#9e9c99]">
                          Fascia {opening.buildConfig.ratingBandLabel}
                        </span>
                        <span className="font-semibold text-[#e8e6e3] tabular-nums">
                          {(currentNode.playerMove.bandStats?.totalGames || 0).toLocaleString(
                            'it-IT'
                          )}{' '}
                          partite
                          {currentNode.playerMove.bandStats &&
                            currentNode.playerMove.bandStats.totalGames > 0 &&
                            ` (B ${currentNode.playerMove.bandStats.whitePct}% • P ${currentNode.playerMove.bandStats.drawPct}% • N ${currentNode.playerMove.bandStats.blackPct}%)`}
                        </span>
                      </div>

                      <div className="px-4 py-2.5 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[#9e9c99]">
                            Stockfish (d{currentNode.playerMove.engine.depth})
                          </span>
                          <span className="font-mono font-bold text-[#e8e6e3] tabular-nums">
                            {currentNode.playerMove.san}:{' '}
                            {currentNode.playerMove.engine.evalFromPlayerPerspective >= 0
                              ? '+'
                              : ''}
                            {currentNode.playerMove.engine.evalFromPlayerPerspective.toFixed(2)}
                            {currentNode.playerMove.engine.bestMoveSan !==
                              currentNode.playerMove.san &&
                              ` (1ª scelta: ${currentNode.playerMove.engine.bestMoveSan} ${
                                -currentNode.playerMove.engine.bestEvalPawns >= 0 ? '+' : ''
                              }${(-currentNode.playerMove.engine.bestEvalPawns).toFixed(2)})`}
                          </span>
                        </div>
                        <div className="font-mono text-xs text-[#8c8a87] truncate">
                          PV: {currentNode.playerMove.engine.pvSan.join(' ')}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Punish Card Details */}
                  {currentCard.cardType === 'punish' && currentCard.mistakeContext && (
                    <div className="bg-[#1e1c1a] border border-[#33302c] rounded p-4 space-y-1.5 text-sm">
                      <div className="font-semibold text-[#e8e6e3]">
                        Errore avversario ({opening.buildConfig.ratingBandLabel}):{' '}
                        <span className="font-mono">
                          {currentCard.mistakeContext.opponentMistakeSan}?
                        </span>{' '}
                        ({currentCard.mistakeContext.evalLoss.toFixed(2)} pedoni persi •{' '}
                        {currentCard.mistakeContext.severity} • Freq:{' '}
                        {currentCard.mistakeContext.frequencyPct}%)
                      </div>
                      <div className="text-[#9e9c99]">
                        Punizione:{' '}
                        <strong className="text-[#81b64c] font-mono">
                          {currentCard.correctMoveSan}
                        </strong>{' '}
                        • PV (d{currentCard.mistakeContext.depth || 20}):{' '}
                        <span className="font-mono">{currentCard.mistakeContext.pvSan.join(' ')}</span>
                        {typeof currentCard.mistakeContext.finalEvalForPlayer === 'number' && (
                          <span>
                            {' '}
                            • Eval Nero:{' '}
                            {currentCard.mistakeContext.finalEvalForPlayer >= 0 ? '+' : ''}
                            {currentCard.mistakeContext.finalEvalForPlayer.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Strategic Note (Repertoire only) */}
                  {currentCard.cardType === 'repertoire' &&
                    (currentNode?.aiCommentUnverified ||
                      currentNode?.playerMove?.aiCommentUnverified) && (
                      <div className="bg-[#1e1c1a] border border-[#33302c] rounded p-4 space-y-1.5">
                        <div className="text-xs font-bold uppercase tracking-wider text-[#8c8a87]">
                          Piano strategico (Commento AI, non verificato)
                        </div>
                        <p className="text-sm text-[#bababa] leading-relaxed">
                          {currentNode.aiCommentUnverified ||
                            currentNode.playerMove?.aiCommentUnverified}
                        </p>
                      </div>
                    )}

                  {/* FSRS Grade Buttons */}
                  <div className="pt-1">
                    {isForcedAgain ? (
                      <button
                        onClick={() => handleAdvance(false)}
                        className="w-full py-3 px-5 rounded bg-[#b33430] hover:bg-[#c93c38] text-[#ffffff] font-bold text-base transition"
                      >
                        Prossima posizione (Ripeti / Again) →
                      </button>
                    ) : (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleAdvance(false)}
                          className="flex-1 py-3 px-5 rounded bg-[#81b64c] hover:bg-[#95bb4a] text-[#ffffff] font-bold text-base shadow-[0_2px_0_0_#537a2b] transition"
                        >
                          Continua (Good) →
                        </button>
                        <button
                          onClick={() => handleAdvance(true)}
                          className="py-3 px-5 rounded bg-[#383633] hover:bg-[#45423e] text-[#e8e6e3] font-semibold text-base border border-[#4a4742] transition"
                        >
                          Facile (Easy)
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
