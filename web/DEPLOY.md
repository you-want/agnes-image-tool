# 网站部署指南（Vercel）

部署目标是 `web/` Next.js 网站。仓库根目录的 Dockerfile、Docker Compose 和 Python/Gradio 是独立旧入口，不包含公众号登录保护。

## 当前流水线

- `.github/workflows/ci.yml` 在 push 到 `main` 或 PR 时执行 lint、类型检查、测试和构建，使用 Node.js 22。
- `.github/workflows/auth-database.yml` 在认证 migration 变动并推送到 `main` 时应用数据库迁移，也支持手动运行。需要配置下述 Supabase variable 和 secret。
- **当前 GitHub Actions 没有 Vercel 网站发布 job。** 网站发布使用 Vercel Git 集成，或本地 Vercel CLI。不能把 CI 成功当成网站已经发布。

## 首次配置

### 1. 先部署认证数据库

按照[公众号登录说明](../docs/wechat-login.md)共用烟火食间现有的 Supabase 认证项目和验证码服务，保持公众号回调地址不变。

在 GitHub 仓库 Settings → Secrets and variables → Actions 配置：

| 类型 | 名称 | 用途 |
| --- | --- | --- |
| Repository variable | `SUPABASE_PROJECT_REF` | 现有认证数据库的项目 ref |
| Repository secret | `SUPABASE_ACCESS_TOKEN` | 有权管理该项目数据库的访问令牌 |

手动运行认证数据库 workflow，确认 migration 成功后再开放网站。未应用 migration 时登录不可用。Preview 也必须连接已应用 migration 的认证数据库。

### 2. 创建 Vercel 项目

在 Vercel 导入此 GitHub 仓库，项目配置如下：

| 设置 | 值 |
| --- | --- |
| Root Directory | `web` |
| Framework Preset | Next.js |
| Node.js Version | 22.x |
| Install Command | `npm ci` |
| Build Command | `npm run build` |

`web/vercel.json` 设置函数区域为 `hnd1`，API 函数超时为 60 秒，实际限制以 Vercel 套餐为准。

### 3. 配置服务端环境变量

在 Vercel Settings → Environment Variables 中分别配置需要的 Production / Preview 环境：

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `AGNES_API_KEY` | 是 | 管理员提供给登录用户使用的模型密钥 |
| `AGNES_BASE_URL` | 否 | 默认 `https://apihub.agnes-ai.com` |
| `SUPABASE_URL` | 是 | 与现有验证码服务共用的数据库地址 |
| `SUPABASE_SERVICE_ROLE_KEY` | 是 | 同一数据库的服务端密钥 |
| `WECHAT_LOGIN_HMAC_SECRET` | 是 | 必须与现有验证码服务完全一致 |
| `WECHAT_PUBLIC_ACCOUNT_NAME` | 否 | 默认「与 IT 有约」 |
| `WECHAT_PUBLIC_ACCOUNT_QR_URL` | 否 | 默认使用仓库内置二维码 |
| `WECHAT_LOGIN_KEYWORD` | 否 | 默认「登录」，需与现有发码服务一致 |
| `UPSTASH_REDIS_REST_URL` | 建议 | 多实例 IP 限流使用的 Redis 地址 |
| `UPSTASH_REDIS_REST_TOKEN` | 建议 | 同上 |

会话期限和每日免费额度见 [.env.local.example](.env.local.example) 及[公众号登录说明](../docs/wechat-login.md)。密钥不能加 `NEXT_PUBLIC_` 前缀，也不能提交到 Git。修改部署环境变量后需重新部署。

### 4. 发布与验收

Vercel Git 集成会按其项目设置发布 Production 和 Preview，和 GitHub CI 分别运行，默认不会等待 CI 成功。建议通过受保护的 `main` 分支和必需 CI 检查控制合并，只合并通过检查的 PR。

也可以在 `web/` 使用 Vercel CLI 手动发布：

```bash
npm exec -- vercel login
npm exec -- vercel link
npm exec -- vercel deploy --prod
```

上线后验证：未登录生成返回 401；真实微信验证码可登录且不可重复使用；取关回调更新账户后生成被拒绝；视频任务仅发起者可查询。生产环境使用 HTTPS，以支持 Secure 登录 Cookie。

## 故障排查与回滚

- 登录暂不可用：检查共享数据库、HMAC 密钥和认证 migration 是否配置完成。
- 生成被拒绝：先检查登录/公众号授权和每日额度，再检查模型 Key 与上游服务。
- 认证数据库 workflow 被跳过：检查 Repository variable `SUPABASE_PROJECT_REF`。
- CI 成功但网站未更新：检查 Vercel Git 集成和部署记录，CI 本身不发布网站。
- 回滚网站：Vercel Deployments 中提升已验证的旧部署；数据库迁移不会随网站回滚自动撤销。
