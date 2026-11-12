#!/usr/bin/env python3
"""Deployment check for multiview.cc.

    python3 tools/deploy-check.py
    python3 tools/deploy-check.py --url https://multiview.cc

Verifies the built `dist/` bundle, the downloadable zip, the security headers and
(optionally) a live deployment. No third-party packages; Python 3.9 stdlib only.
Exit code 0 means every check passed.
"""

import argparse
import io
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, "dist")
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/156.0 Safari/537.36")

REQUIRED = [
    "index.html", "404.html", "legal.html", "status.html", "status.js", "health.json", "_worker.js", "LICENSE",
    "robots.txt", "sitemap.xml", "sw.js",
    "styles.css", "app.js", "dashboard.js", "sources.js", "sync.js",
    "_headers", "vercel.json", "BUILD.txt", "multiview-beta.zip",
    ".well-known/security.txt",
    "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png",
    "vendor/hls.min.js",
]

FORBIDDEN = ["server", "tests", "README.md", "SECURITY.md", "build.py", "tools"]

ZIP_REQUIRED = [
    "index.html", "styles.css", "app.js", "dashboard.js", "sources.js",
    "sw.js", "START-HERE.txt", "BETA-LICENSE.txt",
    "start.py", "start-mac.command", "start-linux.sh", "start-windows.bat", "tv.html",
    ".well-known/security.txt",
]

results = []


def check(name, ok, detail=""):
    results.append((name, bool(ok), detail))
    print("%s  %s%s" % ("PASS" if ok else "FAIL", name, (" — " + detail) if detail else ""))
    return ok


