# multiview.cc

Live beta: **https://multiview-cc.pages.dev** (Cloudflare Pages, project `multiview-cc`);
custom domain **multiview.cc** is waiting on the Porkbun nameserver change.

A local sports multiview for up to 4 streams on one screen — dashboard, source
integrations and a wall of live tiles.
No installed dependencies, no accounts — state stays in this browser. One command builds
the deployable bundle (`python3 build.py` → `dist/`). The interface and code are
proprietary; see **`LICENSE`** and **`legal.html`**.

## Run it

Double-click **`start.command`** (macOS), or:

```sh
cd sports-multiview
python3 -m http.server 5455 --bind 127.0.0.1
```

`start.command` uses port **5455**, reuses an instance that is already running, and only
moves to another port if 5455 is taken. It serves with `Cache-Control: no-store`, so a
reload always runs the current files. Boards are stored per address: same browser + same
`localhost:port` = same boards.

## The views

**Home** — a short hero with a working paste field, a capability row (what plays, layouts,
and the window wall for framing-hostile sites), your boards, recent streams, the plan and
source status. A first run seeds a **Demo** board with four **live 24/7 channels** — two
news, two cartoons — so the wall is never empty; **Load demo** brings it back, and tiles
delete normally. The **Live demo** bar on Home rebuilds it for 1-up, 2-up, 3-up, 4-up,
2-up or 4-up with live channels. Old demo films are replaced in place on first load.

The Home render is a CSS-3D wall of real sports thumbnails with a slow drift and light
sweep; it is decorative, not an embedded player. **Ready-made walls** cards each show a
2×2 photo mosaic from that board. Opens a curated board in one click: **News desk**,
**Always on** (Gumball, MrBeast, bodycams, CBS News, Times Square), **Cartoons**, **Sports**
(NBA, MLB, Premier League, Olympics, UFC, college football), **Esports** (CS2),
**Creators** (nine creator playlists: MrBeast long-form, MrBeast Gaming compilations,
Mark Rober, Dude Perfect, Sidemen, GMM, Conan, Michelle Khare and more), **Comedy** (South
Park clips) and **Learning** (TED, Kurzgesagt, Veritasium, Numberphile, Vsauce, MKBHD).

**Wall** — the mosaic. Paste links, arrange tiles, watch. Tiles meet in a single 1px
hairline seam; hover shows the controls. Home opens either a **Random wall** (a fresh
2/4-up mix from the catalogue) or a **Blank wall** (empty board, paste field focused).

**Discover** — a catalogue of 30 YouTube feeds: live news, sport, kids, science and city
cams, plus 13 creators, tech and learning channels, filterable by category, with one-click
add or “add the first 4”. MrBeast entries are long-form playlists; pasted uploads links are
redirected to them. The page links out to Samsung TV Plus for channels that have no
YouTube feed. Live status is indexed with a check date (8 live / 22 playlists at the last
check).

**Sources** — a **Providers** list (YouTube live sample adds a tile; other providers and
free live-TV services such as Samsung TV Plus, Pluto TV and Tubi open in a window), IPTV,
Jellyfin, plus a **Your subscriptions** list
(Hulu, Disney+, Netflix, Prime Video, Max, Fox, Peacock, Paramount+, Apple TV) that opens
each service in its own window with the user's own login. Each has a status pill, inline
validation and a real connection test where one is possible.

## Integrations

### Sports and logins

Home shows sport preview cards (basketball, baseball, soccer, Olympics, MMA, college
football, esports) that open a six-feed sports wall with the chosen sport first. The
**Already pay for sport?** panel lists FOX Sports, FS1, ESPN, league passes and the rest:
paste the link you watch and add it. Subscription sites refuse frames, so the tile shows
**Login required** and an **Open & sign in** button, which opens the site in a real window.
Your password stays with the site — multiview.cc never sees or stores it. After signing in
once, the browser session carries into tiles and window walls.

### Web links (built in)

Paste any public page or player link. YouTube, Twitch, Kick, Rumble, Vimeo and Dailymotion
are converted to their player URLs. YouTube **channel links default to the live feed**:
`/channel/UC…`, `/@handle` and `/c/name` resolve to the channel's live stream (with a
built-in handle list), and if the channel is not live the tile plays its uploads playlist
instead. Unknown handles open their live page in a window. Anything else is framed as-is; sites that refuse
framing show a card with **Open window** instead of a broken tile.

