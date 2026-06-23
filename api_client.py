"""
Agnes AI API 客户端封装
"""
import json
import time
import requests
from datetime import datetime
from typing import List, Optional
from openai import OpenAI

import gradio as gr

from config import (
    OUTPUT_DIR,
    IMG2IMG_MODEL,
    VIDEO_MODEL,
    QUALITY_PROMPT_SUFFIX,
    NEGATIVE_PROMPT_DEFAULT,
)


class AgnesImageGenerator:
    """Agnes AI 图像/视频生成器"""

    def __init__(self, api_key: str, base_url: str):
        self.client = OpenAI(api_key=api_key, base_url=base_url)

    def text_to_image(
        self,
        prompt: str,
        size: str = "1024x1024",
        n: int = 1,
        enhance_quality: bool = True,
    ) -> List[str]:
        """文生图"""
        try:
            if enhance_quality:
                prompt = prompt + QUALITY_PROMPT_SUFFIX

            print(f"🎨 文生图请求: prompt={prompt[:50]}..., size={size}")

            response = self.client.images.generate(
                model="agnes-image-2.1-flash",
                prompt=prompt,
                n=n,
                size=size,
            )

            urls = [item.url for item in response.data]
            if not urls:
                raise gr.Error("API 返回中未找到图片 URL")
            return urls

        except Exception as e:
            raise gr.Error(f"生成失败: {str(e)}")

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
        aspect_ratio: str = "16:9",
        image_url: str = None,
    ) -> str:
        """文生视频 - 提交任务并轮询结果
        
        参数说明（根据官方文档）：
        - duration: 视频时长（秒），会转换为 num_frames
        - aspect_ratio: 视频比例，会转换为 width/height
        - num_frames 必须满足 8n + 1（如 81, 121, 161, 241, 441）
        - frame_rate 默认 24
        """
        # 时长到帧数的映射（frame_rate=24）
        duration_to_frames = {
            3: 81,    # 81/24 ≈ 3.375秒
            5: 121,   # 121/24 ≈ 5.04秒
            8: 201,   # 201/24 ≈ 8.375秒
            10: 241,  # 241/24 ≈ 10.04秒
            15: 361,  # 361/24 ≈ 15.04秒
        }
        
        # 比例到宽高的映射
        ratio_to_size = {
            "16:9": {"width": 1152, "height": 768},
            "9:16": {"width": 768, "height": 1152},
            "1:1": {"width": 768, "height": 768},
            "4:3": {"width": 1024, "height": 768},
            "3:4": {"width": 768, "height": 1024},
            "21:9": {"width": 1280, "height": 576},
        }
        
        # 获取帧数和尺寸
        num_frames = duration_to_frames.get(duration, 121)  # 默认 5秒
        size = ratio_to_size.get(aspect_ratio, {"width": 1152, "height": 768})
        
        try:
            url = f"{str(self.client.base_url).rstrip('/')}/videos"
            headers = {
                "Authorization": f"Bearer {self.client.api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": VIDEO_MODEL,
                "prompt": prompt,
                "width": size["width"],
                "height": size["height"],
                "num_frames": num_frames,
                "frame_rate": 24,
            }
            if image_url:
                payload["image"] = image_url

            print(f"🎬 提交视频请求: {url}")
            print(f"🎬 payload: {json.dumps(payload, ensure_ascii=False)}")
            print(f"🎬 时长: {duration}秒 → num_frames={num_frames}, frame_rate=24")
            print(f"🎬 比例: {aspect_ratio} → width={size['width']}, height={size['height']}")

            resp = requests.post(url, json=payload, headers=headers, timeout=120)
            print(f"🎬 提交响应码: {resp.status_code}")
            print(f"🎬 提交响应: {resp.text}")
            resp.raise_for_status()
            data = resp.json()

            # 使用 video_id 查询（推荐方式）
            video_id = data.get("video_id") or data.get("id")
            if not video_id:
                raise gr.Error(f"API 返回中未找到任务 ID: {resp.text}")

            print(f"⏳ 任务已创建: {video_id}，开始轮询...")
            print(f"🎬 API 返回时长: {data.get('seconds', 'N/A')}秒, 尺寸: {data.get('size', 'N/A')}")

            max_wait = 600
            poll_interval = 5
            waited = 0
            retry_count = 0

            while waited < max_wait:
                try:
                    # 使用推荐的 video_id 查询方式
                    poll_url = f"https://apihub.agnes-ai.com/agnesapi?video_id={video_id}"
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
                seconds = status_data.get("seconds", "N/A")
                print(f"  状态: {status} | 进度: {progress}% | 时长: {seconds}秒")

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