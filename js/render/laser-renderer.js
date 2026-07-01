const MIN_DURATION_MS = 120;
const MAX_DURATION_MS = 180;

const LASER_COLOR = '#7dd3c0';
const LASER_GLOW = '#b8ece0';

function randomDuration() {
  return MIN_DURATION_MS + Math.random() * (MAX_DURATION_MS - MIN_DURATION_MS);
}

/**
 * レーザービームの発射・更新・描画を管理するシステムを作る。
 * @returns {{fire: Function, update: Function, draw: Function}}
 */
export function createLaserSystem() {
  let lasers = [];

  /**
   * @param {{x:number,y:number}} from 発射origin（canvas座標）
   * @param {{x:number,y:number}} to 着弾点（canvas座標）
   */
  function fire(from, to) {
    lasers.push({
      from: { x: from.x, y: from.y },
      to: { x: to.x, y: to.y },
      duration: randomDuration(),
      elapsed: 0,
      done: false,
    });
  }

  function update(dt) {
    if (lasers.length === 0) return;
    for (const laser of lasers) {
      laser.elapsed += dt;
      if (laser.elapsed >= laser.duration) {
        laser.done = true;
      }
    }
    lasers = lasers.filter((l) => !l.done);
  }

  function draw(ctx) {
    if (lasers.length === 0) return;

    ctx.save();
    ctx.lineCap = 'round';

    for (const laser of lasers) {
      const t = Math.min(1, laser.elapsed / laser.duration); // 0 -> 1 進行度
      const headX = laser.from.x + (laser.to.x - laser.from.x) * t;
      const headY = laser.from.y + (laser.to.y - laser.from.y) * t;

      // ビームの尾は少し後方から（先端が伸びていくような見た目）
      const tailT = Math.max(0, t - 0.35);
      const tailX = laser.from.x + (laser.to.x - laser.from.x) * tailT;
      const tailY = laser.from.y + (laser.to.y - laser.from.y) * tailT;

      const fadeAlpha = 1 - Math.pow(t, 3); // 着弾直前にわずかにフェード

      // 外側グロー（半透明の太い光暈）
      ctx.globalAlpha = 0.35 * fadeAlpha + 0.15;
      ctx.strokeStyle = LASER_GLOW;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(headX, headY);
      ctx.stroke();

      // 内側コアビーム
      ctx.globalAlpha = Math.min(1, fadeAlpha + 0.4);
      ctx.strokeStyle = LASER_COLOR;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(headX, headY);
      ctx.stroke();

      // 先端の輝点
      ctx.globalAlpha = 1;
      ctx.fillStyle = LASER_GLOW;
      ctx.beginPath();
      ctx.arc(headX, headY, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  return { fire, update, draw };
}
