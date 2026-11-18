import { describe, expect, it } from 'vitest';
import { analyseGame, summarise, type MyGame } from '../services/myGames';
import { buildCardId, getFenFromSanMoves } from '../services/fen';
import { loadContext, saveContext } from '../services/gamesStore';
import { fakeOpening } from './fixtures';

const op = fakeOpening();
const g = (pgn: string, white = 'Me', black = 'Opp', endTime = 0): MyGame => ({ pgn, white, black, timeClass: 'rapid', endTime, url: pgn });

describe('analyseGame', () => {
  it('missed punish + opponent left book', () => {
    const a = analyseGame(g('1. e4 f6 2. Nf3 *'), 'me', op)!;
    expect(a.leftBook).toMatchObject({ by: 'opponent', ply: 2, playedSan: 'f6' });
    expect(a.missedPunish).toMatchObject({ punishMoveSan: 'd4', mySan: 'Nf3', evalLoss: 2 });
    expect(a.punished).toBeUndefined();
  });
  it('found punish', () => {
    const a = analyseGame(g('1. e4 f6 2. d4 *'), 'Me', op)!;
    expect(a.punished?.mySan).toBe('d4');
    expect(a.missedPunish).toBeUndefined();
  });
  it('left book by me', () => {
    const a = analyseGame(g('1. d4 d5 *'), 'me', op)!;
    expect(a.leftBook).toMatchObject({ by: 'me', ply: 1, playedSan: 'd4', repertoireSan: 'e4' });
  });
  it('left book by opponent deeper', () => {
    const a = analyseGame(g('1. e4 e5 2. Nf3 d6 *'), 'me', op)!;
    expect(a.leftBook).toMatchObject({ by: 'opponent', ply: 4, playedSan: 'd6' });
  });
  it('skips wrong colour / user not in game', () => {
    expect(analyseGame(g('1. e4 e5 *'), 'opp', op)).toBeNull();
    expect(analyseGame(g('1. e4 e5 *'), 'nobody', op)).toBeNull();
  });
});

describe('summarise', () => {
  it('aggregates', () => {
    const as = ['1. d4 d5 *', '1. d4 Nf6 *', '1. e4 f6 2. Nf3 *', '1. e4 f6 2. d4 *'].map((p) => analyseGame(g(p), 'me', op)!);
    const s = summarise(as);
    expect(s.deviations[0]).toMatchObject({ by: 'me', count: 2, repertoireSan: 'e4' });
    expect(s.missedPunish).toBe(1);
    expect(s.foundPunish).toBe(1);
    expect(s.priorityCardIds).toContain(buildCardId('fake', 'repertoire', getFenFromSanMoves([]).normalizedFen));
    expect(s.priorityCardIds).toContain(buildCardId('fake', 'punish', getFenFromSanMoves(['e4', 'f6']).normalizedFen));
  });
  it('builds context per card, newest first, max 3', () => {
    const as = [1, 2, 3, 4].map((t) => analyseGame(g('1. d4 d5 *', 'Me', `O${t}`, 1700000000 + t), 'me', op)!);
    as.push(analyseGame(g('1. e4 f6 2. Nf3 *', 'Me', 'Zed', 1700000100), 'me', op)!);
    const s = summarise(as);
    const dev = s.contextByCardId[buildCardId('fake', 'repertoire', getFenFromSanMoves([]).normalizedFen)];
    expect(dev.map((c) => c.opponent)).toEqual(['O4', 'O3', 'O2']);
    expect(dev[0]).toMatchObject({ kind: 'my-deviation', mySan: 'd4', repertoireSan: 'e4', url: '1. d4 d5 *' });
    expect(dev[0].date).toBe(new Date(1700000004000).toISOString());
    const mp = s.contextByCardId[buildCardId('fake', 'punish', getFenFromSanMoves(['e4', 'f6']).normalizedFen)][0];
    expect(mp).toMatchObject({ kind: 'missed-punish', opponent: 'Zed', mySan: 'Nf3', opponentMistakeSan: 'f6', punishSan: 'd4', evalLoss: 2 });
  });
});

describe('gamesStore context', () => {
  it('round-trips and tolerates garbage', () => {
    const store: Record<string, string> = {};
    (globalThis as any).localStorage = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => (store[k] = v) };
    const c = { x: [{ url: 'u', opponent: 'o', date: 'd', kind: 'my-deviation' as const, mySan: 'd4' }] };
    saveContext('fake', c);
    expect(loadContext('fake')).toEqual(c);
    store['chess-openings:context:fake'] = '[1]';
    expect(loadContext('fake')).toEqual({});
  });
});
