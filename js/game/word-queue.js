/**
 * 1ラウンド分の出題キュー。難易度でグループ化し、グループ内はシャッフル、
 * グループ順は易→難で並べることで緩やかな難易度上昇を作る。
 * カテゴリの語数がラウンドサイズより少ない場合は再シャッフルして繰り返す。
 */
export function createRoundQueue(words, roundSize = 10) {
  let pool = groupAndShuffleByDifficulty(words);
  let cursor = 0;
  let served = 0;

  function refillIfNeeded() {
    if (cursor >= pool.length) {
      pool = groupAndShuffleByDifficulty(words);
      cursor = 0;
    }
  }

  function next() {
    if (words.length === 0 || served >= roundSize) return null;
    refillIfNeeded();
    const word = pool[cursor];
    cursor += 1;
    served += 1;
    return word;
  }

  function progress() {
    return { current: served, total: roundSize };
  }

  return { next, progress };
}

function groupAndShuffleByDifficulty(words) {
  const byDifficulty = new Map();
  for (const w of words) {
    const d = w.difficulty ?? 1;
    if (!byDifficulty.has(d)) byDifficulty.set(d, []);
    byDifficulty.get(d).push(w);
  }
  const tiers = [...byDifficulty.keys()].sort((a, b) => a - b);
  const result = [];
  for (const tier of tiers) {
    result.push(...shuffle(byDifficulty.get(tier).slice()));
  }
  return result;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
