# Product film

The Home hero plays a **7-second, silent 1280×720 / 24 fps** film that starts with one
game, opens to two and four, then ends on `multiview.cc`. It sits next to the hero copy.

- Output: `media/multiview-demo.mp4` (2.1 MB, H.264, **no audio track**)
- Poster: `media/multiview-demo-poster.jpg` (frame at 3.75 s, 183 KB)
- Playback: muted, looping, `preload="none"`; an IntersectionObserver starts it only while
  it is on screen. `prefers-reduced-motion` keeps it paused and shows the play button.
- The offline download deliberately excludes `media/`, so the beta zip stays ~500 KB.

## Re-render

From the repository root:

```sh
python3 -m http.server 5455
python3 product-video/capture.py                 # 168 PNGs in product-video/frames/
swiftc product-video/encode.swift -o product-video/encode \
  -framework AVFoundation -framework CoreImage -framework ImageIO -framework CoreVideo
product-video/encode product-video/frames media/multiview-demo.mp4 24
sips -s format jpeg -s formatOptions 82 \
  product-video/frames/frame-0090.png --out media/multiview-demo-poster.jpg
python3 build.py
```

The social card is a separate 1200×630 stage:

```sh
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --hide-scrollbars --force-prefers-reduced-motion \
  --window-size=1200,630 --force-device-scale-factor=1 --virtual-time-budget=4000 \
  --user-data-dir=/tmp/mv-og \
  --screenshot=icons/og.png http://localhost:5455/product-video/og.html
```

Bump `icons/og.png?v=` in `index.html` when the card changes.

`capture.py` uses four headless Chrome workers, one frame per `?t=` seek. The stage is
deterministic: every frame is set by `seek(t)` with no CSS transitions.

## Timeline

| Time | Layout | Caption |
| --- | --- | --- |
| 0.0–0.95 s | 1-up | one game. |
| 0.95–1.95 s | 2-up | two games. |
| 1.95–4.75 s | 4-up | four games. one screen. |
| 4.75–7 s | end card | all your games. one screen. / multiview.cc |

## Imagery

The film uses **real frames from the public feeds the wall links to**, not stock
photography. They are pulled from YouTube's frame endpoints (`maxres1/2/3.jpg`), so
the demo looks like the games people actually watch. The old Unsplash set is kept in
`img-unsplash/` for reference.

| File | Frame |
| --- | --- |
| `img/01.jpg` | Premier League (`p4aNGqai4ec`, frame 3) |
| `img/02.jpg` | NBA (`y-jR93AytPc`, frame 2) |
| `img/03.jpg` | MLB (`QkGOollG-S4`, frame 3) |
| `img/04.jpg` | College football (`MRO9RbJuZLg`, frame 1) |
| `img/05.jpg` | UFC (`IIy0uIqFjb0`, frame 2) |
| `img/06.jpg` | Olympics (`ie920kzulsc`, frame 2) |
| `img/07.jpg` | ESL (`Se6OL_DsGo8`, frame 2) |
| `img/08.jpg` | MLB (`QkGOollG-S4`, frame 1) |
| `img/09.jpg` | News (`6QFVhVT187M`, frame 2) |

These are product-demo stills, not a re-broadcast. Rights stay with the channels.
Do not add paid-service frames.
