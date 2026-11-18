import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { ConceptPage } from '../types/lessons';
import { RichText } from './RichText';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="space-y-2">
    <h2 className="text-xl">{title}</h2>
    {children}
  </section>
);

const Bullets: React.FC<{ items: string[] }> = ({ items }) =>
  items.length === 0 ? null : (
    <ul className="list-disc pl-5 space-y-1.5 text-[15px] leading-relaxed">
      {items.map((t, i) => (
        <li key={i}>
          <RichText text={t} />
        </li>
      ))}
    </ul>
  );

const P: React.FC<{ text: string }> = ({ text }) => (
  <p className="text-[15px] leading-relaxed">
    <RichText text={text} />
  </p>
);

export const ConceptView: React.FC<{ page: ConceptPage; principleId?: string; onBack: () => void }> = ({
  page,
  principleId,
  onBack,
}) => {
  useEffect(() => {
    const el = principleId ? document.getElementById(`principle-${principleId}`) : null;
    if (el) el.scrollIntoView({ block: 'center' });
    else window.scrollTo(0, 0);
  }, [principleId, page]);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-7">
      <div className="flex items-center gap-2">
        <button onClick={onBack} aria-label="Indietro" className="btn-ghost !px-0 w-11 shrink-0">
          <ArrowLeft size={18} strokeWidth={1.75} />
        </button>
        <h1 className="text-[24px] sm:text-3xl leading-tight">{page.title}</h1>
      </div>
      <P text={page.summary} />

      <Section title="Struttura dei pedoni">
        <P text={page.pawnStructure.description} />
        <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
          <div>
            <div className="text-[13px] font-semibold text-accent">Per te</div>
            <P text={page.pawnStructure.forMe} />
          </div>
          <div>
            <div className="text-[13px] font-semibold text-muted">Per l&rsquo;avversario</div>
            <P text={page.pawnStructure.forOpponent} />
          </div>
        </div>
      </Section>

      <Section title="Il tuo piano">
        <Bullets items={page.myPlan} />
      </Section>
      <Section title="Il piano dell'avversario">
        <Bullets items={page.opponentPlan} />
      </Section>

      {page.pieces.length > 0 && (
        <Section title="Dove vanno i pezzi">
          <ul className="bg-surface border border-border rounded-xl divide-y divide-border">
            {page.pieces.map((p, i) => (
              <li key={i} className="p-4 space-y-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-semibold">{p.piece}</span>
                  <span className="text-[13px] text-muted tabular-nums">{p.squares.join(' · ')}</span>
                </div>
                <P text={p.why} />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {page.breaks.length > 0 && (
        <Section title="Rotture">
          <Bullets items={page.breaks} />
        </Section>
      )}
      {page.tactics.length > 0 && (
        <Section title="Temi tattici">
          <Bullets items={page.tactics} />
        </Section>
      )}
      {page.traps.length > 0 && (
        <Section title="Trappole">
          <Bullets items={page.traps} />
        </Section>
      )}

      {page.principles.length > 0 && (
        <Section title="Se l'avversario fa… tu fai…">
          <div className="space-y-3">
            {page.principles.map((p) => (
              <div
                key={p.id}
                id={`principle-${p.id}`}
                className={`bg-surface border rounded-xl p-4 space-y-2 scroll-mt-4 ${
                  p.id === principleId ? 'border-accent' : 'border-border'
                }`}
              >
                <div className="text-[15px] leading-relaxed">
                  <span className="text-[13px] font-semibold text-muted block">Se l&rsquo;avversario</span>
                  <RichText text={p.ifOpponent} />
                </div>
                <div className="text-[15px] leading-relaxed">
                  <span className="text-[13px] font-semibold text-accent block">Tu</span>
                  <RichText text={p.thenI} />
                </div>
                <div className="text-sm text-muted leading-relaxed">
                  <RichText text={p.why} />
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {page.glossary.length > 0 && (
        <Section title="Glossario">
          <dl className="space-y-2 text-[15px] leading-relaxed">
            {page.glossary.map((g) => (
              <div key={g.term}>
                <dt className="font-semibold inline">{g.term}</dt>
                <dd className="inline">
                  {' — '}
                  <RichText text={g.definition} />
                </dd>
              </div>
            ))}
          </dl>
        </Section>
      )}

      <Section title="Approfondisci">
        {page.sources.length === 0 ? (
          <p className="text-sm text-muted">Basato su motore + database (Stockfish 16, Lichess Masters, Lichess 0–1400)</p>
        ) : (
          <ul className="space-y-2 text-[15px]">
            {page.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2 break-words">
                  {s.title}
                </a>
                <span className="text-muted">
                  {' '}
                  · {s.authorTitle} {s.author}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>
      <button onClick={onBack} className="btn-secondary w-full">
        Torna indietro
      </button>
    </div>
  );
};
