"""
Extend the Japanese wafuu image: large diamond zones with visible patterns.
"""
from PIL import Image, ImageDraw
import math, random

random.seed(7)

GOLD      = (200, 162,  45)
MID_GOLD  = (165, 130,  32)
DIM_GOLD  = (115,  88,  20)
BLACK     = (  8,   6,   4)
CREAM     = (228, 208, 162)
PALE_PINK = (198, 168, 178)

# zone background colors — clearly distinguishable but still dark/elegant
Z_RED   = ( 48,  10,  10)
Z_NAVY  = ( 10,  12,  52)
Z_GREEN = ( 10,  46,  14)
Z_WINE  = ( 40,   8,  22)
Z_PLUM  = ( 24,  10,  40)
Z_PINE  = (  8,  38,  22)

# ── pattern primitives ────────────────────────────────────────────

def seigaiha(td, w, h, r, bg, line):
    y, row = r, 0
    while y < h + r:
        x = (r if row % 2 else 0)
        while x < w + r:
            td.pieslice([x-r, y-r, x+r, y+r], 180, 360, fill=bg, outline=line)
            ir = int(r * .58)
            td.arc([x-ir, y-ir, x+ir, y+ir], 180, 360, fill=DIM_GOLD, width=1)
            x += r * 2
        y += r; row += 1

def asanoha(td, w, h, sz, line):
    step = int(sz * 2)
    y = step // 2
    while y < h + step:
        x = step // 2
        while x < w + step:
            for deg in range(0, 360, 60):
                a  = math.radians(deg)
                a2 = math.radians(deg + 60)
                ex,  ey  = x + sz*math.cos(a),  y + sz*math.sin(a)
                ex2, ey2 = x + sz*math.cos(a2), y + sz*math.sin(a2)
                td.line([(x,y),(ex,ey)],     fill=line, width=1)
                td.line([(ex,ey),(ex2,ey2)], fill=line, width=1)
            x += step
        y += step

def kikkou(td, w, h, r, bg, line):
    hh = math.sqrt(3) * r
    col, x = 0, 0.0
    while x < w + r:
        y = hh / 2 if col % 2 else 0.0
        while y < h + r:
            pts = [(x + r*math.cos(math.radians(60*i)),
                    y + r*math.sin(math.radians(60*i))) for i in range(6)]
            td.polygon(pts, fill=bg, outline=line)
            y += hh
        x += r * 1.5; col += 1

def shippo(td, w, h, line):
    r = 28; row = 0; y = 0
    while y < h + r:
        x = (r if row % 2 else 0)
        while x < w + r * 2:
            td.arc([x-r, y-r, x+r, y+r], 0, 360, fill=line, width=2)
            x += r * 2
        y += r; row += 1

def sakura_field(td, w, h):
    for _ in range(22):
        sx = random.randint(12, w - 12)
        sy = random.randint(12, h - 12)
        r  = random.randint(12, 22)
        pc = CREAM if random.random() > .45 else PALE_PINK
        for i in range(5):
            a  = math.radians(72*i - 90)
            px, py = sx + r*math.cos(a), sy + r*math.sin(a)
            td.ellipse([px-r*.42, py-r*.42, px+r*.42, py+r*.42], fill=pc)
        td.ellipse([sx-r*.22, sy-r*.22, sx+r*.22, sy+r*.22], fill=GOLD)
    for _ in range(12):
        fx = random.randint(4, w - 4)
        fy = random.randint(4, h - 4)
        fr = random.randint(3, 7)
        td.ellipse([fx-fr, fy-fr, fx+fr, fy+fr],
                   fill=PALE_PINK if random.random() > .5 else CREAM)

def wave_lines(td, w, h, line):
    sp = 22; amp = 14; freq = 55
    y = 0
    while y < h:
        pts = [(x, y + amp*math.sin(2*math.pi*x/freq))
               for x in range(0, w + 2, 3)]
        for i in range(len(pts)-1):
            td.line([pts[i], pts[i+1]], fill=line, width=1)
        y += sp

# ── zone definitions (each covers a vertical band of the extension) ─

def fill_zone(canvas, x0, y0, x1, y1, bg, fn):
    """Fill a rectangular zone with a pattern tile (clipped)."""
    w = x1 - x0; h = y1 - y0
    if w <= 0 or h <= 0:
        return
    tile  = Image.new('RGB', (w, h), bg)
    fn(ImageDraw.Draw(tile), w, h)
    canvas.paste(tile, (x0, y0))

# ── main ─────────────────────────────────────────────────────────

original = Image.open(r'C:\Users\tryss\maro-hp3\public\ChatGPT Image 2026年5月19日 18_08_56.png')
orig_w, orig_h = original.size
print(f"Original: {orig_w}×{orig_h}")

SCALE   = 3
new_h   = orig_h * SCALE
ext_h   = new_h - orig_h          # 4344 px
SPACING = 220                     # diamond diagonal (half-spacing = 110)
HALF    = SPACING // 2

canvas = Image.new('RGB', (orig_w, new_h), BLACK)
canvas.paste(original, (0, 0))

# ── 1. Fill the entire extension with a background ───────────────
fill_zone(canvas, 0, orig_h, orig_w, new_h, BLACK,
          lambda td, w, h: None)