### IPTV (works)

- Load an **M3U/M3U8** playlist by URL or file (up to 24 MB / 5,000 channels).
- Malformed entries, duplicates and non-http(s) URLs are skipped and counted.
- Search, group filter, favourites, and a **virtualised** channel list.
- **XMLTV** guide: attach a URL, then channels show *now / next*. Channels are matched by
  `tvg-id` first, then by display name. The parsed guide is never written to storage — it
  is re-fetched from the URL, which keeps `localStorage` small.
- **HLS** plays in a real `<video>`. Native HLS is used where the browser supports it
  (Chrome/macOS, Safari); otherwise **hls.js** is loaded on demand. Unsupported codecs and
  blocked streams produce a message instead of silence.
- Playlist URLs often contain a username and password: they stay in this browser, are
  never logged, and are redacted from error text. Nothing is sent anywhere.

### Jellyfin (works, needs your server)

- Server URL + username/password, **or** an API key.
- Validates the URL, authenticates, and reports the server name and version.
- Lists **Live TV channels** and plays them through the server's HLS endpoint.
- Passwords are never stored. The API token is remembered only if you tick the box
  (plain text in this browser); otherwise it is memory-only.
- Requires the server to allow this origin (CORS) and to be reachable from the browser.

**Not implemented for Jellyfin:** browsing the wider media library, a full EPG grid,
recordings, and transcoding controls. Live TV playback depends on the server's tuner,
codecs and transcoding settings; if a channel will not open, the app says so and the
server's own web UI is the fallback.

## The wall

- **Layouts:** 1, 2 and 4-up are screen counts — the first N tiles are shown and the
  rest stay on the board, hidden, until you pick a larger layout. The Demo board fills itself
  with live channels when you pick more screens. 4 tiles per board.
- **Edge-to-edge:** no headers, 1px seams, rows fill the viewport.
- **Clean YouTube tiles:** the site's control bar is hidden and the frame ignores the
  pointer, so hover never reveals pause/fullscreen/title overlays. The hover pill has mute,
  audio focus, captions, reload, focus, pop-out and **fullscreen**.
- **Long-form playlists:** playlist tiles skip videos under 90 seconds (Shorts) using the
  player's own duration reports. Single videos and `/shorts` links pasted by hand are left
  alone.
- **Autoplay:** single videos loop immediately at the end (`loop=1` plus a watchdog);
  playlists advance to the next video automatically.
- **Self-healing curated walls:** Demo and preset boards listen to YouTube's player errors,
  replace a dead feed with a verified one from the same category, and keep the tile count.
  Personal tiles show a local “video unavailable” card with **Open on YouTube**, **Swap in
  live feed** and **Remove**; a reload retries the original link.
- **Controls:** the top and paste bars auto-hide after 5 seconds idle, and the pointer
  hides with them; move the pointer, click or type to bring both back. Toggle in
  **More → Auto-hide controls**.
- **Hover controls:** drag grip, audio focus, mute, captions (YouTube), reload, pop-out, focus, fullscreen, source info, remove.
- **Source inspector:** right-click a tile, press `I`, or use the info button. Shows type, host,
  source and player URLs, framing and audio; the Headers tab explains what the browser can and
  cannot read; the View tab toggles optional tile headers (off by default).
- **Audio focus:** one tile is the audio source; every other controllable tile is muted.
- **Arrange:** drag the grip, or press `V` and hold anywhere on a tile; drop to swap.
- **Cinema mode (`H`):** hides all chrome; the exit pill flashes on entry and appears
  whenever the pointer moves. `Esc` or `H` exits.
- **Window wall:** **More → Window wall** (`W`) opens every tile as a real window.
- **Tuners & Plex:** Sources accepts M3U + XMLTV from HDHomeRun, Tablo, Plex,
  Threadfin, xTeVe and similar. Local `http` tuners work best in the downloaded
  build on localhost. Native players stay separate; the wall links to them.
