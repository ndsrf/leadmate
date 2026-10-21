"""Packs Kenney CC0 sprites into one palette atlas for the stage scene (bundle/assets/kenney/sprites.{png,json}).

usage: python3 pack-sprites.py <kenney-downloads-dir> <raw-render-dir> <out-dir>
Needs Pillow. <raw-render-dir> is the output of render-sprites.mjs (GLB renders, feet at (160, 230) at 2x).
"""
import json, re, sys
from collections import defaultdict
from pathlib import Path
from PIL import Image

dl, raw, out = (Path(a) for a in sys.argv[1:4])
NATURE = 0.77  # Nature Kit: one 130 px ground diamond is one 2 m tile, which is 100 px in the game
ORIGIN = (160, 230)
HIRES = {'handler': 1.5, 'dog': 1.5}  # drawn bigger than the game scale, so they stay sharp when the camera zooms in; the frame's `res` says by how much
SKIP = {'handlerf'}  # rendered, not packed (not used yet)

# 2D sprites straight from the kits: name -> (file, scale, pivot y)
FRAMES = {}

def kit(name, path, scale, pivot_y=0.9):
    FRAMES[name] = (dl / path, scale, pivot_y)

for n in ['tree_default', 'tree_oak', 'tree_detailed', 'tree_tall', 'tree_fat', 'tree_pineTallA', 'tree_pineRoundC', 'tree_cone', 'tree_pineSmallA']:
    kit(n, f'nature-kit/Isometric/{n}_SE.png', NATURE, 0.97)
for n, s in [('plant_bush', 1.5), ('plant_bushLarge', 1.5), ('plant_bushDetailed', 1.4), ('sign', 1.1), ('flower_redA', 1.2), ('flower_yellowA', 1.2), ('flower_purpleA', 1.2)]:
    kit(n, f'nature-kit/Isometric/{n}_SE.png', NATURE * s, 0.95)
for n in ['lily_large', 'lily_small']:
    kit(n, f'nature-kit/Isometric/{n}_SE.png', NATURE * 1.3, 0.5)
for n in ['rock_smallA', 'rock_smallB', 'rock_largeA', 'stone_smallC']:
    kit(n, f'nature-kit/Isometric/{n}_SE.png', NATURE * 1.2, 0.8)
for n in ['ground_grass', 'ground_pathTile']:
    kit(n, f'nature-kit/Isometric/{n}_SE.png', NATURE, 0.5)
FACING = {0: 'NE', 90: 'SE', 180: 'SW', 270: 'NW'}
for n, s in [('bench', 0.9), ('loungeSofa', 0.5), ('tableCross', 0.5)]:
    for f, d in FACING.items():
        kit(f'{n}_{f}', f'furniture-kit/Isometric/{n}_{d}.png', s)
for n, s in [('trashcan', 0.5), ('pottedPlant', 0.6), ('lampRoundFloor', 0.6), ('bookcaseClosed', 0.6), ('coatRack', 0.6), ('stoolBar', 0.6), ('sideTableDrawers', 0.7), ('cabinetTelevision', 0.6), ('rugDoormat', 0.5)]:
    kit(n, f'furniture-kit/Isometric/{n}_SE.png', s)

def neutral(im):
    """The Dog as a light grey-cream coat, so the game can tint it to any coat colour (a tint can only darken)."""
    gray = im.convert('LA').split()[0]
    px = sorted(v for v, a in zip(gray.getdata(), im.getchannel('A').getdata()) if a > 200)
    k = 245 / max(1, px[int(len(px) * 0.85)])
    gray = gray.point(lambda v: min(255, int(v * k)))
    out = Image.merge('RGBA', (gray, gray, gray, im.getchannel('A')))
    return out

sprites = {}  # name -> (image, pivot)
for name, (path, scale, pivot_y) in FRAMES.items():
    im = Image.open(path).convert('RGBA')
    im = im.crop(im.getbbox())
    im = im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.LANCZOS)
    sprites[name] = (im, (0.5, pivot_y), 1)

# GLB renders: one crop box per set so a frame's feet are always at the same pivot
sets = defaultdict(list)
for f in sorted(raw.glob('*.png')):
    m = re.match(r'^(.*)_([a-z]+\d+)_(\d+)$', f.stem)
    sets[m.group(1)].append(f)
for set_id, files in sets.items():
    if set_id in SKIP: continue
    res = HIRES.get(set_id, 1)
    ims = {f.stem: Image.open(f).convert('RGBA') for f in files}
    x0 = y0 = 10**6; x1 = y1 = 0
    for im in ims.values():
        b = im.getbbox(); x0, y0, x1, y1 = min(x0, b[0]), min(y0, b[1]), max(x1, b[2]), max(y1, b[3])
    x0 -= x0 % 2; y0 -= y0 % 2; x1 += x1 % 2; y1 += y1 % 2
    pivot = ((ORIGIN[0] - x0) / (x1 - x0), (ORIGIN[1] - y0) / (y1 - y0))
    for name, im in ims.items():
        c = im.crop((x0, y0, x1, y1))
        if set_id == 'dog': c = neutral(c)
        sprites[name] = (c.resize((round((x1 - x0) * res / 2), round((y1 - y0) * res / 2)), Image.LANCZOS), pivot, res)

# shelf packing
W = 1024
order = sorted(sprites, key=lambda n: -sprites[n][0].height)
x = y = row = 0; place = {}
for n in order:
    im = sprites[n][0]
    if x + im.width + 1 > W: x, y, row = 0, y + row + 1, 0
    place[n] = (x, y); x += im.width + 1; row = max(row, im.height)
H = y + row + 1
atlas = Image.new('RGBA', (W, H))
frames = {}
for n, (px, py) in place.items():
    im, pivot, res = sprites[n]
    atlas.paste(im, (px, py))
    frames[n] = {'frame': {'x': px, 'y': py, 'w': im.width, 'h': im.height}, 'rotated': False, 'trimmed': False,
                 'spriteSourceSize': {'x': 0, 'y': 0, 'w': im.width, 'h': im.height}, 'sourceSize': {'w': im.width, 'h': im.height},
                 'pivot': {'x': round(pivot[0], 4), 'y': round(pivot[1], 4)}, 'res': res}
out.mkdir(parents=True, exist_ok=True)
q = atlas.quantize(256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
q.save(out / 'sprites.png', optimize=True)
(out / 'sprites.json').write_text(json.dumps({'frames': frames, 'meta': {'image': 'sprites.png', 'size': {'w': W, 'h': H}, 'scale': '1'}}, separators=(',', ':')))
print(len(frames), 'frames', (out / 'sprites.png').stat().st_size // 1024, 'KB', W, H)
