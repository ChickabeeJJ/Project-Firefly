"""Re-centre icons on their visual mass and even out their apparent size.

usage: python3 tools/art/recenter.py <size> <coverage> <files...>
Each icon is shifted so its alpha-weighted centroid sits at the centre, then scaled so the
opaque area covers `coverage` (0..1) of the square — so a slim icon and a busy one read alike.
"""
import sys, numpy as np
from PIL import Image
size, cov = int(sys.argv[1]), float(sys.argv[2])
for f in sys.argv[3:]:
    im = Image.open(f).convert('RGBA'); a = np.array(im)[..., 3].astype(float) / 255
    ys, xs = np.nonzero(a > 0.05)
    w = a[ys, xs]; cy, cx = (ys * w).sum() / w.sum(), (xs * w).sum() / w.sum()
    area = (a > 0.3).sum() / (im.width * im.height)
    k = (cov / max(area, 1e-3)) ** 0.5
    # Never let the art overflow the square after scaling about its centroid.
    reach = max(cx - xs.min(), xs.max() - cx, cy - ys.min(), ys.max() - cy)
    k = min(k, (im.width / 2 - 2) / reach)
    big = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    out = Image.new('RGBA', (im.width, im.height))
    out.alpha_composite(big, (round(im.width / 2 - cx * k), round(im.height / 2 - cy * k)))
    out.resize((size, size), Image.LANCZOS).save(f, 'WEBP', quality=92, method=6)
    print(f.split('/')[-1], round(k, 2))
