import React, { useRef, useState } from 'react';
import { BookOpen, Brain, Download, Upload, ShieldCheck, Layers, Sparkles } from 'lucide-react';
import type { OpeningRepertoireFile, ReviewLogEntry, StoredFSRSCard } from '../types/repertoire';
import { buildDailyReviewQueue, computeCardStats, SRS_DAILY_LIMITS } from '../services/srs';

interface DashboardProps {
  opening: OpeningRepertoireFile;
  cards: StoredFSRSCard[];
  logs: ReviewLogEntry[];
  isPersisted: boolean;
  onStartLearn: (variationId?: string) => void;
  onStartReview: (variationId?: string) => void;
  onExportBackup: () => Promise<void>;
  onImportBackup: (fileText: string) => Promise<void>;
}

export const Dashboard: React.FC<DashboardProps> = ({
  opening,
  cards,
  logs,
  isPersisted,
  onStartLearn,
  onStartReview,
  onExportBackup,
  onImportBackup,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);

  const repStats = computeCardStats(cards, 'repertoire');
  const punishStats = computeCardStats(cards, 'punish');
  const dailyQueue = buildDailyReviewQueue({
    cards,
    logs,
    openingId: opening.id,
    includePunish: true,
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      await onImportBackup(text);
      setBackupMessage('✅ Backup JSON importato con successo!');
      setTimeout(() => setBackupMessage(null), 4000);
    } catch (err) {
      setBackupMessage(`❌ Errore importazione: ${err instanceof Error ? err.message : 'File non valido'}`);
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Colore: Nero ♟️
              </span>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                Fascia avversari: {opening.buildConfig.ratingBandLabel}
              </span>
              <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                {isPersisted ? 'IndexedDB Persistente' : 'IndexedDB Locale'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mt-2">{opening.name}</h1>
            <p className="text-sm text-slate-400 mt-1">{opening.description}</p>
          </div>

          <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => onStartLearn()}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              Impara
            </button>
            <button
              onClick={() => onStartReview()}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition"
            >
              <Brain className="w-4 h-4" />
              Ripassa ({dailyQueue.length})
            </button>
          </div>
        </div>
      </div>

      {/* Statistiche Spaced Repetition (FSRS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              Progresso Repertorio (FSRS)
            </h2>
            <span className="text-xs text-slate-400">
              Max {SRS_DAILY_LIMITS.MAX_NEW_CARDS_PER_DAY} nuove/giorno
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5">
              <div className="text-lg font-bold text-white">{repStats.total}</div>
              <div className="text-[11px] text-slate-400">Totali</div>
            </div>
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5">
              <div className="text-lg font-bold text-amber-400">{repStats.dueReviewCount}</div>
              <div className="text-[11px] text-slate-400">In Scadenza</div>
            </div>
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5">
              <div className="text-lg font-bold text-sky-400">{repStats.newCount}</div>
              <div className="text-[11px] text-slate-400">Nuove</div>
            </div>
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5">
              <div className="text-lg font-bold text-emerald-400">{repStats.reviewCount}</div>
              <div className="text-[11px] text-slate-400">Consolidate</div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400" />
                Backup Locale (IndexedDB)
              </h2>
              {punishStats.total > 0 && (
                <span className="text-xs px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Card Punisci: {punishStats.total}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Tutti i tuoi progressi FSRS sono salvati localmente nel browser. Esporta o importa un file JSON per fare il backup.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={onExportBackup}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              Esporta Backup JSON
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              <Upload className="w-3.5 h-3.5 text-sky-400" />
              Importa Backup JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          {backupMessage && <p className="text-xs mt-2 font-medium text-amber-300">{backupMessage}</p>}
        </div>
      </div>

      {/* Elenco Varianti della Fetta Verticale */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-white">Varianti del Repertorio ({opening.variations.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {opening.variations.map((v) => {
            const varCards = cards.filter((c) => c.variationId === v.id && c.cardType === 'repertoire');
            const varStats = computeCardStats(varCards);
            return (
              <div
                key={v.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                      ECO {v.ecoCode}
                    </span>
                    <span className="text-xs text-slate-400">
                      {varStats.total} posizioni ({varStats.dueReviewCount} da ripassare)
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-2">{v.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{v.subtitle}</p>
                  <div className="mt-2 text-xs font-mono text-slate-300 bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
                    {v.rootMovesSan.join(' ')}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onStartLearn(v.id)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                    Studia Linea
                  </button>
                  <button
                    onClick={() => onStartReview(v.id)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold border border-amber-500/30 transition"
                  >
                    <Brain className="w-3.5 h-3.5" />
                    Ripassa Variante
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
