# Test report — multiview.cc 1.9.41

Date: 2026-11-10
Environment: macOS 26.6.2 · Google Chrome 156.0.8078.80 · Python 3.9.6
Server: `start.command` → `http://localhost:5455/`
Jellyfin: protocol stub on `http://127.0.0.1:8123` (no real server was used)

## Method

`tests/regression.html` seeds a known board, loads the real app in an iframe, drives the
real UI (clicks, keyboard, synthetic pointer drags, form input), and records
PASS / FAIL / BLOCKED. It restores the saved board when finished. Nothing is simulated on
the app side; only the Jellyfin server is a stub, and that is labelled as such.

```sh
open http://localhost:5455/tests/regression.html
```

Automated capture for this report:

```sh
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --virtual-time-budget=50000 \
  --user-data-dir=/tmp/mvtest --dump-dom \
  "http://localhost:5455/tests/regression.html"
```

## Results — 61 checks

Final run for 1.9.24, with `tests/mock-jellyfin.py` on port 8123: **59–60 PASS / 0 FAIL /
1–2 BLOCKED** (HLS decode and reduced motion are environment-dependent). Without the Jellyfin stub,
the two Jellyfin checks cannot run.

```
PASS    startup: shell renders
PASS    startup: home is the default view
PASS    startup: debug seam present
PASS    startup: no console/runtime errors
PASS    startup: seeded tiles restored
PASS    provider: YouTube embed
PASS    provider: Twitch channel
PASS    provider: Vimeo
PASS    provider: framing block detected
PASS    security: every iframe sandboxed
PASS    security: popups not granted
PASS    layout: 1-up renders 1 column(s)
PASS    layout: 2-up renders 2 column(s)
PASS    layout: 4-up renders 2 column(s)
PASS    mute: per-tile toggles embed param
PASS    mute: mute-all toggles both directions
PASS    audio focus: selects source and mutes others
PASS    audio focus: unsupported tile reports truthfully
PASS    audio focus: manual mute clears focus
PASS    captions: toggle sets embed param
PASS    captions: new YouTube tile inherits default
PASS    drag: grip swap reorders tiles
PASS    drag: arrange mode swaps from tile body
PASS    focus: expand then escape
PASS    cinema: H hides chrome, escape restores
PASS    youtube: player error shows the unavailable card
PASS    youtube: reload clears the unavailable card
PASS    pop-out: opens a window (stubbed)
PASS    close: removes one tile
PASS    share: export shape is safe
PASS    share: import round trip keeps name, layout, order
PASS    share: import adds a new board, keeps the old
PASS    share: malformed input rejected
PASS    share: unsafe links are dropped, valid ones kept
PASS    share: four-tile cap enforced on import
PASS    persistence: tiles survive reload
PASS    persistence: corrupted storage falls back safely
PASS    limits: four tiles maximum per board
PASS    keys: arrows navigate the wall without TV mode
PASS    funny: 2-up demo uses Family Guy / American Dad
PASS    captions: 2-up fits the whole player (no crop)
PASS    home: no founder id
PASS    responsive: narrow viewport collapses to one column
PASS    iptv: M3U parses channels, groups and skips junk
PASS    iptv: empty playlist is rejected
PASS    guide: XMLTV parses programmes and matches channels
PASS    security: unsafe URLs are rejected by the parser
PASS    security: tokens are redacted for display
PASS    media: a stream becomes a real <video> tile
PASS    media: removing the tile tears the player down
BLOCKED media: HLS actually reaches readyState > 0
PASS    dashboard: Home renders sections and a sources link
PASS    dashboard: Sources shows all three integrations
PASS    iptv: connecting a playlist populates channels
PASS    iptv: browsing renders a virtualised list
PASS    jellyfin: login, live channels and stream URL
PASS    jellyfin: wrong password is reported, not swallowed
PASS    install: no install buttons or PWA manifest
PASS    offline: service worker registers
BLOCKED reduced motion: visual behaviour

TOTAL 59 | PASS 58 | FAIL 0 | BLOCKED 1
```

## Production bundle (1.4.5)

`python3 build.py` writes `dist/` (18 entries, ~1.5 MB including hls.js and the download). Verified by
serving it on a separate port: the app boots with no console or CSP errors, the demo wall
renders, and `/server/app.py`, `/tests/regression.html`, `/README.md` and `/SECURITY.md`
all return **404** — the backend source and test harness are not published. `BUILD.txt`
records the build id stamped into every text asset.

