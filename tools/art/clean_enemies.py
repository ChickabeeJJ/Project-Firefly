"""Finish AI-upscaled enemy renders so they read clean in battle.

usage: python3 tools/art/clean_enemies.py <upscaled_dir> [ids...]
Takes <upscaled_dir>/<id>.png (a 4x Real-ESRGAN pass of enemies/<id>.webp, which already removes
JPEG noise and pixel stepping) and writes enemies/<id>.webp at 1.5x the old height:
  - alpha: drops the faint haze, tightens the soft edge, and bleeds interior colour outwards so
    downscaling cannot pull a dark or white fringe into the silhouette;
  - tone: a gentle levels stretch and local contrast, a touch of saturation;
  - detail: Lanczos supersampling, then a light unsharp mask at the final size.
"""
import glob, os, sys
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

OUT = 'src/assets/art/enemies'


def bleed(rgb, alpha, passes=6):
    """Fill RGB under transparent pixels with the average of opaque neighbours (edge decontamination)."""
    rgb = rgb.copy()
    known = alpha > 0.6
    for _ in range(passes):
        acc = np.zeros_like(rgb); cnt = np.zeros(alpha.shape, np.float32)
        for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (1, 1), (-1, 1), (1, -1)]:
            k = np.roll(np.roll(known, dy, 0), dx, 1)
            acc += np.roll(np.roll(rgb, dy, 0), dx, 1) * k[..., None]; cnt += k
        grow = (~known) & (cnt > 0)
        rgb[grow] = acc[grow] / cnt[grow][:, None]
        known = known | grow
    return rgb


def clean(src, cid):
    im = Image.open(src).convert('RGBA')
    a = np.asarray(im).astype(np.float32) / 255
    rgb, al = a[..., :3], a[..., 3]
    # Tighten the matte: clear haze below 5%, and steepen the ramp so edges are crisp, not cloudy.
    al = np.clip((al - 0.05) / 0.85, 0, 1)
    al = al * al * (3 - 2 * al)
    rgb = bleed(rgb, al)
    im = Image.fromarray((np.dstack([rgb, al]) * 255 + 0.5).astype(np.uint8), 'RGBA')
    H = round(im.height * 1.5 / 4)  # the source is a 4x pass
    im = im.resize((round(im.width * H / im.height), H), Image.LANCZOS)
    rgb = im.convert('RGB')
    # Levels: lift nothing, sink the darkest 0.5% to true dark and clip the top 0.3%.
    arr = np.asarray(rgb).astype(np.float32)
    m = np.asarray(im.split()[3]) > 128
    lo, hi = np.percentile(arr[m], [0.5, 99.7]) if m.any() else (0, 255)
    arr = np.clip((arr - lo * 0.6) / (hi - lo * 0.6) * 255, 0, 255)
    rgb = Image.fromarray(arr.astype(np.uint8))
    rgb = rgb.filter(ImageFilter.UnsharpMask(radius=6, percent=22, threshold=0))  # local contrast
    rgb = ImageEnhance.Color(rgb).enhance(1.06)
    rgb = rgb.filter(ImageFilter.UnsharpMask(radius=0.9, percent=55, threshold=2))  # fine detail
    out = rgb.convert('RGBA'); out.putalpha(im.split()[3])
    out.save(f'{OUT}/{cid}.webp', 'WEBP', quality=90, method=6)
    print(cid, '->', out.size)


if __name__ == '__main__':
    d = sys.argv[1]
    ids = sys.argv[2:] or [os.path.basename(p)[:-4] for p in sorted(glob.glob(f'{d}/*.png'))]
    for cid in ids:
        clean(f'{d}/{cid}.png', cid)
