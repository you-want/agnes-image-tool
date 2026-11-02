"""图生图：参考儿童五官，生成同脸型农村老大爷正面照"""
import sys, json, os, base64, time
import requests

sys.path.insert(0, "/Users/rain9/you-want/agnes-image-tool")
from config import OUTPUT_DIR

# 读取 API key
cfg = {}
cfg_path = "/Users/rain9/you-want/agnes-image-tool/.config.json"
if os.path.exists(cfg_path):
    cfg = json.loads(open(cfg_path).read())
key = os.getenv("AGNES_API_KEY", "") or cfg.get("api_key", "")
if not key:
    env_file = "/Users/rain9/you-want/agnes-image-tool/.env.local"
    if os.path.exists(env_file):
        for line in open(env_file):
            if line.startswith("AGNES_API_KEY="):
                key = line.split("=", 1)[1].strip()
                break
if not key:
    print("NO_API_KEY"); sys.exit(1)

BASE_URL = "https://api.agnes-ai.cn/v1"

# 读取参考图并 base64 编码
img_path = "/Users/rain9/you-want/agnes-image-tool/1_person_transparent.png"
with open(img_path, "rb") as f:
    b64 = base64.b64encode(f.read()).decode("utf-8")
image_url = f"data:image/png;base64,{b64}"

prompt = (
    "参考图中小女孩的五官比例和脸型轮廓，生成一位70多岁的中国农村老大爷正面肖像照。"
    "正面朝向镜头，五官清晰，与参考图同一脸型比例。"
    "满脸饱经风霜的皱纹，银白色稀疏短发，花白眉毛，眼神温和慈祥。"
    "穿着洗旧的深蓝色棉布对襟褂子，外罩一件灰色旧马甲。"
    "背景是中国北方农村土坯房的院落，模糊的院墙和玉米秸秆，自然光，"
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

# 打印日志时隐藏 base64
log_payload = {k: v for k, v in payload.items() if not (isinstance(v, str) and len(v) > 200 and v.startswith("data:"))}
log_payload["extra_body"] = {"image": "[1 image (652KB png)]", "strength": 0.75}
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
    out = OUTPUT_DIR / "laodaye_from_child.png"
    img = requests.get(img_url, timeout=60)
    out.write_bytes(img.content)
    print("SAVED:", out, len(img.content), "bytes")
else:
    print("FAILED")
    sys.exit(1)
