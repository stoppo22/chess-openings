import { createEmptyCard, fsrs, Rating, State, type Card } from 'ts-fsrs';
import type {
  OpeningRepertoireFile,
  ReviewLogEntry,
  SRSCardType,
  StoredFSRSCard,
} from '../types/repertoire';
import { buildCardId } from './fen';

export { Rating, State };

export const SRS_DAILY_LIMITS = {
  MAX_NEW_CARDS_PER_DAY: 10,
  MAX_NEW_PUNISH_PER_DAY: 3,
};

const scheduler = fsrs();

function storedToFsrsCard(stored: StoredFSRSCard): Card {
  return {
    due: new Date(stored.due),
    stability: stored.stability,
    difficulty: stored.difficulty,
    elapsed_days: stored.elapsed_days,
    scheduled_days: stored.scheduled_days,
    reps: stored.reps,
    lapses: stored.lapses,
    state: stored.state as State,
    last_review: stored.last_review ? new Date(stored.last_review) : undefined,
  };
}

function applyFsrsCardToStored(stored: StoredFSRSCard, card: Card): StoredFSRSCard {
  return {
    ...stored,
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: card.last_review ? card.last_review.toISOString() : undefined,
  };
}

/**
 * Sincronizza le posizioni di un file apertura con le card salvate in IndexedDB,
 * creando le card mancanti (state = State.New) usando come chiave deterministica il FEN normalizzato.
 * Regole:
 * - Le card 'punish' vengono create SOLO per errori con perdita >= 1.0 (mistake e blunder).
 * - Le imprecisioni (0.40 - 0.99) restano solo nel pannello "Errori comuni" senza card di ripasso.
 * - Priorità nuove card:
 *   - 'repertoire': reach (probabilità cumulativa di incontrare la posizione)
 *   - 'punish': reach × frequenza × perdita
 */
export function syncOpeningCards(
  opening: OpeningRepertoireFile,
  existingCards: StoredFSRSCard[],
  now: Date = new Date()
): StoredFSRSCard[] {
  const mapById = new Map<string, StoredFSRSCard>();
  for (const c of existingCards) {
    if (c.openingId !== opening.id) {
      mapById.set(c.id, c);
    }
  }
  const existingByOpening = new Map<string, StoredFSRSCard>();
  for (const c of existingCards) {
    if (c.openingId === opening.id) {
      existingByOpening.set(c.id, c);
    }
  }

  for (const node of Object.values(opening.positions)) {
    const nodeReachPct = node.reachPct ?? 100;
    const nodeReachProb = nodeReachPct / 100;

    if (node.isPlayerTurn && node.playerMove) {
      const cardId = buildCardId(opening.id, 'repertoire', node.normalizedFen);
      const priorityScore = Number(nodeReachProb.toFixed(6));
      const existing = existingByOpening.get(cardId);
      if (existing && existing.correctMoveSan === node.playerMove.san) {
        mapById.set(cardId, {
          ...existing,
          variationId: node.variationId,
          fullFen: node.fullFen,
          pgnPath: node.pgnPath,
          moveSequenceSan: node.moveSequenceSan,
          reachPct: nodeReachPct,
          priorityScore,
        });
      } else {
        const empty = createEmptyCard(now);
        mapById.set(cardId, {
          id: cardId,
          openingId: opening.id,
          variationId: node.variationId,
          cardType: 'repertoire',
          normalizedFen: node.normalizedFen,
          fullFen: node.fullFen,
          pgnPath: node.pgnPath,
          moveSequenceSan: node.moveSequenceSan,
          correctMoveSan: node.playerMove.san,
          correctMoveUci: node.playerMove.uci,
          correctFrom: node.playerMove.from,
          correctTo: node.playerMove.to,
          reachPct: nodeReachPct,
          priorityScore,
          due: empty.due.toISOString(),
          stability: empty.stability,
          difficulty: empty.difficulty,
          elapsed_days: empty.elapsed_days,
          scheduled_days: empty.scheduled_days,
          reps: empty.reps,
          lapses: empty.lapses,
          state: empty.state,
        });
      }
    }

    // Card di tipo 'punish' (Checkpoint B): SOLO per errori con perdita >= 1.0 (mistake e blunder)
    if (!node.isPlayerTurn && Array.isArray(node.commonMistakes)) {
      for (const mistake of node.commonMistakes) {
        if (mistake.evalLoss < 1.0 || (mistake.severity !== 'mistake' && mistake.severity !== 'blunder')) {
          continue;
        }
        const cardId = buildCardId(opening.id, 'punish', mistake.afterMistakeNormalizedFen);
        const freqProb = mistake.frequencyPct / 100;
        const priorityScore = Number((nodeReachProb * freqProb * mistake.evalLoss).toFixed(6));
        const mistakeContext = {
          beforeMistakeFen: node.fullFen,
          opponentMistakeSan: mistake.opponentMoveSan,
          evalLoss: mistake.evalLoss,
          severity: mistake.severity,
          frequencyPct: mistake.frequencyPct,
          pvSan: mistake.pvSan,
          finalEvalForPlayer: mistake.finalEvalForPlayer,
          depth: mistake.depth,
        };

        const existing = existingByOpening.get(cardId);
        if (existing && existing.correctMoveSan === mistake.punishMoveSan) {
          mapById.set(cardId, {
            ...existing,
            variationId: node.variationId,
            fullFen: mistake.afterMistakeFullFen,
            pgnPath: `${node.pgnPath} ${mistake.opponentMoveSan}`.trim(),
            moveSequenceSan: [...node.moveSequenceSan, mistake.opponentMoveSan],
            reachPct: nodeReachPct,
            priorityScore,
            mistakeContext,
          });
        } else {
          const empty = createEmptyCard(now);
          mapById.set(cardId, {
            id: cardId,
            openingId: opening.id,
            variationId: node.variationId,
            cardType: 'punish',
            normalizedFen: mistake.afterMistakeNormalizedFen,
            fullFen: mistake.afterMistakeFullFen,
            pgnPath: `${node.pgnPath} ${mistake.opponentMoveSan}`.trim(),
            moveSequenceSan: [...node.moveSequenceSan, mistake.opponentMoveSan],
            correctMoveSan: mistake.punishMoveSan,
            correctMoveUci: mistake.punishMoveUci,
            correctFrom: mistake.punishFrom,
            correctTo: mistake.punishTo,
            reachPct: nodeReachPct,
            priorityScore,
            mistakeContext,
            due: empty.due.toISOString(),
            stability: empty.stability,
            difficulty: empty.difficulty,
            elapsed_days: empty.elapsed_days,
            scheduled_days: empty.scheduled_days,
            reps: empty.reps,
            lapses: empty.lapses,
            state: empty.state,
          });
        }
      }
    }
  }

  return Array.from(mapById.values());
}

