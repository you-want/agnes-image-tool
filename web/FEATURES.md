# Agnes Forge · 功能清单

Agnes Forge 是一个基于 Next.js 的 AI 图像 / 视频创作工具,接入 Agnes AI 平台,提供文生图、图生图、文生视频、图生视频等能力,并具备完整的 PWA 离线支持、多语言与主题切换。

---

## 一、生成能力

| 功能 | 说明 | 页面 | API |
| --- | --- | --- | --- |
| 文生图 (Text to Image) | 从文本提示词生成图像,支持 1K–4K 画质、8 种比例 | `src/app/text-to-image/page.tsx` | `POST /api/image/generate` |
| 图生图 (Image to Image) | 上传参考图 + 提示词,进行风格迁移 / 编辑,支持负面提示词 | `src/app/image-to-image/page.tsx` | `POST /api/image/edit` |
| 文生视频 (Text to Video) | 从文本生成视频,支持 480p–1080p、多帧率、时长与高级参数(seed / steps / 尺寸) | `src/app/text-to-video/page.tsx` | `POST /api/video/generate` |
| 图生视频 (Image to Video) | 将静态图片转为动态视频,支持上传或 URL 输入 | `src/app/image-to-video/page.tsx` | `POST /api/video/generate` |
| 多图视频 (Multi-Image Video) | 多张关键帧图片生成过渡视频,支持 `ti2vid` / `keyframes` 两种模式 | `src/app/multi-image-video/page.tsx` | `POST /api/video/generate` |

- **图像模型**:`agnes-image-2.1-flash`
- **视频模型**:`agnes-video-v2.0`
- **视频轮询**:`GET /api/video/status/[id]`,带进度追踪,最长 30 分钟超时

### 参数选项(`src/lib/constants.ts`)
- 图像画质:1K / 2K / 3K / 4K
- 图像比例:1:1、3:4、4:3、16:9、9:16、2:3、3:2、21:9
- 视频分辨率:480p / 720p / 1080p
- 视频比例:16:9、9:16、1:1、4:3、3:4
- 视频时长:3 / 5 / 8 / 10 / 15 / 18 秒
- 视频帧率:12 / 24 / 30 / 60 fps

---

## 二、AI 辅助工具

| 功能 | 说明 | 页面 |
| --- | --- | --- |
| 提示词生成 (Prompt Generator) | 输入主题 + 风格 + 场景 + 光照,自动生成专业提示词(支持图像 / 视频) | `src/app/prompt/page.tsx` |
| 提示词优化 (Prompt Optimizer) | 将粗略提示词优化为结构化、生动的版本,左右对比展示 | `src/app/optimize/page.tsx` |

- **对话模型**:`agnes-2.0-flash`,通过 `POST /api/chat`
- 支持根据当前语言自动注入语言指令(中 / 英)

---

## 三、PWA 与离线支持

- **Service Worker**(`public/sw.js`)
  - 版本化缓存(`agnes-forge-v2` / `agnes-static-v2`),activate 时清理旧版本
  - 静态资源预缓存逐个容错(单个 404 不会导致整个 SW 安装失败)
  - API 请求:network-only(生成类 POST 不可安全缓存),离线时返回明确的 503 JSON
  - 导航请求(HTML):network-first,离线回退缓存壳,避免用户卡在旧版本
  - 其他静态 GET:cache-first(Next.js 内容哈希文件名保证安全)
  - 预留后台同步(sync-history)与推送通知能力
- **应用清单**(`public/manifest.json`):standalone 模式、8 种尺寸图标(`public/icons/` 由品牌 SVG 生成)、主题色 `#e85a25`
- **离线页面**(`src/app/offline/page.tsx`):离线时的兜底页,含离线历史相册
- **安装 / 更新提示**(`src/components/ui/PWAPrompt.tsx`):离线徽标、安装引导、新版本提示(全部走 i18n)
- **请求封装**(`src/lib/fetch-with-offline.ts`):带超时的 fetch 包装与 `apiPost`/`apiGet` 辅助
- **PWA Hook**(`src/hooks/usePWA.ts`):SW 注册、在线状态(含初始状态检测)、更新检测、安装提示

---

## 四、用户体验

- **多语言 i18n**(`src/hooks/useLocale.tsx`、`src/locales/`):英文 / 简体中文,浏览器语言自动检测,localStorage + cookie 持久化
- **明暗主题**(`src/hooks/useTheme.tsx`):跟随系统或手动切换,CSS 变量驱动
- **历史记录**(`src/lib/history-store.ts`):按图像 / 视频分类,每类最多 50 条,含时间戳、来源路由,支持下载与删除
- **键盘快捷键**(`src/hooks/useKeyboardShortcuts.ts`):`Cmd/Ctrl+Enter`、`Shift+Enter` 快速生成
- **跨路由提示词共享**(`src/hooks/usePromptState.ts` + `src/lib/prompt-store.ts`):提示词在各页面间自动携带
- **图片懒加载 + 骨架屏**(`src/components/ui/LazyImage.tsx`、`Skeleton.tsx`):按需加载,无 blurDataURL 时自动降级占位
- **拖拽上传**:图生图 / 图生视频支持拖拽上传与预览(上限 10MB)
- **视频轮询 Hook**(`src/hooks/useVideoPolling.ts`):三个视频页共享,递增退避(3s→15s)、组件卸载自动中止、统一超时与错误处理
- **共享错误横幅**(`src/components/ui/ErrorBanner.tsx`):各生成页统一的错误展示
- **动画**:Framer Motion 交错 / 淡入 / 缩放动效
- **响应式设计**:移动优先,Tailwind 断点适配

