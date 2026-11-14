# Changelog

## 1.9.43 — 2026-11-14

### Added

- **Live scores strip.** Home now shows today's NBA, NFL, MLB, NHL, Premier
  League and college football games: live scores first, then upcoming, then
  finals. It uses one cached `/api/scores` call through the Pages Worker; the
  client falls back to direct ESPN scoreboards on a static build.
- Each card links to the ESPN game page.

### Changed

- **Cleaner hero:** removed the dot grid and the gradient headline; the film glow
  is quieter. The ready-made copy is now “15 walls — sport, news, toons, tech,
  science.”

### Notes

- Build `949767d884` is live. Client 59/0/2 (61 checks), bundle 77/77, live
  100/100.


## 1.9.42 — 2026-11-14

### Changed

- **The hero tile now drifts home when you stop moving.** After 1.1 s of a still
  cursor it eases back to flat at a slower rate; any movement picks the follow up
  again. It feels like YouTube’s idle controls, not a frozen tilt.
- **Chrome hides after 3.5 s** instead of 5, with a 300 ms premium ease on the
  top bar and paste bar.

### Notes

- Build `2f4364fea6` is live. Client 59/0/2 (61 checks), bundle 77/77, live
  100/100.


## 1.9.41 — 2026-11-14

### Changed

- **Premium polish pass.** Sections below the hero fade up 10px on first view
  (once, with a 900ms safety fallback), motion uses a single premium easing token,
  card hover zoom is restrained, and the walls CTA arrow eases forward.
- **Uptime chip now says `all up`** instead of `86/86 up`; exact numbers stay in
  the tooltip and footer/status page. Less dashboard, more product.
- Wall boot and tile stagger now share the same easing curve.

### Notes

- Build `d602239922` is live. Client 59/0/2 (61 checks), bundle 77/77, live
  100/100.


## 1.9.40 — 2026-11-14

### Changed

- **Walls arrive from small to full.** Opening a preset, sport, demo or random wall
  now scales the grid from 93.5% to 100% with a 460 ms fade, while the tiles keep
  their own 55 ms stagger and tuning scan. It feels like a screen waking up, not a
  hard swap.

### Notes

- Build `ad7a6691ef` is live. Client 59/0/2 (61 checks), bundle 77/77, live
  100/100.


## 1.9.39 — 2026-11-14

### Changed

- The tuning scan is brighter and holds opacity through the middle of the sweep,
  so the TV-style tile boot is visible on bright thumbnails instead of washing out.

### Notes

- Build `6471794993` is live. Client 59/0/2 (61 checks), bundle 77/77, live
  100/100.


## 1.9.38 — 2026-11-14

### Changed

- **TV-style tile boot.** Tiles now arrive in a 55 ms stagger with a small
  scale/fade, a soft sheen and a single top-to-bottom tuning scan. It reads like a
  TV screen waking up, then stops. No persistent scanlines, no blocked input.
- Kept it compositor-only (transform/opacity) and under a second for four tiles.

### Notes

- Build `6ef85a4a04` is live. Client 59/0/2 (61 checks), bundle 77/77, live
  100/100.


## 1.9.37 — 2026-11-12

### Fixed

- **Ready-made walls button styling.** The new CTA shipped with the old
  `styles.css?v=69` URL, so the CSS was cached and the button rendered unstyled.
  Bumped to `styles.css?v=70` and rebuilt.

### Notes

- Build `f436400221` is live. Client 59/0/2 (61 checks), bundle 77/77, live
  100/100.


## 1.9.36 — 2026-11-12

### Added

- **GitHub is live:** https://github.com/kellarblack/multiview (public).
- `deploy.yml` has deployed successfully with the scoped Cloudflare token; CI
  passes. Secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are set.
- Home footer and Help now link the public repo instead of “coming soon”.

### Notes

- Build `b43755b199` is live via GitHub Actions. Client 59/0/2 (61 checks), bundle
  77/77, live 100/100.


## 1.9.35 — 2026-11-12

### Changed

- **Ready-made walls is one button now.** Home no longer shows a six-card preset
  grid. It shows a single wide **ready-made walls** strip with the count and
  “browse →”; the full 15-wall library opens in the dialog.
- The Home path is now hero → live sport → try a wall → ready-made walls →
  streaming login → price line. Less to scan.

### Notes

- Build `2c207bf275` is live. Client 59/0/2 (61 checks), bundle 77/77, live
  100/100.


## 1.9.34 — 2026-11-12

### Changed

- **The hero tile now leans toward the cursor, not away.** The frame shifts with
  the pointer, the right side comes forward when you move right, and the bottom
  comes forward when you move down.
- **Much calmer:** max ~3.6° of tilt and ~6 px of drift (down from ~8.4°), with a
  slower 0.14 follow. It reads as a little 3D tile, not a camera swing.

### Notes

- Build `15b6f4d2fc` is live. Client 59/0/2 (61 checks), bundle 77/77, live
  100/100.


## 1.9.33 — 2026-11-12

### Changed

- **“Pro” replaces “hosted site”** everywhere users see it: Home price line, plan
  dialog, plan chip after beta, Help, and Legal. Pro is the $5 one-time tier:
  hosted multiview, accounts, cloud boards, sync and live share links. The
  downloaded app stays free.
- Trial/locked copy now says “pro” too.

### Notes

- Build `f8434d55e0` is live. Client 59/0/2 (61 checks), bundle 77/77, live
  100/100.


## 1.9.32 — 2026-11-12

### Added

- **Wrangler deploy is working.** `npx wrangler pages deploy dist --project-name
  multiview-cc --branch main` compiled `_worker.js` and deployed the Advanced Mode
  function. `/api/live`, `/api/frame` and `/api/error` are live:
  - `/api/live?channel=…` resolved NewsNation to `H_bWnIOr-h0`
  - `/api/frame` returned a 1280×720 cached still
  - `/api/error` returned 204
- **Local git repo initialized** (`main`, commit `2fa2557`). GitHub remote is the
  remaining step; the repo page was opened for creation.

### Notes

- Build `f828a9edc3` is live. Client 59/0/2 (61 checks), bundle 77/77, live
  100/100. GitHub Actions (CI, weekly health, deploy) activate after the repo is
  pushed.


## 1.9.31 — 2026-11-12

### Added

- **Share on Threads.** The share button opens a small share dialog with
  **Threads**, **copy link** and the native share sheet when the browser has one.
  Threads uses the official `threads.com/intent/post?text=…` with the wall link
  and a short line you can edit before posting.

### Notes

- Build `ebe07cd8ca` is live. Client 59/0/2 (61 checks), bundle 78/78, live
  101/101. `/api/*` Functions still need the GitHub/Wrangler deploy.


## 1.9.30 — 2026-11-12

### Added

- **Weekly health check.** Mondays 09:17 UTC, `uptime.yml` probes the live paths,
  checks every curated link and thumbnail, and commits `health.json`. Cards show
  “checked 2h ago” from that file.
- **Cloudflare Pages Functions** for `/api/live` (channel → current video),
  `/api/frame` (cached live still) and `/api/error` (privacy-light client errors).
  The Home sport cards use `/api/live` when present and fall back to normal frames.
- **Fullscreen PWA** (`manifest.webmanifest`, `display: fullscreen`) and a
  fullscreen entry in More. Google TV/Android TV/Fire TV can install it.
- **CI + deploy workflows**: build, bundle checks, headless client regression,
  then Wrangler Pages deploy with Functions. No more manual uploads once on GitHub.
- **SEO guides**: `/football`, `/news`, `/iptv`, `/plex`, `/living-room`, `/mac`,
  with `?preset=` deep links to the matching wall.
- **Rights review**: Funny and Toons are out of Home, live in the all-walls dialog,
  carry an `unofficial` badge and a clear warning.

### Notes

- Build `ead4369ae1` is live. Functions are not on the direct-upload deployment;
  GitHub/Wrangler is required for `/api/*`.
- Feed health **86/86**, thumbnails **61/61**. Client 59/0/2 (61 checks), bundle
  78/78, live 92/92.


## 1.9.29 — 2026-11-12

### Added

- **Toons** wall: four random adult-animation picks from Family Guy, American Dad,
  South Park, The Boondocks, Universal Basic Guys, Rick and Morty, Smiling Friends,
  Futurama and The Simpsons. Each open reshuffles.
- **Funny** is now a random 2-up from an 11-clip Family Guy / American Dad pool, so
  it changes every time instead of opening the same two videos.
- YouTube embeds request **1080p** (`vq=hd1080`). If the upload has 1080p or 1440p,
  YouTube can serve it; 4K is source-dependent and four 4K decoders would lag on TV
  sticks, so 1080p is the stable default.

### Notes

- Feed health is now **86/86**. Build `e297d67dfb` is live.
- Client suite 59/0/2 (61 checks), bundle 67/67, live 83/83.


## 1.9.28 — 2026-11-12

### Changed

- **The hero film follows the cursor more.** Tilt is about 2× stronger, the frame
  shifts with the pointer, and the glow moves the other way for depth.
- **The “product film / 7 sec · silent” row is gone.** The film speaks for itself.
- **Green now means uptime.** A separate status chip in the top bar reads
  `health.json` (`56/56 up`), and the footer shows the same line. The plan chip
  keeps its own blue dot.
- The plan chip still says `beta · free`; after launch it becomes `hosted · $5`.

### Notes

- Build `627f112470` is live. Client suite 59/0/2 (61 checks), bundle 67/67,
  live 83/83.


## 1.9.27 — 2026-11-12

### Added

- **A real status page** at `/status`: build id, build date, last feed check and
  any dead links. It reads `BUILD.txt` and `health.json`; no tracking.
- **`tools/health-check.py`** checks every curated YouTube link (oEmbed for
  watch links, HTTP for channels/playlists) and writes `health.json`.
- **A scheduled uptime workflow** at `.github/workflows/uptime.yml`: every six
  hours it probes `/`, `/tv`, `/help`, `/status`, `BUILD.txt` and
  `health.json`, then refreshes the health file. Needs the project on GitHub.
