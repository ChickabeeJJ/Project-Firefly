"""Builds the two CrazyGames preview videos from captured gameplay frames.
usage: python3 assemble.py <video_dir> <cover_dir>"""
import glob, math, os, subprocess, sys
from PIL import Image, ImageFilter
V, C = sys.argv[1], sys.argv[2]
FPS, XF = 30, 15  # 0.5 s crossfades

RANGES = {'battle': [(0, 41), (141, 255)], 'summon': [(30, 175)]}

def frames(name):
    fs = sorted(glob.glob(f'{V}/frames_{name}/*.png'))
    if name in RANGES:
        fs = [f for a, b in RANGES[name] for f in fs[a:b]]
    return fs

ease = lambda t: 0.5 - 0.5 * math.cos(math.pi * max(0.0, min(1.0, t)))

def cover_seg(path, n, W, H, z0=1.0, z1=1.06):
    im = Image.open(path).convert('RGB')
    out = []
    for i in range(n):
        z = z0 + (z1 - z0) * ease(i / (n - 1))
        w, h = im.width / z, im.height / z
        x0, y0 = (im.width - w) / 2, (im.height - h) * 0.45
        out.append(lambda x0=x0, y0=y0, w=w, h=h: im.resize((W, H), Image.LANCZOS, box=(x0, y0, x0 + w, y0 + h)))
    return out

def game_seg(name, W, H, pan=None):
    """pan: list of (t, x) keyframes for the left edge of a 2:3 window (portrait only)."""
    fs = frames(name)
    out = []
    for i, f in enumerate(fs):
        def make(f=f, i=i):
            im = Image.open(f).convert('RGB')
            if pan is None:
                return im if im.size == (W, H) else im.resize((W, H), Image.LANCZOS)
            t = i / max(1, len(fs) - 1)
            x = pan[0][1]
            for (ta, xa), (tb, xb) in zip(pan, pan[1:]):
                if ta <= t <= tb:
                    x = xa + (xb - xa) * ease((t - ta) / (tb - ta))
            cw = 1080 * 2 / 3
            crop = im.resize((W, H), Image.LANCZOS, box=(x, 0, x + cw, 1080))
            return crop.filter(ImageFilter.UnsharpMask(1.2, 45, 2))
        out.append(make)
    return out

def render(segs, W, H, outfile):
    tmp = f'{V}/out_{W}x{H}'
    os.makedirs(tmp, exist_ok=True)
    for f in glob.glob(f'{tmp}/*.jpg'):
        os.remove(f)
    k = 0
    prev_tail = []
    for si, seg in enumerate(segs):
        body = seg
        if si > 0:
            # crossfade the last XF frames of the previous segment into the first XF of this one
            for j in range(XF):
                a = prev_tail[j]()
                b = body[j]()
                Image.blend(a, b, ease((j + 1) / (XF + 1))).save(f'{tmp}/{k:05d}.jpg', quality=97); k += 1
            body = body[XF:]
        last = si == len(segs) - 1
        keep = body if last else body[:-XF]
        for fn in keep:
            fn().save(f'{tmp}/{k:05d}.jpg', quality=97); k += 1
        prev_tail = body[-XF:]
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', str(FPS), '-i', f'{tmp}/%05d.jpg', '-an', '-c:v', 'libx264',
                    '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart', outfile], check=True)
    print(outfile, k, 'frames', f'{k / FPS:.1f}s', f'{os.path.getsize(outfile) / 1e6:.1f} MB')

# Landscape 1920x1080
render([
    cover_seg(f'{C}/key_landscape_1920x1080.png', 75, 1920, 1080),
    game_seg('battle', 1920, 1080),
    game_seg('story', 1920, 1080),
    game_seg('summon', 1920, 1080),
    game_seg('lobby', 1920, 1080),
], 1920, 1080, f'{V}/preview_landscape_1920x1080.mp4')

# Portrait 1080x1620 (2:3): eased camera pans across the 16:9 game.
render([
    cover_seg(f'{C}/key_portrait_1080x1620.png', 75, 1080, 1620),
    game_seg('battle', 1080, 1620, pan=[(0, 140), (0.6, 140), (0.78, 1150), (1, 1150)]),
    game_seg('story', 1080, 1620, pan=[(0, 1000), (0.7, 1000), (1, 260)]),
    game_seg('summon', 1080, 1620, pan=[(0, 600), (1, 600)]),
    game_seg('lobby', 1080, 1620, pan=[(0, 470), (1, 440)]),
], 1080, 1620, f'{V}/preview_portrait_1080x1620.mp4')
