# 🎨 Agnes Creator Studio

**AI 驱动的图像与视频创作工具**，基于 Agnes AI API 构建，支持文生图、图生图、文生视频、图生视频、多图视频等功能。

![Python](https://img.shields.io/badge/Python-3.10+-blue?logo=python)
![Gradio](https://img.shields.io/badge/Gradio-6.0-orange?logo=gradio)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 🖼️ 效果展示

### 文生图 (Text-to-Image)

| 提示词 | 生成效果 |
|--------|----------|
| `A beautiful sunset over the ocean with golden clouds, photorealistic, cinematic` | ![文生图示例1](assets/t2i_example1.png) |
| `A cute cartoon cat wearing a hat, sitting on a windowsill, warm colors, illustration style` | ![文生图示例2](assets/t2i_example2.png) |
| `A futuristic city skyline at night with neon lights and flying cars, cyberpunk style` | ![文生图示例3](assets/t2i_example3.png) |

### 图生图 (Image-to-Image)

| 风格转换 | 生成效果 |
|----------|----------|
| 原图 → 赛博朋克风格 | ![图生图示例1](assets/i2i_example4.png) |
| 原图 → 水彩风格 | ![图生图示例2](assets/i2i_example5.png) |
| 原图 → 超现实风格 | ![图生图示例3](assets/i2i_example6.png) |

---

## ✨ 特性

| 功能 | 描述 | 本地图片支持 |
|------|------|-------------|
| **文生图** | 输入文字描述，生成高质量图像 | - |
| **图生图** | 上传参考图片，基于提示词进行风格转换 | ✅ 支持 |
| **文生视频** | 输入文字描述，生成 3-18 秒视频 | - |
| **图生视频** | 上传参考图片，生成动态视频 | ⚠️ 需公网URL |
| **多图视频** | 使用多张参考图片生成视频 | ⚠️ 需公网URL |
| **关键帧动画** | 在多个关键帧之间生成平滑过渡 | ⚠️ 需公网URL |
| **历史记录** | 自动保存生成记录，支持查看和下载 | - |

### 🖼️ 支持的图像尺寸

- `1024×1024` - 正方形（通用）
- `1024×1792` - 9:16 抖音竖屏
- `1792×1024` - 16:9 抖音横屏
- `864×1536` - 9:16 抖音封面
- `1536×864` - 16:9 抖音封面

### 🎬 支持的视频规格

| 分辨率 | 最大帧数 | 推荐时长 |
|--------|----------|----------|
| 1080p | 169帧 | 约 7秒 @ 24fps |
| 720p | 409帧 | 约 17秒 @ 24fps |
| 480p | 961帧 | 约 40秒 @ 24fps |

**支持的宽高比：**
- 16:9 - 横屏视频、产品演示
- 9:16 - 竖屏短视频、移动端内容
- 1:1 - 方形视频、社交媒体
- 4:3 - 传统横向画幅
- 3:4 - 竖向展示内容

**支持的帧率：** 12-60 FPS

---

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/you-want/agnes-image-tool.git
cd agnes-image-tool
```

### 2. 安装依赖

```bash
pip install -r requirements.txt
```

### 3. 配置 API Key

从 [agnes-ai.com](https://agnes-ai.com) 获取免费 API Key，然后设置环境变量：

```bash
# macOS / Linux
export AGNES_API_KEY="你的API密钥"

# Windows (PowerShell)
$env:AGNES_API_KEY="你的API密钥"

# 或创建 .env 文件
echo "AGNES_API_KEY=你的API密钥" > .env
```

### 4. 运行应用

```bash
python app.py
```

应用将在 `http://localhost:7860` 启动。

---

## 📖 使用指南

### 文生图 (Text → Image)

1. 在「Text → Image」标签页输入提示词
2. 选择图像尺寸
3. 点击「生成」按钮

**示例提示词：**
```
一只可爱的橘猫坐在窗台上，阳光洒在它身上，温暖治愈的氛围
```

### 图生图 (Image → Image)

1. 在「Image → Image」标签页上传参考图片
2. 输入风格转换提示词
3. 调整「重绘强度」（0.1-1.0，越高变化越大）
4. 选择图像尺寸
5. 点击「生成」按钮

**示例：**
```
上传一张风景照片 → 提示词「油画风格，印象派」→ 生成油画风格图片
```

### 文生视频 (Text → Video)

1. 在「Text → Video」标签页输入视频描述
2. 选择视频时长、分辨率、帧率
3. 点击「生成视频」按钮
4. 等待视频生成完成（根据时长不同，约 1-10 分钟）

### 图生视频 (Image → Video)

⚠️ **重要提示：** 视频API需要公网可访问的图片URL

**推荐方式：**
1. 在「公网图片URL」输入框中输入图片链接
2. 输入视频描述
3. 选择视频参数
4. 点击「生成视频」按钮

**替代方式（仅当API服务器在本地时可用）：**
1. 上传本地图片
2. 输入视频描述
3. 选择视频参数
4. 点击「生成视频」按钮

### 多图视频 (Multi-Image Video)

⚠️ **重要提示：** 视频API需要公网可访问的图片URL

1. 在「Multi-Image Video」标签页输入多个图片URL（每行一个）
2. 选择生成模式：
   - **ti2vid** - 多图视频生成
   - **keyframes** - 关键帧动画
3. 输入视频描述
4. 选择视频参数
5. 点击「生成视频」按钮

---

## 🎨 界面设计

- **现代浅色主题** - 清新简洁的视觉体验
- **专业字体** - Space Grotesk + DM Sans + JetBrains Mono
- **高对比度配色** - 文字清晰易读
- **响应式布局** - 适配不同屏幕尺寸
- **智能提示** - 彩色提示框显示功能限制

---

## 🔧 技术栈

| 技术 | 用途 |
|------|------|
| Python 3.10+ | 后端语言 |
| Gradio 6.0 | Web 界面框架 |
| Requests | HTTP 请求处理 |
| Base64 | 图片编码处理 |

---

## 📦 项目结构

```
agnes-image-tool/
├── app.py              # 主应用文件
├── api_client.py       # API客户端封装
├── config.py           # 配置管理
├── utils.py            # 工具函数
├── styles.py           # CSS样式
├── requirements.txt    # Python 依赖
├── .gitignore          # Git 忽略规则
├── README.md           # 项目文档
├── LICENSE             # 开源协议
├── video-api.md        # 视频API文档
├── image-api.md        # 图片API文档
├── outputs/            # 生成的图片/视频（自动创建）
└── history.json        # 历史记录（自动创建）
```

---

## 🌐 部署方式

### Hugging Face Spaces

1. 创建新的 Space：https://huggingface.co/new-space
2. 选择 SDK：Gradio
3. 上传项目文件
4. 在 Space Settings → Variables Secrets 中添加：
   ```
   AGNES_API_KEY = 你的API密钥
   ```

### Vercel / 其他平台

项目使用 Gradio 框架，可部署到任何支持 Python 的平台。

---

## 🔒 安全说明

- API Key 通过环境变量管理，**不会硬编码在代码中**
- `.gitignore` 已配置忽略 `.env`、`outputs/`、`history.json` 等敏感文件
- 请勿在公开仓库中提交 API Key

---

## 📝 API 文档

- [Agnes Image 2.1 Flash](https://agnes-ai.com/doc/agnes-image-21-flash) - 图像生成模型
- [Agnes Video V2.0](https://agnes-ai.com/doc/agnes-video-v20) - 视频生成模型

---

## 📄 开源协议

本项目采用 **MIT License** 开源协议。

**简单来说：**
- ✅ 可以自由使用、修改、分发
- ✅ 可以用于商业项目
- ✅ 可以闭源修改
- ⚠️ 需要保留版权声明
- ⚠️ 软件按"原样"提供，不提供任何担保

---

## 🙏 致谢

- [Agnes AI](https://agnes-ai.com) - 提供免费的全模态 API
- [Gradio](https://gradio.app) - 简洁的 Web 界面框架
- [OpenAI](https://openai.com) - 提供兼容的 API 接口设计

---

## 📧 联系方式

如有问题或建议，欢迎通过以下方式联系：

- 提交 [Issue](https://github.com/you-want/agnes-image-tool/issues)
- 发送 [Pull Request](https://github.com/you-want/agnes-image-tool/pulls)

---

## 🌟 Star History

如果这个项目对你有帮助，请给一个 Star ⭐️
- [Gradio](https://gradio.app) - 简洁的 Web 界面框架