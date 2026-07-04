import { getWordsFor } from '../data/word-loader.js';
import { createSpriteInstance } from '../render/pixel-sprite-renderer.js';
import { createStarfield } from '../render/starfield.js';
import { createCannon } from '../render/cannon-renderer.js';
import { createLaserSystem } from '../render/laser-renderer.js';
import { createParticleSystem } from '../render/particle-system.js';
import { createRoundQueue } from '../game/word-queue.js';
import { createTypingSession } from '../game/typing-session.js';
import { createScoreTracker } from '../game/scoring.js';
import { computeCellsToDestroy } from '../game/destruction-mapper.js';
import { recordRoundResult } from '../profile/profile-store.js';
import { speak } from '../audio/speech.js';
import { createKeyboardOverlay } from '../ui/keyboard-overlay.js';
import { observeCanvasResize } from '../core/canvas-resize.js';

const WORD_TRANSITION_DELAY_MS = 750;
const ROUND_SIZE = 10;

export const gameScene = {
  id: 'game',

  async mount(appCtx, params = {}) {
    this.appCtx = appCtx;
    this.profileId = params.profileId ?? null;
    this.language = params.language ?? 'ja';
    this.categoryId = params.categoryId ?? 'sea-creatures';

    this.wordData = await appCtx.wordDataPromise;
    this.spriteLibrary = await appCtx.spriteLibraryPromise;

    this.canvas = document.getElementById('game-canvas');
    this.ctx2d = this.canvas.getContext('2d');

    this.starfield = createStarfield(1, 1, 50);
    this._stopResizeObserver = observeCanvasResize(this.canvas, (w, h) => {
      this.starfield?.resize?.(w, h);
      this.positionCaption();
    });

    this.cannon = createCannon();
    this.laserSystem = createLaserSystem();
    this.particles = createParticleSystem();
    this.scoreTracker = createScoreTracker();
    this.scoreTracker.reset();

    const words = getWordsFor(this.wordData, this.categoryId, this.language);
    this.roundQueue = createRoundQueue(words, ROUND_SIZE);

    this.hudScoreEl = document.getElementById('hud-score');
    this.hudProgressEl = document.getElementById('hud-progress');
    this.captionEl = document.getElementById('word-caption');
    this.speakerBtn = document.getElementById('speaker-btn');
    this.pauseBtn = document.getElementById('pause-btn');
    this.gameFrame = document.querySelector('.game-frame');
    this.keyboard = createKeyboardOverlay(document.getElementById('keyboard-overlay'));

    this.hudScoreEl.textContent = '0';

    this._onSpeaker = () => this.speakCurrentWord();
    this.speakerBtn.addEventListener('click', this._onSpeaker);

    this._onPause = () => {
      this.appCtx.sfx.uiClick();
      this.clearWordTimer();
      this.appCtx.sceneManager.goto('mode-select', { profileId: this.profileId });
    };
    this.pauseBtn.addEventListener('click', this._onPause);

    this.wordTimerId = null;
    this.startNextWord();
  },

  /**
   * スプライト・単語キャプション・大砲を上から順に非重複の帯（バンド）へ割り当てる、
   * 単一の真実の情報源となるレイアウト計算。HUD/オンスクリーンキーボードぶんの
   * セーフゾーンを差し引いた残りの高さを 52% / 16% / 32% で3分割する。
   */
  getLayout() {
    const w = this.canvas.width;
    const h = this.canvas.height;

    const hudSafeTop = 76;
    const kbSafeBottom = 168;
    const usableTop = hudSafeTop;
    const usableBottom = Math.max(usableTop + 240, h - kbSafeBottom);
    const usableH = usableBottom - usableTop;

    const spriteBandH = usableH * 0.52;
    const captionBandH = usableH * 0.16;
    const cannonBandH = usableH - spriteBandH - captionBandH;

    const spriteBandTop = usableTop;
    const captionBandTop = spriteBandTop + spriteBandH;
    const cannonBandTop = captionBandTop + captionBandH;

    const spriteSize = this.spriteInstance?.size ?? 18;
    const spriteTargetSize = Math.min(w * 0.42, spriteBandH * 0.86);
    const spriteOriginX = w / 2 - spriteTargetSize / 2;
    const spriteOriginY = spriteBandTop + (spriteBandH - spriteTargetSize) / 2;

    const cannonWidth = Math.min(w * 0.13, 72);
    const cannonY = cannonBandTop + cannonBandH * 0.82; // 接地ライン（台座下端）

    return {
      sprite: { originX: spriteOriginX, originY: spriteOriginY, cellSize: spriteTargetSize / spriteSize },
      cannon: { x: w / 2, y: cannonY, width: cannonWidth },
      captionCenterY: captionBandTop + captionBandH / 2,
    };
  },

  positionCaption() {
    const layout = this.getLayout();
    this.captionEl.style.top = `${Math.round(layout.captionCenterY)}px`;
  },

  startNextWord() {
    const word = this.roundQueue.next();
    if (!word) {
      this.finishRound();
      return;
    }

    this.currentWord = word;
    this.typingSession = createTypingSession(word);
    this.spriteInstance = createSpriteInstance(word.spriteId, word.spriteVariant, this.spriteLibrary);
    this.wordStartTime = performance.now();

    const progress = this.roundQueue.progress();
    this.hudProgressEl.textContent = `${progress.current} / ${progress.total}`;

    this.appCtx.sfx.wordStart();
    this.renderCaption();
    this.updateKeyboardHint();
  },

  speakCurrentWord() {
    if (!this.currentWord) return;
    const text =
      this.language === 'ja'
        ? this.currentWord.display.hiragana ?? this.currentWord.display.kanji ?? ''
        : this.currentWord.display.word ?? '';
    speak(text, this.language);
  },

  renderCaption() {
    this.positionCaption();
    const segments = this.typingSession.getDisplaySegments();
    this.captionEl.innerHTML = '';

    const mainEl = document.createElement('div');
    mainEl.className = 'word-caption-main';
    mainEl.textContent =
      this.language === 'ja'
        ? this.currentWord.display.kanji ?? this.currentWord.display.hiragana
        : this.currentWord.display.word;
    this.captionEl.appendChild(mainEl);

    // よみ方（かけ算の九九など）。display.reading があるときだけ主表示の下に出す。
    const reading = this.currentWord.display.reading;
    if (reading) {
      const readingEl = document.createElement('div');
      readingEl.className = 'word-caption-reading';
      readingEl.textContent = reading;
      this.captionEl.appendChild(readingEl);
    }

    const subEl = document.createElement('div');
    subEl.className = 'word-caption-sub';
    for (const seg of segments) {
      const span = document.createElement('span');
      span.className = `char ${seg.state === 'done' ? 'is-done' : seg.state === 'current' ? 'is-next' : ''}`.trim();
      span.textContent = seg.text;
      subEl.appendChild(span);
    }
    this.captionEl.appendChild(subEl);
  },

  updateKeyboardHint() {
    this.keyboard.highlight(this.typingSession.getHintChar());
  },

  handleKey(e) {
    if (e.type !== 'down' || !e.printable || !this.typingSession) return;

    const result = this.typingSession.pressKey(e.key);

    if (result.status === 'mismatch') {
      this.appCtx.sfx.wrongKey();
      this.triggerShake();
      return;
    }

    this.appCtx.sfx.laser();
    this.fireLaserForKeystroke(result);
    this.renderCaption();
    this.updateKeyboardHint();

    if (result.isWordComplete) {
      this.completeWord();
    }
  },

  fireLaserForKeystroke(result) {
    const layout = this.getLayout();
    const spriteLayout = layout.sprite;
    const cannonLayout = layout.cannon;
    const totalCells = this.spriteInstance.totalCount();
    const totalKeystrokes = this.typingSession.getTotalKeystrokes();
    const cellsToDestroy = computeCellsToDestroy(
      totalCells,
      totalKeystrokes,
      result.keystrokesDoneBefore,
      result.keystrokesDoneAfter,
    );

    const muzzle = this.cannon.getMuzzlePoint(cannonLayout.x, cannonLayout.y, cannonLayout.width);
    let target;

    if (cellsToDestroy > 0) {
      const points = this.spriteInstance.destroyNext(
        cellsToDestroy,
        spriteLayout.originX,
        spriteLayout.originY,
        spriteLayout.cellSize,
      );
      target =
        points[points.length - 1] ??
        this.spriteInstance.getRemainingCentroid(spriteLayout.originX, spriteLayout.originY, spriteLayout.cellSize);
      this.particles.burst(target.x, target.y, {
        count: 6,
        life: 220,
        colors: ['#7dd3c0', '#b8ece0'],
        speed: [30, 90],
      });
      this.appCtx.sfx.hit();
    } else {
      target = this.spriteInstance.getRemainingCentroid(
        spriteLayout.originX,
        spriteLayout.originY,
        spriteLayout.cellSize,
      );
    }

    this.laserSystem.fire(muzzle, target);
    this.cannon.flash();
  },

  completeWord() {
    const spriteLayout = this.getLayout().sprite;
    const remaining = this.spriteInstance.remainingCount();
    if (remaining > 0) {
      this.spriteInstance.destroyNext(remaining, spriteLayout.originX, spriteLayout.originY, spriteLayout.cellSize);
    }

    const centroid = this.spriteInstance.getRemainingCentroid(
      spriteLayout.originX,
      spriteLayout.originY,
      spriteLayout.cellSize,
    );
    this.particles.burst(centroid.x, centroid.y, {
      count: 30,
      life: 650,
      colors: ['#e8a355', '#f3d18a'],
      speed: [60, 220],
    });
    this.appCtx.sfx.explode();
    this.triggerShake();

    const elapsed = performance.now() - this.wordStartTime;
    this.scoreTracker.addWordClear(this.currentWord.difficulty ?? 1, elapsed);
    this.hudScoreEl.textContent = String(this.scoreTracker.getScore());

    this.clearWordTimer();
    this.wordTimerId = setTimeout(() => {
      this.wordTimerId = null;
      this.startNextWord();
    }, WORD_TRANSITION_DELAY_MS);
  },

  triggerShake() {
    if (!this.gameFrame) return;
    this.gameFrame.classList.remove('screen-shake');
    void this.gameFrame.offsetWidth; // reflow でアニメーションを再トリガー
    this.gameFrame.classList.add('screen-shake');
  },

  clearWordTimer() {
    if (this.wordTimerId) {
      clearTimeout(this.wordTimerId);
      this.wordTimerId = null;
    }
  },

  finishRound() {
    const score = this.scoreTracker.getScore();
    const wordsCleared = this.scoreTracker.getWordsCleared();
    let progression = null;
    if (this.profileId) {
      progression = recordRoundResult(this.profileId, this.categoryId, { score, wordsCleared });
    }
    const category = this.wordData?.categories?.find((c) => c.id === this.categoryId);
    const categoryLabel = category ? (this.language === 'ja' ? category.labelJa : category.labelEn) : this.categoryId;
    this.appCtx.sceneManager.goto('results', {
      profileId: this.profileId,
      categoryId: this.categoryId,
      categoryLabel,
      language: this.language,
      score,
      wordsCleared,
      progression,
    });
  },

  update(dt) {
    this.starfield?.update(dt);
    this.cannon?.update(dt);
    this.laserSystem?.update(dt);
    this.particles?.update(dt);
  },

  render() {
    const ctx = this.ctx2d;
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.starfield?.draw(ctx);

    const layout = this.getLayout();

    if (this.spriteInstance) {
      this.spriteInstance.draw(ctx, layout.sprite.originX, layout.sprite.originY, layout.sprite.cellSize);
    }

    this.cannon?.draw(ctx, layout.cannon.x, layout.cannon.y, layout.cannon.width);

    this.laserSystem?.draw(ctx);
    this.particles?.draw(ctx);
  },

  unmount() {
    this._stopResizeObserver?.();
    this.speakerBtn?.removeEventListener('click', this._onSpeaker);
    this.pauseBtn?.removeEventListener('click', this._onPause);
    this.clearWordTimer();
  },
};
