import type { ConceptPage, LessonFile, PositionLesson } from '../../types/lessons';

export interface LoadedLessons {
  concepts: Record<string, ConceptPage>;
  lessons: Record<string, PositionLesson>;
}

const files = import.meta.glob('./**/*.json', { import: 'default' }) as Record<string, () => Promise<unknown>>;

/** Pure: only approved concept pages are exposed; lessons are keyed by normalizedFen. */
export function assembleLessons(concepts: ConceptPage[], lessonFiles: LessonFile[]): LoadedLessons {
  const out: LoadedLessons = { concepts: {}, lessons: {} };
  for (const c of concepts) if (c.approved === true) out.concepts[c.variationId] = c;
  for (const f of lessonFiles) for (const l of f.lessons ?? []) out.lessons[l.normalizedFen] = l;
  return out;
}

export async function loadLessons(openingId: string): Promise<LoadedLessons> {
  const prefix = `./${openingId}/`;
  const keys = Object.keys(files).filter((k) => k.startsWith(prefix));
  const loaded = await Promise.all(keys.map(async (k) => [k, await files[k]()] as const));
  const isConcept = (k: string) => k.startsWith(`${prefix}concepts/`);
  return assembleLessons(
    loaded.filter(([k]) => isConcept(k)).map(([, v]) => v as ConceptPage),
    loaded.filter(([k]) => !isConcept(k)).map(([, v]) => v as LessonFile)
  );
}
