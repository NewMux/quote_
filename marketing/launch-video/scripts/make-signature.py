"""Draws the sample signature (the same strokes as the video's) to a transparent PNG, since the
app's PDF template embeds signatures as PNG images. Output: scripts/assets/signature.png."""
import re
from PIL import Image, ImageDraw

PATHS = [
    'M18 84 C28 44 44 18 55 32 C66 48 38 96 50 96 C62 96 70 56 81 56 C92 56 82 86 93 86 C104 86 109 52 119 53 C130 54 119 87 131 87 C144 87 150 44 161 47 C172 50 160 89 176 86 C191 83 197 57 207 59 C218 61 210 85 223 83 C241 80 252 60 284 48',
    'M36 104 C100 95 182 99 272 90',
]
SCALE = 8  # supersample, then downsample for smooth edges
W, H = 300, 120
img = Image.new('RGBA', (W * SCALE, H * SCALE), (0, 0, 0, 0))
d = ImageDraw.Draw(img)

def bez(p0, p1, p2, p3, n=60):
    for i in range(n + 1):
        t = i / n
        u = 1 - t
        yield (u**3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t**3 * p3[0],
               u**3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t**3 * p3[1])

for path in PATHS:
    nums = [float(x) for x in re.findall(r'-?\d+\.?\d*', path)]
    pts = [(nums[i], nums[i + 1]) for i in range(0, len(nums), 2)]
    cur = pts[0]
    poly = [cur]
    for i in range(1, len(pts), 3):
        poly += list(bez(cur, pts[i], pts[i + 1], pts[i + 2]))[1:]
        cur = pts[i + 2]
    scaled = [(x * SCALE, y * SCALE) for x, y in poly]
    d.line(scaled, fill=(11, 31, 58, 255), width=int(3.4 * SCALE), joint='curve')
    r = 3.4 * SCALE / 2
    for x, y in (scaled[0], scaled[-1]):
        d.ellipse((x - r, y - r, x + r, y + r), fill=(11, 31, 58, 255))

img = img.resize((W * 3, H * 3), Image.LANCZOS)
img.save('scripts/assets/signature.png')
print('signature.png', img.size)
