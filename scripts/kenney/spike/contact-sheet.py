"""readable-dog spike (task 1.2): a contact sheet of the packed test pose, as the Stage would draw it.

usage: python3 contact-sheet.py <spike-atlas-dir> <out.png>
Rows: plain walk, walk with the head turned to the Handler (`walklook`) in a light coat, the same in the golden and
black coats (multiply tint, as Phaser's setTint), and `walklook` at about its size on a phone at the walk zoom.
Columns: the 8 facings. Frames are cut from the packed, palette-quantised atlas (pack-sprites.py --sets rdog).
"""
import json, sys
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw

src, out = Path(sys.argv[1]), Path(sys.argv[2])
meta = json.loads((src / 'sprites.json').read_text())['frames']
atlas = Image.open(src / 'sprites.png').convert('RGBA')
FACINGS = [0, 45, 90, 135, 180, 225, 270, 315]
GRASS = (200, 222, 186, 255)

def frame(name):
    r = meta[name]['frame']
    return atlas.crop((r['x'], r['y'], r['x'] + r['w'], r['y'] + r['h']))

def tint(im, rgb):
    t = ImageChops.multiply(im, Image.new('RGBA', im.size, rgb + (255,)))
    t.putalpha(im.getchannel('A'))
    return t

rows = [
    ('walk', 'rdog_walk1_{}', None, 2),
    ('walk + head to Handler', 'rdog_walklook1_{}', None, 2),
    ('golden coat', 'rdog_walklook1_{}', (0xf0, 0xb4, 0x5c), 2),
    ('black coat', 'rdog_walklook1_{}', (0x55, 0x55, 0x5c), 2),
    ('phone size (~1x)', 'rdog_walklook1_{}', (0xf0, 0xb4, 0x5c), 1 / 1.5 * 1.3),
]
fw = max(meta[n]['frame']['w'] for n in meta); fh = max(meta[n]['frame']['h'] for n in meta)
CW, CH, LW, TOP = int(fw * 2) + 8, int(fh * 2) + 8, 170, 22
sheet = Image.new('RGBA', (LW + CW * 8, TOP + CH * len(rows)), GRASS)
d = ImageDraw.Draw(sheet)
for c, f in enumerate(FACINGS):
    d.text((LW + c * CW + CW // 2 - 8, 5), f'{f}', fill=(40, 60, 40, 255))
for r, (label, pat, rgb, scale) in enumerate(rows):
    d.text((8, TOP + r * CH + CH // 2 - 6), label, fill=(40, 60, 40, 255))
    for c, f in enumerate(FACINGS):
        im = frame(pat.format(f))
        if rgb: im = tint(im, rgb)
        im = im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.NEAREST if scale >= 1 else Image.LANCZOS)
        sheet.alpha_composite(im, (LW + c * CW + (CW - im.width) // 2, TOP + r * CH + (CH - im.height) // 2))
sheet.save(out)
print(sheet.size)
