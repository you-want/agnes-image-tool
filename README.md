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
├── Dockerfile          # Docker 部署配置
├── docker-compose.yml  # Docker Compose 配置
├── supervisord.conf    # 进程管理配置
├── start.sh            # 启动脚本
├── video-api.md        # 视频API文档
├── image-api.md        # 图片API文档
├── assets/             # 静态资源（README展示图）
├── outputs/            # 生成的图片/视频（自动创建）
└── history.json        # 历史记录（自动创建）
```

---

## 🌐 线上部署

### 前置准备

**服务器要求：**
- 操作系统：Ubuntu 22.04 LTS / CentOS 7+
- CPU：2核及以上
- 内存：4GB及以上
- 磁盘：20GB及以上（用于存储生成的图片和视频）
- 网络：公网IP，开放 7860 端口

**需要安装的软件：**
- Python 3.10+
- Git
- Docker（推荐）
- Docker Compose（推荐）
- Nginx（可选，用于反向代理）

---

### 方式一：Docker Compose 部署（推荐）

这是最简单、最推荐的部署方式。

#### 步骤 1：安装 Docker 和 Docker Compose

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com | sh

# 安装 Docker Compose
sudo apt install docker-compose-plugin -y

# 启动 Docker 服务
sudo systemctl start docker
sudo systemctl enable docker
```

#### 步骤 2：克隆项目

```bash
git clone https://github.com/you-want/agnes-image-tool.git
cd agnes-image-tool
```

#### 步骤 3：创建环境变量文件

```bash
echo "AGNES_API_KEY=你的API密钥" > .env
```

#### 步骤 4：构建并启动容器

```bash
# 构建并启动（后台运行）
docker compose up -d

# 查看容器状态
docker compose ps

# 查看日志
docker compose logs -f
```

#### 步骤 5：访问应用

应用已启动在 `http://服务器IP:7860`

#### 常用命令

```bash
# 停止服务
docker compose down

# 重启服务
docker compose restart

# 查看日志
docker compose logs -f

# 更新代码后重新构建
docker compose up -d --build
```

---

### 方式二：手动部署（Linux 服务器）

#### 步骤 1：安装依赖

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Python 3.10 和虚拟环境
sudo apt install python3.10 python3.10-venv python3.10-dev -y

# 安装 Git 和其他依赖
sudo apt install git build-essential -y
```

#### 步骤 2：克隆项目

```bash
git clone https://github.com/you-want/agnes-image-tool.git
cd agnes-image-tool
```

#### 步骤 3：创建虚拟环境

```bash
python3.10 -m venv venv
source venv/bin/activate
```

#### 步骤 4：安装 Python 依赖

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

#### 步骤 5：设置环境变量

```bash
export AGNES_API_KEY="你的API密钥"
```

#### 步骤 6：启动应用

```bash
python app.py
```

应用将在 `http://localhost:7860` 启动。

#### 步骤 7：使用 Systemd 管理进程（推荐）

创建服务文件：

```bash
sudo nano /etc/systemd/system/agnes-creator.service
```

添加以下内容：

```ini
[Unit]
Description=Agnes Creator Studio
After=network.target

[Service]
Type=simple
User=your_username
WorkingDirectory=/path/to/agnes-image-tool
Environment="AGNES_API_KEY=你的API密钥"
Environment="GRADIO_SERVER_NAME=0.0.0.0"
Environment="GRADIO_SERVER_PORT=7860"
ExecStart=/path/to/agnes-image-tool/venv/bin/python app.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

启动服务：

```bash
sudo systemctl daemon-reload
sudo systemctl start agnes-creator
sudo systemctl enable agnes-creator

# 查看状态
sudo systemctl status agnes-creator

# 查看日志
sudo journalctl -u agnes-creator -f
```

---

### 方式三：Nginx 反向代理（推荐用于生产环境）

使用 Nginx 作为反向代理，可以提供更好的性能和安全性。

#### 步骤 1：安装 Nginx

```bash
sudo apt install nginx -y
```

#### 步骤 2：配置 Nginx

```bash
sudo nano /etc/nginx/sites-available/agnes-creator
```

添加以下内容：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:7860;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket 支持（Gradio 需要）
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # 静态文件缓存
    location /static/ {
        proxy_pass http://127.0.0.1:7860/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### 步骤 3：启用配置

```bash
sudo ln -s /etc/nginx/sites-available/agnes-creator /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

### 方式四：配置 SSL/TLS（HTTPS）

使用 Let's Encrypt 免费证书配置 HTTPS。

#### 步骤 1：安装 Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

#### 步骤 2：获取证书

```bash
sudo certbot --nginx -d your-domain.com
```

#### 步骤 3：自动续期证书

```bash
sudo certbot renew --dry-run
```

Let's Encrypt 证书有效期为 90 天，certbot 会自动续期。

---

### 方式五：Hugging Face Spaces 部署（免费推荐）

Hugging Face Spaces 是 **最推荐的免费部署平台**，专门支持 Gradio 应用，提供免费 GPU 资源。

#### 步骤 1：创建 Hugging Face 账号

访问 https://huggingface.co/ 注册账号（免费）。

#### 步骤 2：创建新 Space

1. 点击右上角 **"New Space"**
2. **Space name**: 输入你的项目名称，如 `agnes-creator-studio`
3. **License**: 选择 `mit`
4. **SDK**: 选择 `Gradio`
5. **Hardware**: 选择 `CPU basic`（免费）或 `T4 small`（需要申请）
6. 点击 **"Create Space"**