- **`srcset` on sport cards**: 320w mid-frame for normal screens, 1280w frame
  for retina — less bandwidth, same detail.

### Notes

- Current feed check: **56/56 respond**. Build `c60e58530f` is live.
- Client suite 59/0/2 (61 checks), bundle 67/67, live 83/83.


## 1.9.26 — 2026-11-12

### Changed

- **The demo is real now.** The hero film, poster, sport cards and ready-made
  cards use actual broadcast frames from the public YouTube feeds the wall links
  to — no stock photos, no generated sports art. The old Unsplash set is kept in
  `product-video/img-unsplash/` for reference.
- Sport cards pull a hand-picked frame per league (`maxres1/2/3`): NBA, Premier
  League, MLB, college football, UFC, Olympics, ESL.
- Ready-made cards use `mqN` mid-video frames instead of uploader thumbnails, so
  they look like the video, not a branded cover.
- Sport previews refresh every five minutes while Home is open.
- The social card now uses the same real frames.
- Local hero fallbacks (download edition and image-failure fallback) are the same
  real stills.

### Notes

- Build `1b2f0cbfe2` is live. Client suite 59/0/2 (61 checks), bundle 64/64,
  live 77/77.


## 1.9.25 — 2026-11-12

### Changed

- **The paste-a-service box now explains itself.** “put a streaming service in your
  wall” says exactly what to paste, that it opens in a tile, and that you sign in
  there with your own account. Plain English, no jargon.
- Placeholder is now “paste a streaming service link here”. The small print covers
  the one exception: a site that refuses to be framed opens in its own window.
- Help and the login/paywall FAQ now say the same thing: signing in happens inside
  the tile, we never see the password, and it does not bypass a paywall.

### Notes

- Build `c2fac25ade` is live. Client suite 59/0/2 (61 checks), bundle 64/64,
  live 77/77.


## 1.9.24 — 2026-11-12

### Fixed

- **Captions are no longer cut off.** Tall tiles (2-up on a 16:9 screen) now
  contain the whole player over a blurred still, instead of cropping 2× to fill.
  Wide tiles keep the cover crop with the 3% caption lift. The player is always
  fully inside its tile.
- **The beta founder ID is gone.** No more `MV-XXXX-XXXX` on Home or in the plan
  dialog. The internal flag stays local and invisible.

### Downloadable build

- Added `start.py`: picks a free port (5455–5480), warns if 5455 was busy, and
  opens the browser. The three start scripts delegate to it; Windows falls back
  from `py` to `python`.
- The beta zip now marks `tv.html` as the download edition too, and removes the
  poster preload for the film that is not shipped, so the offline copy makes no
  missing requests.
- Download links stamp a fresh `?t=…` URL on pointerdown/click, so a cached older
  zip can never be served. `_headers` also marks the zip `no-cache`.
- Deployment check now downloads the live zip and asserts its `BUILD.txt` matches
  the live site and that `start.py` is present.

### Notes

- Build `ba10a93ec7` is live. Client suite 59–60/0/1–2 (61 checks), bundle 64/64,
  live 77/77.


## 1.9.23 — 2026-11-12

### Added

- **Funny** wall: a 2-up Family Guy + American Dad wall, built from long cuts
  (Family Guy 160 min, American Dad 4.5 h). It is the second card on Home.
- Home now shows six cards: live now · funny · sports · news · creators · hacker.

### Changed

- **2-up demo is funny.** Picking 2-up from “try a wall” opens Family Guy and
  American Dad side by side.
- **Random 2–4 up always gets one comfort tile.** Every random roll now includes
  a Family Guy or American Dad compilation, and the rest stays category-balanced.

### Notes

- Build `16e1726011` is live. Client suite 56/0/2, bundle 62/62, live 73/73.


## 1.9.22 — 2026-11-12

### Added

- **Live now** is the first ready-made wall: Bloomberg, NewsNation, ABC News
  Live and LiveNOW from FOX — the live desk, right now.
- **Tech**, **Science** and **Late night** walls: LTT/MKBHD/Corridor/Mark Rober,
  Veritasium/Kurzgesagt/Numberphile/Vsauce, and Conan/GMM/Sidemen/Jubilee.
- **All walls** button on Home opens a 13-wall dialog. Home keeps five cards;
  everything else is one click away.

### Changed

- **Random wall is a real mix.** It pulls from Discover channels, sports feeds
  and every preset link, takes one from each category first, defaults to 4-up,
  and remembers the last set so the next roll is different.
- Home's five cards are now **live now · sports · news · creators · hacker**.

### Notes

- Build `6070fe0236` is live. Client suite 56/0/2, bundle 62/62, live 73/73.


## 1.9.21 — 2026-11-12

### Added

- **Hacker wall.** A fifth ready-made wall with four Hacker News / HackerTube
  picks: Ben Eater's 6502 from scratch, the AT&T UNIX film, Guy Steele's
  *Growing a Language*, and *Y Not?* from RubyConf.
- The ready-made grid auto-fits, so five cards stay on one row on desktop and
  wrap cleanly on tablets.

### Changed

- **Captions sit higher.** YouTube/Vimeo players get a 3% upward lift with a
  1.07× minimum cover, so captions clear the bottom edge without exposing a gap.

### Notes

- Build `409e1dfa60` is live. Client suite 56/0/2, bundle 62/62, live 73/73.


## 1.9.20 — 2026-11-12

### Changed

- **No letterbox bars.** YouTube and Vimeo tiles are scaled to cover the tile,
  cropping instead of showing black bars. The real video aspect comes from YouTube
  oEmbed, so a 4:3 feed gets a 1.4× crop and a 16:9 feed only ~1.05× in 4-up. Direct
  IPTV/Jellyfin video uses `object-fit: cover`. The cap is 2.4×.
- **No black seams on TV.** TV mode grid gap is 0; the normal wall keeps its 1px
  hairline.
- **No black loading holes.** The local still stays visible on YouTube tiles until
  the player reports `playerState` playing, and every poster has a local fallback
  image behind the YouTube thumbnail.

### Notes

- Build `3bba51ba80` is deployed. Client suite 56/0/2, bundle 62/62, live checks
  73/73.


## 1.9.19 — 2026-11-11

### Changed

- **Four streams, not nine.** One, two and four-up are the only layouts. The cap,
  demo buttons, presets, share import, keyboard shortcuts, help and FAQ all say four.
  Existing boards keep their links; tiles beyond four stay on the board but hidden.
- **A quiet Home.** Boards, the three pricing cards and the extra hero lines are gone.
  Home is now hero + film, four sports, try a wall, four ready-made walls, one login
  card and a one-line price note. Section subtitles removed.
- **Clean URLs.** `?tv=1`, `?home` and `#tv` are read once, then the address bar is
  rewritten to `multiview.cc/` or `multiview.cc/tv` — no query string or hash.
- **Less text, larger type.** Section titles 22px, body 14px, hero 72px. Removed the
  eyebrow, source list, setup and device lines from the hero.

### Faster

- The product film no longer starts on first paint. It waits 1.6 s so the poster,
  copy and thumbnails win the first moment.
- Poster compressed 183 KB → 129 KB and preloaded; it is the only image above the
  fold. Home makes **5 requests / 129 KB** before lazy thumbnails.
- Ready-made wall cards show two stills instead of four (half the image requests).
- Every tile shows a local still while its player boots, so live channels without a
  video id no longer open as black holes.
- Repeated auto-heal notices collapse into one message instead of stacking.

### TV

- **TV controls work by default.** Arrow keys, Enter and 1–4 navigate the wall even
  with TV mode off; the focus ring only appears when the keyboard is used and clears
  on click. `Y` still switches the full 10-foot TV mode.
- **More TVs are detected automatically:** ChromeCast/Google TV (`CrKey`), Tizen,
  webOS, HbbTV, NetCast, Viera, Fire TV and Opera TV, plus any large screen that reports
  no hover and no touch, from 700 px wide.

### Notes

- Build `4ca21ae103` is tested locally (55/0/2 client, 62/62 bundle). Live is still
  `168d21d9e5` until the Cloudflare dashboard is signed in and this build is uploaded.


## 1.9.18 — 2026-11-11

### Changed

- **Home is quieter.** Removed the feature strip, the “why” compare row, the big TV
  panel, the share panel and the Recent row. The page is now hero → live sport → try a
  wall → ready-made walls → your logins → boards → pricing → footer.
- **Fewer, bigger labels.** Section titles are 22px, body copy 14px, and the tiny
  uppercase micro-labels are gone from the main path. Sports names and leagues were
  bumped a size.
- **Four cards, not eight.** Live sport shows three sports + “all sports”; ready-made
  walls shows four presets. The rest stay one click away.
- **The login panel is centred** at 700px instead of stretching across the page with an
  empty right half.
- **Home footer** has share, sources, help & devices, legal and the `public repo · coming soon`
  slot in one line.

### Notes

- Build `fdd0353f46` is tested locally (57/0/2 client, 62/62 bundle). Live is still
  `168d21d9e5` until the Cloudflare dashboard is signed in again and this build is
  uploaded.


## 1.9.17 — 2026-11-11

### Changed

- **The film is the hero.** The product film now sits next to the hero copy instead of in
  a separate section. It is a **7-second, 2.1 MB, 1280×720, silent** cut that shows
  **one → two → four games**, then ends on `multiview.cc`. Less stuff, bigger captions,
  and the wall is the first thing the eye lands on.
- **Four-up is the fast path.** The demo bar leads with 1, 2 and 4; 6 and 9 are still
  available but labelled heavy. The film and the 4-up cards show the simple case.
- **Audio focus no longer reloads the player.** Every mutable tile boots with a stable
  muted URL; `mute`/`unMute` and Vimeo `setMuted` are sent with `postMessage`. The tile
  keeps its iframe, source and playback position when the audio moves.
- **Dead and blocked feeds heal themselves.** YouTube `onError` and the oEmbed health
  check now swap any failed feed (curated or personal) for a live fallback. Media/HLS
  errors do the same. If every fallback is taken, a duplicate live feed is used rather
  than leaving a dead tile. Local unavailable cards remain the last resort.