## Demo and install checks (1.4.8)

| Check | Result |
| --- | --- |
| Demo channels | Al Jazeera English, NHK World-Japan, Disney Kids 24/7, Tom & Jerry 24/7 (all true 24/7) |
| Live playback | All four iframes: `readyState 4`, `paused false`, `videoWidth 1280` |
| Migration | Retired Lofi/Big Buck IDs replaced **in place**; board stayed at four tiles; history cleaned |
| Install button (Home + Plan) | Removed in 1.8.2 — only **Download for computer**; no manifest or Apple standalone tags |
| Clean YouTube mode | 4/4 tiles `is-clean`, shield `display:block`, embed carries `controls=0&fs=0&disablekb=1`, all four still `readyState 4` |
| Fullscreen control | Present in every tile pill |
| Demo sizes | 1-up → 1 tile/1 col · 2-up → 2/2 · 4-up → 4/2 |
| Layout picker | 1/2/4-up show exactly 1/2/4 tiles; Demo auto-fills to 4 when selected |
| 4-up playback | 4/4 iframes `readyState 4`, `paused false` (fallbacks swap rather than die) |
| Startup smoothing | 110 ms stagger per new iframe, preconnect to YouTube/ytimg, `contain: layout paint` per tile |
| Source inspector | Info button, right-click and `I` all open it; selected ring clears on close |
| Headers tab | Same-origin reads headers; cross-origin probe is opaque and logs no CORS error |
| Tile headers | Off by default; View tab and `T` toggle it; preference persists across reload |
| Manifest | Removed in 1.8.2 — the build is download-only |

## Security suite (1.4.5)

`python3 server/test_security.py -v` — **20/20 OK** against the real HTTP server on a
temporary database. Covers auth bypass, tampered tokens, session expiry/deletion, secret
storage, login enumeration, SQL injection, stored XSS, CRLF injection, unsafe URL schemes,
CORS, share enumeration/isolation, oversized bodies, route probing, server banner, rate
limiting with `Retry-After`, webhook forgery/replay and unpaid upgrades.

Frontend hardening verified in the running app: CSP present in `<meta>` and headers, zero
CSP violations, HLS playback reaches `readyState 4` under the policy, dialogs and board
export work, and a channel logo with a broken URL hides via the delegated error listener.

## Motion checks (1.4.3)

Measured in the running app with the demo board:

| Check | Result |
| --- | --- |
| Entrance stagger | `animation-delay` = 0s / 0.036s / 0.072s / 0.108s for four new tiles |
| Entrance layers | `tile-fade` on the frame, `body-settle` + `tile-sheen` on the body |
| Entrance cleanup | `.is-entering` removed after the body animation; not re-applied on view or focus changes |
| FLIP on layout change | 4/4 tiles animated and settled to `transform: none`; rapid 1→9→1 clicks also settle with no residue |
| Iframe continuity | All four iframe references survived a layout change — no reload |
| Node reuse | Tile nodes kept their tags across the change; single-column width resolved to 1088 px |
| Hover ring | Opacity-only pseudo-element, no `box-shadow` transition on `.tile` |
| Reduced motion / hidden tab | FLIP skipped; durations collapse via the existing media query |
| Main-thread cost | Layout switch: 2 ms median / 3.3 ms max (4 tiles), 3.8 ms median / 5.2 ms max (9 tiles); 24/24 under 16.7 ms |

## Accessibility and audits (1.4.3)

Lighthouse against the served build: **Accessibility 100 · Best Practices 100 · SEO 100**,
no failing audits. Two earlier failures were fixed:

- `aria-selected` on the view navigation buttons (invalid on a plain button) → `aria-current="page"`.
- The board tab close button was a 16 px target → 24 px hit area with the same 10 px glyph.

## Why each BLOCKED result is blocked

- **HLS readyState in the harness.** Headless Chrome sometimes cannot decode the H.264 test
  stream (`readyState 0`), so the check can be BLOCKED. This run decoded it and passed
  (58/1 overall); playback is also verified separately in the app browser under the shipped
  CSP.
- **Install prompts.** Removed in 1.8.2 — there is no manifest, install button or
  home-screen app to test. The offline service worker is still checked.
