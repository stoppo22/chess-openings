import React, { useEffect, useMemo, useState } from 'react';
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
import { OPENINGS, loadOpening } from './data/openings';
import { Dashboard } from './components/Dashboard';
import { DrillMode } from './components/DrillMode';
import { LearnMode } from './components/LearnMode';
import { ReviewMode } from './components/ReviewMode';

type ActiveView =
  | { mode: 'dashboard' }
  | { mode: 'learn'; variationId?: string }
  | { mode: 'drill'; variationId?: string }
  | { mode: 'review'; variationId?: string };

const OPENING_KEY = 'chess-openings:selected-opening';

function readSelectedOpening(): string {
  try {
    const id = localStorage.getItem(OPENING_KEY);
    if (id && OPENINGS.some((o) => o.id === id)) return id;
  } catch {
    // storage non disponibile: usa il primo
  }
  return OPENINGS[0].id;
}

export const App: React.FC = () => {
  const [openingId, setOpeningId] = useState<string>(readSelectedOpening);
  const [openingData, setOpeningData] = useState<OpeningRepertoireFile | null>(null);
  const [allCards, setCards] = useState<StoredFSRSCard[]>([]);
  const [allLogs, setLogs] = useState<ReviewLogEntry[]>([]);
  const cards = useMemo(() => allCards.filter((c) => c.openingId === openingId), [allCards, openingId]);
  const logs = useMemo(() => allLogs.filter((l) => l.openingId === openingId), [allLogs, openingId]);
  const [isPersisted, setIsPersisted] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<ActiveView>({ mode: 'dashboard' });
  const [reviewFinished, setReviewFinished] = useState<boolean>(false);
  const [swUpdateReady, setSwUpdateReady] = useState<boolean>(() => isSwUpdateReady());
  const [error, setError] = useState<string | null>(null);

  const isSessionActive =
    activeView.mode === 'learn' ||
    activeView.mode === 'drill' ||
    (activeView.mode === 'review' && !reviewFinished);

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

        const opening = await loadOpening(openingId);

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
    setOpeningData(null);
    initApp();
    return () => {
      mounted = false;
    };
  }, [openingId]);

  const handleSelectOpening = (id: string) => {
    try {
      localStorage.setItem(OPENING_KEY, id);
    } catch {
      // ignora: la scelta vale solo per la sessione
    }
    setOpeningId(id);
  };

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
      <div className="min-h-screen bg-[#161512] text-[#e8e6e3] flex items-center justify-center p-6">
        <div className="max-w-md bg-[#262421] border border-[#b33430] rounded-md p-5 space-y-2">
          <h1 className="text-base font-bold text-[#e8e6e3]">Errore caricamento repertorio</h1>
          <p className="text-xs text-[#bababa]">{error}</p>
        </div>
      </div>
    );
  }

  if (!openingData) {
    return (
      <div className="min-h-screen bg-[#161512] text-[#bababa] flex items-center justify-center">
        <div className="text-sm">Caricamento repertorio...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#161512] text-[#e8e6e3] pb-10">
      {swUpdateReady && isSessionActive && (
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-3">
          <button
            type="button"
            onClick={applySwUpdateReload}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-[#3692e7] hover:bg-[#2b7bc6] text-white text-sm font-semibold transition"
          >
            <span>Aggiornamento disponibile, tocca per ricaricare</span>
          </button>
        </div>
      )}

      {activeView.mode === 'dashboard' && (
        <Dashboard
          opening={openingData}
          openings={OPENINGS}
          onSelectOpening={handleSelectOpening}
          cards={cards}
          logs={logs}
          isPersisted={isPersisted}
          onStartLearn={(variationId) => setActiveView({ mode: 'learn', variationId })}
          onStartDrill={(variationId) => setActiveView({ mode: 'drill', variationId })}
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

      {activeView.mode === 'drill' && (
        <DrillMode
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