- **Faster tiles.** iframes use `loading="lazy"`; tiles show the YouTube thumbnail behind
  the spinner while they boot; the hero film only starts when half visible.

### Notes

- **Public repo slot.** `/help` now has a `public repo · coming soon` slot in the footer
  and a “where is the source code?” answer. Replace the span with the real GitHub link
  when the repo ships; no placeholder URL is invented.
- Build `903636ae02` is tested locally. Live is still `168d21d9e5` until the Cloudflare
  dashboard session is signed in again and this build is uploaded.


## 1.9.16 — 2026-11-11

### Changed

- **Cursor-driven 3D preview.** The Home wall now tilts with the pointer and the tiles
  pan at different depths. The looping gloss sweep and the idle float are gone. It uses
  one delegated `pointermove` listener, `requestAnimationFrame`, and transforms only;
  touch and reduced-motion visitors keep a still wall.
- **Bigger, quieter hero.** The home headline runs up to 82px with an 17px lede. Less
  masthead, more wall.
- **TV browsers default to TV mode.** A Google TV / Android TV / Fire TV browser lands
  on the wall in TV mode (`multiview tv`), with the remote hint. Phones, tablets and
  desktops still land on Home. `?home` is the escape hatch.


## 1.9.15 — 2026-11-11

### Changed

- **Short titles.** The browser tab is now **`multiview`**, the TV page is
  **`multiview tv`**, and help/legal are `multiview help` / `multiview legal`.
  The visible wordmark drops the `.cc`; the domain stays in URLs.
- **The access model is explicit.** Beta is free. After beta, **hosted access is a
  $5 one time fee** for new accounts. The **downloaded app is yours to keep and use**;
  no account, no subscription, no license server. Home has three cards:
  **free in beta · hosted site · your app**.
- **Plan dialog, legal page, `BETA-LICENSE.txt`, `START-HERE.txt` and help** were
  rewritten to match. The old “founders keep the hosted site free forever” promise is
  replaced by “the app is yours; hosted access is the paid part.”
- **Product film and OG card re-rendered** with the short `multiview` wordmark;
  media went to `?v=3`, the OG card to `?v=4`.
- Preset names and sport names are lowercase.

### Added

- **Tuners & Plex.** Sources now has a “tuners & plex” card, and `/help` has a section
  for HDHomeRun, Tablo, Plex, Threadfin and xTeVe using M3U + XMLTV. It notes that local
  `http` tuners belong in the downloaded build on localhost.
- **Native apps note.** `/help` says Apple TV uses AirPlay and native tvOS/Android TV
  apps are a separate native build. The web app does not claim to be those apps.


## 1.9.14 — 2026-11-11

### Added

- **Help & devices page at `/help`.** One readable page with:
  - iphone & ipad, mac, android phones & tablets, google tv / android tv / fire tv,
    apple tv and windows & linux
  - what works on each (browser, tv mode, airplay) and the exact steps
  - 17 short answers on layouts, tv mode, sound, blocked feeds, 9-up, boards,
    downloads and privacy
  - 16px / 1.7 body copy, anchors, table of contents and a “still stuck?” box
- **Home device panel:** “one wall. any screen you own.” with chips for iphone,
  ipad, mac, android, google tv and apple tv · airplay, plus a device setup link.
- Help is in the offline shell (`sw.js` v9), the sitemap and the no-cache header list.
- Linked from **More → devices & help** and from the in-app Help dialog.

### Changed

- **Readability pass:** Home body copy is 13.5–14px, the in-app FAQ is 13.5px with
  more padding, and the help page runs at 16px / 1.7. Text measures were widened.
- **Pricing language:** every mention now says **“$5 one time fee”** instead of
  “$5 once” (Home, Plan card, Plan dialog, legal, README).
- Preset names and sport card names are lowercase to match the rest of the UI.

### Notes

- Apple TV has no web browser. The wall reaches it through **AirPlay or Screen
  Mirroring** from an iphone, ipad or mac. There is no native tvOS app in this
  static build; that would be a separate native project.


## 1.9.13 — 2026-11-11

### Changed

- **The voice is lowercase now.** The site name is always `multiview.cc`; nav, headings,
  eyebrows, buttons, menu items and status labels follow. Home reads like a product, not a
  brochure: “up to 9 streams. one screen.”, “paste a link. it plays. football, news,
  whatever — one wall.”, “one wall, not twelve tabs.”, “use your own login.”, “built for
  the couch.”
- **Home hero art** no longer uses YouTube thumbnails. The 3×3 preview and the sports cards
  use the same nine text-free sports photographs as the film (404 KB, local, cached).
- **Sources, Discover, Channels, More, Plan, the board sheet and every dialog** were
  reworded and lowercased to match. FAQ questions start lowercase too.
- **Product film re-rendered** with `multiview.cc` in the top bar, “9 games. one screen.”
  and a lowercase end card. Still 10 s, silent, 1280×720, 3.0 MB.
- **OG card regenerated** at `icons/og.png?v=3`: 1200×630, lowercase headline, blue palette,
  nine-tile wall. Social descriptions are lowercase too.
- The offline zip now includes the nine small hero images (~1.1 MB) but still excludes the
  film and poster.


## 1.9.12 — 2026-11-11

### Added

- **Product film on Home.** A 10-second, silent 1280×720 film that morphs the wall from
  one game to nine, then ends on `multiview.cc/tv`. It is muted, loops, and starts only
  while it is on screen. Reduced-motion visitors get the poster and a play button.
  The film is 3.1 MB; the poster is 270 KB. Both are cached for a year and excluded from
  the offline download so the beta zip stays ~500 KB.
- **Film section** — “One wall. Every game.” — with a play/pause control and an honest
  “10 sec · no audio · illustrative” note.
- The film is built from a local stage (`product-video/`) so it can be re-rendered;
  imagery is licensed stock, not captured from the paid services.

### Changed

- Home now runs: hero → product film → feature strip → why strip → live sport → sign-in
  → TV → demo → presets → share → boards → plan → sources.
- `build.py` creates nested output folders, hashes the film into the build id, and leaves
  `media/` out of `multiview-beta.zip`.


## 1.9.11 — 2026-11-11

### Added

- **Clean TV URL: `multiview.cc/tv`.** The build now ships `tv.html`, which Cloudflare Pages
  and Vercel serve at `/tv` without a redirect; app.js turns TV mode on from the path.
  `?tv=1` and `#tv` still work, and the address bar normalises to `/tv`. Exiting TV or
  leaving the wall restores `/`. The TV page gets its own title.
- **www redirect.** `www.multiview.cc` now 301s to `https://multiview.cc` with the path and
  query preserved. The apex is the canonical host.
- **Import preview shows hosts.** A shared board now lists the first three hosts before
  installation, so a link titled “My board” cannot quietly point somewhere unexpected.

### Fixed

- **Zero sideways scroll.** The home view clips horizontally, the demo bar is a two-row
  grid, and the phone toolbar wraps to a second row instead of clipping the More button.
  Verified at 320, 360, 390, 414, 560, 561, 768, 1024, 1440 and 1920 px.
- **Phone wall is usable.** The wall keeps one column but rows stay at least 150 px tall and
  scroll; 9-up no longer collapses into nine 79 px slivers.
- **Long pastes are no longer cropped.** The paste bar grows to 168 px; six links fit.
- **TV mode** keeps the focus ring after Enter, uses the rendered column count on narrow
  screens, does not steal Space/Enter from buttons, and fades its hint after 6 s.
- **Readable secondary text.** `--muted-dim` is now 4.8:1 on the dark surfaces; placeholders
  and small labels were raised to match. The hero “9 streams” uses the exact brand blue.
- **Restored the focus ring** when the chrome auto-hides; added a forced-colours fallback.
- **Unique board names**; `newView()` no longer creates two “Board 2” tabs.
- **Relative assets stay relative.** `/tv` has no trailing slash, so `styles.css` and the
  scripts resolve from the root and the downloadable `file://` build still works.
- **Reduced-motion guard** no longer throws in a detached frame.

### Security

- `localStorage` tiles are re-validated through `normalizeLink()` / `safeUrl()` on load;
  `javascript:`, `data:` and `blob:` iframes are dropped, and `blob:` was removed from
  `frame-src`.
- The app refuses to frame itself (`multiview.cc`, `multiview-cc.pages.dev`, or the current
  host), preventing frame recursion and the same-origin sandbox escape.
- Board text is capped at 200 KB; individual URLs at 4 KB.
- YouTube `infoDelivery` messages must come from the tile's own iframe.
- Service worker `v8` serves exact versioned assets and falls back to the shell document for
  `/tv?…` navigations.
- Cloudflare's auto-injected Web Analytics beacon was removed from the zone; the strict CSP
  still blocks it if it ever returns.

### Domain

- `multiview.cc` is live on Cloudflare Pages: apex HTTPS 200, HSTS/CSP headers present,
  Universal SSL revalidated, `www` 301 to apex. Porkbun now delegates to
  `heather.ns.cloudflare.com` and `mark.ns.cloudflare.com`.


## 1.9.10 — 2026-11-11

### Fixed

- **No more sideways home scroll.** The demo note was 65 px wider than the home view;
  `.home`/`.view-home` now clip horizontally and the demo bar is a two-row grid. Verified
  `homeView.scrollWidth === clientWidth` at 888 and no page overflow at 320/390.
- **TV focus survives Enter.** The ring now keys off the tile id and a state index, so
  leaving focus returns to the same tile instead of jumping to #1.
- **TV arrows respect the rendered grid** (1 column on phones/TV browsers, 2/3 on desktop).
- **TV buttons stay buttons:** Space/Enter on nav/tab/button is no longer stolen by tile
  focus.
- **TV hint fades after 6 s** so it stops covering the bottom row; any remote key brings it
  back.
- **Share links use the current path**, and cancelling the native share sheet no longer
  claims “Link copied”.
