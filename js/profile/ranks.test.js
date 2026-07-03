// 手動スモークテスト。`node js/profile/ranks.test.js` で実行できる。
import { RANKS, RANK_COUNT, getRankForScore, getRankProgress } from './ranks.js';

function assert(cond, msg) {
  if (!cond) throw new Error('FAIL: ' + msg);
  console.log('ok -', msg);
}

// 1. ランクは15個ある
assert(RANK_COUNT === 15, `15 ranks defined, got ${RANK_COUNT}`);
assert(RANKS.length === 15, `RANKS length is 15, got ${RANKS.length}`);

// 2. level は 1..15 で連番、minScore は狭義単調増加、title/emoji は空でない
{
  let prevMin = -1;
  RANKS.forEach((r, i) => {
    assert(r.level === i + 1, `rank[${i}].level === ${i + 1}, got ${r.level}`);
    assert(r.minScore > prevMin, `rank[${i}].minScore (${r.minScore}) strictly increases`);
    assert(typeof r.title === 'string' && r.title.length > 0, `rank[${i}] has a title`);
    assert(typeof r.emoji === 'string' && r.emoji.length > 0, `rank[${i}] has an emoji`);
    prevMin = r.minScore;
  });
  assert(RANKS[0].minScore === 0, 'first rank starts at 0');
}

// 3. スコア0・負・NaN は最低ランク（level 1）
assert(getRankForScore(0).level === 1, 'score 0 -> level 1');
assert(getRankForScore(-100).level === 1, 'negative score -> level 1');
assert(getRankForScore(NaN).level === 1, 'NaN score -> level 1');
assert(getRankForScore(undefined).level === 1, 'undefined score -> level 1');

// 4. しきい値ちょうど・境界の手前で正しいランクに乗る
{
  for (const r of RANKS) {
    assert(getRankForScore(r.minScore).level === r.level, `score == minScore(${r.minScore}) -> level ${r.level}`);
    if (r.level > 1) {
      assert(getRankForScore(r.minScore - 1).level === r.level - 1, `score just below ${r.minScore} -> level ${r.level - 1}`);
    }
  }
}

// 5. 巨大スコアは最高ランク（level 15）で頭打ち
{
  const top = getRankForScore(9_999_999);
  assert(top.level === 15, `huge score -> top level 15, got ${top.level}`);
}

// 6. 進捗: 途中ランクは next あり・ratio が 0..1・remaining が正しい
{
  const p = getRankProgress(1000); // level 2 (500) と level 3 (1500) の間
  assert(p.current.level === 2, `1000 -> current level 2, got ${p.current.level}`);
  assert(p.next && p.next.level === 3, '1000 -> next level 3');
  assert(p.remaining === 500, `1000 -> remaining 500, got ${p.remaining}`);
  assert(Math.abs(p.ratio - 0.5) < 1e-9, `1000 -> ratio 0.5, got ${p.ratio}`);
  assert(p.isMax === false, '1000 -> not max');
}

// 7. 進捗: 最高ランクは next=null, ratio=1, remaining=0, isMax=true
{
  const p = getRankProgress(200000);
  assert(p.current.level === 15, 'max -> current level 15');
  assert(p.next === null, 'max -> next null');
  assert(p.ratio === 1, 'max -> ratio 1');
  assert(p.remaining === 0, 'max -> remaining 0');
  assert(p.isMax === true, 'max -> isMax true');
}

console.log('\nAll ranks tests passed.');
