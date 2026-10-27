"""Converts the rendered UGC slide PNGs (out/ugc/Ugc*.png, 1080x1920) into upload-ready JPEGs in
out/ugc/send, named in posting order. TikTok rejects PNG for photo posts."""
from pathlib import Path
from PIL import Image

OUT = Path('out/ugc')
SEND = OUT / 'send'
SEND.mkdir(exist_ok=True)
names = {'UgcA1': 'A-01-cover', 'UgcA2': 'A-02-create', 'UgcA3': 'A-03-sign', 'UgcA4': 'A-04-pay',
         'UgcA5': 'A-05-overdue', 'UgcA6': 'A-06-reminder', 'UgcA7': 'A-07-name', 'UgcBCover': 'B-01-cover'}
for src, name in names.items():
    im = Image.open(OUT / f'{src}.png').convert('RGB')
    assert im.size == (1080, 1920), (src, im.size)  # inside TikTok's 1080x1920 limit
    path = SEND / f'{name}.jpg'
    im.save(path, 'JPEG', quality=92, subsampling=0, optimize=True)
    assert path.stat().st_size < 20e6
print('wrote', len(names), 'JPEGs to', SEND)
