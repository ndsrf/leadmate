"""readable-dog spike (task 1.3): estimate the shipped atlas with the new Dog in place of the Cube Pet.

usage: python3 atlas-estimate.py <shipped-dir> <spike-atlas-dir> <out-dir>
<shipped-dir> holds today's sprites.{png,json}; <spike-atlas-dir> is pack-sprites.py --sets output for the new Dog.
It drops the shipped `dog_*` frames, adds every spike frame, shelf-packs and palette-quantises exactly as
pack-sprites.py does (1024 wide, 256 colours), writes sprites.{png,json} to <out-dir> and prints the numbers.
Frames are cut back out of already-quantised atlases, so the result is close to, not equal to, a full repack.
"""
import json, sys
from pathlib import Path
from PIL import Image

shipped, spike, out = (Path(a) for a in sys.argv[1:4])
W, MAX = 1024, 2048

def frames_of(d):
    meta = json.loads((d / 'sprites.json').read_text())
    im = Image.open(d / 'sprites.png').convert('RGBA')
    for name, f in meta['frames'].items():
        r = f['frame']
        yield name, im.crop((r['x'], r['y'], r['x'] + r['w'], r['y'] + r['h'])), f

sprites = {n: (im, f) for n, im, f in frames_of(shipped) if not n.startswith('dog_')}
kept = len(sprites)
sprites.update({n: (im, f) for n, im, f in frames_of(spike)})

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
    im, f = sprites[n]
    atlas.paste(im, (px, py))
    frames[n] = {**f, 'frame': {'x': px, 'y': py, 'w': im.width, 'h': im.height}}
out.mkdir(parents=True, exist_ok=True)
atlas.quantize(256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).save(out / 'sprites.png', optimize=True)
(out / 'sprites.json').write_text(json.dumps({'frames': frames, 'meta': {'image': 'sprites.png', 'size': {'w': W, 'h': H}, 'scale': '1'}}, separators=(',', ':')))

def report(label, d):
    meta = json.loads((d / 'sprites.json').read_text())['meta']['size']
    b = (d / 'sprites.png').stat().st_size
    pages = -(-meta['h'] // MAX)
    print(f"{label}: {meta['w']}x{meta['h']} ({pages} page{'s' if pages > 1 else ''} of <= {MAX}x{MAX}), "
          f"PNG {b / 1024:.0f} KB, base64 in the bundle {4 * -(-b // 3) / 1024:.0f} KB, "
          f"decoded RGBA {meta['w'] * meta['h'] * 4 / 2**20:.2f} MiB")

print(f'kept {kept} shipped frames, added {len(sprites) - kept} new Dog frames, {len(sprites)} in all')
report('shipped ', shipped)
report('estimate', out)
