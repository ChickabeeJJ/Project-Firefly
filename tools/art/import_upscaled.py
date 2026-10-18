"""Bring an AI-upscaled (4x) character render into the game at a sensible size.

usage: python3 tools/art/import_upscaled.py <upscaled.png> <id> [height=1600]
Lanczos-reduces the 4x render (supersampling keeps edges crisp), caps the width, and writes
characters/<id>.webp. Heads are left alone unless they are regenerated separately.
"""
import sys
from PIL import Image, ImageFilter
src, cid = sys.argv[1], sys.argv[2]
H = int(sys.argv[3]) if len(sys.argv) > 3 else 1600
im = Image.open(src).convert('RGBA')
s = min(H / im.height, 2300 / im.width)
im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
rgb = im.convert('RGB').filter(ImageFilter.UnsharpMask(radius=1.2, percent=40, threshold=2))
out = rgb.convert('RGBA'); out.putalpha(im.split()[3])
out.save(f'src/assets/art/characters/{cid}.webp', 'WEBP', quality=90, method=6)
print(cid, out.size)
