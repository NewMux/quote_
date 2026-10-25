"""Builds the app's icon files in ../../assets from the Invoice Them mark (public/brand/mark.svg).

  python3 -I scripts/make-app-icons.py            (CHROME=/path/to/headless_shell to override)

The mark is rasterized with headless Chromium (the SVG is too complex for ImageMagick), then
composed with PIL: the iOS icon (1024, opaque, no pre-rounded corners; iOS rounds it), the
Android adaptive layers (background, foreground inside the 66/108 safe zone, monochrome), the
web favicon and the splash icon.
"""
import os
import subprocess
import tempfile
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT.parent.parent / 'assets'
MARK = ROOT / 'public/brand/mark.svg'
MIDNIGHT = (0x12, 0x11, 0x2B)
CHROME = os.environ.get('CHROME', '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell')


def rasterize_mark(width=2400):
    """The mark on a transparent background, cropped to its own bounds."""
    with tempfile.TemporaryDirectory() as tmp:
        html = Path(tmp) / 'mark.html'
        out = Path(tmp) / 'mark.png'
        h = round(width * 72 / 69)
        html.write_text(f'<html><body style="margin:0;background:transparent"><img src="file://{MARK}" style="display:block;width:{width}px;height:{h}px"></body></html>')
        subprocess.run(
            [CHROME, '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--hide-scrollbars',
             '--default-background-color=00000000', f'--screenshot={out}', f'--window-size={width},{h}', f'file://{html}'],
            check=True, capture_output=True,
        )
        img = Image.open(out).convert('RGBA')
    return img.crop(img.getchannel('A').getbbox())


def place(mark, canvas, height_fraction):
    """Centers the mark on `canvas` (an RGBA image) at `height_fraction` of its height."""
    size = canvas.size[1]
    h = round(size * height_fraction)
    w = round(mark.width * h / mark.height)
    m = mark.resize((w, h), Image.LANCZOS)
    canvas.alpha_composite(m, ((size - w) // 2, (size - h) // 2))
    return canvas


mark = rasterize_mark()
print('mark', mark.size)

# iOS: opaque midnight square, no alpha.
icon = place(mark, Image.new('RGBA', (1024, 1024), MIDNIGHT + (255,)), 0.56)
icon.convert('RGB').save(ASSETS / 'icon.png')

# Android adaptive icon: the launcher masks a 108 dp canvas to a circle of ~66 dp, so the mark's
# height stays under 61% of it. Background solid midnight; foreground transparent.
Image.new('RGBA', (512, 512), MIDNIGHT + (255,)).save(ASSETS / 'android-icon-background.png')
place(mark, Image.new('RGBA', (512, 512), (0, 0, 0, 0)), 0.46).save(ASSETS / 'android-icon-foreground.png')

# Themed (monochrome) icon: the mark's shape in opaque black; Android tints it. The text lines and
# pen stroke in the SVG are midnight shapes, not holes, so opacity comes from how lime a pixel is
# (the green channel: ~242 on lime, ~17 on midnight) and those details come out transparent.
green = mark.getchannel('G').point(lambda v: max(0, min(255, round((v - 17) / (242 - 17) * 255))))
alpha = Image.composite(green, Image.new('L', mark.size, 0), mark.getchannel('A'))
silhouette = Image.new('RGBA', mark.size, (0, 0, 0, 255))
silhouette.putalpha(alpha)
place(silhouette, Image.new('RGBA', (432, 432), (0, 0, 0, 0)), 0.46).save(ASSETS / 'android-icon-monochrome.png')

# Web favicon and splash icon.
place(mark, Image.new('RGBA', (48, 48), MIDNIGHT + (255,)), 0.62).save(ASSETS / 'favicon.png')
place(mark, Image.new('RGBA', (1024, 1024), (0, 0, 0, 0)), 0.5).save(ASSETS / 'splash-icon.png')
print('wrote', sorted(p.name for p in ASSETS.glob('*.png')))
