"""Split a transparent sheet of icons into separate square files by gaps in the alpha.

usage: python3 tools/art/split_sheet.py <sheet> <out_dir> <name1,name2,...> [rows=1] [size=256]
Rows are split first (horizontal gaps), then each row by vertical gaps; names go left→right, top→bottom.
"""
import sys, numpy as np
from PIL import Image
sys.path.insert(0, 'tools/art')
from enhance import enhance

def runs(mask, gap):
    idx = np.where(mask)[0]
    out = []; s = p = idx[0]
    for x in idx[1:]:
        if x > p + gap: out.append((s, p)); s = x
        p = x
    out.append((s, p)); return out

def split(path, out, names, rows=1, size=256, per_row=None):
    im = Image.open(path).convert('RGBA'); a = np.array(im)[..., 3] > 20
    rr = runs(a.any(1), 12)
    if len(rr) < rows:
        prof = a.sum(1); ys = np.where(prof > 0)[0]; mid = (ys.min() + ys.max()) // 2; w = (ys.max() - ys.min()) // 6
        c = mid - w + int(np.argmin(prof[mid - w:mid + w])); rr = [(ys.min(), c), (c + 1, ys.max())]
    rr = sorted(rr, key=lambda r: r[1] - r[0], reverse=True)[:rows]; rr.sort()
    pieces = []
    for y0, y1 in rr:
        row = a[y0:y1 + 1]
        cols = [c for c in runs(row.any(0), 14) if c[1] - c[0] > 40]
        for x0, x1 in cols: pieces.append((x0, y0, x1 + 1, y1 + 1))
    if len(pieces) != len(names) and per_row:
        # Touching icons: cut each row at the emptiest column near even divisions.
        pieces = []
        for (y0, y1), n in zip(rr, per_row):
            prof = a[y0:y1 + 1].sum(0); xs = np.where(prof > 0)[0]; L, R = xs.min(), xs.max()
            cuts = [L]
            for k in range(1, n):
                g = L + (R - L) * k // n; w = (R - L) // (n * 3)
                cuts.append(g - w + int(np.argmin(prof[g - w:g + w])))
            cuts.append(R + 1)
            for k in range(n): pieces.append((cuts[k], y0, cuts[k + 1], y1 + 1))
    assert len(pieces) == len(names), (len(pieces), pieces)
    for box, n in zip(pieces, names):
        sub = im.crop(box); b = np.array(sub)[..., 3] > 20
        ys, xs = np.where(b); sub = sub.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
        side = max(sub.size) + 8; sq = Image.new('RGBA', (side, side)); sq.paste(sub, ((side - sub.width) // 2, (side - sub.height) // 2))
        enhance(sq.resize((size, size), Image.LANCZOS), 2, 0.4).save(f'{out}/{n}.webp', 'WEBP', quality=92, method=6)
        print(n, box)

if __name__ == '__main__':
    names = sys.argv[3].split(',')
    rows = int(sys.argv[4]) if len(sys.argv) > 4 else 1
    per = [int(x) for x in sys.argv[6].split(',')] if len(sys.argv) > 6 else [len(names)]
    split(sys.argv[1], sys.argv[2], names, rows, int(sys.argv[5]) if len(sys.argv) > 5 else 256, per)
