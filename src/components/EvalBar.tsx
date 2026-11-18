import React from 'react';
import type { PlayerColor } from '../types/repertoire';

interface EvalBarProps {
  /** Valutazione in pedoni dal punto di vista di chi studia (> 0 = vantaggio tuo). */
  evalForPlayer: number | null;
  /** Variazione opzionale (positiva = a tuo favore); null/undefined = non mostrare. */
  deltaForPlayer?: number | null;
  /** Colore del giocatore: la sua metà della barra sta in basso / a sinistra. */
  playerColor?: PlayerColor;
  label?: string;
  /** 'auto': orizzontale sotto la scacchiera su telefono, verticale accanto da 1024px. */
  orientation?: 'auto' | 'vertical' | 'horizontal';
}

const WHITE = '#F4F1E8';
const BLACK = '#2A2823';

export const EvalBar: React.FC<EvalBarProps> = ({
  evalForPlayer,
  deltaForPlayer,
  playerColor = 'black',
  label,
  orientation = 'auto',
}) => {
  const hasEval = evalForPlayer !== null;
  const ev = evalForPlayer ?? 0;
  const clamped = Math.max(-8, Math.min(8, ev));
  const playerPct = Math.round(50 + (Math.atan(clamped / 2.2) / (Math.PI / 2)) * 46);
  const formattedScore = hasEval ? `${ev >= 0 ? '+' : ''}${ev.toFixed(2)}` : '–';
  const playerIsAhead = ev >= 0;
  const playerFill = playerColor === 'white' ? WHITE : BLACK;
  const opponentFill = playerColor === 'white' ? BLACK : WHITE;
  const hasDelta = typeof deltaForPlayer === 'number' && Math.abs(deltaForPlayer) >= 0.25;
  const delta = hasDelta ? (deltaForPlayer as number) : 0;
  const deltaText = delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1);
  const deltaClass = delta > 0 ? 'text-accent' : 'text-danger';

  const showH = orientation !== 'vertical';
  const showV = orientation !== 'horizontal';
  const hCls = orientation === 'auto' ? 'lg:hidden' : '';
  const vCls = orientation === 'auto' ? 'hidden lg:flex' : 'flex';

  return (
    <div
      className="order-2 lg:order-1 shrink-0 select-none"
      title={
        label ||
        (hasEval
          ? `Valutazione per te: ${formattedScore} pedoni (${playerIsAhead ? 'vantaggio tuo' : 'vantaggio avversario'})`
          : 'Valutazione non disponibile')
      }
    >
      {showH && (
        <div className={`flex items-center gap-3 ${hCls}`}>
          <div
            className="flex-1 h-1.5 rounded-full overflow-hidden border border-border flex"
            style={{ backgroundColor: opponentFill }}
          >
            <div
              className="h-full transition-all duration-300"
              style={{ width: `${playerPct}%`, backgroundColor: playerFill }}
            />
          </div>
          <div className="flex items-baseline gap-1.5 min-w-[88px] justify-end text-sm tabular-nums">
            <span className="font-semibold text-text">{formattedScore}</span>
            {hasDelta && <span className={`${deltaClass} text-[13px]`}>({deltaText})</span>}
          </div>
        </div>
      )}

      {showV && (
        <div className={`${vCls} flex-col items-center h-full w-12`}>
          <div
            className="w-full flex-1 min-h-[280px] rounded-[10px] overflow-hidden border border-border flex flex-col justify-end relative"
            style={{ backgroundColor: opponentFill }}
          >
            <div
              className="w-full transition-all duration-300"
              style={{ height: `${playerPct}%`, backgroundColor: playerFill }}
            />
            <div
              className="absolute left-0 right-0 text-center text-[12px] font-semibold tabular-nums leading-none"
              style={{
                [playerIsAhead ? 'bottom' : 'top']: 6,
                color: playerIsAhead
                  ? playerColor === 'white' ? BLACK : WHITE
                  : playerColor === 'white' ? WHITE : BLACK,
              }}
            >
              {formattedScore}
            </div>
          </div>
          {hasDelta && (
            <div className={`mt-2 text-[13px] font-semibold tabular-nums ${deltaClass}`}>
              {deltaText}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
