import sys, numpy as np
from PIL import Image
src, out, prefix = sys.argv[1], sys.argv[2], sys.argv[3]
im = Image.open(src).convert('RGBA'); a = np.array(im); al = a[..., 3] > 24
def mincuts(prof, n, win=0.09):
    L=len(prof); cuts=[0]
    for k in range(1,n):
        c=int(L*k/n); lo,hi=c-int(L*win),c+int(L*win)
        seg=prof[lo:hi]; m=seg.min(); idx=np.where(seg==m)[0]
        cuts.append(lo+int(idx[len(idx)//2]))
    cuts.append(L); return cuts
rc=mincuts(al.sum(1),3); n=0
for r in range(3):
    band=al[rc[r]:rc[r+1]]
    cc=mincuts(band.sum(0),4,0.07)
    print('row',rc[r],rc[r+1],'cols',cc, 'cut cost',[int(band.sum(0)[c]) for c in cc[1:-1]])
    for c in range(4):
        crop=a[rc[r]:rc[r+1], cc[c]:cc[c+1]].copy()
        m=crop[...,3]>8; ys,xs=np.where(m)
        crop=crop[ys.min():ys.max()+1, xs.min():xs.max()+1]
        Image.fromarray(crop).save(f'{out}/{prefix}{n:02d}.png'); n+=1
