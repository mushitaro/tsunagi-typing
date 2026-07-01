const MAX_DELTA_MS = 50; // タブ復帰時などの巨大deltaでの破綻を防ぐ

export function createGameLoop({ onUpdate, onRender }) {
  let running = false;
  let lastTime = 0;
  let rafId = null;

  function tick(now) {
    if (!running) return;
    const dt = Math.min(now - lastTime, MAX_DELTA_MS);
    lastTime = now;
    onUpdate(dt);
    onRender();
    rafId = requestAnimationFrame(tick);
  }

  function start() {
    if (running) return;
    running = true;
    lastTime = performance.now();
    rafId = requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  return { start, stop };
}
