/**
 * starfield.js
 *
 * ゆっくり流れる背景の星（控えめなパララックス演出）。主役はスプライト破壊なので
 * 目立ちすぎないよう、暗めのグレー〜ベージュ系の濃淡ドットのみを使う。
 */

const STAR_COLORS = ['#46443d', '#5c5a51', '#736f63', '#8f8c81'];

/**
 * @param {number} width 内部解像度の幅（例: 480）
 * @param {number} height 内部解像度の高さ（例: 270）
 * @param {number} count 星の数
 * @returns {{ update(dt: number): void, draw(ctx: CanvasRenderingContext2D): void, resize(width: number, height: number): void }}
 */
export function createStarfield(width, height, count = 60) {
  let w = width;
  let h = height;
  const stars = [];

  for (let i = 0; i < count; i++) {
    stars.push(makeStar(w, h));
  }

  function update(dt) {
    const dtSec = dt / 1000;
    for (const star of stars) {
      star.y += star.speed * dtSec;
      star.x += star.driftX * dtSec;

      if (star.y > h) {
        star.y -= h;
        star.x = Math.random() * w;
      } else if (star.y < 0) {
        star.y += h;
      }

      if (star.x > w) {
        star.x -= w;
      } else if (star.x < 0) {
        star.x += w;
      }
    }
  }

  function draw(ctx) {
    for (const star of stars) {
      ctx.fillStyle = star.color;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }
  }

  function resize(newWidth, newHeight) {
    w = newWidth;
    h = newHeight;
  }

  return { update, draw, resize };
}

function makeStar(w, h) {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    size: Math.random() < 0.8 ? 1 : 2,
    speed: 4 + Math.random() * 10, // px/sec, 下方向
    driftX: (Math.random() - 0.5) * 2, // 微妙な横流れ
    color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
  };
}
