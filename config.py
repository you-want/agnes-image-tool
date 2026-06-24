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

OUTPUT_DIR.mkdir(exist_ok=True)

# ==================== API 配置 ====================
DEFAULT_BASE_URL = "https://apihub.agnes-ai.com/v1"

_cached = {}
if CONFIG_FILE.exists():
    try:
        _cached = json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
    except Exception:
        pass

DEFAULT_API_KEY = os.getenv("AGNES_API_KEY", "") or _cached.get("api_key", "")
DEFAULT_MODEL = _cached.get("model", "agnes-image-2.1-flash")

# ==================== 模型配置 ====================
T2I_MODEL = "agnes-image-2.1-flash"
IMG2IMG_MODEL = "agnes-image-2.1-flash"  # 图生图也使用同一个模型
VIDEO_MODEL = "agnes-video-v2.0"

# ==================== 图像尺寸选项 ====================
IMAGE_SIZE_OPTIONS = [
    "1024x1024",
    "1024x1792",
    "1792x1024",
]

# ==================== 视频参数 ====================
VIDEO_RATIO_OPTIONS = [
    "16:9",
    "9:16",
    "1:1",
    "4:3",
    "3:4",
]

# 比例到标准分辨率映射
RATIO_TO_SIZE = {
    "16:9": {"width": 1152, "height": 768},
    "9:16": {"width": 768, "height": 1152},
    "1:1":  {"width": 768, "height": 768},
    "4:3":  {"width": 1024, "height": 768},
    "3:4":  {"width": 768, "height": 1024},
}

# 时长到帧数映射 (frame_rate=24, 满足 8n+1)
DURATION_TO_FRAMES = {
    3:  81,
    5:  121,
    8:  201,
    10: 241,
    15: 361,
    18: 441,
}

VIDEO_DURATION_CHOICES = [3, 5, 8, 10, 15, 18]
VIDEO_FRAME_RATE_CHOICES = [12, 24, 30, 60]

# 视频生成模式
VIDEO_MODE_OPTIONS = [
    "ti2vid",       # 文/图生视频（默认）
    "keyframes",    # 关键帧动画
]

# 分辨率预设（用户友好名称 -> width/height）
VIDEO_RESOLUTION_PRESETS = {
    "480p": {
        "16:9": {"width": 854,  "height": 480},
        "9:16": {"width": 480,  "height": 854},
        "1:1":  {"width": 480,  "height": 480},
        "4:3":  {"width": 640,  "height": 480},
        "3:4":  {"width": 480,  "height": 640},
    },
    "720p": {
        "16:9": {"width": 1280, "height": 720},
        "9:16": {"width": 720,  "height": 1280},
        "1:1":  {"width": 720,  "height": 720},
        "4:3":  {"width": 960,  "height": 720},
        "3:4":  {"width": 720,  "height": 960},
    },
    "1080p": {
        "16:9": {"width": 1920, "height": 1080},
        "9:16": {"width": 1080, "height": 1920},
        "1:1":  {"width": 1080, "height": 1080},
        "4:3":  {"width": 1440, "height": 1080},
        "3:4":  {"width": 1080, "height": 1440},
    },
}

VIDEO_RESOLUTION_CHOICES = ["480p", "720p", "1080p"]
