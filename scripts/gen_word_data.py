# -*- coding: utf-8 -*-
"""
単語データ生成スクリプト。海の生き物・さんすうの語彙を大幅拡張するにあたり、
かな→ローマ字の自動導出(kana_romaji.py)を使って手打ちミスを防ぎながら
大量のエントリを一括生成する。既存の js/data/words/*.json をこのスクリプトの
出力で完全に置き換える（このスクリプトが単語データの単一の情報源になる）。

difficulty はローマ字/英単語の文字数から自動算出する:
  長さ <= 4  -> 1
  長さ 5-8   -> 2
  長さ > 8   -> 3
"""
import json
import os

from kana_romaji import kana_to_romaji

BASE = os.path.join(os.path.dirname(__file__), "..", "js", "data", "words")


def difficulty_for(text):
    n = len(text)
    if n <= 4:
        return 1
    if n <= 8:
        return 2
    return 3


def romaji_entry(entry_id, concept_id, category, hiragana, kanji, sprite_id, palette, mirror=False, romaji_override=None):
    romaji = romaji_override if romaji_override is not None else kana_to_romaji(hiragana)
    display = {"hiragana": hiragana}
    if kanji is not None:
        display["kanji"] = kanji
    return {
        "id": entry_id,
        "conceptId": concept_id,
        "category": category,
        "lang": "ja",
        "display": display,
        "typing": {"kana": hiragana, "romajiCanonical": romaji},
        "difficulty": difficulty_for(romaji),
        "spriteId": sprite_id,
        "spriteVariant": {"palette": palette, **({"mirror": True} if mirror else {})},
    }


def direct_entry(entry_id, concept_id, category, target_text, kanji, sprite_id, palette, mirror=False, lang="ja"):
    return {
        "id": entry_id,
        "conceptId": concept_id,
        "category": category,
        "lang": lang,
        "display": {"kanji": kanji} if lang == "ja" else {"word": kanji},
        "typing": {"targetText": target_text},
        "difficulty": difficulty_for(target_text),
        "spriteId": sprite_id,
        "spriteVariant": {"palette": palette, **({"mirror": True} if mirror else {})},
    }


def en_entry(entry_id, concept_id, category, word, sprite_id, palette, mirror=False):
    return {
        "id": entry_id,
        "conceptId": concept_id,
        "category": category,
        "lang": "en",
        "display": {"word": word},
        "typing": {"targetText": word},
        "difficulty": difficulty_for(word),
        "spriteId": sprite_id,
        "spriteVariant": {"palette": palette, **({"mirror": True} if mirror else {})},
    }


