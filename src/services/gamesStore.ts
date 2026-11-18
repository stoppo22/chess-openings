import type { GamesSummary } from './myGames';

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

export function loadPriority(openingId: string): string[] {
  try {
    const v = JSON.parse(get(`chess-openings:priority:${openingId}`) ?? '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
export const savePriority = (openingId: string, ids: string[]) => set(`chess-openings:priority:${openingId}`, JSON.stringify(ids));
