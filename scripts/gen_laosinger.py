"""图生图：参考照片五官脸型，生成朴素农村老歌手正面肖像"""
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
    "参考图中男子的五官和脸型轮廓，生成一位60多岁的中国农村老歌手肖像照。"
    "正面朝向镜头，五官比例、眉眼神韵与参考图保持同一张脸，"
    "头发花白略稀疏，鬓角和胡茬花白，脸上有自然风霜纹理但气色红润。"
    "他闭着嘴，嘴角带朴实的笑意，神情谦逊温和，像刚在田间地头唱完一首民歌的老把式。"
    "穿着洗旧的藏蓝色棉布对襟褂子，外罩一件灰褐色旧马甲，朴朴素素。"
    "背景是中国北方农村的村口土路，模糊的土坯院墙和秋日的庄稼，自然光。"
    "写实摄影风格，面部细节丰富，高清人像照片"
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
                       "outputs", "laosinger_from_dyai.png")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    img = requests.get(img_url, timeout=60)
    with open(out, "wb") as f:
        f.write(img.content)
    print("SAVED:", out, len(img.content), "bytes")
else:
    print("FAILED")
    sys.exit(1)
