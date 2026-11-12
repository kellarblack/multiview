# Security

Applies to the static wall at the repository root and the optional sync backend in
`server/`. **Accounts are not enabled in the shipped app:** `index.html` does not load
`sync.js`, no sign-in UI exists, and the backend is not started. The database layer is
ready to be switched on, not switched on.

## Can someone copy the site?

Yes — and no site can prevent it. A browser must download HTML, CSS and JS to render a
page, so View Source and Save Page always work. What this project does instead of
pretending otherwise:

- **Proprietary terms**: `LICENSE` and `legal.html` state that the interface, design and
  code may not be copied, mirrored, redistributed or reused. `index.html` carries
  `author` and `copyright` metadata.
- **A production-only bundle**: `python3 build.py` writes `dist/` containing just the
  runtime files. `server/` (API source, schema), `tests/` and internal docs are not
  published, so a copy gains no backend and no secrets.
- **Provenance**: every text asset and `BUILD.txt` carry a copyright line and a build id,
  which makes an unauthorised copy traceable to a deployment.
- **Paid value is server-side**: accounts, syncing, trials and billing are not in the
  client and are not enabled.
- **Deployment choice**: drag-and-drop `dist/` or use a private repository. A public
  GitHub repository exposes the source regardless of what the site does.
- **Domain and brand** are the practical moat. Register the name if this grows.

What is deliberately **not** used: right-click blockers, text-selection locks, script
obfuscation or fake "protection" overlays. They are trivially bypassed and make the site
worse for real users.

## Threat model

| Surface | Who can reach it | What matters |
| --- | --- | --- |
| Static app | Anyone with the files | No server trust boundary. It must not execute injected markup or leak a token. |
| Stream iframes | Third-party sites | Sandboxed, opener severed on pop-out, no parent-page access. |
| Sync API (off by default) | Network clients | Auth, tenant isolation, rate limits, Stripe webhook integrity. |
| SQLite database (off by default) | Server host only | Password/session hashes, trial IP hashes, board contents. |

## Accounts and database readiness

The database is **not set up or enabled**. What exists is the shape for turning it on:

- `server/migrations/001_init.sql` — complete schema (users, sessions, trials, boards,
  shares, events, meta, `schema_migrations`) with indices.
- `server/app.py` applies migrations in filename order and records each one; deploying
  `002_*.sql` is the whole upgrade process.
- `server/.env.example` — every environment variable, including `MV_SESSION_DAYS`,
  `MV_TRUST_PROXY`, `MV_IP_SECRET` and Stripe keys.
- `sync.js` — a client that is inert unless explicitly loaded and configured.
- `server/README.md` — run, backup, and swap-to-Postgres notes.

To enable later: deploy `server/`, set the environment, load `sync.js`, configure its
base URL, and add the sign-in UI that is intentionally not present. Until then the wall is
local-only and free.

## Pen-test results (2026-11-10)

Run with `python3 server/test_security.py -v` — **20/20 pass** against the real HTTP
server on a temporary database.

