"""Cut a head icon from a character render: python3 tools/art/head_crop.py <id> <faceX> <faceY> <size>
(fractions of the render's width/height; size as a fraction of its height). Writes heads/<id>.webp."""
import sys
from PIL import Image
cid, hx, hy, hs = sys.argv[1], *map(float, sys.argv[2:5])
im = Image.open(f'src/assets/art/characters/{cid}.webp').convert('RGBA')
W, H = im.size; side = int(H * hs); cx, cy = int(hx * W), int(hy * H)
head = Image.new('RGBA', (side, side)); head.paste(im.crop((cx - side // 2, cy - side // 2, cx + side // 2, cy + side // 2)), (0, 0))
head.resize((256, 256), Image.LANCZOS).save(f'src/assets/art/heads/{cid}.webp', 'WEBP', quality=92)
print(cid)
