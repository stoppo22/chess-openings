import React, { useEffect, useMemo, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess, type Square } from 'chess.js';
import {
  ArrowLeft,
  Lightbulb,
  CheckCircle2,
  XCircle,
  Sparkles,
  Award,
  Cpu,
  AlertTriangle,
} from 'lucide-react';
import type { OpeningRepertoireFile, ReviewLogEntry, StoredFSRSCard } from '../types/repertoire';
import { buildDailyReviewQueue, gradeCard } from '../services/srs';

interface ReviewModeProps {
  opening: OpeningRepertoireFile;
  cards: StoredFSRSCard[];
  logs: ReviewLogEntry[];
  variationId?: string;
  onCardReviewed: (updatedCard: StoredFSRSCard, log: ReviewLogEntry) => Promise<void>;
  onBack: () => void;
}

export const ReviewMode: React.FC<ReviewModeProps> = ({
  opening,
  cards,
  logs,
  variationId,
  onCardReviewed,
  onBack,
}) => {
  const [includePunish, setIncludePunish] = useState<boolean>(true);
  const [sessionQueue, setSessionQueue] = useState<StoredFSRSCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Per-card interaction state
  const [boardFen, setBoardFen] = useState<string>('');
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [usedHint, setUsedHint] = useState<boolean>(false);
  const [wrongAttempts, setWrongAttempts] = useState<number>(0);
  const [feedback, setFeedback] = useState<{
    type: 'idle' | 'wrong' | 'solved';
    message?: string;
  }>({ type: 'idle' });

  const hasPunishCards = useMemo(() => cards.some((c) => c.cardType === 'punish'), [cards]);

  // Costruisci la coda all'inizio della sessione o quando cambia il filtro includePunish
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
  }, [opening.id, variationId, includePunish]);

  const currentCard = sessionQueue[currentIndex];
  const currentNode = currentCard ? opening.positions[currentCard.normalizedFen] : undefined;

  useEffect(() => {
    if (currentCard) {
      setBoardFen(currentCard.fullFen);
      setSelectedSquare(null);
      setUsedHint(false);
      setWrongAttempts(0);
      setFeedback({ type: 'idle' });
    }
  }, [currentCard]);

  if (sessionQueue.length === 0 || currentIndex >= sessionQueue.length) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <h2 className="text-2xl font-bold text-white">Sessione di ripasso completata!</h2>
        <p className="text-sm text-slate-400">
          Hai completato tutte le posizioni in scadenza per oggi (incluso il limite giornaliero di 10 nuove card).
        </p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Torna alla Dashboard
        </button>
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
      setFeedback({
        type: 'solved',
        message: `Esatto! La mossa del repertorio è ${currentCard.correctMoveSan}.`,
      });
      return true;
    } else {
      setWrongAttempts((prev) => prev + 1);
      setSelectedSquare(null);
      setFeedback({
        type: 'wrong',
        message: `${moveObj.san} non è la mossa del tuo repertorio in questa posizione. Riprova!`,
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
    setCurrentIndex((prev) => prev + 1);
  };

  const customSquareStyles: Record<string, React.CSSProperties> = {};
  if (selectedSquare) {
    customSquareStyles[selectedSquare] = {
      backgroundColor: 'rgba(245, 158, 11, 0.45)',
    };
  }
  if (usedHint && feedback.type !== 'solved') {
    customSquareStyles[currentCard.correctFrom] = {
      backgroundColor: 'rgba(56, 189, 248, 0.55)',
      boxShadow: 'inset 0 0 0 3px #38bdf8',
    };
  }

  const isForcedAgain = usedHint || wrongAttempts > 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 space-y-4">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Esci
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-400">
                Card {currentIndex + 1} di {sessionQueue.length}
              </span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded font-semibold ${
                  currentCard.cardType === 'punish'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {currentCard.cardType === 'punish' ? '⚡ Punisci Errore' : '♟️ Repertorio'}
              </span>
            </div>
            <div className="text-xs font-mono text-slate-300 truncate max-w-xs sm:max-w-md">
              {currentCard.pgnPath}
            </div>
          </div>
        </div>

        {hasPunishCards && (
          <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={includePunish}
              onChange={(e) => setIncludePunish(e.target.checked)}
              className="rounded border-slate-700 bg-slate-800 text-amber-500"
            />
            Includi card &ldquo;Punisci Errori&rdquo;
          </label>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Chessboard */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <div className="w-full max-w-[440px] aspect-square rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-800 bg-slate-900">
            <Chessboard
              id="review-board"
              position={boardFen}
              boardOrientation={opening.playerColor}
              arePiecesDraggable={feedback.type !== 'solved'}
              onPieceDrop={handlePieceDrop}
              onSquareClick={handleSquareClick}
              customSquareStyles={customSquareStyles}
              customArrows={
                feedback.type === 'solved'
                  ? [[currentCard.correctFrom as Square, currentCard.correctTo as Square, '#22c55e']]
                  : []
              }
              customDarkSquareStyle={{ backgroundColor: '#334155' }}
              customLightSquareStyle={{ backgroundColor: '#cbd5e1' }}
            />
          </div>
        </div>

        {/* Prompt & Feedback Panel */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                {currentCard.cardType === 'punish'
                  ? `Punisci l'errore avversario (${opening.buildConfig.ratingBandLabel})`
                  : 'Trova la tua mossa del repertorio'}
              </span>
              <h2 className="text-lg font-bold text-white mt-1">
                {currentCard.cardType === 'punish' && currentCard.mistakeContext
                  ? `L'avversario ha giocato ${currentCard.mistakeContext.opponentMistakeSan}? (-${currentCard.mistakeContext.evalLoss.toFixed(2)}). Come lo punisci?`
                  : 'Tocca al Nero: esegui la mossa corretta sulla scacchiera'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Trascina il pezzo o tocca prima la casa di partenza e poi quella di arrivo.
              </p>
            </div>

            {/* Feedback errore */}
            {feedback.type === 'wrong' && (
              <div className="flex items-center gap-2.5 bg-rose-950/40 border border-rose-500/40 text-rose-200 rounded-xl p-3 text-xs font-medium">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{feedback.message}</span>
              </div>
            )}

            {/* Pulsante Hint (prima della soluzione) */}
            {feedback.type !== 'solved' && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <button
                  onClick={handleUseHint}
                  disabled={usedHint}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs font-semibold text-sky-300 border border-slate-700 transition"
                >
                  <Lightbulb className="w-4 h-4 text-sky-400" />
                  {usedHint
                    ? `Suggerimento attivo: muovi da ${currentCard.correctFrom.toUpperCase()}`
                    : 'Usa Suggerimento (conta come Again)'}
                </button>
                {wrongAttempts > 0 && (
                  <span className="text-xs text-rose-400 font-semibold">
                    Tentativi errati: {wrongAttempts}
                  </span>
                )}
              </div>
            )}

            {/* Soluzione trovata: mostra statistiche GM + Stockfish e pulsanti avanzamento FSRS */}
            {feedback.type === 'solved' && (
              <div className="space-y-4 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2.5 bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 rounded-xl p-3 text-sm font-bold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>{feedback.message}</span>
                </div>

                {/* Statistiche GM, Fascia 0-1400 e Stockfish se è una card repertorio */}
                {currentNode?.playerMove && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                      <div className="text-[11px] font-semibold text-amber-300 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" />
                        Database Masters GM
                      </div>
                      <div className="text-xs font-bold text-white mt-1">
                        {currentNode.playerMove.gmStats.totalGames.toLocaleString('it-IT')} partite GM
                      </div>
                      {currentNode.playerMove.gmStats.totalGames > 0 && (
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          B: {currentNode.playerMove.gmStats.whitePct}% • P:{' '}
                          {currentNode.playerMove.gmStats.drawPct}% • N:{' '}
                          {currentNode.playerMove.gmStats.blackPct}%
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                      <div className="text-[11px] font-semibold text-emerald-300 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" />
                        Fascia {opening.buildConfig.ratingBandLabel}
                      </div>
                      <div className="text-xs font-bold text-white mt-1">
                        {(currentNode.playerMove.bandStats?.totalGames || 0).toLocaleString('it-IT')} partite
                      </div>
                      {currentNode.playerMove.bandStats && currentNode.playerMove.bandStats.totalGames > 0 && (
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          B: {currentNode.playerMove.bandStats.whitePct}% • P:{' '}
                          {currentNode.playerMove.bandStats.drawPct}% • N:{' '}
                          <strong className="text-emerald-300">{currentNode.playerMove.bandStats.blackPct}%</strong>
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                      <div className="text-[11px] font-semibold text-sky-300 flex items-center gap-1">
                        <Cpu className="w-3.5 h-3.5" />
                        Stockfish (d{currentNode.playerMove.engine.depth})
                      </div>
                      <div className="text-xs font-bold text-white mt-1">
                        Tua ({currentNode.playerMove.san}):{' '}
                        <span className="text-emerald-400">
                          {currentNode.playerMove.engine.evalFromPlayerPerspective >= 0 ? '+' : ''}
                          {currentNode.playerMove.engine.evalFromPlayerPerspective.toFixed(2)}
                        </span>
                      </div>
                      {currentNode.playerMove.engine.bestMoveSan !== currentNode.playerMove.san && (
                        <div className="text-[11px] text-sky-300 mt-0.5">
                          1ª scelta: <strong>{currentNode.playerMove.engine.bestMoveSan}</strong> (
                          {-currentNode.playerMove.engine.bestEvalPawns >= 0 ? '+' : ''}
                          {(-currentNode.playerMove.engine.bestEvalPawns).toFixed(2)})
                        </div>
                      )}
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5 truncate">
                        PV: {currentNode.playerMove.engine.pvSan.join(' ')}
                      </div>
                    </div>
                  </div>
                )}

                {currentCard.cardType === 'punish' && currentCard.mistakeContext && (
                  <div className="bg-slate-950/80 border border-rose-500/30 rounded-xl p-3 space-y-1">
                    <div className="text-xs font-semibold text-rose-300">
                      Errore avversario ({opening.buildConfig.ratingBandLabel}): {currentCard.mistakeContext.opponentMistakeSan}? (-{currentCard.mistakeContext.evalLoss.toFixed(2)} pedoni • {currentCard.mistakeContext.severity} • Freq: {currentCard.mistakeContext.frequencyPct}%)
                    </div>
                    <div className="text-xs text-slate-300">
                      Punizione: <strong className="text-emerald-400">{currentCard.correctMoveSan}</strong> • PV (d20):{' '}
                      <span className="font-mono text-slate-400">{currentCard.mistakeContext.pvSan.join(' ')}</span>
                    </div>
                  </div>
                )}

                {(currentNode?.aiCommentUnverified || currentNode?.playerMove?.aiCommentUnverified) && (
                  <div className="bg-amber-950/25 border border-amber-500/30 rounded-xl p-3 space-y-1">
                    <div className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300">
                      <AlertTriangle className="w-3 h-3" />
                      Commento AI, non verificato
                    </div>
                    <p className="text-xs text-slate-200">
                      {currentNode.aiCommentUnverified || currentNode.playerMove?.aiCommentUnverified}
                    </p>
                  </div>
                )}

                {/* Pulsanti di schedulazione FSRS */}
                <div className="pt-2">
                  {isForcedAgain ? (
                    <button
                      onClick={() => handleAdvance(false)}
                      className="w-full py-2.5 px-4 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-sm transition"
                    >
                      Prossima Card (Valutata Again per errore/hint) →
                    </button>
                  ) : (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleAdvance(false)}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition"
                      >
                        Continua (Good) →
                      </button>
                      <button
                        onClick={() => handleAdvance(true)}
                        className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-sm border border-emerald-500/40 transition"
                      >
                        <Sparkles className="w-4 h-4" />
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
  );
};
