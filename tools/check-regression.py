#!/usr/bin/env python3
"""Read a dumped tests/regression.html and fail if any check failed."""
import html
import re
import sys

path = sys.argv[1] if len(sys.argv) > 1 else "/tmp/regression.html"
body = open(path, encoding="utf-8", errors="replace").read()
match = re.search(r'<pre id="out">(.*?)</pre>', body, re.S)
if not match:
    print("no regression output")
    raise SystemExit(2)
text = html.unescape(match.group(1))
print(text)
if not re.search(r"^TOTAL\s+\d+", text, re.M):
    print("no TOTAL line")
    raise SystemExit(2)
if re.search(r"^FAIL\s", text, re.M):
    raise SystemExit(1)