| # | Check | Result |
| --- | --- | --- |
| 1 | Board endpoints reject anonymous access | Pass — 401 |
| 2 | Tampered / malformed bearer tokens | Pass — 401 |
| 3 | Sessions expire and are deleted | Pass — expired on read, row removed |
| 4 | Passwords and tokens are not stored raw | Pass — PBKDF2 hash; SHA-256 token hash |
| 5 | Login does not reveal whether email or password failed | Pass — identical error, dummy PBKDF2 for unknown users |
| 6 | Bad emails / short or oversized passwords | Pass — 400/401, no 500 |
| 7 | SQL injection in board names | Pass — parameterised, table survives |
| 8 | Stored XSS payloads stay data | Pass — JSON only; client escapes |
| 9 | CRLF header injection in board names | Pass — control characters stripped |
| 10 | `javascript:`, `data:`, `file:`, credentialed and space-containing URLs | Pass — rejected |
| 11 | CORS only echoes allowlisted origins | Pass — plus `Vary: Origin` |
| 12 | Share links are unguessable, public, read-only | Pass — wrong slug 404, writes 404 |
| 13 | Tenant isolation (read/update/delete another user's board) | Pass — 404 |
| 14 | Oversized and malformed request bodies | Pass — 413 / 400 |
| 15 | Unknown routes and wrong methods | Pass — 404/405, no internals |
| 16 | Server version banner | Pass — `multiview`, no build number |
| 17 | Rate limiting, per IP, with `Retry-After` | Pass — 429 and a separate budget per IP |
| 18 | Webhook forgery, stale timestamp, malformed JSON | Pass — 400 |
| 19 | Webhook cannot upgrade an unpaid checkout; replay is idempotent | Pass |
| 20 | Negative / malformed `Content-Length` | Pass — 400, connection closed on 413 |

### Frontend checks

| Check | Result |
| --- | --- |
| Content-Security-Policy (meta + deploy headers) | `script-src 'self'`, no `unsafe-eval`; only `style-src` needs `unsafe-inline` |
| Inline event handlers | Removed; channel-logo fallback is an `addEventListener` capture handler |
| iframe sandbox | scripts and forms allowed for players; no `allow-popups`, `allow-top-navigation` or `allow-modals`, so a frame cannot open windows, navigate the wall, or raise parent dialogs |
| Pop-outs | `win.opener = null` immediately after `window.open` |
| External links | `rel="noopener noreferrer"` |
| Local storage | Try/catch on read and write; corrupt state falls back to a fresh board; every restored `url`/`embed`/media URL is re-validated through `normalizeLink()` / `safeUrl()` |
| Self-framing | `multiview.cc`, `multiview-cc.pages.dev` and the current host are rejected as tiles, so the app cannot recurse or inherit its own origin inside `allow-same-origin` + `allow-scripts` |
| Frame sources | `frame-src` allows `'self' about: https: http:` only — `blob:` was removed |
| Input caps | Board text 200 KB; individual URL 4 KB; nine tiles per board |
| YouTube messages | `infoDelivery` is accepted only when `event.source` is that tile's own iframe |
| Imported boards | URLs validated for http(s); nine-tile cap; duplicate-safe |
| Markup | Parses with no unclosed/mismatched tags or duplicate IDs |
| Deployment headers | `_headers` + `vercel.json`: CSP, HSTS (`includeSubDomains`), nosniff, `frame-ancestors 'self'`, `X-Permitted-Cross-Domain-Policies: none`, scoped permissions |
| Service worker | Same-origin GET only, exact shell paths, network-first; no third-party caching |
| `security.txt` | Published at `/.well-known/security.txt` with a 2027 expiry |
| Bundle check | `tools/deploy-check.py` — 62 checks, server/tests excluded, zip marked and executable |
| Lighthouse | Accessibility 100 · Best Practices 100 · SEO 100 |
| Console | Zero app errors on boot, dialogs, HLS playback and import; Cloudflare’s auto-injected Web Analytics beacon was deleted from the zone and remains blocked by `script-src 'self'` if it returns |
| Clickjacking | `frame-ancestors 'self'` + `X-Frame-Options: SAMEORIGIN` on Cloudflare/Vercel/Netlify. GitHub Pages ignores `_headers`, so do not host the production site there |

### Findings fixed during this pass

1. **Session expiry was missing** — sessions never died. Now `MV_SESSION_DAYS`
   (default 30, inactivity-based), expired rows are deleted, and `last_seen` writes are
   throttled to once a minute.
2. **Login timing oracle** — unknown emails skipped PBKDF2. A dummy verification now runs,
   and the error text is identical in both cases.
3. **Unpaid webhook upgrade** — any `checkout.session.completed` granted Pro. It now
   requires `payment_status = paid` in payment mode; malformed JSON returns 400, not 500.
4. **Rate limiting used the socket IP** — every user behind a proxy shared one bucket.
   It now uses the validated client IP, prunes its table, and returns `Retry-After`.
5. **Version banner** — `Server: multiview-sync/0.1.0` advertised the build; now `multiview`.
6. **Slow clients** — no socket timeout. Connections now drop after 30 seconds.
7. **CRLF and URL-scheme sloppiness** — board names strip control characters; URLs reject
   credentials, whitespace and non-http(s) schemes.
8. **Unvalidated `Content-Length`** — a negative value could hang a reader. It now returns
   400, and oversized bodies close the connection so an unread body cannot poison the next
   request.
9. **CORS caches** — `Vary: Origin` is now sent even when the origin is not allowed.
10. **Nested DB connection** — the IP-HMAC secret was created from inside an open
   transaction. It is read/created once at init and cached.
11. **Frontend crash** — synthetic paste events without `clipboardData` threw a TypeError.
12. **CSP blockers** — the one inline `onerror` handler was replaced; the page now runs
    with `script-src 'self'`.
13. **Registration/session races** — simultaneous sign-ups from one IP could both claim a
    trial (and a duplicate email could surface a 500). The trial insert is now
    `INSERT OR IGNORE` and an email race returns 409 without burning the IP's trial.
    Expired sessions are also pruned when a new session starts.

## Hardening pass (2026-11-11)

A second, read-only agent review plus manual browser tests covered URL ingress, iframe
sandboxing, import/storage, CSP, service-worker caching and the optional server.

- **Fixed:** storage-restored URLs skipped validation; self-framing was allowed; paste and
  `#b=` input were uncapped; `window.open`/postMessage trust was broader than needed;
  `blob:` was in `frame-src`; the phone toolbar clipped the More button; the paste bar
  cropped long pastes.
- **Verified rejected:** `javascript:`, `JAVASCRIPT:`, `java\tscript:`, `data:`, `vbscript:`,
  `blob:`, `file:`, `about:`, `//evil.com`, percent-encoded variants, homoglyphs,
  credentialed URLs and 5 KB URLs. Every user string that reaches `innerHTML` goes through
  `esc()`; no `eval`, `new Function`, `srcdoc` or inline handlers exist.
- **Residual:** YouTube pre-roll ads can look “short” to the long-form duration heuristic; a
  9-up wall is still nine decoders; cross-origin players are third-party code inside their
  own sandbox. No known exploitable client issue in the tested paths.

## Residual risks (accepted or out of scope)

- **The static app cannot be revoked.** Once someone has the folder, no server takes it
  back. The paywall can only gate hosted features.
- **IP-based trials are a speed bump.** VPNs defeat them; shared connections and CGNAT
  cause false positives. Add email verification and a payment identity before charging.
- **Third-party iframes are untrusted.** The sandbox prevents popups, top navigation and
  downloads; it cannot stop ads drawn inside a player. Use a content blocker.
- **In-process rate limits** reset on restart and are per instance. Move them to a shared
  store before running multiple API processes.
- **No MFA, password reset, email verification or audit export.**
- **A shared `MV_IP_SECRET` must be stable** across deploys, or trial hashes stop matching
  and users may get a second trial. Set it explicitly in production.
- **SQLite is single-node.** Fine for one API process; use a managed database before
  horizontal scaling.
- **No bug bounty / disclosure address is published yet.**

## Re-running the checks

```sh
python3 server/test_server.py -v     # functionality, 18 tests
python3 server/test_security.py -v   # adversarial, 20 tests
open http://localhost:5455/tests/regression.html   # client, 59 checks
```

Deployment headers (CSP, HSTS, nosniff, referrer policy) are in `_headers` and
`vercel.json`; see `DEPLOY.md`. Run `python3 tools/deploy-check.py --url https://…`
after publishing to confirm the live host applies them.
