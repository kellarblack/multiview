#!/usr/bin/env python3
"""Capture the 10 s product-film timeline at 24 fps as PNG frames."""
import concurrent.futures as cf
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "frames")
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
URL = "http://localhost:5455/product-video/stage.html"
FPS = 24
SECONDS = 7
TOTAL = FPS * SECONDS


def frame(i):
    path = os.path.join(OUT, f"frame-{i:04d}.png")
    if os.path.exists(path) and os.path.getsize(path) > 100_000:
        return i, "skip"
    t = i / FPS
    profile = f"/tmp/mv-video-w{i % 4}"
    cmd = [
        CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
        "--window-size=1280,720", "--force-device-scale-factor=1",
        "--virtual-time-budget=1300", f"--user-data-dir={profile}",
        f"--screenshot={path}", f"{URL}?t={t:.5f}",
    ]
    r = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if r.returncode != 0 or not os.path.exists(path):
        return i, "fail"
    return i, "ok"


def main():
    os.makedirs(OUT, exist_ok=True)
    todo = list(range(TOTAL))
    done = 0
    with cf.ThreadPoolExecutor(max_workers=4) as pool:
        for i, status in pool.map(frame, todo):
            done += 1
            if status != "ok" and status != "skip":
                print(f"frame {i}: {status}", file=sys.stderr)
            if done % 24 == 0:
                print(f"{done}/{TOTAL}", flush=True)
    bad = [i for i in range(TOTAL) if not os.path.exists(os.path.join(OUT, f"frame-{i:04d}.png"))]
    print(f"captured {TOTAL - len(bad)}/{TOTAL}; missing={len(bad)}")
    if bad:
        sys.exit(1)


if __name__ == "__main__":
    main()
