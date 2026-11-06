#!/usr/bin/env python3
"""Inline fonts + CSS + JS into one self-contained index.html.

Sources in src/ stay editable; running this regenerates the deliverable.
Only the PWA plumbing (manifest, sw.js, icons) remains external.
"""
import base64, io, os

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "src")

def read(p):
    with io.open(p, encoding="utf-8") as f:
        return f.read()

def data_uri(path, mime):
    with open(path, "rb") as f:
        return "data:%s;base64,%s" % (mime, base64.b64encode(f.read()).decode("ascii"))

tpl = read(os.path.join(SRC, "index.template.html"))
fonts = read(os.path.join(SRC, "fonts.css"))
font_files = {
    "__FRAUNCES_ROMAN__": ("fraunces-roman.woff2", "font/woff2"),
    "__FRAUNCES_ITALIC__": ("fraunces-italic.woff2", "font/woff2"),
    "__CORMORANT_ITALIC__": ("cormorant-italic.woff2", "font/woff2"),
    "__JOST__": ("jost.woff2", "font/woff2"),
    "__NUNITO__": ("nunito.woff2", "font/woff2"),
}
for token, (name, mime) in font_files.items():
    path = os.path.join(ROOT, "assets", "fonts", name)
    if not os.path.exists(path):
        raise SystemExit("Missing font: " + path)
    fonts = fonts.replace(token, data_uri(path, mime))

css = read(os.path.join(SRC, "styles.css"))
hero = os.path.join(ROOT, "assets", "hero-night.jpg")
if os.path.exists(hero):
    css = css.replace("__HERO_IMAGE__", data_uri(hero, "image/jpeg"))
css = css.replace("__HERO_IMAGE__", "data:image/gif;base64,R0lGODlhAQABAAAAACw=")

scripts = ["data.js", "audio.js", "engine.js", "stars.js", "world.js", "cursor.js", "app.js"]
js = "\n".join("/* ===== src/%s ===== */\n%s" % (n, read(os.path.join(SRC, n))) for n in scripts)
if "</script" in js.lower():
    raise SystemExit("ERROR: inline script contains a </script> sequence")

html = tpl.replace("{{FONTS}}", fonts).replace("{{STYLES}}", css).replace("{{SCRIPTS}}", js)
if "{{" in html:
    raise SystemExit("ERROR: unreplaced placeholder in template")

out = os.path.join(ROOT, "index.html")
with io.open(out, "w", encoding="utf-8") as f:
    f.write(html)
print("built %s — %d bytes (fonts embedded, no external CSS/JS)" % (out, os.path.getsize(out)))
