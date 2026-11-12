# Deploying multiview.cc

## Live now

**Cloudflare Pages** · project **`multiview-cc`** · live build `15b6f4d2fc` (deployed 2026-11-12)
(Home is the default landing).

- **https://multiview.cc** — canonical, HTTPS 200, HSTS, CSP and cache headers.
- **Home product film** — `media/multiview-demo.mp4` (1.9 MB, 7 s, no audio) and
  `media/multiview-demo-poster.jpg` (184 KB), both `max-age=31536000, immutable`.
  `preload="none"`, a 1.6 s delay and an IntersectionObserver keep it off the first paint.
- **https://multiview.cc/tv** — TV mode as a real page (`tv.html`), no redirect; the URL
  stays `/tv`. `/?tv=1` and `#tv` still work.
- **https://www.multiview.cc** — 301 to `https://multiview.cc`, path and query preserved
  (Cloudflare Redirect Rule; the `www` CNAME stays proxied for it).
- **https://multiview-cc.pages.dev** — preview host.
- Direct upload (no Git build). `_headers` is applied: CSP, HSTS, cache rules.
- DNS: Porkbun delegates `multiview.cc` to `heather.ns.cloudflare.com` and
  `mark.ns.cloudflare.com`; the zone is active and Universal SSL is issued.
- Canonical/OG/sitemap point at `https://multiview.cc`.
- Verify after pointing DNS:
  `python3 tools/deploy-check.py --url https://your-domain`


The app is a **static site** with a tiny Python build step that assembles the files worth
publishing. No Node, no dependencies.

```sh
python3 build.py        # or double-click build.command
```

That writes **`dist/`** — 18 entries, about 1.5 MB including the lazily-loaded hls.js and
the 485 KB `multiview-beta.zip` download. A `security.txt` sits under `.well-known/`.
Deploy **`dist/`**, not the repository root. The build deliberately excludes `server/`,
`tests/` and internal docs, and stamps every text asset with a copyright/build banner.

The build also copies `multiview-beta.zip` to the project root so the download works
during local preview. `server/` is optional and deploys separately (see the end of this file). Without it the
app still works fully; only accounts, cloud boards, share links and billing are inactive.

---

## Before you publish

1. **Bump the asset versions** in `index.html` after changing `styles.css`, `app.js`,
   `dashboard.js` or `sources.js`:

   ```html
   <link rel="stylesheet" href="styles.css?v=58">
   <script src="sources.js?v=3"></script>
   <script src="dashboard.js?v=75"></script>
   <script src="app.js?v=87"></script>
   ```

   The files are cached for a day; the query string is what makes a new build reach
   people immediately.

2. **Set the canonical and social URLs** if the domain differs from `multiview.cc`:
   `index.html` has `rel="canonical"`, `og:url`, `og:image` and `twitter:image`, plus
   `robots.txt` and `sitemap.xml`.

3. **Read `SECURITY.md`** for the threat model, pen-test results and residual risks.
4. **Run the checks:**

   ```sh
   python3 tests/mock-jellyfin.py 8123 &     # protocol stub for two checks
   python3 -m http.server 5455               # from this folder
   open http://localhost:5455/tests/regression.html
   python3 server/test_server.py             # 18/18
   python3 server/test_security.py           # 20/20
   ```

   Expect **56–57 PASS / 0 FAIL / 1–2 BLOCKED** (58 checks) with the stub running (HLS decode and reduced
   motion). A headless build that decodes HLS reaches 58/1. Without the Jellyfin stub, the
   two Jellyfin checks cannot run.

5. **Build the bundle and verify it:**

   ```sh
   python3 build.py
   python3 tools/deploy-check.py
   ```

   Expect **64/64** bundle checks. Then deploy `dist/`.

6. **After the DNS is live, probe it:**

   ```sh
   python3 tools/deploy-check.py --url https://multiview.cc
   ```

   This also checks the live security headers and that `/server/` and `/tests/` are 404.

---

## Copies and clones

No website can stop someone saving its HTML, CSS and JS — the browser must download them
to render the page. What this project does instead:

- **`LICENSE` + `legal.html`** state that the interface and code are proprietary and may
  not be copied, mirrored or reused.
- **`dist/` ships only runtime files.** The API source, tests and internal notes are not
  published, so a copy gains no backend, no schema and no secrets.
- **Every text asset carries a build id** (`BUILD.txt` has the same id), which makes an
  unauthorised copy traceable to a deployment.
- **Paid value lives server-side.** Accounts, syncing, trials and billing are not in the
  client, so copying the page cannot reproduce them.
