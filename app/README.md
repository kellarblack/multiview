# multiview app (React + TypeScript)

The React port of multiview.cc. Same design, same data, typed components instead of
one 4.5k-line script.

```
bun install
bun run dev      # http://localhost:4361
bun run build    # tsc -b + vite build -> dist/
bun run preview  # serve the build
```

## What is here

- `src/lib/espn.ts` — the board. Reads `/api/scores` (the existing Cloudflare Worker,
  which carries DraftKings lines) and falls back to ESPN's scoreboard.
- `src/lib/polymarket.ts` — the markets strip: favourite in the busiest season market
  per league, placeholders filtered out.
- `src/lib/embed.ts` — pasted link → frameable embed (YouTube video, playlist,
  channel `/live`, Twitch channel, or the raw URL).
- `src/lib/storage.ts` — boards in `localStorage` (`multiview.react.v1`), four tiles
  per board, layouts 1/2/4 only.
- `src/hooks/useBoards.ts` — board state, add/remove, layout.
- `src/hooks/usePolled.ts` — one fetch plus a visibility-aware interval.
- `src/components/*` — Home (hero, board, markets, slate, pricing), Wall, and the
  share / plan / ready-made-walls dialogs.
- `src/styles/global.css` — the design tokens and layout, ported from the plain CSS.

## Dev quirk

ESPN rejects a `localhost` origin, and Polymarket is fine but rate-limited. Both go
through the Vite proxy (`/api`, `/espn-api`) in dev; production calls the Worker and
the public APIs directly. `vite.config.ts` strips the `Origin` header for ESPN.

## Status

Home and the wall work end to end. Still to port: sources, discover, TV mode,
channels sidebar, board import/export, and the downloadable offline shell.
The plain build on `main` keeps deploying until this branch reaches parity.
