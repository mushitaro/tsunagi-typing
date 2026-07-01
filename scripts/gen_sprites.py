"""
ドット絵スプライト生成スクリプト。
絵文字フォント(Segoe UI Emoji)や和文フォントの実際のグリフをレンダリングし、
アルファ値と明度でしきい値処理して 2 階調(X=本体 / O=暗い部分=目や輪郭)の
ドット絵グリッドに変換する。手描きASCIIアートに頼らず、既に良くデザインされた
アイコン/文字のシルエットを機械的にレトロ・ドット絵化する。

出力: js/data/sprites/sprite-library.json, js/data/sprites/palettes.json
"""
import json
import os

from PIL import Image, ImageDraw, ImageFont

EMOJI_FONT = r"C:\Windows\Fonts\seguiemj.ttf"
JP_FONT = r"C:\Windows\Fonts\YuGothB.ttc"  # 游ゴシック Bold（なければ meiryo にフォールバック）
JP_FONT_FALLBACK = r"C:\Windows\Fonts\meiryo.ttc"
LATIN_FONT = r"C:\Windows\Fonts\arialbd.ttf"

GRID = 18
SUPER = 12  # 1セルあたりのスーパーサンプリング解像度
CANVAS = GRID * SUPER

ALPHA_THRESHOLD = 70
DARK_LUMA_THRESHOLD = 70


def pick_font(path, fallback, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.truetype(fallback, size)


def render_text_to_grid(text, font, embedded_color, pad_ratio=0.06):
    canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)
    kwargs = {"embedded_color": True} if embedded_color else {}
    bbox = draw.textbbox((0, 0), text, font=font, **kwargs)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    pad = int(CANVAS * pad_ratio)
    avail = CANVAS - pad * 2
    scale = min(avail / max(w, 1), avail / max(h, 1))
    if scale < 1:
        # フォントサイズを縮小して再描画
        new_size = max(8, int(font.size * scale))
        font = ImageFont.truetype(font.path, new_size)
        canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
        draw = ImageDraw.Draw(canvas)
        bbox = draw.textbbox((0, 0), text, font=font, **kwargs)
        w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (CANVAS - w) / 2 - bbox[0]
    y = (CANVAS - h) / 2 - bbox[1]
    draw.text((x, y), text, font=font, **kwargs)
    return canvas


def canvas_to_grid(canvas, mono_char=None):
    small = canvas.resize((GRID, GRID), Image.Resampling.BOX)
    px = small.load()
    rows = []
    for row in range(GRID):
        line = []
        for col in range(GRID):
            r, g, b, a = px[col, row]
            if a < ALPHA_THRESHOLD:
                line.append(".")
                continue
            if mono_char:
                line.append(mono_char)
                continue
            luma = 0.299 * r + 0.587 * g + 0.114 * b
            line.append("O" if luma < DARK_LUMA_THRESHOLD else "X")
        rows.append("".join(line))
    return rows


def gen_emoji_sprite(sprite_id, category, tags, emoji, size_pt=190, mono=False):
    font = ImageFont.truetype(EMOJI_FONT, size_pt)
    canvas = render_text_to_grid(emoji, font, embedded_color=True)
    rows = canvas_to_grid(canvas, mono_char=("X" if mono else None))
    return {"id": sprite_id, "size": GRID, "rows": rows, "paletteKey": "X", "tags": tags, "category": category}


def gen_text_sprite(sprite_id, category, tags, text, font_path, fallback_path, size_pt=170):
    font = pick_font(font_path, fallback_path, size_pt)
    canvas = render_text_to_grid(text, font, embedded_color=False)
    rows = canvas_to_grid(canvas, mono_char="X")
    return {"id": sprite_id, "size": GRID, "rows": rows, "paletteKey": "X", "tags": tags, "category": category}


