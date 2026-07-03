/**
 * 「しょうごう いちらん」ポップアップ。
 * 全15ランクの「必要スコア → 称号」を一覧で表示し、いまのランクをハイライトする。
 *
 * タッチ端末（スマホ・タブレット）でも確実に開けるよう、ホバーではなく
 * タップ/クリックで開くモーダル方式にしている。body 直下に要素を作り、
 * 閉じるときに DOM ごと取り除く自己完結な作り。外部依存なし・素の ES Module。
 */
import { RANKS, getRankForScore } from '../profile/ranks.js';

const OVERLAY_ID = 'rank-popup-overlay';

/**
 * ランク一覧ポップアップを表示する。既に開いていれば作り直す。
 * @param {number} [totalScore=0] いまの積算スコア（該当ランクをハイライト＆スコア表示に使う）
 * @returns {HTMLElement} 生成したオーバーレイ要素
 */
export function showRankListPopup(totalScore = 0) {
  closeRankListPopup();

  const score = Number.isFinite(totalScore) && totalScore > 0 ? totalScore : 0;
  const current = getRankForScore(score);

  const overlay = document.createElement('div');
  overlay.className = 'rank-popup-overlay';
  overlay.id = OVERLAY_ID;

  const panel = document.createElement('div');
  panel.className = 'rank-popup';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-label', 'しょうごう いちらん');

  const heading = document.createElement('h3');
  heading.className = 'rank-popup-title';
  heading.textContent = 'しょうごう いちらん';
  panel.appendChild(heading);

  const sub = document.createElement('p');
  sub.className = 'rank-popup-sub';
  sub.textContent = `いまのスコア ${score} ・ ${current.emoji} ${current.title}`;
  panel.appendChild(sub);

  const list = document.createElement('div');
  list.className = 'rank-popup-list';

  for (const rank of RANKS) {
    const row = document.createElement('div');
    row.className = 'rank-popup-row';
    if (rank.level === current.level) row.classList.add('is-current');
    if (score >= rank.minScore) row.classList.add('is-reached');

    const lv = document.createElement('span');
    lv.className = 'rank-popup-lv';
    lv.textContent = `Lv.${rank.level}`;

    const emoji = document.createElement('span');
    emoji.className = 'rank-popup-emoji';
    emoji.textContent = rank.emoji;

    const name = document.createElement('span');
    name.className = 'rank-popup-name';
    name.textContent = rank.title;

    const scoreEl = document.createElement('span');
    scoreEl.className = 'rank-popup-score';
    scoreEl.textContent = `${rank.minScore}てん〜`;

    row.append(lv, emoji, name, scoreEl);
    list.appendChild(row);
  }
  panel.appendChild(list);

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'rank-popup-close';
  closeBtn.textContent = 'とじる';
  panel.appendChild(closeBtn);

  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  // 閉じる操作: ボタン / 背景クリック / Escape。
  const onKey = (e) => {
    if (e.key === 'Escape') closeRankListPopup();
  };
  closeBtn.addEventListener('click', closeRankListPopup);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeRankListPopup();
  });
  document.addEventListener('keydown', onKey);
  overlay._cleanup = () => document.removeEventListener('keydown', onKey);

  // いまのランクが真ん中に来るようにスクロール（届いていない上位が下に続く）。
  const currentRow = list.querySelector('.rank-popup-row.is-current');
  if (currentRow) {
    list.scrollTop = Math.max(0, currentRow.offsetTop - list.clientHeight / 2 + currentRow.clientHeight / 2);
  }

  closeBtn.focus();
  return overlay;
}

/** ランク一覧ポップアップが開いていれば閉じる（開いていなければ何もしない）。 */
export function closeRankListPopup() {
  const existing = document.getElementById(OVERLAY_ID);
  if (existing) {
    existing._cleanup?.();
    existing.remove();
  }
}
