/**
 * プレイヤーの大砲。1978年のスペースインベーダーの自機（台座+中央の砲身ノブだけの
 * 極めてシンプルなシルエット）を踏襲したドット絵グリッドを、単色で描く。
 */
const CANNON_GRID = ['.....XXX.....', '.....XXX.....', 'XXXXXXXXXXXXX', 'XXXXXXXXXXXXX', 'XXXXXXXXXXXXX'];
const GRID_W = 13;
const GRID_H = CANNON_GRID.length;

const CANNON_COLOR = '#f3f1ea';
const FLASH_CORE = '#f3d18a';
const FLASH_OUTER = '#e8a355';
const FLASH_DURATION_MS = 90;

/**
 * @returns {{draw: Function, flash: Function, update: Function, getMuzzlePoint: Function}}
 */
export function createCannon() {
  let flashTimer = 0; // 残り時間(ms)。0ならフラッシュなし

  function flash() {
    flashTimer = FLASH_DURATION_MS;
  }

  function update(dt) {
    if (flashTimer > 0) flashTimer = Math.max(0, flashTimer - dt);
  }

  /**
   * @param {number} x 大砲の中心x（canvas座標）
   * @param {number} y 大砲の接地ライン（台座の下端、canvas座標）
   * @param {number} width 大砲の描画幅
   */
  function getMuzzlePoint(x, y, width) {
    const cellSize = width / GRID_W;
    const totalHeight = GRID_H * cellSize;
    return { x, y: y - totalHeight };
  }

  /** (x, y) は大砲の中心・接地ライン（台座の下端）。そこから上方向に描画する。 */
  function draw(ctx, x, y, width) {
    const cellSize = width / GRID_W;
    const totalHeight = GRID_H * cellSize;
    const originX = x - width / 2;
    const originY = y - totalHeight;

    ctx.save();
    ctx.fillStyle = CANNON_COLOR;
    for (let row = 0; row < GRID_H; row++) {
      const line = CANNON_GRID[row];
      for (let col = 0; col < GRID_W; col++) {
        if (line[col] !== 'X') continue;
        ctx.fillRect(
          Math.round(originX + col * cellSize),
          Math.round(originY + row * cellSize),
          Math.ceil(cellSize),
          Math.ceil(cellSize),
        );
      }
    }

    if (flashTimer > 0) {
      const t = flashTimer / FLASH_DURATION_MS; // 1 -> 0
      const muzzle = getMuzzlePoint(x, y, width);

      ctx.globalAlpha = 0.85 * t + 0.15;
      ctx.fillStyle = FLASH_OUTER;
      ctx.beginPath();
      ctx.arc(muzzle.x, muzzle.y, Math.max(0, cellSize * 1.6 * t), 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1;
      ctx.fillStyle = FLASH_CORE;
      ctx.beginPath();
      ctx.arc(muzzle.x, muzzle.y, Math.max(0, cellSize * 0.8 * t), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  return { draw, flash, update, getMuzzlePoint };
}
