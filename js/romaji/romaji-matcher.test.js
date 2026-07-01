// 手動スモークテスト。`node js/romaji/romaji-matcher.test.js` で実行できる。
import { buildMatchPlan, createMatcher } from './romaji-matcher.js';

function typeWord(kana, input) {
  const plan = buildMatchPlan(kana);
  const matcher = createMatcher(plan);
  const log = [];
  for (const ch of input) {
    log.push(matcher.pressKey(ch));
  }
  return { plan, log, progress: matcher.getProgress() };
}

function assert(cond, msg) {
  if (!cond) throw new Error('FAIL: ' + msg);
  console.log('ok -', msg);
}

// 1. 促音（っ）: らっこ -> rakko
{
  const { log, progress } = typeWord('らっこ', 'rakko');
  assert(log.every((r) => r.status !== 'mismatch'), 'rakko: no mismatches, got ' + JSON.stringify(log));
  assert(log[log.length - 1].isWordComplete, 'rakko: word completes');
  assert(progress.totalKeystrokes === 5, 'rakko: totalKeystrokes === 5, got ' + progress.totalKeystrokes);
}

// 2. 長音（ー）: いこーる -> iko-ru
{
  const { log } = typeWord('いこーる', 'iko-ru');
  assert(log.every((r) => r.status !== 'mismatch'), 'iko-ru: no mismatches, got ' + JSON.stringify(log));
  assert(log[log.length - 1].isWordComplete, 'iko-ru: word completes');
}

// 3. 拗音+ん: きんぎょ -> kingyo
{
  const { log } = typeWord('きんぎょ', 'kingyo');
  assert(log.every((r) => r.status !== 'mismatch'), 'kingyo: no mismatches, got ' + JSON.stringify(log));
  assert(log[log.length - 1].isWordComplete, 'kingyo: word completes');
}

// 4. 非正規ローマ字（し -> si）: あざらし
{
  const { log } = typeWord('あざらし', 'azarasi');
  assert(log.every((r) => r.status !== 'mismatch'), 'azarasi (si variant): no mismatches, got ' + JSON.stringify(log));
  assert(log[log.length - 1].isWordComplete, 'azarasi: word completes');
}

// 5. 誤入力はミスマッチになり、バッファはリセットされない状態異常を起こさない
{
  const plan = buildMatchPlan('たこ');
  const matcher = createMatcher(plan);
  const wrong = matcher.pressKey('x');
  assert(wrong.status === 'mismatch', 'tako: wrong key is mismatch');
  const right = matcher.pressKey('t');
  assert(right.status !== 'mismatch', 'tako: correct key after mismatch is accepted (pending), got ' + right.status);
}

// 6. じんべえざめ（じ + ん + べ + え + ざ + め）
{
  const { log, progress } = typeWord('じんべえざめ', 'jinbeezame');
  assert(log.every((r) => r.status !== 'mismatch'), 'jinbeezame: no mismatches, got ' + JSON.stringify(log));
  assert(progress.totalKeystrokes === 10, 'jinbeezame: totalKeystrokes === 10, got ' + progress.totalKeystrokes);
}

console.log('ALL ROMAJI MATCHER SMOKE TESTS PASSED');
