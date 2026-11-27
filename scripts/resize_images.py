"""Make every uploaded image web-sized, and create its small preview in img/sm.
Runs automatically on GitHub after each upload from Pages CMS (see .github/workflows/images.yml).
- Turns phone photos the right way up (EXIF rotation)
- Shrinks the main image to at most 2000 px on its longest side
- Creates img/sm/<name> at 900 px for the grids
Originals that are already small are left alone."""
import os, sys
from PIL import Image, ImageOps
ROOT = os.path.join(os.path.dirname(__file__), '..', 'img')
SM = os.path.join(ROOT, 'sm')
MAX, THUMB = 2000, 900
os.makedirs(SM, exist_ok=True)
changed = 0
# Leave the big opening image alone (it is shown full-screen and was prepared by hand)
import json
try:
    KEEP = {os.path.basename((json.load(open(os.path.join(ROOT, '..', 'data', 'site.json'))).get('hero') or {}).get('image', ''))}
except Exception:
    KEEP = set()
for name in sorted(os.listdir(ROOT)):
    path = os.path.join(ROOT, name)
    if not os.path.isfile(path) or not name.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
        continue
    try:
        im = Image.open(path)
        exif_rot = im.getexif().get(0x0112, 1) not in (1, None)
        big = name not in KEEP and (max(im.size) > MAX or os.path.getsize(path) > 1_200_000)
        fmt = 'PNG' if name.lower().endswith('.png') else ('WEBP' if name.lower().endswith('.webp') else 'JPEG')
        if (exif_rot and name not in KEEP) or big:
            im = ImageOps.exif_transpose(im)
            if max(im.size) > MAX:
                im.thumbnail((MAX, MAX), Image.LANCZOS)
            if fmt == 'JPEG':
                im.convert('RGB').save(path, 'JPEG', quality=86, optimize=True, progressive=True)
            else:
                im.save(path, fmt, optimize=True)
            changed += 1
            print('resized', name, im.size)
            im = Image.open(path)
        sp = os.path.join(SM, name)
        if not os.path.exists(sp) or os.path.getmtime(sp) < os.path.getmtime(path):
            t = ImageOps.exif_transpose(im)
            t.thumbnail((THUMB, THUMB * 2), Image.LANCZOS)
            if fmt == 'JPEG':
                t.convert('RGB').save(sp, 'JPEG', quality=82, optimize=True, progressive=True)
            else:
                t.save(sp, fmt, optimize=True)
            changed += 1
            print('preview', name, t.size)
    except Exception as e:
        print('skipped', name, e, file=sys.stderr)
print(changed, 'files written')
