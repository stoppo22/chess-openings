import { describe, expect, it } from 'vitest';
import { analyseGame, summarise, type MyGame } from '../services/myGames';
import { buildCardId, getFenFromSanMoves } from '../services/fen';
import { fakeOpening } from './fixtures';

const op = fakeOpening();
const g = (pgn: string, white = 'Me', black = 'Opp'): MyGame => ({ pgn, white, black, timeClass: 'rapid', endTime: 0, url: pgn });

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
});
