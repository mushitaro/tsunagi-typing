import { getActiveProfile, setActiveProfile, getProfileTotalScore } from '../profile/profile-store.js';
import { getRankForScore } from '../profile/ranks.js';
import { drawSpriteThumbnail, CATEGORY_ICONS } from '../ui/sprite-thumbnail.js';

export const modeSelectScene = {
  id: 'mode-select',

  async mount(appCtx, params = {}) {
    this.appCtx = appCtx;
    this.wordData = await appCtx.wordDataPromise;
    this.spriteLibrary = await appCtx.spriteLibraryPromise;

    if (params.profileId) setActiveProfile(params.profileId);
    this.profile = getActiveProfile();
    this.profileId = this.profile?.id ?? params.profileId ?? null;

    this.language = this.profile?.lastLanguage ?? 'ja';
    this.categoryId = null;

    this.langToggle = document.getElementById('lang-toggle');
    this.categoryGrid = document.getElementById('category-grid');
    this.startBtn = document.getElementById('start-round-btn');
    this.backBtn = document.getElementById('back-to-profiles-btn');
    this.titleBadge = document.getElementById('mode-title-badge');

    this.renderTitleBadge();

    this._onLangClick = (e) => {
      const btn = e.target.closest('.lang-btn');
      if (!btn) return;
      this.appCtx.sfx.uiClick();
      this.language = btn.dataset.lang;
      this.updateLangButtons();
      this.buildCategoryGrid();
    };
    this.langToggle.addEventListener('click', this._onLangClick);

    this._onBack = () => {
      this.appCtx.sfx.uiClick();
      this.appCtx.sceneManager.goto('profile-select');
    };
    this.backBtn.addEventListener('click', this._onBack);

    this._onStart = () => {
      if (!this.categoryId) return;
      this.appCtx.sfx.uiClick();
      this.appCtx.sceneManager.goto('game', {
        profileId: this.profileId,
        language: this.language,
        categoryId: this.categoryId,
      });
    };
    this.startBtn.addEventListener('click', this._onStart);

    this.updateLangButtons();
    this.buildCategoryGrid();
  },

  updateLangButtons() {
    this.langToggle.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.classList.toggle('is-selected', btn.dataset.lang === this.language);
    });
  },

  /** アクティブなプロフィールの称号（積算スコアから算出）をヘッダー下に表示する。 */
  renderTitleBadge() {
    if (!this.titleBadge) return;
    if (!this.profile) {
      this.titleBadge.hidden = true;
      this.titleBadge.textContent = '';
      return;
    }

    const totalScore = getProfileTotalScore(this.profile);
    const rank = getRankForScore(totalScore);
    this.titleBadge.hidden = false;
    this.titleBadge.innerHTML = '';

    const nameEl = document.createElement('span');
    nameEl.className = 'profile-title-badge-name';
    nameEl.textContent = this.profile.name;
    this.titleBadge.appendChild(nameEl);

    const rankEl = document.createElement('span');
    rankEl.className = 'profile-title-badge-rank';
    rankEl.textContent = `${rank.emoji} ${rank.title}`;
    this.titleBadge.appendChild(rankEl);

    const scoreEl = document.createElement('span');
    scoreEl.className = 'profile-title-badge-score';
    scoreEl.textContent = `つうさん ${totalScore}`;
    this.titleBadge.appendChild(scoreEl);
  },

  buildCategoryGrid() {
    this.categoryGrid.innerHTML = '';
    const categories = this.wordData?.categories ?? [];

    for (const cat of categories) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'category-card';
      if (cat.id === this.categoryId) card.classList.add('is-selected');

      const icon = CATEGORY_ICONS[cat.id] ?? { spriteId: 'shape-star-01', palette: 'math-green' };
      const canvas = document.createElement('canvas');
      card.appendChild(canvas);

      const label = document.createElement('div');
      label.className = 'category-card-label';
      label.textContent = this.language === 'ja' ? cat.labelJa : cat.labelEn;
      card.appendChild(label);

      this.categoryGrid.appendChild(card);

      requestAnimationFrame(() => {
        drawSpriteThumbnail(canvas, icon.spriteId, { palette: icon.palette }, this.spriteLibrary, 48);
      });

      card.addEventListener('click', () => {
        this.appCtx.sfx.uiClick();
        this.categoryId = cat.id;
        this.categoryGrid.querySelectorAll('.category-card').forEach((el) => el.classList.remove('is-selected'));
        card.classList.add('is-selected');
      });
    }
  },

  unmount() {
    this.langToggle?.removeEventListener('click', this._onLangClick);
    this.backBtn?.removeEventListener('click', this._onBack);
    this.startBtn?.removeEventListener('click', this._onStart);
  },
};
