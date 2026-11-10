#!/usr/bin/env python3
"""
Aviday (@aviday_666_) — Custom Topic Faceless Reel AI Generator & Publisher
Works both locally (with Kokoro TTS + Faster-Whisper word timing) AND in GitHub Actions Cloud Runner!
1. Polls https://aviday-agent.shafiur-aviday-57a61e.workers.dev/reels/claim (or takes CLI args --style --topic).
2. Uses the 7-Key Gemini Router to write a custom script.json + viral Instagram caption + hashtags.
3. Runs Kokoro voice.py + Faster-Whisper words.py (with edge-tts + estimate.py fallback in lightweight cloud),
   mixes procedural SFX + music via tools/mix.py, renders 1080x1920 MP4 via Headless Chrome,
   uploads to Litterbox, and publishes to @aviday_666_!
"""
import argparse
import asyncio
import json
import os
import re
import shutil
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

from synth_and_render import (
    PROJECTS_DIR,
    SKILL_DIR,
    WORKER_URL,
    apply_cognitive_anticipation_lead,
    extract_and_upload_cover,
    synthesize_narration,
    upload_to_litterbox,
)
from youtube_shorts_uploader import upload_youtube_short

def call_gemini_json(prompt: str) -> dict:
    # Route through the Cloudflare Worker's 7-Key Gemini Router so no API keys are exposed in public GitHub repos!
    req = urllib.request.Request(
        f"{WORKER_URL}/reels/generate-script",
        data=json.dumps({"prompt": prompt}).encode("utf-8"),
        headers={"Content-Type": "application/json", "User-Agent": "Aviday-Cloud-Renderer/1.0"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    if data.get("ok") and isinstance(data.get("result"), dict):
        return data["result"]
    raise RuntimeError(f"Worker /reels/generate-script failed: {data}")


async def generate_and_publish_custom_topic(
    style: str, topic: str, custom_caption: str = "", job_id: str = "", add_to_pool_only: bool = False
):
    style = style if style in ("deep-dive", "night-file", "stick-story", "tall-tale") else "deep-dive"
    slug = f"aviday-custom-{style}-{int(time.time())}"
    proj_dir = PROJECTS_DIR / slug
    if proj_dir.exists():
        shutil.rmtree(proj_dir)
    PROJECTS_DIR.mkdir(parents=True, exist_ok=True)
    shutil.copytree(SKILL_DIR / "styles" / style / "example", proj_dir)
    (proj_dir / "renders").mkdir(exist_ok=True)
    (proj_dir / "review").mkdir(exist_ok=True)

    orig_script = json.loads((proj_dir / "script.json").read_text())
    num_lines = len(orig_script["lines"])

    prompt = f"""You are a viral Faceless Shorts / Instagram Reels & YouTube Shorts scriptwriter writing for style "{style}".
Topic requested: "{topic}"

Write a punchy, high-retention narration split into EXACTLY {num_lines} lines (matching the {num_lines}-shot structure of this template: {json.dumps(orig_script['lines'])}).

ENFORCE THE 8-BEAT VIRAL RETENTION FORMULA across the {num_lines} lines:
1. The Hook: A singular, absurd or shocking factual statement that arrests scrolling in the first 2 seconds.
2. The Setting: Establish the concrete context, year, or place to ground the absurdity.
3. The Escalation: Rapid beats of increasing tension, stakes, or physical progression.
4. The Snap: The physical breaking point or climax of the story.
5. Deadpan Double Line: A brief deadpan contrast break ("Luckily... / Unluckily...") to reset tension.
6. The Explanation: Shift to educational insight using a universally understood everyday analogy.
7. The Consequence: The permanent rule, biological law, or takeaway created by the event.
8. Callback Twist: A concluding line that loops seamlessly back into Beat 1 (The Hook) to trigger automatic re-watches.

STRICT WRITING RULES:
- Keep each line SHORT and punchy: strictly 5 to 9 words per line so the total video is a fast-paced 38 to 48 seconds!
- NEVER verbally describe what is already visually obvious on screen (prevent cognitive redundancy).
- Write numbers as spoken words ("three", "seventy-four").
- For "caps", split the line into 1-3 word chunks separated by " | ", with ONE word per chunk prefixed by "*" for emphasis (e.g. "What *happens | if you *never | *sleep?").
- Also write a viral Instagram Reel / YouTube Short caption with a strong hook, credit to @aviday_666_, and 12 relevant hashtags.
- Also write a short, ultra-clickable 2-line thumbnail hook ("thumb_line1" and "thumb_line2", 2-4 words each in ALL CAPS) and a short category badge ("thumb_badge").

Return strictly JSON:
{{
  "title": "Short Viral Title",
  "thumb_badge": "🔴 WHAT HAPPENS IF...",
  "thumb_line1": "YOU NEVER",
  "thumb_line2": "SLEEP AGAIN?!",
  "caption": "Full Instagram Reel caption with 12 hashtags",
  "lines": [
    {{"text": "...", "caps": "..."}},
    ... (EXACTLY {num_lines} items)
  ]
}}"""

    gen = call_gemini_json(prompt)
    if isinstance(gen.get("lines"), list) and len(gen["lines"]) == num_lines:
        orig_script["title"] = gen.get("title", topic)
        orig_script["lines"] = gen["lines"]
        (proj_dir / "script.json").write_text(json.dumps(orig_script, indent=2))

    # Prefer official Kokoro TTS + Faster-Whisper word timing when available, else fallback to estimate.py + edge-tts
    kokoro_model = Path.home() / ".faceless-shorts" / "kokoro" / "kokoro-v1.0.onnx"
    if kokoro_model.exists():
        print("   🎙️ Generating narration with Kokoro TTS + Faster-Whisper word timing...", flush=True)
        subprocess.run([sys.executable, str(SKILL_DIR / "scripts" / "voice.py"), str(proj_dir)], check=True)
        subprocess.run([sys.executable, str(SKILL_DIR / "scripts" / "words.py"), str(proj_dir)], check=True)
    else:
        subprocess.run([sys.executable, str(SKILL_DIR / "scripts" / "estimate.py"), str(proj_dir)], check=True)
        await synthesize_narration(proj_dir, style)

    # Apply 0-3 frame (65ms) cognitive anticipation lead on word timestamps
    apply_cognitive_anticipation_lead(proj_dir, lead_sec=0.065)

    # Generate cues and mix audio
    subprocess.run(["node", "tools/capture.mjs", "cues"], cwd=str(proj_dir), check=True)
    subprocess.run([sys.executable, "tools/mix.py", "."], cwd=str(proj_dir), check=True)

    # Render vertical 1080x1920 MP4
    out_mp4 = proj_dir / "renders" / f"{slug}.mp4"
    env = os.environ.copy()
    env["FPS"] = "24"
    subprocess.run(["node", "tools/capture.mjs", "video", str(out_mp4)], cwd=str(proj_dir), env=env, check=True)

    cover_url, cover_jpg = extract_and_upload_cover(
        proj_dir,
        style=style,
        badge=gen.get("thumb_badge"),
        line1=gen.get("thumb_line1", "WAIT UNTIL YOU SEE"),
        line2=gen.get("thumb_line2", "WHAT HAPPENS?!"),
        offset_sec=3.2,
    )
    spec = {
        "style": style,
        "title": gen.get("title", topic),
        "caption": custom_caption or gen.get("caption") or f"{topic} ✨\n\nFollow @aviday_666_!\n\n#reels #fyp #viral",
    }
    yt_res = upload_youtube_short(
        out_mp4,
        title=spec["title"],
        description=spec["caption"],
        style=style,
        cover_jpg=cover_jpg,
    )
    youtube_url = yt_res.get("url") if yt_res.get("ok") else None
    video_url = upload_to_litterbox(out_mp4)
    payload = json.dumps(
        {
            "videoUrl": video_url,
            "coverUrl": cover_url,
            "youtubeUrl": youtube_url,
            "thumbOffsetMs": 2500,
            "caption": spec["caption"],
            "style": spec["style"],
            "title": spec["title"],
            "jobId": job_id,
            "addToPoolOnly": add_to_pool_only,
            "notifyAdmins": True,
        }
    ).encode("utf-8")
    req = urllib.request.Request(
        f"{WORKER_URL}/reels/publish",
        data=payload,
        headers={"Content-Type": "application/json", "User-Agent": "Aviday-Reel-Publisher/1.0"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        res_data = json.loads(resp.read().decode("utf-8"))
    print(f"🎉 Custom Topic Reel published: {json.dumps(res_data)}", flush=True)
    return res_data


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--style", default="deep-dive")
    ap.add_argument("--topic", required=True)
    ap.add_argument("--caption", default="")
    ap.add_argument("--job-id", default="")
    ap.add_argument("--pool", action="store_true")
    args = ap.parse_args()
    asyncio.run(generate_and_publish_custom_topic(args.style, args.topic, args.caption, args.job_id, args.pool))
