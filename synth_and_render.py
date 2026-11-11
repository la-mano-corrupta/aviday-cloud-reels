#!/usr/bin/env python3
"""
Synthesizes millisecond-accurate neural voiceover into data/narration.wav
matching data/lines.json (or generating new timings via estimate.py for custom topics),
runs tools/mix.py, renders the 1080x1920 MP4 via tools/capture.mjs,
uploads to Litterbox, and publishes to @aviday_666_ via Cloudflare Worker!
"""
import asyncio
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path
import numpy as np
from scipy.io import wavfile

SKILL_DIR = Path(__file__).resolve().parent / "faceless-shorts-skill" / "faceless-shorts"
PROJECTS_DIR = Path.home() / "faceless-shorts"
WORKER_URL = "https://aviday-agent.shafiur-aviday-57a61e.workers.dev"

os.environ["PATH"] = f"{Path.home() / '.local/bin'}:/opt/homebrew/bin:/usr/local/bin:" + os.environ.get("PATH", "")

VOICE_MAP = {
    "deep-dive": "en-US-AndrewNeural",
    "night-file": "en-US-ChristopherNeural",
    "stick-story": "en-US-GuyNeural",
    "tall-tale": "en-US-BrianNeural",
}

REEL_SPECS = [
    {
        "style": "stick-story",
        "slug": "aviday-stick-story",
        "title": "What Would You Do If The Power Went Out For 3 Days?",
        "thumb_badge": "⚠️ SURVIVAL TEST",
        "thumb_line1": "72 HOURS",
        "thumb_line2": "ZERO POWER?!",
        "caption": (
            "If the grid goes dark for 72 hours tonight, do NOT open your fridge first. ⚡🕯️ "
            "Here is the exact 4-step survival playbook that keeps you safe.\n\n"
            "Follow @aviday_666_ for daily survival guides & explainers ✨\n\n"
            "#survival #lifehacks #whatwouldyoudo #survivaltips #preparedness "
            "#stickstory #smarttips #emergencyprep #didyouknow #reels #fyp #viral"
        ),
    },
    {
        "style": "deep-dive",
        "slug": "aviday-deep-dive",
        "title": "What Happens If You Hold Your Breath Too Long?",
        "thumb_badge": "🔴 WHAT HAPPENS IF...",
        "thumb_line1": "YOU HOLD YOUR BREATH",
        "thumb_line2": "TOO LONG?!",
        "caption": (
            "What actually happens inside your body when you hold your breath to the limit? 🫁⚡ "
            "Wait until your brain hits the emergency switch...\n\n"
            "Follow @aviday_666_ for daily 3D science deep dives ✨\n\n"
            "#whatif #sciencefacts #humanbody #3danimation #deepdive #anatomy "
            "#didyouknow #biology #explainer #reels #viralreels #fyp"
        ),
    },
    {
        "style": "night-file",
        "slug": "aviday-night-file",
        "title": "The Man Who Jumped Out of a Plane and Vanished (Flight 305)",
        "thumb_badge": "🕵️‍♂️ UNSOLVED CASE FILE",
        "thumb_line1": "JUMPED AT 10,000 FT",
        "thumb_line2": "& VANISHED?!",
        "caption": (
            "Nov 24, 1971 — Flight 305. He parachuted into a freezing rainstorm at 10,000 feet "
            "with $200,000 in cash and was never seen again. 🕵️‍♂️✈️ Case File #305: UNSOLVED.\n\n"
            "Follow @aviday_666_ for nightly mystery files 📁\n\n"
            "#unsolvedmysteries #truecrime #dbcooper #mystery #nightfile #coldcase "
            "#creepyfacts #historymystery #darkhistory #reels #fyp #viral"
        ),
    },
    {
        "style": "tall-tale",
        "slug": "aviday-tall-tale",
        "title": "In 1914, Parents Legally Mailed Their Daughter to Grandma",
        "thumb_badge": "🤯 BIZARRE TRUE STORY",
        "thumb_line1": "THEY LEGALLY MAILED",
        "thumb_line2": "THEIR BABY?!",
        "caption": (
            "In 1914, stamps were cheaper than a train ticket... so May Pierstorff's parents "
            "checked the parcel post weight limit and mailed her 73 miles to Grandma's house. 📦🚂\n\n"
            "Follow @aviday_666_ for wild true stories every day ✨\n\n"
            "#truestory #weirdhistory #historyfacts #talltale #funfacts #storytime "
            "#1914 #didyouknow #animation #reels #fyp #viral"
        ),
    },
]


