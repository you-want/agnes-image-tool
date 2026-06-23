#!/usr/bin/env python3
"""
Agnes Image 2.1 Flash - 可视化图像生成工具
基于 Gradio 的 Web 界面，支持文生图、图生图、批量生成
"""

import os
import json
import base64
import time
import requests
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Tuple

import gradio as gr
from PIL import Image
from openai import OpenAI

# ==================== 配置 ====================

CONFIG_FILE = Path(__file__).parent / ".config.json"

def load_config() -> dict:
    """从本地配置文件加载缓存的配置"""
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}

def save_config(config: dict):
    """保存配置到本地文件"""
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(config, f, ensure_ascii=False, indent=2)

# 优先级：环境变量 > 本地缓存
_cached = load_config()
DEFAULT_API_KEY = os.getenv("AGNES_API_KEY", "") or _cached.get("api_key", "")
DEFAULT_BASE_URL = _cached.get("base_url", "https://apihub.agnes-ai.com/v1")
DEFAULT_MODEL = _cached.get("model", "agnes-image-2.1-flash")
IMG2IMG_MODEL = "agnes-image-2.1-flash"

QUALITY_PROMPT_SUFFIX = ", masterpiece, best quality, ultra detailed, 8k, high resolution, sharp focus, professional photography"
NEGATIVE_PROMPT_DEFAULT = "low quality, blurry, distorted, deformed, bad anatomy, extra limbs, watermark, text, ugly"
VIDEO_MODEL = "agnes-video-v2.0"

HISTORY_FILE = Path(__file__).parent / "history.json"
OUTPUT_DIR = Path(__file__).parent / "outputs"
OUTPUT_DIR.mkdir(exist_ok=True)

def parse_size(size_str: str) -> str:
    """从选项中提取实际尺寸，如 '1024x1024 (1:1 正方形)' -> '1024x1024'"""
    return size_str.split(" ")[0]

def parse_video_size(size_str: str) -> dict:
    """从选项中提取视频尺寸，如 '720p (1280x720 横屏)' -> {'width':1280, 'height':720}"""
    try:
        inner = size_str.split("(")[1].split(")")[0].strip()
        w, h = inner.split("x")
        return {"width": int(w.strip()), "height": int(h.strip())}
    except Exception:
        return {"width": 1280, "height": 720}

# ==================== 核心功能 ====================

