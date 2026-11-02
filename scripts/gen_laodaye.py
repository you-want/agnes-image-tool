"""一次性调用 Agnes 文生图：农村老大爷正面照"""
import sys, json, time, base64, hashlib
import requests

sys.path.insert(0, "/Users/rain9/you-want/agnes-image-tool")
from config import OUTPUT_DIR

# 读取 API key
cfg = {}
cfg_path = "/Users/rain9/you-want/agnes-image-tool/.config.json"
import os
if os.path.exists(cfg_path):
    cfg = json.loads(open(cfg_path).read())
key = os.getenv("AGNES_API_KEY", "") or cfg.get("api_key", "")
if not key:
    # 尝试从 .env.local 读
    env_file = "/Users/rain9/you-want/agnes-image-tool/.env.local"
    if os.path.exists(env_file):
        for line in open(env_file):
            if line.startswith("AGNES_API_KEY="):
                key = line.split("=", 1)[1].strip()
                break
if not key:
    print("NO_API_KEY")
    sys.exit(1)

BASE_URL = "https://api.agnes-ai.cn/v1"
prompt = (
    "一位70多岁的中国农村老大爷正面肖像照，正面朝向镜头，五官清晰。"
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
}
url = f"{BASE_URL}/images/generations"
headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}

resp = requests.post(url, headers=headers, json=payload, timeout=120)
print("status:", resp.status_code)
print(resp.text[:300])

if resp.status_code == 200:
    data = resp.json().get("data", [])
    img_url = data[0].get("url") if data else None
    if not img_url:
        print("NO_IMAGE_URL")
        sys.exit(1)
    # 下载到本地
    out = OUTPUT_DIR / "laodaye_frontal.png"
    img = requests.get(img_url, timeout=60)
    out.write_bytes(img.content)
    print("SAVED:", out, len(img.content), "bytes")
else:
    print("FAILED")
    sys.exit(1)