- **Prefer drag-and-drop or a private repository.** A public GitHub repository exposes the
  source directly, whatever the site does. `dist/` in a private repo, or a
  `gh-pages` branch containing only `dist/`, is the safer setup.
- **Domain and brand are the real moat.** Keep the domain, the name and the audience.

Obfuscation and right-click blockers do not prevent copying; they only make the site
worse to use. They are intentionally not used.

---

## Free hosting (works today)

`dist/` is a complete static site — no server, no database, no build step on the host.
It is about **1.5 MB**, well inside every free tier. Upload `multiview-site.zip` (created
by `build.py`) or the **contents of `dist/`** — whichever the host accepts.

| Host | How | Free tier | Headers |
| --- | --- | --- | --- |
| **Cloudflare Pages** (best) | Workers & Pages → Create → Pages → **Upload assets** → drop `dist/` | Unlimited requests, free SSL, custom domain | `_headers` applied (CSP, HSTS, cache) |
| **Netlify Drop** | <https://app.netlify.com/drop> → drop `dist/` | 100 GB bandwidth/month | `_headers` applied |
| **Vercel Hobby** | `cd dist && vercel --prod` (or import a repo) | 100 GB bandwidth/month | `vercel.json` applied |
| **GitHub Pages** | Publish only `dist/` to a `gh-pages` branch | 1 GB site, 100 GB/month soft | **No custom headers** — put Cloudflare in front if you need CSP/HSTS |
| **Neocities / Codeberg Pages** | Upload the `dist/` files | Small free static hosting | No custom headers |

Notes:

- Use **direct upload** (Cloudflare/Netlify/Vercel) rather than a Git build: the build
  command is `python3 build.py`, which not every free host provides. Build locally first.
- The optional `server/` folder and `tests/` are **not** in `dist/`; free static hosting
  cannot run accounts/billing, and the app does not need them.
- Custom domains and SSL are free on Cloudflare Pages and Netlify. Point the domain at the
  host, then run `python3 tools/deploy-check.py --url https://your-domain` to verify the
  live headers and 404s.
- The app embeds YouTube/Twitch; those sites must allow framing and the viewer needs
  internet. No bandwidth for streams is served by your host.

## Which host?

**Recommended: Cloudflare Pages** — free, global edge, honours `_headers` (CSP, HSTS,
cache rules) and has no build step. Netlify's drag-and-drop is the fastest first deploy and
also honours `_headers`. Vercel works via `vercel.json`. GitHub Pages works but cannot set
headers, so put Cloudflare in front if you use it.

## Option A — Netlify (drag and drop)

1. Run `python3 build.py`.
2. Go to <https://app.netlify.com/drop> and drop **`dist/`**.
3. Done. `_headers` sets caching and security headers.
4. Add the domain under **Domain settings → Add custom domain**, then point DNS at Netlify.

Repository deploys can use the included `netlify.toml` (`command = "python3 build.py"`,
`publish = "dist"`).

## Option B — Cloudflare Pages

1. Run `python3 build.py`.
2. **Workers & Pages → Create → Pages → Upload assets**, upload the contents of `dist/`.
3. `_headers` is honoured automatically. Set the production domain to `multiview.cc`.
4. Cloudflare caches at the edge; the `?v=` query strings still force the new files.

## Option C — Vercel

1. Run `python3 build.py`.
2. `cd dist && vercel --prod` (or import a private repo containing `dist/`).
3. Framework preset: **Other**. Build command: none. Output directory: `.`
4. `vercel.json` supplies the headers and cache rules.

## Option D — GitHub Pages

1. Run `python3 build.py`.
2. Publish **only `dist/`** to a `gh-pages` branch (or a separate deploy repository).
3. **Settings → Pages → Deploy from a branch**, select that branch and `/ (root)`.
4. `.nojekyll` is included so `_headers` and other underscore files are copied as-is.
5. GitHub Pages **cannot set custom headers**: caching and security headers are not
   applied, but the app works. Use Cloudflare in front if you want them.
6. **Do not publish the repository root on a public repo** — that exposes the backend
   source and test harness.

## Option E — any static host / your own box

Serve `dist/` with any web server. For a quick local check:

```sh
python3 -m http.server 5455
```

For production, add:

- `Cache-Control: no-cache` for `/` and `/index.html`
- `Cache-Control: public, max-age=86400` for `*.js`, `*.css`
- `Cache-Control: public, max-age=604800` for `*.png`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security: max-age=31536000` (HTTPS only)

---

## What the host must allow

- **HTTPS.** Twitch, YouTube and most players refuse insecure origins.
- **Framing other sites.** The app creates `<iframe>`s; no `Content-Security-Policy` is
  set by us, but if you add one it must include `frame-src https:`. A CSP that blocks
  frames will blank every tile.
- **No server rewrites.** Boards live in the `#b=` fragment, so any path can 404 normally.

