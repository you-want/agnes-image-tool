---
title: Agnes Creator Studio
emoji: 🎨
colorFrom: orange
colorTo: red
sdk: gradio
sdk_version: 6.0.0
app_file: app.py
pinned: false
license: mit
short_description: AI 驱动的图像与视频创作工具
---

# 🎨 Agnes Creator Studio

**AI 驱动的图像与视频创作工具**，基于 Agnes AI API 构建，支持文生图、图生图、文生视频、批量生成等功能。

![Python](https://img.shields.io/badge/Python-3.10+-blue?logo=python)
![Gradio](https://img.shields.io/badge/Gradio-6.0-orange?logo=gradio)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ 特性

| 功能 | 描述 |
|------|------|
| **文生图** | 输入文字描述，生成高质量图像 |
| **图生图** | 上传参考图片，基于提示词进行风格转换 |
| **文生视频** | 输入文字描述，生成 3-15 秒视频 |
| **批量生成** | 批量输入提示词，一键生成多张图片 |
| **历史记录** | 自动保存生成记录，支持查看和下载 |

### 🖼️ 支持的图像尺寸

- `1024×1024` - 正方形（通用）
- `1024×1792` - 9:16 抖音竖屏
- `1792×1024` - 16:9 抖音横屏
- `864×1536` - 9:16 抖音封面
- `1536×864` - 16:9 抖音封面

### 🎬 支持的视频时长

- 3秒、5秒、8秒、10秒、15秒

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
3. 调整「重绘强度」（0.3-0.9，越高变化越大）
4. 选择转换模式：
   - **风格转换** - 保持构图，改变艺术风格
   - **内容修改** - 改变画面内容
   - **画质增强** - 提升图像清晰度

**示例：**
```
上传一张风景照片 → 提示词「油画风格，印象派」→ 生成油画风格图片
```

### 文生视频 (Text → Video)

1. 在「Text → Video」标签页输入视频描述
2. 选择视频时长（3-15秒）
3. 点击「生成视频」按钮
4. 等待视频生成完成（约 1-5 分钟）

### 批量生成 (Batch)

1. 在「Batch」标签页输入多个提示词（每行一个）
2. 选择图像尺寸
3. 点击「批量生成」
4. 所有图片将显示在画廊中

---

## 🎨 界面设计

- **深色/浅色主题切换** - 点击右上角按钮切换
- **现代字体** - Space Grotesk + DM Sans
- **高对比度配色** - 文字清晰易读
- **响应式布局** - 适配不同屏幕尺寸

---

## 🔧 技术栈

| 技术 | 用途 |
|------|------|
| Python 3.10+ | 后端语言 |
| Gradio 6.0 | Web 界面框架 |
| OpenAI SDK | API 调用（兼容 Agnes AI） |
| Requests | HTTP 请求处理 |

---

## 📦 项目结构

```
agnes-image-tool/
├── app.py              # 主应用文件
├── requirements.txt    # Python 依赖
├── .gitignore          # Git 忽略规则
├── README.md           # 项目文档
├── test_api.py         # API 测试脚本
├── test_video.py       # 视频生成测试
└── outputs/            # 生成的图片/视频（自动创建）
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

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可证

MIT License - 可自由使用、修改和分发。

---

## 🙏 致谢

- [Agnes AI](https://agnes-ai.com) - 提供免费的全模态 API
- [Gradio](https://gradio.app) - 简洁的 Web 界面框架