- **Service worker serves exact versioned assets** (`v6`), so an old `?v=` file cannot answer
  a new deploy offline.
- **Nine-tile cap test** now actually asserts exactly 9 and shows the wall first.

### Audit notes

- A read-only second-agent review found no XSS/innerHTML, sandbox, CSP or external-link
  issues; it flagged the TV focus/space/column and SW cache cases above, which are fixed.
- Residual: YouTube pre-roll ads can look “short” to the long-form duration heuristic; a
  9-up wall is still nine decoders. No known exploitable client issue in tested paths.


## 1.9.9 — 2026-11-11

### Added

- **TV mode.** `?tv=1`, **More → TV mode**, or `Y`: opens the wall with a 10-foot layout,
  hides the paste bar and hover controls, and makes arrow keys move a focus ring between
  tiles. Enter focuses, number keys 1–9 jump, `Y`/Esc exits. A bottom hint shows the remote
  keys. Google TV / Android TV / Fire TV browsers can use it directly; Apple TV uses
  AirPlay/Screen Mirroring.
- **“Built for the couch” panel** on Home with the TV-mode button and the honest Apple TV
  path.
- **“Why multiview” strip:** 9 screens, $0 for founders, any link, no account/tracking.
- **Share / review panel:** no fake testimonials — Share, Copy link, Post on X, Reddit.
  `More → Share multiview` uses the native share sheet when available.

### Changed

- Copy and button hierarchy tightened (see 1.9.8); demo bar fixed to wrap; 320 px overflow 0.
- Redeployed to <https://multiview-cc.pages.dev> (build `e4ae11cf4c`).


## 1.9.8 — 2026-11-11

### Design pass

- **Copy rewritten** for clarity: shorter hero, “Paste a link. It plays.”, “1 to 9 screens”,
  “Blocked? It opens”, “Pick a sport. Six feeds, your pick in the top-left.”
- **Buttons re-ranked:** Add is the single primary action; Random/Blank are secondary;
  Download is tertiary; IPTV/Jellyfin moved to a quiet setup link.
- **Colour refined from research on dark UIs:** graphite surfaces, one cool blue accent,
  red only for live, green for success. The purple hero gradient is now blue→cyan; no neon
  or rainbow gradients.
- **Nav:** Suggested → Discover. Sign-in “1 Paste the link” duplicate removed.
- **320 px:** the plan chip hides, so no horizontal scroll at 320/390.

### Deployment

- Redeployed to <https://multiview-cc.pages.dev> (build `be34a09efc`).
- **Custom domain setup:** Cloudflare zone `multiview.cc` created; proxied CNAMEs `@` and
  `www` → `multiview-cc.pages.dev`; `multiview.cc` and `www.multiview.cc` added to Pages.
  Waiting on Porkbun nameservers: `heather.ns.cloudflare.com`, `mark.ns.cloudflare.com`.


## 1.9.7 — 2026-11-11

### Clarified

- **Home now says 9-up is heavier.** “9-up is the heaviest — nine players, nine decoders.
  1–6 start lightest; give 9 a few seconds.” Also added to the Help FAQ.
- **Tested every layout on the real wall:** 1, 2, 3, 4, 6 and 9-up all produce the right
  tile count, column count and iframe count; all feeds played. 9-up needed the longest
  (up to ~15 s); 1–6 were all playing within 5–10 s.
- **Redeployed** to <https://multiview-cc.pages.dev> (build `cc4ad5b438`).


## 1.9.6 — 2026-11-11

### Performance

- **Home no longer builds the hidden wall.** The grid and its YouTube iframes are created
  only when Wall is first shown: **0 iframes on Home** instead of 4 loading invisibly.
- **Versioned assets are immutable for a year.** `app.js`, `styles.css`, `dashboard.js`,
  `sources.js` and `hls.min.js` get `Cache-Control: public, max-age=31536000, immutable`;
  `index.html` stays `no-cache`.
- **Below-the-fold sections use `content-visibility: auto`** so presets, sign-in, sports and
  strips render when needed.
- **Hero and preset images declare 320×180 dimensions**; the 9 render thumbnails load at low
  fetch priority. The demo/preset thumbnails stay lazy.
- **Redeployed** to <https://multiview-cc.pages.dev> (build `ee1961d1b9`).

Reality check: nine YouTube players are still nine players. Home is now lean; the wall is
as light as the embeds allow.


## 1.9.5 — 2026-11-11

### Changed

- **Home is the default landing.** Opening the site, reloading, or returning later starts on
  Home instead of an inherited wall. The Wall tab still opens the current board; the Demo,
  Random and Blank boards are untouched.
- **Redeployed** to <https://multiview-cc.pages.dev> (build `2b4cabbcee`, `app.js?v=66`).
- Test harness now waits for the app seam rather than the iframe load event (YouTube could
  hold it open), and includes a Home-default check: **59 checks · 57 PASS · 2 BLOCKED** (58/1 when HLS decodes).


## 1.9.4 — 2026-11-11

### Deployed

- **Live on Cloudflare Pages:** <https://multiview-cc.pages.dev> (project `multiview-cc`,
  direct upload, build `d51b91c650`). Security headers and `_headers` are applied; the
  custom domain can be attached later without a redeploy.
- Live check: **73/73** (`python3 tools/deploy-check.py --url …`), Lighthouse 100,
  zero app console errors.


## 1.9.3 — 2026-11-11

### Added

- **Random wall.** Opens a fresh 4/6/9-up mix from the channel catalogue, with real tile
  names and no duplicates. In the Home hero, the More menu or `X`.
- **Blank wall.** Opens a new empty board and puts the cursor in the paste field. In the
  Home hero, the More menu or `B`.
- **Home actions changed:** **Random wall** and **Blank wall** replace the old *Open wall*
  button (the Wall tab still returns to the current board).


## 1.9.2 — 2026-11-11

### Fixed

- **No horizontal overflow on phones.** At 430 px the wall toolbar overflowed by 41 px.
  On narrow screens Arrange and Channels move into the More menu (Mute + More stay in the
  bar), nav padding tightens, and every view now measures `overflowX = 0`.

### Docs

- Added a **free hosting** table to `DEPLOY.md`: Cloudflare Pages, Netlify Drop, Vercel
  Hobby, GitHub Pages, Neocities/Codeberg, with the header and size caveats.
- `build.py` now writes **`multiview-site.zip`** (about 1 MB) — the whole `dist/` site,
  ready to drop on a host that wants a zip.


## 1.9.1 — 2026-11-11

### Changed

- **Videos never sit on the end screen.** Single YouTube videos carry `loop=1` and a
  near-end watchdog that seeks back to 0 and plays again. Playlist tiles already
  auto-advance to the next video; they are left to YouTube's own hand-off.


## 1.9.0 — 2026-11-11

### Added

- **Animated 3D sports render on Home.** A nine-screen wall with real sports
  thumbnails (NBA, Premier League, college football, UFC, MLB, Olympics, CS2, Times Square
  and CBS News), tilted in perspective, with a floating drift, light sweep and live pulses.
  Built in CSS/3D with live thumbnails — Blender is not installed on this machine.
- **Photo previews for every ready-made wall.** Each preset card is now a 2×2 mosaic of
  real thumbnails from that wall, instead of abstract grid cells.

### Changed

- **Playlists stay long-form and horizontal.** Playlist tiles carry a 90-second floor; the
  YouTube player reports each video's duration and Shorts are skipped with `nextVideo`
  (up to six hops). A single video or `/shorts` link pasted by hand is never filtered.
- Existing saved playlist tiles inherit the floor on load.


## 1.8.3 — 2026-11-11

### Changed

- **NASA replaced with a concurrent live feed.** The space-station tile is now **CBS News
  24/7** (`q8Puv82CkFw`), verified live, across Demo 9, Always on, the Channels sidebar and
  Suggested. Veritasium moves to **Science** so the filter stays.
- **MrBeast is long-form only.** The uploads playlist could surface Shorts, so every
  MrBeast entry now uses the official **MrBeast Survives** playlist, shuffled; MrBeast
  Gaming uses the official **One Hour Compilations** playlist. Pasting either old uploads
  playlist (`UU…`) is redirected to the long-form one automatically.


## 1.8.2 — 2026-11-11

### Changed

- **Download only — the install app is gone.** Home and Plan now show **Download for
  computer** and nothing else. The PWA manifest, Apple standalone meta tags,
  `beforeinstallprompt` handler and install buttons were removed, so the browser no longer
  offers a home-screen app; the static build still runs offline.
- **Channels sidebar (`C`).** A right-hand drawer with **Live now** and **New videos**
  sections, a filter, and one-click add. **Law&Crime Network** and **Jesse Weber** are
  pinned to the top of New videos.
- **Watch links inside a playlist now shuffle the playlist.** A
  `watch?v=…&list=PL…` link becomes that playlist with a random start instead of the single
  video; mixes (`RD…`) still play as the video. Shuffle range widened to 1–50.
- **Suggested is 30 feeds** (8 live, 22 playlists), 14 creators.

### Removed

- `manifest.webmanifest`, `apple-mobile-web-app-*` tags, `mobile-web-app-capable`, the
  install prompt handler and the install FAQ entry.


## 1.8.1 — 2026-11-11

### Changed

- **Channel links open the live feed by default.** `/channel/UC…`, `/@handle` and
  `/c/name` inputs resolve to the channel's live stream, renamed to the handle. A built-in
  handle map covers news, sport, creators, tech and learning channels.
- **If the channel is not live**, the tile automatically switches to that channel's uploads
  playlist instead of showing a dead player. Curated walls still swap to a live feed from
  the same category.
- **Unknown handles** open the channel's live page in a window, with an **Open live page**
  button, because only channel IDs can be embedded.
- **Demo and News desk now use NewsNation** in the CBS slot — CBS 24/7 was offline at the
  check. CBS was removed from Suggested, leaving 28 feeds (8 live, 20 playlists).


## 1.8.0 — 2026-11-11

### Added

