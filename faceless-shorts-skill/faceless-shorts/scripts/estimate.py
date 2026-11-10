"""Estimated timing with NO voice: script.json -> data/lines.json + data/words.json.

  scripts/py scripts/estimate.py <project> [--wps 2.8]

Use it for a captions-only video (the user records the voiceover later, to the captions), or to preview a cut
before the real voice exists. Each word gets a length from its letters; commas and mid-line full stops add pauses.
When the real narration is ready, voice.py + words.py overwrite both files and everything re-times itself.
Only the Python standard library is needed.
"""
import argparse, json, re
from pathlib import Path

ap = argparse.ArgumentParser()
ap.add_argument('project')
ap.add_argument('--wps', type=float, default=2.8, help='speaking rate in words per second (Kokoro am_michael at 1.05 is ~2.8)')
a = ap.parse_args()
P = Path(a.project)
S = json.loads((P / 'script.json').read_text())
speed = S.get('speed', 1.0)
t = float(S.get('lead', 0.4))
lines, words = [], []
for i, ln in enumerate(S['lines']):
    toks = ln['text'].split()
    letters = [len(re.sub(r'[^A-Za-z0-9]', '', w)) or 1 for w in toks]
    base = len(toks) / (a.wps * speed)                                   # seconds of pure speech for this line
    unit = base / sum(l + 2.5 for l in letters)
    start = t
    for w, l in zip(toks, letters):
        d = (l + 2.5) * unit
        words.append({'w': w, 'line': i, 's': round(t, 3), 'e': round(t + d * 0.92, 3)})
        t += d
        if w.endswith(','): t += 0.16
        elif re.search(r'[.?!]$', w) and w is not toks[-1]: t += 0.32
    lines.append({'i': i, 'text': ln['text'], 'start': round(start, 3), 'end': round(t, 3)})
    t += float(ln.get('gap', S.get('gap', 0.32)))
dur = lines[-1]['end'] + float(S.get('outro', 0.9))
(P / 'data').mkdir(exist_ok=True)
(P / 'data/lines.json').write_text(json.dumps({'duration': round(dur, 3), 'estimated': True, 'lines': lines}, indent=1))
(P / 'data/words.json').write_text(json.dumps(words, indent=1))
print(f'estimated timing: {len(lines)} lines, {len(words)} words, {dur:.2f} s → data/lines.json, data/words.json')
