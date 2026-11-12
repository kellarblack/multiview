#!/usr/bin/env python3
"""Build the production bundle for multiview.cc.

    python3 build.py            -> dist/
    python3 build.py --out site -> site/

Only files the browser needs are copied. The backend (`server/`), tests and internal
docs are deliberately left out, so a deployed build never exposes the API source or
the test harness. Every text asset gets a short provenance banner (copyright + build
id) so a copied file can be traced back to this project.
"""

import argparse
import hashlib
import os
import re
import shutil
import stat
import sys
import zipfile
from datetime import date

ROOT = os.path.dirname(os.path.abspath(__file__))

# Everything the browser or the host needs. Nothing else ships.
FILES = [
    "index.html",
    "404.html",
    "help.html",
    "legal.html",
    "_worker.js",
    "manifest.webmanifest",
    "status.html",
    "status.js",
    "health.json",
    "guide.css",
    "football.html",
    "news.html",
    "iptv.html",
    "plex.html",
    "living-room.html",
    "mac.html",
    "LICENSE",
    "robots.txt",
    "sitemap.xml",
    "styles.css",
    "app.js",
    "dashboard.js",
    "sources.js",
    "sync.js",
    "sw.js",
    "media/multiview-demo.mp4",
    "media/multiview-demo-poster.jpg",
    "media/hero/01.jpg",
    "media/hero/02.jpg",
    "media/hero/03.jpg",
    "media/hero/04.jpg",
    "media/hero/05.jpg",
    "media/hero/06.jpg",
    "media/hero/07.jpg",
    "media/hero/08.jpg",
    "media/hero/09.jpg",

    "_headers",
    "vercel.json",
]
DIRS = ["icons", "vendor", ".well-known"]

# JSON cannot hold comments; HTML/CSS/JS can.
TEXT = {".html", ".css", ".js"}


def read_bytes(name):
    with open(os.path.join(ROOT, name), "rb") as handle:
        return handle.read()


def build_hash(names):
    digest = hashlib.sha256()
    for name in sorted(names):
        digest.update(name.encode())
        digest.update(read_bytes(name))
    return digest.hexdigest()[:10]


def banner(build_id, today):
    return ("© %s multiview.cc · proprietary build %s · %s · copying prohibited · see LICENSE"
            % (today.year, today.isoformat(), build_id))


def watermark(name, data, text):
    ext = os.path.splitext(name)[1].lower()
    if ext not in TEXT:
        return data
    decoded = data.decode("utf-8")
    note = text
    if ext == ".html":
        marker = decoded.find("<!doctype html>")
        if marker == 0:
            end = decoded.find(">") + 1
            decoded = decoded[:end] + "\n<!-- " + note + " -->" + decoded[end:]
        else:
            decoded = "<!-- " + note + " -->\n" + decoded
    else:
        decoded = "/* " + note + " */\n" + decoded
    return decoded.encode("utf-8")


BETA_SERVER = '''#!/usr/bin/env python3
# Local server for the multiview beta build. Picks a free port, then opens it.
import http.server
import os
import sys
import threading
import webbrowser

os.chdir(os.path.dirname(os.path.abspath(__file__)))


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, max-age=0")
        super().end_headers()

    def log_message(self, *args):
        pass


httpd = None
port = None
for candidate in range(5455, 5481):
    try:
        httpd = http.server.ThreadingHTTPServer(("127.0.0.1", candidate), Handler)
        port = candidate
        break
    except OSError:
        continue

if httpd is None:
    sys.exit("No free port between 5455 and 5480. Close another local server and try again.")

threading.Timer(0.8, lambda: webbrowser.open("http://localhost:%d/" % port)).start()
if port != 5455:
    print("Note: 5455 was busy, so this run uses %d. Boards are saved per address." % port, file=sys.stderr)
print("multiview.cc running at http://localhost:%d/  (Ctrl+C to stop)" % port, flush=True)
try:
    httpd.serve_forever()
except KeyboardInterrupt:
    pass
'''

