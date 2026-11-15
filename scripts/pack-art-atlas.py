"""Packs a folder of PNG frames into one palette-quantised Phaser JSON-hash atlas (sprites.png + sprites.json).

usage: python3 pack-art-atlas.py <png-dir> <out-dir> [--trim] [--pivot X,Y]
Needs Pillow. With --trim each frame is cropped to its opaque box and the JSON keeps spriteSourceSize / sourceSize, so a set
drawn on one shared canvas keeps its registration. Used by scripts/render-hud-art.mjs.
"""
import json, sys
from pathlib import Path
from PIL import Image

src, out = Path(sys.argv[1]), Path(sys.argv[2])
trim = '--trim' in sys.argv
pivot = (0.5, 0.5)
if '--pivot' in sys.argv:
    pivot = tuple(float(v) for v in sys.argv[sys.argv.index('--pivot') + 1].split(','))

sprites = {}
for f in sorted(src.glob('*.png')):
    im = Image.open(f).convert('RGBA')
    box = (0, 0) + im.size
    if trim:
        b = im.getbbox()
        if b: box = b
    sprites[f.stem] = (im.crop(box), box, im.size)

W = 512
while W < max(im.width for im, _, _ in sprites.values()) + 2: W *= 2
x = y = row = 0
place = {}
for n in sorted(sprites, key=lambda n: -sprites[n][0].height):
    im = sprites[n][0]
    if x + im.width + 2 > W: x, y, row = 0, y + row + 2, 0
    place[n] = (x + 1, y + 1)
    x += im.width + 2
    row = max(row, im.height)
H = 1
while H < y + row + 2: H *= 2
atlas = Image.new('RGBA', (W, H))
frames = {}
for n in sorted(sprites):
    im, box, full = sprites[n]
    px, py = place[n]
    atlas.paste(im, (px, py))
    frames[n] = {'frame': {'x': px, 'y': py, 'w': im.width, 'h': im.height}, 'rotated': False, 'trimmed': trim,
                 'spriteSourceSize': {'x': box[0], 'y': box[1], 'w': im.width, 'h': im.height}, 'sourceSize': {'w': full[0], 'h': full[1]},
                 'pivot': {'x': round(pivot[0], 4), 'y': round(pivot[1], 4)}, 'res': 1.0}
out.mkdir(parents=True, exist_ok=True)
q = atlas.quantize(256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
q.save(out / 'sprites.png', optimize=True)
(out / 'sprites.json').write_text(json.dumps({'frames': frames, 'meta': {'image': 'sprites.png', 'size': {'w': W, 'h': H}, 'scale': '1'}}, separators=(',', ':')))
print(f"{len(frames)} frames, {(out / 'sprites.png').stat().st_size} bytes, {W}x{H}")
