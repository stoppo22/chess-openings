import React, { useEffect, useMemo, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess, type Square } from 'chess.js';
import type { ConceptPrinciple } from '../types/lessons';
import type { OpeningRepertoireFile, ReviewLogEntry, StoredFSRSCard } from '../types/repertoire';
import { formatLine, formatMoveLabel, getLastMoveInfo } from '../services/fen';
import { analyzeWrongPlayerMove, type WrongMoveAnalysis } from '../services/moveAnalyzer';
import { buildDailyReviewQueue, gradeCard } from '../services/srs';
import { ModeHeader } from './ModeHeader';
import { EvalBar } from './EvalBar';
import { PlanQuiz } from './PlanQuiz';
import { RichText } from './RichText';
import type { SessionItem } from '../services/dailySession';
import { findPunishLesson } from '../services/quiz';
import type { LoadedLessons } from '../data/lessons';

interface ReviewModeProps {
  opening: OpeningRepertoireFile;
  cards: StoredFSRSCard[];
  logs: ReviewLogEntry[];
  variationId?: string;
  /** Sessione giornaliera già costruita (può contenere quiz sul piano). */
  session?: SessionItem[];
  lessonData?: LoadedLessons;
  onCardReviewed: (updatedCard: StoredFSRSCard, log: ReviewLogEntry) => Promise<void>;
  onBack: () => void;
  onSessionFinished?: () => void;
}

