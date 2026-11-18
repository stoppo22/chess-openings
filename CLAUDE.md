# Chess Openings Trainer — regole di progetto

App React+Vite+TS (PWA offline, GitHub Pages) per studiare e ripassare repertori di aperture.
Utente: ~925 chess.com, poco tempo. Obiettivo: CAPIRE le aperture (concetti prima, mosse come conseguenza).
UI e lezioni in **italiano**. Notazione mosse: SAN inglese (Nf6, Bxe5, O-O).

## Git / deploy
- Lavoro sul branch `v2-repertoire`. MAI push su `main` né deploy senza OK esplicito (push su main = deploy).

## Pipeline dati (deterministica, tutto in cache in `.cache/`, gitignored)
- `npm run build:repertoire -- --opening=<id>` → `src/data/openings/<id>.json` (config in `scripts/openings/<id>/`).
- Scelta della MIA mossa: entro 0.30 dalla best di Stockfish, la più giocata nei Masters (≥50 partite);
  se Masters scarso: entro 0.15, la più giocata Lichess 2200+. Mosse avversarie: Lichess 0–1400.
- Stockfish 16 NNUE (npm `stockfish@16.0.0`), depth 18 multipv 6; errori avversari screen d14 → conferma d20.
- `npm run facts -- --opening=<id>` → schede dati in `.cache/facts/<id>/<variationId>.json`.
- `npm run lessons:verify -- --opening=<id>` → deve passare prima di ogni commit di lezioni.
- `npm run studies:import -- <url-studio>` → PGN + note in `.cache/studies/` (MAI nel repo).

## Regole di qualità dei contenuti (vincolanti)
1. Fatti (mosse, valutazioni, %) SOLO da: Lichess Masters, Lichess 2200+, Stockfish locale. Niente valutazioni stimate a mano.
2. Pagina concettuale per variante (`src/data/lessons/<id>/concepts/<variationId>.json`, tipo `ConceptPage`):
   scritta dall'orchestratore (Opus), approvata dall'utente (`approved: true`) PRIMA delle lezioni.
3. Lezioni per posizione (`src/data/lessons/<id>/<variationId>.json`, tipo `LessonFile`): scritte da `lesson-writer`
   solo da scheda dati + pagina concettuale. Mosse sempre come `[[SAN]]`; nessuna mossa/eval fuori scheda.
4. Fonti "Approfondisci": solo autori titolati (FM/IM/GM, titolo verificato su FIDE/Lichess), URL aperti davvero.
   Se nessuna fonte buona: "Basato su motore + database". Mai inventare riferimenti.
5. Copyright: mai copiare testo di studi/video/corsi. Idee riscritte con parole proprie + link. Verbatim solo con
   licenza aperta (CC-BY/CC0/CC BY-SA) e attribuzione. Divergenze studio vs dati → riportarle all'utente.
6. Stile per 850–1000: paragrafi corti, linguaggio semplice, ogni termine tecnico definito (glossario).
7. Pratica: oltre al richiamo mossa, quiz "scegli il piano", "perché è sbagliata?", "trova la punizione";
   su errore spiegare il concetto violato.

## Struttura
- `src/types/repertoire.ts` dati apertura · `src/types/lessons.ts` concetti/lezioni/fonti.
- `src/data/openings/index.ts` elenco aperture (lazy import). ID carte FSRS `${openingId}:${cardType}:${fen}`: non cambiarli.
- `src/services/` logica (fen, srs, storage, moveAnalyzer, middlegameIdeas) · `src/components/` modalità UI.
- `scripts/` build, fact sheet, verificatore, import studi.

## Comandi
`npm test` (vitest) · `npm run build` (tsc + vite) · `npm run dev`.

## Operatività (risparmio token)
- Orchestratore (Opus): architettura, scelte di repertorio, pagine concettuali, revisione. Lavoro meccanico ai subagent
  in `.claude/agents/` (mechanic, researcher, ui-dev, lesson-writer). Output dei subagent ≤10 righe.
- Non leggere JSON grandi per intero: grep/head/node -e. Tenere questo file < 60 righe.
