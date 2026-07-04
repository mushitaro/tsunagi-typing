#!/usr/bin/env python3
"""さんすうカテゴリに「かけ算（九九）」の問題を追加/再生成する。

各エントリの見た目（子どもがタイピングするイメージ）:
  式と答え : 5 × 9 = 45   （display.kanji, キャプション大）
  よみ方   : ごっく        （display.reading, キャプション中 / 読み上げ）
  タイプ   : 45            （typing.targetText, 答えを打つ）

九九のよび方（式 a×b の呼称）は伝統的な音読みで、促音化などの慣用形を反映する。
例: 5×9=ごっく, 8×8=はっぱ, 8×9=はっく, 6×9=ろっく, 3×3=さざん, 3×8=さんぱ。

冪等: 既存の conceptId が "mul-" で始まるエントリを一旦除いてから追加するので、
何度実行しても重複しない。実行後に scripts/validate_words.py で検証すること。
"""
import json
import os

BASE = os.path.join(os.path.dirname(__file__), "..", "js", "data", "words")
MATH_JA = os.path.join(BASE, "math.ja.json")

# 各因数の九九での音（前の数 / 後の数）。1 の段は「いん」で始まる。
FIRST = {1: "いん", 2: "に", 3: "さん", 4: "し", 5: "ご", 6: "ろく", 7: "しち", 8: "はち", 9: "く"}
SECOND = {1: "いち", 2: "に", 3: "さん", 4: "し", 5: "ご", 6: "ろく", 7: "しち", 8: "はち", 9: "く"}

# 慣用的な音便（促音化・連濁など）。上記の素直な連結にならないもの。
EXCEPTIONS = {
    (3, 3): "さざん",
    (3, 6): "さぶろく",
    (3, 8): "さんぱ",
    (4, 8): "しは",
    (5, 8): "ごは",
    (5, 9): "ごっく",
    (6, 8): "ろくは",
    (6, 9): "ろっく",
    (7, 8): "しちは",
    (8, 8): "はっぱ",
    (8, 9): "はっく",
}

# 見た目のバリエーション用（いずれも既存の math スプライト / パレット）。
SPRITES = [
    "shape-star-01", "shape-circle-01", "shape-square-01", "shape-triangle-01",
    "shape-diamond-01", "shape-pentagon-01", "shape-hexagon-01", "op-times-01",
]
PALETTES = ["math-blue", "math-orange", "math-teal", "math-pink", "math-green"]


def reading(a, b):
    if (a, b) in EXCEPTIONS:
        return EXCEPTIONS[(a, b)]
    return FIRST[a] + SECOND[b]


def build_entries():
    entries = []
    i = 0
    for a in range(1, 10):
        for b in range(1, 10):
            ans = a * b
            yomi = reading(a, b)
            entries.append({
                "id": f"math-ja-mul-{a}x{b}",
                "conceptId": f"mul-{a}x{b}",
                "category": "math",
                "lang": "ja",
                "display": {
                    "kanji": f"{a} × {b} = {ans}",
                    "reading": yomi,
                    "hiragana": yomi,
                },
                "typing": {"targetText": str(ans)},
                # 答えの数字を打つだけなので既存の数字エントリ(difficulty 1)と同じ易しさにする。
                # word-queue は易→難の順で先頭 roundSize 語を出題するため、ここを 2 にすると
                # difficulty 1 の数字が多数あるぶんに埋もれて 1 ラウンドに出てこなくなる。
                "difficulty": 1,
                "spriteId": SPRITES[i % len(SPRITES)],
                "spriteVariant": {"palette": PALETTES[i % len(PALETTES)]},
            })
            i += 1
    return entries


def main():
    with open(MATH_JA, encoding="utf-8") as f:
        data = json.load(f)

    before = len(data)
    data = [w for w in data if not str(w.get("conceptId", "")).startswith("mul-")]
    kept = len(data)

    entries = build_entries()
    data += entries

    with open(MATH_JA, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"math.ja.json: {before} -> {len(data)} entries "
          f"(kept {kept} non-mul, added {len(entries)} multiplication)")
    # サンプル出力（目視確認用）
    for a, b in [(1, 1), (2, 3), (5, 9), (6, 9), (8, 8), (8, 9), (9, 9)]:
        print(f"  {a}×{b} = {a*b}  よみ: {reading(a, b)}")


if __name__ == "__main__":
    main()
