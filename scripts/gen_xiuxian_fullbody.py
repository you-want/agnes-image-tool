"""图生图：参考照片五官脸型，生成仙侠剧照全身照"""
import sys, json, os, base64, time
import requests

# 读取 API key
cfg = {}
cfg_path = "/Users/rain9/you-want/agnes-image-tool/.config.json"
if os.path.exists(cfg_path):
    cfg = json.loads(open(cfg_path).read())
key = os.getenv("AGNES_API_KEY", "") or cfg.get("api_key", "")
if not key:
    env_file = "/Users/rain9/you-want/agnes-image-tool/web/.env.local"
    if os.path.exists(env_file):
        for line in open(env_file):
            if line.startswith("AGNES_API_KEY="):
                key = line.split("=", 1)[1].strip()
                break
if not key:
    print("NO_API_KEY"); sys.exit(1)

BASE_URL = "https://api.agnes-ai.cn/v1"

# 读取参考图并 base64 编码
img_path = "/Users/rain9/you-want/agnes-image-tool/dy-ai.JPG"
with open(img_path, "rb") as f:
    b64 = base64.b64encode(f.read()).decode("utf-8")
image_url = f"data:image/jpeg;base64,{b64}"

prompt = (
    "参考图中男子的五官和脸型轮廓，生成一张仙侠电视剧剧照，全身照。"
    "一名约30岁的修仙剑客，五官比例、眉眼神韵与参考图保持同一张脸，"
    "黑色长发高束马尾，留一丝碎发垂落，剑眉星目，气质清冷出尘。"
    "身穿月白色广袖长袍，外罩淡青色交领大袖外衣，腰系深蓝色宽腰带配玉佩流苏，"
    "衣摆随山风轻扬，袖口绣有暗纹云纹。"
    "他单手负于身后，另一手扶剑柄，剑尖斜指地面，剑身隐泛寒光。"
    "立于云海翻涌的高山之巅，远处雪峰与浮空仙岛，霞光染云，灵气浮动，"
    "整体仙侠大片质感，电影级光影，超写实CG风格，8K高清"
)

payload = {
    "model": "agnes-image-2.1-flash",
    "prompt": prompt,
    "size": "1024x1024",
    "n": 1,
    "extra_body": {
        "image": [image_url],
        "strength": 0.75,
    },
}

url = f"{BASE_URL}/images/generations"
headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}

log_payload = json.loads(json.dumps(payload))
log_payload["extra_body"]["image"] = f"[1 image ({os.path.getsize(img_path)//1024}KB jpg)]"
print("payload:", json.dumps(log_payload, ensure_ascii=False))

def submit_with_retry(payload, max_retries=8):
    """指数退避重试，应对 503 queue full"""
    for attempt in range(max_retries):
        wait = min(30 * (attempt + 1), 180)
        if attempt > 0:
            print(f" 503 queue full，等待 {wait}s 后重试 ({attempt}/{max_retries})...")
            time.sleep(wait)
        try:
            resp = requests.post(url, headers=headers, json=payload, timeout=120)
            if resp.status_code != 503:
                return resp
            print(f" status: 503 (queue full)")
        except requests.exceptions.RequestException as e:
            print(f" 请求异常: {e}，等待 {wait}s 重试...")
            time.sleep(wait)
    return None

resp = submit_with_retry(payload)
if resp is None:
    print("FAILED: all retries exhausted"); sys.exit(1)
print("status:", resp.status_code)
print(resp.text[:500])

if resp.status_code == 200:
    data = resp.json().get("data", [])
    img_url = data[0].get("url") if data else None
    if not img_url:
        print("NO_IMAGE_URL"); sys.exit(1)
    out = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                       "outputs", "xiuxian_fullbody_from_dyai.png")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    img = requests.get(img_url, timeout=60)
    with open(out, "wb") as f:
        f.write(img.content)
    print("SAVED:", out, len(img.content), "bytes")
else:
    print("FAILED")
    sys.exit(1)
