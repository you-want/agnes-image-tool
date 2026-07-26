# 自动化部署指南 (Vercel + GitHub Actions)

## 流水线概览

`.github/workflows/ci.yml` 定义了三个 job:

```
push / PR ──▶ ci (lint → typecheck → test → build)
                │
                ├─ PR:            deploy-preview    → Vercel 预览环境,预览链接自动评论到 PR
                └─ push 到 main:  deploy-production → Vercel 生产环境
```

- 部署**必须先通过 CI**(lint / 类型检查 / 24 个测试 / 构建),挂了就不会发布
- 未配置 Vercel secrets 时,部署 job 自动跳过且不报错 —— CI 仍然照常跑

## 一次性配置(约 10 分钟)

### 1. 创建 Vercel 项目并获取三个值

```bash
npm i -g vercel
cd web
vercel login
vercel link        # 创建/关联项目,按提示操作
```

`vercel link` 完成后,读取生成的本地文件:

```bash
cat .vercel/project.json
# { "orgId": "team_xxx", "projectId": "prj_xxx" }
```

再到 https://vercel.com/account/tokens 创建一个 Token。

> ⚠️ 在 Vercel 项目 Settings → Git 中**不要**连接 GitHub 仓库,
> 否则 Vercel 原生集成会和 Actions 重复部署。

### 2. 配置 GitHub Secrets

仓库 Settings → Secrets and variables → Actions,添加:

| Secret | 值 |
| --- | --- |
| `VERCEL_TOKEN` | 上一步创建的 Token |
| `VERCEL_ORG_ID` | `project.json` 里的 `orgId` |
| `VERCEL_PROJECT_ID` | `project.json` 里的 `projectId` |

### 3. 配置 Vercel 环境变量

Vercel 项目 Settings → Environment Variables(Production + Preview 都勾上):

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `AGNES_API_KEY` | ✅ | Agnes AI API 密钥 |
| `AGNES_BASE_URL` | 可选 | 默认 `https://apihub.agnes-ai.com` |
| `UPSTASH_REDIS_REST_URL` | 建议 | 分布式限流(Serverless 多实例下强烈建议) |
| `UPSTASH_REDIS_REST_TOKEN` | 建议 | 同上 |

> Vercel 是 Serverless 平台,每个函数实例的内存限流各自计数。
> 不配 Upstash 也能跑,但限流只是"尽力而为";配上才是硬限制。
> Upstash 免费档(1 万次命令/天)对限流场景完全够用。

### 4. 首次部署

```bash
git push origin main
```

推送后到仓库 Actions 页看流水线;成功后 job summary 里有生产 URL。

## 日常工作流

| 动作 | 结果 |
| --- | --- |
| 开 PR | CI → 预览环境,链接评论在 PR 里,后续 push 自动更新 |
| 合并 / push 到 main | CI → 自动发生产 |
| CI 失败 | 不部署 |

## 回滚

- **快速**:Vercel Dashboard → Deployments → 选旧部署 → Promote to Production(秒级)
- **代码级**:`git revert <sha> && git push`,走完整流水线

## 故障排查

- **部署 job 显示 skipped**:三个 `VERCEL_*` secrets 没配全
- **`vercel pull` 报 Project not found**:`VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` 与 `vercel link` 生成的值不一致
- **生产接口 401/无余额**:检查 Vercel 环境变量里的 `AGNES_API_KEY`
- **重复部署了两次**:Vercel 项目连了 Git 集成,去 Settings → Git 断开
