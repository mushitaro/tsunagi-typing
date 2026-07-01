const ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
  ['-'],
];

/** オンスクリーンキーボード。次に押すキーをハイライトする（未就学児向けにキー配列を可視化）。 */
export function createKeyboardOverlay(container) {
  container.innerHTML = '';
  const keyEls = new Map();

  for (const row of ROWS) {
    const rowEl = document.createElement('div');
    rowEl.className = 'kb-row';
    for (const key of row) {
      const keyEl = document.createElement('span');
      keyEl.className = 'kb-key';
      keyEl.textContent = key;
      rowEl.appendChild(keyEl);
      keyEls.set(key, keyEl);
    }
    container.appendChild(rowEl);
  }

  function highlight(char) {
    for (const el of keyEls.values()) el.classList.remove('is-next');
    const target = keyEls.get((char || '').toLowerCase());
    target?.classList.add('is-next');
  }

  return { highlight };
}
