#!/bin/bash
# Runs Python from the skill's private environment (~/.faceless-shorts/venv), or the system python3 before setup.
FH="${FACELESS_HOME:-$HOME/.faceless-shorts}"
for p in "$FH/venv/bin/python" "$FH/venv/Scripts/python.exe"; do [ -x "$p" ] && exec "$p" "$@"; done
command -v python3 >/dev/null && python3 -c "" 2>/dev/null && exec python3 "$@"
exec python "$@"   # Windows (Git Bash)
