"""index.html dagi css/js havolalariga fayl mazmunidan olingan ?v=... qo'shadi.

Brauzer eski style.css ni keshdan olib, yangi index.html bilan aralashtirib yubormasligi uchun
har bir o'zgarishdan keyin (push qilishdan oldin) ishga tushiring:

    python tools/stamp.py
"""
import hashlib
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
path = os.path.join(ROOT, "index.html")
html = open(path, encoding="utf-8").read()


def stamp(m):
    attr, file = m.group(1), m.group(2)
    digest = hashlib.md5(open(os.path.join(ROOT, file), "rb").read()).hexdigest()[:8]
    return f'{attr}="{file}?v={digest}"'


new = re.sub(r'(href|src)="((?:css|js)/[\w.-]+\.(?:css|js))(?:\?v=\w+)?"', stamp, html)
if new != html:
    open(path, "w", encoding="utf-8", newline="\n").write(new)
for line in re.findall(r'(?:href|src)="(?:css|js)/[^"]+"', new):
    print(line)