---

## 五、页面与导航

| 页面 | 路径 |
| --- | --- |
| 首页 / 落地页 | `/` |
| 文生图 | `/text-to-image` |
| 图生图 | `/image-to-image` |
| 文生视频 | `/text-to-video` |
| 图生视频 | `/image-to-video` |
| 多图视频 | `/multi-image-video` |
| 提示词生成 | `/prompt` |
| 提示词优化 | `/optimize` |
| 离线页 | `/offline` |

导航项统一在 `src/lib/constants.ts` 中定义,配合 i18n key。

---

## 六、组件一览

- **图像**(`src/components/image/`):`ImageGallery`(相册,预览 / 下载 / 删除 / 复制提示词)、`OfflineGallery`(离线只读相册)
- **视频**(`src/components/video/`):`VideoPlayer`(播放、进度、状态、下载)
- **布局**(`src/components/layout/`):`Header`(导航 / 语言 / 主题 / 设置 / 历史)、`Footer`、`HistoryButton`、`HistoryModal`
- **提示词**(`src/components/prompt/`):`PromptEditor`(文本域、复制、优化入口、字数统计)
- **设置**(`src/components/settings/`):`SettingsModal`(API Key、Base URL 配置)
- **通用 UI**(`src/components/ui/`):`Button`、`Input`、`Select`、`Card`、`Modal`、`Tabs`、`Slider`、`LazyImage`、`Skeleton`、`PWAPrompt`、`ErrorBanner`

---

## 七、安全防护

- **API 防护层**(`src/lib/api-guard.ts`):
  - **每 IP 限流**:固定窗口(60 秒 20 次;状态轮询 120 次)。配置 `UPSTASH_REDIS_REST_URL/TOKEN` 后自动切换为 Upstash Redis 分布式限流(适配 Serverless 多实例),故障时降级内存版
  - **请求体大小限制**:纯文本接口 256KB,含图接口 20MB(按字节数校验,防多字节绕过)
  - **参数白名单校验**(`src/lib/validation.ts`):size / ratio / mode / frame_rate 对照 `constants.ts` 枚举;数值参数 clamp 到合理区间;提示词长度上限 4000
  - **chat 接口收敛**:消息数 ≤50、角色白名单、`max_tokens` ≤4096、temperature clamp
- **API Key 安全**:密钥仅存于 `HttpOnly + Secure + SameSite=Strict` 服务端 cookie,前端不可读、不落 localStorage;客户端只能查询"是否已配置"的掩码状态(`GET /api/config/save`)
- **视频 ID 校验**:状态轮询路由校验 ID 格式并 URL 编码,防注入

---

## 八、配置与集成

- **用户配置**(`src/lib/config.ts` / `config-client.ts`):自定义 API Key 与 Base URL;服务端 HttpOnly cookie 持久化;默认 Base URL `https://apihub.agnes-ai.com`;环境变量 `AGNES_API_KEY`、`AGNES_BASE_URL`、可选 `UPSTASH_REDIS_REST_URL/TOKEN`
- **API 封装**(`src/lib/agnes-api.ts`):统一鉴权头、3 次指数退避重试、超时控制(POST 5 分钟 / GET 30 秒)
- **配置接口**:`POST /api/config/save`(保存 / `clear` 清除)、`GET /api/config/save`(掩码状态查询)
- **图片远程域名白名单**(`next.config.ts`):`**.agnes-ai.com`、`**.googleapis.com`、`**.agnes-ai.space`;并为 `sw.js` / `manifest.json` / `icons` 配置缓存头

---

## 九、工程化

- **测试**(Vitest):`npm test` — 参数校验、视频帧数计算、历史存储(含损坏数据恢复)共 24 个用例(`src/lib/*.test.ts`)
- **Lint**(ESLint 9 flat config,`eslint.config.mjs`):next/core-web-vitals + typescript,`npm run lint` 零警告
- **类型检查**:`npm run typecheck`
- **CI**(`.github/workflows/ci.yml`):push / PR 自动执行 lint → typecheck → test → build

---

## 十、技术栈

- **框架**:Next.js 15 + React 19
- **样式**:Tailwind CSS 4
- **动画**:Framer Motion
- **图标**:Lucide React
- **工具**:clsx、tailwind-merge
- **测试 / 质量**:Vitest、ESLint、GitHub Actions
- **状态 / 持久化**:localStorage + cookie(无外部状态库)
