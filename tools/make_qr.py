"""Aloqa bo'limidagi QR vizitkalarni yaratadi: img/qr-uz.svg, img/qr-ru.svg, img/qr-en.svg.

Ma'lumotlar js/i18n.js dan olinadi (PROFILE va har bir tildagi ism/lavozim),
shuning uchun kontakt o'zgarsa — shu skriptni qayta ishga tushirish kifoya:

    pip install segno
    python tools/make_qr.py
"""
import io
import os
import re

import segno

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://javokhir-an.github.io/"
DARK = "#0a0d18"

src = open(os.path.join(ROOT, "js", "i18n.js"), encoding="utf-8").read()


def field(block, key):
    m = re.search(r"\b" + key + r": '([^']*)'", block)
    return m.group(1) if m else ""


def esc(s):
    return s.replace("\\", "\\\\").replace(",", "\\,").replace(";", "\\;")


profile = src[src.index("window.PROFILE"):src.index("};", src.index("window.PROFILE"))]
phone = re.sub(r"[^\d+]", "", field(profile, "phone"))
email = field(profile, "email")
telegram = field(profile, "telegram").lstrip("@")

for lang in ("uz", "ru", "en"):
    start = src.index(f"  {lang}: {{")
    block = src[start:src.index("\n  }", start)]
    first, last, title = field(block, "first"), field(block, "last"), field(block, "vcard_title")
    lines = [
        "BEGIN:VCARD", "VERSION:3.0",
        f"N:{esc(last)};{esc(first)};;;",
        f"FN:{esc(first)} {esc(last)}",
        f"TITLE:{esc(title)}",
    ]
    if phone:
        lines.append(f"TEL;TYPE=CELL:{phone}")
    if email:
        lines.append(f"EMAIL;TYPE=INTERNET:{email}")
    if telegram:
        lines.append(f"URL;TYPE=Telegram:https://t.me/{telegram}")
    lines.append(f"URL:{SITE}")
    lines.append("END:VCARD")
    data = "\r\n".join(lines)

    qr = segno.make_qr(data, error="m", encoding="utf-8", boost_error=True)
    buf = io.BytesIO()
    qr.save(buf, kind="svg", border=0, dark=DARK, light=None, xmldecl=False,
            omitsize=True, nl=False, svgclass=None, lineclass=None)
    svg = buf.getvalue().decode("utf-8")
    # kattalashtirilganda qatorlar orasida ingichka yoriqlar chiqmasligi uchun
    svg = svg.replace("<path ", '<path shape-rendering="crispEdges" ', 1)
    out = os.path.join(ROOT, "img", f"qr-{lang}.svg")
    open(out, "w", encoding="utf-8", newline="\n").write(svg)
    print(f"{lang}: {len(data.encode('utf-8'))} bayt, versiya {qr.version}, {qr.error}, {os.path.getsize(out)} bayt SVG")
