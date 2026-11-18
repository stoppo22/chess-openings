import type { GameContext, GamesSummary } from './myGames';

const get = (k: string): string | null => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const set = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    // storage non disponibile: vale solo per la sessione
  }
};

export const loadUsername = () => get('chess-openings:username') ?? '';
export const saveUsername = (u: string) => set('chess-openings:username', u);

export interface CachedSummary {
  username: string;
  at: number;
  summary: GamesSummary;
}
export function loadSummary(openingId: string): CachedSummary | null {
  try {
    return JSON.parse(get(`chess-openings:games:${openingId}`) ?? 'null');
  } catch {
    return null;
  }
}
export const saveSummary = (openingId: string, c: CachedSummary) => set(`chess-openings:games:${openingId}`, JSON.stringify(c));

export interface PriorityState {
  ids: string[];
  /** When the user pressed "Allena…": a card stops being priority once reviewed after this time. */
  since: string;
}

export function loadPriority(openingId: string): PriorityState {
  try {
    const v = JSON.parse(get(`chess-openings:priority:${openingId}`) ?? '[]');
    if (Array.isArray(v)) return { ids: v, since: new Date(0).toISOString() }; // old format
    return v && Array.isArray(v.ids) && typeof v.since === 'string' ? v : { ids: [], since: new Date(0).toISOString() };
  } catch {
    return { ids: [], since: new Date(0).toISOString() };
  }
}
export function savePriority(openingId: string, ids: string[]): PriorityState {
  const state = { ids, since: new Date().toISOString() };
  set(`chess-openings:priority:${openingId}`, JSON.stringify(state));
  return state;
}

export function loadContext(openingId: string): Record<string, GameContext[]> {
  try {
    const v = JSON.parse(get(`chess-openings:context:${openingId}`) ?? '{}');
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
}
export const saveContext = (openingId: string, c: Record<string, GameContext[]>) =>
  set(`chess-openings:context:${openingId}`, JSON.stringify(c));
