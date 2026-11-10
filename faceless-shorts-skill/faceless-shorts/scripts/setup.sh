#!/bin/bash
# One-time setup. Safe to re-run. Prints "All set" when everything works (~0.9 GB of downloads, all free).
#   checks Node.js 22+, ffmpeg, Chrome · builds the private Python env in ~/.faceless-shorts/venv
#   (numpy, scipy, kokoro-onnx, faster-whisper) · downloads the Kokoro voice (~340 MB) and Whisper small.en (~0.5 GB)
set -u
ok=1; say() { printf '%-12s %s\n' "$1" "$2"; }
export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
SKILL="$(cd "$(dirname "$0")/.." && pwd)"; FH="${FACELESS_HOME:-$HOME/.faceless-shorts}"; VENV="$FH/venv"
NODE_V=$(node -v 2>/dev/null | sed 's/v//' | cut -d. -f1)
if [ -n "$NODE_V" ] && [ "$NODE_V" -ge 22 ]; then say node "ok ($(node -v))"; else say node "MISSING or too old: need Node.js 22+ (nodejs.org, or: brew install node)"; ok=0; fi
if command -v ffmpeg >/dev/null && command -v ffprobe >/dev/null; then say ffmpeg ok; else say ffmpeg "MISSING (brew install ffmpeg · winget install ffmpeg · sudo apt install ffmpeg)"; ok=0; fi
CH=""; for p in "${CHROME:-}" "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" "/Applications/Chromium.app/Contents/MacOS/Chromium" "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" /usr/bin/google-chrome /usr/bin/google-chrome-stable /usr/bin/chromium /usr/bin/chromium-browser /snap/bin/chromium "/c/Program Files/Google/Chrome/Application/chrome.exe"; do [ -n "$p" ] && [ -x "$p" ] && CH="$p" && break; done
if [ -n "$CH" ]; then say chrome ok; else say chrome "MISSING (install Google Chrome from google.com/chrome, or set CHROME=/path/to/chrome)"; ok=0; fi
PYBIN=""; for p in python3.12 python3.11 python3.10 python3 python "py -3"; do $p -c "import sys; assert sys.version_info >= (3, 10)" >/dev/null 2>&1 && PYBIN=$p && break; done   # Windows: python / py -3
mkdir -p "$FH"
if [ ! -x "$VENV/bin/python" ] && [ ! -x "$VENV/Scripts/python.exe" ]; then
  echo "building the Python env in $VENV (a few minutes)..."
  if command -v uv >/dev/null; then uv venv --python 3.11 "$VENV" >/dev/null 2>&1 || uv venv "$VENV" >/dev/null 2>&1
  elif [ -n "$PYBIN" ]; then $PYBIN -m venv "$VENV"; fi
fi
PY="$VENV/bin/python"; [ -x "$PY" ] || PY="$VENV/Scripts/python.exe"
CHECK="import numpy, scipy, kokoro_onnx, faster_whisper"
if [ -x "$PY" ]; then
  if ! "$PY" -c "$CHECK" 2>/dev/null; then
    if command -v uv >/dev/null; then uv pip install --python "$PY" -q numpy scipy kokoro-onnx faster-whisper >/dev/null 2>&1
    else "$PY" -m pip install -q --upgrade pip >/dev/null 2>&1; "$PY" -m pip install -q numpy scipy kokoro-onnx faster-whisper >/dev/null 2>&1; fi
  fi
  if "$PY" -c "$CHECK" 2>/dev/null; then say python-env "ok ($VENV)"; else say python-env "BROKEN: run  $PY -m pip install numpy scipy kokoro-onnx faster-whisper"; ok=0; fi
  if "$PY" "$SKILL/scripts/voice.py" --download >/dev/null 2>&1; then say voice "ok (Kokoro, $FH/kokoro)"; else say voice "model download FAILED (check the internet connection, re-run)"; ok=0; fi
  if "$PY" -c "from faster_whisper import WhisperModel; WhisperModel('small.en', device='cpu', compute_type='int8')" >/dev/null 2>&1; then say whisper "ok (small.en)"; else say whisper "model download FAILED (re-run setup.sh)"; ok=0; fi
else say python-env "MISSING: install Python 3.10+ (python.org) or uv (docs.astral.sh/uv)"; ok=0; fi
chmod +x "$SKILL"/scripts/*.sh "$SKILL"/scripts/py 2>/dev/null
[ $ok = 1 ] && echo "All set" || { echo "Fix the MISSING items above, then run setup.sh again."; exit 1; }
