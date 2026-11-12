#!/usr/bin/env python3
"""Check the public feeds the curated walls use, and write health.json.

    python3 tools/health-check.py
    python3 tools/health-check.py --out health.json

No third-party packages. YouTube watch links are checked with oEmbed; channel
and playlist links are checked with a normal HTTP request. Meant for a scheduled
GitHub Action, not for every page load.
"""
import argparse
import concurrent.futures as cf
import datetime as dt
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

ROOT = __import__("os").path.dirname(__import__("os").path.dirname(__import__("os").path.abspath(__file__)))
APP = __import__("os").path.join(ROOT, "app.js")
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/156.0 Safari/537.36")


def urls():
    text = open(APP, encoding="utf-8").read()
    # Only real link shapes. Ignore template strings, oEmbed helpers and
    # comments that happen to contain a URL prefix.
    found = re.findall(
        r"https://www\.youtube\.com/(?:watch\?v=[A-Za-z0-9_-]{11}|channel/[A-Za-z0-9_-]{10,}/live|playlist\?list=[A-Za-z0-9_-]{10,})",
        text,
    )
    out = []
    seen = set()
    for url in found:
        if url in seen:
            continue
        seen.add(url)
        out.append(url)
    return out


def check(url):
    try:
        if "watch?v=" in url or "youtu.be/" in url:
            target = "https://www.youtube.com/oembed?format=json&url=" + urllib.parse.quote(url, safe="")
        else:
            target = url
        req = urllib.request.Request(target, method="GET", headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=8) as response:
            return {"url": url, "status": response.status, "ok": 200 <= response.status < 400}
    except urllib.error.HTTPError as error:
        # YouTube rate-limits oEmbed. One retry separates a real block from a
        # burst of checks.
        if error.code in (403, 429):
            try:
                import time
                time.sleep(1.2)
                with urllib.request.urlopen(req, timeout=8) as response:
                    return {"url": url, "status": response.status, "ok": 200 <= response.status < 400}
            except Exception as retry:  # noqa: BLE001
                return {"url": url, "status": getattr(retry, "code", type(retry).__name__), "ok": False}
        return {"url": url, "status": error.code, "ok": False}
    except Exception as error:  # noqa: BLE001
        return {"url": url, "status": type(error).__name__, "ok": False}


def video_ids(feed_urls):
    ids = []
    seen = set()
    for url in feed_urls:
        match = re.search(r"(?:watch\?v=|youtu\.be/|/embed/|/shorts/)([A-Za-z0-9_-]{11})", url)
        if not match or match.group(1) in seen:
            continue
        seen.add(match.group(1))
        ids.append(match.group(1))
    return ids


def check_thumb(video_id):
    # The app falls back from the mid-frame to the normal thumbnail. Verify the
    # same chain so a missing mq2 is a warning only if every size is gone.
    last = None
    for size in ("mq2", "mqdefault", "hq2", "hqdefault", "sddefault"):
        url = "https://i.ytimg.com/vi/" + video_id + "/" + size + ".jpg"
        try:
            req = urllib.request.Request(url, method="GET", headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=8) as response:
                if 200 <= response.status < 400:
                    return {"id": video_id, "status": response.status, "size": size, "ok": True}
        except urllib.error.HTTPError as error:
            last = error.code
        except Exception as error:  # noqa: BLE001
            last = type(error).__name__
    return {"id": video_id, "status": last or "missing", "ok": False}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", default="health.json")
    args = parser.parse_args(argv)

    feed_urls = urls()
    with cf.ThreadPoolExecutor(max_workers=8) as pool:
        items = list(pool.map(check, feed_urls))
        thumbs = list(pool.map(check_thumb, video_ids(feed_urls)))
    bad = [item for item in items if not item["ok"]]
    bad_thumbs = [item for item in thumbs if not item["ok"]]
    payload = {
        "generated": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat(),
        "site": "https://multiview.cc",
        "checked": len(items),
        "ok": len(items) - len(bad),
        "bad": len(bad),
        "thumbs_checked": len(thumbs),
        "thumbs_ok": len(thumbs) - len(bad_thumbs),
        "thumbs_bad": len(bad_thumbs),
        "items": bad[:40],
        "bad_thumbs": bad_thumbs[:40],
    }
    out = args.out if __import__("os").path.isabs(args.out) else __import__("os").path.join(ROOT, args.out)
    with open(out, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, ensure_ascii=False)
        handle.write("\n")
    print("%d links · %d ok · %d bad · %d thumbs · %d thumb bad · %s" % (len(items), len(items) - len(bad), len(bad), len(thumbs), len(bad_thumbs), out))
    return 0 if not bad and not bad_thumbs else 1


if __name__ == "__main__":
    raise SystemExit(main())
