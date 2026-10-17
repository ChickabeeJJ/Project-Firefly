"""Cut the two 4x2 enemy sheets into src/assets/art/enemies/<id>.webp.

usage: python3 tools/art/import_enemies.py <sheetA> <sheetB> [--upA <upscaledA>] [--upB <upscaledB>]
Sheet A is transparent (or keyed if it is not); sheet B is on a flat dark background that is keyed
out. Optional --upA/--upB are AI-upscaled copies used only for colour detail.
"""
import sys, numpy as np
from collections import deque
from PIL import Image, ImageDraw, ImageFilter

A_IDS = ['mothling', 'usher', 'mannequin', 'gloam', 'lampeater', 'hound', 'cogspider', 'chimewisp']
B_IDS = ['keeper', 'siren', 'pendulum', 'gullwraith', 'stevedore', 'hourless', 'widow', 'curtaincaller']
BOSSES = {'gloam', 'keeper', 'hourless', 'curtaincaller'}
OUT = 'src/assets/art/enemies'

def key_background(im):
    """Flood-fill the flat backdrop from the borders, then soften the edge by colour distance."""
    rgb = im.convert('RGB'); a = np.array(rgb).astype(np.float32)
    h, w = a.shape[:2]
    edge = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]]); bg = np.median(edge, 0)
    marker = rgb.copy()
    for xy in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (w // 2, 0), (w // 2, h - 1), (0, h // 2), (w - 1, h // 2)]:
        ImageDraw.floodfill(marker, xy, (255, 0, 255), thresh=22)
    m = np.array(marker); outside = (m[..., 0] == 255) & (m[..., 1] == 0) & (m[..., 2] == 255)
    dist = np.sqrt(((a - bg) ** 2).sum(-1))
    # Pockets of backdrop fenced in by strings or chains: large enclosed areas of the bg colour.
    cand = (dist < 12) & ~outside
    lab = np.zeros(cand.shape, np.int32); n = 0
    for y, x in zip(*np.nonzero(cand)):
        if lab[y, x]: continue
        n += 1; q = deque([(y, x)]); lab[y, x] = n; px = []
        while q:
            cy, cx = q.popleft(); px.append((cy, cx))
            for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
                if 0 <= ny < h and 0 <= nx < w and cand[ny, nx] and not lab[ny, nx]:
                    lab[ny, nx] = n; q.append((ny, nx))
        if len(px) > 250:
            ys, xs = zip(*px); outside[list(ys), list(xs)] = True
    near = np.array(Image.fromarray(outside.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(5))) > 0
    alpha = np.where(outside, 0.0, 1.0)
    edge_px = near & ~outside
    alpha[edge_px] = np.clip((dist[edge_px] - 10) / 30, 0, 1)
    # remove the backdrop colour that bled into soft edges
    al = alpha[..., None]
    col = np.where(al > 0.02, (a - (1 - al) * bg) / np.maximum(al, 0.02), 0)
    out = np.dstack([np.clip(col, 0, 255), alpha * 255]).astype(np.uint8)
    return Image.fromarray(out, 'RGBA')

def mincuts(prof, n, win=0.09):
    L = len(prof); cuts = [0]
    for k in range(1, n):
        c = int(L * k / n); lo, hi = c - int(L * win), c + int(L * win)
        seg = prof[lo:hi]; idx = np.where(seg == seg.min())[0]
        cuts.append(lo + int(idx[len(idx) // 2]))
    cuts.append(L); return cuts

def drop_strays(a):
    """Keep big components and anything not touching the cell edge (orbs, floating cards).
    Returns the cleaned alpha and its bounding box."""
    mask = a[..., 3] > 16; h, w = mask.shape
    lab = np.zeros((h, w), np.int32); n = 0; info = []
    for y, x in zip(*np.nonzero(mask)):
        if lab[y, x]: continue
        n += 1; q = deque([(y, x)]); lab[y, x] = n; cnt = 0; touch = False
        while q:
            cy, cx = q.popleft(); cnt += 1
            if cx <= 1 or cx >= w - 2 or cy <= 1 or cy >= h - 2: touch = True
            for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
                if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not lab[ny, nx]:
                    lab[ny, nx] = n; q.append((ny, nx))
        info.append((cnt, touch))
    big = max(c for c, _ in info); keep = np.zeros_like(mask)
    for i, (c, t) in enumerate(info):
        if c >= big * 0.15 or (not t and c >= big * 0.002): keep |= lab == i + 1
    k = np.array(Image.fromarray(keep.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(5))) > 0
    alpha = np.where(k, a[..., 3], 0).astype(np.uint8)
    ys, xs = np.where(alpha > 8)
    return alpha, (ys.min(), ys.max() + 1, xs.min(), xs.max() + 1)

def split(im, ids, up=None):
    """im: transparent sheet (original resolution). up: optional AI-upscaled RGB copy of it."""
    a = np.array(im); al = a[..., 3] > 24
    f = up.width / im.width if up else 1.0
    upa = np.array(up.convert('RGB')) if up else None
    rc = mincuts(al.sum(1), 2)
    for r in range(2):
        band = al[rc[r]:rc[r + 1]]; cc = mincuts(band.sum(0), 4, 0.07)
        for c in range(4):
            cid = ids[r * 4 + c]
            y0, x0 = rc[r], cc[c]
            cell = a[y0:rc[r + 1], x0:cc[c + 1]].copy()
            alpha, (by0, by1, bx0, bx1) = drop_strays(cell)
            if up:
                box = tuple(int(round(v * f)) for v in (x0 + bx0, y0 + by0, x0 + bx1, y0 + by1))
                rgb = Image.fromarray(upa).crop(box)
                al_img = Image.fromarray(alpha[by0:by1, bx0:bx1]).resize(rgb.size, Image.LANCZOS)
                al_img = al_img.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
                sp = Image.merge('RGBA', (*rgb.split(), al_img))
            else:
                src = cell[by0:by1, bx0:bx1].copy(); src[..., 3] = alpha[by0:by1, bx0:bx1]
                sp = Image.fromarray(src)
            target = 760 if cid in BOSSES else 620
            ratio = target / sp.height
            sp = sp.resize((max(1, round(sp.width * ratio)), target), Image.LANCZOS)
            if not up and ratio > 1:
                rgb = sp.convert('RGB').filter(ImageFilter.UnsharpMask(radius=1.4, percent=60, threshold=2))
                sp = Image.merge('RGBA', (*rgb.split(), sp.split()[3]))
            if cid in FACE_RIGHT: sp = sp.transpose(Image.FLIP_LEFT_RIGHT)
            sp.save(f'{OUT}/{cid}.webp', 'WEBP', quality=88, method=6)
            print(cid, sp.size)

# Sprites drawn facing right get flipped so every enemy faces the troupe (left).
FACE_RIGHT = {'usher', 'hound', 'chimewisp', 'siren', 'hourless', 'widow'}

if __name__ == '__main__':
    # usage: import_enemies.py <sheetA> <sheetB> [--upA <upscaledA>] [--upB <upscaledB>]
    pos = [x for x in sys.argv[1:] if not x.startswith('--') and sys.argv[sys.argv.index(x) - 1] not in ('--upA', '--upB')]
    opt = lambda k: Image.open(sys.argv[sys.argv.index(k) + 1]) if k in sys.argv else None
    sa = Image.open(pos[0]).convert('RGBA')
    if np.array(sa)[..., 3].min() > 200: sa = key_background(sa)
    split(sa, A_IDS, opt('--upA'))
    # Sheet B is keyed at original size; an upscaled copy only supplies colour.
    split(key_background(Image.open(pos[1])), B_IDS, opt('--upB'))
