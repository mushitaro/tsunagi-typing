import { loadProfiles, setActiveProfile, deleteProfile, getProfileTotalScore } from '../profile/profile-store.js';
import { getRankForScore } from '../profile/ranks.js';
import { drawSpriteThumbnail, avatarVariant } from '../ui/sprite-thumbnail.js';

export const profileSelectScene = {
  id: 'profile-select',

  async mount(appCtx) {
    this.appCtx = appCtx;
    this.spriteLibrary = await appCtx.spriteLibraryPromise;

    this.grid = document.getElementById('profile-grid');
    this.newBtn = document.getElementById('new-profile-btn');

    this._onNew = () => {
      this.appCtx.sfx.uiClick();
      this.appCtx.sceneManager.goto('profile-create');
    };
    this.newBtn.addEventListener('click', this._onNew);

    this.renderList();
  },

  renderList() {
    const { profiles } = loadProfiles();
    this.grid.innerHTML = '';

    for (const profile of profiles) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'profile-card';

      const canvas = document.createElement('canvas');
      card.appendChild(canvas);

      const nameEl = document.createElement('div');
      nameEl.className = 'profile-card-name';
      nameEl.textContent = profile.name;
      card.appendChild(nameEl);

      // 積算スコアから今の称号を出して、なまえの下に見せる。
      const totalScore = getProfileTotalScore(profile);
      const rank = getRankForScore(totalScore);
      const titleEl = document.createElement('div');
      titleEl.className = 'profile-card-title';
      titleEl.textContent = `${rank.emoji} ${rank.title}`;
      card.appendChild(titleEl);

      const bestEl = document.createElement('div');
      bestEl.className = 'profile-card-best';
      bestEl.textContent = `つうさん ${totalScore}`;
      card.appendChild(bestEl);

      card.addEventListener('click', () => {
        this.appCtx.sfx.uiClick();
        setActiveProfile(profile.id);
        this.appCtx.sceneManager.goto('mode-select', { profileId: profile.id });
      });

      card.addEventListener(
        'contextmenu',
        (e) => {
          e.preventDefault();
          if (window.confirm(`「${profile.name}」を削除しますか？`)) {
            deleteProfile(profile.id);
            this.renderList();
          }
        },
        { passive: false },
      );

      this.grid.appendChild(card);

      requestAnimationFrame(() => {
        drawSpriteThumbnail(canvas, profile.avatarId ?? 'crab-01', avatarVariant(profile.avatarId), this.spriteLibrary, 48);
      });
    }
  },

  unmount() {
    this.newBtn?.removeEventListener('click', this._onNew);
  },
};