- **Dead feeds heal themselves.** YouTube tiles now listen to the player's own
  `onError` messages (via `enablejsapi`, no external script). On **Demo and preset
  boards** a failed feed is replaced in place with a verified one from the same
  category — news swaps for news, cartoons for cartoons, creators for creators — and
  a toast says what happened. A second oEmbed check catches removed uploads on those
  boards even if the player stays quiet.
- **Clear card on personal boards.** If a link you pasted is removed or refuses
  embedding, the tile shows **“This video is unavailable”** with **Open on YouTube**,
  **Swap in live feed** and **Remove** — never YouTube's own dead-player page. Reload
  clears the card and tries again.

### Verified

- Invalid video and invalid playlist both raise the card.
- Demo/preset tiles auto-replaced; category pools checked.
- Normal playback: zero console errors with the player API enabled.


## 1.7.6 — 2026-11-11

### Fixed

- **No more unavailable demo tile.** NBC News NOW no longer allows the `live_stream`
  embed, so the demo and News desk now use **Bloomberg Television**, which plays. Saved
  Demo boards migrate the old NBC link in place. **NewsNation** joins the Suggested list.
- **The “Controls” tab is gone.** The only way back is moving the pointer (or clicking or
  typing); the bars and cursor still return immediately. This also removes the last
  floating chip over the video wall.

### Added

- **More creators and content.** Suggested now indexes **29 feeds**: 13 creators
  (MrBeast, MrBeast Gaming, GMM, Conan, Mark Rober, Dude Perfect, Sidemen, Michelle
  Khare, Airrack, Zach King, Corridor Crew, Yes Theory, Jubilee), 2 tech channels and
  5 learning channels.
- **Creators wall is now 9-up** with nine verified uploads playlists.
- **Learning** preset (6-up): TED, Kurzgesagt, Veritasium, Numberphile, Vsauce, MKBHD.


## 1.7.5 — 2026-11-10

### Changed

- **Quieter top bar on the floor.** The cinema and window-wall buttons are gone from the
  toolbar, and the six layout squares collapsed into one **layout button** with a 3×2
  picker. The wall toolbar is now Arrange, Mute, More.
- **Cinema is a shortcut, not a button.** `H` enters; `Esc` or `H` exits. The **Exit
  cinema** pill flashes for three seconds on entry, appears whenever the pointer moves, and
  fades when you stop. No cinema button to hunt for.
- **Window wall** lives in **More → Window wall** (`W`), next to **Plan & pricing**.
- **The plan chip is hidden on the wall** so the board stays quiet; it is still on Home and
  in the More menu.


## 1.7.4 — 2026-11-10

### Changed

- **The cursor hides with the controls.** After five idle seconds on the wall the
  pointer disappears along with the top and paste bars, and returns the moment the
  pointer moves, a key is pressed or a tile is clicked.


## 1.7.3 — 2026-11-10

### Hardened for deployment

- **`security.txt`** at `/.well-known/security.txt`, shipped in `dist/` and in the
  download.
- **Headers:** HSTS now includes subdomains, `X-Permitted-Cross-Domain-Policies: none`,
  a wider `Permissions-Policy` (payment, usb, fullscreen self), and `X-Robots-Tag:
  noindex` on the zip. Vercel also hides `x-powered-by`.
- **Service worker** now caches `dashboard.js` and `sources.js`, so Home, Sources and
  Suggested open offline; cache bumped to v4.
- **No-JS fallback:** a `<noscript>` notice explains the wall needs JavaScript.
- **Assets:** sport thumbnails declare `width`/`height` to stop layout shift, the unused
  Google preconnect is gone, and social metadata gains image alt text and locale.
- **`tools/deploy-check.py`** — 64 checks on the bundle (files, exclusions, headers, JSON,
  zip, edition markers, executable start scripts), with `--url` probing a live host.

### Changed

- Sitemap entries carry `lastmod`; the manifest declares `lang`/`dir`.


## 1.7.2 — 2026-11-10

### Added

- **Downloadable build.** `multiview-beta.zip` ships in `dist/` (and the project root for
  local testing). It contains the static app, `start-mac.command`, `start-linux.sh`,
  `start-windows.bat`, a plain-text `BETA-LICENSE.txt` and `START-HERE.txt`. Download
  buttons are in the hero, the Plan dialog and the More menu.
- **Founder access.** Everyone who opens the app during beta is stamped once with a
  founder record (`MV-XXXX-XXXX`, join date), stored in the browser. The Plan dialog and
  Home show it, and the copy is explicit: website access and downloads stay free for
  founders after launch.
- **Pricing model on Home and Plan.** Beta is free; after beta, new accounts pay **$5 once**
  for website access and downloads. Pro's list now names website access and downloads.
- **Downloaded builds keep working.** The bundle sets `mv-edition=download`; its download
  buttons become **Running offline** and explain that the file is already local. No licence
  server, no phone-home.

### Notes

- Founder access is a local record until accounts ship, and the static files are not DRM.
  Both facts are stated in the UI, the licence text and the README.


## 1.7.1 — 2026-11-10

### Added

- **Sport previews on Home.** Eight cards — Basketball, Baseball, Soccer, Olympics, MMA,
  College football, Esports and a four-up “All sport” mosaic — with real thumbnails.
  Tapping one opens the sports wall (6 feeds) with that sport first.
- **“Already pay for sport?” panel.** A plain-language explanation of TV-everywhere sites,
  a paste field that adds the link to a tile, and 14 one-click shortcuts (FOX Sports, FS1,
  ESPN, ESPN+, NBA League Pass, MLB.TV, NFL+, UFC Fight Pass, DAZN, F1 TV, Peacock,
  Paramount+, Sling, Willow TV).
- **Login-aware tiles.** Links from subscription sites now show a **Login required** badge,
  “Sign in on its own page”, and an **Open & sign in** action. The site’s own login page
  opens in a real window; no password is ever entered into multiview.cc or stored by it.

### Notes

- Browsers cannot pass credentials into a third-party player. The session lives with the
  site, so after signing in once, tiles and window walls in that browser reuse it.


## 1.7.0 — 2026-11-10

### Added

- **Controls auto-hide after 5 seconds.** On the wall the top bar and paste bar collapse
  when idle; moving the pointer, typing or clicking brings them back. A small **Controls**
  tab at the top edge brings them back by click. The preference is stored and can be turned
  off from **More → Auto-hide controls**.
- **Cinema mode is a button** in the toolbar, alongside the existing `H` shortcut and the
  “Exit cinema” pill.
- **Playlists shuffle when added.** MrBeast, MrBeast Gaming, GMM and Conan walls start at a
  random upload each time they are built, then continue through the playlist — two builds
  are never identical.

### Changed

- **Less busy top bar.** Reload all, export/import, Embeds and Help moved into a **More**
  menu. Visible controls are now Arrange, Mute, Cinema, Window wall and More.
- **Home actions look like actions.** Open wall and Install app are bordered buttons with
  icons instead of text-like ghosts.


## 1.6.3 — 2026-11-10

### Changed

- **Suggested channels are indexed with live status.** Each channel was checked against
  YouTube on 10 Nov 2026: **8 live**, 1 playlist (MrBeast). The tab header shows
  “Checked 10 Nov 2026 · 8 live · 9 indexed”, and each card carries live / playlist / offline
  status. All nine are embeddable.


## 1.6.2 — 2026-11-10

### Added

- **Suggested tab.** A fourth section lists live YouTube feeds for channels people know
  from Samsung TV Plus — CBS News 24/7, NBC News NOW, ABC News Live, LiveNOW from FOX,
  NASA ISS, Times Square, Cartoon Network, Boomerang — plus MrBeast. Filter by category,
  add one channel, or add the whole filtered set to the wall. “Open Samsung TV Plus” jumps
  to the free service for channels that have no YouTube feed.
- **Info panel titles.** ⓘ now fetches oEmbed metadata and shows the real thumbnail, video
  title and channel, with **Use as tile name**.
- **Commercial demo feeds.** NHK/DW/France 24/Euronews/Al Jazeera are out of the demo and
  News wall, replaced by CBS/NBC/ABC/LiveNOW, so the public-broadcast info card is gone.
- **9-up/6-up fill.** On Demo and every preset, choosing a larger layout tops the board up
  to that exact count; 9 always shows 9, 6 always shows 6.

### Added content

- Comedy wall: South Park, Family Guy, Gravity Falls and Rick & Morty clips.
- Creators: MrBeast, MrBeast Gaming, GMM and Conan uploads playlists.
- Sports: NBA, MLB, Premier League, Olympics, UFC and college football (NFL embeds are
  rights-blocked).


## 1.6.1 — 2026-11-10

### Fixed

- **9-up and 6-up always show the requested number of screens.** On Demo and every
  preset wall, choosing a larger layout tops the board up with live fillers to the chosen
  count; choosing 9 always yields 9 tiles, 6 yields 6.
- **Public-broadcast info cards removed from the demo.** NHK/DW/France 24/Euronews/Al
  Jazeera are replaced in the demo and News wall by commercial 24/7 feeds (CBS, NBC, ABC,
  LiveNOW), so YouTube’s “X is a public broadcast service” card no longer appears.
- **Bottom-three presets verified:** Esports 4/4, Creators 4/4 (MrBeast, Beast Gaming,
  GMM, Conan), Comedy 6/6 (South Park, Family Guy, Gravity Falls, Rick & Morty).
- **Source info reads real video titles.** The ⓘ panel fetches oEmbed metadata for
  YouTube/Vimeo/Dailymotion, shows the thumbnail, title and author, and can apply the title
  to the tile.


## 1.6.0 — 2026-11-10

### Added — Ready-made walls

- **Seven curated walls on Home**, each rebuilt fresh and filled to its layout:
  **News desk** (4 live), **Always on** (6 continuous live), **Cartoons** (2),
  **Sports** (6), **Esports** (4), **Creators** (3) and **Comedy** (3).
- **Always on** uses continuous free streams: Gumball 24/7, Mr Bean 24/7, two police
  bodycam 24/7 channels, NASA ISS and Times Square.
- **Sports** covers NBA, MLB, Premier League, Olympics, UFC highlights and **college
  football** — NFL’s own embeds are rights-blocked, so college football replaces it.
