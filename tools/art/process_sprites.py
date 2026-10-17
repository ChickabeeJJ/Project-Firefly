import sys, json, numpy as np
from collections import deque
from PIL import Image, ImageFilter
raw, art = sys.argv[1], sys.argv[2]
MAP = {
 'A00':('characters','delphine'),'A01':('characters','bastian'),'A02':('characters','hesper'),'A03':('characters','teddy'),
 'A04':('enemies','usher'),'A05':('characters','nell'),'A06':('enemies','hourless'),'A07':('characters','percival'),
 'A08':('characters','wren'),'A09':('enemies','mannequin'),'A10':('characters','clementine'),'A11':('characters','augustin'),
 'B00':('characters','marigold'),'B01':('characters','ichabod'),'B02':('characters','ottoline'),'B03':('characters','kit'),
 'B04':('enemies','siren'),'B05':('enemies','pendulum'),'B06':('enemies','gloam'),'B07':('characters','evangeline'),
 'B08':('characters','rook'),'B09':('enemies','curtaincaller'),'B10':('characters','odile'),'B11':('enemies','keeper'),
}
HEAD={'wren':(405,105),'rook':(318,42),'evangeline':(288,60)}
def components(mask):
    h,w=mask.shape; lab=np.zeros((h,w),np.int32); n=0; sizes=[]; touch=[]
    for y in range(h):
        row=mask[y]
        for x in np.nonzero(row & (lab[y]==0))[0]:
            if lab[y,x]: continue
            n+=1; q=deque([(y,x)]); lab[y,x]=n; cnt=0; t=False
            while q:
                cy,cx=q.popleft(); cnt+=1
                if cx<=1 or cx>=w-2 or cy>=h-2: t=True
                for ny,nx in ((cy+1,cx),(cy-1,cx),(cy,cx+1),(cy,cx-1)):
                    if 0<=ny<h and 0<=nx<w and mask[ny,nx] and not lab[ny,nx]:
                        lab[ny,nx]=n; q.append((ny,nx))
            sizes.append(cnt); touch.append(t)
    return lab,sizes,touch
meta={}
for code,(folder,cid) in MAP.items():
    im=Image.open(f'{raw}/{code}.png').convert('RGBA'); a=np.array(im)
    mask=a[...,3]>16
    lab,sizes,touch=components(mask)
    big=max(sizes)
    keep=np.zeros_like(mask)
    for i,(s,t) in enumerate(zip(sizes,touch)):
        if s>=big*0.02 and not (t and s<big*0.15): keep|=(lab==i+1)
        elif s>=40 and not t: keep|=(lab==i+1)
    # dilate keep by 2px so soft edges survive
    k=Image.fromarray((keep*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))
    a[...,3]=np.where(np.array(k)>0,a[...,3],0)
    ys,xs=np.where(a[...,3]>8); a=a[ys.min():ys.max()+1, xs.min():xs.max()+1]
    im=Image.fromarray(a)
    # 2x upscale + gentle sharpen (premultiplied to avoid dark fringes)
    W,H=im.size; f=2
    pm=np.array(im).astype(np.float32); al=pm[...,3:4]/255; pm[...,:3]*=al
    up=Image.fromarray(pm.clip(0,255).astype(np.uint8),'RGBA').resize((W*f,H*f),Image.LANCZOS)
    u=np.array(up).astype(np.float32); al=np.maximum(u[...,3:4],1)/255; u[...,:3]=np.where(u[...,3:4]>0,u[...,:3]/al,0)
    up=Image.fromarray(u.clip(0,255).astype(np.uint8),'RGBA')
    rgb=up.convert('RGB').filter(ImageFilter.UnsharpMask(radius=1.6,percent=70,threshold=2)); up=Image.merge('RGBA',(*rgb.split(),up.split()[3]))
    if folder=='enemies': up=up.transpose(Image.FLIP_LEFT_RIGHT)
    up.save(f'{art}/{folder}/{cid}.webp','WEBP',quality=88,method=6)
    # head crop: centre of mass of the top 14% rows within the central 70% columns
    A=np.array(up)[...,3]>40; Hh,Ww=A.shape
    top=np.where(A[:, int(Ww*.15):int(Ww*.85)].any(1))[0][0]
    band=A[top:top+int(Hh*.14), int(Ww*.15):int(Ww*.85)]
    cx=int(np.nonzero(band)[1].mean()+Ww*.15); side=int(Hh*.30)
    cy=top+int(Hh*.12)
    if cid in HEAD: cx,cy=HEAD[cid]
    box=tuple(int(v) for v in (cx-side//2, cy-side//2, cx+side//2, cy+side//2))
    meta[cid]={'folder':folder,'src':code,'size':[Ww,Hh],'head':box}
    if folder=='characters':
        head=Image.new('RGBA',(side,side)); head.alpha_composite(up.crop(box)) if False else head.paste(up.crop(box),(0,0))
        head.resize((256,256),Image.LANCZOS).save(f'{art}/heads/{cid}.webp','WEBP',quality=88)
    print(cid, folder, up.size, 'head', box)
json.dump(meta,open(f'{raw}/../meta.json','w'),indent=1)