START_FILES = {
    "start.py": BETA_SERVER,
    "start-mac.command": '''#!/bin/sh
cd "$(dirname "$0")" || exit 1
exec python3 start.py
''',
    "start-linux.sh": '''#!/bin/sh
cd "$(dirname "$0")" || exit 1
exec python3 start.py
''',
    "start-windows.bat": '''@echo off
cd /d "%~dp0"
py start.py
if errorlevel 1 python start.py
''',
}


def beta_license(build_id, today):
    return """multiview.cc — beta founder build
build   %s
date    %s

This beta build is yours to keep and use. No account, no subscription.
After beta ends, hosted access to multiview.cc is a $5 one time fee for
new accounts. This copy is unaffected and keeps working.

This snapshot is plain HTML/CSS/JS. It does not phone home or check a
licence server. Future releases may add paid accounts; this copy will keep
running exactly as it is.

What it is not
- Not DRM. The files can be read and copied.
- Not a subscription. Nothing needs renewing.
- Not a guarantee of future updates. Updates are separate releases.

The bundled streams belong to their sites (YouTube, Twitch, IPTV providers,
Jellyfin) and keep their own terms. Your logins stay with those sites.

© %s multiview.cc · see LICENSE
""" % (build_id, today.isoformat(), today.year)


def start_here(build_id):
    return """multiview — beta build %s
================================

Run it locally
  macOS     double-click start-mac.command
  Windows   double-click start-windows.bat
  Linux     ./start-linux.sh

Then open http://localhost:5455/ in a browser.

Opening index.html directly also works, but a localhost address is better:
Twitch and some players refuse to load from file://.

What is in here
  index.html, styles.css, app.js, dashboard.js, sources.js, sync.js
  start.py          (local server, picks a free port)
  icons/, vendor/    (no build tools, no server, no accounts)
  BETA-LICENSE.txt   (this copy is yours to keep, in plain words)
  BUILD.txt          (build id and date)

Notes
  - Boards are stored in the browser on this machine (localStorage).
  - No account, no card, no analytics, no calls to multiview.cc.
  - This copy is yours to keep and run. Hosted access after beta is a
    $5 one time fee for new accounts; the downloaded app does not need it.
  - YouTube and Twitch still need an internet connection.
""" % build_id


def download_edition(html):
    """The beta zip leaves out the film and its poster. Mark the page and drop
    the poster preload so the offline copy makes no missing requests."""
    html = html.replace("<head>", '<head>\n<meta name="mv-edition" content="download">', 1)
    html = re.sub(r'\s*<link rel="preload" as="image" href="media/multiview-demo-poster\.jpg[^>]*>\s*', '\n', html)
    return html


