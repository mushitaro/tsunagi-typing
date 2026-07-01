/**
 * スコア・コンボ管理。ミス入力ではコンボは一切減らない（無罰デザイン）。
 * コンボは単語を打ち終えるたびにのみ増える。
 */
export function createScoreTracker() {
  let score = 0;
  let combo = 0;
  let wordsCleared = 0;

  function addWordClear(difficulty = 1, timeMs = 0) {
    combo += 1;
    const base = 100 * difficulty;
    const comboBonus = Math.min(combo - 1, 10) * 10;
    const speedBonus = timeMs > 0 && timeMs < 4000 ? 30 : 0;
    const points = base + comboBonus + speedBonus;
    score += points;
    wordsCleared += 1;
    return points;
  }

  function getScore() {
    return score;
  }

  function getCombo() {
    return combo;
  }

  function getWordsCleared() {
    return wordsCleared;
  }

  function reset() {
    score = 0;
    combo = 0;
    wordsCleared = 0;
  }

  return { addWordClear, getScore, getCombo, getWordsCleared, reset };
}
