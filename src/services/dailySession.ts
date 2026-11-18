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
const MAX_PRIORITY = 10;

export function buildDailySession(
  cards: StoredFSRSCard[],
  logs: ReviewLogEntry[],
  opening: OpeningRepertoireFile,
  now: Date,
  {
    targetMinutes = 10,
    lessons,
    priorityCardIds = [],
    prioritySince,
  }: { targetMinutes?: number; lessons?: Record<string, PositionLesson>; priorityCardIds?: string[]; prioritySince?: string } = {}
): SessionItem[] {
  const byId = new Map(cards.map((c) => [c.id, c]));
  // Positions from the user's own games go first, whatever their state, and don't use up the daily new-card limit.
  // Once reviewed after "Allena…" was pressed, a card goes back to normal FSRS scheduling.
  const reviewedSince = new Set(logs.filter((l) => !prioritySince || l.reviewedAt >= prioritySince).map((l) => l.cardId));
  const prioCards = [...new Set(priorityCardIds)]
    .filter((id) => !reviewedSince.has(id))
    .map((id) => byId.get(id))
    .filter((c): c is StoredFSRSCard => !!c)
    .slice(0, MAX_PRIORITY);
  const prio = new Set(prioCards.map((c) => c.id));
  const queue = buildDailyReviewQueue({ cards: cards.filter((c) => !prio.has(c.id)), logs, openingId: opening.id, now });

  const due = queue.filter((c) => c.state !== State.New);
  const fresh = queue.filter((c) => c.state === State.New);
  const newRep = fresh.filter((c) => c.cardType === 'repertoire').slice(0, MAX_NEW_REPERTOIRE);
  const newPunish = fresh.filter((c) => c.cardType === 'punish').slice(0, MAX_NEW_PUNISH);
  const kindOf = (c: StoredFSRSCard) => (c.cardType === 'punish' ? 'punish' : c.state === State.New ? 'new' : 'review') as SessionItem['kind'];

  const items: SessionItem[] = [
    ...prioCards.map((c) => ({ kind: kindOf(c), c })),
    ...due.map((c) => ({ kind: 'review' as const, c })),
    ...newRep.map((c) => ({ kind: 'new' as const, c })),
    ...newPunish.map((c) => ({ kind: 'punish' as const, c })),
  ].map(({ kind, c }) => ({ kind, cardId: c.id, card: byId.get(c.id), normalizedFen: c.normalizedFen }));

  const quizFen = items.find((i) => i.card?.cardType === 'repertoire' && lessons?.[i.normalizedFen]?.planQuiz)?.normalizedFen;
  if (quizFen) items.push({ kind: 'planQuiz', normalizedFen: quizFen });

  return items.slice(0, Math.max(1, Math.floor((targetMinutes * 60) / SECONDS_PER_ITEM)));
}
