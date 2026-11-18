import { describe, expect, it } from 'vitest';
import { buildDailySession } from '../services/dailySession';
import { fakeOpening } from './fixtures';
import { card } from './fixtures';
import type { PositionLesson } from '../types/lessons';

const op = fakeOpening();
const now = new Date('2026-01-10T10:00:00Z');
const past = (d: number) => new Date(now.getTime() - d * 864e5).toISOString();

const cards = [
  card('due2', { state: 2, due: past(1) }),
  card('due1', { state: 2, due: past(5) }),
  card('future', { state: 2, due: new Date(now.getTime() + 864e5).toISOString() }),
  card('n1', { priorityScore: 0.9 }), card('n2', { priorityScore: 0.8 }), card('n3', { priorityScore: 0.7 }),
  card('p1', { cardType: 'punish', priorityScore: 0.5 }), card('p2', { cardType: 'punish', priorityScore: 0.4 }),
];

describe('buildDailySession', () => {
  it('orders due, then new (daily limit), then punish; skips future', () => {
    const s = buildDailySession(cards, [], op, now);
    expect(s.map((i) => i.cardId)).toEqual(['due1', 'due2', 'n1', 'n2', 'n3', 'p1', 'p2']);
    expect(s.map((i) => i.kind)).toEqual(['review', 'review', 'new', 'new', 'new', 'punish', 'punish']);
  });
  it('adds a planQuiz slot when a lesson has one', () => {
    const lessons = { n1: { planQuiz: {} } as unknown as PositionLesson };
    const s = buildDailySession(cards, [], op, now, { lessons });
    expect(s.at(-1)).toMatchObject({ kind: 'planQuiz', normalizedFen: 'n1' });
  });
  it('puts priority cards first, in their own order', () => {
    const s = buildDailySession(cards, [], op, now, { priorityCardIds: ['due2', 'n3', 'p2'] });
    expect(s.map((i) => i.cardId)).toEqual(['due2', 'n3', 'p2', 'due1', 'n1', 'n2', 'p1']);
  });
  it('respects daily limit already used and time budget', () => {
    const logs = Array.from({ length: 10 }, (_, i) => ({
      id: `l${i}`, cardId: `x${i}`, openingId: 'fake', cardType: 'repertoire' as const, rating: 3, usedHint: false,
      wrongAttempts: 0, reviewedAt: '2026-01-10T08:00:00Z',
    }));
    expect(buildDailySession(cards, logs, op, now).map((i) => i.cardId)).toEqual(['due1', 'due2']);
    expect(buildDailySession(cards, [], op, now, { targetMinutes: 1 })).toHaveLength(2); // 60s / 25s
  });
});

describe('buildDailySession priority from own games', () => {
  it('keeps priority cards first even when the daily new limit is used up', () => {
    const today = now.toISOString();
    const many = Array.from({ length: 12 }, (_, k) => card(`x${k}`, { priorityScore: 0.1 }));
    const all = [...cards, ...many];
    const logs = many.slice(0, 10).map((c, k) => ({ id: `l${k}`, cardId: c.id, openingId: op.id, cardType: 'repertoire' as const, rating: 3, usedHint: false, wrongAttempts: 0, reviewedAt: today }));
    const s = buildDailySession(all, logs, op, now, { priorityCardIds: ['n3', 'due1'] });
    expect(s.slice(0, 2).map((i) => i.cardId)).toEqual(['n3', 'due1']);
  });
});

describe('priority cards leave the front once reviewed', () => {
  it('drops a priority card reviewed after "Allena" and keeps the others first', () => {
    const since = new Date(now.getTime() - 3600e3).toISOString();
    const logs = [{ id: 'l1', cardId: 'n3', openingId: op.id, cardType: 'repertoire' as const, rating: 3, usedHint: false, wrongAttempts: 0, reviewedAt: now.toISOString() }];
    const s = buildDailySession(cards, logs, op, now, { priorityCardIds: ['n3', 'n2'], prioritySince: since });
    expect(s[0].cardId).toBe('n2'); // n3 is back under normal FSRS ordering, no longer forced to the front
    expect(s.findIndex((i) => i.cardId === 'n3')).toBeGreaterThan(0);
  });
});
