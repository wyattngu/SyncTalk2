#!/usr/bin/env bash
# Thin wrapper that probes for a working Python 3.8+ and runs start.py.
# All real logic lives in start.py for cross-platform support.

set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

for py in python python3 py; do
  command -v "$py" >/dev/null 2>&1 || continue
  if "$py" -c 'import sys; sys.exit(0 if sys.version_info >= (3,8) else 1)' >/dev/null 2>&1; then
    exec "$py" "$DIR/start.py" "$@"
  fi
done

echo "ERROR: No working Python 3.8+ found." >&2
exit 1
