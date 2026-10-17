"""Turn a black-background idle MP4 into transparent PNG frames that line up with the still render.

usage: python3 tools/art/key_idle_video.py <frames_dir> <out_dir> <still_render> <scale>
frames_dir: PNGs extracted at the still render's full size (ffmpeg -vf scale=W:H).
The output is cropped to the still's opaque bounding box and multiplied by <scale>, so the video
and characters/<id>.webp show the figure at exactly the same size. Frames are written forward then
backward (ping-pong), so the clip ends on its first frame and can hold there between loops.
"""
import sys, glob, numpy as np
from PIL import Image, ImageDraw, ImageFilter

RAW, OUT, STILL, SCALE = sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4])
BG = 16        # brightest value still treated as backdrop
POCKET = 1500  # enclosed dark areas larger than this (px) are backdrop showing through gaps

still = np.array(Image.open(STILL).convert('RGBA'))[..., 3]
ys, xs = np.where(still > 8)
box = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)

def key(frame):
    a = np.array(frame.convert('RGB')).astype(np.float32)
    m = a.max(-1)
    h, w = m.shape
    cand = Image.fromarray(((m <= BG) * 255).astype(np.uint8))
    # 1) backdrop connected to the frame edge
    fill = cand.copy()
    for x in range(0, w, 16):
        for y in (0, h - 1):
            if fill.getpixel((x, y)) == 255: ImageDraw.floodfill(fill, (x, y), 128)
    for y in range(0, h, 16):
        for x in (0, w - 1):
            if fill.getpixel((x, y)) == 255: ImageDraw.floodfill(fill, (x, y), 128)
    bg = np.array(fill) == 128
    # 2) large enclosed pockets of near-black (between branches, inside cages)
    rest = np.array(fill)
    seeds = np.argwhere((rest == 255) & (m <= 8))
    for y, x in seeds[::97]:
        if rest[y, x] != 255: continue
        ImageDraw.floodfill(fill, (int(x), int(y)), 64)
        rest = np.array(fill)
        region = rest == 64
        if region.sum() > POCKET: bg |= region
        fill.paste(Image.fromarray(np.where(region, 100, rest).astype(np.uint8)))
        rest = np.array(fill)
    # soft edge: grow the backdrop by 2 px and fade by brightness across that band
    grown = np.array(Image.fromarray(bg.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(5))) > 0
    alpha = np.ones_like(m)
    alpha[bg] = 0
    band = grown & ~bg
    alpha[band] = np.clip((m[band] - 8) / 30, 0, 1)
    alpha = np.array(Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.7))).astype(np.float32) / 255
    al = np.maximum(alpha, 1e-3)[..., None]
    col = np.where(alpha[..., None] > 0.97, a, np.clip(a / al, 0, 255))   # remove black fringe
    return Image.fromarray(np.dstack([col, alpha * 255]).astype(np.uint8), 'RGBA')

files = sorted(glob.glob(f'{RAW}/*.png'))
size = (round((box[2] - box[0]) * SCALE), round((box[3] - box[1]) * SCALE))
size = (size[0] // 2 * 2, size[1] // 2 * 2)
for i, f in enumerate(files):
    key(Image.open(f)).crop(box).resize(size, Image.LANCZOS).save(f'{OUT}/{i:03d}.png')
n = len(files)
for j, k in enumerate(range(n - 2, 0, -1)):
    Image.open(f'{OUT}/{k:03d}.png').save(f'{OUT}/{n + j:03d}.png')
print('box', box, 'size', size, 'frames', n, '->', 2 * n - 2)
