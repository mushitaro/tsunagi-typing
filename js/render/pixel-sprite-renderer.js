/**
 * pixel-sprite-renderer.js
 *
 * js/data/sprite-loader.js が提供する resolveSpriteVariant() の結果（あらかじめ破壊順に
 * シャッフル済みの cells 配列）をそのまま使い、Canvas 2D 上にドット絵スプライトを描画・
 * 部分破壊するための薄いラッパー。フレームワーク非依存、Canvas 2D API のみを使用する。
 *
 * TSUNAGI ブランドカラー（参考、呼び出し側のエフェクト描画用）:
 *   背景     #141310
 *   レーザー #7dd3c0 (グロー #b8ece0)
 *   爆発     #e8a355 (ホット #f3d18a)
 */

import { resolveSpriteVariant } from '../data/sprite-loader.js';

/**
 * @param {string} spriteId
 * @param {{ palette: string, mirror?: boolean }} variant
 * @param {{ spritesById: Map, palettes: Map }} spriteLibrary loadSpriteLibrary() の戻り値
 * @returns {SpriteInstance}
 */
export function createSpriteInstance(spriteId, variant, spriteLibrary) {
  const resolved = resolveSpriteVariant(spriteId, variant, spriteLibrary);
  return new SpriteInstance(resolved.size, resolved.cells);
}

class SpriteInstance {
  constructor(size, cells) {
    this.size = size;
    this.cells = cells; // 破壊順にあらかじめシャッフル済み
    this.destroyedCount = 0;
    this._lastDestroyedCell = null;
  }

  /** まだ破壊されていない残りセルを fillRect で描画する。 */
  draw(ctx, originX, originY, cellSize) {
    const cells = this.cells;
    for (let i = this.destroyedCount; i < cells.length; i++) {
      const cell = cells[i];
      ctx.fillStyle = cell.color;
      ctx.fillRect(
        originX + cell.col * cellSize,
        originY + cell.row * cellSize,
        cellSize,
        cellSize,
      );
    }
  }

  /**
   * 先頭から未破壊の count 個（残りがそれ未満なら残り全部）を破壊済みにする。
   * @returns {Array<{x: number, y: number}>} 破壊した各セルの中心座標（絶対canvas座標）
   */
  destroyNext(count, originX, originY, cellSize) {
    const cells = this.cells;
    const start = this.destroyedCount;
    const end = Math.min(start + Math.max(0, count), cells.length);
    const points = [];

    for (let i = start; i < end; i++) {
      const cell = cells[i];
      const point = {
        x: originX + (cell.col + 0.5) * cellSize,
        y: originY + (cell.row + 0.5) * cellSize,
      };
      points.push(point);
      this._lastDestroyedCell = point;
    }

    this.destroyedCount = end;
    return points;
  }

  isFullyDestroyed() {
    return this.destroyedCount >= this.cells.length;
  }

  remainingCount() {
    return this.cells.length - this.destroyedCount;
  }

  totalCount() {
    return this.cells.length;
  }

  /**
   * 残っているセルの重心（絶対canvas座標）。全滅時は最後に破壊した位置、
   * それもなければスプライト中心にフォールバックする。
   */
  getRemainingCentroid(originX, originY, cellSize) {
    const cells = this.cells;
    const remainingStart = this.destroyedCount;

    if (remainingStart >= cells.length) {
      if (this._lastDestroyedCell) return this._lastDestroyedCell;
      const center = (this.size * cellSize) / 2;
      return { x: originX + center, y: originY + center };
    }

    let sumX = 0;
    let sumY = 0;
    let n = 0;
    for (let i = remainingStart; i < cells.length; i++) {
      const cell = cells[i];
      sumX += originX + (cell.col + 0.5) * cellSize;
      sumY += originY + (cell.row + 0.5) * cellSize;
      n++;
    }

    return { x: sumX / n, y: sumY / n };
  }

  /** 同じインスタンスを再利用する場合用に破壊状態をリセットする。 */
  reset() {
    this.destroyedCount = 0;
    this._lastDestroyedCell = null;
  }
}
