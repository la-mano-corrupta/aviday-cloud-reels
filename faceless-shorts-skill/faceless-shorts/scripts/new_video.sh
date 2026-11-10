#!/bin/bash
# Start a new video from a style's working example (engine + shots + script), so it renders straight away.
#   bash new_video.sh <style> <short-name> [--dir <parent>]     → ~/faceless-shorts/<short-name>/
#   bash new_video.sh --list                                    the styles
set -eu
SKILL="$(cd "$(dirname "$0")/.." && pwd)"
if [ "${1:-}" = "--list" ]; then for d in "$SKILL"/styles/*/; do echo "$(basename "$d")"; done; exit 0; fi
USAGE="usage: new_video.sh <style> <short-name> [--dir <parent>]   (styles: $(ls "$SKILL/styles" | tr '\n' ' '))"
STYLE="${1:?$USAGE}"; NAME="${2:?$USAGE}"; shift 2
PARENT="$HOME/faceless-shorts"
while [ $# -gt 0 ]; do case "$1" in --dir) PARENT="${2:?}"; shift 2 ;; *) echo "unknown option $1" >&2; exit 2 ;; esac; done
SRC="$SKILL/styles/$STYLE/example"
[ -d "$SRC" ] || { echo "no style '$STYLE' ($USAGE)" >&2; exit 2; }
DST="$PARENT/$NAME"
[ -e "$DST" ] && { echo "$DST already exists: pick another name" >&2; exit 2; }
mkdir -p "$PARENT"; cp -R "$SRC" "$DST"; mkdir -p "$DST/renders" "$DST/review"
rm -f "$DST/data/narration.wav" "$DST/data/mix.wav"
echo "$DST"
echo "style: $STYLE. Read $SKILL/styles/$STYLE/STYLE.md, then rewrite script.json + src/shots.js"
