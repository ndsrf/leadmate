"""readable-dog (task 3.1): a contact sheet of the packed Husky, as the Stage draws it.

usage: python3 dog-contact-sheet.py <bundle/assets/kenney> <out.png> [<flat-atlas-dir>]
One row per clip (frame 0, light coat), 8 facings across; then the head-turn clips in the golden and black coats, and
at about phone size. With a second atlas of the un-exaggerated turn (`huskyflat`), a before/after pair of rows.
Frames are cut from the packed, palette-quantised atlas.
"""
import json, sys
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw

src, out = Path(sys.argv[1]), Path(sys.argv[2])
flat = Path(sys.argv[3]) if len(sys.argv) > 3 else None
def load(d, base):
    return json.loads((d / f'{base}.json').read_text())['frames'], Image.open(d / f'{base}.png').convert('RGBA')
meta, atlas = load(src, 'husky')
fmeta, fatlas = load(flat, 'huskyflat') if flat else (None, None)
FACINGS = [0, 45, 90, 135, 180, 225, 270, 315]
GRASS = (128, 158, 116, 255)
GOLD, BLACK = (0xf0, 0xb4, 0x5c), (0x55, 0x55, 0x5c)
CLIPS = ['idle', 'walk', 'walkwag', 'trot', 'sniffwalk', 'sniff', 'planted', 'mark', 'lunge', 'lookl', 'lookr']

def cut(m, a, name):
    r = m[name]['frame']
    return a.crop((r['x'], r['y'], r['x'] + r['w'], r['y'] + r['h']))

def tint(im, rgb):
    t = ImageChops.multiply(im, Image.new('RGBA', im.size, rgb + (255,)))
    t.putalpha(im.getchannel('A'))
    return t

rows = [(c, 'husky', f'husky_{c}0_{{}}', None, 1) for c in CLIPS]
if fmeta:
    rows += [('lookl BEFORE', 'flat', 'huskyflat_lookl0_{}', GOLD, 1), ('lookl AFTER', 'husky', 'husky_lookl0_{}', GOLD, 1),
             ('lookr BEFORE', 'flat', 'huskyflat_lookr0_{}', GOLD, 1), ('lookr AFTER', 'husky', 'husky_lookr0_{}', GOLD, 1)]
rows += [('lookl black', 'husky', 'husky_lookl0_{}', BLACK, 1), ('lookl phone size', 'husky', 'husky_lookl0_{}', GOLD, 0.5),
         ('lookr phone size', 'husky', 'husky_lookr0_{}', GOLD, 0.5)]
fw = max(m['frame']['w'] for m in meta.values()); fh = max(m['frame']['h'] for m in meta.values())
CW, CH, LW, TOP = fw + 8, fh + 8, 130, 22
sheet = Image.new('RGBA', (LW + CW * 8, TOP + CH * len(rows)), GRASS)
d = ImageDraw.Draw(sheet)
for c, f in enumerate(FACINGS):
    d.text((LW + c * CW + CW // 2 - 8, 5), f'{f}', fill=(10, 20, 10, 255))
for r, (label, which, pat, rgb, scale) in enumerate(rows):
    d.text((8, TOP + r * CH + CH // 2 - 6), label, fill=(10, 20, 10, 255))
    for c, f in enumerate(FACINGS):
        im = cut(*((fmeta, fatlas) if which == 'flat' else (meta, atlas)), pat.format(f))
        if rgb: im = tint(im, rgb)
        if scale != 1: im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
        sheet.alpha_composite(im, (LW + c * CW + (CW - im.width) // 2, TOP + r * CH + (CH - im.height) // 2))
sheet.save(out)
print(sheet.size)
