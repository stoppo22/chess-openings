import React, { useRef, useState } from 'react';
import type { OpeningRepertoireFile, ReviewLogEntry, StoredFSRSCard } from '../types/repertoire';
import { computeCardStats, SRS_DAILY_LIMITS } from '../services/srs';
import { buildDailySession, type SessionItem } from '../services/dailySession';
import { loadPriority } from '../services/gamesStore';
import type { LoadedLessons } from '../data/lessons';
import { MyGames } from './MyGames';

interface DashboardProps {
  opening: OpeningRepertoireFile;
  openings: Array<{ id: string; name: string }>;
  onSelectOpening: (id: string) => void;
  cards: StoredFSRSCard[];
  logs: ReviewLogEntry[];
  isPersisted: boolean;
  onStartLearn: (variationId?: string) => void;
  onStartDrill: (variationId?: string) => void;
  onStartReview: (variationId?: string) => void;
  onStartDaily: (session: SessionItem[]) => void;
  onOpenConcept: (variationId: string) => void;
  lessonData: LoadedLessons;
  onExportBackup: () => Promise<void>;
  onImportBackup: (fileText: string) => Promise<void>;
}

/** ["e4","c6","d4"] -> "1.e4 c6 2.d4" */
const formatLine = (moves: string[]) =>
  moves.map((m, i) => (i % 2 === 0 ? `${i / 2 + 1}.${m}` : m)).join(' ');

export const Dashboard: React.FC<DashboardProps> = ({
  opening,
  openings,
  onSelectOpening,
  cards,
  logs,
  isPersisted,
  onStartLearn,
  onStartDrill,
  onStartReview,
  onStartDaily,
  onOpenConcept,
  lessonData,
  onExportBackup,
  onImportBackup,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);

  const repStats = computeCardStats(cards, 'repertoire');
  const punishStats = computeCardStats(cards, 'punish');
  const [priority, setPriority] = useState(() => loadPriority(opening.id));
  const dailySession = buildDailySession(cards, logs, opening, new Date(), {
    lessons: lessonData.lessons,
    priorityCardIds: priority.ids,
    prioritySince: priority.since,
  });

  const studiedPct =
    repStats.total > 0
      ? Math.round(((repStats.total - repStats.newCount) / repStats.total) * 100)
      : 0;

  const learned = repStats.total - repStats.newCount;

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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="text-[26px] sm:text-3xl leading-tight">{opening.name}</h1>
          <span className="inline-flex items-center gap-1.5 text-[13px] text-muted">
            <i
              className={`w-3 h-3 rounded-full border border-muted ${
                opening.playerColor === 'white' ? 'bg-transparent' : 'bg-muted'
              }`}
            />
            {opening.playerColor === 'white' ? 'Col Bianco' : 'Col Nero'}
          </span>
        </div>
        {openings.length > 1 && (
          <select
            aria-label="Scegli apertura"
            value={opening.id}
            onChange={(e) => onSelectOpening(e.target.value)}
            className="w-full sm:w-auto min-h-[44px] px-3 rounded-[10px] bg-surface border border-border text-text text-base"
          >
            {openings.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        )}
        <p className="text-[15px] text-muted">
          Mosse scelte da Stockfish e dalle partite dei Grandi Maestri; risposte e errori tipici
          dei giocatori {opening.buildConfig.ratingBandLabel}.
        </p>
      </header>

      <section className="bg-surface border border-border rounded-xl p-4 sm:p-6 space-y-4">
        <button
          onClick={() => onStartDaily(dailySession)}
          disabled={dailySession.length === 0}
          className="btn-primary w-full"
        >
          {dailySession.length === 0 ? 'Niente da ripassare oggi' : `Ripassa oggi · ${dailySession.length}`}
        </button>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button onClick={() => onStartLearn()} className="btn-secondary">
            Impara nuove mosse
          </button>
          <button onClick={() => onStartDrill()} className="btn-secondary">
            Partita di allenamento
          </button>
        </div>
        <div className="space-y-2 pt-2">
          <p className="text-sm">
            {learned} di {repStats.total} mosse imparate · {punishStats.total} esercizi
            &lsquo;punisci l&rsquo;errore&rsquo; · {SRS_DAILY_LIMITS.MAX_NEW_CARDS_PER_DAY} nuove al
            giorno
          </p>
          <div
            className="h-1.5 bg-bg rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={studiedPct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full bg-accent transition-all" style={{ width: `${studiedPct}%` }} />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl">Varianti ({opening.variations.length})</h2>
        <ul className="bg-surface border border-border rounded-xl divide-y divide-border overflow-hidden">
          {opening.variations.map((v) => {
            const varCards = cards.filter(
              (c) => c.variationId === v.id && c.cardType === 'repertoire'
            );
            const varStats = computeCardStats(varCards);
            const varPct =
              varStats.total > 0
                ? Math.round(((varStats.total - varStats.newCount) / varStats.total) * 100)
                : 0;
            const open = expandedId === v.id;
            return (
              <li key={v.id}>
                <button
                  onClick={() => setExpandedId(open ? null : v.id)}
                  aria-expanded={open}
                  className="w-full text-left px-4 py-3 min-h-[44px] space-y-1.5 hover:bg-bg transition"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-semibold">{v.name}</span>
                    <span className="text-[13px] text-muted shrink-0">{v.ecoCode}</span>
                  </div>
                  <div className="text-[13px] text-muted break-words">
                    {formatLine(v.rootMovesSan)}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1 bg-bg rounded-full overflow-hidden">
                      <div className="h-full bg-accent" style={{ width: `${varPct}%` }} />
                    </div>
                    {varStats.dueReviewCount > 0 && (
                      <span className="text-[13px] text-warn shrink-0">
                        {varStats.dueReviewCount} da ripassare
                      </span>
                    )}
                  </div>
                </button>
                {open && (
                  <div className="px-4 pb-4 space-y-2">
                    {lessonData.concepts[v.id] && (
                      <button onClick={() => onOpenConcept(v.id)} className="btn-secondary w-full">
                        Capisci la variante
                      </button>
                    )}
                    <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => onStartLearn(v.id)} className="btn-secondary !px-2">
                      Studia
                    </button>
                    <button onClick={() => onStartReview(v.id)} className="btn-secondary !px-2">
                      Ripassa
                    </button>
                    <button onClick={() => onStartDrill(v.id)} className="btn-secondary !px-2">
                      Gioca
                    </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <MyGames key={opening.id} opening={opening} onPriorityChange={setPriority} />

      <details className="bg-surface border border-border rounded-xl group">
        <summary className="px-4 py-3 min-h-[44px] flex items-center cursor-pointer text-[15px] font-medium list-none">
          Salva o ripristina i progressi
        </summary>
        <div className="px-4 pb-4 space-y-3">
          <p className="text-sm text-muted">
            I progressi restano su questo dispositivo
            {isPersisted ? '' : ' e il browser potrebbe cancellarli'}. Salva un file per tenerne una
            copia o per spostarli altrove.
          </p>
          {backupMessage && <p className="text-sm font-medium text-accent">{backupMessage}</p>}
          <div className="flex flex-wrap gap-3">
            <button onClick={onExportBackup} className="btn-secondary">
              Salva i progressi
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="btn-secondary">
              Ripristina da file
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
      </details>
    </div>
  );
};
