import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import type { OpeningRepertoireFile, ReviewLogEntry, StoredFSRSCard } from './types/repertoire';
import {
  exportBackupJson,
  getAllCards,
  getAllLogs,
  importBackupJson,
  requestPersistentStorage,
  saveCardAndLog,
  saveCards,
} from './services/storage';
import { syncOpeningCards } from './services/srs';
import { applySwUpdateReload, isSwUpdateReady, subscribeSwUpdate } from './services/swUpdate';
import { Dashboard } from './components/Dashboard';
import { LearnMode } from './components/LearnMode';
import { ReviewMode } from './components/ReviewMode';

type ActiveView =
  | { mode: 'dashboard' }
  | { mode: 'learn'; variationId?: string }
  | { mode: 'review'; variationId?: string };

export const App: React.FC = () => {
  const [openingData, setOpeningData] = useState<OpeningRepertoireFile | null>(null);
  const [cards, setCards] = useState<StoredFSRSCard[]>([]);
  const [logs, setLogs] = useState<ReviewLogEntry[]>([]);
  const [isPersisted, setIsPersisted] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<ActiveView>({ mode: 'dashboard' });
  const [reviewFinished, setReviewFinished] = useState<boolean>(false);
  const [swUpdateReady, setSwUpdateReady] = useState<boolean>(() => isSwUpdateReady());
  const [error, setError] = useState<string | null>(null);

  const isSessionActive =
    activeView.mode === 'learn' || (activeView.mode === 'review' && !reviewFinished);

  useEffect(() => {
    return subscribeSwUpdate(() => {
      setSwUpdateReady(true);
    });
  }, []);

  useEffect(() => {
    if (swUpdateReady && !isSessionActive) {
      applySwUpdateReload();
    }
  }, [swUpdateReady, isSessionActive]);

  useEffect(() => {
    let mounted = true;
    async function initApp() {
      try {
        const persisted = await requestPersistentStorage();
        if (mounted) setIsPersisted(persisted);

        const mod = await import('./data/openings/caro-kann.json');
        const opening = (mod.default || mod) as unknown as OpeningRepertoireFile;

        const [storedCards, storedLogs] = await Promise.all([getAllCards(), getAllLogs()]);
        const syncedCards = syncOpeningCards(opening, storedCards);
        await saveCards(syncedCards);
        const validIds = new Set(syncedCards.map((c) => c.id));
        const validLogs = storedLogs.filter((l) => validIds.has(l.cardId));

        if (mounted) {
          setOpeningData(opening);
          setCards(syncedCards);
          setLogs(validLogs);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Errore caricamento dati apertura.');
        }
      }
    }
    initApp();
    return () => {
      mounted = false;
    };
  }, []);

  const handleCardReviewed = async (updatedCard: StoredFSRSCard, log: ReviewLogEntry) => {
    await saveCardAndLog(updatedCard, log);
    setCards((prev) => prev.map((c) => (c.id === updatedCard.id ? updatedCard : c)));
    setLogs((prev) => [...prev, log]);
  };

  const handleExportBackup = async () => {
    const jsonText = await exportBackupJson();
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chess-openings-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = async (fileText: string) => {
    await importBackupJson(fileText);
    if (!openingData) return;
    const [storedCards, storedLogs] = await Promise.all([getAllCards(), getAllLogs()]);
    const synced = syncOpeningCards(openingData, storedCards);
    await saveCards(synced);
    const validIds = new Set(synced.map((c) => c.id));
    setCards(synced);
    setLogs(storedLogs.filter((l) => validIds.has(l.cardId)));
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md bg-slate-900 border border-rose-500/40 rounded-2xl p-6 space-y-2">
          <h1 className="text-lg font-bold text-rose-400">Errore caricamento repertorio</h1>
          <p className="text-xs text-slate-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!openingData) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-sm text-slate-400 animate-pulse">Caricamento repertorio Caro-Kann...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-10">
      {swUpdateReady && isSessionActive && (
        <div className="max-w-5xl mx-auto px-4 pt-3">
          <button
            type="button"
            onClick={applySwUpdateReload}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition shadow-lg"
          >
            <RefreshCw className="w-3.5 h-3.5 shrink-0" />
            <span>Aggiornamento disponibile, tocca per ricaricare</span>
          </button>
        </div>
      )}

      {activeView.mode === 'dashboard' && (
        <Dashboard
          opening={openingData}
          cards={cards}
          logs={logs}
          isPersisted={isPersisted}
          onStartLearn={(variationId) => setActiveView({ mode: 'learn', variationId })}
          onStartReview={(variationId) => {
            setReviewFinished(false);
            setActiveView({ mode: 'review', variationId });
          }}
          onExportBackup={handleExportBackup}
          onImportBackup={handleImportBackup}
        />
      )}

      {activeView.mode === 'learn' && (
        <LearnMode
          opening={openingData}
          initialVariationId={activeView.variationId}
          onBack={() => setActiveView({ mode: 'dashboard' })}
        />
      )}

      {activeView.mode === 'review' && (
        <ReviewMode
          opening={openingData}
          cards={cards}
          logs={logs}
          variationId={activeView.variationId}
          onCardReviewed={handleCardReviewed}
          onSessionFinished={() => setReviewFinished(true)}
          onBack={() => setActiveView({ mode: 'dashboard' })}
        />
      )}
    </div>
  );
};

export default App;
