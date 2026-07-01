/**
 * シーンの契約:
 * {
 *   id: string,
 *   mount(ctx, params): void | Promise<void>,   // 表示直前。DOM構築・状態初期化
 *   unmount(): void,                             // 非表示直前。タイマー解除など
 *   update(dt): void,                            // 毎フレーム（canvasを使わないシーンは空でよい）
 *   render(): void,                              // 毎フレーム描画
 *   handleKey(e): void,                          // { key, code, type: 'down'|'up' }
 * }
 * ctx (AppContext) は main.js が生成し、全シーンで共有する。
 */
export function createSceneManager(ctx) {
  const scenes = new Map();
  let current = null;

  function register(scene) {
    scenes.set(scene.id, scene);
  }

  function sectionFor(id) {
    return document.querySelector(`.scene[data-scene="${id}"]`);
  }

  async function goto(id, params) {
    const next = scenes.get(id);
    if (!next) throw new Error(`Unknown scene: ${id}`);

    if (current) {
      sectionFor(current.id)?.classList.remove('scene--active');
      current.unmount?.();
    }

    current = next;
    sectionFor(id)?.classList.add('scene--active');
    ctx.eventBus.emit('scene:enter', { id });
    await current.mount?.(ctx, params);
  }

  function update(dt) {
    current?.update?.(dt);
  }

  function render() {
    current?.render?.();
  }

  function handleKey(e) {
    current?.handleKey?.(e);
  }

  function getCurrentId() {
    return current?.id ?? null;
  }

  return { register, goto, update, render, handleKey, getCurrentId };
}