async def synthesize_narration(proj_dir: Path, style: str):
    import edge_tts

    lines_path = proj_dir / "data" / "lines.json"
    if not lines_path.exists():
        subprocess.run([sys.executable, str(SKILL_DIR / "scripts" / "estimate.py"), str(proj_dir)], check=True)

    lines_data = json.loads(lines_path.read_text())
    dur = float(lines_data["duration"])
    sr = 24000
    full_audio = np.zeros(int(dur * sr) + sr, dtype=np.float64)
    voice = VOICE_MAP.get(style, "en-US-AndrewNeural")

    with tempfile.TemporaryDirectory() as tmpdir:
        tmpdir_p = Path(tmpdir)
        for item in lines_data["lines"]:
            idx = item["i"]
            text = item["text"]
            start_s = float(item["start"])
            end_s = float(item["end"])
            target_dur = max(0.4, end_s - start_s)

            mp3_path = tmpdir_p / f"line_{idx}.mp3"
            clean_text = text.replace("*", "").strip() or "..."
            fallback_voices = [voice, "en-US-ChristopherNeural", "en-US-GuyNeural", "en-US-BrianNeural"]
            synthesized = False
            for attempt, v_try in enumerate(fallback_voices):
                try:
                    rate_arg = "+5%" if attempt == 0 else "+0%"
                    comm = edge_tts.Communicate(clean_text, v_try, rate=rate_arg)
                    await comm.save(str(mp3_path))
                    if mp3_path.exists() and mp3_path.stat().st_size > 200:
                        synthesized = True
                        break
                except Exception as e_tts:
                    print(f"   ⚠️ edge-tts attempt {attempt+1} failed for line {idx} ({v_try}): {e_tts}", flush=True)
                    await asyncio.sleep(0.8 * (attempt + 1))

            if not synthesized:
                import urllib.parse
                q = urllib.parse.quote(clean_text[:200])
                gtts_url = f"https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q={q}"
                req_tts = urllib.request.Request(gtts_url, headers={"User-Agent": "Mozilla/5.0"})
                mp3_path.write_bytes(urllib.request.urlopen(req_tts, timeout=20).read())

            # Decode mp3 to 24kHz mono float32 via ffmpeg
            raw = subprocess.run(
                ["ffmpeg", "-v", "error", "-i", str(mp3_path), "-af", "silenceremove=start_periods=1:start_silence=0.02:start_threshold=-45dB", "-f", "f32le", "-ac", "1", "-ar", str(sr), "-"],
                capture_output=True,
                check=True,
            ).stdout
            samples = np.frombuffer(raw, dtype=np.float32).astype(np.float64)
            if len(samples) == 0:
                continue

            # If audio is longer than target_dur + 0.15s, speed it up slightly with ffmpeg atempo so it never overlaps next line
            actual_dur = len(samples) / sr
            if actual_dur > target_dur + 0.12:
                tempo = min(1.45, max(1.0, actual_dur / target_dur))
                raw2 = subprocess.run(
                    ["ffmpeg", "-v", "error", "-f", "f32le", "-ac", "1", "-ar", str(sr), "-i", "-", "-af", f"atempo={tempo:.3f}", "-f", "f32le", "-ac", "1", "-ar", str(sr), "-"],
                    input=samples.astype(np.float32).tobytes(),
                    capture_output=True,
                    check=True,
                ).stdout
                samples = np.frombuffer(raw2, dtype=np.float32).astype(np.float64)

            st_idx = int(start_s * sr)
            end_idx = min(len(full_audio), st_idx + len(samples))
            full_audio[st_idx:end_idx] = samples[: end_idx - st_idx]

    peak = np.abs(full_audio).max()
    if peak > 1e-9:
        full_audio = full_audio / peak * 0.9
    out_wav = proj_dir / "data" / "narration.wav"
    wavfile.write(out_wav, sr, (full_audio[: int(dur * sr)] * 32767).astype(np.int16))
    print(f"   ✅ Synthesized {out_wav} ({dur:.2f}s, {voice})", flush=True)


