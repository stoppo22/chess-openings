import { Chess } from 'chess.js';

const ANN = { '!': 1, '?': 2, '!!': 3, '??': 4, '!?': 5, '?!': 6 };
export const normFen = (fen) => fen.split(' ').slice(0, 4).join(' ');

/** Extract [%cal ..] / [%csl ..] drawings and return the clean comment text. */
export function parseComment(raw) {
  const arrows = [];
  const text = raw.replace(/\[%(cal|csl)\s+([^\]]*)\]/g, (_, kind, body) => {
    for (const t of body.split(',')) {
      const m = t.trim().match(/^([GRYB])([a-h][1-8])([a-h][1-8])?$/);
      if (m) arrows.push({ color: m[1], from: m[2], to: m[3] ?? m[2] });
    }
    return '';
  }).replace(/\[%[a-z]+\s+[^\]]*\]/g, '').replace(/\s+/g, ' ').trim();
  return { text, arrows };
}

function parseMovetext(src) {
  let i = 0;
  const root = { moves: [], comment: '', arrows: [], result: '*' };
  const stack = [root.moves];
  let last = null; // last move node in current list
  const addComment = (raw) => {
    const { text, arrows } = parseComment(raw);
    if (last) { last.comment = [last.comment, text].filter(Boolean).join(' '); last.arrows.push(...arrows); }
    else { root.comment = [root.comment, text].filter(Boolean).join(' '); root.arrows.push(...arrows); }
  };
  const lasts = [];
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === '{') { const e = src.indexOf('}', i); if (e < 0) throw new Error('unterminated comment'); addComment(src.slice(i + 1, e)); i = e + 1; continue; }
    if (c === ';') { const e = src.indexOf('\n', i); i = e < 0 ? src.length : e; continue; }
    if (c === '(') {
      if (!last) throw new Error('variation without a move');
      const v = []; last.variations.push(v); lasts.push(last); stack.push(v); last = null; i++; continue;
    }
    if (c === ')') {
      if (stack.length < 2) throw new Error('unbalanced )');
      stack.pop(); last = lasts.pop(); i++; continue;
    }
    let j = i; while (j < src.length && !/[\s{}();]/.test(src[j])) j++;
    let tok = src.slice(i, j); i = j;
    if (/^\$\d+$/.test(tok)) { if (last) last.nags.push(+tok.slice(1)); continue; }
    if (/^(1-0|0-1|1\/2-1\/2|\*)$/.test(tok)) { if (stack.length === 1) root.result = tok; continue; }
    tok = tok.replace(/^\d+\.+/, '');
    if (!tok) continue;
    const nags = [];
    const m = tok.match(/(!!|\?\?|!\?|\?!|!|\?)$/);
    if (m) { nags.push(ANN[m[1]]); tok = tok.slice(0, -m[1].length); }
    if (!tok) continue;
    last = { san: tok, nags, comment: '', arrows: [], variations: [] };
    stack[stack.length - 1].push(last);
  }
  if (stack.length !== 1) throw new Error('unbalanced (');
  return root;
}

/** Parse a multi-game PGN into [{headers, comment, arrows, result, moves}]. */
export function parsePgn(text) {
  const games = [];
  let headers = null, body = [];
  const flush = () => {
    if (!headers && !body.join('').trim()) return;
    games.push({ headers: headers ?? {}, ...parseMovetext(body.join('\n')) });
    headers = null; body = [];
  };
  for (const line of text.replace(/\r/g, '').split('\n')) {
    const h = line.match(/^\[(\w+)\s+"(.*)"\]\s*$/);
    if (h) { if (body.join('').trim()) flush(); (headers ??= {})[h[1]] = h[2]; }
    else body.push(line);
  }
  flush();
  return games;
}

/**
 * Walk the move tree validating every move with chess.js (throws on illegal).
 * onMove({fenBefore, fenAfter, san, nags, arrows, comment}) fires for every move incl. variations;
 * returns leaf lines [{movesSan, endFen}].
 */
export function walkGame(game, onMove = () => {}) {
  const lines = [];
  const rec = (nodes, fen, prefix) => {
    for (const n of nodes) {
      for (const v of n.variations) rec(v, fen, prefix);
      const ch = new Chess(fen);
      let mv;
      try { mv = ch.move(n.san); } catch { throw new Error(`illegal move ${n.san} at ${fen}`); }
      const after = ch.fen();
      onMove({ fenBefore: fen, fenAfter: after, san: mv.san, nags: n.nags, arrows: n.arrows, comment: n.comment });
      fen = after; prefix = [...prefix, mv.san];
    }
    lines.push({ movesSan: prefix, endFen: fen });
  };
  rec(game.moves, game.headers.FEN ?? new Chess().fen(), []);
  return lines;
}
