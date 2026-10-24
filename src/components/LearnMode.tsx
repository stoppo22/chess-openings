import React, { useMemo, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  AlertTriangle,
  Users,
  Cpu,
  Award,
  Zap,
  Play,
} from 'lucide-react';
import { Chess } from 'chess.js';
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
        // Costruisci la lista dei normalizedFen lungo il tronco della variante
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
  const [showInaccuracies, setShowInaccuracies] = useState<boolean>(false);
  const [activeMistakePreview, setActiveMistakePreview] = useState<{
    mistake: CommonMistake;
    pvStep: number;
  } | null>(null);

  const currentNormFen = historyFens[historyFens.length - 1] || opening.rootNormalizedFen;
  const currentNode = opening.positions[currentNormFen];

  // Se l'utente sta esplorando la PV di un errore comune (Checkpoint B)
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
          ? ([[mistake.punishFrom, mistake.punishTo, '#ef4444']] as Array<[string, string, string?]>)
          : ([] as Array<[string, string, string?]>),
    };
  }, [activeMistakePreview, currentNode]);

  if (!currentNode) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <button onClick={onBack} className="text-sm text-amber-400 hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Torna alla Dashboard
        </button>
        <p className="mt-4 text-slate-300">Posizione fine linea raggiunta.</p>
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
      const baseArrow: [any, any, string?] = [pm.from, pm.to, '#22c55e'];
      const extra = (pm.arrows || []) as Array<[any, any, string?]>;
      return [baseArrow, ...extra];
    }
    return [];
  }, [currentNode, previewBoardState]);

  const navigateToFen = (nextNormFen: string) => {
    setActiveMistakePreview(null);
    if (opening.positions[nextNormFen]) {
      setHistoryFens((prev) => [...prev, nextNormFen]);
    }
  };

  const handleStepBack = () => {
    setActiveMistakePreview(null);
    if (historyFens.length > 1) {
      setHistoryFens((prev) => prev.slice(0, -1));
    }
  };

  const handleResetToRoot = (variationId?: string) => {
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

  const visibleCommonMistakes = useMemo(() => {
    const all = currentNode.commonMistakes || [];
    return all.filter((m) => showInaccuracies || m.severity === 'mistake' || m.severity === 'blunder');
  }, [currentNode.commonMistakes, showInaccuracies]);

  const hasHiddenInaccuracies = useMemo(() => {
    const all = currentNode.commonMistakes || [];
    return all.some((m) => m.severity === 'inaccuracy');
  }, [currentNode.commonMistakes]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 space-y-4">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </button>
          <div>
            <div className="text-xs text-amber-400 font-semibold">{currentNode.variationName}</div>
            <div className="text-xs font-mono text-slate-300 truncate max-w-xs sm:max-w-md">
              {currentNode.pgnPath || '1. e4'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {opening.variations.map((v) => (
            <button
              key={v.id}
              onClick={() => handleResetToRoot(v.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                currentNode.variationId === v.id
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {v.id === 'advance-bf5' ? 'Spinta 3...Bf5' : 'Classica 4...Bf5'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Board + Info Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Chessboard Column */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <div className="w-full max-w-[440px] aspect-square rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-800 bg-slate-900">
            <Chessboard
              id="learn-board"
              position={displayFen}
              boardOrientation={opening.playerColor}
              arePiecesDraggable={false}
              customArrows={customArrows}
              customDarkSquareStyle={{ backgroundColor: '#334155' }}
              customLightSquareStyle={{ backgroundColor: '#cbd5e1' }}
            />
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between w-full max-w-[440px] mt-3 gap-2">
            <button
              onClick={() => handleResetToRoot()}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-800"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Inizio (1.e4)
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleStepBack}
                disabled={historyFens.length <= 1}
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-xs font-semibold text-white border border-slate-800"
              >
                <ChevronLeft className="w-4 h-4" />
                Indietro
              </button>

              {currentNode.isPlayerTurn && currentNode.playerMove && (
                <button
                  onClick={() => navigateToFen(currentNode.playerMove!.nextNormalizedFen)}
                  disabled={!opening.positions[currentNode.playerMove.nextNormalizedFen]}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-xs font-bold text-slate-950 shadow"
                >
                  Gioca {currentNode.playerMove.san}
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Details & Branches Column */}
        <div className="lg:col-span-6 space-y-4">
          {/* Turn Banner */}
          <div
            className={`rounded-2xl p-4 border ${
              currentNode.isPlayerTurn
                ? 'bg-emerald-950/30 border-emerald-500/30'
                : 'bg-sky-950/30 border-sky-500/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Mossa {currentNode.moveNumber} •{' '}
                {currentNode.isPlayerTurn ? 'Tocca a TE (Nero)' : `Tocca all'Avversario (Bianco — Fascia ${opening.buildConfig.ratingBandLabel})`}
              </span>
              {currentNode.ecoCode && (
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700">
                  {currentNode.ecoCode}
                </span>
              )}
            </div>

            {/* Quando tocca a ME: mostra l'UNICA mossa del repertorio + statistiche GM + valutazione Stockfish */}
            {currentNode.isPlayerTurn && currentNode.playerMove && (
              <div className="mt-3 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-emerald-500/30 rounded-xl p-3.5">
                  <div>
                    <div className="text-xs text-slate-400">La tua mossa scelta nel repertorio:</div>
                    <div className="flex flex-wrap items-baseline gap-2.5 mt-0.5">
                      <span className="text-2xl font-extrabold text-emerald-400">
                        {currentNode.moveNumber}... {currentNode.playerMove.san}
                      </span>
                      <span className="text-xs font-mono font-semibold text-emerald-300">
                        ({currentNode.playerMove.engine.evalFromPlayerPerspective >= 0 ? '+' : ''}
                        {currentNode.playerMove.engine.evalFromPlayerPerspective.toFixed(2)})
                      </span>
                      {currentNode.playerMove.engine.bestMoveSan !== currentNode.playerMove.san && (
                        <span className="text-xs px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-300 border border-sky-500/30 font-medium">
                          1ª scelta Stockfish:{' '}
                          <strong className="font-bold text-white">
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
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold text-xs transition"
                  >
                    Prosegui →
                  </button>
                </div>

                {/* Statistiche GM, Statistiche Fascia 0-1400 & Valutazione Stockfish */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                    <div className="text-[11px] font-semibold text-amber-300 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5" />
                      Statistiche GM (Masters)
                    </div>
                    <div className="text-sm font-bold text-white mt-1">
                      {currentNode.playerMove.gmStats.totalGames.toLocaleString('it-IT')} partite GM
                    </div>
                    {currentNode.playerMove.gmStats.totalGames > 0 ? (
                      <>
                        <div className="w-full h-2 rounded-full overflow-hidden flex mt-2 bg-slate-800">
                          <div
                            style={{ width: `${currentNode.playerMove.gmStats.whitePct}%` }}
                            className="bg-slate-200"
                            title={`Bianco: ${currentNode.playerMove.gmStats.whitePct}%`}
                          />
                          <div
                            style={{ width: `${currentNode.playerMove.gmStats.drawPct}%` }}
                            className="bg-slate-500"
                            title={`Patta: ${currentNode.playerMove.gmStats.drawPct}%`}
                          />
                          <div
                            style={{ width: `${currentNode.playerMove.gmStats.blackPct}%` }}
                            className="bg-amber-500"
                            title={`Nero: ${currentNode.playerMove.gmStats.blackPct}%`}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                          <span>B: {currentNode.playerMove.gmStats.whitePct}%</span>
                          <span>P: {currentNode.playerMove.gmStats.drawPct}%</span>
                          <span className="text-amber-300 font-semibold">
                            N: {currentNode.playerMove.gmStats.blackPct}%
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="text-[11px] text-slate-400 mt-1">
                        Linea amatoriale (0 partite GM)
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                    <div className="text-[11px] font-semibold text-emerald-300 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      Fascia {opening.buildConfig.ratingBandLabel}
                    </div>
                    <div className="text-sm font-bold text-white mt-1">
                      {(currentNode.playerMove.bandStats?.totalGames || 0).toLocaleString('it-IT')} partite
                    </div>
                    {currentNode.playerMove.bandStats && currentNode.playerMove.bandStats.totalGames > 0 ? (
                      <>
                        <div className="w-full h-2 rounded-full overflow-hidden flex mt-2 bg-slate-800">
                          <div
                            style={{ width: `${currentNode.playerMove.bandStats.whitePct}%` }}
                            className="bg-slate-200"
                            title={`Bianco: ${currentNode.playerMove.bandStats.whitePct}%`}
                          />
                          <div
                            style={{ width: `${currentNode.playerMove.bandStats.drawPct}%` }}
                            className="bg-slate-500"
                            title={`Patta: ${currentNode.playerMove.bandStats.drawPct}%`}
                          />
                          <div
                            style={{ width: `${currentNode.playerMove.bandStats.blackPct}%` }}
                            className="bg-emerald-500"
                            title={`Nero: ${currentNode.playerMove.bandStats.blackPct}%`}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                          <span>B: {currentNode.playerMove.bandStats.whitePct}%</span>
                          <span>P: {currentNode.playerMove.bandStats.drawPct}%</span>
                          <span className="text-emerald-300 font-semibold">
                            N: {currentNode.playerMove.bandStats.blackPct}%
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="text-[11px] text-slate-400 mt-1">
                        Dati fascia non disponibili
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                    <div className="text-[11px] font-semibold text-sky-300 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5" />
                      Stockfish (depth {currentNode.playerMove.engine.depth})
                    </div>
                    <div className="text-sm font-bold text-white mt-1">
                      Tua ({currentNode.playerMove.san}):{' '}
                      <span className="text-emerald-400">
                        {currentNode.playerMove.engine.evalFromPlayerPerspective >= 0 ? '+' : ''}
                        {currentNode.playerMove.engine.evalFromPlayerPerspective.toFixed(2)}
                      </span>
                    </div>
                    {currentNode.playerMove.engine.bestMoveSan !== currentNode.playerMove.san ? (
                      <div className="text-[11px] text-sky-300 mt-0.5">
                        1ª scelta: <strong>{currentNode.playerMove.engine.bestMoveSan}</strong> (
                        {-currentNode.playerMove.engine.bestEvalPawns >= 0 ? '+' : ''}
                        {(-currentNode.playerMove.engine.bestEvalPawns).toFixed(2)}, loss{' '}
                        {currentNode.playerMove.engine.evalLossVsBest.toFixed(2)})
                      </div>
                    ) : (
                      <div className="text-[11px] text-emerald-400/80 mt-0.5">
                        Coincide con la 1ª scelta del motore
                      </div>
                    )}
                    <div className="text-[11px] font-mono text-slate-400 mt-1 truncate">
                      PV: {currentNode.playerMove.engine.pvSan.join(' ')}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quando tocca all'AVVERSARIO: mostra TUTTE le risposte avversarie sopra soglia nella fascia 0-1400 */}
            {!currentNode.isPlayerTurn && (
              <div className="mt-3 space-y-2.5">
                <div className="text-xs text-slate-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-sky-400" />
                  Risposte del Bianco nella fascia <strong>{opening.buildConfig.ratingBandLabel}</strong> (sopra soglia):
                </div>

                {currentNode.opponentMoves && currentNode.opponentMoves.length > 0 ? (
                  <div className="space-y-2">
                    {currentNode.opponentMoves.map((opp) => {
                      const canFollow = Boolean(opening.positions[opp.nextNormalizedFen]);
                      return (
                        <button
                          key={opp.san}
                          onClick={() => canFollow && navigateToFen(opp.nextNormalizedFen)}
                          disabled={!canFollow}
                          className="w-full text-left bg-slate-900/90 hover:bg-slate-800 disabled:opacity-50 border border-slate-800 rounded-xl p-3 transition flex items-center justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-base font-bold text-white">
                                {currentNode.moveNumber}. {opp.san}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-semibold">
                                {opp.frequencyPct}% delle partite
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {opp.bandStats.totalGames.toLocaleString('it-IT')} partite ({opening.buildConfig.ratingBandLabel}) • B:{' '}
                              {opp.bandStats.whitePct}% / P: {opp.bandStats.drawPct}% / N: {opp.bandStats.blackPct}%
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 bg-slate-900/70 rounded-xl p-3 border border-slate-800">
                    Fine della linea (profondità massima raggiunta per questa variante).
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Commento AI marcato esplicitamente come NON verificato (solo repertorio normale, mai sugli errori comuni) */}
          {!activeMistakePreview &&
            currentNode.isPlayerTurn &&
            (currentNode.aiCommentUnverified || currentNode.playerMove?.aiCommentUnverified) && (
              <div className="bg-amber-950/25 border border-amber-500/30 rounded-2xl p-3.5 space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[11px] font-bold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Commento AI, non verificato
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {currentNode.aiCommentUnverified || currentNode.playerMove?.aiCommentUnverified}
                </p>
              </div>
            )}

          {/* Pannello Errori Comuni dell'Avversario (0-1400) — Attivo nel Checkpoint B */}
          {!currentNode.isPlayerTurn &&
            currentNode.commonMistakes &&
            currentNode.commonMistakes.length > 0 && (
              <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-rose-300 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-rose-400" />
                    Errori comuni ({opening.buildConfig.ratingBandLabel})
                  </h3>
                  {hasHiddenInaccuracies && (
                    <label className="inline-flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showInaccuracies}
                        onChange={(e) => setShowInaccuracies(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-800 text-amber-500"
                      />
                      Mostra imprecisioni (0.4–1.0)
                    </label>
                  )}
                </div>

                {visibleCommonMistakes.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    Nessun errore grave (&ge; 1.0 pedoni) in questa posizione. Attiva &ldquo;Mostra imprecisioni&rdquo; per vedere le imprecisioni minori.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {visibleCommonMistakes.map((m) => {
                      const isSelected = activeMistakePreview?.mistake.opponentMoveSan === m.opponentMoveSan;
                      return (
                        <div
                          key={m.opponentMoveSan}
                          className={`rounded-xl p-3 border transition ${
                            isSelected
                              ? 'bg-rose-950/30 border-rose-500/50'
                              : 'bg-slate-950/80 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <span className="text-sm font-bold text-rose-300">
                                {currentNode.moveNumber}. {m.opponentMoveSan}?
                              </span>
                              <span className="ml-2 text-xs px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-semibold">
                                {m.evalLoss.toFixed(2)} pedoni persi ({m.severity})
                              </span>
                              <span className="ml-2 text-xs text-slate-400">
                                Freq: {m.frequencyPct}%
                              </span>
                            </div>
                            <button
                              onClick={() =>
                                setActiveMistakePreview(
                                  isSelected ? null : { mistake: m, pvStep: 0 }
                                )
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-semibold border border-rose-500/30"
                            >
                              <Play className="w-3 h-3" />
                              {isSelected ? 'Chiudi PV' : `Punisci con ${m.punishMoveSan}`}
                            </button>
                          </div>

                          <div className="text-xs text-slate-300 mt-1.5">
                            Punizione: <strong className="text-emerald-400">{m.punishMoveSan}</strong> • PV (d{m.depth}):{' '}
                            <span className="font-mono text-slate-400">{m.pvSan.join(' ')}</span> (Eval Nero:{' '}
                            {m.finalEvalForPlayer >= 0 ? '+' : ''}
                            {m.finalEvalForPlayer.toFixed(2)})
                          </div>

                          {isSelected && (
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800">
                              <button
                                onClick={() =>
                                  setActiveMistakePreview((prev) =>
                                    prev ? { ...prev, pvStep: Math.max(0, prev.pvStep - 1) } : null
                                  )
                                }
                                className="px-2.5 py-1 rounded bg-slate-800 text-xs text-white"
                              >
                                ◀ Mossa prec.
                              </button>
                              <span className="text-xs font-mono text-amber-300">
                                Step {activeMistakePreview.pvStep}/{m.pvSan.length}
                              </span>
                              <button
                                onClick={() =>
                                  setActiveMistakePreview((prev) =>
                                    prev
                                      ? { ...prev, pvStep: Math.min(m.pvSan.length, prev.pvStep + 1) }
                                      : null
                                  )
                                }
                                className="px-2.5 py-1 rounded bg-slate-800 text-xs text-white"
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
            )}
        </div>
      </div>
    </div>
  );
};