- **Cursor 3D preview:** the Home wall tilts and its tiles pan with the pointer. No
  looping gloss sweep; reduced motion stays still. TV browsers open straight into TV mode
  (`?home` keeps Home; both are read once and the address bar is rewritten to `/` or `/tv`).
- **Help & devices:** `/help` covers iphone, ipad, mac, android, google tv and apple tv
  (airplay), plus 17 short answers. Linked from Home, More and the Help dialog.
- **Quiet Home:** hero film, 3 sports + all, 4 presets, a centred login card and one
  price line. Sources live in the footer. No feature/compare/TV/share/recent/boards stacks.
- **Hero film:** a 7-second silent 1→2→4 film next to the Home copy. Muted, looping,
  started only while visible. Reduced-motion visitors get the poster and a play button.
- **Audio without a restart:** audio focus uses the player API, not a new iframe URL.
  Dead/blocked feeds auto-swap to a live fallback; media errors do the same.
- **TV mode (`Y`):** `multiview.cc/tv`, `?tv=1`, More → TV mode, or `Y`. A 10-foot wall with arrow-key tile
  focus, Enter to focus, 1–4 to jump. Works in Google/Android/Fire TV browsers; Apple TV
  uses AirPlay/Screen Mirroring.
- **Share:** Home’s “No fake reviews” panel and **More → Share multiview** use the native
  share sheet or copy the link.
- **Channels sidebar (`C`):** live feeds and new-video playlists, with a filter and one-click
  add. Includes Law&Crime Network and Jesse Weber at the top of New videos.
- **Subscription tiles:** sites that require a login open in a real window with **Open & sign in**.
- **Board sharing:** export/import JSON or a link, validated and previewed.
- **Download for computer** — Home, Plan and More serve the static build; unzip and run the
  start script. No install prompt, no home-screen app, and the shell works offline.
- **Captions:** YouTube's own CC, remembered per tile and inherited by new YouTube tiles.

### Keys

| Key | Action |
| --- | --- |
| `N` or `/` | Focus the paste field |
| `Shift` + `N` | New board |
| `M` | Mute / unmute all |
| `R` | Reload all |
| `F` | Focus the last tile you touched |
| `H` | Cinema mode — `Esc` or `H` exits |
| `V` | Arrange mode |
| `W` | Window wall |
| `C` | Channels sidebar |
| `X` | Random multiview |
| `B` | Blank multiview |
| `Y` | TV mode |
| `Esc` | Leave focus / arrange / cinema / close a menu or panel |
| `?` or `K` | Help sheet (Keys + FAQ) |

## Technology decision

The app stays **vanilla JS + CSS with no build step**. That was a deliberate choice, not
a default:

- This machine has **no Node/npm/tsc**, so a React + Vite + TypeScript build could not be
  compiled or verified here without installing a toolchain (not done without approval).
- The product's value is that it runs from a folder with `python3` and nothing else. A
  build pipeline and `node_modules` would add a real deployment cost for no playback gain.
- Playback performance is dominated by the browser's decoder and the source, not by the
  view layer; a framework would not change frames per second.
- The UI is small (three views) and already componentised with plain functions; the
  integration code is isolated in `sources.js` and unit-tested.

Type safety is handled with runtime validation at the boundaries that matter: URL parsing,
board import, playlist and guide parsing, and Jellyfin responses. If the project later
needs React/TS, the integration layer can be lifted as-is.

## Performance

Measured on this machine (Chrome 156, macOS 26.6):

| Measurement | Result |
| --- | --- |
| App boot (DOMContentLoaded / load) | ~102 ms / ~202 ms |
| M3U parse, 5,000 channels (459 KB) | 29.4 ms |
| XMLTV parse, 4,000 programmes | 27.3 ms |
| Channel list DOM for 5,000 channels | 19 rows / 206 nodes (virtualised) |
| hls.js on a normal page load | not fetched (lazy, 406 KB saved) |
| 4 simultaneous HLS tiles | all reached `readyState 4` |
| Home YouTube iframes | **0** — the wall is built on first visit |
| Versioned JS/CSS caching | **1 year, immutable**; HTML is `no-cache` |
| Below-the-fold rendering | `content-visibility: auto` on presets/sports/sign-in/strips |

