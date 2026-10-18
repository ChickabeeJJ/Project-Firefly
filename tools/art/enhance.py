"""Clean up painted renders: soften AI grain, then restore edge detail.

usage: python3 tools/art/enhance.py <in> <out> [denoise=4] [sharpen=0.6]
Non-local-means denoise on colour (alpha untouched), then an unsharp mask. Keeps RGBA.
"""
import sys, cv2, numpy as np
from PIL import Image

def enhance(im: Image.Image, h: float = 4, amount: float = 0.6) -> Image.Image:
    im = im.convert('RGBA')
    a = np.array(im)
    bgr = cv2.cvtColor(a[..., :3], cv2.COLOR_RGB2BGR)
    den = cv2.fastNlMeansDenoisingColored(bgr, None, h, h, 5, 15)
    blur = cv2.GaussianBlur(den, (0, 0), 1.3)
    sharp = cv2.addWeighted(den, 1 + amount, blur, -amount, 0)
    a[..., :3] = cv2.cvtColor(sharp, cv2.COLOR_BGR2RGB)
    return Image.fromarray(a, 'RGBA')

if __name__ == '__main__':
    src, out = sys.argv[1], sys.argv[2]
    h = float(sys.argv[3]) if len(sys.argv) > 3 else 4
    amt = float(sys.argv[4]) if len(sys.argv) > 4 else 0.6
    im = enhance(Image.open(src), h, amt)
    im.save(out, 'WEBP', quality=92, method=6) if out.endswith('.webp') else im.save(out)
    print(out, im.size)
