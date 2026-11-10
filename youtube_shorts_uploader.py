#!/usr/bin/env python3
"""
Aviday (@aviday_666_) — Automated YouTube Shorts Uploader (YouTube Data API v3)
100% Free using Google Cloud YouTube Data API v3 OAuth2 Refresh Token!

Features:
1. One-time OAuth2 login (`python3 youtube_shorts_uploader.py --auth --client-secrets client_secret.json`)
   that saves a permanent `youtube_credentials.json` (with refresh_token) for 24/7 headless uploads.
2. Resumable multipart upload of 1080x1920 MP4s to YouTube Shorts (`POST https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status`).
3. Automatically formats Title (<100 chars with #Shorts), Description, Tags, Category (27=Education / 24=Entertainment),
   `selfDeclaredMadeForKids=False`, and uploads the custom cover thumbnail (`thumbnails.set`).
"""
import argparse
import http.server
import json
import os
import sys
import urllib.parse
import urllib.request
import webbrowser
from pathlib import Path

CREDS_FILE = Path(__file__).resolve().parent / "youtube_credentials.json"
SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly",
]

CATEGORY_MAP = {
    "deep-dive": "28",    # Science & Technology
    "night-file": "24",   # Entertainment / Mystery
    "stick-story": "27",  # Education / Survival
    "tall-tale": "27",    # Education / History
}


def load_credentials() -> dict | None:
    # Support environment variables (for GitHub Actions secrets) or local youtube_credentials.json
    if os.environ.get("YOUTUBE_CLIENT_ID") and os.environ.get("YOUTUBE_REFRESH_TOKEN"):
        return {
            "client_id": os.environ["YOUTUBE_CLIENT_ID"],
            "client_secret": os.environ["YOUTUBE_CLIENT_SECRET"],
            "refresh_token": os.environ["YOUTUBE_REFRESH_TOKEN"],
        }
    if CREDS_FILE.exists():
        try:
            data = json.loads(CREDS_FILE.read_text())
            if data.get("client_id") and data.get("refresh_token"):
                return data
        except Exception:
            pass
    return None


