#!/usr/bin/env python3
"""大自然风景视频 - 5个场景×4秒 = 20秒，极致真实感"""
import json, os, time, requests, urllib.request, urllib.error, ssl

cfg = json.loads(open(".config.json").read())
key = os.getenv("AGNES_API_KEY", "") or cfg.get("api_key", "")
BASE = "https://api.agnes-ai.cn/v1"
HEADERS = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}

# 5个参考图URL
REFS = [
    "https://cos-platform-outputs.agnes-ai.cn/images/t2i/task_xxx/ref0_snowmountain.png",  # placeholder, will upload
]

# 实际用本地图+data-uri方式（因为CDN URL可能不同）
# 先用图生图获取公网URL
def upload_ref(path, name):
    import base64
    data = open(path, "rb").read()
    b64 = base64.b64encode(data).decode()
    mime = "image/png" if path.endswith(".png") else "image/jpeg"
    uri = f"data:{mime};base64,{b64}"
    # 通过图生图获取公网URL
    payload = {
        "model": "agnes-image-2.1-flash",
        "prompt": "keep the image exactly as is, perfect copy, no changes",
        "size": "1920x1080",
        "n": 1,
        "extra_body": {"image": [uri], "strength": 0.0},
    }
    for attempt in range(5):
        try:
            r = requests.post(f"{BASE}/images/generations", headers=HEADERS, json=payload, timeout=120)
            if r.status_code == 200:
                return r.json()["data"][0]["url"]
            if r.status_code in (429, 503, 403):
                time.sleep(30 * (attempt + 1))
                continue
            print(f"  upload error {r.status_code}: {r.text[:200]}")
            break
        except Exception as e:
            time.sleep(30 * (attempt + 1))
    return None

# 上传参考图
print("Uploading reference images...")
ref_urls = []
ref_files = [
    ("outputs/nature_refs/nature_ref0.png", "雪山日出"),
    ("outputs/nature_refs/nature_ref1.png", "热带雨林瀑布"),
    ("outputs/nature_refs/nature_ref2.png", "沙漠星空"),
    ("outputs/nature_refs/nature_ref3.png", "极光森林"),
    ("outputs/nature_refs/nature_ref4.png", "深海珊瑚礁"),
]

for path, desc in ref_files:
    print(f"  Uploading {desc}...", end=" ", flush=True)
    url = upload_ref(path, desc)
    if url:
        print(f"OK ({len(url)} chars)")
        ref_urls.append(url)
    else:
        print("FAILED, trying alternative...")
        # Fallback: use the local file directly with data URI
        import base64
        with open(path, "rb") as f:
            b64 = base64.b64encode(f.read()).decode()
        mime = "image/png"
        ref_urls.append(f"data:{mime};base64,{b64}")
        print(f"Using data URI ({len(b64)//1024}KB)")

print(f"\nGot {len(ref_urls)}/5 references")

# 视频生成提示词 - 极致真实感，强调纪录片摄影风格
SEGS = [
    {
        "name": "01_雪山日出",
        "seconds": "4",
        "prompt": (
            "Authentic National Geographic documentary footage, NOT AI-generated appearance. "
            "Golden hour sunrise over majestic snow-capped alpine peaks. "
            "Slow cinematic camera push-in toward the mountain summit. "
            "Realistic volumetric clouds wrapping around peaks, natural rock textures visible, "
            "glacial ice with realistic blue crevasses, alpine lake below reflecting the golden-lit peaks. "
            "Wildflowers swaying gently in alpine breeze in foreground. "
            "Natural film grain, proper exposure, realistic color grading - no oversaturation. "
            "Shot on Canon Cinema Camera, 35mm lens, shallow depth of field. "
            "Authentic documentary photography aesthetic, real photography look."
        ),
    },
    {
        "name": "02_雨林瀑布",
        "seconds": "4",
        "prompt": (
            "Authentic BBC Earth documentary footage, NOT AI-generated appearance. "
            "Hidden tropical rainforest waterfall cascading into crystal-clear emerald pool. "
            "Slow camera drift forward through dense ferns and moss-covered rocks. "
            "Dappled sunlight filtering through multi-layered canopy, "
            "realistic water mist rising from the pool, "
            "wet moss textures on rocks, orchids and ferns in foreground. "
            "Natural green color palette, film grain, proper exposure. "
            "Shot on Sony Venice, 24mm lens, slow smooth movement. "
            "Authentic nature documentary aesthetic, real photography look."
        ),
    },
    {
        "name": "03_沙漠星空",
        "seconds": "4",
        "prompt": (
            "Authentic astrophotography documentary footage, NOT AI-generated appearance. "
            "Vast desert dunes under crystal-clear night sky with Milky Way galaxy arching overhead. "
            "Slow camera pan across the dunes, realistic sand textures and shadows. "
            "Proper star density and color, cold blue moonlight on dune edges, "
            "silhouette of distant dunes against the galaxy. "
            "Long exposure aesthetic, natural star colors, film grain. "
            "Shot on Nikon Z8, 14mm lens, authentic astrophotography look. "
            "No fake rainbow nebulas, no oversaturated colors, real photography."
        ),
    },
    {
        "name": "04_极光森林",
        "seconds": "4",
        "prompt": (
            "Authentic nature documentary footage, NOT AI-generated appearance. "
            "Northern lights dancing over a frozen Scandinavian pine forest. "
            "Slow camera tracking sideways through snow-laden pines. "
            "Realistic aurora borealis with natural green and subtle purple color bands, "
            "snow distribution on branches is natural and accurate, "
            "frozen lake reflecting the aurora, cold blue ambient light. "
            "Long exposure aesthetic with natural star trails, film grain. "
            "Shot on Fuji GFX, 16mm lens, authentic landscape photography. "
            "No neon-bright auroras, no psychedelic colors, real photography."
        ),
    },
    {
        "name": "05_深海珊瑚礁",
        "seconds": "4",
        "prompt": (
            "Authentic National Geographic underwater documentary footage, NOT AI-generated appearance. "
            "Vibrant coral reef with real tropical fish species swimming naturally. "
            "Slow camera drift alongside the reef, natural sunlight rays penetrating clear turquoise water. "
            "Accurate coral textures and fish behavior, sand bottom with natural debris, "
            "subtle water caustics on coral surfaces, slight particulate matter in water. "
            "Natural underwater color grading with red filter compensation, film grain. "
            "Shot on RED Komodo, underwater housing, realistic marine biology. "
            "No cartoon fish, no impossible species, no neon colors, real photography."
        ),
    },
]

