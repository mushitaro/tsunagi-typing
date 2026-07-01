/** 英語モード用の単純な文字一致マッチャー。romaji-matcher と同じインターフェースを持つ。 */
export function createPlainMatcher(targetText) {
  const target = targetText;
  let index = 0;

  function pressKey(rawChar) {
    const expected = target[index];
    if (expected === undefined) return { status: 'mismatch', isWordComplete: true };

    const char = expected === ' ' ? rawChar : rawChar.toLowerCase();
    if (char === expected || char.toLowerCase() === expected.toLowerCase()) {
      index += 1;
      return { status: 'advance', isWordComplete: index >= target.length };
    }
    return { status: 'mismatch', isWordComplete: false };
  }

  function getNextHintChar() {
    return target[index] ?? '';
  }

  function getProgress() {
    return { keystrokesDone: index, totalKeystrokes: target.length };
  }

  function reset() {
    index = 0;
  }

  return { pressKey, getNextHintChar, getProgress, reset };
}

export function totalKeystrokesFor(targetText) {
  return targetText.length;
}