# ═══════════════════════════════════════════════════════════════
# 海の生き物 (sea-creatures)
# (conceptId, hiragana, kanji_or_None, english, spriteId, palette, mirror)
# ═══════════════════════════════════════════════════════════════
SEA_CONCEPTS = [
    # --- 既存33概念（そのまま維持） ---
    ("octopus", "たこ", None, "octopus", "octopus-01", "sea-purple", False),
    ("crab", "かに", None, "crab", "crab-01", "sea-orange", False),
    ("pufferfish", "ふぐ", None, "pufferfish", "pufferfish-01", "sea-yellow", False),
    ("dolphin", "いるか", None, "dolphin", "dolphin-01", "sea-blue", False),
    ("whale", "くじら", None, "whale", "whale-01", "sea-blue", False),
    ("shark", "さめ", None, "shark", "shark-01", "sea-mono", False),
    ("shrimp", "えび", None, "shrimp", "shrimp-01", "sea-pink", False),
    ("spiny-lobster", "いせえび", None, "lobster", "lobster-01", "sea-red", False),
    ("squid", "いか", None, "squid", "squid-01", "sea-purple", True),
    ("turtle", "かめ", None, "turtle", "turtle-01", "sea-green", False),
    ("seal", "あざらし", None, "seal", "seal-01", "sea-mono", False),
    ("coral", "さんご", None, "coral", "coral-01", "sea-orange", False),
    ("wave", "なみ", None, "wave", "wave-01", "sea-blue", False),
    ("anchor", "いかり", None, "anchor", "anchor-01", "sea-mono", False),
    ("boat", "ふね", None, "boat", "boat-01", "sea-blue", False),
    ("oyster", "かき", None, "oyster", "oyster-01", "sea-mono", False),
    ("penguin", "ぺんぎん", None, "penguin", "penguin-01", "sea-mono", False),
    ("sea-otter", "らっこ", None, "otter", "otter-01", "sea-orange", False),
    ("starfish", "ひとで", None, "starfish", "starfish-01", "sea-yellow", False),
    ("crocodile", "わに", None, "crocodile", "crocodile-01", "sea-green", False),
    ("swan", "はくちょう", None, "swan", "swan-01", "sea-mono", False),
    ("frog", "かえる", None, "frog", "frog-01", "sea-green", False),
    ("snail", "かたつむり", None, "snail", "snail-01", "sea-orange", False),
    ("jellyfish", "くらげ", None, "jellyfish", "jellyfish-01", "sea-pink", False),
    ("goldfish", "きんぎょ", None, "goldfish", "fish-tropical-01", "sea-red", False),
    ("tropical-fish", "ねったいぎょ", None, "clownfish", "fish-tropical-01", "sea-yellow", True),
    ("fish", "さかな", None, "fish", "fish-01", "sea-blue", False),
    ("blue-whale", "しろながすくじら", None, "blue whale", "whale-02", "sea-mono", False),
    ("shell", "かい", None, "shell", "shell-01", "sea-yellow", False),
    ("mackerel", "さば", None, "mackerel", "fish-01", "sea-mono", True),
    ("tuna", "まぐろ", None, "tuna", "fish-01", "sea-purple", False),
    ("sea-bream", "たい", None, "seabream", "fish-tropical-01", "sea-blue", False),
    ("whale-shark", "じんべえざめ", None, "whale shark", "shark-01", "sea-blue", True),
    # --- 新規追加（既存スプライトを再利用） ---
    ("horse-mackerel", "あじ", None, "horse mackerel", "fish-01", "sea-yellow", False),
    ("sardine", "いわし", None, "sardine", "fish-01", "sea-teal", True),
    ("bonito", "かつお", None, "bonito", "fish-01", "sea-red", True),
    ("yellowtail", "ぶり", None, "yellowtail", "fish-tropical-01", "sea-green", False),
    ("saury", "さんま", None, "saury", "fish-01", "sea-pink", False),
    ("flounder", "ひらめ", None, "flounder", "fish-tropical-01", "sea-green", True),
    ("flatfish", "かれい", None, "flatfish", "fish-tropical-01", "sea-orange", True),
    ("conger-eel", "あなご", None, "conger eel", "squid-01", "sea-yellow", False),
    ("eel", "うなぎ", None, "eel", "squid-01", "sea-orange", True),
    ("carp", "こい", None, "carp", "fish-01", "sea-orange", False),
    ("loach", "どじょう", None, "loach", "squid-01", "sea-teal", False),
    ("young-yellowtail", "はまち", None, "hamachi", "fish-tropical-01", "sea-purple", False),
    ("cod", "たら", None, "cod", "fish-01", "sea-purple", True),
    ("salmon", "さけ", None, "salmon", "fish-tropical-01", "sea-pink", True),
    ("herring", "にしん", None, "herring", "fish-01", "sea-green", False),
    ("killifish", "めだか", None, "killifish", "fish-tropical-01", "sea-teal", True),
    ("king-crab", "たらばがに", None, "king crab", "crab-01", "sea-red", False),
    ("snow-crab", "ずわいがに", None, "snow crab", "crab-01", "sea-mono", False),
    ("mantis-shrimp", "しゃこ", None, "mantis shrimp", "shrimp-01", "sea-orange", False),
    ("short-neck-clam", "あさり", None, "clam", "shell-01", "sea-mono", False),
    ("hard-clam", "はまぐり", None, "hard clam", "shell-01", "sea-green", False),
    ("freshwater-clam", "しじみ", None, "shijimi clam", "shell-01", "sea-purple", False),
    ("scallop", "ほたて", None, "scallop", "oyster-01", "sea-yellow", False),
    ("moon-jellyfish", "みずくらげ", None, "moon jellyfish", "jellyfish-01", "sea-mono", False),
    ("red-jellyfish", "あかくらげ", None, "red jellyfish", "jellyfish-01", "sea-red", True),
    ("sperm-whale", "まっこうくじら", None, "sperm whale", "whale-01", "sea-purple", False),
    ("orca", "しゃち", None, "orca", "dolphin-01", "sea-mono", False),
    ("narwhal", "いっかく", None, "narwhal", "whale-02", "sea-blue", False),
    ("giant-octopus", "みずだこ", None, "giant octopus", "octopus-01", "sea-blue", True),
    ("cuttlefish", "こういか", None, "cuttlefish", "squid-01", "sea-yellow", True),
    ("spear-squid", "やりいか", None, "spear squid", "squid-01", "sea-green", False),
    ("surf-clam", "ほっきがい", None, "surf clam", "shell-01", "sea-pink", False),
    ("abalone", "あわび", None, "abalone", "shell-01", "sea-orange", True),
    ("duck", "あひる", None, "duck", "duck-01", "sea-teal", False),
    ("mermaid", "にんぎょ", None, "mermaid", "mermaid-01", "sea-pink", False),
]

