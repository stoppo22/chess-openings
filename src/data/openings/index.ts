import type { OpeningRepertoireFile, PlayerColor } from '../../types/repertoire';

export interface OpeningEntry {
  id: string;
  name: string;
  playerColor: PlayerColor;
  load: () => Promise<{ default: unknown }>;
}

export const OPENINGS: OpeningEntry[] = [
  { id: 'caro-kann', name: 'Caro-Kann', playerColor: 'black', load: () => import('./caro-kann.json') },
  { id: 'london', name: 'Sistema Londra', playerColor: 'white', load: () => import('./london.json') },
];

export async function loadOpening(id: string): Promise<OpeningRepertoireFile> {
  const entry = OPENINGS.find((o) => o.id === id) ?? OPENINGS[0];
  return (await entry.load()).default as OpeningRepertoireFile;
}