class AgnesImageGenerator:
    """Agnes Image 生成器封装"""

    def __init__(self, api_key: str, base_url: str = DEFAULT_BASE_URL):
        self.client = OpenAI(api_key=api_key, base_url=base_url)

    def text_to_image(
        self,
        prompt: str,
        negative_prompt: str = "",
        size: str = "1024x1024",
        n: int = 1,
    ) -> List[str]:
        """文生图 - 使用 requests 直接调用 API"""
        try:
            full_prompt = prompt
            if negative_prompt:
                full_prompt += f" | 避免: {negative_prompt}"

            # 直接使用 requests 调用，避免 OpenAI SDK 的 URL 拼接问题
            url = f"{str(self.client.base_url).rstrip('/')}/images/generations"
            headers = {
                "Authorization": f"Bearer {self.client.api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": DEFAULT_MODEL,
                "prompt": full_prompt,
                "size": size,
                "n": n
            }

            print(f"🔍 请求 URL: {url}")
            print(f"🔍 请求 payload: {payload}")

            response = requests.post(url, json=payload, headers=headers, timeout=60)

            print(f"🔍 响应状态码: {response.status_code}")
            print(f"🔍 响应内容: {response.text}")

            response.raise_for_status()
            result = response.json()

            urls = [item["url"] for item in result.get("data", [])]
            return urls

        except requests.exceptions.RequestException as e:
            error_msg = f"生成失败: {str(e)}"
            if hasattr(e, 'response') and e.response is not None:
                error_msg += f"\n响应: {e.response.text}"
            raise gr.Error(error_msg)

    def image_to_image(
        self,
        image_path: str,
        prompt: str,
        size: str = "1024x1024",
        n: int = 1,
        strength: float = 0.75,
        negative_prompt: str = "",
        enhance_quality: bool = True,
    ) -> List[str]:
        """图生图 - 使用 base64 data URI 上传，直接用 requests 调用"""
        try:
            import base64
            if enhance_quality:
                prompt = prompt + QUALITY_PROMPT_SUFFIX
            if not negative_prompt:
                negative_prompt = NEGATIVE_PROMPT_DEFAULT

            with open(image_path, "rb") as f:
                image_data = f.read()
            b64 = base64.b64encode(image_data).decode("utf-8")
            image_url = f"data:image/png;base64,{b64}"

            url = f"{str(self.client.base_url).rstrip('/')}/images/generations"
            headers = {
                "Authorization": f"Bearer {self.client.api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": IMG2IMG_MODEL,
                "prompt": prompt,
                "n": n,
                "size": size,
                "image": image_url,
                "strength": strength,
                "negative_prompt": negative_prompt,
            }

            print(f"🎨 图生图请求 URL: {url}")
            print(f"🎨 模型: {IMG2IMG_MODEL}")
            print(f"🎨 强度: {strength}")
            print(f"🎨 尺寸: {size}")
            print(f"🎨 prompt 长度: {len(prompt)}")
            print(f"🎨 image base64 长度: {len(image_url)}")

            response = requests.post(url, json=payload, headers=headers, timeout=180)

            print(f"🎨 响应状态码: {response.status_code}")
            print(f"🎨 响应内容: {response.text[:800]}")

            if response.status_code >= 400:
                try:
                    err_data = response.json()
                    err_msg = err_data.get("error", {}).get("message", str(err_data))
                except Exception:
                    err_msg = response.text[:500]
                
                if "model_not_found" in str(err_msg) or "dall-e" in str(err_msg):
                    print("⚠️ 模型路由失败，尝试备选方式...")
                    alt_payload = {
                        "model": IMG2IMG_MODEL,
                        "prompt": prompt,
                        "n": n,
                        "size": size,
                        "image": [image_url],
                        "strength": strength,
                        "negative_prompt": negative_prompt,
                    }
                    response = requests.post(url, json=alt_payload, headers=headers, timeout=180)
                    print(f"🎨 备选请求响应状态码: {response.status_code}")
                    print(f"🎨 备选响应内容: {response.text[:500]}")
                    if response.status_code >= 400:
                        raise gr.Error(f"图生图失败: {err_msg}")
                else:
                    raise gr.Error(f"图生图失败: {err_msg}")

            result = response.json()

            urls = [item.get("url") or item.get("b64_json") for item in result.get("data", [])]
            urls = [u for u in urls if u and isinstance(u, str)]
            if not urls:
                raise gr.Error("API 返回中未找到图片 URL")
            
            # 如果返回的是 base64，转成 data URI
            final_urls = []
            for u in urls:
                if u.startswith("http"):
                    final_urls.append(u)
                elif len(u) > 100 and not u.startswith("data:"):
                    final_urls.append(f"data:image/png;base64,{u}")
                else:
                    final_urls.append(u)
            
            return final_urls

        except requests.exceptions.RequestException as e:
            error_msg = f"图生图失败: {str(e)}"
            if hasattr(e, 'response') and e.response is not None:
                try:
                    err_data = e.response.json()
                    err_detail = err_data.get("error", {}).get("message", str(err_data))
                except Exception:
                    err_detail = e.response.text[:500]
                error_msg += f"\n响应: {err_detail}"
            raise gr.Error(error_msg)
        except gr.Error:
            raise
        except Exception as e:
            raise gr.Error(f"图生图失败: {str(e)}")

    def download_image(self, url: str, prefix: str = "agnes") -> str:
        """下载图片到本地"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        filename = f"{prefix}_{timestamp}.png"
        filepath = OUTPUT_DIR / filename

        response = requests.get(url, timeout=60)
        response.raise_for_status()

        with open(filepath, "wb") as f:
            f.write(response.content)

        return str(filepath)

    def text_to_video(
        self,
        prompt: str,
        duration: int = 5,
        image_url: str = None,
    ) -> str:
        """文生视频 - 提交任务并轮询结果，参考 Agnes 官方 API 格式"""
        try:
            url = f"{str(self.client.base_url).rstrip('/')}/videos"
            headers = {
                "Authorization": f"Bearer {self.client.api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": VIDEO_MODEL,
                "prompt": prompt,
                "duration": duration,
            }
            if image_url:
                payload["image"] = image_url

            print(f"🎬 提交视频请求: {url}")
            print(f"🎬 payload: {json.dumps(payload, ensure_ascii=False)}")

            resp = requests.post(url, json=payload, headers=headers, timeout=120)
            print(f"🎬 提交响应码: {resp.status_code}")
            print(f"🎬 提交响应: {resp.text}")
            resp.raise_for_status()
            data = resp.json()

            task_id = data.get("id")
            if not task_id:
                raise gr.Error(f"API 返回中未找到任务 ID: {resp.text}")

            print(f"⏳ 任务已创建: {task_id}，开始轮询...")

            max_wait = 600
            poll_interval = 5
            waited = 0
            retry_count = 0

            while waited < max_wait:
                try:
                    poll_url = f"{str(self.client.base_url).rstrip('/')}/videos/{task_id}"
                    status_resp = requests.get(poll_url, headers=headers, timeout=30)
                    status_resp.raise_for_status()
                    status_data = status_resp.json()
                except Exception as poll_err:
                    retry_count += 1
                    if retry_count < 10:
                        wait_time = 2 ** retry_count
                        print(f"⚠️ 查询失败，{wait_time}秒后重试 ({retry_count}/10): {poll_err}")
                        time.sleep(wait_time)
                        waited += wait_time
                        continue
                    else:
                        raise gr.Error(f"查询视频状态失败，已重试10次: {poll_err}")

                status = status_data.get("status", "unknown")
                progress = status_data.get("progress", 0)
                print(f"  状态: {status} | 进度: {progress}%")

                if status in ("succeeded", "completed"):
                    video_url = status_data.get("url") or status_data.get("remixed_from_video_id")
                    if not video_url:
                        raise gr.Error(f"视频生成完成但未找到 URL: {json.dumps(status_data)}")
                    print(f"✅ 视频生成完成: {video_url}")
                    return video_url

                if status in ("failed", "cancelled"):
                    error = status_data.get("error", {})
                    error_msg = error.get("message", str(error)) if isinstance(error, dict) else str(error)
                    raise gr.Error(f"视频生成失败: {error_msg}")

                time.sleep(poll_interval)
                waited += poll_interval

            raise gr.Error("视频生成超时（超过 10 分钟未返回结果）")

        except requests.exceptions.RequestException as e:
            error_msg = f"视频生成失败: {str(e)}"
            if hasattr(e, "response") and e.response is not None:
                error_msg += f"\n响应: {e.response.text}"
            raise gr.Error(error_msg)

    def download_video(self, url: str, prefix: str = "agnes_video") -> str:
        """下载视频到本地"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        filename = f"{prefix}_{timestamp}.mp4"
        filepath = OUTPUT_DIR / filename

        print(f"⬇️ 下载视频: {url}")
        response = requests.get(url, timeout=300, stream=True)
        response.raise_for_status()

        with open(filepath, "wb") as f:
            for chunk in response.iter_content(chunk_size=1024 * 1024):
                if chunk:
                    f.write(chunk)

        print(f"✅ 已保存到: {filepath}")
        return str(filepath)

    @staticmethod
    def _extract_video_url(data: dict) -> Optional[str]:
        """从 API 响应中抽取视频 URL（兼容多种结构）"""
        # OpenAI 风格: {"data": [{"url": "..."}]}
        data_list = data.get("data") or data.get("result") or data.get("output")
        if isinstance(data_list, list):
            for item in data_list:
                if isinstance(item, str) and item.startswith(("http://", "https://")) and item.endswith((".mp4", ".webm", ".mov")):
                    return item
                if isinstance(item, dict):
                    for key in ("url", "video_url", "video", "file_url"):
                        if item.get(key) and isinstance(item[key], str) and item[key].startswith(("http://", "https://")):
                            return item[key]
                    # item 可能本身就是 {"url": "..."}
                    if "url" in item:
                        return item["url"]
        if isinstance(data_list, str) and data_list.startswith(("http://", "https://")):
            return data_list

        # 直接顶层字段
        for key in ("url", "video_url", "video", "file_url"):
            if data.get(key) and isinstance(data[key], str) and data[key].startswith(("http://", "https://")):
                return data[key]

        return None

    @staticmethod
    def _extract_task_id(data: dict) -> Optional[str]:
        """从响应中抽取任务 ID"""
        for key in ("id", "task_id", "job_id", "request_id", "tracking_id"):
            if data.get(key) and isinstance(data[key], str):
                return data[key]
            if isinstance(data.get("data"), dict) and data["data"].get(key):
                return data["data"][key]
        return None

    @staticmethod
    def _extract_task_status(data: dict) -> Optional[str]:
        """从响应中抽取任务状态"""
        for key in ("status", "state", "status_code"):
            if data.get(key) and isinstance(data[key], str):
                return data[key]
            if isinstance(data.get("data"), dict) and data["data"].get(key):
                return data["data"][key]
        return None


