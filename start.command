#!/bin/sh
# Double-click in Finder to open multiview.cc in your browser.
# Serves on localhost so Twitch embeds (which need a real "parent" origin) work,
# and sends no-store so a reload always shows the current files.
cd "$(dirname "$0")" || exit 1

PORT=5455
LIMIT=5480

# Reuse our own running copy, otherwise take the first free port —
# never hijack a server that belongs to something else.
while lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; do
  if curl -s --max-time 1 "http://localhost:$PORT/" | grep -q "multiview.cc"; then
    echo "multiview.cc is already running at http://localhost:$PORT/"
    open "http://localhost:$PORT/"
    exit 0
  fi
  PORT=$((PORT + 1))
  if [ "$PORT" -gt "$LIMIT" ]; then
    echo "No free port between 5455 and $LIMIT." >&2
    exit 1
  fi
done

if [ "$PORT" != "5455" ]; then
  echo "Note: 5455 was busy, so this run uses $PORT." >&2
  echo "Boards are saved per address — if you had boards on another port, use Board → export/import to move them." >&2
fi

( sleep 0.8; open "http://localhost:$PORT/" ) &
echo "multiview.cc running at http://localhost:$PORT/  (Ctrl+C to stop)"

exec python3 - "$PORT" <<'PY'
import http.server
import sys


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, max-age=0")
        super().end_headers()

    def log_message(self, *args):
        pass


http.server.ThreadingHTTPServer(("127.0.0.1", int(sys.argv[1])), Handler).serve_forever()
PY
