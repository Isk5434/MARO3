"""
Extend the Japanese wafuu image.
Strategy: fill large zones with visible patterns, then overlay gold diamond grid.
"""
from PIL import Image, ImageDraw
import math, random

random.seed(33)

GOLD     = (198, 160,  42)
MID_GOLD = (162, 128,  30)
DIM_GOLD = (115,  88,  18)
BLACK    = (  8,   6,   4)
CREAM    = (228, 208, 160)
PALE_PNK = (195, 168, 178)
DEEP_RED = (115,  18,  25)

# Zone base colors
Z1 = ( 42,   8,   8)   # deep burgundy
Z2 = (  8,  10,  46)   # deep indigo
Z3 = (  8,  42,  16)   # deep pine green
Z4 = ( 28,   6,  20)   # deep plum

# ── pattern fills (applied to a full rectangular tile) ────────────

def fill_seigaiha(td, w, h, bg, r=45):
    y, row = r, 0
    while y < h + r:
        x = (r if row % 2 else 0)
        while x < w + r:
            td.pieslice([x-r, y-r, x+r, y+r], 180, 360, fill=bg, outline=GOLD)
            ir = int(r * .6)
            td.arc([x-ir, y-ir, x+ir, y+ir], 180, 360, fill=MID_GOLD, width=1)
            ir2 = int(r * .32)
            td.arc([x-ir2, y-ir2, x+ir2, y+ir2], 180, 360, fill=DIM_GOLD, width=1)
            x += r * 2
        y += r; row += 1

def fill_asanoha(td, w, h, sz=34):
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
                td.line([(x,y),(ex,ey)],     fill=GOLD, width=1)
                td.line([(ex,ey),(ex2,ey2)], fill=GOLD, width=1)
            x += step
        y += step

def fill_kikkou(td, w, h, bg, r=32):
    hh = math.sqrt(3) * r
    col, x = 0, 0.0
    while x < w + r:
        y = hh / 2 if col % 2 else 0.0
        while y < h + r:
            pts = [(x + r*math.cos(math.radians(60*i)),
                    y + r*math.sin(math.radians(60*i))) for i in range(6)]
            td.polygon(pts, fill=bg, outline=GOLD)
            y += hh
        x += r * 1.5; col += 1

def fill_shippo(td, w, h, r=32):
    row = 0; y = 0
    while y < h + r:
        x = (r if row % 2 else 0)
        while x < w + r * 2:
            td.arc([x-r, y-r, x+r, y+r], 0, 360, fill=GOLD, width=2)
            x += r * 2
        y += r; row += 1

def fill_sakura(td, w, h):
    random.seed(42)
    for _ in range(35):
        sx = random.randint(15, w - 15)
        sy = random.randint(15, h - 15)
        r  = random.randint(14, 26)
        pc = CREAM if random.random() > .45 else PALE_PNK
        for i in range(5):
            a  = math.radians(72*i - 90)
            px, py = sx + r*math.cos(a), sy + r*math.sin(a)
            td.ellipse([px-r*.42, py-r*.42, px+r*.42, py+r*.42], fill=pc)
        td.ellipse([sx-r*.24, sy-r*.24, sx+r*.24, sy+r*.24], fill=GOLD)
    for _ in range(20):
        fx = random.randint(4, w-4); fy = random.randint(4, h-4)
        fr = random.randint(4, 8)
        td.ellipse([fx-fr,fy-fr,fx+fr,fy+fr],
                   fill=PALE_PNK if random.random()>.5 else CREAM)

def fill_waves(td, w, h):
    sp = 26; amp = 16; freq = 60
    y = 0
    while y < h:
        pts = [(x, y + amp*math.sin(2*math.pi*x/freq))
               for x in range(0, w+2, 3)]
        for i in range(len(pts)-1):
            td.line([pts[i],pts[i+1]], fill=MID_GOLD, width=1)
        y += sp


# ── build zone tiles and paste them ──────────────────────────────

original = Image.open(r'C:\Users\tryss\maro-hp3\public\ChatGPT Image 2026年5月19日 18_08_56.png')
orig_w, orig_h = original.size
print(f"Original: {orig_w}×{orig_h}")

SCALE = 3
new_h = orig_h * SCALE
ext_h = new_h - orig_h      # 4344

canvas = Image.new('RGB', (orig_w, new_h), BLACK)
canvas.paste(original, (0, 0))

# Zone boundaries in the extension
z_h = ext_h // 4   # ~1086 px per zone

zones = [
    (orig_h,          orig_h + z_h,       Z1, lambda td,w,h: fill_seigaiha(td,w,h,Z1)),
    (orig_h + z_h,    orig_h + z_h*2,     Z2, lambda td,w,h: fill_asanoha(td,w,h)),
    (orig_h + z_h*2,  orig_h + z_h*3,     Z3, lambda td,w,h: fill_kikkou(td,w,h,Z3)),
    (orig_h + z_h*3,  new_h,              Z4, lambda td,w,h: fill_sakura(td,w,h)),
]

for y0, y1, bg, fn in zones:
    h_zone = y1 - y0
    tile   = Image.new('RGB', (orig_w, h_zone), bg)
    fn(ImageDraw.Draw(tile), orig_w, h_zone)
    canvas.paste(tile, (0, y0))

# ── soft cross-fades between zones ───────────────────────────────
FADE_Z = 80
for y0, y1, bg, fn in zones[1:]:
    for y in range(y0, min(y0 + FADE_Z, y1)):
        t = (y - y0) / FADE_Z
        prev_row = canvas.getpixel if False else None   # unused
        for x in range(orig_w):
            above = canvas.getpixel((x, y - 1))
            below = canvas.getpixel((x, y))
            canvas.putpixel((x, y),
                tuple(int(above[c]*(1-t) + below[c]*t) for c in range(3)))

# ── overlay gold diagonal grid on entire extension ────────────────
draw   = ImageDraw.Draw(canvas)
SPACING = 220

for b in range(-SPACING * 5, orig_w + new_h + SPACING * 5, SPACING):
    # ↘  y = x + b
    pts = [(x, x + b) for x in range(0, orig_w + 1, 2)
           if orig_h - SPACING <= x + b <= new_h]
    for i in range(len(pts) - 1):
        draw.line([pts[i], pts[i+1]], fill=GOLD, width=2)
        draw.line([pts[i], pts[i+1]], fill=(228, 192, 65), width=1)

    # ↙  y = -x + b
    pts = [(x, b - x) for x in range(0, orig_w + 1, 2)
           if orig_h - SPACING <= b - x <= new_h]
    for i in range(len(pts) - 1):
        draw.line([pts[i], pts[i+1]], fill=GOLD, width=2)
        draw.line([pts[i], pts[i+1]], fill=(228, 192, 65), width=1)

# ── smooth seam at join ───────────────────────────────────────────
FADE = 220
for y in range(orig_h - FADE, min(orig_h + FADE // 3, new_h)):
    t = (y - (orig_h - FADE)) / (FADE * 1.5)
    t = max(0.0, min(1.0, t))
    for x in range(orig_w):
        op = original.getpixel((x, min(y, orig_h - 1)))
        ep = canvas.getpixel((x, y))
        canvas.putpixel((x, y),
            tuple(int(op[c] * (1-t) + ep[c] * t) for c in range(3)))

# ── save ──────────────────────────────────────────────────────────
out = r'C:\Users\tryss\maro-hp3\public\wafuu_extended.png'
canvas.save(out)
print(f"Saved {orig_w}×{new_h} → {out}")
