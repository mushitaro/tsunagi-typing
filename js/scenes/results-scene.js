import { getActiveProfile } from '../profile/profile-store.js';

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

    this.summaryEl.innerHTML = '';
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
