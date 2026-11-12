#!/bin/sh
# Double-click to produce the deployable folder in dist/.
cd "$(dirname "$0")" || exit 1
exec python3 build.py "$@"
