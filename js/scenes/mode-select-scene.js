import { getActiveProfile, setActiveProfile, getCategoryTotalScore } from '../profile/profile-store.js';
import { getRankForScore } from '../profile/ranks.js';
import { showRankListPopup, closeRankListPopup } from '../ui/rank-list-popup.js';
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

    this.renderPlayerBadge();

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

  /** お題名を取得する（言語に応じて）。 */
  categoryLabelOf(categoryId) {
    const c = this.wordData?.categories?.find((x) => x.id === categoryId);
    return c ? (this.language === 'ja' ? c.labelJa : c.labelEn) : '';
  },

  /**
   * ヘッダー下に「あそぶ子の名前」と称号いちらんへの入口を表示する。
   * 称号はお題ごとなので、ここには特定の称号は出さず、名前と一覧ボタンだけを置く
   * （各お題の称号は下のお題タイルに表示する）。
   */
  renderPlayerBadge() {
    if (!this.titleBadge) return;
    if (!this.profile) {
      this.titleBadge.hidden = true;
      this.titleBadge.textContent = '';
      return;
    }

    this.titleBadge.hidden = false;
    this.titleBadge.innerHTML = '';

    const nameEl = document.createElement('span');
    nameEl.className = 'profile-title-badge-name';
    nameEl.textContent = this.profile.name;
    this.titleBadge.appendChild(nameEl);

    const hintEl = document.createElement('span');
    hintEl.className = 'profile-title-badge-hint';
    hintEl.textContent = '📖 しょうごう いちらん ▸';
    this.titleBadge.appendChild(hintEl);

    // バッジをタップすると称号いちらんポップアップを開く（選んでいるお題の進み具合を表示）。
    this.titleBadge.classList.add('is-tappable');
    this.titleBadge.setAttribute('role', 'button');
    this.titleBadge.setAttribute('tabindex', '0');
    this._onBadge = () => {
      this.appCtx.sfx.uiClick();
      showRankListPopup(getCategoryTotalScore(this.profile, this.categoryId), this.categoryLabelOf(this.categoryId));
    };
    this._onBadgeKey = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this._onBadge();
      }
    };
    this.titleBadge.addEventListener('click', this._onBadge);
    this.titleBadge.addEventListener('keydown', this._onBadgeKey);
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

      // お題ごとの称号と積算スコア（そのお題の totalScore から算出）。
      if (this.profile) {
        const catTotal = getCategoryTotalScore(this.profile, cat.id);
        const catRank = getRankForScore(catTotal);

        const titleEl = document.createElement('div');
        titleEl.className = 'category-card-title';
        titleEl.textContent = `${catRank.emoji} ${catRank.title}`;
        card.appendChild(titleEl);

        const scoreEl = document.createElement('div');
        scoreEl.className = 'category-card-score';
        scoreEl.textContent = `つうさん ${catTotal}`;
        card.appendChild(scoreEl);
      }

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
    closeRankListPopup();
    this.langToggle?.removeEventListener('click', this._onLangClick);
    this.backBtn?.removeEventListener('click', this._onBack);
    this.startBtn?.removeEventListener('click', this._onStart);
    if (this.titleBadge) {
      this.titleBadge.removeEventListener('click', this._onBadge);
      this.titleBadge.removeEventListener('keydown', this._onBadgeKey);
    }
  },
};
