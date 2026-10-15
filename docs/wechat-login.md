# 公众号个人验证码登录

本项目共用烟火食间现有的公众号消息回调、Supabase 账户和一次性验证码，图片站使用独立的 HttpOnly 会话 Cookie。公众号回复【登录】后，用户可以把新验证码填入图片站。无需每天手工发布口令，无需个人号不具备的关注查询 API。

## 用户流程与期限

1. 打开任意创作页，未登录时显示公众号二维码和验证码表单。
2. 扫码关注，在公众号回复【登录】，获得个人 6 位验证码。
3. 网站原子消费验证码，创建自己的登录会话，返回原来的创作页。
4. 每个业务 API 请求都读取共享账户当前的 `wechat_status` 和停用状态。烟火食间回调收到取关事件并更新账户后，图片站下一次请求即拒绝使用。
5. 验证码默认 10 分钟有效，期限由烟火食间发码服务控制；图片站会话默认 7 天，到期重新领码登录。没有每天主动查询关注，也没有强制每日重新登录。

一条验证码只能在任意一个网站消费一次。如果已在烟火食间使用，请重新回复【登录】取新码登录图片站。两站的登录 Cookie 相互独立，退出图片站不会退出烟火食间。

## 共用现有服务，不更换公众号回调

**保持公众号的服务器地址指向现有烟火食间 `/api/wechat/callback`。图片站不需要第二个回调地址。** 图片站和烟火食间必须连接同一个 Supabase 项目，并使用相同的 `WECHAT_LOGIN_HMAC_SECRET`，才能消费同一套验证码和同步取关状态。

现有发码服务收到【登录】文本时，将该 OpenID 标记为 `following`；这是消息交互授权，并非官方主动查询关注状态。漏掉取关事件仍可能留下旧授权。本项目继承这一能力边界，不宣称有每日真实关注查询。收到取关通知后，旧验证码也不能重新获得图片站权限，除非共享发码服务重新授权该账户。

## 图片站环境变量

运行环境使用 Node.js 22 或更高版本；Vercel 项目 Node.js Version 也设为 22.x，保持与 CI 一致。

在 `web/.env.local`（本地）及部署平台服务端环境变量中配置：

```dotenv
# 与烟火食间相同的 Supabase 地址、服务端密钥、验证码 HMAC 密钥
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=
WECHAT_LOGIN_HMAC_SECRET=

WECHAT_PUBLIC_ACCOUNT_NAME=与 IT 有约
WECHAT_PUBLIC_ACCOUNT_QR_URL=/wechat-official-account-qr.png
WECHAT_LOGIN_KEYWORD=登录
AUTH_SESSION_MAX_AGE_SECONDS=604800

# 由管理员提供给粉丝使用的模型配置
AGNES_API_KEY=
AGNES_BASE_URL=https://apihub.agnes-ai.com

# 北京时间每天零点重置，按提交次数计数，0 表示停用该能力
IMAGE_DAILY_LIMIT=20
IMAGE_GLOBAL_DAILY_LIMIT=500
VIDEO_DAILY_LIMIT=3
VIDEO_GLOBAL_DAILY_LIMIT=30
CHAT_DAILY_LIMIT=50
CHAT_GLOBAL_DAILY_LIMIT=1000
```

`SUPABASE_URL` 兼容读取 `NEXT_PUBLIC_SUPABASE_URL`，但本方案不需要向浏览器暴露数据库地址或 anon key。服务端密钥、HMAC 密钥和模型 Key 绝不能使用 `NEXT_PUBLIC_` 前缀。

本仓库内置二维码复制自现有烟火食间；若公众号改变，需要替换图片或设置二维码 URL。改变显示名称、关键词、二维码不能自动改变实际发码服务。

模型设置页只显示服务是否配置，浏览器提交的旧 API 配置 Cookie 不再参与请求，避免用户更换上游地址导致管理员密钥泄露。

## 数据库自动部署

新增 migration：`supabase/migrations/20261015000000_agnes_wechat_access.sql`。

必须应用到现有烟火食间认证数据库。脚本会检查 `app_accounts` 和 `wechat_login_codes` 已存在，再新增图片站自己的会话、登录尝试次数、每日用量、视频任务表和 RPC；不会改动烟火食间现有表结构或回调。

在本仓库 GitHub 配置：

- Repository variable：`SUPABASE_PROJECT_REF`，填写现有认证项目的 ref。
- Repository secret：`SUPABASE_ACCESS_TOKEN`，需要有该项目的数据库管理权限。

合并到 `main` 后 `.github/workflows/auth-database.yml` 自动部署，也可手动运行该 workflow。脚本事务执行并使用独立 `agnes_schema_migrations` 账本，不干扰烟火食间的 Supabase CLI migration 历史。未配置项目 ref 时自动部署跳过，必须完成数据库配置后登录才可用。

数据库账号应具备读取共享账户、消费共享验证码和访问新表的权限。新表开启 RLS，浏览器 anon/authenticated 角色不能读写；业务只能通过本站服务端调用。

建议在 Supabase Cron 中每天调用 `select public.agnes_cleanup_auth_artifacts();`，清理过期会话、限流记录和超过 90 天的用量/任务记录。数据过期判定本身不依赖此清理任务。90 天前的视频任务会失去在线查询权限，已保存的结果链接不受影响。

## 保护范围与额度

- 图片生成、图片编辑、聊天、全部视频生成、上传和视频查询均要求有效登录与当前授权。
- 配置状态接口也要求登录，写配置接口始终拒绝。
- 视频任务仅允许发起者查询；启用登录前产生的旧任务没有所属账户，不能继续查询。
- 额度在调用上游前按有效提交扣除。上游报错、超时也不自动退回，以免接口已经收费但本站恢复额度。图片额度按生成请求计数，而非上游实际返回的图片张数。
- 每个种类有独立用户与全站额度。数据库事务和锁确保并发、多实例请求不会突破限额；数据库或额度服务故障时拒绝调用上游。
- IP 限流仍然保留。公网部署应使用可信反向代理覆盖转发 IP 头，并配置 Upstash 分布式限流。

此登录保护针对 `web/` Next.js 应用。仓库根目录的旧 Gradio `app.py` 是独立入口；不要同时公开部署无登录保护的 Gradio 服务和共享模型密钥。

## 验证

```bash
cd web
npm run lint
npm run typecheck
npm test
npm run test:auth-db  # 需要本机 PostgreSQL initdb、pg_ctl、psql；只创建临时测试数据库
npm run build
```

上线后用真实微信确认：新验证码可以登录、同码不可重复登录、取关回调到达后旧会话生成被拒绝、用户不能查询他人的视频任务。自动测试不替代真实公众号回调和部署环境配置验证。