def get_fresh_access_token(creds: dict) -> str:
    payload = urllib.parse.urlencode(
        {
            "client_id": creds["client_id"],
            "client_secret": creds["client_secret"],
            "refresh_token": creds["refresh_token"],
            "grant_type": "refresh_token",
        }
    ).encode("utf-8")
    req = urllib.request.Request(
        "https://oauth2.googleapis.com/token",
        data=payload,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        token_data = json.loads(resp.read().decode("utf-8"))
    return token_data["access_token"]


def run_interactive_oauth(client_secrets_path: str, port: int = 8089):
    raw = json.loads(Path(client_secrets_path).expanduser().read_text())
    cfg = raw.get("installed") or raw.get("web")
    if not cfg:
        raise ValueError("Invalid client_secret.json: expected 'installed' or 'web' key.")

    client_id = cfg["client_id"]
    client_secret = cfg["client_secret"]
    redirect_uri = f"http://127.0.0.1:{port}"

    auth_params = urllib.parse.urlencode(
        {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": " ".join(SCOPES),
            "access_type": "offline",
            "prompt": "consent",
        }
    )
    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{auth_params}"
    print(f"\n🌐 Opening Google OAuth login in your browser:\n{auth_url}\n", flush=True)
    webbrowser.open(auth_url)

    captured_code = {"code": None}

    class OAuthHandler(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            qs = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            if "code" in qs:
                captured_code["code"] = qs["code"][0]
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.end_headers()
                self.wfile.write(
                    b"<html><body style='font-family:sans-serif;text-align:center;padding:40px;'>"
                    b"<h1>&#9989; YouTube Shorts Channel Connected to Aviday!</h1>"
                    b"<p>You can close this tab now.</p></body></html>"
                )
            else:
                self.send_response(400)
                self.end_headers()

        def log_message(self, format, *args):
            return

    server = http.server.HTTPServer(("127.0.0.1", port), OAuthHandler)
    print(f"⏳ Waiting for Google callback on {redirect_uri} ...", flush=True)
    while captured_code["code"] is None:
        server.handle_request()
    server.server_close()

    token_payload = urllib.parse.urlencode(
        {
            "code": captured_code["code"],
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        }
    ).encode("utf-8")
    req = urllib.request.Request(
        "https://oauth2.googleapis.com/token",
        data=token_payload,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        tokens = json.loads(resp.read().decode("utf-8"))

    saved = {
        "client_id": client_id,
        "client_secret": client_secret,
        "refresh_token": tokens.get("refresh_token"),
    }
    CREDS_FILE.write_text(json.dumps(saved, indent=2))
    print(f"✅ Saved permanent YouTube credentials to {CREDS_FILE}!", flush=True)

    # Fetch connected channel info
    access_token = tokens["access_token"]
    ch_req = urllib.request.Request(
        "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    with urllib.request.urlopen(ch_req, timeout=20) as ch_resp:
        ch_data = json.loads(ch_resp.read().decode("utf-8"))
    items = ch_data.get("items", [])
    if items:
        ch = items[0]
        print(f"📺 Connected YouTube Channel: {ch['snippet']['title']} (ID: {ch['id']})", flush=True)


def upload_youtube_short(
    mp4_path: Path,
    title: str,
    description: str,
    style: str = "deep-dive",
    tags: list[str] | None = None,
    cover_jpg: Path | None = None,
    privacy_status: str = "public",
) -> dict:
    creds = load_credentials()
    if not creds:
        return {
            "ok": False,
            "skipped": True,
            "reason": "youtube_credentials.json not configured yet (run `python3 youtube_shorts_uploader.py --auth --client-secrets client_secret.json`)",
        }

    access_token = get_fresh_access_token(creds)
    clean_title = title.strip()
    if "#shorts" not in clean_title.lower():
        clean_title = f"{clean_title[:88]} #Shorts"
    else:
        clean_title = clean_title[:100]

    default_tags = [
        "shorts",
        "youtubeshorts",
        "viral",
        "didyouknow",
        "facts",
        "explainer",
        "3danimation",
        style.replace("-", ""),
    ]
    merged_tags = list(dict.fromkeys((tags or []) + default_tags))[:25]

    metadata = {
        "snippet": {
            "title": clean_title,
            "description": f"{description.strip()}\n\n#Shorts #YouTubeShorts #Viral #DidYouKnow",
            "tags": merged_tags,
            "categoryId": CATEGORY_MAP.get(style, "27"),
            "defaultLanguage": "en",
            "defaultAudioLanguage": "en",
        },
        "status": {
            "privacyStatus": privacy_status,
            "selfDeclaredMadeForKids": False,
            "embeddable": True,
        },
    }

    body_Meta = json.dumps(metadata).encode("utf-8")
    video_bytes = mp4_path.read_bytes()

    # Step 1: Initiate resumable upload session
    init_req = urllib.request.Request(
        "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
        data=body_Meta,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json; charset=UTF-8",
            "X-Upload-Content-Length": str(len(video_bytes)),
            "X-Upload-Content-Type": "video/mp4",
        },
        method="POST",
    )
    with urllib.request.urlopen(init_req, timeout=30) as init_resp:
        upload_url = init_resp.headers.get("Location")

    if not upload_url:
        raise RuntimeError("YouTube API did not return a resumable upload Location header.")

    # Step 2: Upload MP4 binary stream
    print(f"   📺 Uploading {mp4_path.name} ({len(video_bytes) / 1024 / 1024:.2f} MB) to YouTube Shorts...", flush=True)
    put_req = urllib.request.Request(
        upload_url,
        data=video_bytes,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Length": str(len(video_bytes)),
            "Content-Type": "video/mp4",
        },
        method="PUT",
    )
    with urllib.request.urlopen(put_req, timeout=300) as put_resp:
        video_data = json.loads(put_resp.read().decode("utf-8"))

    video_id = video_data["id"]
    short_url = f"https://www.youtube.com/shorts/{video_id}"
    print(f"   🎉 LIVE on YouTube Shorts: {short_url}", flush=True)

    # Step 3: Optional custom thumbnail upload (Works automatically once channel has Phone Verification enabled)
    if cover_jpg and cover_jpg.exists():
        try:
            jpg_bytes = cover_jpg.read_bytes()
            thumb_req = urllib.request.Request(
                f"https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId={video_id}&uploadType=media",
                data=jpg_bytes,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "image/jpeg",
                    "Content-Length": str(len(jpg_bytes)),
                },
                method="POST",
            )
            with urllib.request.urlopen(thumb_req, timeout=60):
                print(f"   🖼️ Uploaded custom viral thumbnail to YouTube Short ({video_id})!", flush=True)
        except Exception as e:
            print(f"   ℹ️ Custom YouTube thumbnail note: {e} (Short is still live at {short_url})", flush=True)

    return {
        "ok": True,
        "videoId": video_id,
        "url": short_url,
        "title": clean_title,
    }


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Aviday YouTube Shorts OAuth & Uploader")
    ap.add_argument("--auth", action="store_true", help="Run one-time interactive OAuth2 login")
    ap.add_argument("--client-secrets", default="client_secret.json", help="Path to Google OAuth client_secret.json")
    ap.add_argument("--video", help="Path to MP4 file to upload")
    ap.add_argument("--title", default="Wait Until You See What Happens #Shorts")
    ap.add_argument("--description", default="Daily 3D explainers and untold stories.")
    ap.add_argument("--style", default="deep-dive")
    ap.add_argument("--cover", help="Optional path to custom 1080x1920 cover JPEG")
    args = ap.parse_args()

    if args.auth:
        run_interactive_oauth(args.client_secrets)
    elif args.video:
        res = upload_youtube_short(
            Path(args.video),
            title=args.title,
            description=args.description,
            style=args.style,
            cover_jpg=Path(args.cover) if args.cover else None,
        )
        print(json.dumps(res, indent=2))
    else:
        ap.print_help()
