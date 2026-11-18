import React, { useMemo, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import type { ConceptPage, PositionLesson } from '../types/lessons';
import type { PlayerColor } from '../types/repertoire';
import { buildQuizOptions } from '../services/quiz';
import { RichText } from './RichText';

export const PlanQuiz: React.FC<{
  lesson: PositionLesson;
  concept?: ConceptPage;
  fen: string;
  orientation: PlayerColor;
  onNext: () => void;
}> = ({ lesson, concept, fen, orientation, onNext }) => {
  const quiz = lesson.planQuiz!;
  const options = useMemo(() => buildQuizOptions(quiz), [quiz]);
  const [picked, setPicked] = useState<number | null>(null);
  const chosen = picked === null ? null : options[picked];
  const principle = chosen && !chosen.correct ? concept?.principles.find((p) => p.id === chosen.principleId) : undefined;

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-4 space-y-4">
      <div className="aspect-square max-w-[480px] mx-auto rounded-[10px] overflow-hidden border border-border">
        <Chessboard
          id="quiz-board"
          position={fen}
          boardOrientation={orientation}
          arePiecesDraggable={false}
          customDarkSquareStyle={{ backgroundColor: '#b0957a' }}
          customLightSquareStyle={{ backgroundColor: '#eee6d3' }}
        />
      </div>
      <h2 className="text-lg">Qual è il piano giusto qui?</h2>
      <div className="space-y-2">
        {options.map((o, i) => {
          const state =
            picked === null ? 'border-border' : o.correct ? 'border-accent bg-accent/10' : i === picked ? 'border-danger bg-danger/10' : 'border-border opacity-60';
          return (
            <button
              key={i}
              disabled={picked !== null}
              onClick={() => setPicked(i)}
              className={`w-full text-left px-4 py-3 min-h-[44px] rounded-[10px] border bg-surface text-[15px] leading-snug transition ${state}`}
            >
              <RichText text={o.text} />
            </button>
          );
        })}
      </div>
      {chosen && (
        <div className="space-y-3">
          <p className={`text-[15px] font-semibold ${chosen.correct ? 'text-accent' : 'text-danger'}`}>
            {chosen.correct ? 'Giusto.' : 'Non è questo il piano.'}
          </p>
          {principle && (
            <div className="bg-surface border border-border rounded-xl p-4 space-y-1.5 text-[15px] leading-relaxed">
              <div className="text-[13px] font-semibold text-muted">Il principio che hai violato</div>
              <div>Se l&rsquo;avversario: <RichText text={principle.ifOpponent} /></div>
              <div>Tu: <RichText text={principle.thenI} /></div>
              <div className="text-sm text-muted"><RichText text={principle.why} /></div>
            </div>
          )}
          {!chosen.correct && (
            <p className="text-[15px] leading-relaxed">
              Il piano giusto: <RichText text={quiz.correct} />
            </p>
          )}
          <button onClick={onNext} className="btn-primary w-full">
            Continua
          </button>
        </div>
      )}
    </div>
  );
};
