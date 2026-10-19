"""Slim the art for the CrazyGames build (initial download target: well under 20 MB).

usage: python3 tools/art/cg_compress.py [--dry]
Re-encodes drop-in art in place with per-folder caps. Every cap stays at or above the size the
game draws the image at, so nothing is upscaled on screen; the savings come from WebP settings
(method 6, sharp YUV) and trimming headroom that the 1920x1080 canvas never shows.
"""
import glob, os, sys
from PIL import Image

ROOT = 'src/assets/art'
# folder -> (max height, max width, quality). Full character art is drawn at most ~1180 px tall.
RULES = {
    'characters': (1240, 1700, 82),
    'battle': (640, 900, 84),
    'enemies': (930, 1140, 86),
    'bg': (1080, 1920, 82),
    'heads': (256, 256, 88),
    'ui': (900, 1920, 86),
}


def slim(path, rule, dry):
    mh, mw, q = rule
    im = Image.open(path)
    im.load()
    before = os.path.getsize(path)
    k = min(1.0, mh / im.height, mw / im.width)
    if k < 1:
        im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    tmp = path + '.tmp.webp'
    im.save(tmp, 'WEBP', quality=q, method=6, use_sharp_yuv=True)
    after = os.path.getsize(tmp)
    if after < before * 0.97 and not dry:
        os.replace(tmp, path)
    else:
        os.remove(tmp)
        after = before if after >= before * 0.97 else after
    return before, after


if __name__ == '__main__':
    dry = '--dry' in sys.argv
    tb = ta = 0
    for folder, rule in RULES.items():
        fb = fa = 0
        for p in sorted(glob.glob(f'{ROOT}/{folder}/*.webp')):
            b, a = slim(p, rule, dry)
            fb += b
            fa += a
        tb += fb
        ta += fa
        print(f'{folder:11s} {fb / 1e6:6.2f} MB -> {fa / 1e6:6.2f} MB')
    print(f'{"total":11s} {tb / 1e6:6.2f} MB -> {ta / 1e6:6.2f} MB{"  (dry run)" if dry else ""}')
