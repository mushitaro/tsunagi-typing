import { createStarfield } from '../render/starfield.js';
import { createSpriteInstance } from '../render/pixel-sprite-renderer.js';
import { createParticleSystem } from '../render/particle-system.js';
import { observeCanvasResize } from '../core/canvas-resize.js';

const DEMO_SPRITES = [
  { spriteId: 'octopus-01', variant: { palette: 'sea-purple' } },
  { spriteId: 'crab-01', variant: { palette: 'sea-orange' } },
  { spriteId: 'shape-star-01', variant: { palette: 'math-green' } },
  { spriteId: 'whale-01', variant: { palette: 'sea-blue' } },
];

const DESTROY_INTERVAL_MS = 260;
const PAUSE_AFTER_EXPLODE_MS = 900;

export const titleScene = {
  id: 'title',

  async mount(appCtx) {
    this.appCtx = appCtx;
    this.canvas = document.getElementById('title-canvas');
    this.ctx2d = this.canvas.getContext('2d');
    this.ctx2d.imageSmoothingEnabled = false;

    this.starfield = createStarfield(1, 1, 70);
    this.particles = createParticleSystem();

    this._stopResizeObserver = observeCanvasResize(this.canvas, (w, h) => {
      this.starfield?.resize?.(w, h);
    });

    this.spriteLibrary = await appCtx.spriteLibraryPromise;
    this.demoIndex = 0;
    this.spawnDemoSprite();
    this.tickTimer = 0;

    this.section = document.querySelector('.scene[data-scene="title"]');
    this._advance = () => this.advance();
    this.section.addEventListener('pointerdown', this._advance);
    this.section.addEventListener('click', this._advance);
  },

  spawnDemoSprite() {
    const pick = DEMO_SPRITES[this.demoIndex % DEMO_SPRITES.length];
    this.demoIndex += 1;
    this.demoSprite = createSpriteInstance(pick.spriteId, pick.variant, this.spriteLibrary);
    this.destroyTimer = 0;
    this.explodedAt = null;
  },

  advance() {
    this.appCtx.sfx.resumeContext();
    this.appCtx.sfx.uiClick();
    this.appCtx.sceneManager.goto('profile-select');
  },

  handleKey(e) {
    if (e.type === 'down') this.advance();
  },

  update(dt) {
    this.starfield?.update(dt);
    this.particles?.update(dt);

    if (!this.demoSprite) return;

    if (this.demoSprite.isFullyDestroyed()) {
      this.explodedAt = this.explodedAt ?? 0;
      this.explodedAt += dt;
      if (this.explodedAt > PAUSE_AFTER_EXPLODE_MS) this.spawnDemoSprite();
      return;
    }

    this.destroyTimer += dt;
    if (this.destroyTimer >= DESTROY_INTERVAL_MS) {
      this.destroyTimer = 0;
      const layout = this.getSpriteLayout();
      const points = this.demoSprite.destroyNext(3, layout.originX, layout.originY, layout.cellSize);
      for (const p of points) {
        this.particles.burst(p.x, p.y, { count: 5, life: 300, colors: ['#7dd3c0', '#b8ece0'] });
      }
      if (this.demoSprite.isFullyDestroyed()) {
        const centroid = this.demoSprite.getRemainingCentroid(layout.originX, layout.originY, layout.cellSize);
        this.particles.burst(centroid.x, centroid.y, { count: 24, life: 600, colors: ['#e8a355', '#f3d18a'] });
      }
    }
  },

  getSpriteLayout() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const targetSize = Math.min(w * 0.4, h * 0.4);
    const size = this.demoSprite?.size ?? 18;
    const cellSize = targetSize / size;
    return {
      originX: w / 2 - targetSize / 2,
      originY: h * 0.18,
      cellSize,
    };
  },

  render() {
    const ctx = this.ctx2d;
    ctx.fillStyle = '#141310';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.starfield?.draw(ctx);

    if (this.demoSprite) {
      const layout = this.getSpriteLayout();
      this.demoSprite.draw(ctx, layout.originX, layout.originY, layout.cellSize);
    }
    this.particles?.draw(ctx);
  },

  unmount() {
    this._stopResizeObserver?.();
    this.section?.removeEventListener('pointerdown', this._advance);
    this.section?.removeEventListener('click', this._advance);
  },
};
