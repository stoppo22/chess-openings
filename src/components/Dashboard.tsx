import React, { useRef, useState } from 'react';
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

  const studiedPct =
    repStats.total > 0
      ? Math.round(((repStats.total - repStats.newCount) / repStats.total) * 100)
      : 0;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      await onImportBackup(text);
      setBackupMessage('Backup importato correttamente.');
      setTimeout(() => setBackupMessage(null), 4000);
    } catch (err) {
      setBackupMessage(
        `Errore importazione: ${err instanceof Error ? err.message : 'File non valido'}`
      );
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Course Banner — Chessable / Chess.com style */}
      <div className="bg-[#262421] border border-[#3c3934] rounded-md p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2.5 text-sm text-[#9e9c99]">
              <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#161512] border border-[#3c3934] text-[#e8e6e3] font-medium">
                <span className="w-3 h-3 rounded-sm bg-[#161512] border border-[#9e9c99] inline-block" />
                Repertorio Nero
              </span>
              <span className="px-2.5 py-1 rounded bg-[#161512] border border-[#3c3934]">
                Fascia {opening.buildConfig.ratingBandLabel}
              </span>
              <span className="px-2.5 py-1 rounded bg-[#161512] border border-[#3c3934]">
                {isPersisted ? 'Storage persistente' : 'Storage locale'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-[#ffffff] tracking-tight">
              {opening.name}
            </h1>
            <p className="text-base text-[#9e9c99] max-w-3xl leading-relaxed">
              {opening.description}
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            <button
              onClick={() => onStartLearn()}
              className="flex-1 sm:flex-initial px-6 py-3 rounded-md bg-[#383633] hover:bg-[#45423e] text-[#e8e6e3] font-semibold text-base border border-[#4a4742] transition"
            >
              Impara linee
            </button>
            <button
              onClick={() => onStartReview()}
              className="flex-1 sm:flex-initial px-7 py-3 rounded-md bg-[#81b64c] hover:bg-[#95bb4a] text-[#ffffff] font-bold text-base shadow-[0_2px_0_0_#537a2b] transition"
            >
              Ripassa ({dailyQueue.length})
            </button>
          </div>
        </div>

        {/* Course Progress Bar */}
        <div className="mt-7 pt-6 border-t border-[#36332e]">
          <div className="flex items-center justify-between text-sm text-[#9e9c99] mb-2.5">
            <span>
              Avanzamento repertorio:{' '}
              <strong className="text-[#e8e6e3] tabular-nums">
                {repStats.total - repStats.newCount} / {repStats.total}
              </strong>{' '}
              mosse studiate ({studiedPct}%)
            </span>
            <span className="tabular-nums">
              Limite nuove: {SRS_DAILY_LIMITS.MAX_NEW_CARDS_PER_DAY}/giorno
            </span>
          </div>
          <div className="w-full h-2.5 bg-[#161512] rounded-sm overflow-hidden">
            <div
              className="h-full bg-[#81b64c] transition-all"
              style={{ width: `${studiedPct}%` }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-5">
            <div className="bg-[#1e1c1a] border border-[#33302c] rounded px-4 py-3.5">
              <div className="text-xs uppercase tracking-wider text-[#8c8a87]">Mosse totali</div>
              <div className="text-2xl font-bold text-[#e8e6e3] tabular-nums mt-1">
                {repStats.total}
              </div>
            </div>
            <div className="bg-[#1e1c1a] border border-[#33302c] rounded px-4 py-3.5">
              <div className="text-xs uppercase tracking-wider text-[#8c8a87]">Da ripassare</div>
              <div className="text-2xl font-bold text-[#e69d00] tabular-nums mt-1">
                {repStats.dueReviewCount}
              </div>
            </div>
            <div className="bg-[#1e1c1a] border border-[#33302c] rounded px-4 py-3.5">
              <div className="text-xs uppercase tracking-wider text-[#8c8a87]">Nuove</div>
              <div className="text-2xl font-bold text-[#e8e6e3] tabular-nums mt-1">
                {repStats.newCount}
              </div>
            </div>
            <div className="bg-[#1e1c1a] border border-[#33302c] rounded px-4 py-3.5">
              <div className="text-xs uppercase tracking-wider text-[#8c8a87]">Consolidate</div>
              <div className="text-2xl font-bold text-[#81b64c] tabular-nums mt-1">
                {repStats.reviewCount}
              </div>
            </div>
            <div className="bg-[#1e1c1a] border border-[#33302c] rounded px-4 py-3.5 col-span-2 sm:col-span-1">
              <div className="text-xs uppercase tracking-wider text-[#8c8a87]">
                Punisci errori
              </div>
              <div className="text-2xl font-bold text-[#e8e6e3] tabular-nums mt-1">
                {punishStats.total}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Capitoli / Varianti */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#9e9c99]">
            Capitoli del Repertorio ({opening.variations.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {opening.variations.map((v) => {
            const varCards = cards.filter(
              (c) => c.variationId === v.id && c.cardType === 'repertoire'
            );
            const varStats = computeCardStats(varCards);
            const varStudied = varStats.total - varStats.newCount;
            const varPct =
              varStats.total > 0 ? Math.round((varStudied / varStats.total) * 100) : 0;

            return (
              <div
                key={v.id}
                className="bg-[#262421] border border-[#3c3934] rounded-md p-6 flex flex-col justify-between gap-5"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-mono px-2.5 py-0.5 rounded bg-[#161512] text-[#bababa] border border-[#3c3934]">
                      {v.ecoCode}
                    </span>
                    <span className="text-[#9e9c99] tabular-nums">
                      {varStats.total} mosse •{' '}
                      <strong className="text-[#e8e6e3]">{varStats.dueReviewCount}</strong> in
                      scadenza
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-[#ffffff] mt-3">{v.name}</h3>
                  <p className="text-sm text-[#9e9c99] mt-1.5 leading-relaxed">{v.subtitle}</p>

                  <div className="mt-4 text-sm font-mono text-[#e8e6e3] bg-[#161512] px-3.5 py-2.5 rounded border border-[#33302c]">
                    {v.rootMovesSan.join(' ')}
                  </div>

                  <div className="mt-4">
                    <div className="w-full h-2 bg-[#161512] rounded-sm overflow-hidden">
                      <div
                        className="h-full bg-[#81b64c]"
                        style={{ width: `${varPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={() => onStartLearn(v.id)}
                    className="flex-1 px-4 py-2.5 rounded bg-[#383633] hover:bg-[#45423e] text-[#e8e6e3] text-sm font-semibold border border-[#4a4742] transition"
                  >
                    Studia linea
                  </button>
                  <button
                    onClick={() => onStartReview(v.id)}
                    className="flex-1 px-4 py-2.5 rounded bg-[#81b64c] hover:bg-[#95bb4a] text-[#ffffff] text-sm font-bold transition"
                  >
                    Ripassa capitolo
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dati & Backup Locale */}
      <div className="bg-[#262421] border border-[#3c3934] rounded-md px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#9e9c99]">
            Backup progressi FSRS
          </h2>
          <p className="text-sm text-[#8c8a87] mt-1">
            Esporta o ripristina i tuoi dati di ripasso in formato JSON.
          </p>
          {backupMessage && (
            <p className="text-sm mt-1.5 font-medium text-[#81b64c]">{backupMessage}</p>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onExportBackup}
            className="px-4 py-2.5 rounded bg-[#383633] hover:bg-[#45423e] text-[#e8e6e3] text-sm font-semibold border border-[#4a4742] transition"
          >
            Esporta JSON
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 rounded bg-[#383633] hover:bg-[#45423e] text-[#e8e6e3] text-sm font-semibold border border-[#4a4742] transition"
          >
            Importa JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>
    </div>
  );
};
