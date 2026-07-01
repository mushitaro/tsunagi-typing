/**
 * sprite-library.json: { "sprites": [ { id, size, rows: string[], paletteKey, tags: string[] }, ... ] }
 *   rows は size 文字 x size 行。'.' = 透明、それ以外の1文字 = パレットのキー。
 * palettes.json: { [paletteName]: { [char]: "#rrggbb", ... }, ... }
 */
const SPRITE_LIBRARY_URL = './js/data/sprites/sprite-library.json';
const PALETTES_URL = './js/data/sprites/palettes.json';

let cachePromise = null;

export function loadSpriteLibrary() {
  if (!cachePromise) {
    cachePromise = Promise.all([
      fetch(SPRITE_LIBRARY_URL).then((r) => r.json()),
      fetch(PALETTES_URL).then((r) => r.json()),
    ]).then(([library, palettes]) => {
      const spritesById = new Map(library.sprites.map((s) => [s.id, s]));
      return { spritesById, palettes };
    });
  }
  return cachePromise;
}

/**
 * variant: { palette: string, mirror?: boolean }
 * 戻り値: { size, cells: [{row, col, color}] }
 *   cells はスプライトIDとバリアントでシード化した疑似ランダム順（=破壊順）に並んでいる。
 *   pixel-sprite-renderer はこの配列の先頭から破壊していくだけでよい。
 */
export function resolveSpriteVariant(spriteId, variant, library) {
  const sprite = library.spritesById.get(spriteId);
  if (!sprite) throw new Error(`Unknown sprite: ${spriteId}`);

  const paletteName = variant?.palette ?? Object.keys(library.palettes)[0];
  const palette = library.palettes[paletteName] ?? {};
  const mirror = !!variant?.mirror;
  const size = sprite.size;

  const cells = [];
  for (let row = 0; row < size; row++) {
    const line = sprite.rows[row] ?? '';
    for (let col = 0; col < size; col++) {
      const ch = line[col] ?? '.';
      if (ch === '.' || ch === ' ') continue;
      const color = palette[ch] ?? palette.X ?? '#f3f1ea';
      const displayCol = mirror ? size - 1 - col : col;
      cells.push({ row, col: displayCol, color });
    }
  }

  const seed = hashString(`${spriteId}:${paletteName}:${mirror ? 'm' : 'n'}`);
  return { size, cells: seededShuffle(cells, seed) };
}

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle(arr, seed) {
  const rand = mulberry32(seed);
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