- **Esports** is CS2: ESL, BLAST Premier, PGL and IEM.
- **Creators** uses MrBeast, Good Mythical Morning and Conan **channel upload
  playlists**, so each tile keeps playing through their videos.
- **Comedy** is three South Park clips.
- Free live-TV services **Samsung TV Plus, Pluto TV and Tubi** were added to Providers
  as window sources (they don’t allow framing).
- Every preset was checked playing: 4/4 news, 6/6 sports, 4/4 esports, 3/3 creators,
  3/3 comedy, 6/6 always-on components.


## 1.5.6 — 2026-11-10

### Fixed

- **The second demo tile is now a true 24/7 global channel.** ABC News Australia's embed is
  geo/embed-restricted and refused to load for some people. It is replaced with
  **NHK World-Japan** (channel `/live`, resolves the current stream automatically).
- Existing Demo boards migrate from the ABC channel/video URL to NHK on load; no manual
  reset is needed.

### Verified

- Demo: Al Jazeera, NHK World-Japan, Disney Kids 24/7, Tom & Jerry 24/7 — all four
  `readyState 4`, none paused.


## 1.5.5 — 2026-11-10

### Fixed

- **A demo tile that refused to load.** ABC News Australia’s channel `/live` embed rejects
  framing even while the channel is live. Its demo tile now uses the verified live video
  (`vOTiJkg1k…`-class URL) instead, and existing Demo boards migrate to it automatically.
- **Smoother startup, less lag.** New tiles now get their iframe sources on a 110 ms stagger
  (0–990 ms for nine) instead of booting every player at once, YouTube hosts are preconnected,
  and each tile gets paint/layout containment so one player cannot force whole-wall work.

### Verified

- 9-up demo: **9/9 playing** (`readyState 4`, none paused) after the change.
- 4-up remains the default; 9-up is inherently heavier (nine decoders), but no longer all
  initialise in the same frame.


## 1.5.4 — 2026-11-10

### Fixed

- **Sources no longer recommends broken tiles.** The old *Plays inside a tile* rows pointed at
  provider homepages (YouTube, Twitch, Kick, Rumble, Vimeo, Dailymotion), which cannot embed
  and produced blocked/blank tiles. The group is now **Providers**:
  - **YouTube live** is the only `+ Tile` row, using the Al Jazeera channel `/live` sample —
    verified to add a playing tile.
  - The other providers show **↗ Window** and open their live/video directory so you can pick
    a stream and paste its link.
- Hint now explains the difference instead of claiming every homepage embeds.


## 1.5.3 — 2026-11-10

### Fixed

- **Layouts are now real screen counts.** Choosing 1-up shows one tile, 2-up two, and so on;
  extra tiles stay on the board and are hidden until a larger layout is chosen, with a short
  “N tiles hidden” note. Previously 1-up stacked every tile in one column.
- **The Demo board fills itself.** On the Demo board, choosing 6-up or 9-up adds live channels
  to reach that screen count, so the toolbar demos work as well as the Home *Live demo* bar.
- **Focus mode no longer shows the “Add a link” card** under the focused tile, and a focused
  tile can be shown even if it is beyond the current layout’s visible count.

### Added

- **Your subscriptions** group in Sources: Hulu, Disney+, Netflix, Prime Video, Max, Fox,
  Peacock, Paramount+ and Apple TV. Pasting any of them now shows the “window only” card
  instead of an empty tile, and the source row opens the service directly. They require the
  user's own login and DRM; nothing bypasses a subscription. YouTube video/live embeds;
  YouTube TV still does not.


## 1.5.2 — 2026-11-10

### Changed

- **Source inspector polish:** the dialog header shows a green **Embedded** or amber
  **Window only** pill, with host · type underneath. Tabs support ←/→, clicking a visible
  tile header opens the inspector, selection clears when it closes, and the panel closes
  if its tile is removed.
- Buttons and info rows stack cleanly below 520 px; the header bar is clickable with a
  hover state.
- No behavioural change to the wall: tile headers remain off by default.


## 1.5.1 — 2026-11-10

### Added

- **Source inspector.** Right-click a tile, press `I`, or use the new info button in the hover
  pill. It shows the source type, host, framing status, audio, captions, board, and the exact
  source and player URLs, with actions for copy, open, window and reload. The inspected tile
  gets a subtle ring so it is clear which broadcast the panel belongs to.
- **Headers tab.** Shows the client policy multiview sets (referrer, sandbox, allow, frame
  policy). “Check headers” reads real headers for same-origin URLs and makes a no-cors
  reachability probe for cross-origin ones, explaining that the browser keeps those headers
  opaque — without spamming CORS errors into the console.
- **View tab + optional tile headers.** A slim bar with source name, host and type, off by
  default. Toggle it in the inspector or with `T`; the preference is stored. The hover pill
  moves below the bar automatically.

### Changed

- Help lists `I`, `T` and right-click, plus a new “Where is this tile from?” answer.
- The wall tip now says “drag a tile by its grip”, matching the optional header bar.


## 1.5.0 — 2026-11-10

### Added

- **Demo any layout, 1 to 9 screens.** Home has a *Live demo* bar with
  1-up / 2-up / 3-up / 4-up / 6-up / 9-up. Each button rebuilds the **Demo** board with
  exactly that many live channels and the matching layout. Other boards are untouched.
- A **nine-channel live pool** backs it: Al Jazeera English, ABC News Australia, DW News,
  France 24, Euronews, Disney Kids 24/7, Tom & Jerry 24/7, NASA ISS and Times Square.
  All nine were verified at `readyState 4` in a 9-up board. Five use channel `/live`
  URLs (they survive a stream ending); four channels block the `live_stream` embed, so
  those tiles use their current video and are refreshed with the build.

### Changed

- Default demo remains four live screens; `Load demo` now rebuilds 4-up.
- The wall preview label “Lofi” became “Kids” so no retired demo name lingers.
- The demo strip stacks cleanly under 760 px.


## 1.4.9 — 2026-11-10

### Changed

- **YouTube tiles are clean now.** Embeds run with `controls=0`, `fs=0`, `disablekb=1`
  and a transparent pointer shield, so the pause/fullscreen bar and hover title never
  appear. All four demo streams still played at `readyState 4` after the change.
- **Fullscreen is ours:** the tile pill gained a dedicated fullscreen button that fills
  the screen with the tile (video + pill only), replacing YouTube's button. Focus (`F`),
  pop-out and reload remain.
- The clean mode is deliberate and documented in the FAQ: live streams do not need
  seeking, and popping a tile out restores the site's own player.
- Note: muting/unmuting, captions and audio focus all continue to use the app's controls.


## 1.4.8 — 2026-11-10

### Changed

- **The demo is live now.** Four verified 24/7 YouTube channels replace the old films:
  Al Jazeera English, ABC News Australia, Disney Kids 24/7 and Tom & Jerry 24/7. All four
  were checked at `readyState 4`, unmuted by policy but playing, at 1280 px.
- **Lofi Girl and Big Buck Bunny are gone.** Retired demo links are replaced in place on
  an existing Demo board (names, history and positions updated) instead of being appended,
  so the board stays at four tiles.
- **“It’s playing — keep it.”** The framing card’s *Try anyway* action is now explicit: one
  press keeps the site in the tile, clears the redirect flag, unlearns the host and says so.
- **Less YouTube chrome:** embeds add `rel=0`, `modestbranding=1` and `iv_load_policy=3`,
  which removes related videos and annotations. YouTube’s own logo/end overlay cannot be
  removed by any embedding page.
- **Installable player:** `beforeinstallprompt` is captured; **Install app** buttons on
  Home and in Plan trigger the native prompt, with browser-menu and iOS Share instructions
  as fallback. Manifest gained `display_override`; the FAQ explains install and offline.
- **Pricing seam moved to $5 once with a 7-day trial.** Plan copy, card and dialog updated;
  install and YouTube captions are explicitly free.


## 1.4.7 — 2026-11-10

### Changed — look and voice

- **Home:** the subhead is now a single logline — “Paste a link and the wall plays —
  football, motorsport, news, all at once.” Feature titles became **Paste anything**,
  **9 tiles, zero clutter** and **Framing-proof**, with tighter supporting copy.
- **Texture:** a barely-there dot grid sits behind the hero copy, masked so it fades before
  the preview. Board thumbnails use a soft blue gradient; board cards lift 2 px on hover;
  the Pro card gets a fine accent line along its top.
- **Plan:** “Free in beta · $4.99 once at launch · See plans”, with the dialog copy
  rewritten around the 7-day trial and one-time price.
- **Small copy:** paste placeholder punctuation, empty-board instructions (spaces, commas
  or new lines), help subtitle (“Keys, answers and the fine print”), Sources subtitle
  (“Bring your own sources.”), and the meta/OG descriptions now lead with the logline.


## 1.4.6 — 2026-11-10

### Changed

- **The pitch is now the number.** Home hero reads **“Up to 9 streams. One screen.”**
  (numeral, not “nine”), with “9 streams” as the gradient phrase. The same line is used in
  the page title, description, Open Graph/Twitter cards, manifest and the regenerated
  `icons/og.png`.
- Subhead: “Paste a link and the wall plays. Football, motorsport, news — all at once.”
- Feature row now says “One screen, 9 tiles” and “Layouts from 1 to 9”.
- Social image URLs carry `?v=2` so cards that cached the old artwork refresh.
- `DEPLOY.md` now names Cloudflare Pages as the recommended host (edge + `_headers`),
  with Netlify drag-and-drop as the fastest first deploy.


## 1.4.5 — 2026-11-10

### Added

- **Legal & privacy page** (`legal.html`) with copyright, licence, privacy, acceptable
  use and no-warranty sections, matching the app's visual language. Linked from the help
  sheet, the 404 page and `sitemap.xml`.
- **Proprietary `LICENSE`** (all rights reserved, third-party notices preserved) plus
  `author`/`copyright` metadata.
