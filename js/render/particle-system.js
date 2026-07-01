const DEFAULT_COUNT = 12;
const DEFAULT_SPREAD = Math.PI * 2;
const DEFAULT_SPEED = [40, 140]; // px/秒
const DEFAULT_LIFE_MS = 500;
const DEFAULT_COLORS = ['#e8a355', '#f3d18a'];

const GRAVITY = 0.00028; // px/ms^2 相当のゆるい重力（下方向）
const DRAG = 0.0018; // 速度減衰係数（1msあたり）

/**
 * 汎用パーティクルシステムを作る。着弾スパークにも爆発演出にも同じAPIで使える。
 * @returns {{burst: Function, update: Function, draw: Function}}
 */
export function createParticleSystem() {
  let particles = [];

  /**
   * @param {number} x 発生中心x
   * @param {number} y 発生中心y
   * @param {object} [opts]
   * @param {number} [opts.count=12]
   * @param {number} [opts.spread=Math.PI*2] 放射角の広がり（ラジアン）
   * @param {[number,number]} [opts.speed=[40,140]] 速度レンジ(px/秒)
   * @param {number} [opts.life=500] 生存時間(ms)
   * @param {string[]} [opts.colors] 使用色
   */
  function burst(x, y, opts = {}) {
    const count = opts.count ?? DEFAULT_COUNT;
    const spread = opts.spread ?? DEFAULT_SPREAD;
    const [speedMin, speedMax] = opts.speed ?? DEFAULT_SPEED;
    const life = opts.life ?? DEFAULT_LIFE_MS;
    const colors = opts.colors ?? DEFAULT_COLORS;

    const baseAngle = Math.random() * Math.PI * 2;

    for (let i = 0; i < count; i++) {
      const angle = baseAngle + (Math.random() - 0.5) * spread;
      const speed = (speedMin + Math.random() * (speedMax - speedMin)) / 1000; // px/ms
      const size = 1.5 + Math.random() * 2.5;
      const color = colors[(Math.random() * colors.length) | 0];
      const life0 = life * (0.7 + Math.random() * 0.6);

      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size,
        color,
        life: life0,
        age: 0,
      });
    }
  }

  function update(dt) {
    if (particles.length === 0) return;
    for (const p of particles) {
      p.age += dt;
      p.vy += GRAVITY * dt;
      const drag = Math.max(0, 1 - DRAG * dt);
      p.vx *= drag;
      p.vy *= drag;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    particles = particles.filter((p) => p.age < p.life);
  }

  function draw(ctx) {
    if (particles.length === 0) return;

    ctx.save();
    for (const p of particles) {
      const lifeLeft = 1 - p.age / p.life; // 1 -> 0
      ctx.globalAlpha = Math.max(0, lifeLeft);
      ctx.fillStyle = p.color;
      const s = p.size * (0.6 + 0.4 * lifeLeft);
      ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    }
    ctx.restore();
  }

  return { burst, update, draw };
}
