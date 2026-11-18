import type { PositionLesson } from '../types/lessons';
import type { OpeningRepertoireFile, ReviewLogEntry, StoredFSRSCard } from '../types/repertoire';
import { buildDailyReviewQueue, SRS_DAILY_LIMITS, State } from './srs';

export interface SessionItem {
  kind: 'review' | 'new' | 'punish' | 'planQuiz';
  cardId?: string;
  card?: StoredFSRSCard;
  normalizedFen: string;
}

export const SECONDS_PER_ITEM = 25;
// New cards follow the app's daily limits; the time budget below still caps the session.
const MAX_NEW_REPERTOIRE = SRS_DAILY_LIMITS.MAX_NEW_CARDS_PER_DAY - SRS_DAILY_LIMITS.MAX_NEW_PUNISH_PER_DAY;
const MAX_NEW_PUNISH = SRS_DAILY_LIMITS.MAX_NEW_PUNISH_PER_DAY;

export function buildDailySession(
  cards: StoredFSRSCard[],
  logs: ReviewLogEntry[],
  opening: OpeningRepertoireFile,
  now: Date,
  {
    targetMinutes = 10,
    lessons,
    priorityCardIds = [],
  }: { targetMinutes?: number; lessons?: Record<string, PositionLesson>; priorityCardIds?: string[] } = {}
): SessionItem[] {
  const prio = new Set(priorityCardIds);
  const byId = new Map(cards.map((c) => [c.id, c]));
  // Boost priority cards' score so srs.ts's own ranking (and daily limits) pulls them forward.
  const boosted = cards.map((c) => (prio.has(c.id) ? { ...c, priorityScore: (c.priorityScore ?? 0) + 1e6 } : c));
  const queue = buildDailyReviewQueue({ cards: boosted, logs, openingId: opening.id, now });

  const due = queue.filter((c) => c.state !== State.New);
  due.sort((a, b) => Number(prio.has(b.id)) - Number(prio.has(a.id))); // stable: keeps due-date order within groups
  const fresh = queue.filter((c) => c.state === State.New);
  const newRep = fresh.filter((c) => c.cardType === 'repertoire').slice(0, MAX_NEW_REPERTOIRE);
  const newPunish = fresh.filter((c) => c.cardType === 'punish').slice(0, MAX_NEW_PUNISH);

  const items: SessionItem[] = [
    ...due.map((c) => ({ kind: 'review' as const, c })),
    ...newRep.map((c) => ({ kind: 'new' as const, c })),
    ...newPunish.map((c) => ({ kind: 'punish' as const, c })),
  ].map(({ kind, c }) => ({ kind, cardId: c.id, card: byId.get(c.id), normalizedFen: c.normalizedFen }));

  const quizFen = items.find((i) => i.card?.cardType === 'repertoire' && lessons?.[i.normalizedFen]?.planQuiz)?.normalizedFen;
  if (quizFen) items.push({ kind: 'planQuiz', normalizedFen: quizFen });

  return items.slice(0, Math.max(1, Math.floor((targetMinutes * 60) / SECONDS_PER_ITEM)));
}