- **Production build** — `python3 build.py` (or `build.command`) writes `dist/` with only
  runtime files: 17 entries, ~924 KB, no `server/`, `tests/` or internal docs. Every text
  asset gets a copyright/build banner; `BUILD.txt` records the build id.
- `netlify.toml` now builds and publishes `dist/`.
- Service-worker shell v3 caches `legal.html`, `LICENSE` and `404.html`.

### Changed

- Deployment docs target `dist/` and explain the copying trade-offs: private repo or
  drag-and-drop, provenance stamping, and why obfuscation/right-click blockers are not
  used.
- Client test result with the Jellyfin stub: **54 PASS / 0 FAIL / 3 BLOCKED** (52/5
  without it).


## 1.4.4 — 2026-11-10

### Security

- **Pen-test suite added** — `server/test_security.py`, 20 adversarial checks against the
  real HTTP server: auth bypass, token tampering, session expiry, storage of secrets,
  login enumeration, SQL injection, stored XSS, CRLF injection, URL schemes, CORS, share
  enumeration, tenant isolation, body limits, route probing, banners, rate limits and
  webhook forgery/replay. **20/20 pass.**
- **Sessions now expire** after `MV_SESSION_DAYS` (default 30) of inactivity and are
  deleted on read; `last_seen` is written at most once a minute.
- **Login timing equalised** — unknown emails run a dummy PBKDF2 verification and return
  the same message, so the account list is not enumerable.
- **Webhook upgrades only paid checkouts** (`payment_status = paid`, payment mode);
  malformed event JSON is a 400, not a 500.
- **Rate limiting keyed to the validated client IP**, with bucket pruning, `Retry-After`
  and a per-IP budget (it previously shared one bucket behind a proxy).
- **CRLF and URL hardening** — board names strip control characters; stream URLs reject
  credentials, whitespace and non-http(s) schemes. `Vary: Origin` is always sent.
- **No version banner**, and a 30-second socket timeout to blunt slow clients.
- **CSP shipped** (meta + deploy headers): `script-src 'self'`, no `eval`, no inline
  handlers. The channel-logo `onerror` attribute became a capture listener.
- **IP-HMAC secret** is created once at init instead of opening a nested connection.
- **Registration and session races** — one trial per IP holds under concurrent sign-ups
  (`INSERT OR IGNORE` + row check), a duplicate-email race returns 409 instead of 500, and
  expired sessions are pruned on login.

### Database readiness (not enabled)

- Schema moved to **`server/migrations/001_init.sql`** with a `schema_migrations` table and
  ordered upgrades.
- Added **`server/.env.example`** and a database section in `server/README.md` covering
  backups and a Postgres/MySQL swap.
- Accounts remain **off**: `sync.js` stays unloaded, no sign-in UI, backend not started.
- **`SECURITY.md`** documents the threat model, results and residual risks.

### Fixed

- Synthetic paste events with no `clipboardData` threw a `TypeError`.
- `Load demo` could stack duplicate Demo boards.
- Session deletion on expiry could be rolled back by the raised 401.


## 1.4.3 — 2026-11-10

### Changed — motion

- Tile arrival is now a three-part choreography: a short frame fade, a 1.8% body
  settle on a custom expo curve, and a single soft light sweep across the tile. All three
  animate `opacity`/`transform` only, and the sweep is clipped inside the tile.
- The stagger is capped at six steps (216 ms), so a nine-tile board never feels slow.
- FLIP now uses an expo-out curve (340 ms) and measures **layout boxes** (`offset*`) instead
  of painted rectangles. Rapid layout clicks therefore animate from the true target box
  rather than from an in-flight transform.
- Home sections rise in 40 ms apart; dialogs fade their backdrop; blocked-tile cards get a
  small settle; the hover pill starts 6 px lower with a softer curve.

### Changed — performance

- `save()` skips the storage write when the serialized state has not changed.
- `renderTabs`, `renderLayoutPicker` and `renderMuteAll` no longer rebuild their DOM on every
  render. Layout buttons update in place and keep keyboard focus; tabs restore focus if they
  had it.
- Tile removal clears its load, entrance and FLIP timers before destroying the player.
- Measured on the running app: a layout switch costs **2 ms median / 3.3 ms max with four
  tiles**, and **3.8 ms median / 5.2 ms max with nine** — 24/24 switches under a 16.7 ms
  frame budget.

### Changed — hardening

- Rate limiting now uses the real client IP, so every user behind a reverse proxy is no
  longer one shared bucket. `X-Forwarded-For` is validated as an IP and rejected otherwise;
  the in-memory table is pruned and capped.
- A limited client gets **429 with `Retry-After`**.
- `Strict-Transport-Security` added to the deploy headers.
- Service worker uses `ignoreSearch` when falling back to cache, so the versioned
  `styles.css?v=…` / `app.js?v=…` shell still opens offline. Cache bumped to `v2`.
- Accessibility: view navigation uses `aria-current="page"` instead of an invalid
  `aria-selected` on plain buttons; the tab close button now has a 24 px hit area.
  Reduced-motion now zeroes animation **delays** as well as durations, so no section waits
  for its stagger before appearing.
- `Load demo` no longer stacks duplicate Demo boards: it fills an empty board, otherwise
  switches to the existing Demo.
- A synthetic `paste` event with no `clipboardData` (automation, some IMEs) no longer throws.
- Tile entrance has a timed visibility fallback, so a throttled tab that never delivers
  `animationend` still shows the tile about a second after it lands.
- Lighthouse on the built app: **Accessibility 100 · Best Practices 100 · SEO 100**, no
  failing audits.


## 1.4.2 — 2026-11-10

### Added

- **Tile motion, built to stay off the main thread.** New tiles fade in with a 30ms
  stagger and a 1.4% body settle; changing layout FLIPs the surviving tiles from their old
  box to the new one with a transform. Both animate only `opacity` and `transform`, so
  playback is not repainted per frame and iframes are never recreated. Verified: four tiles
  enter with 0/30/60/90ms delays, a 4→1 layout switch animates all four and settles back to
  `transform: none`, and iframe references survive the switch.
- **Deployment kit.** `_headers`, `netlify.toml`, `vercel.json`, `.nojekyll`, a branded
  `404.html`, `robots.txt`, `sitemap.xml`, a generated 1200×630 `icons/og.png`, complete
  Open Graph/Twitter tags, and `DEPLOY.md` covering Netlify, Cloudflare Pages, Vercel,
  GitHub Pages and plain servers, plus the optional backend.

### Changed

- Hover rings are a composited pseudo-element instead of a `box-shadow` transition.
- The home view fades in on navigation; layout animation is skipped while the tab is hidden
  so a throttled `requestAnimationFrame` can never leave tiles inverted.
- Queue/pop-up copy uses `location.host` instead of a hard-coded `localhost:5455`.
- FAQ now says **Window wall** instead of the old “Pop out all”, and storage copy no longer
  assumes localhost.

### Fixed

- Removed a stray SVG and closing tag left in the toolbar markup. The document now parses
  with no unclosed or mismatched elements, and the `?` button is the only help control.
- `404.html` links back relatively, so the site also works from a subpath.

## 1.4.1 — 2026-11-10

### Changed

- **Borders are hairline-thin.** The tile wall no longer rings every tile with its own
  1px inset shadow (which doubled up to a 2px seam). The grid now uses a single **1px gap**
  whose background supplies the line, so adjacent tiles meet in one skinny seam. Hover and
  drop highlights follow the same rule. Tile chrome (floating controls, add card, preview
  cells) is down to a half-pixel border.
- **Home has substance.** Added a three-item capability row under the hero (Paste anything /
  One screen, nine tiles / Sites that block framing), gave the wall preview real tile labels
  plus a “window” cell, and tightened the section rhythm.
- **Empty wall can act.** The empty-board hero now offers **Browse sources** and **Load demo**
  next to the keyboard hints instead of a dead end.
- **Plan chip survives mobile.** It was hidden under 760px; it now shrinks instead, since
  “free right now” is the thing it exists to say.

### Fixed

- **Close all no longer risks blank windows.** It used to call `window.open('', name)` to
  reclaim same-named windows, which creates an empty window when that window is already gone.
  It now closes only the references it holds, and the toolbar shows a live dot while windows
  are open.


## 1.4.0 — 2026-11-10

### Added

- **7-day trial with one trial per IP (backend).** Registration starts a trial; the IP is
  HMAC-hashed and stored so a second account from the same address gets none. Board,
  share and sync endpoints return **402** when the trial ends without Pro; login, account
  and checkout stay open. New `GET /api/account`; 17 backend tests pass.
- **Trial-aware UI.** The plan button and dialog show `Free now`, `Trial · Nd` or
  `Trial ended`, and the copy explains the 7-day window before the $4.99 one-off. The
  state is fetched only when the optional sync client is signed in.

### Changed

- Home preview gained a small live badge; plan copy now states the trial explicitly.


## 1.3.2 — 2026-11-10

### Changed

- **Sources list is sorted by what works.** Each group now lists everything that embeds
  first, with a separate *Opens in a window* block underneath. Providers (YouTube, Twitch,
  Kick, Rumble, Vimeo, Dailymotion) sit above the aggregators, and the 20 window-only hosts
  are at the bottom of their group instead of mixed in.
- **Plan is a real button.** The top-bar chip is now an accent-tinted pill — `● Free now →` —
  with hover and press states, so it reads as clickable instead of a status badge.
- **Home polish:** equal-height pricing cards, both with a bottom action (Open the wall /
  See what changes), tighter plan copy, and the same section rhythm throughout.

### Fixed

- A duplicated block from an edit briefly broke `app.js` parsing; removed and re-verified
  with the full suite (52 PASS / 0 FAIL).


## 1.3.1 — 2026-11-10

### Fixed

- **Direct stream links now play.** Pasted `.m3u8`, `.mp4`, `.webm`, `.ogg`, `.m4v` and `.mov`
  URLs were being loaded as web pages (which Chrome downloads or ignores). They are now
  routed to the built-in player, with native HLS where the browser supports it and hls.js
  otherwise. Verified: a pasted Mux HLS URL reaches `readyState 4` and plays.
