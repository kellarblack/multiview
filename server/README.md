# Sync backend (optional)

Accounts, cloud-synced boards, share links and a one-time purchase. **The static app
does not use any of this** — it stays local and free until you choose to wire it.

Python 3.9 + standard library only. No pip install, no framework, no external services
except Stripe (optional).

## Run it

```sh
python3 server/app.py
#   listening on http://127.0.0.1:8787
#   database    server/data/multiview.db
curl http://127.0.0.1:8787/api/health
```

or double-click `server/start.command`.

Copy `server/.env.example` to your process manager (or `.env` in whatever loads it).
Nothing is read automatically; the server only looks at real environment variables.

## Environment

| Variable | Default | Meaning |
| --- | --- | --- |
| `MV_HOST` | `127.0.0.1` | bind address |
| `MV_PORT` | `8787` | port |
| `MV_DB` | `server/data/multiview.db` | SQLite file |
| `MV_ORIGINS` | localhost:5455 / 4321 | comma-separated CORS allowlist |
| `MV_FREE_LIMIT` | `2` | boards a free account can sync |
| `MV_TRIAL_DAYS` | `7` | length of the one-per-IP free trial (0 disables) |
| `MV_SESSION_DAYS` | `30` | session expiry after this many days of inactivity |
| `MV_TRUST_PROXY` | `0` | set to `1` behind a reverse proxy so `X-Forwarded-For` is used |
| `MV_IP_SECRET` | generated | HMAC key used to hash visitor IPs |
| `MV_PUBLIC_URL` | `http://localhost:5455` | used for share links and Stripe redirects |
| `STRIPE_SECRET_KEY` | none | enables checkout; otherwise `503` |
| `STRIPE_PRICE_ID` | none | Stripe price for the one-time purchase |
| `STRIPE_WEBHOOK_SECRET` | none | webhook signature verification |
| `MV_VERBOSE` | unset | log requests to stderr (never bodies) |

## Endpoints

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/api/health` | – | `{ok, version, billing}` |
| POST | `/api/auth/register` | – | `{email, password}` → `{token, user}` |
| POST | `/api/auth/login` | – | → `{token, user}` |
| POST | `/api/auth/logout` | bearer | deletes the session |
| GET | `/api/me` | bearer | `{user}` including trial fields |
| GET | `/api/account` | bearer | `{user, entitled, trial:{days, endsAt, available}}` |
| GET | `/api/boards` | bearer | `{boards, limit}` |
| POST | `/api/boards` | bearer | validates and stores a board |
| PUT | `/api/boards/{id}` | bearer | replace name/layout/tiles |
| DELETE | `/api/boards/{id}` | bearer | also drops its share |
| POST | `/api/boards/{id}/share` | bearer | → `{slug, url}` |
| DELETE | `/api/boards/{id}/share` | bearer | revokes |
| GET | `/api/share/{slug}` | – | public board |
| POST | `/api/billing/checkout` | bearer | → `{url}` (Stripe Checkout) |
| POST | `/api/billing/webhook` | Stripe signature | upgrades the account |

Board payload — the same shape the app already exports:

```json
{ "name": "Saturday", "layout": "4",
  "tiles": [{ "url": "https://…", "muted": true, "cc": false, "force": false }] }
