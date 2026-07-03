import { getActiveProfile, getProfileTotalScore } from '../profile/profile-store.js';
import { getRankForScore, getRankProgress } from '../profile/ranks.js';

export const resultsScene = {
  id: 'results',

  async mount(appCtx, params = {}) {
    this.appCtx = appCtx;
    this.params = params;

    this.summaryEl = document.getElementById('results-summary');
    this.replayBtn = document.getElementById('replay-btn');
    this.menuBtn = document.getElementById('menu-btn');

    const profile = getActiveProfile();
    const best = profile?.stats?.[params.categoryId]?.bestScore ?? 0;
    const isNewRecord = params.score > 0 && params.score >= best;

    // 積算スコア・称号は game-scene から渡される progression を第一の情報源とし、
    // 無い場合（profile 未設定など）は現在のプロフィールから読み直してフォールバックする。
    const progression = params.progression ?? null;
    const totalScore = progression?.totalScore ?? getProfileTotalScore(profile);
    const rank = progression?.rank ?? getRankForScore(totalScore);
    const rankedUp = progression?.rankedUp ?? false;
    const progress = getRankProgress(totalScore);

    this.summaryEl.innerHTML = '';

    // ── ランクアップの祝福バナー（上がった時だけ） ──
    if (rankedUp) {
      const banner = document.createElement('div');
      banner.className = 'rank-up-banner';

      const bannerTitle = document.createElement('div');
      bannerTitle.className = 'rank-up-title';
      bannerTitle.textContent = '🎉 ランクアップ！ 🎉';
      banner.appendChild(bannerTitle);

      const bannerLabel = document.createElement('div');
      bannerLabel.className = 'rank-up-label';
      bannerLabel.textContent = 'あたらしい しょうごう';
      banner.appendChild(bannerLabel);

      const bannerName = document.createElement('div');
      bannerName.className = 'rank-up-name';
      bannerName.textContent = `${rank.emoji} ${rank.title}`;
      banner.appendChild(bannerName);

      this.summaryEl.appendChild(banner);
    }

    // ── このラウンドのスコア ──
    const scoreEl = document.createElement('div');
    scoreEl.className = 'results-highlight';
    scoreEl.textContent = `SCORE ${params.score ?? 0}`;
    this.summaryEl.appendChild(scoreEl);

    const clearedEl = document.createElement('div');
    clearedEl.textContent = `クリアした単語: ${params.wordsCleared ?? 0}`;
    this.summaryEl.appendChild(clearedEl);

    const bestEl = document.createElement('div');
    bestEl.textContent = isNewRecord ? '★ じこベスト こうしん！' : `じこベスト: ${best}`;
    this.summaryEl.appendChild(bestEl);

    // ── 積算スコアと今の称号 ──
    const rankCard = document.createElement('div');
    rankCard.className = 'results-rank';
    if (rankedUp) rankCard.classList.add('is-up');

    const rankEmoji = document.createElement('span');
    rankEmoji.className = 'results-rank-emoji';
    rankEmoji.textContent = rank.emoji;
    rankCard.appendChild(rankEmoji);

    const rankText = document.createElement('div');
    rankText.className = 'results-rank-text';

    const rankLabel = document.createElement('div');
    rankLabel.className = 'results-rank-label';
    rankLabel.textContent = `しょうごう Lv.${rank.level}`;
    rankText.appendChild(rankLabel);

    const rankTitle = document.createElement('div');
    rankTitle.className = 'results-rank-title';
    rankTitle.textContent = rank.title;
    rankText.appendChild(rankTitle);

    rankCard.appendChild(rankText);
    this.summaryEl.appendChild(rankCard);

    const totalEl = document.createElement('div');
    totalEl.className = 'results-total';
    totalEl.textContent = `つうさんスコア: ${totalScore}`;
    this.summaryEl.appendChild(totalEl);

    // ── 次の称号までの進み具合 ──
    const progressWrap = document.createElement('div');
    progressWrap.className = 'rank-progress';

    const bar = document.createElement('div');
    bar.className = 'rank-progress-bar';
    const fill = document.createElement('div');
    fill.className = 'rank-progress-fill';
    fill.style.width = `${Math.round(progress.ratio * 100)}%`;
    bar.appendChild(fill);
    progressWrap.appendChild(bar);

    const progressLabel = document.createElement('div');
    progressLabel.className = 'rank-progress-label';
    progressLabel.textContent = progress.isMax
      ? 'さいこうランク たっせい！ すごい！'
      : `つぎの「${progress.next.title}」まで あと ${progress.remaining}`;
    progressWrap.appendChild(progressLabel);

    this.summaryEl.appendChild(progressWrap);

    // ランクアップ時はごほうびのファンファーレを鳴らす。
    if (rankedUp) {
      this.appCtx.sfx.fanfare();
    }

    this._onReplay = () => {
      this.appCtx.sfx.uiClick();
      this.appCtx.sceneManager.goto('game', {
        profileId: this.params.profileId,
        language: this.params.language,
        categoryId: this.params.categoryId,
      });
    };
    this._onMenu = () => {
      this.appCtx.sfx.uiClick();
      this.appCtx.sceneManager.goto('mode-select', { profileId: this.params.profileId });
    };

    this.replayBtn.addEventListener('click', this._onReplay);
    this.menuBtn.addEventListener('click', this._onMenu);
  },

  unmount() {
    this.replayBtn?.removeEventListener('click', this._onReplay);
    this.menuBtn?.removeEventListener('click', this._onMenu);
  },
};