/**
 * Regola rigorosa FSRS richiesta:
 * - Se usedHint === true -> Rating.Again SEMPRE, senza alternative.
 * - Se wrongAttempts > 0 -> Rating.Again SEMPRE.
 * - Al primo tentativo corretto senza hint -> Rating.Good di default, oppure Rating.Easy se scelto dall'utente.
 */
export function resolveOutcomeRating({
  usedHint,
  wrongAttempts,
  choseEasy = false,
}: {
  usedHint: boolean;
  wrongAttempts: number;
  choseEasy?: boolean;
}): Rating {
  if (usedHint || wrongAttempts > 0) {
    return Rating.Again;
  }
  return choseEasy ? Rating.Easy : Rating.Good;
}

/**
 * Aggiorna una card FSRS applicando il risultato della risposta.
 */
export function gradeCard(
  storedCard: StoredFSRSCard,
  outcome: { usedHint: boolean; wrongAttempts: number; choseEasy?: boolean },
  now: Date = new Date()
): { updatedCard: StoredFSRSCard; logEntry: ReviewLogEntry; rating: Rating } {
  const rating = resolveOutcomeRating(outcome);
  const fsrsCard = storedToFsrsCard(storedCard);
  const recordLog = scheduler.repeat(fsrsCard, now);
  const nextItem = recordLog[rating as Rating.Again | Rating.Hard | Rating.Good | Rating.Easy];

  const updatedCard = applyFsrsCardToStored(storedCard, nextItem.card);
  const logEntry: ReviewLogEntry = {
    id: `${storedCard.id}:${now.getTime()}`,
    cardId: storedCard.id,
    openingId: storedCard.openingId,
    cardType: storedCard.cardType,
    rating,
    usedHint: outcome.usedHint,
    wrongAttempts: outcome.wrongAttempts,
    reviewedAt: now.toISOString(),
  };

  return { updatedCard, logEntry, rating };
}