#### 步骤 3：上传代码

有两种方式：

**方式 A：使用 Git（推荐）**

```bash
# 设置 Git
git config --global user.email "your-email@example.com"
git config --global user.name "Your Name"

# 克隆 Space 仓库
git clone https://huggingface.co/spaces/your-username/agnes-creator-studio
cd agnes-creator-studio

# 将项目文件复制到这里
cp -r /path/to/agnes-image-tool/* .

# 提交并推送
git add .
git commit -m "Initial commit"
git push
```

**方式 B：网页上传**

在 Space 页面点击 **"Files"** → **"Add file"**，上传所有项目文件。

#### 步骤 4：配置 API Key

1. 在 Space 页面点击 **"Settings"**
2. 找到 **"Variables & Secrets"** 部分
3. 点击 **"New Secret"**
4. **Name**: `AGNES_API_KEY`
5. **Value**: 你的 API 密钥
6. 点击 **"Add secret"**

#### 步骤 5：等待部署

Hugging Face 会自动构建并部署你的应用，大约需要 2-5 分钟。

部署完成后，访问你的 Space URL：`https://huggingface.co/spaces/your-username/agnes-creator-studio`

#### 常见问题

**Q: 部署失败怎么办？**
- 查看 **"Logs"** 标签页，检查错误信息
- 确保 `requirements.txt` 中的依赖版本正确
- 确保 `app.py` 中使用了正确的 Gradio 启动方式

**Q: 如何升级到 GPU？**
- 在 Space Settings 中选择 `T4 small` 或 `A10G`
- 需要申请免费 GPU 额度

---

### 方式六：Replit 部署（免费）

Replit 提供免费的 Python 环境，可以快速部署 Gradio 应用。

#### 步骤 1：创建 Replit 账号

访问 https://replit.com/ 注册账号（免费）。

#### 步骤 2：创建新项目

1. 点击 **"Create Repl"**
2. **Template**: 选择 `Python`
3. **Name**: 输入项目名称
4. 点击 **"Create Repl"**

#### 步骤 3：上传代码

1. 将所有项目文件拖放到 Replit 文件面板中
2. 删除默认的 `main.py` 文件

#### 步骤 4：配置环境

1. 在 `.replit` 文件中添加：
   ```
   run = "python app.py"
   ```

2. 在 **"Secrets"** 标签页添加环境变量：
   - `AGNES_API_KEY`: 你的 API 密钥

#### 步骤 5：运行应用

点击 **"Run"** 按钮，Replit 会自动安装依赖并启动应用。

访问应用 URL：`https://your-repl-name.your-username.repl.co`

---

### 方式七：Render 部署（免费层）

Render 提供免费的 Web 服务，适合小型应用。

#### 步骤 1：创建 Render 账号

访问 https://render.com/ 注册账号（免费）。

#### 步骤 2：创建 Web Service

1. 点击 **"New"** → **"Web Service"**
2. 选择 **"Build and deploy from a Git repository"**
3. 输入你的 GitHub/GitLab 仓库 URL
4. 点击 **"Connect"**

#### 步骤 3：配置部署

- **Name**: 输入服务名称
- **Region**: 选择离你最近的区域
- **Branch**: `main`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `python app.py`
- **Instance Type**: `Free`

#### 步骤 4：添加环境变量

在 **"Environment Variables"** 中添加：
- `AGNES_API_KEY`: 你的 API 密钥
- `GRADIO_SERVER_NAME`: `0.0.0.0`
- `GRADIO_SERVER_PORT`: `10000`

#### 步骤 5：部署

点击 **"Create Web Service"**，Render 会自动构建并部署。

访问应用 URL：`https://your-service-name.onrender.com`

**注意**: Render 免费层会在 15 分钟无活动后休眠，需要重新唤醒。

---

### 免费平台对比

| 平台 | 免费额度 | GPU支持 | 休眠策略 | 推荐度 |
|------|----------|---------|----------|--------|
| **Hugging Face Spaces** | 无限 | ✅ 需申请 | 无 | ⭐⭐⭐⭐⭐ |
| **Replit** | 500MB内存 | ❌ | 无 | ⭐⭐⭐⭐ |
| **Render** | 750小时/月 | ❌ | 15分钟 | ⭐⭐⭐ |
| **Streamlit Community Cloud** | 无限 | ❌ | 无 | ⭐⭐⭐ |
| **Vercel** | 免费层 | ❌ | 无 | ⭐⭐ |

---

### 部署检查清单

- [ ] 服务器已安装必要的依赖
- [ ] API Key 已正确配置
- [ ] 应用已启动并运行在 7860 端口
- [ ] 防火墙已开放 7860 端口（或 80/443 端口）
- [ ] Nginx 反向代理已配置（可选）
- [ ] SSL 证书已配置（可选）
- [ ] 进程管理（Systemd/Docker）已配置
- [ ] 日志监控已设置

---

### 安全建议

1. **使用环境变量**：不要硬编码 API Key，使用环境变量管理
2. **配置防火墙**：只开放必要的端口
3. **使用 HTTPS**：生产环境必须使用 HTTPS
4. **定期更新**：定期更新系统和依赖包
5. **限制访问**：根据需要配置访问控制

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