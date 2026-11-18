import React from 'react';

export const WdlLegend: React.FC = () => (
  <div className="flex items-center gap-4 text-[13px] text-muted">
    <span className="inline-flex items-center gap-1.5">
      <i className="w-3 h-3 rounded-sm border border-border bg-[#F4F1E8]" /> Bianco
    </span>
    <span className="inline-flex items-center gap-1.5">
      <i className="w-3 h-3 rounded-sm border border-border bg-[#9A9486]" /> Patta
    </span>
    <span className="inline-flex items-center gap-1.5">
      <i className="w-3 h-3 rounded-sm border border-border bg-[#2A2823]" /> Nero
    </span>
  </div>
);

export const WdlBar: React.FC<{
  white: number;
  draw: number;
  black: number;
  height?: string;
  showLabels?: boolean;
}> = ({ white, draw, black, height = 'h-3', showLabels = false }) => {
  const seg = (pct: number, bg: string, fg: string, name: string) => (
    <div
      style={{ width: `${pct}%`, backgroundColor: bg, color: fg }}
      className="flex items-center justify-center overflow-hidden text-[12px] font-medium"
      title={`${name}: ${pct}%`}
    >
      {showLabels && pct >= 12 ? `${pct}%` : ''}
    </div>
  );
  return (
    <div
      role="img"
      aria-label={`Bianco ${white}%, patta ${draw}%, nero ${black}%`}
      className={`w-full ${height} rounded-full overflow-hidden flex border border-border`}
    >
      {seg(white, '#F4F1E8', '#1D1B17', 'Bianco')}
      {seg(draw, '#9A9486', '#1D1B17', 'Patta')}
      {seg(black, '#2A2823', '#F4F1E8', 'Nero')}
    </div>
  );
};