/**
 * Costruisce la coda di ripasso giornaliera rispettando:
 * 1) Tutte le card già avviate (state !== State.New) con due <= now.
 * 2) Limite giornaliero di nuove card (default 10 totali al giorno, di cui al massimo 3 di tipo 'punish').
 */
export function buildDailyReviewQueue({
  cards,
  logs = [],
  openingId,
  variationId,
  includePunish = true,
  maxNewPerDay = SRS_DAILY_LIMITS.MAX_NEW_CARDS_PER_DAY,
  maxNewPunishPerDay = SRS_DAILY_LIMITS.MAX_NEW_PUNISH_PER_DAY,
  now = new Date(),
}: {
  cards: StoredFSRSCard[];
  logs?: ReviewLogEntry[];
  openingId?: string;
  variationId?: string;
  includePunish?: boolean;
  maxNewPerDay?: number;
  maxNewPunishPerDay?: number;
  now?: Date;
}): StoredFSRSCard[] {
  const nowMs = now.getTime();
  const todayPrefix = now.toISOString().slice(0, 10);

  // Calcola quante card sono state studiate per la prima volta oggi
  const firstReviewByCard = new Map<string, ReviewLogEntry>();
  const sortedLogs = [...logs].sort((a, b) => a.reviewedAt.localeCompare(b.reviewedAt));
  for (const l of sortedLogs) {
    if (!firstReviewByCard.has(l.cardId)) {
      firstReviewByCard.set(l.cardId, l);
    }
  }

  let newIntroducedTodayTotal = 0;
  let newIntroducedTodayPunish = 0;
  for (const firstLog of firstReviewByCard.values()) {
    if (firstLog.reviewedAt.startsWith(todayPrefix)) {
      newIntroducedTodayTotal += 1;
      if (firstLog.cardType === 'punish') {
        newIntroducedTodayPunish += 1;
      }
    }
  }

  const remainingNewTotal = Math.max(0, maxNewPerDay - newIntroducedTodayTotal);
  const remainingNewPunish = Math.max(0, maxNewPunishPerDay - newIntroducedTodayPunish);

  const filtered = cards.filter((c) => {
    if (openingId && c.openingId !== openingId) return false;
    if (variationId && c.variationId !== variationId) return false;
    if (!includePunish && c.cardType === 'punish') return false;
    return true;
  });

  // 1) Card già in apprendimento/ripasso in scadenza (nessun tetto alle review dovute)
  const dueReviews = filtered
    .filter((c) => c.state !== State.New && new Date(c.due).getTime() <= nowMs)
    .sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime());

  // 2) Nuove card in ordine decrescente di priorità:
  //    - per card 'repertoire': reach (probabilità cumulativa di incontrare la posizione)
  //    - per card 'punish': reach × frequenza × perdita
  //    Rispettando il tetto giornaliero (max 10 nuove, di cui max 3 punish)
  const newCardsPool = filtered
    .filter((c) => c.state === State.New)
    .sort(
      (a, b) =>
        (b.priorityScore ?? 0) - (a.priorityScore ?? 0) ||
        a.moveSequenceSan.length - b.moveSequenceSan.length
    );

  const selectedNew: StoredFSRSCard[] = [];
  let pickedPunish = 0;

  for (const c of newCardsPool) {
    if (selectedNew.length >= remainingNewTotal) break;
    if (c.cardType === 'punish') {
      if (pickedPunish >= remainingNewPunish) continue;
      pickedPunish += 1;
    }
    selectedNew.push(c);
  }

  return [...dueReviews, ...selectedNew];
}

export function computeCardStats(cards: StoredFSRSCard[], cardType?: SRSCardType, now: Date = new Date()) {
  const list = cardType ? cards.filter((c) => c.cardType === cardType) : cards;
  const nowMs = now.getTime();
  const total = list.length;
  const newCount = list.filter((c) => c.state === State.New).length;
  const learningCount = list.filter((c) => c.state === State.Learning || c.state === State.Relearning).length;
  const reviewCount = list.filter((c) => c.state === State.Review).length;
  const dueReviewCount = list.filter((c) => c.state !== State.New && new Date(c.due).getTime() <= nowMs).length;

  return {
    total,
    newCount,
    learningCount,
    reviewCount,
    dueReviewCount,
  };
}
