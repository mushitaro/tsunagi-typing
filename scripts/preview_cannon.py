from PIL import Image

GRID = ['.....XXX.....', '.....XXX.....', 'XXXXXXXXXXXXX', 'XXXXXXXXXXXXX', 'XXXXXXXXXXXXX']
CELL = 16
BG = (10, 10, 10)
FG = (243, 241, 234)

w = len(GRID[0]) * CELL
h = len(GRID) * CELL
img = Image.new("RGB", (w, h), BG)
px = img.load()
for row, line in enumerate(GRID):
    for col, ch in enumerate(line):
        if ch != 'X':
            continue
        for dy in range(CELL):
            for dx in range(CELL):
                px[col * CELL + dx, row * CELL + dy] = FG

img.save(r"C:\Users\kazuh\cannon_preview.png")
print("saved")
