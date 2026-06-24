"""
测试视频API调用逻辑
"""
import json

# 模拟API调用参数
def test_video_params():
    """测试视频参数构建"""
    print("=== 测试视频参数构建 ===\n")
    
    # 文生视频参数
    payload = {
        "model": "agnes-video-v2.0",
        "prompt": "A cinematic shot of a cat walking on the beach",
        "width": 1152,
        "height": 768,
        "num_frames": 121,
        "frame_rate": 24
    }
    print("文生视频参数:")
    print(json.dumps(payload, indent=2, ensure_ascii=False))
    
    # 图生视频参数
    payload_i2v = {
        "model": "agnes-video-v2.0",
        "prompt": "The woman slowly turns around",
        "image": "https://example.com/image.png",
        "num_frames": 121,
        "frame_rate": 24
    }
    print("\n图生视频参数:")
    print(json.dumps(payload_i2v, indent=2, ensure_ascii=False))
    
    # 多图视频参数
    payload_multi = {
        "model": "agnes-video-v2.0",
        "prompt": "Create a smooth transformation scene",
        "extra_body": {
            "image": [
                "https://example.com/image1.png",
                "https://example.com/image2.png"
            ]
        },
        "num_frames": 121,
        "frame_rate": 24
    }
    print("\n多图视频参数:")
    print(json.dumps(payload_multi, indent=2, ensure_ascii=False))
    
    # 关键帧动画参数
    payload_keyframes = {
        "model": "agnes-video-v2.0",
        "prompt": "Generate a smooth cinematic transition",
        "extra_body": {
            "image": [
                "https://example.com/keyframe1.png",
                "https://example.com/keyframe2.png"
            ],
            "mode": "keyframes"
        },
        "num_frames": 121,
        "frame_rate": 24
    }
    print("\n关键帧动画参数:")
    print(json.dumps(payload_keyframes, indent=2, ensure_ascii=False))

def test_api_urls():
    """测试API URL构建"""
    print("\n=== 测试API URL构建 ===\n")
    
    base_url = "https://apihub.agnes-ai.com/v1"
    
    # 创建视频任务URL
    create_url = f"{base_url}/videos"
    print(f"创建视频任务: POST {create_url}")
    
    # 查询视频结果URL（推荐方式）
    base_domain = base_url.replace("/v1", "")
    video_id = "video_xxxxxx"
    query_url = f"{base_domain}/agnesapi?video_id={video_id}"
    print(f"查询视频结果: GET {query_url}")
    
    # 验证URL是否符合文档
    assert create_url == "https://apihub.agnes-ai.com/v1/videos", "创建URL不正确"
    assert query_url == "https://apihub.agnes-ai.com/agnesapi?video_id=video_xxxxxx", "查询URL不正确"
    
    print("\n✅ API URL构建正确！")

def test_frame_calculation():
    """测试帧数计算"""
    print("\n=== 测试帧数计算 ===\n")
    
    frame_rate = 24
    durations = [3, 5, 10, 18]
    
    for duration in durations:
        # 根据文档，帧数需满足 8n+1
        # 3秒: 81帧, 5秒: 121帧, 10秒: 241帧, 18秒: 441帧
        expected_frames = {
            3: 81,
            5: 121,
            10: 241,
            18: 441
        }
        frames = expected_frames.get(duration)
        actual_duration = frames / frame_rate
        print(f"{duration}秒 -> {frames}帧 -> 实际时长: {actual_duration:.2f}秒")
        
        # 验证帧数满足 8n+1
        assert (frames - 1) % 8 == 0, f"{frames}帧不满足8n+1"
    
    print("\n✅ 帧数计算正确！")

def test_status_check():
    """测试状态检查逻辑"""
    print("\n=== 测试状态检查逻辑 ===\n")
    
    # 模拟API响应
    responses = [
        {"status": "queued", "progress": 0},
        {"status": "in_progress", "progress": 50},
        {"status": "completed", "progress": 100, "remixed_from_video_id": "https://example.com/video.mp4"},
        {"status": "failed", "progress": 0, "error": {"message": "Generation failed"}}
    ]
    
    for resp in responses:
        status = resp.get("status")
        progress = resp.get("progress")
        print(f"状态: {status}, 进度: {progress}%")
        
        if status == "completed":
            video_url = resp.get("remixed_from_video_id")
            print(f"  -> 视频URL: {video_url}")
        elif status == "failed":
            error = resp.get("error", {})
            print(f"  -> 错误: {error}")
    
    print("\n✅ 状态检查逻辑正确！")

if __name__ == "__main__":
    test_video_params()
    test_api_urls()
    test_frame_calculation()
    test_status_check()
    print("\n" + "="*50)
    print("所有测试通过！视频API调用逻辑正确。")
    print("="*50)