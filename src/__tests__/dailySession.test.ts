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
  it('pulls priority cards forward', () => {
    const s = buildDailySession(cards, [], op, now, { priorityCardIds: ['due2', 'n3', 'p2'] });
    expect(s.map((i) => i.cardId)).toEqual(['due2', 'due1', 'n3', 'n1', 'n2', 'p2', 'p1']);
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
