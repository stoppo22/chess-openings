import React from 'react';
import type { ConceptPage, PositionLesson } from '../types/lessons';
import { RichText } from './RichText';

const Fold: React.FC<{ title: React.ReactNode; children: React.ReactNode }> = ({ title, children }) => (
  <details className="border border-border rounded-[10px] bg-surface">
    <summary className="px-4 py-3 min-h-[44px] flex items-center cursor-pointer text-[15px] font-medium">{title}</summary>
    <p className="px-4 pb-3 text-[15px] leading-relaxed">{children}</p>
  </details>
);

export const LessonPanel: React.FC<{
  lesson: PositionLesson;
  concept?: ConceptPage;
  onOpenPrinciple?: (principleId: string) => void;
}> = ({ lesson, concept, onOpenPrinciple }) => {
  const refs = lesson.conceptRefs
    .map((id) => concept?.principles.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h3 className="text-base">Perché</h3>
        <p className="text-[15px] leading-relaxed">
          <RichText text={lesson.why} />
        </p>
      </div>
      {lesson.whyNot && (
        <Fold title={<span>E se gioco <RichText text={`[[${lesson.whyNot.san}]]`} />?</span>}>
          <RichText text={lesson.whyNot.text} />
        </Fold>
      )}
      {lesson.opponentMistake && (
        <Fold title="Se l'avversario sbaglia">
          <RichText text={lesson.opponentMistake.text} />
        </Fold>
      )}
      {refs.length > 0 && onOpenPrinciple && (
        <ul className="space-y-1">
          {refs.map((p) => (
            <li key={p.id}>
              <button
                onClick={() => onOpenPrinciple(p.id)}
                className="text-[13px] text-accent underline underline-offset-2 text-left min-h-[32px]"
              >
                Capisci il principio: <RichText text={p.ifOpponent} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