OUT_DIR = "outputs/nature_video"
os.makedirs(OUT_DIR, exist_ok=True)

_ctx = ssl.create_default_context()
_ctx.check_hostname = False
_ctx.verify_mode = ssl.CERT_NONE

def post(url, body=None):
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method="POST" if data else "GET",
        headers={"Authorization": HEADERS["Authorization"], "Content-Type": "application/json"})
    try:
        r = urllib.request.urlopen(req, context=_ctx, timeout=300)
        return True, json.loads(r.read()), r.status
    except urllib.error.HTTPError as e:
        try:
            return False, json.loads(e.read()), e.code
        except Exception:
            return False, e.read().decode(errors="replace"), e.code
    except Exception as e:
        return False, str(e), 0

def download(vid_url, dst):
    req = urllib.request.Request(vid_url, headers={"Authorization": HEADERS["Authorization"]})
    with open(dst, "wb") as f:
        with urllib.request.urlopen(req, context=_ctx, timeout=300) as r:
            while chunk := r.read(65536):
                f.write(chunk)

results = []
for i, seg in enumerate(SEGS):
    if i >= len(ref_urls):
        print(f"SKIP seg{i}: no reference image")
        continue
    dst = os.path.join(OUT_DIR, f"nature_seg{i}.mp4")
    if os.path.exists(dst) and os.path.getsize(dst) > 50000:
        print(f"[skip] nature_seg{i}.mp4")
        results.append(dst)
        continue

    print(f"\n{'='*60}")
    print(f"场景{i+1}/5: {seg['name']} ({seg['seconds']}s)")
    print(f"{'='*60}")

    ref_url = ref_urls[i]
    is_data_uri = ref_url.startswith("data:")
    body = {
        "model": "agnes-video-2.5-flash",
        "prompt": seg["prompt"],
        "mode": "reference",
        "size": "720P",
        "seconds": seg["seconds"],
        "aspect_ratio": "16:9",
        "images": [ref_url],
    }
    log_body = dict(body)
    if is_data_uri:
        log_body["images"] = ["<data-uri>"]
    print(f"Reference: {'data-uri' if is_data_uri else ref_url[:80]}...")

    backoff = 30
    vid = None
    for attempt in range(8):
        ok, r, code = post(f"{BASE}/videos", body)
        if ok and "video_id" in r:
            vid = r["video_id"]
            print(f"  submitted video_id={vid}")
            break
        if code in (429, 503):
            print(f"  {code}, waiting {backoff}s...")
            time.sleep(backoff)
            backoff = min(backoff * 2, 300)
            continue
        print(f"  ERROR {code}: {str(r)[:300]}")
        break

    if not vid:
        print("  FAILED to submit")
        continue

    poll_backoff = 10
    video_url = None
    for stall in range(200):
        ok, r, code = post(f"{BASE}/agnesapi?video_id={vid}&model_name=agnes-video-2.5-flash")
        if code in (429, 503):
            time.sleep(poll_backoff)
            poll_backoff = min(poll_backoff * 2, 60)
            continue
        d = r.get("data", r) if isinstance(r, dict) else r
        status = d.get("status")
        if stall % 8 == 0:
            print(f"  poll: status={status} progress={d.get('progress')}")
        if status == "completed":
            video_url = d.get("url") or d.get("output", {}).get("url")
            break
        if status in ("failed", "error"):
            print(f"  VIDEO FAILED: {json.dumps(d, ensure_ascii=False)[:300]}")
            break
        time.sleep(15)

    if not video_url:
        print("  No video URL")
        continue

    download(video_url, dst)
    size_mb = os.path.getsize(dst) / 1048576
    print(f"  SAVED: {dst} ({size_mb:.1f}MB)")
    results.append(dst)

print(f"\n{'='*60}")
print(f"Generated {len(results)}/5 segments")

if results:
    concat_path = os.path.join(OUT_DIR, "concat.txt")
    with open(concat_path, "w") as f:
        for r in results:
            f.write(f"file '{os.path.basename(r)}'\n")
    print(f"Concat file: {concat_path}")
    print(f"FFmpeg command:")
    parts = " ".join([f"-i {r}" for r in results])
    print(f"ffmpeg -y {parts} -filter_complex '[0:v][0:a][1:v][1:a][2:v][2:a][3:v][3:a][4:v][4:a]concat=n={len(results)}:v=1:a=1[outv][outa]' -map '[outv]' -map '[outa]' outputs/nature_final.mp4")
