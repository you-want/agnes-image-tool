#!/usr/bin/env python3
"""测试 Agnes API 调用"""

import os
from openai import OpenAI

# 测试配置
API_KEY = os.getenv("AGNES_API_KEY", "")
BASE_URL = "https://apihub.agnes-ai.com/v1"

if not API_KEY:
    print("❌ 请先设置环境变量 AGNES_API_KEY")
    exit(1)

print(f"API Key: {API_KEY[:10]}...")
print(f"Base URL: {BASE_URL}")

client = OpenAI(api_key=API_KEY, base_url=BASE_URL)

try:
    print("\n🧪 测试文生图 API...")
    response = client.images.generate(
        model="agnes-image-2.1-flash",
        prompt="一只可爱的柴犬",
        size="1024x1024",
        n=1
    )
    
    print("✅ 成功!")
    print(f"生成的图片 URL: {response.data[0].url}")
    
except Exception as e:
    print(f"❌ 失败: {type(e).__name__}")
    print(f"错误详情: {str(e)}")
    
    # 尝试打印更多调试信息
    if hasattr(e, 'response'):
        print(f"HTTP 状态码: {e.response.status_code}")
        print(f"响应内容: {e.response.text}")