# ==================== 历史记录管理 ====================

def load_history() -> List[dict]:
    """加载历史记录"""
    if HISTORY_FILE.exists():
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def save_history(history: List[dict]):
    """保存历史记录"""
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)


def add_to_history(prompt: str, image_paths: List[str], mode: str = "text2image"):
    """添加到历史记录"""
    history = load_history()
    history.insert(0, {
        "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "mode": mode,
        "prompt": prompt,
        "images": image_paths
    })
    # 最多保留 100 条
    history = history[:100]
    save_history(history)


# ==================== Gradio 界面 ====================

CUSTOM_CSS = """
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;500&display=swap');

/* ===== Theme Variables: Dark (default) ===== */
gradio-app[data-theme="dark"],
:root,
.gradio-container[data-theme="dark"],
body[data-theme="dark"] {
    --bg-primary: #0A0A0F;
    --bg-secondary: #13131C;
    --bg-card: #1A1A26;
    --bg-elevated: #232333;
    --bg-input: #0E0E16;
    --accent: #FF6B35;
    --accent-hover: #FF8555;
    --accent-soft: rgba(255, 107, 53, 0.15);
    --accent-glow: rgba(255, 107, 53, 0.4);
    --text-primary: #FFFFFF;
    --text-secondary: #D0D0DC;
    --text-muted: #9090A8;
    --border: rgba(255, 255, 255, 0.10);
    --border-hover: rgba(255, 255, 255, 0.20);
    --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.4);
    --shadow-md: 0 8px 24px rgba(0, 0, 0, 0.5);
    --btn-primary-text: #0A0A0F;
}

/* ===== Theme Variables: Light ===== */
gradio-app[data-theme="light"],
body[data-theme="light"] {
    --bg-primary: #F7F7F4;
    --bg-secondary: #EFEFEA;
    --bg-card: #FFFFFF;
    --bg-elevated: #F2F1EC;
    --bg-input: #FFFFFF;
    --accent: #E85A25;
    --accent-hover: #FF6B35;
    --accent-soft: rgba(232, 90, 37, 0.12);
    --accent-glow: rgba(232, 90, 37, 0.3);
    --text-primary: #0F0F1A;
    --text-secondary: #3A3A4A;
    --text-muted: #80808E;
    --border: rgba(0, 0, 0, 0.10);
    --border-hover: rgba(0, 0, 0, 0.20);
    --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.06);
    --shadow-md: 0 8px 24px rgba(0, 0, 0, 0.10);
    --btn-primary-text: #FFFFFF;
}

* { box-sizing: border-box !important; }

/* ===== 强制应用到 gradio-app 元素下所有内容（element selector 优先级高于 .gradio-container-x-x-x） ===== */
gradio-app {
    background: var(--bg-primary) !important;
    color: var(--text-primary) !important;
    display: block !important;
    min-height: 100vh !important;
}

gradio-app,
gradio-app * {
    color: var(--text-primary) !important;
}

gradio-app .gradio-container,
gradio-app [class*="gradio-container"] {
    background: var(--bg-primary) !important;
    color: var(--text-primary) !important;
    max-width: 1400px !important;
    margin: 0 auto !important;
    padding: 2.5rem 2rem 4rem 2rem !important;
    width: 100% !important;
    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif !important;
}

/* 覆盖 Gradio 内置容器背景 */
gradio-app .dark,
gradio-app [class*="gradio-container-"] {
    background: var(--bg-primary) !important;
    color: var(--text-primary) !important;
}

/* ===== Hero Header ===== */
.hero-header {
    padding: 1rem 0 2.5rem 0 !important;
    position: relative !important;
    display: flex !important;
    justify-content: space-between !important;
    align-items: flex-start !important;
    gap: 2rem !important;
    flex-wrap: wrap !important;
    background: transparent !important;
}

.hero-content { flex: 1; min-width: 300px; }

.hero-eyebrow {
    display: inline-flex !important;
    align-items: center !important;
    gap: 0.5rem !important;
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 0.72rem !important;
    font-weight: 500 !important;
    letter-spacing: 0.15em !important;
    text-transform: uppercase !important;
    color: var(--accent) !important;
    margin-bottom: 1.25rem !important;
    padding: 0.45rem 1rem !important;
    background: var(--accent-soft) !important;
    border: 1px solid var(--border) !important;
    border-radius: 100px !important;
}

.hero-eyebrow::before {
    content: '' !important;
    width: 6px !important;
    height: 6px !important;
    background: var(--accent) !important;
    border-radius: 50% !important;
    box-shadow: 0 0 8px var(--accent-glow) !important;
}

.hero-title {
    font-family: 'Space Grotesk', sans-serif !important;
    font-size: 4rem !important;
    font-weight: 700 !important;
    letter-spacing: -0.04em !important;
    line-height: 0.95 !important;
    margin: 0 0 1rem 0 !important;
    color: var(--text-primary) !important;
    background: none !important;
    -webkit-text-fill-color: var(--text-primary) !important;
}

.hero-title .accent {
    font-style: italic !important;
    font-weight: 300 !important;
    background: linear-gradient(135deg, var(--accent) 0%, #FFB088 100%) !important;
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    background-clip: text !important;
}

.hero-subtitle {
    font-size: 1.05rem !important;
    color: var(--text-secondary) !important;
    max-width: 600px !important;
    line-height: 1.6 !important;
    margin-bottom: 1.5rem !important;
    background: transparent !important;
}

.hero-links {
    display: flex !important;
    gap: 1.5rem !important;
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 0.78rem !important;
}

.hero-links a {
    color: var(--text-muted) !important;
    text-decoration: none !important;
    padding-bottom: 2px !important;
    border-bottom: 1px solid var(--border) !important;
    transition: all 0.2s ease !important;
}

.hero-links a:hover {
    color: var(--accent) !important;
    border-bottom-color: var(--accent) !important;
}

/* ===== Theme Toggle ===== */
.theme-toggle {
    display: flex !important;
    align-items: center !important;
    gap: 0.75rem !important;
    background: var(--bg-card) !important;
    border: 1px solid var(--border) !important;
    border-radius: 100px !important;
    padding: 0.4rem 0.4rem 0.4rem 1rem !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
    user-select: none !important;
    flex-shrink: 0 !important;
}

.theme-toggle:hover {
    border-color: var(--border-hover) !important;
    box-shadow: var(--shadow-sm) !important;
}

.theme-toggle-label {
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 0.72rem !important;
    font-weight: 500 !important;
    letter-spacing: 0.08em !important;
    text-transform: uppercase !important;
    color: var(--text-secondary) !important;
}

.theme-toggle-icon {
    width: 28px !important;
    height: 28px !important;
    border-radius: 50% !important;
    background: var(--accent) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-size: 0.85rem !important;
    flex-shrink: 0 !important;
    color: #FFF !important;
}

/* ===== Tabs ===== */
gradio-app .tabs,
gradio-app [role="tablist"] {
    background: transparent !important;
    border: none !important;
    margin-top: 0.5rem !important;
}

gradio-app .tab-nav,
gradio-app [role="tablist"] {
    background: var(--bg-secondary) !important;
    border: 1px solid var(--border) !important;
    border-radius: 14px !important;
    padding: 6px !important;
    margin-bottom: 2rem !important;
    display: inline-flex !important;
    gap: 4px !important;
    box-shadow: var(--shadow-sm) !important;
}

gradio-app .tab-nav button,
gradio-app [role="tab"] {
    background: transparent !important;
    border: none !important;
    border-radius: 10px !important;
    color: var(--text-muted) !important;
    font-family: 'Space Grotesk', sans-serif !important;
    font-weight: 500 !important;
    font-size: 0.875rem !important;
    padding: 0.7rem 1.5rem !important;
    transition: all 0.2s ease !important;
    white-space: nowrap !important;
}

gradio-app .tab-nav button.selected,
gradio-app [role="tab"][aria-selected="true"] {
    color: var(--text-primary) !important;
    background: var(--bg-card) !important;
    box-shadow: var(--shadow-sm) !important;
    font-weight: 600 !important;
}

gradio-app .tab-nav button:hover:not(.selected),
gradio-app [role="tab"]:hover:not([aria-selected="true"]) {
    color: var(--text-secondary) !important;
    background: var(--accent-soft) !important;
}

/* ===== Cards & Panels ===== */
gradio-app .block,
gradio-app .gradio-box,
gradio-app .panel,
gradio-app .form,
gradio-app [class*="-form"] {
    background: var(--bg-card) !important;
    border: 1px solid var(--border) !important;
    border-radius: 16px !important;
    box-shadow: var(--shadow-sm) !important;
    color: var(--text-primary) !important;
}

/* ===== Inputs ===== */
gradio-app input[type="text"],
gradio-app input[type="password"],
gradio-app input[type="number"],
gradio-app input[type="email"],
gradio-app textarea,
gradio-app input {
    background: var(--bg-input) !important;
    border: 1px solid var(--border) !important;
    color: var(--text-primary) !important;
    border-radius: 10px !important;
    padding: 0.85rem 1rem !important;
    font-size: 0.95rem !important;
    font-family: 'DM Sans', sans-serif !important;
    transition: all 0.2s ease !important;
    -webkit-text-fill-color: var(--text-primary) !important;
}

gradio-app input[type="text"]:focus,
gradio-app input[type="password"]:focus,
gradio-app input[type="number"]:focus,
gradio-app input[type="email"]:focus,
gradio-app textarea:focus,
gradio-app input:focus {
    border-color: var(--accent) !important;
    box-shadow: 0 0 0 3px var(--accent-soft) !important;
    outline: none !important;
    color: var(--text-primary) !important;
    -webkit-text-fill-color: var(--text-primary) !important;
}

gradio-app input::placeholder,
gradio-app textarea::placeholder {
    color: var(--text-muted) !important;
    -webkit-text-fill-color: var(--text-muted) !important;
    opacity: 1 !important;
}

/* ===== Labels ===== */
gradio-app label,
gradio-app .label,
gradio-app span.label,
gradio-app .gr-input-label,
gradio-app .label-text,
gradio-app span.label-text {
    color: var(--text-secondary) !important;
    font-family: 'Space Grotesk', sans-serif !important;
    font-weight: 500 !important;
    font-size: 0.78rem !important;
    letter-spacing: 0.06em !important;
    text-transform: uppercase !important;
    margin-bottom: 0.5rem !important;
}

/* ===== Buttons ===== */
gradio-app button.primary,
gradio-app .primary,
gradio-app button[variant="primary"] {
    background: var(--accent) !important;
    color: var(--btn-primary-text) !important;
    -webkit-text-fill-color: var(--btn-primary-text) !important;
    font-family: 'Space Grotesk', sans-serif !important;
    font-weight: 600 !important;
    font-size: 0.95rem !important;
    border: none !important;
    border-radius: 10px !important;
    padding: 0.85rem 2rem !important;
    transition: all 0.2s ease !important;
    box-shadow: 0 4px 16px var(--accent-soft) !important;
}

gradio-app button.primary:hover,
gradio-app .primary:hover {
    background: var(--accent-hover) !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 8px 24px var(--accent-glow) !important;
    color: var(--btn-primary-text) !important;
}

gradio-app button.secondary,
gradio-app .secondary,
gradio-app button:not(.primary) {
    background: var(--bg-elevated) !important;
    color: var(--text-secondary) !important;
    -webkit-text-fill-color: var(--text-secondary) !important;
    font-family: 'Space Grotesk', sans-serif !important;
    font-weight: 500 !important;
    border: 1px solid var(--border) !important;
    border-radius: 10px !important;
    padding: 0.75rem 1.5rem !important;
    transition: all 0.2s ease !important;
}

gradio-app button.secondary:hover,
gradio-app button:not(.primary):hover {
    background: var(--bg-card) !important;
    color: var(--text-primary) !important;
    border-color: var(--border-hover) !important;
    -webkit-text-fill-color: var(--text-primary) !important;
}

/* ===== Dropdowns ===== */
gradio-app select,
gradio-app .gr-dropdown,
gradio-app .dropdown {
    background: var(--bg-input) !important;
    border: 1px solid var(--border) !important;
    color: var(--text-primary) !important;
    border-radius: 10px !important;
    font-family: 'DM Sans', sans-serif !important;
}

/* ===== Sliders ===== */
gradio-app input[type="range"] {
    accent-color: var(--accent) !important;
}

/* ===== Gallery ===== */
gradio-app .gallery,
gradio-app .gr-gallery,
gradio-app [class*="gallery"] {
    background: var(--bg-card) !important;
    border: 1px solid var(--border) !important;
    border-radius: 16px !important;
    min-height: 320px !important;
    padding: 1rem !important;
}

/* ===== Image Upload ===== */
gradio-app .image-container,
gradio-app [data-testid="image"] {
    background: var(--bg-input) !important;
    border: 2px dashed var(--border) !important;
    border-radius: 12px !important;
    transition: all 0.2s ease !important;
}

gradio-app .image-container:hover {
    border-color: var(--accent) !important;
    background: var(--accent-soft) !important;
}

/* ===== Video ===== */
gradio-app video {
    background: var(--bg-input) !important;
    border-radius: 12px !important;
    border: 1px solid var(--border) !important;
}

/* ===== Checkbox ===== */
gradio-app input[type="checkbox"] {
    accent-color: var(--accent) !important;
}

gradio-app .checkbox-group label,
gradio-app .gr-check-group label {
    color: var(--text-primary) !important;
    text-transform: none !important;
    letter-spacing: normal !important;
}

/* ===== Accordion ===== */
gradio-app .accordion,
gradio-app [class*="accordion"] {
    background: var(--bg-card) !important;
    border: 1px solid var(--border) !important;
    border-radius: 14px !important;
    overflow: hidden !important;
    margin-bottom: 2rem !important;
    color: var(--text-primary) !important;
}

/* ===== Status / Non-interactive Textboxes ===== */
gradio-app textarea[disabled],
gradio-app textarea[readonly] {
    background: var(--bg-input) !important;
    color: var(--text-secondary) !important;
    -webkit-text-fill-color: var(--text-secondary) !important;
    border-left: 2px solid var(--accent) !important;
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 0.85rem !important;
}

/* ===== Footer Hidden ===== */
gradio-app footer { display: none !important; }
gradio-app .built-with { display: none !important; }
gradio-app .gradio-meta { display: none !important; }

/* ===== Scrollbar ===== */
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-track { background: var(--bg-primary); }
::-webkit-scrollbar-thumb {
    background: var(--bg-elevated);
    border-radius: 5px;
    border: 2px solid var(--bg-primary);
}
::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }

/* ===== Selection ===== */
::selection {
    background: var(--accent-soft);
    color: var(--text-primary);
}

/* ===== Responsive ===== */
@media (max-width: 768px) {
    .hero-title { font-size: 2.75rem !important; }
    .gradio-container { padding: 1.5rem 1rem !important; }
    .tab-nav { overflow-x: auto !important; }
    .hero-header { flex-direction: column !important; }
}
"""

