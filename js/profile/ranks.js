/**
 * 称号（ランク）の定義とユーティリティ。
 *
 * 各ラウンドで得たスコアはプロフィールごとに積算され（profile.totalScore）、
 * その積算スコアに応じて「称号」がもらえる。称号は全部で15ランクあり、
 * 名前はこどもがよろこぶ、ちょっとおもしろい海のいきもの風の名前にしてある。
 *
 * ラダーは1本（＝ユーザーごとの積算スコアで決まる1系統）。
 * しきい値 minScore は昇順で、最初はすぐ上がって、上位ほどじっくり伸びるようにしてある。
 *
 * 外部依存なし・素の ES Module。
 */

/**
 * 15段階の称号。level は 1..15、minScore はその称号に到達するのに必要な積算スコア。
 * emoji は結果画面やプロフィールカードでの表示用。
 * @type {ReadonlyArray<{ level: number, title: string, emoji: string, minScore: number }>}
 */
export const RANKS = [
  { level: 1, title: 'ひよっこタイパー', emoji: '🥚', minScore: 0 },
  { level: 2, title: 'ちびっこエビ', emoji: '🦐', minScore: 500 },
  { level: 3, title: 'よちよちヤドカリ', emoji: '🐚', minScore: 1500 },
  { level: 4, title: 'ぴちぴちイワシ', emoji: '🐟', minScore: 3000 },
  { level: 5, title: 'のんびりカメ', emoji: '🐢', minScore: 5000 },
  { level: 6, title: 'すいすいペンギン', emoji: '🐧', minScore: 8000 },
  { level: 7, title: 'きらきらクラゲ', emoji: '🪼', minScore: 12000 },
  { level: 8, title: 'にんじゃダコ', emoji: '🐙', minScore: 17000 },
  { level: 9, title: 'びゅんびゅんイルカ', emoji: '🐬', minScore: 24000 },
  { level: 10, title: 'ばくはつフグ', emoji: '🐡', minScore: 32000 },
  { level: 11, title: 'いなずまサメ', emoji: '🦈', minScore: 42000 },
  { level: 12, title: 'だいおうクジラ', emoji: '🐋', minScore: 55000 },
  { level: 13, title: 'うみのドラゴン', emoji: '🐉', minScore: 70000 },
  { level: 14, title: 'でんせつのリヴァイアサン', emoji: '🌟', minScore: 90000 },
  { level: 15, title: 'うみのさいきょうキング', emoji: '👑', minScore: 120000 },
];

/** 称号の総数（＝最高ランクの level）。 */
export const RANK_COUNT = RANKS.length;

/**
 * 積算スコアから、いま到達している称号を返す。
 * 負の値や NaN は 0 として扱い、必ず最低ランク（level 1）以上を返す。
 * @param {number} totalScore 積算スコア
 * @returns {{ level: number, title: string, emoji: string, minScore: number }}
 */
export function getRankForScore(totalScore) {
  const score = Number.isFinite(totalScore) && totalScore > 0 ? totalScore : 0;
  let current = RANKS[0];
  for (const rank of RANKS) {
    if (score >= rank.minScore) {
      current = rank;
    } else {
      break;
    }
  }
  return current;
}

/**
 * 積算スコアと、次の称号までの進み具合をまとめて返す。
 * 進捗バーや「つぎのしょうごうまで あと◯」の表示に使う。
 * 最高ランクに到達している場合は next=null, remaining=0, ratio=1 を返す。
 *
 * @param {number} totalScore 積算スコア
 * @returns {{
 *   current: { level: number, title: string, emoji: string, minScore: number },
 *   next: { level: number, title: string, emoji: string, minScore: number } | null,
 *   totalScore: number,
 *   into: number,        // 現ランク開始からの超過分
 *   span: number,        // 現ランク→次ランクの必要幅（最高ランクは0）
 *   remaining: number,   // 次ランクまでの残り（最高ランクは0）
 *   ratio: number,       // 現ランク内の進捗 0..1（最高ランクは1）
 *   isMax: boolean,
 * }}
 */
export function getRankProgress(totalScore) {
  const score = Number.isFinite(totalScore) && totalScore > 0 ? totalScore : 0;
  const current = getRankForScore(score);
  const next = RANKS.find((r) => r.level === current.level + 1) ?? null;

  if (!next) {
    return {
      current,
      next: null,
      totalScore: score,
      into: score - current.minScore,
      span: 0,
      remaining: 0,
      ratio: 1,
      isMax: true,
    };
  }

  const span = next.minScore - current.minScore;
  const into = score - current.minScore;
  const remaining = Math.max(0, next.minScore - score);
  const ratio = span > 0 ? Math.min(1, Math.max(0, into / span)) : 0;

  return { current, next, totalScore: score, into, span, remaining, ratio, isMax: false };
}
