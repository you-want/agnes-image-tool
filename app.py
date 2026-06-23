"""
Agnes Creator Studio - 主应用入口
"""
import gradio as gr

from config import (
    DEFAULT_API_KEY,
    DEFAULT_BASE_URL,
    DEFAULT_MODEL,
    IMAGE_SIZE_OPTIONS,
    VIDEO_DURATION_OPTIONS,
    VIDEO_RATIO_OPTIONS,
    IMG2IMG_MODE_PRESETS,
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


# ==================== 主题切换 JS ====================
THEME_JS = """
() => {
    const saved = localStorage.getItem('agnes-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    if (document.body) document.body.setAttribute('data-theme', saved);
    return saved;
}

window.toggleTheme = function() {
    const current = document.body.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('agnes-theme', next);
    updateThemeIcon(next);
}

window.updateThemeIcon = function(theme) {
    const label = document.getElementById('themeLabel');
    const icon = document.getElementById('themeIcon');
    if (label) label.textContent = theme.toUpperCase();
    if (icon) icon.textContent = theme === 'dark' ? '◑' : '◐';
}

const bindToggle = () => {
    const toggle = document.getElementById('themeToggle');
    if (toggle && !toggle.dataset.bound) {
        toggle.addEventListener('click', window.toggleTheme);
        toggle.dataset.bound = 'true';
        const current = document.body.getAttribute('data-theme') || 'dark';
        updateThemeIcon(current);
    }
};
bindToggle();
setInterval(bindToggle, 500);
"""


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
            <div class="theme-toggle" id="themeToggle">
                <span class="theme-toggle-label" id="themeLabel">DARK</span>
                <div class="theme-toggle-icon" id="themeIcon">◐</div>
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
                        with gr.Row():
                            t2i_size = gr.Dropdown(
                                label="尺寸",
                                choices=IMAGE_SIZE_OPTIONS,
                                value=IMAGE_SIZE_OPTIONS[0]
                            )
                            t2i_enhance = gr.Checkbox(
                                label="画质增强",
                                value=True
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
                        with gr.Row():
                            img2img_mode = gr.Dropdown(
                                label="转换模式",
                                choices=list(IMG2IMG_MODE_PRESETS.keys()),
                                value="风格转换"
                            )
                            img2img_strength = gr.Slider(
                                label="重绘强度",
                                minimum=0.1,
                                maximum=1.0,
                                step=0.05,
                                value=0.7
                            )
                        with gr.Row():
                            img2img_size = gr.Dropdown(
                                label="尺寸",
                                choices=IMAGE_SIZE_OPTIONS,
                                value=IMAGE_SIZE_OPTIONS[0]
                            )
                            img2img_enhance = gr.Checkbox(
                                label="画质增强",
                                value=True
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
                        with gr.Row():
                            video_duration = gr.Dropdown(
                                label="时长（秒）",
                                choices=VIDEO_DURATION_OPTIONS,
                                value=5,
                            )
                            video_ratio = gr.Dropdown(
                                label="比例",
                                choices=VIDEO_RATIO_OPTIONS,
                                value=VIDEO_RATIO_OPTIONS[0],
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
            return "✅ 配置已保存"

        def generate_text2image(
            api_key, base_url, model,
            prompt, size, enhance
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
                    enhance_quality=enhance
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
            image_path, prompt, mode, strength, size, enhance
        ):
            """图生图处理"""
            if not api_key:
                return [], "❌ 请先配置 API Key"
            if not image_path:
                return [], "❌ 请上传参考图片"
            if not prompt.strip():
                return [], "❌ 请输入风格描述"

            # 应用模式预设
            preset = IMG2IMG_MODE_PRESETS.get(mode, {})
            final_strength = preset.get("strength", strength)
            negative = preset.get("negative", "")

            try:
                gen = AgnesImageGenerator(api_key, base_url)
                urls = gen.image_to_image(
                    image_path=image_path,
                    prompt=prompt,
                    size=parse_size(size),
                    strength=final_strength,
                    negative_prompt=negative,
                    enhance_quality=enhance
                )

                # 下载图片到本地
                local_paths = [gen.download_image(url) for url in urls]

                # 保存历史
                add_to_history(prompt, local_paths, "image2image", {
                    "mode": mode,
                    "strength": final_strength
                })

                return local_paths, f"✅ 生成成功！模式: {mode}, 强度: {final_strength}"

            except Exception as e:
                return [], f"❌ 错误: {str(e)}"

        def generate_text2video(
            api_key, base_url, model,
            prompt, duration, ratio
        ):
            """文生视频处理"""
            if not api_key:
                return None, "❌ 请先配置 API Key"
            if not prompt.strip():
                return None, "❌ 请输入视频描述"

            aspect_ratio = parse_ratio(ratio)

            try:
                gen = AgnesImageGenerator(api_key, base_url)
                video_url = gen.text_to_video(
                    prompt=prompt,
                    duration=int(duration),
                    aspect_ratio=aspect_ratio,
                )

                # 下载视频到本地
                local_path = gen.download_video(video_url)

                # 保存历史
                add_to_history(prompt, [local_path], "text2video", {
                    "duration": duration,
                    "aspect_ratio": aspect_ratio
                })

                return local_path, f"✅ 视频生成成功！时长: {duration}秒, 比例: {aspect_ratio}"

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
                        enhance_quality=True
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
            outputs=[t2i_info]
        )

        t2i_btn.click(
            fn=generate_text2image,
            inputs=[
                api_key_input, base_url_input, model_input,
                t2i_prompt, t2i_size, t2i_enhance
            ],
            outputs=[t2i_output, t2i_info]
        )

        img2img_btn.click(
            fn=generate_image2image,
            inputs=[
                api_key_input, base_url_input, model_input,
                img2img_input, img2img_prompt, img2img_mode,
                img2img_strength, img2img_size, img2img_enhance
            ],
            outputs=[img2img_output, img2img_info]
        )

        video_btn.click(
            fn=generate_text2video,
            inputs=[
                api_key_input, base_url_input, model_input,
                video_prompt, video_duration, video_ratio
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


# ==================== 启动应用 ====================
if __name__ == "__main__":
    demo = create_ui()
    demo.launch(
        server_name="0.0.0.0",
        server_port=7860,
        share=False,
        show_error=True,
        css=CUSTOM_CSS,
        js=THEME_JS,
    )