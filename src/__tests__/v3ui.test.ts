import { describe, expect, it } from 'vitest';
import { parseRichText } from '../components/RichText';
import { assembleLessons } from '../data/lessons';
import { buildQuizOptions } from '../services/quiz';
import type { ConceptPage, LessonFile } from '../types/lessons';

describe('parseRichText', () => {
  it('splits [[SAN]] into move parts', () => {
    expect(parseRichText('Gioca [[Bf5]] e poi [[O-O]].')).toEqual([
      { move: false, value: 'Gioca ' },
      { move: true, value: 'Bf5' },
      { move: false, value: ' e poi ' },
      { move: true, value: 'O-O' },
      { move: false, value: '.' },
    ]);
    expect(parseRichText('solo testo')).toHaveLength(1);
  });
});

describe('assembleLessons', () => {
  it('exposes only approved concept pages and keys lessons by fen', () => {
    const c = (v: string, approved: boolean) => ({ variationId: v, approved }) as ConceptPage;
    const f = { lessons: [{ normalizedFen: 'fen1' }] } as LessonFile;
    const r = assembleLessons([c('a', true), c('b', false)], [f]);
    expect(Object.keys(r.concepts)).toEqual(['a']);
    expect(r.lessons.fen1).toBeDefined();
  });
});

describe('buildQuizOptions', () => {
  const q = { correct: 'C', distractors: ['D1', 'D2'], distractorPrincipleIds: ['p1', 'p2'] };
  it('keeps all options, marks only the correct one, carries principle ids', () => {
    for (const rng of [() => 0, () => 0.99, Math.random]) {
      const o = buildQuizOptions(q, rng);
      expect(o.map((x) => x.text).sort()).toEqual(['C', 'D1', 'D2']);
      expect(o.filter((x) => x.correct).map((x) => x.text)).toEqual(['C']);
      expect(o.find((x) => x.text === 'D2')?.principleId).toBe('p2');
    }
  });
});
