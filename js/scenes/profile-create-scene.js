import { createProfile } from '../profile/profile-store.js';
import { drawSpriteThumbnail, AVATAR_CHOICES, avatarVariant } from '../ui/sprite-thumbnail.js';

export const profileCreateScene = {
  id: 'profile-create',

  async mount(appCtx) {
    this.appCtx = appCtx;
    this.spriteLibrary = await appCtx.spriteLibraryPromise;
    this.selectedAvatarId = AVATAR_CHOICES[0].avatarId;

    this.nameInput = document.getElementById('name-input');
    this.avatarGrid = document.getElementById('avatar-grid');
    this.cancelBtn = document.getElementById('cancel-create-btn');
    this.confirmBtn = document.getElementById('confirm-create-btn');

    this.nameInput.value = '';
    this.buildAvatarGrid();

    this._onCancel = () => {
      this.appCtx.sfx.uiClick();
      this.appCtx.sceneManager.goto('profile-select');
    };
    this._onConfirm = () => {
      this.appCtx.sfx.uiClick();
      const profile = createProfile(this.nameInput.value, this.selectedAvatarId);
      this.appCtx.sceneManager.goto('mode-select', { profileId: profile.id });
    };

    this.cancelBtn.addEventListener('click', this._onCancel);
    this.confirmBtn.addEventListener('click', this._onConfirm);
  },

  buildAvatarGrid() {
    this.avatarGrid.innerHTML = '';
    for (const choice of AVATAR_CHOICES) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'avatar-cell';
      if (choice.avatarId === this.selectedAvatarId) cell.classList.add('is-selected');

      const canvas = document.createElement('canvas');
      cell.appendChild(canvas);
      this.avatarGrid.appendChild(cell);

      requestAnimationFrame(() => {
        drawSpriteThumbnail(canvas, choice.avatarId, avatarVariant(choice.avatarId), this.spriteLibrary, 44);
      });

      cell.addEventListener('click', () => {
        this.appCtx.sfx.uiClick();
        this.selectedAvatarId = choice.avatarId;
        this.avatarGrid.querySelectorAll('.avatar-cell').forEach((el) => el.classList.remove('is-selected'));
        cell.classList.add('is-selected');
      });
    }
  },

  unmount() {
    this.cancelBtn?.removeEventListener('click', this._onCancel);
    this.confirmBtn?.removeEventListener('click', this._onConfirm);
  },
};