SEA_SPRITES = [
    ("octopus-01", ["sea", "octopus", "cephalopod"], "\U0001F419"),
    ("crab-01", ["sea", "crab", "crustacean"], "\U0001F980"),
    ("fish-tropical-01", ["sea", "fish"], "\U0001F420"),
    ("pufferfish-01", ["sea", "pufferfish", "fish"], "\U0001F421"),
    ("fish-01", ["sea", "fish"], "\U0001F41F"),
    ("dolphin-01", ["sea", "dolphin", "mammal"], "\U0001F42C"),
    ("whale-01", ["sea", "whale", "mammal"], "\U0001F433"),
    ("whale-02", ["sea", "whale", "mammal"], "\U0001F40B"),
    ("shark-01", ["sea", "shark", "fish"], "\U0001F988"),
    ("shrimp-01", ["sea", "shrimp", "crustacean"], "\U0001F990"),
    ("lobster-01", ["sea", "lobster", "crustacean"], "\U0001F99E"),
    ("squid-01", ["sea", "squid", "cephalopod"], "\U0001F991"),
    ("turtle-01", ["sea", "turtle", "reptile"], "\U0001F422"),
    ("seal-01", ["sea", "seal", "mammal"], "\U0001F9AD"),
    ("shell-01", ["sea", "shell"], "\U0001F41A"),
    ("coral-01", ["sea", "coral"], "\U0001FAB8"),
    ("wave-01", ["sea", "wave"], "\U0001F30A"),
    ("anchor-01", ["sea", "anchor", "ship"], "⚓"),
    ("boat-01", ["sea", "boat", "ship"], "\U0001F6A2"),
    ("oyster-01", ["sea", "oyster", "shell"], "\U0001F9AA"),
    ("penguin-01", ["sea", "penguin", "bird"], "\U0001F427"),
    ("otter-01", ["sea", "otter", "mammal"], "\U0001F9A6"),
    ("starfish-01", ["sea", "starfish"], "⭐"),
    ("crocodile-01", ["sea", "crocodile", "reptile"], "\U0001F40A"),
    ("swan-01", ["sea", "swan", "bird"], "\U0001F9A2"),
    ("frog-01", ["sea", "frog", "amphibian"], "\U0001F438"),
    ("snail-01", ["sea", "snail"], "\U0001F40C"),
    ("jellyfish-01", ["sea", "jellyfish"], "\U0001FAFC"),
]

MATH_EMOJI_SPRITES = [
    ("shape-circle-01", ["math", "shape", "circle"], "\U0001F534"),
    ("shape-square-01", ["math", "shape", "square"], "⬛"),
    ("shape-triangle-01", ["math", "shape", "triangle"], "\U0001F53A"),
    ("shape-diamond-01", ["math", "shape", "diamond"], "\U0001F536"),
    ("shape-star-01", ["math", "shape", "star"], "⭐"),
    ("op-plus-01", ["math", "operator", "plus"], "➕"),
    ("op-minus-01", ["math", "operator", "minus"], "➖"),
    ("op-times-01", ["math", "operator", "times"], "✖️"),
    ("op-divide-01", ["math", "operator", "divide"], "➗"),
]

DIGIT_RANGE = list(range(0, 21))  # 0-20（算数の数詞として幅広く使う）

COUNTER_SPRITES = [
    ("unit-hiki-01", ["math", "counter", "hiki"], "匹", "jp"),   # 匹
    ("unit-ko-01", ["math", "counter", "ko"], "個", "jp"),       # 個
    ("unit-hon-01", ["math", "counter", "hon"], "本", "jp"),     # 本
    ("op-equals-01", ["math", "operator", "equals"], "=", "latin"),
]


def main():
    sprites = []

    for sid, tags, emoji in SEA_SPRITES:
        sprites.append(gen_emoji_sprite(sid, "sea-creatures", tags, emoji))

    for sid, tags, emoji in MATH_EMOJI_SPRITES:
        sprites.append(gen_emoji_sprite(sid, "math", tags, emoji))

    for n in DIGIT_RANGE:
        sid = f"num-{n}-01"
        sprites.append(
            gen_text_sprite(sid, "math", ["math", "digit", f"num-{n}"], str(n), LATIN_FONT, LATIN_FONT, size_pt=150)
        )

    for sid, tags, text, kind in COUNTER_SPRITES:
        if kind == "jp":
            sprites.append(gen_text_sprite(sid, "math", tags, text, JP_FONT, JP_FONT_FALLBACK))
        else:
            sprites.append(gen_text_sprite(sid, "math", tags, text, LATIN_FONT, LATIN_FONT))

    out_dir = os.path.join(os.path.dirname(__file__), "..", "js", "data", "sprites")
    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, "sprite-library.json"), "w", encoding="utf-8") as f:
        json.dump({"sprites": sprites}, f, ensure_ascii=False, indent=2)

    print(f"generated {len(sprites)} sprites")


if __name__ == "__main__":
    main()
