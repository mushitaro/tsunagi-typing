import { createSpriteInstance } from '../render/pixel-sprite-renderer.js';

/** プロフィールアイコンやカテゴリアイコンなど、小さな静止スプライトをcanvasに1回描画する。 */
export function drawSpriteThumbnail(canvas, spriteId, variant, spriteLibrary, size = 48) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = size + 'px';
  canvas.style.height = size + 'px';

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, size, size);

  const instance = createSpriteInstance(spriteId, variant, spriteLibrary);
  const cellSize = size / instance.size;
  instance.draw(ctx, 0, 0, cellSize);
}

export const AVATAR_CHOICES = [
  { avatarId: 'crab-01', palette: 'sea-orange' },
  { avatarId: 'octopus-01', palette: 'sea-purple' },
  { avatarId: 'turtle-01', palette: 'sea-green' },
  { avatarId: 'penguin-01', palette: 'sea-blue' },
  { avatarId: 'starfish-01', palette: 'sea-yellow' },
  { avatarId: 'dolphin-01', palette: 'sea-teal' },
  { avatarId: 'shell-01', palette: 'sea-pink' },
  { avatarId: 'frog-01', palette: 'sea-red' },
];

export function avatarVariant(avatarId) {
  const found = AVATAR_CHOICES.find((a) => a.avatarId === avatarId);
  return { palette: found?.palette ?? 'sea-mono' };
}

export const CATEGORY_ICONS = {
  'sea-creatures': { spriteId: 'octopus-01', palette: 'sea-purple' },
  math: { spriteId: 'shape-star-01', palette: 'math-green' },
};
