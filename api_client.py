"""
Agnes AI API 客户端 - 使用 OpenAI SDK 和 requests 混合调用
"""
import json
import time
import requests
import base64
from datetime import datetime
from typing import List, Optional

import gradio as gr
from openai import OpenAI

from config import (
    OUTPUT_DIR,
    T2I_MODEL,
    IMG2IMG_MODEL,
    VIDEO_MODEL,
    RATIO_TO_SIZE,
    DURATION_TO_FRAMES,
    VIDEO_RESOLUTION_PRESETS,
)


class AgnesImageGenerator:
    """Agnes AI 图像/视频生成器"""

    def __init__(self, api_key: str, base_url: str):
        self.api_key = api_key
        self.base_url = base_url.rstrip('/')
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        self.client = OpenAI(api_key=api_key, base_url=base_url)

    # ==================== 图像生成 ====================

    def text_to_image(
        self,
        prompt: str,
        size: str = "1024x1024",
        n: int = 1,
        negative_prompt: str = "",
    ) -> List[str]:
        """文生图 - 直接使用 HTTP 请求调用 API"""
        try:
            print(f" 文生图: prompt={prompt[:50]}..., size={size}, n={n}")

            # 构建请求体
            payload = {
                "model": T2I_MODEL,
                "prompt": prompt,
                "size": size,
                "n": n,
            }
            
            # 添加可选参数
            if negative_prompt:
                payload["negative_prompt"] = negative_prompt

            # 直接调用 API
            url = f"{self.base_url}/images/generations"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            }
            
            print(f" 请求 URL: {url}")
            print(f" 请求体: {json.dumps(payload, ensure_ascii=False)}")
            
            response = requests.post(url, headers=headers, json=payload, timeout=120)
            response.raise_for_status()
            
            result = response.json()
            print(f" 响应: {json.dumps(result, ensure_ascii=False)[:500]}...")
            
            data = result.get("data", [])
            urls = [item.get("url") for item in data if item.get("url")]
            
            if not urls:
                raise gr.Error("API 返回中未找到图片 URL")

            print(f" 成功生成 {len(urls)} 张图片")
            return urls

        except gr.Error:
            raise
        except requests.exceptions.RequestException as e:
            error_msg = str(e)
            if e.response:
                try:
                    error_msg = f"{e.response.status_code} - {e.response.text}"
                except:
                    pass
            raise gr.Error(f"文生图失败: {error_msg}")
        except Exception as e:
            raise gr.Error(f"文生图失败: {str(e)}")

    def image_to_image(
        self,
        image_path: str,
        prompt: str,
        size: str = "1024x1024",
        n: int = 1,
        strength: float = 0.75,
        negative_prompt: str = "",
    ) -> List[str]:
        """图生图 - 直接使用 HTTP 请求调用 API"""
        try:
            with open(image_path, "rb") as f:
                image_data = f.read()
            b64 = base64.b64encode(image_data).decode("utf-8")
            image_url = f"data:image/png;base64,{b64}"

            print(f" 图生图: prompt={prompt[:50]}..., size={size}, strength={strength}")

            # 构建请求体
            payload = {
                "model": IMG2IMG_MODEL,
                "prompt": prompt,
                "size": size,
                "n": n,
                "extra_body": {
                    "image": [image_url],
                    "strength": strength,
                }
            }
            
            if negative_prompt:
                payload["extra_body"]["negative_prompt"] = negative_prompt

            # 直接调用 API
            url = f"{self.base_url}/images/generations"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            }
            
            print(f" 请求 URL: {url}")
            print(f" 请求体: {json.dumps(payload, ensure_ascii=False)[:500]}...")
            
            response = requests.post(url, headers=headers, json=payload, timeout=120)
            response.raise_for_status()
            
            result = response.json()
            print(f" 响应: {json.dumps(result, ensure_ascii=False)[:500]}...")
            
            data = result.get("data", [])
            urls = [item.get("url") for item in data if item.get("url")]
            
            if not urls:
                raise gr.Error("API 返回中未找到图片 URL")

            print(f" 成功生成 {len(urls)} 张图片")
            return urls

        except gr.Error:
            raise
        except requests.exceptions.RequestException as e:
            error_msg = str(e)
            if e.response:
                try:
                    error_msg = f"{e.response.status_code} - {e.response.text}"
                except:
                    pass
            raise gr.Error(f"图生图失败: {error_msg}")
        except Exception as e:
            raise gr.Error(f"图生图失败: {str(e)}")

    # ==================== 视频生成 ====================

    def text_to_video(
        self,
        prompt: str,
        duration: int = 5,
        aspect_ratio: str = "16:9",
        frame_rate: int = 24,
        negative_prompt: str = "",
        seed: Optional[int] = None,
        num_inference_steps: Optional[int] = None,
        width: Optional[int] = None,
        height: Optional[int] = None,
        num_frames: Optional[int] = None,
    ) -> str:
        """文生视频"""
        payload = {"model": VIDEO_MODEL, "prompt": prompt}

        # 使用自定义宽高或根据比例计算
        if width and height:
            payload["width"] = width
            payload["height"] = height
        else:
            size = RATIO_TO_SIZE.get(aspect_ratio, {"width": 1152, "height": 768})
            payload["width"] = size["width"]
            payload["height"] = size["height"]

        # 不同分辨率和宽高比的最大帧数限制
        max_frames_by_resolution = {
            "1080p": 169,
            "720p": 409,
            "480p": 961,
        }
        
        # 根据分辨率获取最大帧数
        resolution = "720p"  # 默认值
        if width and height:
            # 根据宽高估算分辨率
            max_dim = max(width, height)
            if max_dim >= 1920:
                resolution = "1080p"
            elif max_dim >= 1280:
                resolution = "720p"
            else:
                resolution = "480p"
        max_frames = max_frames_by_resolution.get(resolution, 409)

        # 使用自定义帧数或根据时长和帧率计算
        if num_frames:
            payload["num_frames"] = min(num_frames, max_frames)
        else:
            # 根据用户选择的时长和帧率计算帧数
            # 需要满足 8n + 1 且 ≤ max_frames
            target_frames = duration * frame_rate
            # 找到最接近的满足 8n+1 的帧数
            n = round((target_frames - 1) / 8)
            calculated_frames = 8 * n + 1
            # 确保在有效范围内
            payload["num_frames"] = min(max(calculated_frames, 9), max_frames)

        payload["frame_rate"] = frame_rate
        if negative_prompt:
            payload["negative_prompt"] = negative_prompt
        if seed is not None:
            payload["seed"] = seed
        if num_inference_steps is not None:
            payload["num_inference_steps"] = num_inference_steps

        return self._generate_video(payload)

    def image_to_video(
        self,
        image_path: str,
        prompt: str,
        duration: int = 5,
        aspect_ratio: str = "16:9",
        frame_rate: int = 24,
        negative_prompt: str = "",
        seed: Optional[int] = None,
        num_inference_steps: Optional[int] = None,
        width: Optional[int] = None,
        height: Optional[int] = None,
        num_frames: Optional[int] = None,
    ) -> str:
        """图生视频 - 上传本地图片"""
        # 根据视频API文档，图生视频需要可公网访问的图片URL
        # 但API可能也支持base64格式
        
        with open(image_path, "rb") as f:
            image_data = f.read()
        
        # 使用标准的base64编码
        b64 = base64.b64encode(image_data).decode("utf-8")
        
        # 根据文件扩展名确定MIME类型
        import os
        ext = os.path.splitext(image_path)[1].lower()
        mime_type = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
        }.get(ext, 'image/png')
        
        # 尝试使用Data URI格式
        image_url = f"data:{mime_type};base64,{b64}"
        print(f" 图生视频: 图片格式={mime_type}, base64长度={len(b64)}, 文件大小={len(image_data)}字节")
        
        # 如果base64太长，可能导致问题，让我们尝试压缩图片
        # 或者提示用户使用较小的图片
        if len(b64) > 1000000:  # 如果base64超过1MB
            print(f" 警告: 图片base64数据较大({len(b64)}字符)，可能导致API调用失败")
            print(f" 建议: 使用较小的图片或公网可访问的图片URL")

        payload = {"model": VIDEO_MODEL, "prompt": prompt, "image": image_url}

        if width and height:
            payload["width"] = width
            payload["height"] = height
        else:
            size = RATIO_TO_SIZE.get(aspect_ratio, {"width": 1152, "height": 768})
            payload["width"] = size["width"]
            payload["height"] = size["height"]

        # 不同分辨率的最大帧数限制
        max_frames_by_resolution = {
            "1080p": 169,
            "720p": 409,
            "480p": 961,
        }
        resolution = "720p"
        if width and height:
            max_dim = max(width, height)
            if max_dim >= 1920:
                resolution = "1080p"
            elif max_dim >= 1280:
                resolution = "720p"
            else:
                resolution = "480p"
        max_frames = max_frames_by_resolution.get(resolution, 409)

        if num_frames:
            payload["num_frames"] = min(num_frames, max_frames)
        else:
            # 根据用户选择的时长和帧率计算帧数
            target_frames = duration * frame_rate
            n = round((target_frames - 1) / 8)
            calculated_frames = 8 * n + 1
            payload["num_frames"] = min(max(calculated_frames, 9), max_frames)

        payload["frame_rate"] = frame_rate
        if negative_prompt:
            payload["negative_prompt"] = negative_prompt
        if seed is not None:
            payload["seed"] = seed
        if num_inference_steps is not None:
            payload["num_inference_steps"] = num_inference_steps

        return self._generate_video(payload)

    def multi_image_video(
        self,
        prompt: str,
        image_urls: List[str],
        mode: str = "ti2vid",
        duration: int = 5,
        aspect_ratio: str = "16:9",
        frame_rate: int = 24,
        negative_prompt: str = "",
        seed: Optional[int] = None,
        num_inference_steps: Optional[int] = None,
        width: Optional[int] = None,
        height: Optional[int] = None,
        num_frames: Optional[int] = None,
    ) -> str:
        """多图视频 / 关键帧动画"""
        payload = {"model": VIDEO_MODEL, "prompt": prompt}

        # 多图 / 关键帧使用 extra_body
        extra_body = {"image": image_urls}
        if mode == "keyframes":
            extra_body["mode"] = "keyframes"
        payload["extra_body"] = extra_body

        if width and height:
            payload["width"] = width
            payload["height"] = height
        else:
            size = RATIO_TO_SIZE.get(aspect_ratio, {"width": 1152, "height": 768})
            payload["width"] = size["width"]
            payload["height"] = size["height"]

        # 不同分辨率的最大帧数限制
        max_frames_by_resolution = {
            "1080p": 169,
            "720p": 409,
            "480p": 961,
        }
        resolution = "720p"
        if width and height:
            max_dim = max(width, height)
            if max_dim >= 1920:
                resolution = "1080p"
            elif max_dim >= 1280:
                resolution = "720p"
            else:
                resolution = "480p"
        max_frames = max_frames_by_resolution.get(resolution, 409)

        if num_frames:
            payload["num_frames"] = min(num_frames, max_frames)
        else:
            # 根据用户选择的时长和帧率计算帧数
            target_frames = duration * frame_rate
            n = round((target_frames - 1) / 8)
            calculated_frames = 8 * n + 1
            payload["num_frames"] = min(max(calculated_frames, 9), max_frames)

        payload["frame_rate"] = frame_rate
        if negative_prompt:
            payload["negative_prompt"] = negative_prompt
        if seed is not None:
            payload["seed"] = seed
        if num_inference_steps is not None:
            payload["num_inference_steps"] = num_inference_steps

        return self._generate_video(payload)

    def _generate_video(self, payload: dict) -> str:
        """核心视频生成：提交任务 + 轮询结果"""
        try:
            url = f"{self.base_url}/videos"

            # 打印详细日志（隐藏 base64 图片数据）
            log_payload = {k: v for k, v in payload.items()
                           if not (isinstance(v, str) and len(v) > 200 and v.startswith("data:"))}
            if "extra_body" in log_payload:
                log_payload["extra_body"] = {k: v for k, v in log_payload["extra_body"].items() if k != "image"}
                log_payload["extra_body"]["image"] = f"[{len(payload['extra_body']['image'])} images]"
            
            # 计算预期时长
            frames = payload.get("num_frames", 0)
            fps = payload.get("frame_rate", 24)
            expected_duration = frames / fps if fps > 0 else 0
            
            print(f" 提交视频请求: {url}")
            print(f" payload: {json.dumps(log_payload, ensure_ascii=False)}")
            print(f" 预期时长: {expected_duration:.2f}秒 ({frames}帧 @ {fps}fps)")

            resp = requests.post(url, json=payload, headers=self.headers, timeout=300)
            print(f" 响应码: {resp.status_code}")
            print(f" 响应: {resp.text[:500]}")

            if resp.status_code >= 400:
                try:
                    err_data = resp.json()
                    err_msg = err_data.get("error", {}).get("message", str(err_data))
                except Exception:
                    err_msg = resp.text[:500]
                raise gr.Error(f"视频提交失败: {err_msg}")

            data = resp.json()
            video_id = data.get("video_id") or data.get("id")

            if not video_id:
                raise gr.Error(f"API 返回中未找到任务 ID: {resp.text}")

            print(f" 任务已创建: {video_id}，开始轮询...")

            # 轮询视频状态 - 增加超时时间到30分钟，视频生成可能需要较长时间
            max_wait = 1800  # 30分钟
            poll_interval = 5
            waited = 0
            retry_count = 0

            while waited < max_wait:
                try:
                    # 查询视频结果的URL是 https://apihub.agnes-ai.com/agnesapi
                    # 需要去掉 /v1 前缀
                    base_domain = self.base_url.replace("/v1", "")
                    poll_url = f"{base_domain}/agnesapi?video_id={video_id}"
                    status_resp = requests.get(poll_url, headers=self.headers, timeout=30)
                    status_resp.raise_for_status()
                    status_data = status_resp.json()
                except Exception as poll_err:
                    retry_count += 1
                    if retry_count < 10:
                        wait_time = min(2 ** retry_count, 30)  # 最多等待30秒
                        print(f" 查询失败，{wait_time}秒后重试 ({retry_count}/10): {poll_err}")
                        time.sleep(wait_time)
                        waited += wait_time
                        continue
                    else:
                        raise gr.Error(f"查询视频状态失败，已重试10次: {poll_err}")

                status = status_data.get("status", "unknown")
                progress = status_data.get("progress", 0)
                elapsed_minutes = waited // 60
                print(f"  状态: {status} | 进度: {progress}% | 已等待: {elapsed_minutes}分钟")

                # 根据API文档，completed表示视频生成完成
                if status == "completed":
                    video_url = (status_data.get("url")
                                 or status_data.get("remixed_from_video_id"))
                    if not video_url:
                        raise gr.Error(
                            f"视频生成完成但未找到 URL: {json.dumps(status_data)}")
                    # 打印API返回的实际时长和分辨率
                    actual_seconds = status_data.get("seconds", "未知")
                    actual_size = status_data.get("size", "未知")
                    print(f" 视频生成完成: {video_url}")
                    print(f" API返回时长: {actual_seconds}秒, 分辨率: {actual_size}")
                    return video_url

                if status == "failed":
                    error = status_data.get("error", {})
                    error_msg = (error.get("message", str(error))
                                 if isinstance(error, dict) else str(error))
                    raise gr.Error(f"视频生成失败: {error_msg}")

                # 根据进度调整轮询间隔，进度为0时增加间隔
                if progress == 0 and waited > 120:
                    # 长时间无进度时，增加轮询间隔
                    time.sleep(min(poll_interval * 2, 30))
                    waited += min(poll_interval * 2, 30)
                else:
                    time.sleep(poll_interval)
                    waited += poll_interval

            raise gr.Error(f"视频生成超时（超过 {max_wait//60} 分钟未返回结果）")

        except gr.Error:
            raise
        except Exception as e:
            raise gr.Error(f"视频生成失败: {str(e)}")

    # ==================== 下载 ====================

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

    def download_video(self, url: str, prefix: str = "agnes_video") -> str:
        """下载视频到本地"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        filename = f"{prefix}_{timestamp}.mp4"
        filepath = OUTPUT_DIR / filename

        print(f" 下载视频: {url}")
        response = requests.get(url, timeout=300, stream=True)
        response.raise_for_status()

        with open(filepath, "wb") as f:
            for chunk in response.iter_content(chunk_size=1024 * 1024):
                if chunk:
                    f.write(chunk)

        print(f" 已保存到: {filepath}")
        return str(filepath)