def create_ui():
    """创建 Gradio 界面"""

    with gr.Blocks(
        title="Agnes Creator Studio",
    ) as demo:

        gr.HTML("""
        <div class="hero-header">
            <div class="hero-content">
                <div class="hero-eyebrow">Agnes AI · Creative Studio</div>
                <h1 class="hero-title">Where ideas<br/>become <span class="accent">images</span>.</h1>
                <p class="hero-subtitle">AI 驱动的图像与视频创作工具，支持 4K 高清输出，融合专业级画质增强与创意控制。</p>
                <div class="hero-links">
                    <a href="https://agnes-ai.com/doc/agnes-image-21-flash" target="_blank">图像 API ↗</a>
                    <a href="https://agnes-ai.com/doc/agnes-video-v20" target="_blank">视频 API ↗</a>
                    <a href="https://github.com/you-want/agnes-image-tool" target="_blank">GitHub ↗</a>
                </div>
            </div>
            <div class="theme-toggle" id="themeToggle">
                <span class="theme-toggle-label" id="themeLabel">DARK</span>
                <div class="theme-toggle-icon" id="themeIcon">◐</div>
            </div>
        </div>
        """)

        # API 配置区域
        with gr.Accordion("⚙️ API 配置", open=not DEFAULT_API_KEY):
            with gr.Row():
                api_key_input = gr.Textbox(
                    label="API Key",
                    placeholder="输入你的 Agnes API Key",
                    value=DEFAULT_API_KEY,
                    type="password",
                    scale=2
                )
                base_url_input = gr.Textbox(
                    label="Base URL",
                    value=DEFAULT_BASE_URL,
                    scale=2
                )
                model_input = gr.Textbox(
                    label="模型（文生图）",
                    value=DEFAULT_MODEL,
                    scale=1
                )
            save_config_btn = gr.Button("💾 保存配置（下次自动填充）", size="sm")
            save_config_msg = gr.Textbox(label="", interactive=False, visible=False)

        # 主界面标签页
        with gr.Tabs():
            # ===== 文生图 =====
            with gr.TabItem("Text → Image"):
                with gr.Row():
                    with gr.Column(scale=1):
                        prompt_input = gr.Textbox(
                            label="提示词 (Prompt)",
                            placeholder="描述你想要生成的图片，例如：一只穿着西装的柴犬坐在办公桌前，赛博朋克风格",
                            lines=4,
                            max_lines=8
                        )
                        negative_prompt_input = gr.Textbox(
                            label="负面提示词 (Negative Prompt)",
                            placeholder="描述你不想要的内容，例如：模糊、低质量、变形",
                            lines=2
                        )

                        with gr.Row():
                            size_dropdown = gr.Dropdown(
                                label="尺寸",
                                choices=[
                                    "1024x1024 (1:1 正方形)",
                                    "1024x1792 (9:16 抖音竖屏)",
                                    "1792x1024 (16:9 抖音横屏)",
                                    "864x1536 (9:16 抖音封面)",
                                    "1536x864 (16:9 抖音封面)",
                                ],
                                value="1024x1024 (1:1 正方形)"
                            )
                            num_images = gr.Slider(
                                label="生成数量",
                                minimum=1,
                                maximum=4,
                                value=1,
                                step=1
                            )

                        generate_btn = gr.Button(
                            "🚀 生成图片",
                            variant="primary",
                            size="lg"
                        )

                    with gr.Column(scale=1):
                        output_gallery = gr.Gallery(
                            label="生成结果",
                            columns=2,
                            rows=2,
                            height="auto",
                            object_fit="contain"
                        )
                        output_info = gr.Textbox(
                            label="状态",
                            interactive=False,
                            value="等待生成..."
                        )

            # ===== 图生图 =====
            with gr.TabItem("Image → Image"):
                with gr.Row():
                    with gr.Column(scale=1):
                        source_image = gr.Image(
                            label="上传参考图片",
                            type="filepath",
                            height=300
                        )
                        img2img_prompt = gr.Textbox(
                            label="修改描述",
                            placeholder="描述你想要如何修改这张图片，例如：转成赛博朋克风格，雨夜霓虹",
                            lines=3
                        )
                        img2img_negative = gr.Textbox(
                            label="负面提示词（不想出现的内容）",
                            value="low quality, blurry, distorted, deformed, watermark, text, ugly",
                            lines=2
                        )
                        with gr.Row():
                            img2img_mode = gr.Dropdown(
                                label="模式",
                                choices=[
                                    "风格转换",
                                    "细节增强",
                                    "创意重绘",
                                    "保持构图",
                                ],
                                value="风格转换"
                            )
                            img2img_size = gr.Dropdown(
                                label="输出尺寸",
                                choices=[
                                    "1024x1024 (1:1)",
                                    "1024x1792 (9:16 竖屏)",
                                    "1792x1024 (16:9 横屏)",
                                    "864x1536 (9:16 封面)",
                                    "1536x864 (16:9 封面)",
                                ],
                                value="1024x1024 (1:1)"
                            )
                        with gr.Row():
                            img2img_strength = gr.Slider(
                                label="创意强度（越低越像原图）",
                                minimum=0.1,
                                maximum=1.0,
                                value=0.7,
                                step=0.05
                            )
                        with gr.Row():
                            img2img_num = gr.Slider(
                                label="生成数量",
                                minimum=1,
                                maximum=4,
                                value=1,
                                step=1
                            )
                            img2img_quality = gr.Checkbox(
                                label="自动增强画质",
                                value=True
                            )
                        img2img_btn = gr.Button(
                            "🚀 生成变体",
                            variant="primary",
                            size="lg"
                        )

                    with gr.Column(scale=1):
                        img2img_output = gr.Gallery(
                            label="生成结果",
                            columns=2,
                            rows=2,
                            height="auto"
                        )
                        img2img_info = gr.Textbox(
                            label="状态",
                            interactive=False,
                            value="等待生成..."
                        )

            # ===== 文生视频 =====
            with gr.TabItem("Text → Video"):
                with gr.Row():
                    with gr.Column(scale=1):
                        video_prompt = gr.Textbox(
                            label="视频描述",
                            placeholder="描述你想生成的视频，例如：夕阳下的海浪拍打礁石，镜头缓慢推近",
                            lines=4,
                            max_lines=8
                        )
                        with gr.Row():
                            video_duration = gr.Dropdown(
                                label="时长（秒）",
                                choices=[3, 5, 8, 10, 15],
                                value=5,
                            )
                        video_btn = gr.Button(
                            "🚀 生成视频",
                            variant="primary",
                            size="lg"
                        )

                    with gr.Column(scale=1):
                        video_output = gr.Video(
                            label="生成的视频",
                            height=400,
                            autoplay=False
                        )
                        video_info = gr.Textbox(
                            label="状态",
                            interactive=False,
                            value="等待生成..."
                        )

            # ===== 批量生成 =====
            with gr.TabItem("Batch"):
                batch_prompts = gr.Textbox(
                    label="批量提示词（每行一个）",
                    placeholder="一只猫\n一只狗\n一座山",
                    lines=10
                )
                with gr.Row():
                    batch_size = gr.Dropdown(
                        label="尺寸",
                        choices=[
                            "1024x1024 (1:1 正方形)",
                            "1024x1792 (9:16 抖音竖屏)",
                            "1792x1024 (16:9 抖音横屏)",
                            "864x1536 (9:16 抖音封面)",
                            "1536x864 (16:9 抖音封面)",
                        ],
                        value="1024x1024 (1:1 正方形)"
                    )
                    batch_btn = gr.Button("🚀 批量生成", variant="primary")

                batch_output = gr.Gallery(
                    label="批量结果",
                    columns=4,
                    rows=4,
                    height="auto"
                )
                batch_info = gr.Textbox(
                    label="状态",
                    interactive=False,
                    value="等待生成..."
                )

            # ===== 历史记录 =====
            with gr.TabItem("History"):
                refresh_history_btn = gr.Button("🔄 刷新")
                history_gallery = gr.Gallery(
                    label="历史图片",
                    columns=4,
                    rows=4,
                    height="auto"
                )
                history_text = gr.JSON(label="历史详情")

        # ==================== 事件处理 ====================

        def do_save_config(api_key, base_url, model):
            """保存配置到本地文件"""
            config = {"api_key": api_key, "base_url": base_url, "model": model}
            save_config(config)
            return gr.Textbox(value="✅ 配置已保存，下次启动自动加载", visible=True)

        def generate_text2image(
            api_key, base_url, model,
            prompt, negative_prompt, size, n
        ):
            """文生图处理"""
            if not api_key:
                return [], "❌ 请先配置 API Key"
            if not prompt.strip():
                return [], "❌ 请输入提示词"

            try:
                gen = AgnesImageGenerator(api_key, base_url)

                urls = gen.text_to_image(
                    prompt=prompt,
                    negative_prompt=negative_prompt,
                    size=parse_size(size),
                    n=int(n),
                )

                # 下载图片
                local_paths = []
                for url in urls:
                    path = gen.download_image(url, prefix="agnes_t2i")
                    local_paths.append(path)

                # 保存历史
                add_to_history(prompt, local_paths, "text2image")

                return local_paths, f"✅ 生成成功！共 {len(local_paths)} 张图片"

            except Exception as e:
                return [], f"❌ 错误: {str(e)}"

        def generate_image2image(
            api_key, base_url, model,
            image_path, prompt, negative, mode, size, strength, n, quality
        ):
            """图生图处理"""
            if not api_key:
                return [], "❌ 请先配置 API Key"
            if not image_path:
                return [], "❌ 请上传参考图片"
            if not prompt.strip():
                return [], "❌ 请输入修改描述"

            mode_prompts = {
                "风格转换": "",
                "细节增强": "enhance details, sharpen, improve quality, add fine textures, ",
                "创意重绘": "creative reinterpretation, artistic, ",
                "保持构图": "preserve composition and subject, same layout, ",
            }
            enhanced_prompt = mode_prompts.get(mode, "") + prompt

            try:
                gen = AgnesImageGenerator(api_key, base_url)

                urls = gen.image_to_image(
                    image_path=image_path,
                    prompt=enhanced_prompt,
                    size=parse_size(size),
                    n=int(n),
                    strength=float(strength),
                    negative_prompt=negative,
                    enhance_quality=quality,
                )

                local_paths = []
                for url in urls:
                    path = gen.download_image(url, prefix="agnes_i2i")
                    local_paths.append(path)

                add_to_history(prompt, local_paths, "image2image")

                return local_paths, f"✅ 生成成功！共 {len(local_paths)} 张图片"

            except Exception as e:
                return [], f"❌ 错误: {str(e)}"

        def generate_text2video(
            api_key, base_url, model,
            prompt, duration
        ):
            """文生视频处理"""
            if not api_key:
                return None, "❌ 请先配置 API Key"
            if not prompt.strip():
                return None, "❌ 请输入视频描述"

            try:
                gen = AgnesImageGenerator(api_key, base_url)
                video_url = gen.text_to_video(
                    prompt=prompt,
                    duration=int(duration),
                )

                # 下载视频到本地
                local_path = gen.download_video(video_url)

                # 保存历史
                add_to_history(prompt, [local_path], "text2video")

                return local_path, f"✅ 视频生成成功！已保存到 outputs 目录"

            except Exception as e:
                return None, f"❌ 错误: {str(e)}"

        def generate_batch(
            api_key, base_url, model,
            prompts_text, size
        ):
            """批量生成处理"""
            if not api_key:
                return [], "❌ 请先配置 API Key"

            prompts = [p.strip() for p in prompts_text.split("\n") if p.strip()]
            if not prompts:
                return [], "❌ 请输入至少一个提示词"

            try:
                gen = AgnesImageGenerator(api_key, base_url)

                all_paths = []
                for prompt in prompts:
                    urls = gen.text_to_image(prompt=prompt, size=parse_size(size), n=1)
                    for url in urls:
                        path = gen.download_image(url, prefix="agnes_batch")
                        all_paths.append(path)
                    add_to_history(prompt, [path], "batch")

                return all_paths, f"✅ 批量生成完成！共 {len(all_paths)} 张图片"

            except Exception as e:
                return [], f"❌ 错误: {str(e)}"

        def load_history_gallery():
            """加载历史记录到画廊"""
            history = load_history()
            all_images = []
            for item in history:
                all_images.extend(item.get("images", []))
            return all_images[:50], history[:20]

        # 绑定事件
        save_config_btn.click(
            fn=do_save_config,
            inputs=[api_key_input, base_url_input, model_input],
            outputs=[save_config_msg]
        )

        generate_btn.click(
            fn=generate_text2image,
            inputs=[
                api_key_input, base_url_input, model_input,
                prompt_input, negative_prompt_input,
                size_dropdown, num_images
            ],
            outputs=[output_gallery, output_info]
        )

        img2img_btn.click(
            fn=generate_image2image,
            inputs=[
                api_key_input, base_url_input, model_input,
                source_image, img2img_prompt, img2img_negative,
                img2img_mode, img2img_size, img2img_strength,
                img2img_num, img2img_quality
            ],
            outputs=[img2img_output, img2img_info]
        )

        video_btn.click(
            fn=generate_text2video,
            inputs=[
                api_key_input, base_url_input, model_input,
                video_prompt, video_duration
            ],
            outputs=[video_output, video_info]
        )

        batch_btn.click(
            fn=generate_batch,
            inputs=[
                api_key_input, base_url_input, model_input,
                batch_prompts, batch_size
            ],
            outputs=[batch_output, batch_info]
        )

        refresh_history_btn.click(
            fn=load_history_gallery,
            outputs=[history_gallery, history_text]
        )

        # 页面加载时刷新历史
        demo.load(fn=load_history_gallery, outputs=[history_gallery, history_text])

    return demo