export const ReviewMode: React.FC<ReviewModeProps> = ({
  opening,
  cards,
  logs,
  variationId,
  session,
  lessonData,
  onCardReviewed,
  onBack,
  onSessionFinished,
}) => {
  const [includePunish, setIncludePunish] = useState<boolean>(true);
  const [items, setItems] = useState<SessionItem[]>(
    () =>
      session ??
      buildDailyReviewQueue({ cards, logs, openingId: opening.id, variationId, includePunish: true }).map((c) => ({
        kind: 'review' as const,
        cardId: c.id,
        card: c,
        normalizedFen: c.normalizedFen,
      }))
  );
  const sessionQueue = items;
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const [boardFen, setBoardFen] = useState<string>('');
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [usedHint, setUsedHint] = useState<boolean>(false);
  const [wrongAttempts, setWrongAttempts] = useState<number>(0);
  const [wrongMoveAnalysis, setWrongMoveAnalysis] = useState<WrongMoveAnalysis | null>(null);
  const [wrongLesson, setWrongLesson] = useState<{ title: string; text: string; principle?: ConceptPrinciple } | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'idle' | 'wrong' | 'solved';
    message?: string;
  }>({ type: 'idle' });

  const hasPunishCards = useMemo(() => cards.some((c) => c.cardType === 'punish'), [cards]);

  useEffect(() => {
    if (session) {
      if (session.length === 0) onSessionFinished?.();
      return;
    }
    const q = buildDailyReviewQueue({
      cards,
      logs,
      openingId: opening.id,
      variationId,
      includePunish,
    });
    setItems(
      q.map((c) => ({ kind: 'review' as const, cardId: c.id, card: c, normalizedFen: c.normalizedFen }))
    );
    setCurrentIndex(0);
    if (q.length === 0) {
      onSessionFinished?.();
    }
  }, [opening.id, variationId, includePunish]);

  const currentItem = sessionQueue[currentIndex];
  const currentCard = currentItem?.card as StoredFSRSCard;
  const quizLesson = currentItem?.kind === 'planQuiz' ? lessonData?.lessons[currentItem.normalizedFen] : undefined;
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
    setWrongLesson(null);
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

  const baseEvalForPlayer = useMemo(() => {
    if (currentCard?.cardType === 'punish' && currentCard.mistakeContext) {
      return currentCard.mistakeContext.finalEvalForPlayer ?? null;
    }
    return currentNode?.playerMove?.engine.evalFromPlayerPerspective ?? null;
  }, [currentCard, currentNode]);

  const activeEvalForPlayer = wrongMoveAnalysis
    ? (wrongMoveAnalysis.evalForPlayer ?? baseEvalForPlayer)
    : baseEvalForPlayer;

  const activeEvalDelta = useMemo(() => {
    if (wrongMoveAnalysis) return wrongMoveAnalysis.evalDrop;
    if (currentCard?.cardType === 'punish' && currentCard.mistakeContext) {
      return currentCard.mistakeContext.evalLoss;
    }
    return null;
  }, [wrongMoveAnalysis, currentCard]);

  if (sessionQueue.length === 0 || currentIndex >= sessionQueue.length) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <div className="bg-surface border border-border rounded-xl p-8 text-center space-y-5">
          <h2 className="text-2xl text-text">Ripasso di oggi completato</h2>
          <p className="text-base text-muted">
            Hai completato tutte le posizioni in scadenza per oggi (incluso il limite giornaliero di
            10 nuove mosse).
          </p>
          <button
            onClick={onBack}
            className="btn-primary"
          >
            Torna all'inizio
          </button>
        </div>
      </div>
    );
  }

  const advanceQuiz = () => {
    const next = currentIndex + 1;
    setCurrentIndex(next);
    if (next >= sessionQueue.length) onSessionFinished?.();
  };

  if (currentItem.kind === 'planQuiz' && quizLesson?.planQuiz) {
    return (
      <PlanQuiz
        key={currentItem.normalizedFen}
        lesson={quizLesson}
        concept={lessonData?.concepts[quizLesson.variationId]}
        fen={opening.positions[currentItem.normalizedFen].fullFen}
        orientation={opening.playerColor}
        onNext={advanceQuiz}
      />
    );
  }
  if (!currentCard) {
    advanceQuiz();
    return null;
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
        turn: (opening.playerColor === 'white' ? 'w' : 'b') as 'w' | 'b',
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
      const lesson = lessonData?.lessons[currentCard.normalizedFen];
      if (currentCard.cardType === 'repertoire' && lesson?.whyNot?.san === moveObj.san) {
        const concept = lessonData?.concepts[lesson.variationId];
        setWrongLesson({
          title: 'Perché no',
          text: lesson.whyNot.text,
          principle: concept?.principles.find((p) => p.id === lesson.conceptRefs[0]),
        });
      } else if (currentCard.cardType === 'punish') {
        const text = findPunishLesson(opening, lessonData?.lessons, currentCard)?.opponentMistake?.text;
        setWrongLesson(text ? { title: "Perché l'errore si punisce", text } : null);
      } else setWrongLesson(null);
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
      backgroundColor: 'rgba(214, 178, 74, 0.45)',
    };
    customSquareStyles[lastOpponentMove.to] = {
      backgroundColor: 'rgba(214, 178, 74, 0.45)',
    };
  }
  if (selectedSquare && feedback.type !== 'solved') {
    customSquareStyles[selectedSquare] = {
      backgroundColor: 'rgba(214, 178, 74, 0.7)',
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
      boxShadow: 'inset 0 0 0 3px rgb(var(--accent))',
    };
  }

  const isForcedAgain = usedHint || wrongAttempts > 0;
  const progressPct = Math.round(((currentIndex + 1) / sessionQueue.length) * 100);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-5 space-y-3 sm:space-y-5">
      {/* Top Bar */}
      <ModeHeader
        onBack={onBack}
        title={
          <>
            Ripasso <span className="text-muted font-normal tabular-nums">· {currentIndex + 1} di {sessionQueue.length}</span>
          </>
        }
        line={currentCard.pgnPath}
      >
        <div className="h-1.5 bg-bg rounded-full overflow-hidden">
          <div className="h-full bg-accent transition-all" style={{ width: `${progressPct}%` }} />
        </div>
        {hasPunishCards && (
          <label className="inline-flex items-center gap-2 text-sm text-muted cursor-pointer min-h-[32px] px-1">
            <input
              type="checkbox"
              checked={includePunish}
              onChange={(e) => setIncludePunish(e.target.checked)}
              className="accent-[rgb(var(--accent))] w-4 h-4"
            />
            Includi esercizi &lsquo;punisci l&rsquo;errore&rsquo;
          </label>
        )}
      </ModeHeader>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Chessboard + EvalBar */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full max-w-[560px] lg:max-w-[620px] flex flex-col lg:flex-row items-stretch gap-3">
            <EvalBar
              evalForPlayer={activeEvalForPlayer}
              deltaForPlayer={activeEvalDelta}
              playerColor={opening.playerColor}
            />
            <div className="order-1 lg:order-2 flex-1 aspect-square rounded-[10px] overflow-hidden border border-border bg-surface">
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
                          'rgba(46, 94, 78, 0.9)',
                        ],
                      ]
                    : []
                }
                customNotationStyle={{ fontSize: '11px', fontWeight: 500, color: '#4A3F33' }}
                customDarkSquareStyle={{ backgroundColor: '#b0957a' }}
                customLightSquareStyle={{ backgroundColor: '#eee6d3' }}
              />
            </div>
          </div>
        </div>

        {/* MoveTrainer Prompt & Evaluation Panel */}
        <div className="lg:col-span-5">
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3">
              <span className="text-[15px] font-semibold">
                {currentCard.cardType === 'punish'
                  ? `Punisci l'errore (${opening.buildConfig.ratingBandLabel})`
                  : 'Tocca a te: trova la mossa'}
              </span>
              {wrongAttempts > 0 && (
                <span className="text-sm text-danger tabular-nums shrink-0">
                  Errori: {wrongAttempts}
                </span>
              )}
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-2">
                {lastOpponentMove && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[10px] bg-bg border border-border text-[13px] text-text">
                    <span>
                      Ultima mossa dell'avversario:{' '}
                      <strong className="text-text">
                        {formatMoveLabel(lastOpponentMove.moveNumber, lastOpponentMove.color, lastOpponentMove.san)}
                      </strong>
                    </span>
                  </div>
                )}
                <h2 className="text-lg font-semibold text-text leading-snug">
                  {currentCard.cardType === 'punish' && currentCard.mistakeContext
                    ? `L'avversario ha giocato ${currentCard.mistakeContext.opponentMistakeSan}? (${currentCard.mistakeContext.evalLoss.toFixed(2)} pedoni persi). Gioca la confutazione.`
                    : 'Esegui la mossa del tuo repertorio sulla scacchiera.'}
                </h2>
                <p className="text-sm text-muted">
                  Tocca un pezzo per vedere le mosse legali o trascinalo sulla casa di destinazione.
                </p>
              </div>

              {/* Wrong Move Feedback */}
              {feedback.type === 'wrong' && (
                <div className="bg-danger/20 border border-danger text-danger rounded-[10px] px-4 py-3 text-sm font-semibold">
                  {wrongLesson ? 'Non è la mossa del repertorio.' : feedback.message}
                </div>
              )}
              {feedback.type === 'wrong' && wrongLesson && (
                <div className="bg-bg border border-border rounded-[10px] p-4 space-y-2 text-[15px] leading-relaxed">
                  <div className="text-[13px] font-semibold text-muted">{wrongLesson.title}</div>
                  <p><RichText text={wrongLesson.text} /></p>
                  {wrongLesson.principle && (
                    <p className="text-sm text-muted">
                      Principio: se l&rsquo;avversario <RichText text={wrongLesson.principle.ifOpponent} /> — tu <RichText text={wrongLesson.principle.thenI} />
                    </p>
                  )}
                </div>
              )}

              {/* Hint Button (before solving) */}
              {feedback.type !== 'solved' && (
                <div className="pt-3 border-t border-border flex flex-wrap items-center">
                  <button
                    onClick={handleUseHint}
                    disabled={usedHint}
                    className="btn-secondary"
                  >
                    {usedHint ? `Muovi il pezzo da ${currentCard.correctFrom.toUpperCase()}` : 'Suggerimento'}
                  </button>
                  <span className="text-[13px] text-muted ml-3">conta come errore nel ripasso</span>
                </div>
              )}

              {/* Solved Feedback + Stats + buttons */}
              {feedback.type === 'solved' && (
                <div className="space-y-5 pt-3 border-t border-border">
                  <div className="bg-accent/10 border border-accent text-accent rounded-[10px] px-4 py-3 text-base font-semibold">
                    {feedback.message}
                  </div>

                  {/* Stats Table for Repertoire Card */}
                  {currentCard.cardType === 'repertoire' && currentNode?.playerMove && (
                    <div className="border border-border rounded-[10px] divide-y divide-border text-sm bg-bg">
                      <div className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="text-muted">Database Masters GM</span>
                        <span className="font-semibold text-text tabular-nums">
                          {currentNode.playerMove.gmStats.totalGames.toLocaleString('it-IT')}{' '}
                          partite
                          {currentNode.playerMove.gmStats.totalGames > 0 &&
                            ` (Bianco ${currentNode.playerMove.gmStats.whitePct}% · Patta ${currentNode.playerMove.gmStats.drawPct}% · Nero ${currentNode.playerMove.gmStats.blackPct}%)`}
                        </span>
                      </div>

                      <div className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="text-muted">
                          Fascia {opening.buildConfig.ratingBandLabel}
                        </span>
                        <span className="font-semibold text-text tabular-nums">
                          {(currentNode.playerMove.bandStats?.totalGames || 0).toLocaleString(
                            'it-IT'
                          )}{' '}
                          partite
                          {currentNode.playerMove.bandStats &&
                            currentNode.playerMove.bandStats.totalGames > 0 &&
                            ` (Bianco ${currentNode.playerMove.bandStats.whitePct}% · Patta ${currentNode.playerMove.bandStats.drawPct}% · Nero ${currentNode.playerMove.bandStats.blackPct}%)`}
                        </span>
                      </div>

                      <div className="px-4 py-2.5 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-muted">
                            Stockfish
                          </span>
                          <span className="font-semibold text-text tabular-nums">
                            {currentNode.playerMove.san}:{' '}
                            {currentNode.playerMove.engine.evalFromPlayerPerspective >= 0
                              ? '+'
                              : ''}
                            {currentNode.playerMove.engine.evalFromPlayerPerspective.toFixed(2)}
                            {currentNode.playerMove.engine.bestMoveSan !==
                              currentNode.playerMove.san &&
                              ` (prima scelta: ${currentNode.playerMove.engine.bestMoveSan} ${
                                -currentNode.playerMove.engine.bestEvalPawns >= 0 ? '+' : ''
                              }${(-currentNode.playerMove.engine.bestEvalPawns).toFixed(2)})`}
                          </span>
                        </div>
                        <div className="text-[13px] text-muted truncate">
                          Linea: {formatLine(currentNode.moveNumber, currentNode.turn, currentNode.playerMove.engine.pvSan)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Punish details */}
                  {currentCard.cardType === 'punish' && currentCard.mistakeContext && (
                    <div className="bg-bg border border-border rounded-[10px] p-4 space-y-1.5 text-sm">
                      <div className="font-semibold text-text">
                        Errore dell'avversario ({opening.buildConfig.ratingBandLabel}):{' '}
                        <span className="">
                          {currentCard.mistakeContext.opponentMistakeSan}?
                        </span>{' '}
                        ({currentCard.mistakeContext.evalLoss.toFixed(2)} pedoni persi •{' '}
                        {currentCard.mistakeContext.severity} • Freq:{' '}
                        {currentCard.mistakeContext.frequencyPct}%)
                      </div>
                      <div className="text-muted">
                        Punizione:{' '}
                        <strong className="text-accent ">
                          {currentCard.correctMoveSan}
                        </strong>{' '}
                        · linea:{' '}
                        <span className="">{currentCard.mistakeContext.pvSan.join(' ')}</span>
                        {typeof currentCard.mistakeContext.finalEvalForPlayer === 'number' && (
                          <span>
                            {' '}
                            • Valutazione per te:{' '}
                            {currentCard.mistakeContext.finalEvalForPlayer >= 0 ? '+' : ''}
                            {currentCard.mistakeContext.finalEvalForPlayer.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Grade buttons */}
                  <div className="pt-1">
                    {isForcedAgain ? (
                      <div>
                      <button
                        onClick={() => handleAdvance(false)}
                        className="btn-primary w-full"
                      >
                        Avanti
                      </button>
                      <p className="text-[13px] text-muted mt-2">Questa posizione tornerà presto nel ripasso.</p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleAdvance(false)}
                          className="btn-primary flex-1"
                        >
                          Continua
                        </button>
                        <button
                          onClick={() => handleAdvance(true)}
                          className="btn-secondary"
                        >
                          Era facile
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
