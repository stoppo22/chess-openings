export function normalizeFen(fen) {
  const parts = fen.trim().split(/\s+/);
  return `${parts[0]} ${parts[1]} ${parts[2]} ${parts[3]}`;
}