- FAQ explains the difference between a page tile, a stream file and a site that refuses
  framing.


## 1.3.0 — 2026-11-10

### Added

- **Window wall.** The toolbar's window button opens a proper panel: pick a grid
  (Auto / 2×2 / 3×2 / 3×3), open every tile as a real browser window at computed
  positions, re-tile them with one press, or close them all. The grid is stored per board.
  This is the only mode that works for sites whose players refuse to be framed, because
  each stream runs top-level.
- Opening again closes the previous windows first, so it never stacks duplicates.
  Window references are dropped on reload, so **Close all** also reclaims same-named
  windows if they are still around.


## 1.2.8 — 2026-11-10

### Changed

- **Every live-TV aggregator on the list is now window-first.** `WINDOW_ONLY_HOSTS` covers
  StreamCorner, DaddyLive, StreamSports99, SportsBite, NTV, Famelack, 90 Minutes, zlive,
  Live24, WatchTVs, TV247US, TV Explorer, xyzstreams, FreeTVGarden, kool.to, 1Tube, DamiTV,
  CXtv, IPTV Web and TVNow. Their players are nested frames that refuse to connect (or the
  page redirects), so a tile could only ever show the chat shell.
- **Existing tiles are migrated on load.** A saved tile pointing at one of those hosts is
  converted to a card ("This site only plays in a window") instead of loading the broken
  frame — you do not have to delete and re-add anything.


## 1.2.7 — 2026-11-09

### Added

- **Automatic redirect detection.** Every generic tile watches its frame: a second document
  load within 3.5 s means the site navigated itself away (the chat/landing redirect). The
  tile is blanked, replaced with a card offering **Open window** / **Try anyway**, and the
  host is remembered in `windowOnlyHosts`. From then on, pasting that site opens a window
  directly — same behaviour as StreamCorner, without editing a list.


## 1.2.6 — 2026-11-09

### Added

- **Window-only hosts.** Sites that redirect the frame to their chat page or refuse
  framing are listed in `WINDOW_ONLY_HOSTS`; pasting one opens a real window sized to the
  wall and shows no tile at all. Current list: StreamCorner (chat redirect), DamiTV,
  CXtv, IPTV Web, TVNow (framing headers). The Embeds panel labels these "↗ Window" and
  everything that can embed stays "+ Tile" (NTV, DaddyLive, SportsBite, Famelack, zlive,
  Live24, WatchTVs, TV247US, TV Explorer, xyzstreams, FreeTVGarden, kool.to, 1Tube,
  90 Minutes, StreamSports99).


## 1.2.5 — 2026-11-09

### Changed

- **Pricing is now visible, not buried.** Three touchpoints:
  - a persistent **Free in beta** chip in the top bar (opens the plan),
  - a **Plan** section on Home with *Free in beta* vs *Pro $4.99 once* cards,
  - the hero fine print: "Free during beta · Pro will be $4.99 once at launch".
  The dialog says beta is temporary and that after launch the wall stays free for two
  synced boards while Pro is a single payment.
- Demo tiles carry real names (Al Jazeera English, ABC News, Lofi Girl, Big Buck Bunny)
  so Recent history reads properly instead of four "YouTube" chips.

### Fixed

- **Boot-breaking syntax error**: `4xDzrJKXOOY:` was used as an unquoted object key,
  which is invalid JavaScript and stopped the whole bundle parsing in fresh profiles.
  Keys are quoted.


## 1.2.4 — 2026-11-09

### Added

- **Pricing seam.** A `PLAN` config (stage, price, free board count), a **Plan** dialog and
  a `Free while in beta` line on Home. In `beta` nothing is charged and the Pro button is
  labelled "coming soon"; flipping `PLAN.stage` to `paid` (with `sync.js` + Stripe keys)
  turns it into a real checkout that calls the backend.
- **Framing hint.** After adding a web link, a one-time tip explains that sites which show
  only a chat or a blank frame must be popped out.

### Changed

- Demo wall is now four **YouTube** sources (Al Jazeera English live, ABC News live,
  Lofi Girl synthwave, Big Buck Bunny) — no Kick embed. All autoplay muted and were
  verified playing in the app browser (`readyState 4`).
- FAQ wording covers chat-only/blank frames.


## 1.2.3 — 2026-11-09

### Added

- **Demo wall on first run.** A fresh install lands on a 4-tile board with three openly
  licensed films (Big Buck Bunny, Cosmos Laundromat, Sintel) and the NTV live sports
  menu, so the product shows what it does instead of an empty grid. Home offers
  **Load demo** whenever no board has tiles.

### Changed

- **Hover labels** on direct-stream and web-page tiles (channel or site name). Provider
  players already show their own branding, so YouTube/Twitch tiles stay unlabelled
  rather than repeating the same word three times.
- **Board naming is consistent**: "Board 1", "Board 2" everywhere (creation, empty state,
  tab list). The tab strip's accessible name is now "Boards".
- **Sources header** uses the same eyebrow/title pattern as Home.
- Board cards use the same 12px radius as the rest of the card system; removed the unused
  large-button rule.


## 1.2.2 — 2026-11-09

Visual pass against multiviewapp.com's measured system (16px card radius, white/10
borders, 18–32px card padding, 64px section rhythm, 20% tracking eyebrows).

### Changed

- **Composer is one pill.** The Add button now sits inside the field instead of beside
  it; the bar is 42px tall and reads as a single control.
- **Neutral active tab.** Board tabs use a raised white surface instead of a blue border,
  so blue is reserved for actions.
- **Card rhythm tightened** to match the reference: 16px radius, 18px padding,
  `white/10` borders.
- **Board cards** gained a hover arrow affordance.
- **Wall seams**: zero layout gap, with a 1px `white/5.5` hairline drawn inside each tile,
  so tiles read as separate screens without wasting a single pixel.
- **Header**: divider between the view nav and board tabs; the help button is now always
  available instead of living in the wall-only toolbar.
- **Empty wall** reduced to two short lines.

### Fixed

- The embed-list button was also called "Sources", colliding with the Sources page.
  It is now **Embeds** (dialog title and FAQ updated).

## 1.2.1 — 2026-11-09

Dashboard pass inspired by multiviewapp.com's composition (studied its markup and CSS
before changing anything). Structure borrowed: one huge tight headline, a single gradient
emphasis, short gray sub-copy, pill chips, one primary CTA, lots of black.

### Changed

- **Home rebuilt** around a single hero: "Watch up to nine *streams* at once.", one line
  of copy, five source chips, two CTAs, and a small wall preview at wide sizes.
  Removed the onboarding cards, the favourites block, and most explanatory text.
- **Less blue.** Headline emphasis uses a blue→violet gradient (second accent), links are
  neutral grey, board thumbnails are neutral, and green/amber are reserved for status.
- **Boards / Recent / Sources** are now compact 200px cards and chips instead of wide rows.
- **Smaller seams.** The wall uses zero layout gap with a 1px hairline drawn inside each
  tile; cinema mode matches.
- **Sources copy trimmed** to one line per integration; removed the duplicate descriptions,
  the redundant "Back to dashboard" button, and the long playlist-URL note.

### Fixed

- Home preview column was hidden at all widths (its media query was dropped in the rewrite).
- `renderSources` would throw after the heading button was removed (listener on a missing
  node); the listener is gone.

## 1.2.0 — 2026-11-09

Dashboard, source integrations and real HLS playback. Existing wall behaviour preserved.

### Added

- **Home dashboard.** Boards, recently watched, favourite channels, source status, quick
  actions, and a first-run walkthrough. Every value comes from real state.
- **Sources view.** Web links, IPTV and Jellyfin as first-class integrations with status,
  guided setup, validation, connection tests and removal.
- **IPTV.** M3U/M3U8 import by URL or file, duplicate/invalid entry handling, search,
  group filter, favourites, and a virtualised channel list.
- **XMLTV guide.** Parsed on demand, matched by `tvg-id` then name, shown as now/next.
  Never persisted — the URL is re-fetched, so storage stays small.
- **Jellyfin.** URL validation, username/password or API-key auth, connection status,
  Live TV channel list, HLS playback, and truthful failure messages. Tokens are optional
  and clearly labelled; passwords are never stored.
- **Direct-stream tiles.** A `media` tile kind that renders a real `<video>` with native
  HLS where available and lazy-loaded hls.js otherwise. Players are destroyed with the tile.
- **View navigation** (Home / Wall / Sources) with the toolbar scoped to the wall.

### Changed

- hls.js is no longer loaded on page load: it is fetched only when an HLS stream needs it
  (406 KB saved on every normal visit).
- `save()` now degrades gracefully when a large playlist exceeds `localStorage`, instead
  of failing the whole save.
- Sample/guide URLs are validated with the same http(s)-only rule as everything else.

### Fixed

- Source-card action rows were centred because the blocked-tile card and the new source
  cards shared the `.card-actions` class. Scoped the tile rule to `.tile-card`.
- A stored guide URL is now loaded on revisit (previously only on first connect).

### Testing

- Harness extended from 43 to 57 checks: parsers, guide matching, URL safety, token
  redaction, media-tile lifecycle, dashboard views, IPTV connect/browse, Jellyfin
  connect/failure, responsive probe via a fresh viewport.
- Added `tests/fixtures/` (playlist, XMLTV, malformed playlist) and
  `tests/mock-jellyfin.py`, a protocol stub for the Jellyfin client tests.

### Persistence

Additive only: `history`, `sources`, `views[].tiles[].media`, `views[].audioFocus`.
1.0/1.1 saves load unchanged.

## 1.1.0 — 2026-11-09

Audio focus, board sharing, PWA, accessibility pass, arrange-bar centring fix,
empty-board arrange guard, default port 5455.

## 1.0.0 — baseline

Edge-to-edge nine-up wall, boards, provider normalisation, mute/captions/reload/focus/
pop-out/close, drag arrangement, cinema mode, sandboxed embeds, framing fallbacks,
sources panel, help/FAQ, local persistence.
