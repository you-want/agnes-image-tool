#!/usr/bin/env python3
"""测试 Agnes 视频生成 API"""

import os
import json
import time
import requests

API_KEY = os.getenv("AGNES_API_KEY", "")
BASE_URL = "https://apihub.agnes-ai.com/v1"

if not API_KEY:
    print("❌ 请先设置环境变量 AGNES_API_KEY")
    exit(1)

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# 尝试多种可能的视频生成 endpoint 和参数结构
test_cases = [
    {
        "desc": "OpenAI 风格 videos/generations",
        "url": f"{BASE_URL}/videos/generations",
        "payload": {
            "model": "agnes-video-2.0",
            "prompt": "a beautiful sunset over the ocean",
        }
    },
    {
        "desc": "带宽高时长",
        "url": f"{BASE_URL}/videos/generations",
        "payload": {
            "model": "agnes-video-2.0",
            "prompt": "a beautiful sunset over the ocean",
            "width": 1280,
            "height": 720,
            "duration": 5,
        }
    },
]

for tc in test_cases:
    print(f"\n{'='*60}")
    print(f"🧪 {tc['desc']}")
    print(f"URL: {tc['url']}")
    print(f"Payload: {json.dumps(tc['payload'], ensure_ascii=False)}")

    try:
        resp = requests.post(tc["url"], json=tc["payload"], headers=headers, timeout=60)
        print(f"状态码: {resp.status_code}")
        print(f"响应: {json.dumps(resp.json(), ensure_ascii=False, indent=2)}")

        if resp.status_code == 200:
            data = resp.json()
            # 尝试提取视频 URL
            def find_video(obj):
                if isinstance(obj, dict):
                    for k, v in obj.items():
                        if isinstance(v, str) and v.startswith(("http://", "https://")) and v.endswith((".mp4", ".webm", ".mov")):
                            return v
                        result = find_video(v)
                        if result:
                            return result
                elif isinstance(obj, list):
                    for item in obj:
                        result = find_video(item)
                        if result:
                            return result
                return None

            video_url = find_video(data)
            if video_url:
                print(f"🎬 找到视频 URL: {video_url}")
            else:
                # 尝试提取 task id
                def find_id(obj):
                    if isinstance(obj, dict):
                        for k, v in obj.items():
                            if k in ("id", "task_id", "job_id") and isinstance(v, str):
                                return v
                            result = find_id(v)
                            if result:
                                return result
                    elif isinstance(obj, list):
                        for item in obj:
                            result = find_id(item)
                            if result:
                                return result
                    return None

                task_id = find_id(data)
                if task_id:
                    print(f"⏳ 找到任务 ID: {task_id}，开始轮询...")

                    poll_url = tc["url"].rstrip("/").rsplit("/", 1)[0] + "/" + task_id
                    print(f"   轮询 URL: {poll_url}")

                    for attempt in range(20):
                        time.sleep(3)
                        poll = requests.get(poll_url, headers=headers, timeout=30)
                        if poll.status_code == 200:
                            poll_data = poll.json()
                            video_url = find_video(poll_data)
                            if video_url:
                                print(f"✅ 视频生成成功: {video_url}")
                                break
                            print(f"   第 {attempt+1} 次轮询: 仍在处理中...")
                            print(f"   {json.dumps(poll_data, ensure_ascii=False)[:200]}")

    except Exception as e:
        print(f"❌ 错误: {e}")