def upload_to_litterbox(file_path: Path) -> str:
    print(f"   ☁️ Uploading {file_path.name} ({file_path.stat().st_size / 1024 / 1024:.2f} MB) for Meta Reels CDN...", flush=True)
    # 1. Try Litterbox with browser User-Agent
    try:
        res = subprocess.run(
            [
                "curl",
                "-sS",
                "-A",
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                "-F",
                "reqtype=fileupload",
                "-F",
                "time=72h",
                "-F",
                f"fileToUpload=@{file_path}",
                "https://litterbox.catbox.moe/resources/internals/api.php",
            ],
            capture_output=True,
            text=True,
            timeout=90,
        )
        url = res.stdout.strip()
        if url.startswith("https://"):
            print(f"   🔗 Hosted URL (Litterbox): {url}", flush=True)
            return url
    except Exception:
        pass

    # 2. Fallback for GitHub Actions Datacenter IPs: push to branch `media-cdn` on la-mano-corrupta/aviday-cloud-reels
    repo_root = Path(__file__).resolve().parent
    media_dir = repo_root / "cdn_media"
    media_dir.mkdir(parents=True, exist_ok=True)
    unique_name = f"{int(time.time())}_{file_path.name}"
    dest = media_dir / unique_name
    shutil.copy2(file_path, dest)
    subprocess.run(["git", "config", "user.name", "Aviday Cloud CDN"], cwd=str(repo_root), check=True)
    subprocess.run(["git", "config", "user.email", "cdn@aviday.dev"], cwd=str(repo_root), check=True)
    subprocess.run(["git", "add", f"cdn_media/{unique_name}"], cwd=str(repo_root), check=True)
    subprocess.run(["git", "commit", "-m", f"CDN asset {unique_name}"], cwd=str(repo_root), check=True)
    commit_sha = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=str(repo_root), text=True).strip()
    subprocess.run(["git", "push", "-f", "origin", "HEAD:refs/heads/media-cdn"], cwd=str(repo_root), check=True)
    raw_url = f"https://raw.githubusercontent.com/la-mano-corrupta/aviday-cloud-reels/{commit_sha}/cdn_media/{unique_name}"
    print(f"   🔗 Hosted URL (GitHub Media CDN): {raw_url}", flush=True)
    return raw_url


DEFAULT_BADGES = {
    "deep-dive": "🔴 WHAT HAPPENS IF...",
    "night-file": "🕵️‍♂️ UNSOLVED CASE FILE",
    "stick-story": "⚠️ SURVIVAL TEST",
    "tall-tale": "🤯 BIZARRE TRUE STORY",
}


def apply_cognitive_anticipation_lead(proj_dir: Path, lead_sec: float = 0.065):
    """
    Shifts visual cues and word-level emphasis timestamps 2 frames (~65ms at 30fps)
    earlier than the spoken audio (0-3 frame cognitive anticipation rule from
    claude-animated-shorts), ensuring visual reactions land right as the brain registers the word.
    """
    words_file = proj_dir / "data" / "words.json"
    if words_file.exists():
        try:
            wdata = json.loads(words_file.read_text())
            words_list = wdata if isinstance(wdata, list) else wdata.get("words", [])
            for w in words_list:
                w["s"] = round(max(0.0, float(w.get("s", 0.0)) - lead_sec), 3)
                w["e"] = round(max(w["s"] + 0.04, float(w.get("e", 0.0)) - lead_sec * 0.5), 3)
            words_file.write_text(json.dumps(wdata, indent=1))
        except Exception as e:
            print(f"   ⚠️ Cognitive lead on words.json skipped: {e}", flush=True)


