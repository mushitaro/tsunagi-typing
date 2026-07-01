import { buildMatchPlan, createMatcher } from '../romaji/romaji-matcher.js';
import { createPlainMatcher } from '../romaji/plain-matcher.js';

/**
 * 1単語ぶんの入力セッション。画面表示・破壊マッピング双方が使う統一APIを提供する。
 *
 * 入力方式は言語ではなく単語エントリの形で決まる:
 *   typing.kana がある       → ローマ字/かな入力（romaji-matcher）
 *   typing.targetText のみ   → 直接入力（plain-matcher）— EN全般、および
 *                               さんすうの数字・記号（例:「15」→ 1,5 / 「+」→ + をそのまま打つ）
 */
export function createTypingSession(wordEntry) {
  const isRomaji = !!wordEntry.typing.kana;
  let plan = null;
  let matcher;

  if (isRomaji) {
    plan = buildMatchPlan(wordEntry.typing.kana);
    matcher = createMatcher(plan);
  } else {
    matcher = createPlainMatcher(wordEntry.typing.targetText);
  }

  function pressKey(rawChar) {
    const keystrokesDoneBefore = matcher.getProgress().keystrokesDone;
    const result = matcher.pressKey(rawChar);
    const keystrokesDoneAfter = matcher.getProgress().keystrokesDone;
    return { ...result, keystrokesDoneBefore, keystrokesDoneAfter };
  }

  function getHintChar() {
    return matcher.getNextHintChar();
  }

  function getTotalKeystrokes() {
    return matcher.getProgress().totalKeystrokes;
  }

  function getKeystrokesDone() {
    return matcher.getProgress().keystrokesDone;
  }

  /**
   * キャプション表示用のセグメント配列を返す。
   * ローマ字入力はユニット（かな1〜2文字ぶん）単位、直接入力は1文字単位。
   * state: 'done' | 'current' | 'pending'
   */
  function getDisplaySegments() {
    if (isRomaji) {
      const { cursorUnit } = matcher.getProgress();
      return plan.units.map((u, i) => ({
        text: u.displayRomaji,
        state: i < cursorUnit ? 'done' : i === cursorUnit ? 'current' : 'pending',
      }));
    }
    const { keystrokesDone } = matcher.getProgress();
    return Array.from(wordEntry.typing.targetText).map((ch, i) => ({
      text: ch,
      state: i < keystrokesDone ? 'done' : i === keystrokesDone ? 'current' : 'pending',
    }));
  }

  return {
    pressKey,
    getHintChar,
    getTotalKeystrokes,
    getKeystrokesDone,
    getDisplaySegments,
  };
}
