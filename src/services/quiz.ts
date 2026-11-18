import type { PlanQuiz, PositionLesson } from '../types/lessons';
import type { OpeningRepertoireFile, StoredFSRSCard } from '../types/repertoire';

export interface QuizOption {
  text: string;
  correct: boolean;
  /** Principle violated by this (wrong) plan, when known. */
  principleId?: string;
}

/** Correct plan + up to 2 distractors, shuffled (rng injectable for tests). */
export function buildQuizOptions(q: PlanQuiz, rng: () => number = Math.random): QuizOption[] {
  const opts: QuizOption[] = [
    { text: q.correct, correct: true },
    ...q.distractors.slice(0, 2).map((text, i) => ({ text, correct: false, principleId: q.distractorPrincipleIds[i] })),
  ];
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }
  return opts;
}

/** Lesson holding the opponentMistake that a punish card exercises (card sits after that mistake). */
export function findPunishLesson(
  opening: OpeningRepertoireFile,
  lessons: Record<string, PositionLesson> | undefined,
  card: StoredFSRSCard
): PositionLesson | undefined {
  const ctx = card.mistakeContext;
  if (!lessons || !ctx) return undefined;
  return Object.values(lessons).find((l) => {
    const om = l.opponentMistake;
    if (!om || om.san !== ctx.opponentMistakeSan || om.punishSan !== card.correctMoveSan) return false;
    const next = opening.positions[l.normalizedFen]?.playerMove?.nextNormalizedFen;
    const mistakes = next ? opening.positions[next]?.commonMistakes : undefined;
    return Boolean(mistakes?.some((m) => m.opponentMoveSan === om.san && m.afterMistakeNormalizedFen === card.normalizedFen));
  });
}
