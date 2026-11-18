import { Chess } from 'chess.js';
import type { OpeningRepertoireFile } from '../types/repertoire';
import { buildCardId, normalizeFen } from './fen';

export interface MyGame {
  pgn: string;
  white: string;
  black: string;
  timeClass: string;
  endTime: number;
  url: string;
}

export type FetchGamesResult = { ok: true; games: MyGame[] } | { ok: false; error: string };

/** Never throws: network / HTTP / shape errors come back as `{ ok: false }`. */
export async function fetchRecentGames(
  username: string,
  { months = 3, timeClasses = ['rapid'] }: { months?: number; timeClasses?: string[] } = {}
): Promise<FetchGamesResult> {
  try {
    const base = `https://api.chess.com/pub/player/${encodeURIComponent(username.trim().toLowerCase())}/games/archives`;
    const r = await fetch(base);
    if (!r.ok) return { ok: false, error: r.status === 404 ? 'Utente non trovato' : `chess.com HTTP ${r.status}` };
    const archives: string[] = ((await r.json()) as { archives?: string[] }).archives ?? [];
    const games: MyGame[] = [];
    for (const url of archives.slice(-months)) {
      const mr = await fetch(url); // sequential on purpose (chess.com rate limits parallel calls)
      if (!mr.ok) return { ok: false, error: `chess.com HTTP ${mr.status}` };
      const data = (await mr.json()) as {
        games?: Array<{
          pgn?: string;
          white?: { username: string };
          black?: { username: string };
          time_class: string;
          end_time: number;
          url: string;
        }>;
      };
      for (const g of data.games ?? []) {
        if (!g.pgn || !timeClasses.includes(g.time_class)) continue;
        games.push({
          pgn: g.pgn,
          white: g.white?.username ?? '',
          black: g.black?.username ?? '',
          timeClass: g.time_class,
          endTime: g.end_time,
          url: g.url,
        });
      }
    }
    return { ok: true, games };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Errore di rete' };
  }
}

export interface LeftBook {
  ply: number; // 1-based ply of the deviating move
  by: 'me' | 'opponent';
  /** FEN (normalized) of the last in-book position, before the deviating move. */
  normalizedFen: string;
  playedSan: string;
  /** Only when by === 'me' and the book node had a move for me. */
  repertoireSan?: string;
}

export interface PunishEvent {
  beforeMistakeFen: string;
  opponentMoveSan: string;
  evalLoss: number;
  punishMoveSan: string;
  mySan: string;
  cardId: string;
}

export interface GameAnalysis {
  url: string;
  opponent: string;
  myColor: 'white' | 'black';
  endTime: number; // unix seconds
  openingId: string;
  leftBook?: LeftBook; // absent: the game stayed in book to the end
  missedPunish?: PunishEvent;
  punished?: PunishEvent;
}

/** Returns null when the game is not applicable (other colour, unparsable PGN, start outside the tree). */
export function analyseGame(
  game: MyGame,
  username: string,
  opening: OpeningRepertoireFile
): GameAnalysis | null {
  const u = username.trim().toLowerCase();
  const myColor = game.white.toLowerCase() === u ? 'white' : game.black.toLowerCase() === u ? 'black' : null;
  if (myColor !== opening.playerColor) return null;

  const chess = new Chess();
  try {
    chess.loadPgn(game.pgn);
  } catch {
    return null;
  }
  const moves = chess.history({ verbose: true });
  // The tree may start after some moves (Caro-Kann root = after 1.e4): begin at the first position that is in it.
  const start = moves.findIndex((mv) => opening.positions[normalizeFen(mv.before)]);
  if (start < 0 || start > 2) return null;

  const out: GameAnalysis = {
    url: game.url,
    opponent: myColor === 'white' ? game.black : game.white,
    myColor,
    endTime: game.endTime,
    openingId: opening.id,
  };
  let inBook = true;
  let pending: { fen: string; m: NonNullable<ReturnType<typeof findMistake>> } | null = null;

  moves.slice(start).forEach((mv, j) => {
    const i = start + j;
    const mine = (mv.color === 'w') === (myColor === 'white');
    if (pending && mine) {
      const { m, fen } = pending;
      const ev: PunishEvent = {
        beforeMistakeFen: fen,
        opponentMoveSan: m.opponentMoveSan,
        evalLoss: m.evalLoss,
        punishMoveSan: m.punishMoveSan,
        mySan: mv.san,
        // srs.ts creates punish cards only for evalLoss >= 1.0; smaller mistakes are trained via the repertoire card there.
        cardId: buildCardId(
          opening.id,
          m.evalLoss < 1.0 && opening.positions[m.afterMistakeNormalizedFen]?.playerMove ? 'repertoire' : 'punish',
          m.afterMistakeNormalizedFen
        ),
      };
      if (mv.san === m.punishMoveSan) out.punished = ev;
      else out.missedPunish = ev;
      pending = null;
    }
    if (!inBook) return;
    const fen = normalizeFen(mv.before);
    const node = opening.positions[fen];
    if (!mine) {
      const m = findMistake(node, mv.san);
      if (m) pending = { fen, m };
    }
    if (!opening.positions[normalizeFen(mv.after)]) {
      inBook = false;
      out.leftBook = {
        ply: i + 1,
        by: mine ? 'me' : 'opponent',
        normalizedFen: fen,
        playedSan: mv.san,
        repertoireSan: mine ? node?.playerMove?.san : undefined,
      };
    }
  });
  return out;
}

