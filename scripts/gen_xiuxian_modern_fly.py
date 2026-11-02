"""图生视频：仙侠人物在现代都市御剑飞行。
参考图 = outputs/xiuxian_fullbody_from_dyai.png
提交 POST /v1/videos (mode=reference, 720P, 12s)，轮询 /agnesapi，下载成片。
503 队列满时指数退避。
"""
import os, sys, json, time, base64, pathlib
import requests

BASE = "https://api.agnes-ai.cn"
API_KEY = (
    os.environ.get("AGNES_API_KEY")
    or (lambda: [l.split("=", 1)[1].strip() for l in
                 open("/Users/rain9/you-want/agnes-image-tool/web/.env.local")
                 if l.startswith("AGNES_API_KEY=")][0])()
)

# 仙侠参考图 URL：优先取上次生成 API 返回的公网 URL（平台输出 CDN，永久可访问），
# 本地 data-uri 太大时可能触发 internal_error
IMG_URL = "https://platform-outputs.agnes-ai.space/images/i2i/task_9gRiVhbcbAFTvDz3CRkJ45K1aP7Zd8LE/output.png"

def _img_input():
    return [IMG_URL]

HEADERS = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

PROMPT = (
    "修仙剑客在现代都市上空御剑飞行。"
    "黑色长发高束马尾，月白色广袖长袍、淡青色交领大袖外衣，衣摆随风飞扬。"
    "脚下长剑斜指大地，剑身泛着寒气蓝光，剑气拖出淡蓝色光轨。"
    "镜头跟随他从左向右掠过现代城市：玻璃幕墙摩天大楼群、川流不息的车流、"
    "立交桥、远处的高架轨道列车、城市公园和滨江步道。"
    "天空是黄昏晚霞，阳光在玻璃幕墙上折射出金色光斑。"
    "电影级写实CG风格，慢动作飞行镜头，都市奇幻大片质感，画面稳定，人物面部保持与参考图一致。"
    "避免出现：面部变形、五官改变、多余肢体、画面抖动、文字水印字幕。"
)

def submit():
    body = {
        "model": "agnes-video-2.5-flash",
        "prompt": PROMPT,
        "mode": "reference",
        "size": "720P",
        "seconds": "12",
        "aspect_ratio": "16:9",
        "images": _img_input(),
    }
    log = dict(body)
    log["images"] = [f"<{len(IMG_URL)} chars url>"]
    print("submit body:", json.dumps(log, ensure_ascii=False))

    backoff = 60
    while True:
        try:
            r = requests.post(f"{BASE}/v1/videos", headers=HEADERS, json=body, timeout=300)
        except requests.exceptions.RequestException as e:
            print(f"  request error: {e}; backoff {backoff}s", flush=True)
            time.sleep(backoff)
            backoff = min(backoff * 2, 600)
            continue
        if r.status_code < 400:
            data = r.json()
            vid = data.get("video_id") or data.get("id")
            print(f"  submitted, video_id={vid}", flush=True)
            return vid
        if r.status_code in (429, 503):
            print(f"  submit {r.status_code}, backoff {backoff}s", flush=True)
            time.sleep(backoff)
            backoff = min(backoff * 2, 600)
            continue
        print(f"  submit failed HTTP {r.status_code}: {r.text[:300]}")
        sys.exit(1)

def poll(vid):
    url = f"{BASE}/agnesapi?video_id={vid}&model_name=agnes-video-2.5-flash"
    stall = 0
    while True:
        try:
            r = requests.get(url, headers=HEADERS, timeout=60)
            data = r.json()
        except Exception as e:
            print(f"  poll error: {e}", flush=True)
            time.sleep(30)
            continue
        if r.status_code in (429, 503):
            print(f"  poll {r.status_code}, wait 60s", flush=True)
            time.sleep(60)
            continue
        d = data.get("data", data) if isinstance(data.get("data"), dict) else data
        status = d.get("status")
        stall += 1
        if stall % 4 == 1:
            print(f"  poll: status={status} progress={d.get('progress')}", flush=True)
        if status == "completed":
            return d.get("url")
        if status in ("failed", "error"):
            print(f"  video FAILED: {json.dumps(d, ensure_ascii=False)[:500]}")
            sys.exit(1)
        time.sleep(15)

def main():
    vid = submit()
    vurl = poll(vid)
    if not vurl:
        print("completed but no url")
        sys.exit(1)
    out = pathlib.Path("/Users/rain9/you-want/agnes-image-tool/outputs/xiuxian_modern_fly.mp4")
    r = requests.get(vurl, headers=HEADERS, timeout=300)
    r.raise_for_status()
    out.write_bytes(r.content)
    print(f"SAVED: {out} ({len(r.content)/1048576:.1f}MB)")

if __name__ == "__main__":
    main()
