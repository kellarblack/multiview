# Build checklist — every request from this thread

Status: **DONE** = built and verified · **PARTIAL** = built but not fully verifiable here ·
**IMPOSSIBLE** = blocked by the browser/platform, with the reason given.

| # | Request | Status | Where / evidence |
| --- | --- | --- | --- |
| 1 | Multiview site for sports, paste links, multiple tabs in one browser | DONE | Wall + boards; tabs persist |
| 2 | Make keybinds findable | DONE | `?` / `K` sheet; help button in the bar |
| 3 | Sites like DaddyLive / StreamSports99 / FMHY list work | DONE | Generic embed + verified framing list; DaddyLive, NTV, SportsBite, 90 Minutes rendered in-tile |
| 4 | Cleaner: keybinds back in the corner `?`, not under the hero | DONE | Reverted; icon-only help |
| 5 | FAQ | DONE | Keys + FAQ tabs, 12 answers |
| 6 | Paste several links separated by **spaces**, not only Enter/newlines | DONE | `addFromText` splits on whitespace/commas; paste handler auto-adds 2+ links |
| 7 | Cleaner, interactive tiles, animations | DONE | Hover pill, loading ring, stagger entrance, FLIP layout morph, reduced-motion honoured |
| 8 | Block ads and pop-ups from those sites | PARTIAL | Sandbox blocks popups, redirects, downloads, alert spam. In-page ads cannot be removed by a parent page — reported, not faked |
| 9 | No gaps, no headers/labels, borderless, drag by click-and-hold | DONE | 0px gaps + 1px seam; hover-only labels; grip drag + arrange mode (`V`) |
| 10 | Be like multiviewapp.com, but better | PARTIAL | Same jobs done for web links (9 tiles vs 4, free, no install). Native-only features listed below as impossible |
| 11 | "Everything on that site works on mine" | PARTIAL | Source list, layouts, presets, audio focus, sharing, dashboard, HLS, IPTV, Jellyfin built. See impossible list |
| 12 | Built-in captions | DONE | YouTube CC toggle + inheritance; OS Live Caption documented for other sites |
| 13 | Generate captions for sites that have none | IMPOSSIBLE | A page cannot read another origin's audio/tracks. OS-level Live Caption is the only route |
| 14 | Name it multiview.cc; no brand block at the top | DONE | Title, manifest, hero eyebrow; header has no brand |
| 15 | Seamless, higher quality feel | DONE | Cinema mode, 0-gap wall, refined chrome |
| 16 | Tech stack decision (TS/React/Vite) | DONE | Kept zero-build static: no Node/tsc in this environment, so a build could not be verified; documented in README |
| 17 | IPTV: M3U/M3U8 import, XMLTV, search, favourites | DONE | `sources.js` + `dashboard.js`; 5,000 channels parsed in 29ms, guide matched, virtualised list |
| 18 | Jellyfin: connect, Live TV, playback | PARTIAL | Real client (auth, Live TV channels, HLS). Verified against a protocol stub, **not** a real server |
| 19 | Main dashboard | DONE | Home: hero, paste field, boards, recent, sources |
| 20 | Performance work | DONE | Lazy hls.js (406 KB not loaded normally), virtualised lists, player teardown, measured numbers in TEST-REPORT |
| 21 | Home page like the reference, less wordy, not all blue | DONE | Big headline, one gradient phrase, one line of copy, chips, 2 CTAs |
| 22 | Research that site, including its source | DONE | Fetched HTML + compiled CSS + subpages; tokens applied (16px cards, white/10 borders, 64px rhythm) |
| 23 | Use Firecrawl for that research | DONE (substituted) | Firecrawl needs a paid API key; did the same job with direct fetches |
| 24 | Smaller gaps between streams | DONE | Single 1px grid gap; no per-tile ring, verified `gap: 1px` |
| 25 | Demo streams should look like real live sports/movies | DONE | First-run `Demo` board: 3 embeddable films + NTV sports menu; IDs validated via oEmbed |
| 26 | Fix site-wide inconsistencies | DONE | Board naming, label rules, radii, Sources eyebrow, dead CSS, aria names |
| 27 | Backend ready for later (accounts, one-time price) | DONE | `server/` + `sync.js`: 14 integration tests pass; docs; client is inert |
| 28 | Charge half the price / monetise | IMPOSSIBLE today | No hosting/Stripe account, and payments can't be tested here. The checkout + webhook seam is built and tested offline |
| 29 | Per-tile audio switching between arbitrary iframes | IMPOSSIBLE | No browser API; audio focus mutes controllable players instead |
| 30 | Remove ads drawn inside third-party players | IMPOSSIBLE | Cross-origin DOM is inaccessible; use uBlock Origin |
| 31 | EPG grid, recordings, RTSP, DRM | IMPOSSIBLE | Not available to a web page; Jellyfin exposes Live TV only |
| 32 | PWA install | PARTIAL | Manifest + icons + shell SW built; install prompt needs a human click, so marked BLOCKED in tests |
| 33 | Keep existing data / don't break features | DONE | 54 automated checks pass; test fixtures removed from the live board |
| 34 | Clean tile animations that don't lag | DONE | Opacity/transform-only entrance (staggered), FLIP layout morph, composited hover ring. Measured: transforms settle, iframes keep their references, 0 console errors |
| 35 | Ready to deploy | DONE | `_headers`, `netlify.toml`, `vercel.json`, `.nojekyll`, `404.html`, `robots.txt`, `sitemap.xml`, OG image + meta, `DEPLOY.md`. Static-host regression run: 54 PASS / 0 FAIL / 3 BLOCKED (with Jellyfin stub) |
| 36 | Optimize: no wasted renders, writes or timers | DONE | Save dedupe, render guards, in-place layout picker, timer cleanup; layout switch measured at 2 ms median (4 tiles) / 3.8 ms (9 tiles) |
| 37 | Harden | DONE | Rate limit keyed to the real IP (validated `X-Forwarded-For`), 429 + `Retry-After`, bucket pruning, HSTS, opener severed, SW offline query fix, a11y fixes |
| 38 | High-quality, beautiful animation | DONE | Staggered fade + expo body settle + one soft light sweep, FLIP morph, staggered home sections, refined pill/toast/sheet/card motion |
| 39 | No mistakes | DONE | 54 PASS / 0 FAIL / 3 BLOCKED app suite, 18/18 + 20/20 backend, markup parses clean, no unresolved IDs, balanced CSS, Lighthouse 100/100/100, 0 console errors |
| 40 | Pen test the app and backend | DONE | `server/test_security.py` 20/20; CSP, iframe sandbox, opener, storage and markup checked; see `SECURITY.md` |
| 41 | Ready for an accounts database without enabling it | DONE | `server/migrations/001_init.sql` + migration runner, `.env.example`, backups/Postgres notes; accounts still off (`sync.js` unloaded, no UI, backend not started) |
| 42 | Stop people stealing the site | PARTIAL (impossible in full) | Client files are always savable. Instead: proprietary `LICENSE`, `legal.html`, copyright meta, `dist/` excludes backend/tests/docs, per-build provenance banner, server-side paid value, deployment guidance |
| 43 | Final once-over, beautiful and current | DONE | Legal/404/help polish, Lighthouse 100/100/100, 54 PASS / 0 FAIL / 3 BLOCKED with stub, 18/18 + 20/20 backend, prod bundle boots clean |
| 44 | Demo should be 4 live, important channels (news/cartoons), no Lofi or Big Buck | DONE | Four verified live 24/7 streams; in-place migration replaces old films and cleans history |
| 45 | Downloadable player, free captions, $5 Pro after 7 days, ready early | DONE | PWA install buttons + manifest/SW, YouTube CC built in, $5 one-time seam with 7-day trial copy; Pro gating stays server-side and off |
| 46 | Stop YouTube pause/fullscreen chrome appearing on tiles | DONE | `controls=0&fs=0&disablekb=1` + pointer shield on YouTube tiles; own fullscreen button in the pill; 4/4 demo streams still `readyState 4` |
| 47 | Demo every layout, 1 to 9 screens | DONE | Home Live demo bar rebuilds the Demo board at 1/2/3/4/6/9-up; 9-up verified with 9/9 live `readyState 4`; 5 channel `/live` URLs survive stream rotation |
| 48 | Right-click a tile to see source info, with a headers/no-headers switch | DONE | Source inspector (right-click / `I` / info button) with Source, Headers and View tabs; tile headers optional and off by default; `T` toggles |
| 49 | Demo 1/2/3/6/9 didn't match the chosen screen count | DONE | Layouts now slice visible tiles to the screen count; Demo auto-fills to 6/9; hidden tiles return when the layout grows |
| 50 | Every source recommended for a tile must actually work | DONE | Broken provider-homepage rows removed; only the verified YouTube live sample is `+ Tile`, the rest open the provider directory |
| 51 | Some demo streams don't load; slight lag | DONE | ABC video fallback fixes the refused channel embed; 9/9 verified; staggered iframe boot, preconnect and per-tile containment reduce startup work |
| 52 | Second demo stream doesn't load; use true 24/7 channels | DONE | ABC replaced by NHK World-Japan channel `/live`; existing Demo migrates automatically; 4/4 verified playing |
| 53 | Add pre-made walls for people who don't know what to watch | DONE | 7 Ready-made walls on Home: news, always-on free streams, cartoons, sports, esports, creators, comedy; all filled and verified |
| 54 | Use non-blocked NFL alternative + creators/bodycams/South Park | DONE | College football replaces rights-blocked NFL; MrBeast/GMM/Conan playlists, bodycam 24/7, South Park clips |
| 55 | 9 shows 6, 6 shows 4 on preset walls | DONE | Preset/Demo layout changes fill to the chosen count; 9→9, 6→6 verified |
| 56 | Remove public-broadcast info cards; add Beast | DONE | Commercial news feeds replace NHK/public cards; MrBeast is in Demo/Always/Creators |
| 57 | Add Suggested tab of YouTube live channels also on Samsung TV Plus | DONE | 9 curated channels, category filters, add one/all, Samsung TV Plus link |
| 58 | 9/6 counts on presets; no public info cards; Beast/Family/Gravity/Rick | DONE | Layout fill, commercial news feeds, creators/animation content |
| 59 | Auto-hide chrome after 5s / click tab | DONE | Top + paste bars collapse when idle, Controls tab restores, More toggle persists |
| 60 | Cinema mode as a button; less busy top bar | DONE | Cinema icon added; reload/export/embeds/help moved to More menu |
| 61 | Buttony Install/Open wall | DONE | Bordered buttons with icons |
| 62 | Shuffle creator playlists on add | DONE | Random playlist start index per build |
| 63 | Sport preview cards on Home | DONE | 8 cards with real thumbnails; opens the 6-feed sports wall with the chosen sport first |
| 64 | Logins for FS1/ESPN/league passes | DONE | Login-aware tiles, **Open & sign in**, 14 service shortcuts, paste field on Home; no credentials stored |
| 65 | All-sport mosaic card | DONE | Four-thumbnail tile opens the full sports wall |
| 66 | Downloadable build | DONE | `multiview-beta.zip` with app, start scripts, beta licence; buttons in hero, Plan and More |
| 67 | Founder access for beta users | DONE | Stamped once per browser, shown with join date, free after launch |
| 68 | $5 once for new accounts after beta | DONE | Copy updated on Home, Plan, legal page and README |
| 69 | Deploy hardening | DONE | security.txt, HSTS includeSubDomains, permissions policy, zip noindex, noscript |
| 70 | Offline shell complete | DONE | dashboard.js + sources.js cached, cache v4 |
| 71 | Deploy verification tool | DONE | `tools/deploy-check.py` 64 bundle checks + live URL probes |
| 72 | Cursor hides when idle | DONE | `cursor: none` on `chrome-hidden`; restored on the next pointer move |
| 73 | Quieter top bar | DONE | Cinema + window-wall buttons removed; layout picker is one button + popover; plan chip hidden on wall |
| 74 | Easier cinema exit | DONE | Esc/H exit; pill flashes on entry and on pointer move |
| 75 | W shortcut | DONE | Opens the window wall; listed in Help |
| 76 | Replace unavailable NBC feed | DONE | Bloomberg Television in Demo/News; saved demo tiles migrate; NewsNation added |
| 77 | Remove Controls reveal chip | DONE | Pointer movement is the only way back; no floating tab |
| 78 | More creators + content | DONE | 29 Suggested feeds, 13 creators, Creators 9-up, Learning 6-up |
| 79 | Never show a dead curated tile | DONE | Player-error listener + oEmbed net; Demo/presets swap in category-matched feeds |
| 80 | Personal dead-link card | DONE | Local unavailable card with Open on YouTube / Swap / Remove; reload retries |
| 81 | Player API without console noise | DONE | postMessage only, no external script; normal playback has zero errors |
| 82 | Channel links default to live | DONE | /channel, @handle and /c links resolve live; uploads fallback when offline; unknown handle opens live page |
| 83 | Demo CBS replacement | DONE | NewsNation in Demo/News desk; CBS removed from Suggested (28 feeds, 8 live) |
| 84 | Download only, no install | DONE | Install buttons, manifest, Apple tags and beforeinstallprompt removed; Download for computer remains |
| 85 | Channels sidebar (C) | DONE | Live now + New videos, filter, one-click add; Law&Crime and Jesse Weber pinned |
| 86 | Shuffle watch-in-playlist links | DONE | watch?v=…&list=PL… becomes a shuffled playlist; watch-only stays the video |
| 87 | Replace NASA with a concurrent live | DONE | CBS News 24/7 (`q8Puv82CkFw`) in Demo 9, Always on, sidebar and Suggested |
| 88 | MrBeast long-form only | DONE | Official MrBeast Survives + Gaming compilations playlists; uploads links alias to them |
| 89 | Animated Home sports render | DONE | CSS-3D nine-screen wall with real sports thumbnails, drift + light sweep + live pulses |
| 90 | Photo previews for ready-made walls | DONE | 8 preset cards with 2×2 thumbnail mosaics |
| 91 | Long-form / horizontal playlists | DONE | 90s floor + `nextVideo` skip; single videos and `/shorts` untouched |
| 92 | Autoplay at the end | DONE | Single videos loop=1 + near-end watchdog; playlists auto-advance |
| 93 | Mobile overflow | DONE | 430px wall overflow 41px → 0; Arrange/Channels in More on phones |
| 94 | Free hosting guide | DONE | Cloudflare Pages / Netlify Drop / Vercel / GitHub Pages table in DEPLOY.md |
| 95 | Random multiview | DONE | 4/6/9 unique catalogue mix, named tiles; Home, More, X |
| 96 | Blank multiview | DONE | New empty board + focused paste; Home, More, B |
| 97 | Home loads no hidden players | DONE | Grid/iframes deferred until Wall is shown: 0 on Home |
| 98 | Immutable asset cache | DONE | JS/CSS/vendor 1 year immutable; HTML no-cache |
| 99 | Defer off-screen sections | DONE | content-visibility on presets, sports, sign-in, strips; images sized |
| 100 | 1–9 layout verification + 9-up note | DONE | 1/2/3/4/6/9 counts, columns, iframes and playback tested; Home + FAQ say 9-up is heavier |
| 101 | Copy/button/colour design pass | DONE | Clear hierarchy, tightened copy, blue-cyan accent, plan chip hidden at 320 |
| 102 | Custom domain prep | PENDING | Cloudflare zone + CNAMEs + Pages domains; waiting on Porkbun nameservers |
| 103 | TV mode / 10-foot UI | DONE | `?tv=1`, Y, More; arrows/Enter/1–9; TV hint; AirPlay guidance |
| 104 | Why/compare, TV and share panels | DONE | 9/$0/Any/No strip, couch panel, no-fake-reviews share CTAs |
| 105 | Demo bar + 320 px polish | DONE | Demo bar wraps correctly; plan chip hidden at 320; overflow 0 |
| 106 | Fix horizontal home scroll | DONE | Demo note 65px overflow fixed; grid demo bar; view clip; 888/390/320 verified |
| 107 | TV focus/keys audit | DONE | Focus index preserved, rendered columns, button keys protected, hint fades |
| 108 | Harden cache/share | DONE | SW v6 exact versioned cache; path-aware share; abort-safe |
| 109 | Clean `/tv` route | DONE | `tv.html` served at `/tv`; `?tv=1` normalises; title/URL restore on exit |
| 110 | www canonical redirect | DONE | 301 www → apex with path + query; Pages domain removed |
| 111 | Phone toolbar + wall | DONE | Two-row toolbar at ≤560; 150px min rows with scroll; no clipping at 320 |
| 112 | Paste bar + contrast + hero | DONE | 168px paste bar; muted text 4.8:1; solid `#8fb8ff` hero accent |
| 113 | Security hardening | DONE | Storage URL validation, self-frame block, 200KB cap, CSP blob removal, import hosts, postMessage source check |
| 114 | Home product film | DONE | 10 s, 1280×720, no audio, 1→9 morph, silent, lazy, reduced-motion fallback, 3.1 MB |
| 115 | Lowercase voice + brand | DONE | Nav/headings/buttons/labels lowercase; domain always `multiview.cc`; Home reworded; OG + film re-rendered lowercase |
| 116 | Devices, help & readability | DONE | `/help` with device setup + 17 FAQs; Home device chips; larger body copy; “$5 one time fee”; help in SW offline shell |
| 117 | Short titles + own-your-app pricing | DONE | Titles `multiview` / `multiview tv`; 3 pricing cards; hosted $5 after beta; app yours; legal/beta license/help updated |
| 118 | Tuners, Plex & native apps | DONE | Sources “tuners & plex” card; help section for HDHomeRun/Tablo/Plex via M3U+XMLTV; native apps clearly separate |
| 119 | Cursor 3D + TV default | DONE | Cursor tilt/pan replaces gloss sweep; bigger hero; TV browsers auto-enter TV mode, `?home` escape |
| 120 | Hero film + no-restart audio + auto-heal | DONE | 7 s 1→2→4 film beside hero; stable mute URL + postMessage; any failed feed swaps; lazy iframes/posters; 58/0/1 client |
| 121 | Public GitHub slot | DONE | `/help` footer + “where is the source code?” FAQ; replace span with the real repo URL when published |
| 122 | Quieter Home | DONE | Removed feature/compare/TV/share/recent/sources; 8 sections; 3+all sports, 4 presets; centred login; 22px headings; footer |
| 123 | Four-stream cap | DONE | MAX_TILES 4; layouts 1/2/4 only; demo, presets, import, keys, help, FAQ aligned |
| 124 | Clean URLs | DONE | `?tv`, `?home`, `#tv` read then rewritten to `/` or `/tv`; no query or hash |
| 125 | Faster Home | DONE | Film starts after 1.6 s; poster 129 KB preloaded; 5 requests / 129 KB; 2 stills per preset |
| 126 | TV options by default | DONE | Arrows/Enter/1–4 on the wall without TV mode; ring clears on pointerdown; CrKey/Tizen/webOS/HbbTV/Fire TV UA and hover-free detection at ≥700 px |
| 127 | No black bars | DONE | YouTube/Vimeo cover scale capped 1.6×; media `object-fit: cover`; TV gap 0; still kept until playback |
| 128 | Captions higher | DONE | 3% upward lift + 1.07× minimum cover on YouTube/Vimeo tiles |
| 129 | Hacker wall | DONE | HN/HackerTube preset (6502, UNIX, Guy Steele, Y Not) as a fifth ready-made card |
| 130 | Presets library | DONE | Live now, Tech, Science, Late night added; 13-wall dialog from Home |
| 131 | Random variety | DONE | Category-balanced 4-up, last-set avoidance, Discover + sports + preset links |
| 132 | Funny 2-up | DONE | Funny preset (FG 160m + American Dad 4.5h); 2-up demo uses it; random 2-4 forces one funny tile |
| 133 | Captions uncropped | DONE | Tall tiles use contain + blurred still; cover keeps 3% lift; 2-up iframe fully inside |
| 134 | No founder ID | DONE | Removed `MV-…` from Home and plan dialog; internal flag stays local |
| 135 | Robust download | DONE | start.py free-port server, Windows fallback, tv download marker, no missing poster, timestamped zip links, live zip freshness check |
| 136 | Explicit login copy | DONE | “put a streaming service in your wall” + paste prompt + own-login explanation on Home and Help |
| 137 | Real broadcast frames | DONE | Hero film/poster, sport cards, preset cards and OG use real YouTube frames; no stock/AI art |
| 138 | Live preview refresh | DONE | Sport cards re-request a new frame every 5 minutes while Home is open |
| 139 | Status + health | DONE | /status, health.json, 56-feed check, six-hour GitHub Action template |
| 140 | Image bandwidth | DONE | Sport cards use 320w/1280w srcset; presets lazy |
| 141 | Hero cursor motion | DONE | 2x tilt, frame shift, opposite glow; removed film meta row |
| 142 | Uptime chip | DONE | Top + footer health chip, green = uptime; plan dot blue |
| 143 | Download tracking note | DONE | Cloudflare HTTP analytics path; KV/Function path documented |
| 144 | Toons wall | DONE | 30-clip adult-animation pool; 4 random per open |
| 145 | Funny reshuffle | DONE | 11 Family Guy/American Dad clips; 2 random per open |
| 146 | 1080p request | DONE | `vq=hd1080` on every YouTube embed |
| 147 | Weekly health | DONE | Monday cron, links + thumbs, health age on cards |
| 148 | Pages Functions | DONE | /api/live, /api/frame, /api/error; client fallback |
| 149 | Meme walls off Home | DONE | Funny/Toons only in dialog, unofficial badge + warning |
| 150 | Fullscreen PWA | DONE | manifest, display fullscreen, More → fullscreen |
| 151 | CI + deploy + errors | DONE | ci.yml, deploy.yml, wrangler, client beacon |
| 152 | SEO guides | DONE | football, news, iptv, plex, living-room, mac + ?preset |
| 153 | Share on Threads | DONE | Share dialog: Threads intent, copy link, native share |
| 154 | Functions live | DONE | Wrangler deployed _worker.js; /api/live, /api/frame, /api/error verified |
| 155 | Local git | DONE | main, commit 2fa2557; GitHub remote next |
| 156 | Pro naming | DONE | Pro replaces hosted site across Home, plan, Help, Legal; $5 one-time tier |
| 157 | Subtle forward tilt | DONE | 3.6° max, 6px drift, 0.14 follow; leans toward cursor |
| 158 | Preset library button | DONE | Home grid replaced by one ready-made walls strip + browse; library in dialog |
| 159 | Public GitHub + Actions | DONE | Repo public, secrets set, deploy/CI green, source links live |
| 160 | Walls CTA cache fix | DONE | styles v70; unstyled CTA fixed |

