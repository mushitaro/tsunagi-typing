/**
 * window の keydown/keyup を正規化してシーンマネージャへ転送する。
 * 正規化イベント: { type: 'down'|'up', key, code, printable, timestamp }
 * printable: 1文字の入力キー（ローマ字入力・EN入力の対象）なら true。
 */
export function installInput(sceneManager) {
  function normalize(e, type) {
    const printable = e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey;
    return { type, key: e.key, code: e.code, printable, timestamp: performance.now() };
  }

  window.addEventListener('keydown', (e) => {
    // ゲーム中の誤スクロール等を防ぐ（テキスト入力欄では抑止しない）
    const tag = document.activeElement?.tagName;
    if (tag !== 'INPUT' && tag !== 'TEXTAREA' && e.key === ' ') {
      e.preventDefault();
    }
    sceneManager.handleKey(normalize(e, 'down'));
  });

  window.addEventListener('keyup', (e) => {
    sceneManager.handleKey(normalize(e, 'up'));
  });
}
