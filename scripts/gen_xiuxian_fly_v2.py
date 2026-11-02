"""御剑飞行三段视频（12s×3，text 模式 720P 16:9）→ 拼接成片。
seg0 召唤飞剑 → seg1 御剑起飞 → seg2 山川游览（人物/风景特写）
幂等：segments2/fly_segN.mp4 已存在则跳过。503 指数退避。
"""
import os, json, time, base64, pathlib, sys
import urllib.request, urllib.error, ssl

_SSL_CTX = ssl.create_default_context()
_SSL_CTX.check_hostname = False
_SSL_CTX.verify_mode = ssl.CERT_NONE

def _key_from_env():
    p = pathlib.Path("/Users/rain9/you-want/agnes-image-tool/web/.env.local")
    for line in p.read_text().splitlines():
        if line.startswith("AGNES_API_KEY="):
            return line.split("=", 1)[1].strip()
    raise SystemExit("no AGNES_API_KEY")

API_KEY = os.environ.get("AGNES_API_KEY") or _key_from_env()
BASE = "https://api.agnes-ai.cn"
HEADERS = {"Authorization": f"Bearer {API_KEY}"}

STYLE = (
    "写实仙侠电影质感，超清CG，电影级光影，画面稳定流畅，"
    "中国古典修仙风格，16:9横屏"
)

CHAR = (
    "一名约30岁的修仙剑客，五官轮廓端正清俊，黑色长发高束马尾留碎发垂落，剑眉星目，"
    "身穿月白色广袖长袍、淡青色交领大袖外衣，深蓝宽腰带系玉佩流苏。"
)

PROMPTS = [
    # seg0 召唤飞剑
    CHAR + "静立于云雾缭绕的巍峨山巅，晨光熹微。"
    "他右手缓缓抬起，捏动法诀，手指灵动翻飞，口诵口诀，掌心凝起一点淡金色灵光；"
    "随着最后一诀落下，灵光骤然绽放，一柄通体寒光的水晶飞剑自虚空出鞘而出，"
    "剑身流转淡蓝色剑气，"
    "剑尖斜指，稳稳悬停在他双脚之前。"
    "特写镜头：手部法诀的细节，灵光在指尖的流转，飞剑出鞘的寒光。",
    # seg1 御剑起飞
    CHAR + "脚踏悬停的飞剑，双手负于身后，周身衣袂随山风猎猎飞扬。"
    "他抬手一挥，轻喝一声口诀，剑气轰然托起淡蓝色光柱，"
    "飞剑拔地而起，御剑者乘风破浪直冲云霄，掠过翻涌的云海、"
    "剑光在崖壁上划出一道湛蓝轨迹，云雾被剑气劈开两分。"
    "镜头从仰拍起飞跟到俯冲，再拉成远景：渺小身影没入群山云雾。",
    # seg2 山川游览
    "御剑飞行游览山川。" + CHAR + "御剑穿行于雄伟山川之间："
    "镜头特写人物面部的清风拂面，宽袖猎猎，发丝飞扬，"
    "剑尖拖出淡淡蓝色光轨，掠过瀑布飞流直下的山谷、云海松涛的苍翠山峦、"
    "金红相间的秋叶森林，"
    "远景镜头：御剑者如一点白虹划过长江两岸，群山连绵，云开雾散，日照金山。"
    "镜头在人物特写与壮丽山川大景之间交替，节奏舒缓悠远，惬意自在，"
    "仿佛出门就该如此，游历天地，快意人生。",
]

OUT = pathlib.Path(__file__).parent / "fly_v2"
OUT.mkdir(parents=True, exist_ok=True)

def post(url, body=None, timeout=300):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        url,
        data=data,
        method="POST" if data is not None else "GET",
        headers={
            "Authorization": HEADERS["Authorization"],
            "Content-Type": "application/json",
        },
    )
    try:
        r = urllib.request.urlopen(req, context=_SSL_CTX, timeout=timeout)
        code = r.status
        payload = r.read()
    except urllib.error.HTTPError as e:
        code = e.code
        payload = e.read()
    except Exception as e:
        return (False, str(e), 0)
    try:
        parsed = json.loads(payload)
    except (json.JSONDecodeError, ValueError):
        parsed = payload.decode(errors="replace")
    return (200 <= code < 300, parsed, code)

def download(vid_url, dst):
    req = urllib.request.Request(vid_url, headers={"Authorization": HEADERS["Authorization"]})
    with open(dst, "wb") as f:
        with urllib.request.urlopen(req, context=_SSL_CTX, timeout=300) as r:
            while chunk := r.read(65536):
                f.write(chunk)

def submit(prompt):
    body = {
        "model": "agnes-video-2.5-flash",
        "prompt": prompt + " " + STYLE,
        "mode": "text",
        "size": "720P",
        "seconds": "12",
        "aspect_ratio": "16:9",
    }
    backoff = 60
    while True:
        ok, r, code = post(f"{BASE}/v1/videos", body)
        if ok:
            vid = (r.get("id") or r.get("video_id") or
                   (r.get("data", {}) if isinstance(r.get("data"), dict) else {}).get("id"))
            if not vid:
                raise ValueError(f"no video_id in {r}")
            return vid
        if code in (429, 503):
            print(f"  submit {code}, backoff {backoff}s...", flush=True)
            time.sleep(backoff)
            backoff = min(backoff * 2, 600)
            continue
        raise RuntimeError(f"submit HTTP {code}: {r}")

def poll(vid):
    url = f"{BASE}/agnesapi?video_id={vid}&model_name=agnes-video-2.5-flash"
    backoff, stall = 10, 0
    while True:
        ok, r, code = post(url)
        if code in (429, 503):
            time.sleep(backoff)
            backoff = min(backoff * 2, 300)
            continue
        if not ok and not isinstance(r, dict):
            time.sleep(10)
            continue
        data = r.get("data", r) if isinstance(r, dict) else {}
        status = data.get("status") or data.get("state")
        if status == "completed":
            out = data.get("output", {}) if isinstance(data.get("output"), dict) else {}
            u = data.get("url") or data.get("video_url") or out.get("url")
            if not u:
                raise RuntimeError(f"completed but no url: {data}")
            return u
        if status in ("failed", "error"):
            raise RuntimeError(f"video failed: {json.dumps(data, ensure_ascii=False)[:400]}")
        stall += 1
        if stall % 6 == 0:
            prog = data.get("progress") if isinstance(data, dict) else "?"
            print(f"  poll {vid[:20]}… status={status} progress={prog} ({stall * 15}s)", flush=True)
        time.sleep(15)

def main():
    for i, p in enumerate(PROMPTS):
        dst = OUT / f"fly_seg{i}.mp4"
        if dst.exists() and dst.stat().st_size > 50000:
            print(f"[skip] fly_seg{i}.mp4", flush=True)
            continue
        print(f"[{i + 1}/3] submitting: {p[:40]}…", flush=True)
        vid = submit(p)
        print(f"      video_id={vid}", flush=True)
        u = poll(vid)
        download(u, dst)
        print(f"      saved {dst} ({dst.stat().st_size / 1048576:.1f}MB)", flush=True)
    print("all 3 segments done; concat next", flush=True)

if __name__ == "__main__":
    main()
