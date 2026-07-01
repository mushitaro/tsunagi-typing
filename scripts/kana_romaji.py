"""
js/romaji/kana-table.js + romaji-matcher.js の buildMatchPlan() 相当ロジックのPython移植。
大量の単語データを手打ちすることによるローマ字表記ミスを防ぐため、
かな文字列から「正規のローマ字表記」(canonical variant のみ)を自動導出する。
入力判定エンジン本体（複数バリアント許容・状態機械）はJS側がそのまま担当し、
このスクリプトは「コンテンツ生成時に romajiCanonical を正しく機械的に埋める」ためだけに使う。
"""

KANA_TO_ROMAJI = {
    "あ": "a", "い": "i", "う": "u", "え": "e", "お": "o",
    "か": "ka", "き": "ki", "く": "ku", "け": "ke", "こ": "ko",
    "さ": "sa", "し": "shi", "す": "su", "せ": "se", "そ": "so",
    "た": "ta", "ち": "chi", "つ": "tsu", "て": "te", "と": "to",
    "な": "na", "に": "ni", "ぬ": "nu", "ね": "ne", "の": "no",
    "は": "ha", "ひ": "hi", "ふ": "fu", "へ": "he", "ほ": "ho",
    "ま": "ma", "み": "mi", "む": "mu", "め": "me", "も": "mo",
    "や": "ya", "ゆ": "yu", "よ": "yo",
    "ら": "ra", "り": "ri", "る": "ru", "れ": "re", "ろ": "ro",
    "わ": "wa", "を": "wo", "ん": "n",
    "が": "ga", "ぎ": "gi", "ぐ": "gu", "げ": "ge", "ご": "go",
    "ざ": "za", "じ": "ji", "ず": "zu", "ぜ": "ze", "ぞ": "zo",
    "だ": "da", "ぢ": "ji", "づ": "zu", "で": "de", "ど": "do",
    "ば": "ba", "び": "bi", "ぶ": "bu", "べ": "be", "ぼ": "bo",
    "ぱ": "pa", "ぴ": "pi", "ぷ": "pu", "ぺ": "pe", "ぽ": "po",
    "ゔ": "vu",
    "きゃ": "kya", "きゅ": "kyu", "きょ": "kyo",
    "しゃ": "sha", "しゅ": "shu", "しょ": "sho",
    "ちゃ": "cha", "ちゅ": "chu", "ちょ": "cho",
    "にゃ": "nya", "にゅ": "nyu", "にょ": "nyo",
    "ひゃ": "hya", "ひゅ": "hyu", "ひょ": "hyo",
    "みゃ": "mya", "みゅ": "myu", "みょ": "myo",
    "りゃ": "rya", "りゅ": "ryu", "りょ": "ryo",
    "ぎゃ": "gya", "ぎゅ": "gyu", "ぎょ": "gyo",
    "じゃ": "ja", "じゅ": "ju", "じょ": "jo",
    "びゃ": "bya", "びゅ": "byu", "びょ": "byo",
    "ぴゃ": "pya", "ぴゅ": "pyu", "ぴょ": "pyo",
    "ー": "-",
}
YOON_SMALL = set("ゃゅょ")
SOKUON = "っ"


def tokenize(kana):
    chars = list(kana)
    tokens = []
    i = 0
    while i < len(chars):
        c = chars[i]
        nxt = chars[i + 1] if i + 1 < len(chars) else None
        if nxt in YOON_SMALL and (c + nxt) in KANA_TO_ROMAJI:
            tokens.append(c + nxt)
            i += 2
        else:
            tokens.append(c)
            i += 1
    return tokens


def kana_to_romaji(kana):
    """かな文字列 -> 正規ローマ字表記（最初の候補のみ、JS版 displayRomaji と同じ規則）。"""
    tokens = tokenize(kana)
    out = []
    i = 0
    while i < len(tokens):
        tok = tokens[i]
        if tok == SOKUON:
            nxt = tokens[i + 1] if i + 1 < len(tokens) else None
            nxt_r = KANA_TO_ROMAJI.get(nxt) if nxt else None
            if nxt_r:
                out.append(nxt_r[0] + nxt_r)
                i += 2
                continue
            out.append("t")
            i += 1
            continue
        out.append(KANA_TO_ROMAJI.get(tok, tok))
        i += 1
    return "".join(out)


if __name__ == "__main__":
    tests = [
        ("らっこ", "rakko"),
        ("いこーる", "iko-ru"),
        ("きんぎょ", "kingyo"),
        ("じんべえざめ", "jinbeezame"),
        ("あざらし", "azarashi"),
        ("しろながすくじら", "shironagasukujira"),
    ]
    for kana, expected in tests:
        actual = kana_to_romaji(kana)
        status = "OK" if actual == expected else "FAIL"
        print(f"{status}: {kana} -> {actual} (expected {expected})")