### Content-Security-Policy

The build ships a CSP in both `<meta>` (for hosts that cannot set headers, including GitHub
Pages) and `_headers` / `vercel.json`:

```
script-src 'self'; style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https: http:;
media-src 'self' data: blob: https: http:;
connect-src 'self' blob: data: https: http:;
frame-src 'self' about: blob: https: http:;
worker-src 'self' blob:; object-src 'none'; base-uri 'none'; form-action 'self'
```

`script-src` is strict — there is no inline script, no `eval` and no third-party script.
The permissive directives are deliberate: the product frames arbitrary user-supplied sites
and fetches arbitrary IPTV/Jellyfin endpoints, so `frame-src`, `connect-src`, `img-src` and
`media-src` must cover http(s).

If you add a script from another origin, a font, or a worker, extend the matching
directive in **both** the meta tag and `_headers`; the intersection of both policies is
enforced. A CSP that omits `frame-src` will blank every tile — test playback after editing.

## Verification after deploy

1. Open the site, press **Load demo** on Home — four tiles should start.
2. Paste a YouTube link and a direct `.m3u8` link; both should play.
3. Open the **Window wall** from the toolbar; the browser may ask to allow pop-ups.
4. DevTools → Network: `index.html` should be `no-cache`, `app.js?v=87` cached.
5. `curl https://your-host/server/app.py` and `/tests/regression.html` must return 404.
5. Application → Manifest: no install errors. Service worker registers and caches only
   the shell — streams and third-party frames are never cached.

---

## Optional backend (`server/`)

The backend is plain Python 3.9+ (standard library only) with a SQLite file.

```sh
MV_HOST=0.0.0.0 MV_PORT=8787 \
MV_ORIGINS=https://multiview.cc \
MV_PUBLIC_URL=https://multiview.cc \
MV_TRUST_PROXY=1 \
MV_DB=/var/lib/multiview/multiview.db \
python3 server/app.py
```

Put it behind Caddy/nginx with TLS. Required environment for billing:

| Variable | Purpose |
| --- | --- |
| `STRIPE_SECRET_KEY` | enables checkout |
| `STRIPE_PRICE_ID` | the one-time Pro price |
| `STRIPE_WEBHOOK_SECRET` | verifies webhook signatures |
| `MV_PUBLIC_URL` | share links and Stripe redirects |
| `MV_ORIGINS` | comma-separated CORS allowlist |
| `MV_TRIAL_DAYS` | trial length, default `7` |
| `MV_IP_SECRET` | HMAC key for hashed visitor IPs (set it, or it is generated into the DB) |
| `MV_TRUST_PROXY` | `1` only when the proxy overwrites `X-Forwarded-For` |

Stripe webhook endpoint: `POST https://your-api.example/api/billing/webhook`, event
`checkout.session.completed`.

Back up the SQLite file; it holds accounts, boards and trial hashes. Run the backend
tests with `python3 server/test_server.py` (expect **17/17**).

Wire the client by including `sync.js` and configuring it before `app.js`:

```html
<script>window.MVSync && MVSync.configure({ base: 'https://your-api.example' });</script>
```

It is inert until configured, which is why the static deploy works without it.


## Uptime + feed health

`tools/health-check.py` checks every curated YouTube link and writes `health.json`.
`.github/workflows/uptime.yml` runs it every six hours, probes `/`, `/tv`, `/help`,
`/status`, `BUILD.txt` and `health.json`, then commits the new health file. The
`/status` page reads it. This needs the project on GitHub — direct upload to Pages
does not run Actions.


## Tracking downloads (private)

Cloudflare already counts requests to the zip. Open **Analytics & Logs → HTTP
Traffic** (or Cache Analytics), filter the path `/multiview-beta.zip`, and read
requests, bytes and cache status. The timestamped `?t=` download links keep the
same path, so they still show up. This is aggregate, not per-person.

If you need exact click counts, add a tiny Pages Function (`/download`) that
increments a KV counter and redirects to the zip. That needs Cloudflare KV and a
Wrangler/GitHub deploy; it is not part of the static build.


## Wrangler deploy (works now)

```sh
python3 build.py
npx wrangler pages deploy dist --project-name multiview-cc --branch main
```

Wrangler compiles `_worker.js` as a Pages Advanced Mode function. The Cloudflare
API direct upload treats it as a static file, so use Wrangler for `/api/*`.
