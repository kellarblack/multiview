# GitHub setup

The site currently deploys by direct upload. That cannot run Pages Functions, cron
health checks, CI or rollback. Move it to GitHub when you want the full setup.

## One-time

1. Create a repository and push this folder to `main`.
2. Cloudflare → My Profile → API Tokens → create a token with **Cloudflare Pages: Edit**
   for the account. Copy it once.
3. GitHub → Settings → Secrets and variables → Actions:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID` (`b363b8d0fb128aff5ac3354318bd8b31`)
4. Push. `.github/workflows/deploy.yml` builds, runs `tools/deploy-check.py`, then
   `wrangler pages deploy dist --project-name multiview-cc --branch main`.

## What runs

- `ci.yml` — build, bundle checks, headless client regression on every push/PR.
- `deploy.yml` — the same checks, then Pages deploy, including `functions/`.
- `uptime.yml` — Mondays 09:17 UTC: probes `/`, `/tv`, `/help`, `/status`,
  `BUILD.txt`, `health.json`; checks every curated link and thumbnail; commits
  `health.json`. That commit triggers `deploy.yml`, so the status page updates.

## Functions

`_worker.js` is an Advanced Mode Pages Function. Direct upload and Wrangler both
include it from `dist/`; `/api/live`, `/api/frame` and `/api/error` work without a
separate Functions folder.

```sh
npx wrangler pages deployment tail --project-name multiview-cc
```

Client errors are logged there. No cookies, user IDs or query strings are sent.
