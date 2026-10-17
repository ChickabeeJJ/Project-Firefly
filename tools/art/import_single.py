"""Import one transparent character render.

usage: python3 tools/art/import_single.py <image> <id> <headX> <headY> [<headSize>]
headX/headY: face centre as fractions of the trimmed image; headSize: crop side as a fraction of
its height (default 0.3). Writes characters/<id>.webp (max 1100 px tall) and heads/<id>.webp.
"""
import sys, numpy as np
from PIL import Image
src, cid, hx, hy = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4])
hs = float(sys.argv[5]) if len(sys.argv) > 5 else 0.3
im = Image.open(src).convert('RGBA'); a = np.array(im)
ys, xs = np.where(a[..., 3] > 8)
im = im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
if im.height > 1100: im = im.resize((round(im.width * 1100 / im.height), 1100), Image.LANCZOS)
im.save(f'src/assets/art/characters/{cid}.webp', 'WEBP', quality=90, method=6)
W, H = im.size; side = int(H * hs); cx, cy = int(hx * W), int(hy * H)
head = Image.new('RGBA', (side, side)); head.paste(im.crop((cx - side // 2, cy - side // 2, cx + side // 2, cy + side // 2)), (0, 0))
head.resize((256, 256), Image.LANCZOS).save(f'src/assets/art/heads/{cid}.webp', 'WEBP', quality=90)
print(cid, im.size)