# ═══════════════════════════════════════════════════════════════
# さんすう (math) — ローマ字入力
# ═══════════════════════════════════════════════════════════════
MATH_ROMAJI_CONCEPTS = [
    ("shape-circle", "まる", "丸", "circle", "shape-circle-01", "math-blue", False),
    ("shape-square", "しかく", "四角", "square", "shape-square-01", "math-orange", False),
    ("shape-triangle", "さんかく", "三角", "triangle", "shape-triangle-01", "math-teal", False),
    ("shape-diamond", "ひしがた", "菱形", "diamond", "shape-diamond-01", "math-pink", False),
    ("shape-star", "ほし", "星", "star", "shape-star-01", "math-green", False),
    ("shape-rectangle", "ながしかく", "長方形", "rectangle", "shape-rectangle-01", "math-blue", False),
    ("shape-pentagon", "ごかくけい", "五角形", "pentagon", "shape-pentagon-01", "math-orange", False),
    ("shape-hexagon", "ろっかくけい", "六角形", "hexagon", "shape-hexagon-01", "math-teal", False),
    ("shape-oval", "だえん", "楕円", "oval", "shape-oval-01", "math-pink", False),
    ("unit-hiki", "ひき", "匹", None, "unit-hiki-01", "math-mono", False),
    ("unit-ko", "こ", "個", None, "unit-ko-01", "math-mono", False),
    ("unit-hon", "ほん", "本", None, "unit-hon-01", "math-mono", False),
    ("unit-mai", "まい", "枚", None, "unit-mai-01", "math-mono", False),
    ("unit-dai", "だい", "台", None, "unit-dai-01", "math-mono", False),
    ("unit-satsu", "さつ", "冊", None, "unit-satsu-01", "math-mono", False),
    ("unit-nin", "にん", "人", None, "unit-nin-01", "math-mono", False),
    ("unit-wa", "わ", "羽", None, "unit-wa-01", "math-mono", False),
    ("weekday-mon", "げつようび", "月曜日", "Monday", "weekday-mon-01", "math-blue", False),
    ("weekday-tue", "かようび", "火曜日", "Tuesday", "weekday-tue-01", "math-orange", False),
    ("weekday-wed", "すいようび", "水曜日", "Wednesday", "weekday-wed-01", "math-teal", False),
    ("weekday-thu", "もくようび", "木曜日", "Thursday", "weekday-thu-01", "math-green", False),
    ("weekday-fri", "きんようび", "金曜日", "Friday", "weekday-fri-01", "math-pink", False),
    ("weekday-sat", "どようび", "土曜日", "Saturday", "weekday-sat-01", "math-blue", False),
    ("weekday-sun", "にちようび", "日曜日", "Sunday", "weekday-sun-01", "math-orange", False),
]

