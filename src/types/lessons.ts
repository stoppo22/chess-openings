/**
 * Contratto per pagine concettuali e lezioni per posizione.
 * Nel testo le mosse si scrivono SEMPRE come [[SAN]] (es. "[[Nf6]]", "[[c5]]", "[[O-O]]"):
 * il verificatore controlla ogni [[...]] e rifiuta mosse di pezzo scritte fuori markup.
 * Le case restano testo normale ("la casa d4"). Vietati numeri di valutazione non presenti nella scheda dati.
 */

export type SourceKind = 'lichess-study' | 'youtube' | 'wikibooks' | 'article';
export type ChessTitle = 'GM' | 'IM' | 'FM' | 'WGM' | 'WIM' | 'WFM' | 'CM' | 'NM';

export interface Source {
  kind: SourceKind;
  title: string;
  author: string;
  authorTitle: ChessTitle;
  /** Dove è stato verificato il titolo (profilo FIDE o Lichess). */
  titleVerifiedAt: string;
  url: string;
  /** Solo se il testo è riusato alla lettera (es. "CC BY-SA 4.0"). */
  license?: string;
  verifiedOn: string; // YYYY-MM-DD in cui l'URL è stato aperto e controllato
}

export interface GlossaryEntry {
  term: string;
  definition: string;
}

export interface ConceptPrinciple {
  id: string; // es. "p-c5-break", referenziato dalle lezioni
  ifOpponent: string;
  thenI: string;
  why: string;
}

export interface PiecePlan {
  piece: string; // es. "Alfiere camposcuro"
  squares: string[]; // es. ["f4", "d3"]
  why: string;
}

export interface ConceptPage {
  openingId: string;
  variationId: string;
  title: string;
  summary: string;
  pawnStructure: { description: string; forMe: string; forOpponent: string };
  myPlan: string[];
  opponentPlan: string[];
  pieces: PiecePlan[];
  breaks: string[];
  tactics: string[];
  traps: string[];
  principles: ConceptPrinciple[];
  glossary: GlossaryEntry[];
  /** Vuoto => la UI mostra "Basato su motore + database". */
  sources: Source[];
  /** true solo dopo l'approvazione esplicita dell'utente. */
  approved: boolean;
}

export interface PlanQuiz {
  correct: string;
  distractors: string[]; // 2-3 piani plausibili ma sbagliati
  /** id del principio violato da ciascun distrattore (stesso ordine). */
  distractorPrincipleIds: string[];
}

export interface PositionLesson {
  normalizedFen: string; // nodo in cui tocca a me
  variationId: string;
  why: string; // PERCHÉ la mia mossa
  /** La alternativa "naturale": san deve stare in playerMove.alternatives. */
  whyNot?: { san: string; text: string };
  /** Errore tipico dell'avversario dopo la mia mossa: san/punishSan devono stare in commonMistakes. */
  opponentMistake?: { san: string; punishSan: string; text: string };
  conceptRefs: string[]; // id di ConceptPrinciple
  planQuiz?: PlanQuiz;
}

export interface LessonFile {
  openingId: string;
  variationId: string;
  writtenBy: string; // es. "lesson-writer (sonnet)"
  /** Hash della scheda dati usata: se cambia, le lezioni vanno riverificate. */
  factsHash: string;
  lessons: PositionLesson[];
}
