"""
工具函数：历史记录管理、配置保存等
"""
import json
from datetime import datetime
from typing import List

from config import CONFIG_FILE, HISTORY_FILE


def load_history() -> List[dict]:
    """加载历史记录"""
    if HISTORY_FILE.exists():
        try:
            return json.loads(HISTORY_FILE.read_text(encoding="utf-8"))
        except Exception:
            return []
    return []


def save_history(history: List[dict]):
    """保存历史记录"""
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)


def add_to_history(prompt: str, image_paths: List[str], mode: str = "text2image", extra: dict = None):
    """添加到历史记录"""
    history = load_history()
    record = {
        "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "mode": mode,
        "prompt": prompt,
        "images": image_paths
    }
    if extra:
        record["extra"] = extra
    history.insert(0, record)
    # 最多保留 100 条
    history = history[:100]
    save_history(history)


def load_config() -> dict:
    """加载配置"""
    if CONFIG_FILE.exists():
        try:
            return json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
        except Exception:
            return {}
    return {}


def save_config(config: dict):
    """保存配置"""
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(config, f, ensure_ascii=False, indent=2)


def parse_size(size_str: str) -> str:
    """解析尺寸字符串，提取纯尺寸值"""
    # "1024x1024 (1:1 正方形)" -> "1024x1024"
    return size_str.split(" ")[0] if size_str else "1024x1024"


def parse_ratio(ratio_str: str) -> str:
    """解析比例字符串，提取纯比例值"""
    # "16:9 (横屏 YouTube/B站)" -> "16:9"
    return ratio_str.split(" ")[0] if ratio_str else "16:9"