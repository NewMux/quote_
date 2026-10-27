"""Turns the rendered slide PNGs (out/tiktok/Tik*.png) into upload-ready JPEGs, one folder per post:
out/tiktok/post-A (cover A + ways 1-5 + closer) and out/tiktok/post-B (cover B + the same body).
TikTok rejects PNG for photo posts, so they are JPEG. Checks each file against TikTok's limits."""
import shutil
from pathlib import Path
from PIL import Image

OUT = Path('out/tiktok')
A = ['TikA1', 'TikA2', 'TikA3', 'TikA4', 'TikA5', 'TikA6', 'TikA7']
B = ['TikBCover'] + A[1:]
for folder, ids in (('post-A', A), ('post-B', B)):
    d = OUT / folder
    shutil.rmtree(d, ignore_errors=True)
    d.mkdir(parents=True)
    for i, name in enumerate(ids, 1):
        im = Image.open(OUT / f'{name}.png').convert('RGB')
        assert im.size == (1080, 1440), (name, im.size)  # 3:4, inside TikTok's 1080x1920 limit
        path = d / f'{i:02d}.jpg'
        im.save(path, 'JPEG', quality=92, subsampling=0, optimize=True)
        size_mb = path.stat().st_size / 1e6
        assert size_mb < 20, (path, size_mb)
    print(folder, len(ids), 'slides, max', round(max(p.stat().st_size for p in d.glob('*.jpg')) / 1e6, 2), 'MB')
