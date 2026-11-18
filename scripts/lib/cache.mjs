import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../../.cache');
let last = 0;

/** Text cache: file `.cache/<dir>/<key>` (key includes its extension). */
export async function cachedText(dir, key, fetcher) {
  const f = path.join(ROOT, dir, key);
  if (fs.existsSync(f)) return fs.readFileSync(f, 'utf8');
  const text = await fetcher();
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, text);
  return text;
}

export async function cachedJson(dir, key, fetcher) {
  return JSON.parse(await cachedText(dir, key, async () => JSON.stringify(await fetcher())));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Polite GET returning text: >=1s between requests, one retry after 60s on HTTP 429. */
export async function politeFetch(url, { retryMs = 60000, gapMs = 1000 } = {}) {
  for (let attempt = 0; ; attempt++) {
    await sleep(Math.max(0, last + gapMs - Date.now()));
    last = Date.now();
    const res = await fetch(url, { headers: { 'User-Agent': 'chess-openings-study-tool/1.0' } });
    if (res.status === 429 && attempt === 0) { await sleep(retryMs); continue; }
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return res.text();
  }
}
