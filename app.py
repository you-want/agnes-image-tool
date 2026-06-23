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
IMG2IMG_MODEL = "agnes-image-2.0-flash"
VIDEO_MODEL = "agnes-video-2.0"

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
            url = f"{self.client.base_url}/images/generations"
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
        n: int = 1
    ) -> List[str]:
        """图生图 - 使用 images.generate + extra_body"""
        try:
            # 先上传图片获取 URL（Agnes img2img 需要图片 URL）
            with open(image_path, "rb") as f:
                image_data = f.read()

            # 通过 OpenAI files API 上传，或直接使用 base64 data URI
            # Agnes img2img 支持 image URL 列表
            import base64
            b64 = base64.b64encode(image_data).decode("utf-8")
            image_url = f"data:image/png;base64,{b64}"

            response = self.client.images.generate(
                model=IMG2IMG_MODEL,
                prompt=prompt,
                n=n,
                size=size,
                extra_body={
                    "tags": ["img2img"],
                    "image": [image_url],
                }
            )

            urls = [item.url for item in response.data]
            return urls

        except Exception as e:
            raise gr.Error(f"生成失败: {str(e)}")

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
        width: int = 1280,
        height: int = 720,
        duration: int = 5,
    ) -> str:
        """文生视频 - 提交任务并轮询结果"""
        try:
            url = f"{self.client.base_url}/videos/generations"
            headers = {
                "Authorization": f"Bearer {self.client.api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": VIDEO_MODEL,
                "prompt": prompt,
                "width": width,
                "height": height,
                "duration": duration,
            }

            print(f"🎬 提交视频请求: {url}")
            print(f"🎬 payload: {json.dumps(payload, ensure_ascii=False)}")

            response = requests.post(url, json=payload, headers=headers, timeout=60)
            print(f"🎬 提交响应码: {response.status_code}")
            print(f"🎬 提交响应: {response.text}")
            response.raise_for_status()
            data = response.json()

            # ---- 情况 1：响应中直接含视频 URL ----
            video_url = self._extract_video_url(data)
            if video_url:
                return video_url

            # ---- 情况 2：返回任务 ID，需要轮询 ----
            task_id = self._extract_task_id(data)
            if not task_id:
                raise gr.Error("API 返回中未找到视频 URL 或任务 ID")

            print(f"⏳ 开始轮询任务 {task_id} ...")
            max_wait = 600
            poll_interval = 3
            waited = 0

            while waited < max_wait:
                poll_url = f"{self.client.base_url}/videos/generations/{task_id}"
                resp = requests.get(poll_url, headers=headers, timeout=30)
                if resp.status_code == 200:
                    result = resp.json()
                    video_url = self._extract_video_url(result)
                    if video_url:
                        print(f"✅ 视频生成完成: {video_url}")
                        return video_url
                    status = self._extract_task_status(result)
                    if status in ("failed", "error", "cancelled"):
                        raise gr.Error(f"视频生成失败: {json.dumps(result, ensure_ascii=False)}")
                else:
                    print(f"⚠️ 轮询状态码 {resp.status_code}: {resp.text}")

                time.sleep(poll_interval)
                waited += poll_interval
                if waited % 15 == 0:
                    print(f"  已等待 {waited} 秒...")

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

def create_ui():
    """创建 Gradio 界面"""

    with gr.Blocks(
        title="Agnes Image 生成器",
    ) as demo:

        gr.Markdown("""
        # 🎨 Agnes Image 2.1 / Video 2.0 生成器
        
        > 基于 Agnes AI 的图像与视频生成 API，支持文生图、图生图、文生视频
        
        📖 [图像文档](https://agnes-ai.com/doc/agnes-image-21-flash) · [视频文档](https://agnes-ai.com/doc/agnes-video-v20)
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
            with gr.TabItem("✏️ 文生图"):
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
            with gr.TabItem("🖼️ 图生图"):
                with gr.Row():
                    with gr.Column(scale=1):
                        source_image = gr.Image(
                            label="上传参考图片",
                            type="filepath",
                            height=300
                        )
                        img2img_prompt = gr.Textbox(
                            label="修改描述",
                            placeholder="描述你想要如何修改这张图片，例如：转成赛博朋克风格",
                            lines=3
                        )
                        img2img_size = gr.Dropdown(
                            label="输出尺寸",
                            choices=[
                                "1024x1024 (1:1 正方形)",
                                "1024x1792 (9:16 抖音竖屏)",
                                "1792x1024 (16:9 抖音横屏)",
                                "864x1536 (9:16 抖音封面)",
                                "1536x864 (16:9 抖音封面)",
                            ],
                            value="1024x1024 (1:1 正方形)"
                        )
                        img2img_num = gr.Slider(
                            label="生成数量",
                            minimum=1,
                            maximum=4,
                            value=1,
                            step=1
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
            with gr.TabItem("🎬 文生视频"):
                with gr.Row():
                    with gr.Column(scale=1):
                        video_prompt = gr.Textbox(
                            label="视频描述",
                            placeholder="描述你想生成的视频，例如：夕阳下的海浪拍打礁石，镜头缓慢推近",
                            lines=4,
                            max_lines=8
                        )
                        with gr.Row():
                            video_size = gr.Dropdown(
                                label="分辨率",
                                choices=[
                                    "480p (854x480 横屏)",
                                    "720p (1280x720 横屏)",
                                    "1080p (1920x1080 横屏)",
                                    "竖屏480p (480x854 抖音封面)",
                                    "竖屏720p (720x1280 抖音竖屏)",
                                    "竖屏1080p (1080x1920 抖音竖屏)",
                                ],
                                value="720p (1280x720 横屏)"
                            )
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
            with gr.TabItem("📋 批量生成"):
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
            with gr.TabItem("📜 历史记录"):
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
            image_path, prompt, size, n
        ):
            """图生图处理"""
            if not api_key:
                return [], "❌ 请先配置 API Key"
            if not image_path:
                return [], "❌ 请上传参考图片"
            if not prompt.strip():
                return [], "❌ 请输入修改描述"

            try:
                gen = AgnesImageGenerator(api_key, base_url)

                urls = gen.image_to_image(
                    image_path=image_path,
                    prompt=prompt,
                    size=parse_size(size),
                    n=int(n)
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
            prompt, size, duration
        ):
            """文生视频处理"""
            if not api_key:
                return None, "❌ 请先配置 API Key"
            if not prompt.strip():
                return None, "❌ 请输入视频描述"

            try:
                gen = AgnesImageGenerator(api_key, base_url)
                dim = parse_video_size(size)
                video_url = gen.text_to_video(
                    prompt=prompt,
                    width=dim["width"],
                    height=dim["height"],
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
                source_image, img2img_prompt, img2img_size, img2img_num
            ],
            outputs=[img2img_output, img2img_info]
        )

        video_btn.click(
            fn=generate_text2video,
            inputs=[
                api_key_input, base_url_input, model_input,
                video_prompt, video_size, video_duration
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
        show_error=True
    )
