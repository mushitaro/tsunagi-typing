import { buildMatchPlan, createMatcher } from '../romaji/romaji-matcher.js';
import { createPlainMatcher } from '../romaji/plain-matcher.js';

/**
 * 1単語ぶんの入力セッション。JA/ENの違いを吸収し、画面表示・破壊マッピング双方が使う統一APIを提供する。
 */
export function createTypingSession(wordEntry, lang) {
  const isJa = lang === 'ja';
  let plan = null;
  let matcher;

  if (isJa) {
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
   * JAはユニット（かな1〜2文字ぶん）単位、ENは1文字単位。
   * state: 'done' | 'current' | 'pending'
   */
  function getDisplaySegments() {
    if (isJa) {
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
