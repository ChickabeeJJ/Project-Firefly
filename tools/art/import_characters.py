"""Cut the two 4x3 character sheets into src/assets/art/characters/<id>.webp and heads/<id>.webp.

usage:
  python3 tools/art/import_characters.py <sheetA> <sheetB> [--upA <upscaledA> --upB <upscaledB>]

The sheets must have transparent backgrounds. Optional --upA/--upB are AI-upscaled copies of the
same sheets (any background, any scale factor): their colour is used with the original
transparency enlarged to match, so edges stay clean and details come from the upscaler.
"""
import sys, numpy as np
from collections import deque
from PIL import Image, ImageFilter

A_IDS = ['delphine', 'bastian', 'hesper', 'teddy', None, 'nell', None, 'percival', 'wren', None, 'clementine', 'augustin']
B_IDS = ['marigold', 'ichabod', 'ottoline', 'kit', None, None, None, 'evangeline', 'rook', None, 'odile', None]
# Face centres (as fractions of the trimmed sprite) where the automatic head finder misses.
HEAD = {'wren': (0.53, 0.18), 'rook': (0.57, 0.105), 'evangeline': (0.54, 0.14), 'delphine': (0.50, 0.12)}
OUT = 'src/assets/art'
MAX_H = 1100  # stored height; the game downsizes as needed

def mincuts(prof, n, win):
    L = len(prof); cuts = [0]
    for k in range(1, n):
        c = int(L * k / n); lo, hi = c - int(L * win), c + int(L * win)
        seg = prof[lo:hi]; idx = np.where(seg == seg.min())[0]
        cuts.append(lo + int(idx[len(idx) // 2]))
    cuts.append(L); return cuts

def keep_mask(alpha):
    mask = alpha > 16; h, w = mask.shape
    lab = np.zeros((h, w), np.int32); n = 0; info = []
    for y, x in zip(*np.nonzero(mask)):
        if lab[y, x]: continue
        n += 1; q = deque([(y, x)]); lab[y, x] = n; cnt = 0; touch = False
        while q:
            cy, cx = q.popleft(); cnt += 1
            if cx <= 1 or cx >= w - 2 or cy >= h - 2: touch = True
            for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
                if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not lab[ny, nx]:
                    lab[ny, nx] = n; q.append((ny, nx))
        info.append((cnt, touch))
    big = max(c for c, _ in info); keep = np.zeros_like(mask)
    for i, (c, t) in enumerate(info):
        if (c >= big * 0.02 and not (t and c < big * 0.15)) or (c >= 40 and not t): keep |= lab == i + 1
    return np.array(Image.fromarray(keep.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(5))) > 0

def process(sheet, up, ids):
    a = np.array(sheet.convert('RGBA')); al = a[..., 3] > 24
    f = up.width / sheet.width if up else 1.0
    upa = np.array(up.convert('RGB')) if up else None
    rc = mincuts(al.sum(1), 3, 0.09)
    for r in range(3):
        band = al[rc[r]:rc[r + 1]]; cc = mincuts(band.sum(0), 4, 0.07)
        for c in range(4):
            cid = ids[r * 4 + c]
            if not cid: continue
            y0, y1, x0, x1 = rc[r], rc[r + 1], cc[c], cc[c + 1]
            cell = a[y0:y1, x0:x1].copy()
            alpha = np.where(keep_mask(cell[..., 3]), cell[..., 3], 0).astype(np.uint8)
            ys, xs = np.where(alpha > 8)
            by0, by1, bx0, bx1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
            if up:
                box = tuple(int(round(v * f)) for v in (x0 + bx0, y0 + by0, x0 + bx1, y0 + by1))
                rgb = Image.fromarray(upa).crop(box)
                al_img = Image.fromarray(alpha[by0:by1, bx0:bx1]).resize(rgb.size, Image.LANCZOS)
                # pull colour slightly inward at the edge so no halo from the upscaler's backdrop
                al_img = al_img.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
                sp = Image.merge('RGBA', (*rgb.split(), al_img))
            else:
                src = cell[by0:by1, bx0:bx1].copy(); src[..., 3] = alpha[by0:by1, bx0:bx1]
                sp = Image.fromarray(src)
                sp = sp.resize((sp.width * 2, sp.height * 2), Image.LANCZOS)
                rgb = sp.convert('RGB').filter(ImageFilter.UnsharpMask(radius=1.6, percent=70, threshold=2))
                sp = Image.merge('RGBA', (*rgb.split(), sp.split()[3]))
            if sp.height > MAX_H:
                sp = sp.resize((round(sp.width * MAX_H / sp.height), MAX_H), Image.LANCZOS)
            sp.save(f'{OUT}/characters/{cid}.webp', 'WEBP', quality=88, method=6)
            head(sp, cid)
            print(cid, sp.size)

def head(sp, cid):
    A = np.array(sp)[..., 3] > 40; H, W = A.shape
    if cid in HEAD:
        cx, cy = int(HEAD[cid][0] * W), int(HEAD[cid][1] * H)
    else:
        top = np.where(A[:, int(W * .15):int(W * .85)].any(1))[0][0]
        band = A[top:top + int(H * .14), int(W * .15):int(W * .85)]
        cx = int(np.nonzero(band)[1].mean() + W * .15); cy = top + int(H * .12)
    side = int(H * .30)
    box = (cx - side // 2, cy - side // 2, cx + side // 2, cy + side // 2)
    hd = Image.new('RGBA', (side, side)); hd.paste(sp.crop(box), (0, 0))
    hd.resize((256, 256), Image.LANCZOS).save(f'{OUT}/heads/{cid}.webp', 'WEBP', quality=88)

if __name__ == '__main__':
    pos = [x for x in sys.argv[1:] if not x.startswith('--') and sys.argv[sys.argv.index(x) - 1] not in ('--upA', '--upB')]
    opt = lambda k: Image.open(sys.argv[sys.argv.index(k) + 1]) if k in sys.argv else None
    process(Image.open(pos[0]), opt('--upA'), A_IDS)
    process(Image.open(pos[1]), opt('--upB'), B_IDS)
