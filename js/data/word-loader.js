/**
 * 単語エントリ (JA):
 * { id, conceptId, category, lang: "ja",
 *   display: { kanji?, hiragana }, typing: { kana, romajiCanonical },
 *   difficulty, spriteId, spriteVariant: { palette, mirror? } }
 *
 * 単語エントリ (EN):
 * { id, conceptId, category, lang: "en",
 *   display: { word }, typing: { targetText },
 *   difficulty, spriteId, spriteVariant: { palette, mirror? } }
 *
 * manifest.json: { categories: [{ id, labelJa, labelEn, files: { ja, en } }] }
 */
const MANIFEST_URL = './js/data/words/manifest.json';
const WORDS_BASE = './js/data/words/';

let cachePromise = null;

export function loadWords() {
  if (!cachePromise) {
    cachePromise = fetch(MANIFEST_URL)
      .then((r) => r.json())
      .then(async (manifest) => {
        const byCategory = new Map();
        const byConceptId = new Map();

        for (const cat of manifest.categories) {
          const [jaList, enList] = await Promise.all([
            fetch(WORDS_BASE + cat.files.ja).then((r) => r.json()),
            fetch(WORDS_BASE + cat.files.en).then((r) => r.json()),
          ]);
          byCategory.set(cat.id, { ja: jaList, en: enList });

          const enByConcept = new Map(enList.map((w) => [w.conceptId, w]));
          for (const jaWord of jaList) {
            byConceptId.set(jaWord.conceptId, {
              ja: jaWord,
              en: enByConcept.get(jaWord.conceptId) ?? null,
            });
          }
        }

        return { byCategory, byConceptId, categories: manifest.categories };
      });
  }
  return cachePromise;
}

export function getWordsFor(wordData, categoryId, lang) {
  return wordData.byCategory.get(categoryId)?.[lang] ?? [];
}
