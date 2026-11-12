#!/bin/sh
# Start the optional sync backend. The static app works without it.
cd "$(dirname "$0")/.." || exit 1
echo "multiview sync backend → http://127.0.0.1:8787  (Ctrl+C to stop)"
exec python3 server/app.py
