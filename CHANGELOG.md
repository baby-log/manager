# 更新日志

本文件记录 PivotOS UI / BabyLog 管理端的版本变更，格式参考
[Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。
本仓是上游 `pivotos-ui` 的 fork，未全量改名；框架侧变更沿用上游，本文件只记 BabyLog 增量与收官状态。

## [Unreleased] — V2 收官（2026-11-19，未部署公开域名）

> 管理端生产域名部署与 V3 公开处理均未解冻；dev 联调固定本机隔离 dev 服 `18080`。

### 变更（BabyLog 管理端增量）

- 新增 `apps/admin/src/views/babylog/` 五组页面：**内置产品 / 记录类型规则 / 设备管理 / 版本管理 / 意见反馈**，
  配合 `api/` 请求层与路由菜单注册（菜单字面 ID 占 5000 段）。
- **内置产品必须置空 `serverUpdatedAt` 再 `updateById`**，否则 base 通道游标失效（与服务端 M10 口径一致）。
- 内置产品 id 1~99 只从 base 通道拉、客户端拒推 8345；记录类型规则下行到客户端缓存表。

### 验证

| 项 | 结果 |
|---|---|
| `pnpm typecheck`（`vue-tsc --noEmit`，全 5 包） | **EXIT=0 零报错** |
| dev 联调 | `VITE_API_BASE_URL=http://127.0.0.1:18080 pnpm dev`，超管 `admin / admin123` |

提交 `6084610`（**`develop` 分支**，gitee `origin` + GitHub 双推）。

### 推送注意

本仓默认分支是 `develop` 不是 `master`；`origin` 挂双 push URL，`git push origin develop` 一次推两边。
GitHub 22 端口偶发不通时改用 `ssh://git@ssh.github.com:443/<org>/<repo>.git <branch>`。

## 历史批次（择要）

| 批次 | 内容 |
|---|---|
| M10 / M11 | 管理端后端能力 / 管理端前端增量落地 |
| S2+S3 | 配合服务端 PivotOS 严格整改（动态 SQL 消除、类型化存储），前端无破坏性改动 |
| M32 | 配合 D1 正服部署，管理端 dev 联调口径固定 `127.0.0.1:18080` |

## 维护约定

新增页面 / 业务模块或 packages 包时，同步更新本文件、[README.md](README.md) 的
「Monorepo 结构」「功能模块」两节及在线文档对应章节。本仓不设 `PROGRESS.md` / `ACCEPTANCE.md`，
逐批次进度统一以 [19-V2收口执行档案](../独立产品规划/19-V2收口执行档案-2026-11-18.md) 为准。