function findMistake(node: { commonMistakes?: import('../types/repertoire').CommonMistake[] } | undefined, san: string) {
  return node?.commonMistakes?.find((c) => c.opponentMoveSan === san);
}

export interface DeviationStat {
  normalizedFen: string;
  by: 'me' | 'opponent';
  count: number;
  moves: Record<string, number>; // played SAN -> count
  repertoireSan?: string;
}

export interface GamesSummary {
  games: number;
  deviations: DeviationStat[]; // most frequent first
  missedPunish: number;
  foundPunish: number;
  /** Card ids (srs.ts format) to pull forward in review. */
  priorityCardIds: string[];
  /** Why each card is in the priority list: up to 3 games, newest first. */
  contextByCardId: Record<string, GameContext[]>;
}

export interface GameContext {
  url: string;
  opponent: string;
  date: string; // ISO
  kind: 'my-deviation' | 'missed-punish';
  mySan: string;
  repertoireSan?: string;
  opponentMistakeSan?: string;
  punishSan?: string;
  evalLoss?: number;
}

export function summarise(analyses: GameAnalysis[]): GamesSummary {
  const dev = new Map<string, DeviationStat>();
  const prio = new Map<string, number>();
  const ctx: Record<string, GameContext[]> = {};
  let missed = 0;
  let found = 0;
  for (const a of analyses) {
    const l = a.leftBook;
    const base = { url: a.url, opponent: a.opponent, date: new Date(a.endTime * 1000).toISOString() };
    if (l) {
      const key = `${l.by}|${l.normalizedFen}`;
      const d = dev.get(key) ?? { normalizedFen: l.normalizedFen, by: l.by, count: 0, moves: {}, repertoireSan: l.repertoireSan };
      d.count++;
      d.moves[l.playedSan] = (d.moves[l.playedSan] ?? 0) + 1;
      dev.set(key, d);
      if (l.by === 'me') {
        const id = buildCardId(a.openingId, 'repertoire', l.normalizedFen);
        prio.set(id, (prio.get(id) ?? 0) + 1);
        (ctx[id] ??= []).push({ ...base, kind: 'my-deviation', mySan: l.playedSan, repertoireSan: l.repertoireSan });
      }
    }
    if (a.punished) found++;
    if (a.missedPunish) {
      missed++;
      const m = a.missedPunish;
      prio.set(m.cardId, (prio.get(m.cardId) ?? 0) + 1);
      (ctx[m.cardId] ??= []).push({
        ...base,
        kind: 'missed-punish',
        mySan: m.mySan,
        opponentMistakeSan: m.opponentMoveSan,
        punishSan: m.punishMoveSan,
        evalLoss: m.evalLoss,
      });
    }
  }
  for (const id in ctx) ctx[id] = ctx[id].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  return {
    games: analyses.length,
    deviations: [...dev.values()].sort((a, b) => b.count - a.count),
    missedPunish: missed,
    foundPunish: found,
    priorityCardIds: [...prio.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id),
    contextByCardId: ctx,
  };
}
