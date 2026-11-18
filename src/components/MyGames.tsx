import React, { useState } from 'react';
import type { OpeningRepertoireFile } from '../types/repertoire';
import { analyseGame, fetchRecentGames, summarise, type DeviationStat } from '../services/myGames';
import { loadSummary, loadUsername, saveSummary, saveUsername, savePriority, saveContext, type CachedSummary } from '../services/gamesStore';

const line = (opening: OpeningRepertoireFile, d: DeviationStat) => {
  const path = (opening.positions[d.normalizedFen]?.pgnPath ?? '').replace(/(\d+)\.\s+/g, '$1.');
  const top = Object.entries(d.moves).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
  const where = path ? `Dopo ${path}` : 'Subito';
  if (d.by === 'opponent') return `${where} — fuori dal repertorio (mossa avversaria: ${top})`;
  return d.repertoireSan ? `${where}: hai giocato ${top}, il repertorio dice ${d.repertoireSan}` : `${where} — fuori dal repertorio (hai giocato ${top})`;
};

export const MyGames: React.FC<{ opening: OpeningRepertoireFile; onPriorityChange: (ids: string[]) => void }> = ({
  opening,
  onPriorityChange,
}) => {
  const [username, setUsername] = useState(loadUsername);
  const [cached, setCached] = useState<CachedSummary | null>(() => loadSummary(opening.id));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trained, setTrained] = useState(false);

  const run = async () => {
    const u = username.trim();
    if (!u) return;
    saveUsername(u);
    setLoading(true);
    setError(null);
    setTrained(false);
    const r = await fetchRecentGames(u);
    setLoading(false);
    if (!r.ok) return setError(r.error);
    const analyses = r.games.map((g) => analyseGame(g, u, opening)).filter((a) => a !== null);
    const c = { username: u, at: Date.now(), summary: summarise(analyses) };
    saveSummary(opening.id, c);
    setCached(c);
  };

  const s = cached?.summary;
  return (
    <section className="space-y-3">
      <h2 className="text-xl">Le tue partite</h2>
      <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
        <label className="block space-y-1">
          <span className="text-sm text-muted">Nome utente su chess.com</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
            className="w-full min-h-[44px] px-3 rounded-[10px] bg-bg border border-border text-base"
          />
        </label>
        <button onClick={run} disabled={loading || !username.trim()} className="btn-secondary w-full">
          {loading ? 'Analizzo le partite…' : 'Analizza le ultime partite rapid'}
        </button>
        {error && <p className="text-sm text-danger">Non riesco a leggere le partite: {error}</p>}
        {s && (
          <div className="space-y-3 pt-1">
            <p className="text-sm text-muted">
              {s.games === 0
                ? `Nessuna partita rapid con ${opening.name} trovata per ${cached!.username}.`
                : `${s.games} partite analizzate (${cached!.username}) · punizioni trovate ${s.foundPunish} · mancate ${s.missedPunish}`}
            </p>
            {s.deviations.length > 0 && (
              <ul className="divide-y divide-border border border-border rounded-[10px]">
                {s.deviations.slice(0, 5).map((d) => (
                  <li key={`${d.by}|${d.normalizedFen}`} className="px-3 py-2.5 text-[15px] leading-snug flex gap-3 justify-between">
                    <span className="min-w-0 break-words">
                      {line(opening, d)}
                      {d.by === 'opponent' && (
                        <span className="block text-[13px] text-muted mt-0.5">Non ancora nel repertorio: non entra nel ripasso.</span>
                      )}
                    </span>
                    <span className="text-[13px] text-muted shrink-0 tabular-nums">{d.count}×</span>
                  </li>
                ))}
              </ul>
            )}
            {s.priorityCardIds.length > 0 && (
              <button
                onClick={() => {
                  savePriority(opening.id, s.priorityCardIds);
                  saveContext(opening.id, s.contextByCardId ?? {});
                  onPriorityChange(s.priorityCardIds);
                  setTrained(true);
                }}
                className="btn-primary w-full"
              >
                {`Allena ${Math.min(s.priorityCardIds.length, 10)} posizioni dalle tue partite`}
              </button>
            )}
            {trained && <p className="text-sm text-accent">Fatto: sono le prime di “Ripassa oggi”.</p>}
          </div>
        )}
      </div>
    </section>
  );
};
