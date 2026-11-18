import React from 'react';
import { ArrowLeft } from 'lucide-react';

/** Barra superiore compatta: indietro, titolo, linea corrente scorrevole, slot opzionale. */
export const ModeHeader: React.FC<{
  onBack: () => void;
  title: React.ReactNode;
  line?: string;
  children?: React.ReactNode;
}> = ({ onBack, title, line, children }) => (
  <div className="bg-surface border border-border rounded-xl px-3 py-2 space-y-2">
    <div className="flex items-center gap-2">
      <button
        onClick={onBack}
        aria-label="Torna alla schermata iniziale"
        className="btn-ghost !px-0 w-11 shrink-0"
      >
        <ArrowLeft size={18} strokeWidth={1.75} />
      </button>
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-semibold truncate">{title}</div>
        <div className="scroll-row text-[13px] text-muted" tabIndex={0} aria-label="Linea corrente">
          {line || 'Posizione iniziale'}
        </div>
      </div>
    </div>
    {children}
  </div>
);
