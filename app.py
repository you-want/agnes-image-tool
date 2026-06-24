"""
Agnes Creator Studio - 主应用入口
"""
import gradio as gr

from config import (
    DEFAULT_API_KEY,
    DEFAULT_BASE_URL,
    DEFAULT_MODEL,
    IMAGE_SIZE_OPTIONS,
    VIDEO_RATIO_OPTIONS,
    VIDEO_DURATION_CHOICES,
    VIDEO_FRAME_RATE_CHOICES,
    VIDEO_MODE_OPTIONS,
    VIDEO_RESOLUTION_CHOICES,
)
from api_client import AgnesImageGenerator
from utils import (
    add_to_history,
    load_history,
    save_config,
    parse_size,
    parse_ratio,
)
from styles import CUSTOM_CSS


# ==================== 创建界面 ====================
def create_ui():
    with gr.Blocks(title="Agnes Creator Studio") as demo:

        # ===== Hero Header =====
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
        </div>
        """)

        # ===== API 配置 =====
        with gr.Accordion("⚙️ API 配置", open=not DEFAULT_API_KEY):
            with gr.Row():
                api_key_input = gr.Textbox(
                    label="API Key",
                    placeholder="从 agnes-ai.com 获取",
                    value=DEFAULT_API_KEY,
                    type="password",
                )
                base_url_input = gr.Textbox(
                    label="Base URL",
                    value=DEFAULT_BASE_URL,
                )
                model_input = gr.Textbox(
                    label="模型",
                    value=DEFAULT_MODEL,
                )
            save_config_btn = gr.Button("💾 保存配置", size="sm")
            save_config_status = gr.Textbox(label="", interactive=False, visible=False)

        # ===== 功能标签页 =====
        with gr.Tabs():
            # ===== 文生图 =====
            with gr.TabItem("Text → Image"):
                with gr.Row():
                    with gr.Column(scale=1):
                        t2i_prompt = gr.Textbox(
                            label="提示词",
                            placeholder="描述你想生成的图像，例如：一只可爱的橘猫坐在窗台上，阳光明媚",
                            lines=4,
                            max_lines=8
                        )
                        t2i_negative_prompt = gr.Textbox(
                            label="负面提示词",
                            placeholder="描述你不想出现的内容，例如：模糊、低质量、变形",
                            lines=2
                        )
                        with gr.Row():
                            t2i_size = gr.Dropdown(
                                label="尺寸",
                                choices=IMAGE_SIZE_OPTIONS,
                                value=IMAGE_SIZE_OPTIONS[0]
                            )
                            t2i_num = gr.Slider(
                                label="生成数量",
                                minimum=1,
                                maximum=4,
                                value=1,
                                step=1
                            )
                        t2i_btn = gr.Button("🚀 生成", variant="primary", size="lg")

                    with gr.Column(scale=1):
                        t2i_output = gr.Gallery(
                            label="生成的图片",
                            columns=2,
                            rows=2,
                            height="auto"
                        )
                        t2i_info = gr.Textbox(
                            label="状态",
                            interactive=False,
                            value="等待生成..."
                        )

            # ===== 图生图 =====
            with gr.TabItem("Image → Image"):
                with gr.Row():
                    with gr.Column(scale=1):
                        gr.HTML("<div class='success-box'>✅ 图片API支持本地图片上传<br>上传的图片会自动转换为Base64格式发送给API</div>")
                        
                        img2img_input = gr.Image(
                            label="上传参考图片",
                            type="filepath",
                            height=300
                        )
                        img2img_prompt = gr.Textbox(
                            label="风格描述",
                            placeholder="例如：油画风格，印象派，温暖色调",
                            lines=3
                        )
                        img2img_negative_prompt = gr.Textbox(
                            label="负面提示词",
                            placeholder="描述你不想出现的内容",
                            lines=2
                        )
                        with gr.Row():
                            img2img_size = gr.Dropdown(
                                label="尺寸",
                                choices=IMAGE_SIZE_OPTIONS,
                                value=IMAGE_SIZE_OPTIONS[0]
                            )
                            img2img_strength = gr.Slider(
                                label="重绘强度",
                                minimum=0.1,
                                maximum=1.0,
                                step=0.05,
                                value=0.7
                            )
                        img2img_btn = gr.Button("🚀 生成", variant="primary", size="lg")

                    with gr.Column(scale=1):
                        img2img_output = gr.Gallery(
                            label="生成的图片",
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
                        video_negative_prompt = gr.Textbox(
                            label="负面提示词",
                            placeholder="描述你不想出现的内容",
                            lines=2
                        )
                        
                        gr.HTML("<div class='section-label'>分辨率设置</div>")
                        with gr.Row():
                            video_resolution_preset = gr.Dropdown(
                                label="分辨率档位",
                                choices=VIDEO_RESOLUTION_CHOICES,
                                value="720p",
                            )
                            video_ratio = gr.Dropdown(
                                label="比例",
                                choices=VIDEO_RATIO_OPTIONS,
                                value=VIDEO_RATIO_OPTIONS[0],
                            )
                        with gr.Row():
                            video_width = gr.Number(
                                label="宽度（可选）",
                                placeholder="留空则按比例自动计算",
                                precision=0
                            )
                            video_height = gr.Number(
                                label="高度（可选）",
                                placeholder="留空则按比例自动计算",
                                precision=0
                            )
                        
                        gr.HTML("<div class='section-label'>时长与帧率</div>")
                        with gr.Row():
                            video_duration = gr.Dropdown(
                                label="时长（秒）",
                                choices=VIDEO_DURATION_CHOICES,
                                value=5,
                            )
                            video_frame_rate = gr.Dropdown(
                                label="帧率",
                                choices=VIDEO_FRAME_RATE_CHOICES,
                                value=24,
                            )
                        video_num_frames = gr.Number(
                            label="总帧数（可选，覆盖时长设置）",
                            placeholder="留空则按时长计算，需满足 8n+1 且 ≤441",
                            precision=0
                        )
                        
                        gr.HTML("<div class='section-label'>高级参数</div>")
                        with gr.Row():
                            video_seed = gr.Number(
                                label="随机种子（可选）",
                                placeholder="留空则随机",
                                precision=0
                            )
                            video_steps = gr.Slider(
                                label="推理步数（可选）",
                                minimum=10,
                                maximum=100,
                                step=1,
                                value=50
                            )
                        
                        video_btn = gr.Button("🚀 生成视频", variant="primary", size="lg")

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

            # ===== 图生视频 =====
            with gr.TabItem("Image → Video"):
                with gr.Row():
                    with gr.Column(scale=1):
                        gr.HTML("<div class='warning-box'>⚠️ 视频API需要公网可访问的图片URL<br><br>推荐方式：使用下方URL输入框输入公网图片链接<br><br>替代方式：上传本地图片（仅当API服务器在本地时可用）<br>如果API服务器在远程，本地图片将无法访问</div>")
                        
                        i2v_input = gr.Image(
                            label="上传本地图片（仅当API服务器在本地时可用）",
                            type="filepath",
                            height=300
                        )
                        
                        i2v_url_input = gr.Textbox(
                            label="公网图片URL（推荐）",
                            placeholder="https://example.com/image.png",
                            lines=1,
                            info="输入公网可访问的图片URL，如 https://example.com/image.png"
                        )
                        
                        i2v_prompt = gr.Textbox(
                            label="视频描述",
                            placeholder="描述你想生成的视频动态，例如：人物缓慢转身，头发随风飘动",
                            lines=3
                        )
                        i2v_negative_prompt = gr.Textbox(
                            label="负面提示词",
                            placeholder="描述你不想出现的内容",
                            lines=2
                        )
                        
                        gr.HTML("<div class='section-label'>分辨率设置</div>")
                        with gr.Row():
                            i2v_resolution_preset = gr.Dropdown(
                                label="分辨率档位",
                                choices=VIDEO_RESOLUTION_CHOICES,
                                value="720p",
                            )
                            i2v_ratio = gr.Dropdown(
                                label="比例",
                                choices=VIDEO_RATIO_OPTIONS,
                                value=VIDEO_RATIO_OPTIONS[0],
                            )
                        with gr.Row():
                            i2v_width = gr.Number(
                                label="宽度（可选）",
                                placeholder="留空则按比例自动计算",
                                precision=0
                            )
                            i2v_height = gr.Number(
                                label="高度（可选）",
                                placeholder="留空则按比例自动计算",
                                precision=0
                            )
                        
                        gr.HTML("<div class='section-label'>时长与帧率</div>")
                        with gr.Row():
                            i2v_duration = gr.Dropdown(
                                label="时长（秒）",
                                choices=VIDEO_DURATION_CHOICES,
                                value=5,
                            )
                            i2v_frame_rate = gr.Dropdown(
                                label="帧率",
                                choices=VIDEO_FRAME_RATE_CHOICES,
                                value=24,
                            )
                        i2v_num_frames = gr.Number(
                            label="总帧数（可选，覆盖时长设置）",
                            placeholder="留空则按时长计算，需满足 8n+1 且 ≤441",
                            precision=0
                        )
                        
                        gr.HTML("<div class='section-label'>高级参数</div>")
                        with gr.Row():
                            i2v_seed = gr.Number(
                                label="随机种子（可选）",
                                placeholder="留空则随机",
                                precision=0
                            )
                            i2v_steps = gr.Slider(
                                label="推理步数（可选）",
                                minimum=10,
                                maximum=100,
                                step=1,
                                value=50
                            )
                        
                        i2v_btn = gr.Button("🚀 生成视频", variant="primary", size="lg")

                    with gr.Column(scale=1):
                        i2v_output = gr.Video(
                            label="生成的视频",
                            height=400,
                            autoplay=False
                        )
                        i2v_info = gr.Textbox(
                            label="状态",
                            interactive=False,
                            value="等待生成..."
                        )

            # ===== 多图视频 =====
            with gr.TabItem("Multi-Image Video"):
                with gr.Row():
                    with gr.Column(scale=1):
                        gr.HTML("<div class='warning-box'>⚠️ 视频API需要公网可访问的图片URL<br>不支持本地图片的Base64格式<br>请输入公网图片URL（如 https://example.com/image.png）</div>")
                        
                        mi_prompt = gr.Textbox(
                            label="视频描述",
                            placeholder="描述多图视频或关键帧动画，例如：在两张图片之间生成平滑过渡",
                            lines=4,
                            max_lines=8
                        )
                        mi_negative_prompt = gr.Textbox(
                            label="负面提示词",
                            placeholder="描述你不想出现的内容",
                            lines=2
                        )
                        
                        gr.HTML("<div class='section-label'>图片输入</div>")
                        mi_image_urls = gr.Textbox(
                            label="图片 URL 列表（每行一个）",
                            placeholder="https://example.com/image1.png\nhttps://example.com/image2.png",
                            lines=4,
                            info="输入公网可访问的图片URL，不支持本地图片"
                        )
                        mi_mode = gr.Dropdown(
                            label="生成模式",
                            choices=VIDEO_MODE_OPTIONS,
                            value="ti2vid",
                        )
                        
                        gr.HTML("<div class='section-label'>分辨率设置</div>")
                        with gr.Row():
                            mi_resolution_preset = gr.Dropdown(
                                label="分辨率档位",
                                choices=VIDEO_RESOLUTION_CHOICES,
                                value="720p",
                            )
                            mi_ratio = gr.Dropdown(
                                label="比例",
                                choices=VIDEO_RATIO_OPTIONS,
                                value=VIDEO_RATIO_OPTIONS[0],
                            )
                        with gr.Row():
                            mi_width = gr.Number(
                                label="宽度（可选）",
                                placeholder="留空则按比例自动计算",
                                precision=0
                            )
                            mi_height = gr.Number(
                                label="高度（可选）",
                                placeholder="留空则按比例自动计算",
                                precision=0
                            )
                        
                        gr.HTML("<div class='section-label'>时长与帧率</div>")
                        with gr.Row():
                            mi_duration = gr.Dropdown(
                                label="时长（秒）",
                                choices=VIDEO_DURATION_CHOICES,
                                value=5,
                            )
                            mi_frame_rate = gr.Dropdown(
                                label="帧率",
                                choices=VIDEO_FRAME_RATE_CHOICES,
                                value=24,
                            )
                        mi_num_frames = gr.Number(
                            label="总帧数（可选，覆盖时长设置）",
                            placeholder="留空则按时长计算，需满足 8n+1 且 ≤441",
                            precision=0
                        )
                        
                        gr.HTML("<div class='section-label'>高级参数</div>")
                        with gr.Row():
                            mi_seed = gr.Number(
                                label="随机种子（可选）",
                                placeholder="留空则随机",
                                precision=0
                            )
                            mi_steps = gr.Slider(
                                label="推理步数（可选）",
                                minimum=10,
                                maximum=100,
                                step=1,
                                value=50
                            )
                        
                        mi_btn = gr.Button("🚀 生成视频", variant="primary", size="lg")

                    with gr.Column(scale=1):
                        mi_output = gr.Video(
                            label="生成的视频",
                            height=400,
                            autoplay=False
                        )
                        mi_info = gr.Textbox(
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
                        choices=IMAGE_SIZE_OPTIONS,
                        value=IMAGE_SIZE_OPTIONS[0]
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
            save_config({"api_key": api_key, "base_url": base_url, "model": model})
            return gr.Textbox(value="✅ 配置已保存", visible=True)

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
                    size=parse_size(size),
                    n=int(n),
                    negative_prompt=negative_prompt,
                )

                # 下载图片到本地
                local_paths = [gen.download_image(url) for url in urls]

                # 保存历史
                add_to_history(prompt, local_paths, "text2image")

                return local_paths, f"✅ 生成成功！共 {len(local_paths)} 张图片"

            except Exception as e:
                return [], f"❌ 错误: {str(e)}"

        def generate_image2image(
            api_key, base_url, model,
            image_path, prompt, negative_prompt, size, strength
        ):
            """图生图处理"""
            if not api_key:
                return [], "❌ 请先配置 API Key"
            if not image_path:
                return [], "❌ 请上传参考图片"
            if not prompt.strip():
                return [], "❌ 请输入风格描述"

            try:
                gen = AgnesImageGenerator(api_key, base_url)
                urls = gen.image_to_image(
                    image_path=image_path,
                    prompt=prompt,
                    size=parse_size(size),
                    strength=strength,
                    negative_prompt=negative_prompt,
                )

                # 下载图片到本地
                local_paths = [gen.download_image(url) for url in urls]

                # 保存历史
                add_to_history(prompt, local_paths, "image2image", {
                    "strength": strength
                })

                return local_paths, f"✅ 生成成功！强度: {strength}"

            except Exception as e:
                return [], f"❌ 错误: {str(e)}"

        def generate_text2video(
            api_key, base_url, model,
            prompt, negative_prompt, resolution_preset, ratio, width, height,
            duration, frame_rate, num_frames, seed, steps
        ):
            """文生视频处理"""
            if not api_key:
                return None, "❌ 请先配置 API Key"
            if not prompt.strip():
                return None, "❌ 请输入视频描述"

            try:
                gen = AgnesImageGenerator(api_key, base_url)
                
                # 处理可选参数
                seed_val = int(seed) if seed and seed > 0 else None
                steps_val = int(steps) if steps and steps != 50 else None
                width_val = int(width) if width and width > 0 else None
                height_val = int(height) if height and height > 0 else None
                num_frames_val = int(num_frames) if num_frames and num_frames > 0 else None

                video_url = gen.text_to_video(
                    prompt=prompt,
                    duration=int(duration),
                    aspect_ratio=ratio,
                    frame_rate=int(frame_rate),
                    negative_prompt=negative_prompt,
                    seed=seed_val,
                    num_inference_steps=steps_val,
                    width=width_val,
                    height=height_val,
                    num_frames=num_frames_val,
                )

                # 下载视频到本地
                local_path = gen.download_video(video_url)

                # 保存历史
                add_to_history(prompt, [local_path], "text2video", {
                    "duration": duration,
                    "ratio": ratio
                })

                return local_path, f"✅ 视频生成成功！时长: {duration}秒, 比例: {ratio}"

            except Exception as e:
                return None, f"❌ 错误: {str(e)}"

        def generate_image2video(
            api_key, base_url, model,
            image_path, image_url_text, prompt, negative_prompt, resolution_preset, ratio, width, height,
            duration, frame_rate, num_frames, seed, steps
        ):
            """图生视频处理"""
            if not api_key:
                return None, "❌ 请先配置 API Key"
            if not prompt.strip():
                return None, "❌ 请输入视频描述"
            
            # 优先使用公网图片URL
            if image_url_text and image_url_text.strip():
                print(f" 图生视频: 使用公网图片URL={image_url_text}")
                # 使用公网URL直接调用API
                try:
                    gen = AgnesImageGenerator(api_key, base_url)
                    
                    # 处理可选参数
                    seed_val = int(seed) if seed and seed > 0 else None
                    steps_val = int(steps) if steps and steps != 50 else None
                    width_val = int(width) if width and width > 0 else None
                    height_val = int(height) if height and height > 0 else None
                    num_frames_val = int(num_frames) if num_frames and num_frames > 0 else None
                    
                    # 直接使用URL调用视频生成API
                    payload = gen._build_text_to_video_payload(
                        prompt=prompt,
                        duration=int(duration),
                        aspect_ratio=ratio,
                        frame_rate=int(frame_rate),
                        negative_prompt=negative_prompt,
                        seed=seed_val,
                        num_inference_steps=steps_val,
                        width=width_val,
                        height=height_val,
                        num_frames=num_frames_val,
                    )
                    # 添加图片URL
                    payload["image"] = image_url_text.strip()
                    
                    video_url = gen._generate_video(payload)
                    
                    # 下载视频到本地
                    local_path = gen.download_video(video_url)
                    
                    # 保存历史
                    add_to_history(prompt, [local_path], "image2video", {
                        "duration": duration,
                        "ratio": ratio
                    })
                    
                    return local_path, f"✅ 视频生成成功！时长: {duration}秒, 比例: {ratio}"
                    
                except Exception as e:
                    return None, f"❌ 错误: {str(e)}"
            
            # 如果没有提供公网URL，尝试使用本地图片
            if not image_path:
                return None, "❌ 请上传参考图片或输入公网图片URL"

            try:
                gen = AgnesImageGenerator(api_key, base_url)
                
                # 处理可选参数
                seed_val = int(seed) if seed and seed > 0 else None
                steps_val = int(steps) if steps and steps != 50 else None
                width_val = int(width) if width and width > 0 else None
                height_val = int(height) if height and height > 0 else None
                num_frames_val = int(num_frames) if num_frames and num_frames > 0 else None

                # 使用本地图片
                print(f" 图生视频: 图片路径={image_path}")
                
                # 尝试使用Gradio的临时文件URL
                # Gradio会为上传的文件创建一个临时URL
                # 格式: http://localhost:7860/file=/tmp/gradio/xxx.png
                
                # 获取Gradio服务器的URL
                import os
                server_name = os.getenv("GRADIO_SERVER_NAME", "localhost")
                server_port = os.getenv("GRADIO_SERVER_PORT", "7860")
                
                # 构建临时文件URL
                # 注意：这个URL只在本地可访问，如果API服务器在远程，可能无法访问
                temp_url = f"http://{server_name}:{server_port}/file={image_path}"
                print(f" 尝试使用临时URL: {temp_url}")
                print(f" 注意: 此URL仅在本地可访问，如果API服务器在远程，可能无法访问")
                
                # 直接使用临时URL调用视频生成API
                payload = gen._build_text_to_video_payload(
                    prompt=prompt,
                    duration=int(duration),
                    aspect_ratio=ratio,
                    frame_rate=int(frame_rate),
                    negative_prompt=negative_prompt,
                    seed=seed_val,
                    num_inference_steps=steps_val,
                    width=width_val,
                    height=height_val,
                    num_frames=num_frames_val,
                )
                # 添加图片URL
                payload["image"] = temp_url
                
                video_url = gen._generate_video(payload)
                
                # 下载视频到本地
                local_path = gen.download_video(video_url)
                
                # 保存历史
                add_to_history(prompt, [local_path], "image2video", {
                    "duration": duration,
                    "ratio": ratio
                })
                
                return local_path, f"✅ 视频生成成功！时长: {duration}秒, 比例: {ratio}"

            except Exception as e:
                error_msg = str(e)
                if "Invalid image" in error_msg or "padding" in error_msg or "fail_to_fetch" in error_msg:
                    error_msg += "\n\n💡 提示: 视频API需要公网可访问的图片URL。\n本地图片的临时URL仅在本地可访问，如果API服务器在远程，无法访问。\n\n解决方案：\n1. 使用公网可访问的图片URL（推荐）\n2. 将图片上传到图床服务（如imgur、阿里云OSS等）\n3. 使用ngrok等工具将本地服务器暴露到公网"
                return None, f"❌ 错误: {error_msg}"

        def generate_multi_image_video(
            api_key, base_url, model,
            prompt, negative_prompt, image_urls_text, mode, resolution_preset, ratio,
            width, height, duration, frame_rate, num_frames, seed, steps
        ):
            """多图视频处理"""
            if not api_key:
                return None, "❌ 请先配置 API Key"
            if not prompt.strip():
                return None, "❌ 请输入视频描述"
            if not image_urls_text.strip():
                return None, "❌ 请输入图片 URL 列表"

            try:
                gen = AgnesImageGenerator(api_key, base_url)
                
                # 解析图片 URL
                image_urls = [url.strip() for url in image_urls_text.split("\n") if url.strip()]
                if not image_urls:
                    return None, "❌ 请输入至少一个图片 URL"
                
                # 处理可选参数
                seed_val = int(seed) if seed and seed > 0 else None
                steps_val = int(steps) if steps and steps != 50 else None
                width_val = int(width) if width and width > 0 else None
                height_val = int(height) if height and height > 0 else None
                num_frames_val = int(num_frames) if num_frames and num_frames > 0 else None

                video_url = gen.multi_image_video(
                    prompt=prompt,
                    image_urls=image_urls,
                    mode=mode,
                    duration=int(duration),
                    aspect_ratio=ratio,
                    frame_rate=int(frame_rate),
                    negative_prompt=negative_prompt,
                    seed=seed_val,
                    num_inference_steps=steps_val,
                    width=width_val,
                    height=height_val,
                    num_frames=num_frames_val,
                )

                # 下载视频到本地
                local_path = gen.download_video(video_url)

                # 保存历史
                add_to_history(prompt, [local_path], "multi_image_video", {
                    "mode": mode,
                    "duration": duration,
                    "ratio": ratio,
                    "image_count": len(image_urls)
                })

                return local_path, f"✅ 视频生成成功！模式: {mode}, 时长: {duration}秒, 比例: {ratio}"

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

                for i, p in enumerate(prompts):
                    urls = gen.text_to_image(
                        prompt=p,
                        size=parse_size(size),
                    )
                    paths = [gen.download_image(url) for url in urls]
                    all_paths.extend(paths)

                # 保存历史
                add_to_history(f"批量生成 ({len(prompts)} 个)", all_paths, "batch")

                return all_paths, f"✅ 批量生成完成！共 {len(all_paths)} 张图片"

            except Exception as e:
                return [], f"❌ 错误: {str(e)}"

        def load_history_gallery():
            """加载历史记录到画廊"""
            history = load_history()
            images = []
            for record in history:
                for img in record.get("images", []):
                    images.append((img, record.get("prompt", "")))
            return images, history

        # ==================== 事件绑定 ====================
        save_config_btn.click(
            fn=do_save_config,
            inputs=[api_key_input, base_url_input, model_input],
            outputs=[save_config_status]
        )

        t2i_btn.click(
            fn=generate_text2image,
            inputs=[
                api_key_input, base_url_input, model_input,
                t2i_prompt, t2i_negative_prompt, t2i_size, t2i_num
            ],
            outputs=[t2i_output, t2i_info]
        )

        img2img_btn.click(
            fn=generate_image2image,
            inputs=[
                api_key_input, base_url_input, model_input,
                img2img_input, img2img_prompt, img2img_negative_prompt,
                img2img_size, img2img_strength
            ],
            outputs=[img2img_output, img2img_info]
        )

        video_btn.click(
            fn=generate_text2video,
            inputs=[
                api_key_input, base_url_input, model_input,
                video_prompt, video_negative_prompt, video_resolution_preset, video_ratio,
                video_width, video_height, video_duration, video_frame_rate,
                video_num_frames, video_seed, video_steps
            ],
            outputs=[video_output, video_info]
        )

        i2v_btn.click(
            fn=generate_image2video,
            inputs=[
                api_key_input, base_url_input, model_input,
                i2v_input, i2v_url_input, i2v_prompt, i2v_negative_prompt, i2v_resolution_preset, i2v_ratio,
                i2v_width, i2v_height, i2v_duration, i2v_frame_rate,
                i2v_num_frames, i2v_seed, i2v_steps
            ],
            outputs=[i2v_output, i2v_info]
        )

        mi_btn.click(
            fn=generate_multi_image_video,
            inputs=[
                api_key_input, base_url_input, model_input,
                mi_prompt, mi_negative_prompt, mi_image_urls, mi_mode,
                mi_resolution_preset, mi_ratio, mi_width, mi_height,
                mi_duration, mi_frame_rate, mi_num_frames, mi_seed, mi_steps
            ],
            outputs=[mi_output, mi_info]
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


# ==================== 启动应用 ====================
if __name__ == "__main__":
    demo = create_ui()
    demo.launch(
        server_name="0.0.0.0",
        server_port=7860,
        share=False,
        show_error=True,
        css=CUSTOM_CSS,
    )
