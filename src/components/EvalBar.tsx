import React from 'react';

interface EvalBarProps {
  /**
   * Valutazione in pedoni dal punto di vista del NERO (giocatore del repertorio):
   *   > 0 = vantaggio Nero (es. +1.50 significa Nero avanti di 1.5 pedoni)
   *   < 0 = vantaggio Bianco (es. -0.40 significa Bianco avanti di 0.4 pedoni)
   */
  evalForBlack: number;
  /**
   * Variazione opzionale rispetto alla mossa precedente (es. +1.80 su errore avversario, -0.90 su tuo errore)
   */
  deltaForBlack?: number | null;
  label?: string;
}

export const EvalBar: React.FC<EvalBarProps> = ({ evalForBlack, deltaForBlack, label }) => {
  // Mappa non lineare morbida (stile Lichess/Chess.com):
  // 0.0 -> 50%, +2.0 -> ~73%, +5.0 -> ~92%, -2.0 -> ~27%
  const clamped = Math.max(-8, Math.min(8, evalForBlack));
  const blackPct = Math.round(50 + (Math.atan(clamped / 2.2) / (Math.PI / 2)) * 46);

  // Notazione standard scacchistica (con segno dal punto di vista del Nero per chiarezza, o classico)
  const formattedScore = `${evalForBlack >= 0 ? '+' : ''}${evalForBlack.toFixed(2)}`;
  const blackIsAhead = evalForBlack >= 0;

  return (
    <div
      className="flex flex-col items-center select-none shrink-0"
      title={
        label ||
        `Valutazione per il Nero: ${formattedScore} pedoni (${
          blackIsAhead ? 'Vantaggio Nero' : 'Vantaggio Bianco'
        })`
      }
    >
      {/* Barra verticale: Bianco in alto, Nero in basso (poiché la scacchiera è orientata col Nero in basso) */}
      <div className="w-7 sm:w-8 h-full min-h-[280px] rounded overflow-hidden border border-[#3c3934] bg-[#e8e6e3] flex flex-col justify-between relative shadow-inner">
        {/* Parte superiore: Bianco */}
        <div
          className="w-full bg-[#e8e6e3] transition-all duration-300 ease-out"
          style={{ height: `${100 - blackPct}%` }}
        />

        {/* Linea centrale dello 0.00 */}
        <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-[#81b64c]/60 z-10 pointer-events-none" />

        {/* Parte inferiore: Nero */}
        <div
          className="w-full bg-[#1e1c1a] transition-all duration-300 ease-out"
          style={{ height: `${blackPct}%` }}
        />

        {/* Etichetta numerica del punteggio */}
        <div
          className={`absolute left-0 right-0 text-center text-[10px] sm:text-[11px] font-mono font-bold tabular-nums leading-none px-0.5 z-20 ${
            blackIsAhead ? 'bottom-1.5 text-[#e8e6e3]' : 'top-1.5 text-[#161512]'
          }`}
        >
          {formattedScore}
        </div>
      </div>

      {/* Badge delta se c'è stato uno spostamento (errore avversario o mossa sbagliata) */}
      {typeof deltaForBlack === 'number' && Math.abs(deltaForBlack) >= 0.25 && (
        <div
          className={`mt-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tabular-nums border ${
            deltaForBlack > 0
              ? 'bg-[#81b64c]/20 text-[#81b64c] border-[#81b64c]/50'
              : 'bg-[#b33430]/20 text-[#f29b98] border-[#b33430]/50'
          }`}
        >
          {deltaForBlack > 0 ? `+${deltaForBlack.toFixed(1)}` : deltaForBlack.toFixed(1)}
        </div>
      )}
    </div>
  );
};
