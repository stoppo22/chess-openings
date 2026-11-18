import React from 'react';

export type RichPart = { move: boolean; value: string };

/** "gioca [[Bf5]] ora" -> [{text},{move Bf5},{text}] */
export function parseRichText(text: string): RichPart[] {
  return text
    .split(/\[\[(.+?)\]\]/)
    .map((value, i) => ({ move: i % 2 === 1, value }))
    .filter((p) => p.move || p.value !== '');
}

export const RichText: React.FC<{ text: string }> = ({ text }) => (
  <>
    {parseRichText(text).map((p, i) =>
      p.move ? (
        <span key={i} className="font-semibold tabular-nums bg-bg border border-border rounded px-1 mx-px whitespace-nowrap">
          {p.value}
        </span>
      ) : (
        <React.Fragment key={i}>{p.value}</React.Fragment>
      )
    )}
  </>
);