- **Reduced-motion behaviour.** The OS preference cannot be set from the harness. Verified
  separately with `--force-prefers-reduced-motion`: the Home page renders fully, delays
  are zeroed, and the FLIP path is skipped by script.

## Manual verification (this build)

| Check | Result |
| --- | --- |
| HLS playback in the app browser | PASS — Mux test stream at 1920×1080, `readyState 4`, playing |
| hls.js fallback path | PASS — forced `Hls` attach: `isSupported() true`, `readyState 4`, 1280 px, no error |
| Four simultaneous HLS tiles | PASS — all four `readyState 4`, none paused, no error tiles |
| IPTV import (3-channel fixture) | PASS — 3 loaded, 2 skipped (duplicate + invalid URL), 1 ms |
| Guide load and matching | PASS — 3 programmes, 2 channels matched, now/next rendered |
| Channel browser virtualization | PASS — 19 rows / 206 nodes for 5,000 channels |
| Jellyfin connect (stub) | PASS — server name, Live TV flag, 2 channels, stream URL contains `api_key` |
| Jellyfin wrong password | PASS — "Wrong username or password…" shown |
| Jellyfin unreachable host | PASS — "Failed to fetch. Check the URL…" shown |
| Dashboard visuals | PASS — board cards, recents, favourites, source pills |
| Sources visuals | PASS — three integration cards, left-aligned actions, guide note |
| Channels sidebar | PASS — opens with C/button, **Live now 8 · New videos 22**, Jesse Weber + Law&Crime pinned, filter and add work, Esc closes |
| Download only | PASS — no install buttons, manifest or Apple tags; Download for computer in Home/Plan/More; zip returns 200 |
| Playlist watch links | PASS — `watch?v=…&list=PL…` becomes that shuffled playlist; watch-only link stays the video |
| Idle hover | PASS — when chrome hides: cursor `none`, tile pill opacity 0, hover ring opacity 0; pointer move restores |
| NASA replacement | PASS — CBS News 24/7 live in Demo 9/Always on/Suggested; no NASA left in curated lists |
| MrBeast long-form | PASS — Demo/Creators/Suggested use `PLoSW…` (Survives); MrBeast Gaming uses `PLnYX…` (compilations); pasted `UU` links alias to them |
| Home render | PASS — 9 sports thumbnails, 3D wall, drift/sweep, live pulses; reduced-motion disables animation |
| Preset photos | PASS — all 8 walls render a 2×2 photo mosaic from their own feeds |
| Shorts filter | PASS — simulated 30s duration on a playlist triggers `nextVideo`; next video reports 1113s; `longform` persists |
| Autoplay | PASS — single video carries `loop=1`; simulated end (19/20s) seeks to 0 and resumes at 0.5s; playlist advanced 1085→1113s |
| Mobile 430 px | PASS — Home/Wall/Sources/Suggested `overflowX = 0`; Arrange/Channels in More |
| Layouts 1–4 | PASS — 1-up 1 tile/1 iframe/1 col; 2-up 2/2/2; 4-up 4/4/2; every visible feed reached `currentTime > 0` |
| 4-up | PASS — 4 tiles/4 iframes/2 cols, 0 blocked, all four playing |
| Layout code | PASS — caps 1/2/3/4/6/9; hidden tiles are removed, so 1-up loads **one** decoder, not four |
| Feed scan | PASS — 25/25 video IDs resolve, 23/23 playlists have a playable first video, no dead curated links |
| Site zip | PASS — `multiview-site.zip` 972 KB / 24 files, no server/tests; served on :5488, app boots, `/server` and `/tests` 404 |
| Live Cloudflare Pages | PASS — `https://multiview-cc.pages.dev`; **100/100** with `--url` (CSP/HSTS/nosniff/referrer/frame headers, security.txt, zip 200, /server and /tests 404), Lighthouse 100, 0 app errors |
| Home load | PASS — **0 YouTube iframes**, 9 render images, 32 lazy preset thumbs; Wall builds 4 on first click |
| 4-up note | PASS — Home and Help describe four players; no nine-up copy remains in the app |
| Design pass | PASS — new copy/button hierarchy/blue-cyan accent live; 320/390 px `overflowX = 0`; Lighthouse 100 |
| TV mode | PASS — `?tv=1` opens the wall, 4 tiles, hint visible, first tile focused; ArrowRight moves; Enter focuses; focus returns to the same index; Y exits |
| TV edge cases | PASS — 390 px 4-up ArrowDown moves 1 (rendered columns); Space on a nav button is not hijacked; hint fades after 6 s |
| TV by default | PASS — arrows/Enter/1–4 navigate the wall with no TV mode toggle; ring clears on pointerdown; CrKey/Chromecast/Tizen/webOS/HbbTV/Fire TV and big hover-free touch-free screens detect as TV at ≥700 px |
| Sideways scroll | PASS — `homeView.scrollWidth === clientWidth` at 888; 320/390 `overflowX = 0` |
| Home panels | PASS — compare has 4 items, TV panel and share panel render, TV/share buttons work |
| Live | PASS — `044353df56` deployed 2026-11-12 (GitHub Actions (public repo)); live checks **100/100**, Lighthouse 100, `/tv` and `/help` both 200 |
| Product film | PASS — 1280×720, 24 fps, 10.0 s, 1 video track, 0 audio tracks; 3.0 MB MP4 + 270 KB poster; lowercase brand/end card; autoplay observer starts it when visible; reduced-motion keeps it paused; mobile frame 348×196; no console errors |
| Copy voice | PASS — lowercase nav, headings, buttons and labels; domain always `multiview.cc`; Home reworded (“up to 9 streams. one screen.”, “one wall, not twelve tabs.”, “use your own login.”); Sources/Discover/Channels/More/Plan/dialogs and FAQ lowercased |
| Hero art | PASS — 9 local text-free sports images (404 KB), all load; sports cards use the same art; no YouTube thumbnail text or purple |
| OG card | PASS — `icons/og.png?v=4`, 1200×630, lowercase headline, blue palette, four-tile wall |
| Help & devices | PASS — `/help` 200, 6 device cards (iphone, ipad, mac, android, google tv, apple tv/airplay, windows/linux), 17 FAQs, 16px/1.7 body, Lighthouse 100, 0 errors |
| Device panel | PASS — Home “one wall. any screen you own.” with iphone/ipad/mac/android/google tv/apple tv chips, tv mode and `help.html#devices` link |
| Readability | PASS — Home body copy 13.5–14px, FAQ dialog 13.5px, help page 16px/1.7; no overflow at 390/1440 |
| Price wording | PASS — “$5 one time fee” on Home, Plan, dialog, legal and README |
| Titles | PASS — home `multiview`, `/tv` `multiview tv`, `/help` `multiview help`, legal `multiview legal` |
| Access model | PASS — free in beta; hosted site $5 one time fee after; downloaded app yours, free forever; plan cards, dialog, legal, beta license and help pricing panel agree |
| Tuners & Plex | PASS — Sources has 4 cards including “tuners & plex”; help covers HDHomeRun/Tablo/Plex via M3U+XMLTV and local-http caveat; 57/57 client checks |
| Native apps | PASS — help states Apple TV is AirPlay and native tvOS/Android TV apps are a separate build; no native app is claimed |
| Film/OG brand | PASS — film and poster re-rendered with “multiview”; media v3 and OG v4 live; 10 s, no audio |
| Hero film | PASS — 7 s, 1280×720, 2.1 MB, no audio; 1→2→4; sits beside hero copy; poster v4; autoplay muted |
| Audio focus | PASS — tile src and iframe load count unchanged on per-tile mute, mute-all and audio focus; 58/0/1 suite |
| Auto-heal | PASS — synthetic YouTube error swaps the tile URL in the suite; media errors call the same fallback |
| Fast path | PASS — demo order 1,2,4,3,6,9; 4-up default; lazy iframes; boot thumbnails; film threshold 0.5 |
| Source slot | PASS — `/help` footer and Home footer have `public repo · coming soon`; FAQ explains the repo is pending; no dead/placeholder link |
| Clean URL | PASS — `?tv=1&utm=x` → `/tv`; `?home=1&utm=y` → `/`; title and mode follow the path |
| Faster Home | PASS — 5 requests / 129 KB before lazy thumbnails; film waits 1.6 s; poster preloaded |
| No black bars | PASS — YouTube/Vimeo tiles scale to cover using the oEmbed aspect (4:3 1.4×, 16:9 1.05× in 4-up); direct video uses `object-fit: cover`; TV gap 0; stills hold until playback |
| Captions higher | PASS — 3% lift + 1.07× minimum cover; bottom edge stays covered |
| Hacker wall | PASS — four HackerTube/HN picks open as a 4-up wall; Home shows five ready-made cards |
| All walls | PASS — 13 presets in the dialog; clicking one closes it and opens the 4-up wall |
| Random variety | PASS — category-balanced 4-up roll; second roll differs; sports and preset links included |
| Funny 2-up | PASS — demo 2-up and the Funny preset open Family Guy + American Dad; random 2–4 always includes one funny tile |
| Captions fit | PASS — 2-up iframe is fully inside the tile; cover mode keeps the 3% lift; no crop in tall tiles |
| Founder ID | PASS — no `MV-` text in Home, plan dialog or built HTML |
| Beta start | PASS — `start.py` in the zip, executable, picks a free port, no missing poster preload |
| Download freshness | PASS — live zip `BUILD.txt` matches the site; links stamp a fresh `?t=` URL |
| Sign-in copy | PASS — explicit paste-a-service heading, plain-English steps, own-login FAQ on Home and Help |
| Real frames | PASS — hero film/poster, sport cards, preset cards and OG use real YouTube frames; local fallbacks match |
| Frame refresh | PASS — sport previews re-request a new frame every 5 minutes on Home |
| Status page | PASS — `/status`, `/status.js`, `/health.json` all 200; health 56/56 |
| Status chip | PASS — top bar and footer read health.json; green = uptime, plan dot is blue |
| Hero motion | PASS — stronger tilt + frame shift + opposite glow; meta row removed |
| Toons / Funny | PASS — Toons 4-up reshuffles from 30 clips; Funny 2-up reshuffles from 11 Family Guy/American Dad clips |
| Weekly health | PASS — 86 links, 61 thumbnails, 0 bad; card age + status chip read health.json |
| Functions | PASS — /api/live 200, /api/frame 200 (1280×720), /api/error 204; Wrangler deployed |
| Git / GitHub | LOCAL — repo initialized, commit `2fa2557`; remote pending |
| PWA | PASS — manifest fullscreen, start_url /, fullscreen menu item |
| SEO guides | PASS — /football, /news, /iptv, /plex, /living-room, /mac all 200; ?preset opens the wall |
| CI/deploy | PREPARED — ci.yml, deploy.yml, wrangler.toml; secrets required |
| Threads share | PASS — share dialog opens; Threads intent carries the wall URL |
| 1080p request | PASS — every YouTube embed sets `vq=hd1080`; source quality still depends on the upload |
| Image bandwidth | PASS — sport cards use 320w/1280w `srcset`; presets stay lazy |
| Uptime workflow | PASS — six-hour GitHub Action prepared; requires a GitHub repo to run |
| Home simplification | PASS — feature/compare/TV/share/recent/sources/boards/pricing-cards removed; 3 sports + all, 4 presets, centred login, one price line; 6 sections; no overflow at 390/1440; Lighthouse 100 |
| Big hero type | PASS — home h1 62px at 1000px, up to 82px at 1440px; no overflow |
| TV default | PASS — Google TV UA lands on `/` in TV mode with title `multiview tv`; `?home` keeps Home; desktop/phone unchanged |
| Film delivery | PASS — `preload="none"`, poster first, `media/` excluded from the 503 KB offline zip; video/poster `max-age=31536000, immutable` |
| `/tv` route | PASS — `https://multiview.cc/tv` 200, TV mode on, 4 tiles, focus ring, hint, title “TV mode”, URL stays `/tv`; `/tv.html` 308 → `/tv`; `www/tv` 301 → apex `/tv` |
| Phone toolbar | PASS — 320/360/390/414: one row on Home (54 px), two rows on Wall (84 px), `scrollWidth === clientWidth`, no clipped More button |
| Phone wall | PASS — 4-up rows 173 px, fills 694 px stage; 1–2-up stay centred |
| Paste bar | PASS — six links → 124 px bar, 108 px field, 96 px textarea, not clipped |
| Contrast | PASS — `--muted-dim #778394` = 4.89:1 on `#0f1218`; placeholders and 9 px labels raised |
| Hero colour | PASS — “9 streams” and “multiview.cc” both `#8fb8ff` |
| Security load path | PASS — poisoned `javascript:`, `data:` and `blob:` tiles dropped on reload; self URLs rejected; 5 KB URL rejected |
| Import preview | PASS — shared board shows name, count, layout, `youtube.com, example.com, twitch.tv`; all-evil board rejected |
| Domain | PASS — apex HTTPS 200, HSTS/CSP/XFO/nosniff; Universal SSL active; `www` 301 to apex; Pages domain active |
| Custom domain | PASS — Porkbun delegates to Cloudflare; SSL revalidated; apex live, www redirects |
| Asset cache | PASS — live `app.js?v=100` / `dashboard.js?v=78` / `styles.css?v=75` → `public, max-age=31536000, immutable`; HTML `no-cache` |
| Console | PASS — 0 app errors across Home/Wall/Sources/Suggested/dialogs/sidebar/cinema; only external YouTube CDN failures |
| Preset fills | PASS — News 4, Always 6, Cartoons 2, Sports 6, Esports 4, Creators 9, Comedy 6, Learning 6; Demo 9→9, 6→6 |
| Random wall | PASS — API/Home/X produce 4/6/9 tiles, unique URLs, real names; layout matches |
| Blank wall | PASS — Home/B create a new 0-tile board, paste field focused |
| Mobile overflow | PASS — Home/Wall 430px `overflowX = 0` after the new hero buttons |

