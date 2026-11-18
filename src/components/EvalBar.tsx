import React from 'react';
import type { PlayerColor } from '../types/repertoire';

interface EvalBarProps {
  /** Valutazione in pedoni dal punto di vista di chi studia (> 0 = vantaggio tuo). */
  evalForPlayer: number | null;
  /** Variazione opzionale (positiva = a tuo favore); null/undefined = non mostrare. */
  deltaForPlayer?: number | null;
  /** Colore del giocatore: la sua metà della barra sta in basso, come la scacchiera. */
  playerColor?: PlayerColor;
  label?: string;
}

export const EvalBar: React.FC<EvalBarProps> = ({
  evalForPlayer,
  deltaForPlayer,
  playerColor = 'black',
  label,
}) => {
  const hasEval = evalForPlayer !== null;
  const ev = evalForPlayer ?? 0;
  const clamped = Math.max(-8, Math.min(8, ev));
  const playerPct = Math.round(50 + (Math.atan(clamped / 2.2) / (Math.PI / 2)) * 46);
  const formattedScore = hasEval ? `${ev >= 0 ? '+' : ''}${ev.toFixed(2)}` : '–';
  const playerIsAhead = ev >= 0;
  const playerFill = playerColor === 'white' ? '#e8e6e3' : '#1e1c1a';
  const opponentFill = playerColor === 'white' ? '#1e1c1a' : '#e8e6e3';
  const textOnPlayer = playerColor === 'white' ? 'text-[#161512]' : 'text-[#e8e6e3]';
  const textOnOpponent = playerColor === 'white' ? 'text-[#e8e6e3]' : 'text-[#161512]';

  return (
    <div
      className="flex flex-col items-center select-none shrink-0"
      title={
        label ||
        (hasEval
          ? `Valutazione per te: ${formattedScore} pedoni (${playerIsAhead ? 'vantaggio tuo' : 'vantaggio avversario'})`
          : 'Valutazione non disponibile')
      }
    >
      <div
        className="w-7 sm:w-8 h-full min-h-[280px] rounded overflow-hidden border border-[#3c3934] flex flex-col justify-between relative shadow-inner"
        style={{ backgroundColor: opponentFill }}
      >
        <div
          className="w-full transition-all duration-300 ease-out"
          style={{ height: `${100 - playerPct}%`, backgroundColor: opponentFill }}
        />
        <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-[#81b64c]/60 z-10 pointer-events-none" />
        <div
          className="w-full transition-all duration-300 ease-out"
          style={{ height: `${playerPct}%`, backgroundColor: playerFill }}
        />
        <div
          className={`absolute left-0 right-0 text-center text-[10px] sm:text-[11px] font-mono font-bold tabular-nums leading-none px-0.5 z-20 ${
            playerIsAhead ? `bottom-1.5 ${textOnPlayer}` : `top-1.5 ${textOnOpponent}`
          }`}
        >
          {formattedScore}
        </div>
      </div>

      {typeof deltaForPlayer === 'number' && Math.abs(deltaForPlayer) >= 0.25 && (
        <div
          className={`mt-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tabular-nums border ${
            deltaForPlayer > 0
              ? 'bg-[#81b64c]/20 text-[#81b64c] border-[#81b64c]/50'
              : 'bg-[#b33430]/20 text-[#f29b98] border-[#b33430]/50'
          }`}
        >
          {deltaForPlayer > 0 ? `+${deltaForPlayer.toFixed(1)}` : deltaForPlayer.toFixed(1)}
        </div>
      )}
    </div>
  );
};