def extract_and_upload_cover(
    proj_dir: Path,
    style: str = "deep-dive",
    badge: str | None = None,
    line1: str = "WAIT UNTIL YOU SEE",
    line2: str = "WHAT HAPPENS?!",
    offset_sec: float = 3.2,
) -> tuple[str | None, Path | None]:
    try:
        thumb_script = Path(__file__).resolve().parent / "render_viral_thumbnail.mjs"
        out_jpg = proj_dir / "review" / "cover_hook.jpg"
        subprocess.run(
            [
                "node",
                str(thumb_script),
                str(proj_dir),
                str(out_jpg),
                style,
                badge or DEFAULT_BADGES.get(style, "🔴 WAIT FOR IT..."),
                line1,
                line2,
                f"{offset_sec}",
            ],
            cwd=str(proj_dir),
            check=True,
        )
        if out_jpg.exists():
            return upload_to_litterbox(out_jpg), out_jpg
    except Exception as e:
        print(f"   ⚠️ Custom viral thumbnail skipped ({e}); falling back to thumb_offset=2500ms", flush=True)
    return None, None


def publish_via_worker(
    video_url: str,
    spec: dict,
    add_to_pool_only: bool = False,
    cover_url: str | None = None,
    youtube_url: str | None = None,
):
    payload = json.dumps(
        {
            "videoUrl": video_url,
            "coverUrl": cover_url,
            "youtubeUrl": youtube_url,
            "thumbOffsetMs": 2500,
            "caption": spec["caption"],
            "style": spec["style"],
            "title": spec["title"],
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
        data = json.loads(resp.read().decode("utf-8"))
    print(f"   🎉 Worker /reels/publish result: {json.dumps(data)}", flush=True)
    return data


async def build_and_publish_one(spec: dict, add_to_pool_only: bool = False):
    from youtube_shorts_uploader import upload_youtube_short

    style = spec["style"]
    slug = spec["slug"]
    proj_dir = PROJECTS_DIR / slug
    if proj_dir.exists():
        shutil.rmtree(proj_dir)
    PROJECTS_DIR.mkdir(parents=True, exist_ok=True)
    shutil.copytree(SKILL_DIR / "styles" / style / "example", proj_dir)
    (proj_dir / "renders").mkdir(exist_ok=True)
    (proj_dir / "review").mkdir(exist_ok=True)

    print(f"\n🎬 === Building [{style}] -> {spec['title']} ===", flush=True)
    await synthesize_narration(proj_dir, style)
    apply_cognitive_anticipation_lead(proj_dir, lead_sec=0.065)

    # Mix voice + procedural SFX + music bed
    subprocess.run([sys.executable, "tools/mix.py", "."], cwd=str(proj_dir), check=True)

    # Render MP4 via headless Chrome
    out_mp4 = proj_dir / "renders" / f"{slug}.mp4"
    env = os.environ.copy()
    env["FPS"] = "24"
    subprocess.run(["node", "tools/capture.mjs", "video", str(out_mp4)], cwd=str(proj_dir), env=env, check=True)

    cover_url, cover_jpg = extract_and_upload_cover(
        proj_dir,
        style=style,
        badge=spec.get("thumb_badge"),
        line1=spec.get("thumb_line1", "WAIT UNTIL YOU SEE"),
        line2=spec.get("thumb_line2", "WHAT HAPPENS?!"),
        offset_sec=3.2,
    )
    yt_cover = proj_dir / "review" / "cover_youtube.jpg"
    yt_res = upload_youtube_short(
        out_mp4,
        title=spec["title"],
        description=spec["caption"],
        style=style,
        cover_jpg=yt_cover if yt_cover.exists() else cover_jpg,
    )
    youtube_url = yt_res.get("url") if yt_res.get("ok") else None
    video_url = upload_to_litterbox(out_mp4)
    return publish_via_worker(
        video_url,
        spec,
        add_to_pool_only=add_to_pool_only,
        cover_url=cover_url,
        youtube_url=youtube_url,
    )


async def main():
    only_style = sys.argv[1] if len(sys.argv) > 1 else None
    pool_only = "--pool" in sys.argv
    for spec in REEL_SPECS:
        if only_style and spec["style"] != only_style:
            continue
        await build_and_publish_one(spec, add_to_pool_only=pool_only)


if __name__ == "__main__":
    asyncio.run(main())
