import json
import os

from PIL import Image

BASE = os.path.join(os.path.dirname(__file__), "..", "js", "data", "sprites")
CELL = 12

BG = (20, 19, 16)
X_COLOR = (243, 241, 234)
O_COLOR = (125, 211, 192)


def render_sprite(sprite, cell=CELL):
    size = sprite["size"]
    img = Image.new("RGB", (size * cell, size * cell), BG)
    px = img.load()
    for row in range(size):
        line = sprite["rows"][row]
        for col in range(size):
            ch = line[col] if col < len(line) else "."
            if ch == ".":
                continue
            color = O_COLOR if ch == "O" else X_COLOR
            for dy in range(cell):
                for dx in range(cell):
                    px[col * cell + dx, row * cell + dy] = color
    return img


def main():
    with open(os.path.join(BASE, "sprite-library.json"), encoding="utf-8") as f:
        data = json.load(f)
    sprites = data["sprites"]

    cols = 8
    rows = (len(sprites) + cols - 1) // cols
    tile = 18 * CELL
    pad = 6
    sheet = Image.new("RGB", (cols * (tile + pad), rows * (tile + pad)), (10, 10, 8))
    for i, sprite in enumerate(sprites):
        img = render_sprite(sprite)
        cx = (i % cols) * (tile + pad)
        cy = (i // cols) * (tile + pad)
        sheet.paste(img, (cx, cy))

    out_path = os.path.join(os.path.dirname(__file__), "..", "..", "sprite_preview.png")
    out_path = os.path.abspath(out_path)
    sheet.save(out_path)
    print("saved", out_path)
    print([s["id"] for s in sprites])


if __name__ == "__main__":
    main()
