#!/usr/bin/env bash
# Thin wrapper that probes for a working Python 3.8+ and runs setup.py.
# All real logic lives in setup.py for cross-platform support.

set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

for py in python python3 py; do
  command -v "$py" >/dev/null 2>&1 || continue
  if "$py" -c 'import sys; sys.exit(0 if sys.version_info >= (3,8) else 1)' >/dev/null 2>&1; then
    exec "$py" "$DIR/setup.py" "$@"
  fi
done

echo "ERROR: No working Python 3.8+ found." >&2
echo "Install from https://www.python.org/ then re-run this script." >&2
echo "On Windows, also disable App execution aliases for python.exe/python3.exe in Settings." >&2
exit 1
