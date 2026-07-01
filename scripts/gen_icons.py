"""
PWAアプリアイコン生成スクリプト。
スペースインベーダーの象徴的な「エイリアン」絵文字(👾)のグリフをドット絵化し、
TSUNAGIカラー（背景 #0a0a0a / ドット #f3f1ea）でモノクロのアイコンとして書き出す。
16x16グリッドに一度落としてから最近傍補間で192px/512pxへ拡大することで、
本物のドット絵らしいクッキリしたブロック感を出す（既存スプライトと同じ手法）。
"""
import os

from PIL import Image, ImageDraw, ImageFont

EMOJI_FONT = r"C:\Windows\Fonts\seguiemj.ttf"
GRID = 16
SUPER = 12
CANVAS = GRID * SUPER
ALPHA_THRESHOLD = 60

BG = (10, 10, 10, 255)  # #0a0a0a
FG = (243, 241, 234, 255)  # #f3f1ea


def render_grid():
    font = ImageFont.truetype(EMOJI_FONT, 190)
    canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)
    glyph = "\U0001F47E"  # 👾 alien monster
    bbox = draw.textbbox((0, 0), glyph, font=font, embedded_color=True)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (CANVAS - w) / 2 - bbox[0]
    y = (CANVAS - h) / 2 - bbox[1]
    draw.text((x, y), glyph, font=font, embedded_color=True)

    small = canvas.resize((GRID, GRID), Image.Resampling.BOX)
    px = small.load()
    grid = []
    for row in range(GRID):
        line = []
        for col in range(GRID):
            _, _, _, a = px[col, row]
            line.append(a >= ALPHA_THRESHOLD)
        grid.append(line)
    return grid


def render_icon(grid, size, padding_ratio=0.0):
    img = Image.new("RGBA", (size, size), BG)
    px = img.load()
    pad = int(size * padding_ratio)
    avail = size - pad * 2
    cell = avail / GRID
    for row in range(GRID):
        for col in range(GRID):
            if not grid[row][col]:
                continue
            x0 = int(pad + col * cell)
            y0 = int(pad + row * cell)
            x1 = int(pad + (col + 1) * cell)
            y1 = int(pad + (row + 1) * cell)
            for yy in range(y0, y1):
                for xx in range(x0, x1):
                    px[xx, yy] = FG
    return img


def main():
    grid = render_grid()
    out_dir = os.path.join(os.path.dirname(__file__), "..", "icons")
    os.makedirs(out_dir, exist_ok=True)

    icon_192 = render_icon(grid, 192, padding_ratio=0.08)
    icon_192.convert("RGB").save(os.path.join(out_dir, "icon-192.png"))

    icon_512 = render_icon(grid, 512, padding_ratio=0.08)
    icon_512.convert("RGB").save(os.path.join(out_dir, "icon-512.png"))

    # maskable版: セーフゾーンを広めに取る（周囲20%を背景色のみにする）
    icon_512_maskable = render_icon(grid, 512, padding_ratio=0.20)
    icon_512_maskable.convert("RGB").save(os.path.join(out_dir, "icon-512-maskable.png"))

    print("icons generated:", os.listdir(out_dir))


if __name__ == "__main__":
    main()
