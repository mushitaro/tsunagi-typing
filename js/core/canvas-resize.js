/**
 * canvas要素の表示サイズ変化を ResizeObserver で監視し、内部解像度(width/height属性)を追従させる。
 * mount直後の一度きりの getBoundingClientRect() 呼び出しはレイアウト未確定のタイミングで
 * 0サイズを拾ってしまう競合が起きうるため、ResizeObserver を単一の真実の情報源として使う
 * （初回発火時に必ず正しいサイズで呼ばれる）。
 * @returns {() => void} 監視解除関数
 */
export function observeCanvasResize(canvas, onResize) {
  function apply(width, height) {
    const w = Math.max(1, Math.round(width));
    const h = Math.max(1, Math.round(height));
    if (canvas.width === w && canvas.height === h) return;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.imageSmoothingEnabled = false;
    onResize?.(w, h);
  }

  const ro = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const box = entry.contentBoxSize?.[0];
      const width = box ? box.inlineSize : entry.contentRect.width;
      const height = box ? box.blockSize : entry.contentRect.height;
      apply(width, height);
    }
  });
  ro.observe(canvas);

  // 一部の環境（一部のヘッドレス/自動化ブラウザ）では ResizeObserver の初回発火が
  // 遅れる/発火しないことがあるため、rAF後に一度だけ実測値でフォールバック適用する。
  requestAnimationFrame(() => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) apply(rect.width, rect.height);
  });

  return () => ro.disconnect();
}