# ==================== 启动 ====================

if __name__ == "__main__":
    demo = create_ui()
    demo.launch(
        server_name="0.0.0.0",
        server_port=7860,
        share=False,
        show_error=True,
        css=CUSTOM_CSS,
        theme=gr.themes.Base(
            primary_hue=gr.themes.Color(
                c50="#FFF1EA", c100="#FFD9C2", c200="#FFB088",
                c300="#FF8E5E", c400="#FF7A45", c500="#FF6B35",
                c600="#E85A25", c700="#C24A1E", c800="#8C3415",
                c900="#5C220E", c950="#3D160A",
            ),
            secondary_hue="slate",
            neutral_hue="slate",
            font=[gr.themes.GoogleFont("Space Grotesk"), "sans-serif"],
        ),
        head="""
        <script>
            // 主题切换 - 在页面加载时立即应用保存的主题，避免闪烁
            (function() {
                try {
                    const saved = localStorage.getItem('agnes-theme') || 'dark';
                    document.documentElement.setAttribute('data-theme', saved);
                    if (document.body) document.body.setAttribute('data-theme', saved);
                } catch (e) {
                    document.documentElement.setAttribute('data-theme', 'dark');
                }
            })();

            window.toggleTheme = function() {
                const current = document.body.getAttribute('data-theme') || document.documentElement.getAttribute('data-theme') || 'dark';
                const next = current === 'dark' ? 'light' : 'dark';
                document.body.setAttribute('data-theme', next);
                document.documentElement.setAttribute('data-theme', next);
                localStorage.setItem('agnes-theme', next);
                updateThemeIcon(next);
            };

            window.updateThemeIcon = function(theme) {
                const label = document.getElementById('themeLabel');
                const icon = document.getElementById('themeIcon');
                if (label) label.textContent = theme.toUpperCase();
                if (icon) icon.textContent = theme === 'dark' ? '◑' : '◐';
            };

            // 监听 DOM 变化，绑定切换按钮（Gradio 6.0 动态渲染）
            const bindThemeToggle = () => {
                const toggle = document.getElementById('themeToggle');
                if (toggle && !toggle.dataset.bound) {
                    toggle.addEventListener('click', window.toggleTheme);
                    toggle.dataset.bound = 'true';
                    const current = document.body.getAttribute('data-theme') || 'dark';
                    updateThemeIcon(current);
                }
            };

            bindThemeToggle();
            setInterval(bindThemeToggle, 500);
        </script>
        """,
    )
