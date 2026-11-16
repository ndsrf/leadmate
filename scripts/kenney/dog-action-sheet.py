"""Assembles dog-action-shots.mjs output (<dir>/<action>-<coat>.png) into one sheet: usage: dog-action-sheet.py <dir> <out.png> [actions,...]"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw
src, out = Path(sys.argv[1]), sys.argv[2]
acts = sys.argv[3].split(',') if len(sys.argv) > 3 else ['idle','walk','walk_wag','trot','sniffwalk','sniff','planted','mark','lunge','look_l','look_r','alert']
coats = ['golden','black','chocolate','cream','white','grey','red']
w, h = 180, 170
sh = Image.new('RGB', (110 + w * len(coats), 20 + h * len(acts)), (255, 255, 255)); d = ImageDraw.Draw(sh)
for c, n in enumerate(coats): d.text((110 + c * w + 70, 4), n, fill=(0, 0, 0))
for r, a in enumerate(acts):
    d.text((6, 20 + r * h + h // 2), a, fill=(0, 0, 0))
    for c, n in enumerate(coats): sh.paste(Image.open(src / f'{a}-{n}.png').convert('RGB'), (110 + c * w, 20 + r * h))
sh.save(out)
