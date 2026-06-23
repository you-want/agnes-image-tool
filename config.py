"""
配置和常量定义
"""
import os
import json
from pathlib import Path

# ==================== 目录配置 ====================
BASE_DIR = Path(__file__).parent
OUTPUT_DIR = BASE_DIR / "outputs"
CONFIG_FILE = BASE_DIR / ".config.json"
HISTORY_FILE = BASE_DIR / "history.json"

# 确保输出目录存在
OUTPUT_DIR.mkdir(exist_ok=True)

# ==================== API 配置 ====================
DEFAULT_BASE_URL = "https://apihub.agnes-ai.com/v1"

# 从配置文件或环境变量读取默认值
_cached = {}
if CONFIG_FILE.exists():
    try:
        _cached = json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
    except Exception:
        pass

DEFAULT_API_KEY = os.getenv("AGNES_API_KEY", "") or _cached.get("api_key", "")
DEFAULT_MODEL = _cached.get("model", "agnes-image-2.1-flash")

# ==================== 模型配置 ====================
IMG2IMG_MODEL = "agnes-image-2.1-flash"
VIDEO_MODEL = "agnes-video-v2.0"

# ==================== 提示词增强 ====================
QUALITY_PROMPT_SUFFIX = ", masterpiece, best quality, ultra detailed, 8k, high resolution, sharp focus, professional photography"
NEGATIVE_PROMPT_DEFAULT = "low quality, blurry, distorted, deformed, bad anatomy, extra limbs, watermark, text, ugly"

# ==================== 图像尺寸选项 ====================
IMAGE_SIZE_OPTIONS = [
    "1024x1024 (1:1 正方形)",
    "1024x1792 (9:16 抖音竖屏)",
    "1792x1024 (16:9 抖音横屏)",
    "864x1536 (9:16 抖音封面)",
    "1536x864 (16:9 抖音封面)",
]

# ==================== 视频时长选项 ====================
VIDEO_DURATION_OPTIONS = [3, 5, 8, 10, 15]

# ==================== 视频比例选项 ====================
VIDEO_RATIO_OPTIONS = [
    "16:9 (横屏 YouTube/B站)",
    "9:16 (竖屏 抖音/快手)",
    "1:1 (正方形)",
    "4:3 (传统横屏)",
    "21:9 (超宽屏)",
]

# ==================== 图生图模式预设 ====================
IMG2IMG_MODE_PRESETS = {
    "风格转换": {"strength": 0.7, "negative": "low quality, blurry, distorted, watermark"},
    "内容修改": {"strength": 0.85, "negative": "low quality, blurry, distorted, bad composition"},
    "画质增强": {"strength": 0.35, "negative": "low quality, blurry, noise, compression artifacts"},
}