```

The server **re-validates everything**: http(s) only, ≤ 9 tiles, known layouts, name
length. It stores only `url/muted/cc/force` — never `embed`, `kind`, or ids — so a
stored board can't inject a player URL.

## Trials and access

- Every new account gets **`MV_TRIAL_DAYS` days** (default 7), starting at registration.
- **One trial per IP.** The visitor IP is HMAC-SHA256 hashed with a per-database secret
  (`MV_IP_SECRET`) and stored in `trials`; the raw IP is never written. A second account
  from the same IP gets **no trial** (`trial_ends_at = 0`).
- Board endpoints (`GET/POST/PUT/DELETE /api/boards`, share/unshare) return **402** once
  the trial ends and the account is not `pro`. Login, `/api/me`, `/api/account` and
  checkout stay open so an expired user can upgrade.
- A Stripe `checkout.session.completed` webhook sets `plan = 'pro'`, which bypasses trial
  checks permanently.
- Behind a proxy, set `MV_TRUST_PROXY=1` **only** if the proxy overwrites
  `X-Forwarded-For`; otherwise clients can spoof their IP.

**What this cannot do:** the static app is a local file. Once someone has the folder, no
server can revoke it. The paywall gates the *hosted* features (accounts, cloud boards,
share links) — not the HTML. IP checks are a speed bump, not a wall: shared connections,
VPNs and CGNAT will produce both false positives and false negatives. Add email
verification and Stripe identity before relying on it commercially.

## Security model

- Passwords: PBKDF2-HMAC-SHA256, 200 000 rounds, 16-byte per-user salt.
- Sessions: 32-byte random tokens; only the SHA-256 is stored, so a database leak does
  not leak live tokens. They expire after `MV_SESSION_DAYS` of inactivity.
  `Authorization: Bearer …`.
- Constant-time comparisons for passwords and webhook signatures.
- Parameterised SQLite everywhere; no string-built queries.
- Request bodies capped at 256 KB; JSON only; unknown routes 404 without internals.
- CORS is an allowlist and echoes only matching origins.
- Per-IP rate limits (12/min on auth, 120/min general); limited clients get `429` and
  `Retry-After`. Buckets key on the real client IP when `MV_TRUST_PROXY=1` and the header
  is a valid IP.
- Unknown-email logins run a dummy PBKDF2 verification, so the response time does not
  reveal whether an account exists. The error text is identical either way.
- Stripe webhooks: constant-time signature check with a 5-minute timestamp window,
  idempotent by event id, and Pro is only granted for `checkout.session.completed` with
  `payment_status = paid` in payment mode.
- The `Server` header advertises no build version.
- Errors never include tokens, URLs with credentials, or tracebacks.

**Not included:** email verification, password reset, 2FA, multi-node rate limiting,
audit export, MFA on billing. Add those before taking real money. Rate limits live in
process memory, so run one API process (or move them to Redis) before scaling out.
Serve it behind HTTPS (Caddy/nginx) and never expose port 8787 directly.

## Stripe (optional)

1. Create a **one-time** price in Stripe, copy its `price_…` id into `STRIPE_PRICE_ID`.
2. Set `STRIPE_SECRET_KEY`.
3. Add a webhook endpoint `https://your-host/api/billing/webhook` for
   `checkout.session.completed`, put its signing secret in `STRIPE_WEBHOOK_SECRET`.
4. Set `MV_PUBLIC_URL` to the public site so redirects and share links are correct.

Without the two keys, checkout returns `503` and the app stays free — by design.

## Wire the app later

`sync.js` at the project root is a ready client and is **not loaded** by `index.html`.

```html
<script src="sync.js"></script>
<script>
  MVSync.configure({ base: 'http://localhost:8787' });     // no token = signed out
  await MVSync.login('a@example.com', 'hunter2hunter2');   // token kept in memory
  const { boards } = await MVSync.boards();
  await MVSync.save({ name: 'Saturday', layout: '4', tiles: [...] });
</script>
```

Two decisions to make before shipping it: where the token lives (memory is safer,
`localStorage` survives reloads but is readable by any injected script), and whether
sync is opt-in per board. The local app keeps working either way.

## Database

The database is created automatically on first start. Schema changes live in
`server/migrations/*.sql` and are applied in filename order; each applied file is recorded
in `schema_migrations`, so deploying `002_*.sql` is enough for the next change. The first
file, `001_init.sql`, is the complete current shape.

- Default engine: **SQLite** (WAL, one writer). Perfect for a single API instance.
- Back up `MV_DB` (plus `-wal`/`-shm` while running). Treat it as sensitive: it holds
  password hashes, session hashes and trial IP hashes.
- For Postgres/MySQL later, `db()` in `app.py` is the only connection seam; translate
  `?` placeholders and SQLite types, and keep the column names. Nothing else in the app
  assumes SQLite.

## Tests

```sh
python3 server/test_server.py -v     # functionality: 18 tests
python3 server/test_security.py -v   # adversarial:   20 tests
```

Functional suite: health, registration, duplicate email, weak password, login paths,
`/me`, board CRUD, payload validation, free-tier limit, share round trip, ownership
isolation, checkout without keys, webhook signature + upgrade + idempotency, CORS
allowlist, unknown routes, trial start/expiry, one-trial-per-IP, Pro bypassing the trial,
and rate limiting.

Security suite: auth bypass, tampered tokens, session expiry and deletion, token/password
storage, login non-enumeration, SQL injection, XSS payload round-trip, CRLF header
injection, unsafe URL schemes and credentials, CORS allowlist, share enumeration and
read-only sharing, ownership isolation, oversized/malformed bodies, unknown routes,
version banner, rate-limit `Retry-After`, webhook forgery/replay, and refusing to upgrade
unpaid checkouts.

## Data model

```
schema_migrations(name, applied_at)
users(id, email, pw_salt, pw_hash, plan, stripe_customer, trial_ends_at, created_at)
trials(ip_hash, user_id, started_at, ends_at)
meta(key, value)                      # generated IP-HMAC secret
sessions(token_hash, user_id, created_at, last_seen)

boards(id, user_id, name, layout, tiles(JSON), created_at, updated_at)
shares(slug, board_id, user_id, created_at)
events(id, at, kind, user_id, meta)     -- Stripe event ids live here
```

SQLite in WAL mode, one connection per request. Back up `server/data/` (or move to
Postgres) before a real launch.