# ── 2. Build a diamond grid: fill each cell with its own pattern ──
# The diamond grid has rows/cols in 45-deg rotated coords.
# Cell centre: cx = col*HALF, cy = orig_h + row*HALF
# Only cells where (row+col) is even form filled diamonds.

FILLS = [
    (Z_RED,   lambda td,w,h: seigaiha  (td,w,h, 32, Z_RED,   MID_GOLD)),
    (Z_NAVY,  lambda td,w,h: asanoha   (td,w,h, 26, MID_GOLD)),
    (Z_GREEN, lambda td,w,h: kikkou    (td,w,h, 26, Z_GREEN, MID_GOLD)),
    (Z_WINE,  lambda td,w,h: sakura_field(td,w,h)),
    (Z_PLUM,  lambda td,w,h: shippo    (td,w,h, MID_GOLD)),
    (Z_PINE,  lambda td,w,h: wave_lines(td,w,h, MID_GOLD)),
    (Z_RED,   lambda td,w,h: asanoha   (td,w,h, 24, MID_GOLD)),
    (Z_NAVY,  lambda td,w,h: seigaiha  (td,w,h, 28, Z_NAVY,  MID_GOLD)),
    (Z_GREEN, lambda td,w,h: sakura_field(td,w,h)),
    (Z_WINE,  lambda td,w,h: kikkou    (td,w,h, 24, Z_WINE,  MID_GOLD)),
    (Z_PLUM,  lambda td,w,h: wave_lines(td,w,h, MID_GOLD)),
    (Z_PINE,  lambda td,w,h: shippo    (td,w,h, MID_GOLD)),
]

tile_cache = {}
cell = 0

for row_k in range(-2, ext_h // HALF + 4):
    for col_k in range(-2, orig_w // HALF + 4):
        if (row_k + col_k) % 2 != 0:
            continue
        cx = col_k * HALF
        cy = orig_h + row_k * HALF
        if cy + HALF < orig_h or cy - HALF > new_h:
            continue

        idx = cell % len(FILLS)
        bg, fn = FILLS[idx]

        if idx not in tile_cache:
            t = Image.new('RGB', (SPACING, SPACING), bg)
            fn(ImageDraw.Draw(t), SPACING, SPACING)
            tile_cache[idx] = t
        tile = tile_cache[idx]

        # Diamond (rotated square) mask
        mask = Image.new('L', (SPACING, SPACING), 0)
        ImageDraw.Draw(mask).polygon(
            [(HALF, 0), (SPACING, HALF), (HALF, SPACING), (0, HALF)],
            fill=240)

        dx0, dy0 = cx - HALF, cy - HALF
        sx0 = max(0, -dx0);           sy0 = max(orig_h, dy0) - dy0
        ex0 = min(SPACING, orig_w - dx0)
        ey0 = min(SPACING, new_h  - dy0)
        if ex0 > sx0 and ey0 > sy0:
            canvas.paste(tile.crop((sx0, sy0, ex0, ey0)),
                         (dx0 + sx0, dy0 + sy0),
                         mask.crop((sx0, sy0, ex0, ey0)))
        cell += 1

# ── 3. Draw gold diagonal lines over extension ───────────────────
draw = ImageDraw.Draw(canvas)

for b in range(-SPACING * 6, orig_w + new_h + SPACING * 6, SPACING):
    # ↘  y = x + b
    pts = [(x, x + b) for x in range(0, orig_w + 1, 3)
           if orig_h - SPACING <= x + b <= new_h]
    for i in range(len(pts) - 1):
        draw.line([pts[i], pts[i+1]], fill=GOLD, width=2)

    # ↙  y = -x + b
    pts = [(x, -x + b) for x in range(0, orig_w + 1, 3)
           if orig_h - SPACING <= -x + b <= new_h]
    for i in range(len(pts) - 1):
        draw.line([pts[i], pts[i+1]], fill=GOLD, width=2)

# Thin highlight on each line
for b in range(-SPACING * 6, orig_w + new_h + SPACING * 6, SPACING):
    pts = [(x, x + b) for x in range(0, orig_w + 1, 3)
           if orig_h <= x + b <= new_h]
    for i in range(len(pts) - 1):
        draw.line([pts[i], pts[i+1]], fill=(230, 195, 70), width=1)

    pts = [(x, -x + b) for x in range(0, orig_w + 1, 3)
           if orig_h <= -x + b <= new_h]
    for i in range(len(pts) - 1):
        draw.line([pts[i], pts[i+1]], fill=(230, 195, 70), width=1)

# ── 4. Smooth seam ────────────────────────────────────────────────
FADE = 200
for y in range(orig_h - FADE, min(orig_h + FADE // 2, new_h)):
    t = (y - (orig_h - FADE)) / (FADE * 1.5)
    t = max(0.0, min(1.0, t))
    for x in range(orig_w):
        op = original.getpixel((x, min(y, orig_h - 1)))
        ep = canvas.getpixel((x, y))
        canvas.putpixel((x, y),
            tuple(int(op[c] * (1 - t) + ep[c] * t) for c in range(3)))

# ── 5. Save ───────────────────────────────────────────────────────
out = r'C:\Users\tryss\maro-hp3\public\wafuu_extended.png'
canvas.save(out)
print(f"Saved {orig_w}×{new_h} → {out}")