# 数字: JA=直接入力(数字キー), EN=綴りをローマ字ならぬ英単語でタイピング
DIGIT_WORDS_EN = {
    0: "zero", 1: "one", 2: "two", 3: "three", 4: "four", 5: "five", 6: "six", 7: "seven",
    8: "eight", 9: "nine", 10: "ten", 11: "eleven", 12: "twelve", 13: "thirteen", 14: "fourteen",
    15: "fifteen", 16: "sixteen", 17: "seventeen", 18: "eighteen", 19: "nineteen", 20: "twenty",
    21: "twentyone", 22: "twentytwo", 23: "twentythree", 24: "twentyfour", 25: "twentyfive",
    26: "twentysix", 27: "twentyseven", 28: "twentyeight", 29: "twentynine", 30: "thirty",
    40: "forty", 50: "fifty", 60: "sixty", 70: "seventy", 80: "eighty", 90: "ninety", 100: "hundred",
}
DIGIT_RANGE = list(range(0, 31)) + [40, 50, 60, 70, 80, 90, 100]
DIGIT_PALETTES = ["math-blue", "math-orange", "math-teal", "math-pink", "math-green"]

# 演算子: JA=直接入力(記号キー) + 読みも保持、EN=英単語
OPERATOR_CONCEPTS = [
    ("op-plus", "+", "たす", "plus", "op-plus-01", "math-orange"),
    ("op-minus", "-", "ひく", "minus", "op-minus-01", "math-blue"),
    ("op-times", "*", "かける", "times", "op-times-01", "math-teal"),
    ("op-divide", "/", "わる", "divide", "op-divide-01", "math-pink"),
    ("op-equals", "=", "いこーる", "equals", "op-equals-01", "math-mono"),
]


def build_sea_lists():
    ja_list = []
    en_list = []
    for concept_id, hira, kanji, en_word, sprite_id, palette, mirror in SEA_CONCEPTS:
        ja_list.append(
            romaji_entry(f"sea-ja-{concept_id}", concept_id, "sea-creatures", hira, kanji, sprite_id, palette, mirror)
        )
        en_list.append(
            en_entry(f"sea-en-{concept_id}", concept_id, "sea-creatures", en_word, sprite_id, palette, mirror)
        )
    return ja_list, en_list


def build_math_lists():
    ja_list = []
    en_list = []

    for concept_id, hira, kanji, en_word, sprite_id, palette, mirror in MATH_ROMAJI_CONCEPTS:
        ja_list.append(
            romaji_entry(f"math-ja-{concept_id}", concept_id, "math", hira, kanji, sprite_id, palette, mirror)
        )
        if en_word is not None:
            en_list.append(
                en_entry(f"math-en-{concept_id}", concept_id, "math", en_word, sprite_id, palette, mirror)
            )

    for i, n in enumerate(DIGIT_RANGE):
        concept_id = f"num-{n}"
        palette = DIGIT_PALETTES[i % len(DIGIT_PALETTES)]
        sprite_id = f"num-{n}-01"
        ja_list.append(
            direct_entry(f"math-ja-{concept_id}", concept_id, "math", str(n), str(n), sprite_id, palette)
        )
        en_list.append(
            en_entry(f"math-en-{concept_id}", concept_id, "math", DIGIT_WORDS_EN[n], sprite_id, palette)
        )

    for concept_id, symbol, hira, en_word, sprite_id, palette in OPERATOR_CONCEPTS:
        entry = direct_entry(f"math-ja-{concept_id}", concept_id, "math", symbol, symbol, sprite_id, palette)
        entry["display"]["hiragana"] = hira  # 読み上げ・参考表示用（タイピング対象ではない）
        ja_list.append(entry)
        en_list.append(en_entry(f"math-en-{concept_id}", concept_id, "math", en_word, sprite_id, palette))

    return ja_list, en_list


def main():
    sea_ja, sea_en = build_sea_lists()
    math_ja, math_en = build_math_lists()

    files = {
        "sea-creatures.ja.json": sea_ja,
        "sea-creatures.en.json": sea_en,
        "math.ja.json": math_ja,
        "math.en.json": math_en,
    }
    for filename, entries in files.items():
        with open(os.path.join(BASE, filename), "w", encoding="utf-8") as f:
            json.dump(entries, f, ensure_ascii=False, indent=2)
        print(f"{filename}: {len(entries)} entries")

    total = sum(len(v) for v in files.values())
    print(f"TOTAL: {total} entries")


if __name__ == "__main__":
    main()