def main(argv=None):
    parser = argparse.ArgumentParser(description="Build the static production bundle.")
    parser.add_argument("--out", default="dist", help="output directory (default: dist)")
    parser.add_argument("--no-banner", action="store_true", help="skip the provenance banner")
    args = parser.parse_args(argv)

    out = os.path.join(ROOT, args.out)
    if os.path.abspath(out) == ROOT:
        sys.exit("Refusing to build into the project root.")

    missing = [name for name in FILES if not os.path.isfile(os.path.join(ROOT, name))]
    missing += [name + "/" for name in DIRS if not os.path.isdir(os.path.join(ROOT, name))]
    if missing:
        sys.exit("Missing runtime files: " + ", ".join(missing))

    build_id = build_hash(FILES)
    today = date.today()
    note = banner(build_id, today)

    if os.path.isdir(out):
        shutil.rmtree(out)
    os.makedirs(out)

    total = 0
    written = []
    for name in FILES:
        data = read_bytes(name)
        if not args.no_banner:
            data = watermark(name, data, note)
        if os.path.splitext(name)[1].lower() in TEXT:
            data = data.replace(b"multiview-beta.zip?v=dev", b"multiview-beta.zip?v=" + build_id.encode())
            data = data.replace(b"__BUILD_ID__", build_id.encode())
        dest = os.path.join(out, name)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        with open(dest, "wb") as handle:
            handle.write(data)
        total += len(data)
        written.append(name)

    # /tv is a real page, not a redirect: Cloudflare Pages and Vercel serve
    # tv.html at /tv with the URL intact, and app.js turns TV mode on.
    tv_src = os.path.join(out, "index.html")
    tv_dst = os.path.join(out, "tv.html")
    with open(tv_src, encoding="utf-8") as handle:
        tv_html = handle.read()
    tv_html = tv_html.replace("<title>multiview</title>", "<title>multiview tv</title>", 1)
    with open(tv_dst, "w", encoding="utf-8") as handle:
        handle.write(tv_html)
    total += os.path.getsize(tv_dst)
    written.append("tv.html")

    for name in DIRS:
        shutil.copytree(os.path.join(ROOT, name), os.path.join(out, name))
        for base, _dirs, files in os.walk(os.path.join(ROOT, name)):
            for item in files:
                total += os.path.getsize(os.path.join(base, item))
        written.append(name + "/")

    # GitHub Pages: keep underscore files and skip Jekyll.
    open(os.path.join(out, ".nojekyll"), "wb").close()

    with open(os.path.join(out, "BUILD.txt"), "w", encoding="utf-8") as handle:
        handle.write("multiview.cc production build\n")
        handle.write("date   %s\n" % today.isoformat())
        handle.write("build  %s\n" % build_id)
        handle.write("files  %d (+ multiview-beta.zip)\n" % len(written))
        handle.write("bytes  %d\n" % total)

    # Downloadable copy for people who want to run it offline. Generated from the
    # built files plus start scripts and the beta licence, so it always matches
    # the deployed version.
    zip_name = "multiview-beta.zip"
    zip_path = os.path.join(out, zip_name)
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as bundle:
        for base, _dirs, files in os.walk(out):
            for item in files:
                full = os.path.join(base, item)
                if os.path.abspath(full) == os.path.abspath(zip_path):
                    continue
                arc = os.path.relpath(full, out)
                if arc in ("media/multiview-demo.mp4", "media/multiview-demo-poster.jpg"):
                    continue  # the film and its poster stay on the web build
                if arc in ("index.html", "tv.html"):
                    # The bundle cannot ship its own zip or film, so mark it as the
                    # download edition and drop the missing poster preload.
                    html = download_edition(open(full, encoding="utf-8").read())
                    bundle.writestr(arc, html)
                else:
                    bundle.write(full, arc)
        for name, text in START_FILES.items():
            info = zipfile.ZipInfo(name)
            info.date_time = today.timetuple()[:6]
            info.external_attr = (stat.S_IFREG | 0o755) << 16 if name.endswith((".command", ".sh", ".py")) else 0o644 << 16
            bundle.writestr(info, text)
        bundle.writestr("BETA-LICENSE.txt", beta_license(build_id, today))
        bundle.writestr("START-HERE.txt", start_here(build_id))
    shutil.copyfile(zip_path, os.path.join(ROOT, zip_name))
    written.append(zip_name)
    total += os.path.getsize(zip_path)

    # A ready-to-upload archive of the whole site (dist contents, including the
    # download zip). Hosts that accept a zip — Cloudflare Pages, Netlify Drop —
    # can take this directly.
    site_zip = os.path.join(ROOT, "multiview-site.zip")
    with zipfile.ZipFile(site_zip, "w", zipfile.ZIP_DEFLATED) as bundle:
        for base, _dirs, files in os.walk(out):
            for item in files:
                full = os.path.join(base, item)
                bundle.write(full, os.path.relpath(full, out))

    size = total / 1024.0
    print("built %s" % os.path.relpath(out, ROOT))
    print("  %d entries · %.0f KB · build %s" % (len(written), size, build_id))
    print("  server/, tests/ and internal docs are not included")
    print("  download: %s (%.0f KB) — also copied to the project root" % (zip_name, os.path.getsize(zip_path) / 1024.0))
    print("  upload:   multiview-site.zip (%.0f KB) or the dist/ folder" % (os.path.getsize(site_zip) / 1024.0))
    print("  deploy this folder (see DEPLOY.md)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