## Performance measurements

| Measurement | Result |
| --- | --- |
| DOMContentLoaded / load | 102 ms / 202 ms |
| M3U parse — 5,000 channels, 459 KB | 29.4 ms |
| XMLTV parse — 4,000 programmes | 27.3 ms |
| Channel list DOM — 5,000 channels | 19 rows, 206 nodes |
| hls.js on a normal load | not fetched (lazy) |

Application overhead is small. Video decoding and bandwidth dominate when several streams
play; no claim is made about low-end hardware.

## Corrections made while testing

Recorded for transparency:

1. **Mute aria-pressed / mute-all direction** (1.1.0) — were wrong expectations in the
   harness, corrected rather than changing working behaviour.
2. **Empty-playlist expectation** — the malformed fixture has two junk lines, so
   `skipped: 2` is correct; the assertion was fixed.
3. **Responsive test** — resizing an off-screen iframe did not settle media queries in
   headless Chrome. Replaced with a fresh 600 px frame, which reports the media query
   correctly. The app itself was verified separately with a viewport probe.
4. **HLS in headless** — decoded and passed in this run; it remains environment-dependent, so a future run may report it BLOCKED. The same
   stream plays in the app browser and that headless lacks the codec.

## Not verified / requires your configuration

| Item | Why |
| --- | --- |
| Real Jellyfin server | Needs your URL + credentials and CORS on the server. The client is verified against a protocol-faithful stub only. |
| Jellyfin Live TV playback | Depends on the server's tuner, codecs and transcoding; the app produces a message when it fails. |
| Remote IPTV playlist URLs | Fixtures are same-origin. A remote host must send CORS headers or you must upload the file. |
| PWA install | Human action in a real browser window. |
| Browser without native HLS (Windows/Linux Chrome) | hls.js path was exercised directly, but not on a Windows/Linux machine. |

## Backend tests (separate suite)

`python3 server/test_server.py -v` — **18/18 OK** against the real HTTP server on a
temporary database:

health · register · duplicate email · weak password / bad email · login paths ·
`/me` auth · board CRUD · payload validation (unsafe URL, >9 tiles, bad layout) ·
free-tier limit (402) · share round trip · ownership isolation · checkout without
Stripe keys (503) · webhook signature + upgrade + idempotency · CORS allowlist ·
unknown routes · trial start/expiry · one-trial-per-IP · Pro bypassing the trial.

Two defects were found and fixed by that suite:

1. **Webhook idempotency** — Stripe events were stored under a random local id, so a
   retried delivery was processed twice. They are now keyed by the Stripe event id.
2. **Connection leak** — every request opened a SQLite connection and never closed it;
   `db()` is now a context manager that commits and closes.

## Known limitations

See `README.md` → *Known limitations*: no per-tile audio for arbitrary iframes, no in-frame
ad removal, Jellyfin is Live-TV-only here, and the app is not a native tuner/DRM client.
