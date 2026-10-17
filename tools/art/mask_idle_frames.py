"""Clamp keyed idle-video frames to the still render's silhouette.

usage: python3 tools/art/mask_idle_frames.py <frames_dir> <out_dir> <still_render>
Frames must already be cropped/scaled to the still (key_idle_video.py does this). A pixel stays
visible if it lies inside the still's silhouette (grown by a few px for idle motion) or is clearly
not backdrop (bright). This removes black backdrop trapped inside cages and between branches.
Also writes <out_dir>/poster.png = the first frame, so the lobby can swap still → video seamlessly.
"""
import sys, glob, numpy as np
from PIL import Image, ImageFilter
SRC, OUT, STILL = sys.argv[1:4]
files = sorted(glob.glob(f'{SRC}/*.png'))
size = Image.open(files[0]).size
st = Image.open(STILL).convert('RGBA').resize(size, Image.LANCZOS).split()[3]
grow = st.point(lambda v: 255 if v > 40 else 0).filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(2))
mask = np.array(grow).astype(np.float32) / 255
for i, f in enumerate(files):
    a = np.array(Image.open(f).convert('RGBA')).astype(np.float32)
    lum = a[..., :3].max(-1)
    bright = np.clip((lum - 34) / 20, 0, 1)
    keep = np.maximum(mask, bright)
    a[..., 3] *= keep
    a[..., 3][a[..., 3] < 6] = 0
    out = Image.fromarray(a.clip(0, 255).astype(np.uint8), 'RGBA')
    out.save(f'{OUT}/{i:03d}.png')
    if i == 0: out.save(f'{OUT}/poster.png')
print('masked', len(files))