Application overhead is small; the real cost is video decoding and bandwidth, which
depends on codecs, resolution and hardware. Home loads no players at all now. Opening a
wall starts its iframes with the existing 110 ms stagger; four YouTube players are still
four players, so a low-end device will feel 4-up more than 2-up. 1–4 are tested to settle
within a few seconds; 4-up can take a moment, but all four play once loaded.

## Ads, pop-ups, limits

Every tile is sandboxed: no popups, no top-level navigation, no downloads, no alert spam.
**Ads painted inside a third-party player cannot be removed by a page**; use a browser ad
blocker. There is no per-tile volume for arbitrary iframes, and no caption generation for
sites that provide none. Those are browser boundaries, not missing features.

## Access model

**Beta is free.** Opening the app during beta creates a founder record in the browser
(`MV-XXXX-XXXX`, join date). After beta ends, **hosted access** to multiview.cc is a
**$5 one time fee** for new accounts. The **downloaded app is free to keep and use**; it
does not need an account or a subscription.

The **download** is a real static bundle (`multiview-beta.zip`): the app, vendor libraries
and start scripts for macOS, Windows and Linux, plus `BETA-LICENSE.txt`. It runs offline,
has no licence check and keeps working as downloaded. Future paid releases are separate;
they do not disable a copy you already have.

Honesty: the site is static, so founder status is a local record until accounts ship, and
no downloaded HTML can be made un-copyable. Paid access will be enforced by the hosted
account layer, not by pretending the files are locked.

The **optional backend** also supports a paid hosted model:

- **7-day free trial** per account, **one per IP** (IPs are hashed, never stored raw).
- When the trial ends, board sync, share links and cloud features return **402** until the
  account has hosted access (`$5 one time fee`). Login, account status and checkout stay open to upgrade.
- Settings: `MV_TRIAL_DAYS`, `MV_TRUST_PROXY`, `MV_IP_SECRET` (see `server/README.md`).

A static page cannot be revoked once downloaded, so the trial gates the *hosted* layer,
not the HTML. That is stated plainly in `server/README.md`.

## Accounts and database

The wall is local-first and **accounts are not enabled**: `sync.js` is not loaded by
`index.html`, there is no sign-in UI, and the optional backend is not running.

The database layer is ready to switch on:

- `server/migrations/001_init.sql` — full schema, applied automatically in order; future
  changes are new `00N_*.sql` files.
- `server/.env.example` — every setting, including session lifetime and trial rules.
- `server/app.py` — tested API (auth, boards, sharing, trials, billing seam).
- `server/README.md` — run, backup and database notes.

See **`SECURITY.md`** for the threat model and the 20-check penetration test.

## Deploying

```sh
python3 build.py        # or double-click build.command
```

That produces **`dist/`** — only what the browser needs (17 entries, ~0.9 MB), with a
copyright/build banner on every text asset and no `server/`, `tests/` or internal docs.
Deploy that folder. Full instructions for Netlify, Cloudflare Pages, Vercel, GitHub Pages
and plain servers are in **[DEPLOY.md](DEPLOY.md)**.

- **`LICENSE`** and **`legal.html`** state the proprietary terms; `404.html` and the help
  sheet link to them.
- `_headers` (Netlify/Cloudflare) and `vercel.json` set CSP, HSTS, caching and security
  headers.
- `index.html` carries canonical, Open Graph and Twitter metadata plus `icons/og.png`.
- Bump the `?v=` query on `styles.css` and the scripts when you change them.
- The optional backend in `server/` deploys separately; without it the app is still fully
  usable and `sync.js` stays inert.
- **Copying:** client files can always be downloaded by a browser. The build excludes the
  backend, stamps provenance, and keeps paid value server-side. Prefer drag-and-drop or a
  private repo over a public GitHub repository. Details in `SECURITY.md`.

## Motion

Entrances and layout changes are compositor-only, so they do not stall playback:

- New tiles fade in with a short stagger, a 1.8% body settle on an expo curve, and a single
  soft light sweep. Stagger is capped at six steps.
- Switching layout FLIPs the surviving tiles from their old **layout box** to the new one
  with a transform (no reflow per frame, no iframe reload). Rapid clicks animate from the
  true target box.
