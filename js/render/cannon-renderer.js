const FLASH_DURATION_MS = 90;

const BODY_COLOR = '#2b2a24';
const BODY_SHADE = '#1c1b17';
const BARREL_COLOR = '#3a382f';
const BARREL_HILITE = '#57544a';
const TRIM_COLOR = '#7dd3c0';
const FLASH_CORE = '#f3d18a';
const FLASH_OUTER = '#e8a355';

/**
 * プレイヤーの大砲を作る。
 * @returns {{draw: Function, flash: Function, update: Function, getMuzzlePoint: Function}}
 */
export function createCannon() {
  let flashTimer = 0; // 残り時間(ms)。0ならフラッシュなし

  function flash() {
    flashTimer = FLASH_DURATION_MS;
  }

  function update(dt) {
    if (flashTimer > 0) {
      flashTimer = Math.max(0, flashTimer - dt);
    }
  }

  /**
   * @param {number} x 大砲の中心x（canvas座標）
   * @param {number} y 大砲の上端y（canvas座標）
   * @param {number} width 大砲の描画幅の目安（px）
   */
  function getMuzzlePoint(x, y, width) {
    const barrelHeight = width * 0.62;
    return { x, y: y - barrelHeight };
  }

  /**
   * ブロック状のレトロ大砲を描画する。(x, y) は大砲の中心・上端の基準。
   */
  function draw(ctx, x, y, width) {
    const w = width;
    const baseHeight = w * 0.5;
    const barrelWidth = w * 0.34;
    const barrelHeight = w * 0.62;

    ctx.save();

    // 台座（左右に張り出したブロック）
    const baseW = w;
    const baseH = baseHeight;
    const baseX = x - baseW / 2;
    const baseY = y - baseH * 0.15;
    ctx.fillStyle = BODY_SHADE;
    ctx.fillRect(Math.round(baseX), Math.round(baseY), Math.round(baseW), Math.round(baseH));

    ctx.fillStyle = BODY_COLOR;
    const innerPad = w * 0.06;
    ctx.fillRect(
      Math.round(baseX + innerPad),
      Math.round(baseY),
      Math.round(baseW - innerPad * 2),
      Math.round(baseH - innerPad)
    );

    // トリムライン（TSUNAGIブランドのアクセント）
    ctx.fillStyle = TRIM_COLOR;
    ctx.fillRect(Math.round(baseX + innerPad), Math.round(baseY + baseH * 0.28), Math.round(baseW - innerPad * 2), Math.max(1, Math.round(w * 0.035)));

    // 砲身（中央、上に伸びる矩形）
    const barrelX = x - barrelWidth / 2;
    const barrelY = y - barrelHeight;
    ctx.fillStyle = BARREL_COLOR;
    ctx.fillRect(Math.round(barrelX), Math.round(barrelY), Math.round(barrelWidth), Math.round(barrelHeight));

    // 砲身ハイライト（左側の細い筋、ピクセル感を出す）
    ctx.fillStyle = BARREL_HILITE;
    ctx.fillRect(Math.round(barrelX + barrelWidth * 0.12), Math.round(barrelY), Math.max(1, Math.round(barrelWidth * 0.2)), Math.round(barrelHeight));

    // 砲口の縁取り
    ctx.fillStyle = BODY_SHADE;
    ctx.fillRect(Math.round(barrelX - barrelWidth * 0.08), Math.round(barrelY), Math.round(barrelWidth * 1.16), Math.max(1, Math.round(w * 0.05)));

    // マズルフラッシュ
    if (flashTimer > 0) {
      const t = flashTimer / FLASH_DURATION_MS; // 1 -> 0
      const muzzle = getMuzzlePoint(x, y, w);
      const outerR = w * 0.32 * t;
      const innerR = w * 0.16 * t;

      ctx.globalAlpha = 0.85 * t + 0.15;
      ctx.fillStyle = FLASH_OUTER;
      ctx.beginPath();
      ctx.arc(muzzle.x, muzzle.y, Math.max(0, outerR), 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1;
      ctx.fillStyle = FLASH_CORE;
      ctx.beginPath();
      ctx.arc(muzzle.x, muzzle.y, Math.max(0, innerR), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  return { draw, flash, update, getMuzzlePoint };
}
