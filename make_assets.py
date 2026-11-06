#!/usr/bin/env python3
"""Create storiesAI's PWA icons (a gold story-spark on near-black) and prepare artwork."""
from PIL import Image, ImageDraw, ImageFilter
import os

ROOT = os.path.dirname(os.path.abspath(__file__))
ICONS = os.path.join(ROOT, "icons")
ASSETS = os.path.join(ROOT, "assets")
os.makedirs(ICONS, exist_ok=True)
os.makedirs(ASSETS, exist_ok=True)


def icon(size, maskable=False):
    s = size * 4
    im = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    pad = int(s * (.10 if maskable else .055))
    d.rounded_rectangle([pad, pad, s - pad, s - pad], radius=int(s * (.24 if maskable else .22)), fill=(5, 4, 15, 255))

    glow = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([s * .22, s * .18, s * .80, s * .76], fill=(70, 55, 120, 105))
    im = Image.alpha_composite(im, glow.filter(ImageFilter.GaussianBlur(s * .11)))
    d = ImageDraw.Draw(im)

    cx, cy = s * .5, s * .5
    R = s * .27
    r = s * .055
    star = [(cx, cy - R), (cx + r, cy - r), (cx + R, cy), (cx + r, cy + r),
            (cx, cy + R), (cx - r, cy + r), (cx - R, cy), (cx - r, cy - r)]
    d.polygon(star, fill=(246, 219, 150, 255))
    d.ellipse([cx - s * .035, cy - s * .035, cx + s * .035, cy + s * .035], fill=(255, 248, 224, 255))

    def small(x, y, rr, col):
        d.ellipse([x - rr, y - rr, x + rr, y + rr], fill=col)
        d.line([(x - rr * 2.2, y), (x + rr * 2.2, y)], fill=col, width=max(1, int(rr * .45)))
        d.line([(x, y - rr * 2.2), (x, y + rr * 2.2)], fill=col, width=max(1, int(rr * .45)))

    small(s * .755, s * .255, s * .012, (243, 211, 138, 230))
    small(s * .245, s * .730, s * .009, (243, 211, 138, 190))
    small(s * .790, s * .715, s * .007, (246, 238, 223, 165))
    return im.resize((size, size), Image.LANCZOS)


for sz, name, mask in [(192, "icon-192.png", False), (512, "icon-512.png", False),
                       (512, "maskable-512.png", True), (180, "apple-touch-icon.png", False),
                       (64, "favicon-64.png", False)]:
    icon(sz, mask).save(os.path.join(ICONS, name))
    print("icon:", name)

# keep the processed hero as a subtle optional asset (no longer used by the landing)
src = os.path.join(ASSETS, "hero-night.png")
if os.path.exists(src):
    im = Image.open(src).convert("RGB")
    w, h = im.size
    im = im.crop((int(w * .035), int(h * .035), int(w * .965), int(h * .965)))
    im = im.resize((1600, int(1600 * im.height / im.width)), Image.LANCZOS)
    im.save(os.path.join(ASSETS, "hero-night.jpg"), "JPEG", quality=82, optimize=True)

svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="15" fill="#05040f"/><path d="M32 8 L35.6 28.4 L56 32 L35.6 35.6 L32 56 L28.4 35.6 L8 32 L28.4 28.4 Z" fill="#f3d38a"/></svg>'''
open(os.path.join(ASSETS, "mark.svg"), "w").write(svg)
print("done")