def read(path):
    with open(os.path.join(DIST, path), encoding="utf-8") as handle:
        return handle.read()


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", help="live deployment to probe (https://…)")
    args = parser.parse_args(argv)

    if not os.path.isdir(DIST):
        print("dist/ is missing — run python3 build.py first")
        return 2

    for name in REQUIRED:
        path = os.path.join(DIST, name)
        check("ships " + name, os.path.isfile(path))

    for name in FORBIDDEN:
        check("excludes " + name, not os.path.exists(os.path.join(DIST, name)))

    for name in ("wrangler.toml", "_worker.js", ".github/workflows/ci.yml",
                 ".github/workflows/deploy.yml", ".github/workflows/uptime.yml",
                 "tools/health-check.py", "tools/check-regression.py"):
        check("source ships " + name, os.path.exists(os.path.join(ROOT, name)))

    index = read("index.html")
    check("index has no download-edition marker", "mv-edition" not in index)
    check("index references versioned assets",
          bool(re.search(r"styles\.css\?v=\d+", index) and re.search(r"app\.js\?v=\d+", index)))
    check("index has a CSP", "Content-Security-Policy" in index)
    check("index has a noscript fallback", "<noscript>" in index)
    check("legal page has a price section", "$5 one time fee" in read("legal.html"))

    headers = read("_headers")
    for needle, label in [
        ("Content-Security-Policy:", "CSP"),
        ("Strict-Transport-Security: max-age=31536000; includeSubDomains", "HSTS includeSubDomains"),
        ("X-Content-Type-Options: nosniff", "nosniff"),
        ("frame-ancestors 'self'", "frame-ancestors"),
        ("/.well-known/security.txt", "security.txt cache rule"),
        ("/multiview-beta.zip", "zip cache rule"),
    ]:
        check("_headers " + label, needle in headers)

    try:
        vercel = json.loads(read("vercel.json"))
        flat = json.dumps(vercel)
        check("vercel.json parses", True)
        check("vercel.json CSP", "frame-ancestors 'self'" in flat)
        check("vercel.json HSTS", "includeSubDomains" in flat)
        check("vercel.json hides x-powered-by", vercel.get("poweredByHeader") is False)
    except Exception as error:  # noqa: BLE001 - report the parse failure
        check("vercel.json parses", False, str(error))

    manifest_path = os.path.join(DIST, "manifest.webmanifest")
    check("ships PWA manifest", os.path.isfile(manifest_path))
    try:
        manifest = json.load(open(manifest_path, encoding="utf-8"))
        check("PWA manifest is fullscreen", manifest.get("display") == "fullscreen")
        check("PWA start_url is /", manifest.get("start_url") == "/")
    except Exception as error:  # noqa: BLE001
        check("PWA manifest parses", False, str(error))
    check("index links manifest", 'rel="manifest"' in index)

    security = read(".well-known/security.txt")
    check("security.txt has Contact", "Contact:" in security)
    check("security.txt has Expires", "Expires:" in security)

    zip_path = os.path.join(DIST, "multiview-beta.zip")
    try:
        with zipfile.ZipFile(zip_path) as bundle:
            names = set(bundle.namelist())
            check("zip is readable", bundle.testzip() is None)
            for name in ZIP_REQUIRED:
                check("zip contains " + name, name in names)
            check("zip does not nest itself", "multiview-beta.zip" not in names)
            zipped_index = bundle.read("index.html").decode("utf-8")
            check("zip marks the download edition", 'content="download"' in zipped_index)
            modes = {info.filename: info.external_attr >> 16 for info in bundle.infolist()}
            check("zip start scripts are executable",
                  all(modes.get(n, 0) & 0o111 for n in ("start.py", "start-mac.command", "start-linux.sh")))
    except Exception as error:  # noqa: BLE001
        check("zip is readable", False, str(error))

    size = 0
    for base, _dirs, files in os.walk(DIST):
        for name in files:
            size += os.path.getsize(os.path.join(base, name))
    print("bundle: %.0f KB in dist/ (+ %.0f KB download)" % (
        (size - os.path.getsize(zip_path)) / 1024.0,
        os.path.getsize(zip_path) / 1024.0))

    if args.url:
        base = args.url.rstrip("/")
        for path, expected in [
            ("/", 200),
            ("/.well-known/security.txt", 200),
            ("/multiview-beta.zip", 200),
            ("/legal", 200),
            ("/status", 200),
            ("/status.js", 200),
            ("/health.json", 200),
            ("/manifest.webmanifest", 200),
            ("/football", 200),
            ("/news", 200),
            ("/iptv", 200),
            ("/plex", 200),
            ("/living-room", 200),
            ("/mac", 200),
            ("/server/", 404),
            ("/tests/", 404),
        ]:
            try:
                request = urllib.request.Request(base + path, method="GET", headers={"User-Agent": UA})
                with urllib.request.urlopen(request, timeout=20) as response:
                    status = response.status
            except urllib.error.HTTPError as error:
                status = error.code
            except Exception as error:  # noqa: BLE001
                status = str(error)
            check("live %s -> %s" % (path, expected), status == expected, "got %s" % status)

        # The download must match the site. A stale zip is a real bug: the
        # edge caches it, and people get an old build with no warning.
        try:
            request = urllib.request.Request(base + "/BUILD.txt", headers={"User-Agent": UA})
            with urllib.request.urlopen(request, timeout=20) as response:
                live_build = re.search(r"^build\s+(\S+)", response.read().decode("utf-8"), re.M).group(1)
            request = urllib.request.Request(base + "/multiview-beta.zip?v=" + live_build + "-" + str(int(time.time())), headers={"User-Agent": UA})
            with urllib.request.urlopen(request, timeout=60) as response:
                blob = response.read()
            with zipfile.ZipFile(io.BytesIO(blob)) as bundle:
                zip_build = re.search(r"^build\s+(\S+)", bundle.read("BUILD.txt").decode("utf-8"), re.M).group(1)
                check("live zip ships start.py", "start.py" in bundle.namelist())
            check("live zip matches live build", live_build == zip_build,
                  "site %s · zip %s" % (live_build, zip_build))
        except Exception as error:  # noqa: BLE001
            check("live zip matches live build", False, str(error))

        host = urllib.parse.urlparse(base).hostname or ""
        if host in ("localhost", "127.0.0.1", "::1"):
            print("NOTE  header checks skipped on localhost — python's http.server does not apply _headers")
        else:
            try:
                request = urllib.request.Request(base + "/", method="GET", headers={"User-Agent": UA})
                with urllib.request.urlopen(request, timeout=20) as response:
                    live = {k.lower(): v for k, v in response.headers.items()}
                for key, needle in [
                    ("content-security-policy", "frame-ancestors 'self'"),
                    ("strict-transport-security", "includeSubDomains"),
                    ("x-content-type-options", "nosniff"),
                    ("x-frame-options", "SAMEORIGIN"),
                    ("referrer-policy", "strict-origin-when-cross-origin"),
                ]:
                    check("live header " + key, needle.lower() in live.get(key, "").lower())
            except Exception as error:  # noqa: BLE001
                check("live headers reachable", False, str(error))

    failed = [name for name, ok, _ in results if not ok]
    print("\n%d checks · %d passed · %d failed" % (len(results), len(results) - len(failed), len(failed)))
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