- The hover ring is an opacity overlay, not a `box-shadow` repaint.
- Measured: layout switch is **2 ms median / 3.3 ms max with four tiles** and
  **3.8 ms median / 5.2 ms max with 9** (24/24 under the 16.7 ms frame budget).
- `prefers-reduced-motion` turns all of it off, and layout animation is skipped while the
  tab is hidden.

## Testing

```sh
open http://localhost:5455/tests/regression.html
```

59 checks: shell, Home-default, boards, layouts, providers, sandbox, mute, audio focus,
captions, drag, cinema, dead-feed healing, sharing, persistence, responsive, IPTV/XMLTV
parsing, media tiles, dashboard, IPTV connect/browse, Jellyfin connect/failure,
download-only shell. With the Jellyfin stub the result is **57 PASS / 0 FAIL / 2 BLOCKED**
(HLS decode + reduced motion); when headless decodes HLS it reaches 58/1. See
**`TEST-REPORT.md`**.

Lighthouse on the built app: **Accessibility 100 · Best Practices 100 · SEO 100**.
Backend suites: `python3 server/test_server.py` — **18/18**,
`python3 server/test_security.py` — **20/20**.

```sh
python3 tests/mock-jellyfin.py 8123   # protocol stub used by the Jellyfin tests
```

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Markup, views and dialogs |
| `styles.css` | All styling |
| `app.js` | Wall state, link parsing, tiles, board sharing |
| `sources.js` | M3U/XMLTV parsers, Jellyfin client, player factory |
| `dashboard.js` | Home and Sources views, channel browser |
| `start.command` | Launcher (port 5455, no-store) |
| `icons/`, `sw.js` | Icons and the offline shell (no PWA install) |
| `vendor/hls.min.js` | hls.js 1.5.20, Apache-2.0, lazy-loaded |
| `tests/` | Regression harness, fixtures, Jellyfin stub |
| `server/` | Optional sync backend (accounts, boards, shares, Stripe seam) |
| `sync.js` | Optional client for that backend — **not loaded** by the app |
| `CHECKLIST.md` | Every request in this project with its status |
| `README.md`, `CHANGELOG.md`, `TEST-REPORT.md` | Docs |

## Deployment check

```sh
python3 build.py
python3 tools/deploy-check.py                    # bundle, 64 checks
python3 tools/deploy-check.py --url https://multiview.cc   # + live status and headers
```

It verifies the files that ship, that `server/` and `tests/` do not, the CSP/HSTS/cache
rules, the zip's contents and executable start scripts, and (with `--url`) that the live
site returns 200 for the shell and 404 for the backend paths.

## Known limitations

- **No per-tile audio** for arbitrary iframes; audio focus works by muting controllable players.
- **No in-frame ad removal** and no DNS-level blocking.
- **Jellyfin**: Live TV channels only; no library browsing, EPG grid, recordings or
  transcoding control. Requires CORS and a reachable server.
- **IPTV**: the browser must be able to fetch the playlist/guide (CORS) unless you upload a
  file. Playback depends on codecs; HLS works, RTSP does not exist in browsers.
- **Storage**: per origin; changing ports starts a fresh board set. Large playlists may
  exceed `localStorage` — the app warns and keeps them for the session.
- **Live-TV aggregators are window-first.** `WINDOW_ONLY_HOSTS` includes StreamCorner,
  DaddyLive, StreamSports99, SportsBite, NTV, Famelack, 90 Minutes, zlive, Live24, WatchTVs,
  TV247US, TV Explorer, xyzstreams, FreeTVGarden, kool.to, 1Tube, DamiTV, CXtv, IPTV Web and
  TVNow. Their players are nested frames that refuse to connect when embedded, so pasting
  one opens a window, and any saved tile for them is converted to a card on load.
- **Redirects are detected automatically.** If any other site navigates its frame a second
  time within 3.5 s, the tile is stopped, replaced with an "opened in a window" card, and
  that host is added to `windowOnlyHosts` in storage — so the next paste goes straight to a
  window. No configuration, and it is reversible with **Try anyway**.
- **Not equivalent to a native TV app** (tuners, recordings, multi-room, DRM).
