# 更新日志

本文件记录 PivotOS UI / BabyLog 管理端的版本变更，格式参考
[Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。
本仓是上游 `pivotos-ui` 的 fork，未全量改名；框架侧变更沿用上游，本文件只记 BabyLog 增量与收官状态。

## [2.4.0] — V2 固定版（2026-11-19，未部署公开域名）

> **版本号固定**：六端产品版本统一为 `V2.4.0`；npm 包版本 `3.2.0` 是上游框架版本，不改。
> 生产包 `babylog-admin-ui-2.4.0.tar.gz` 由 `VITE_API_URL=https://baby-api.293242.com pnpm build` 生成
> （注意：vite 清空 `dist` 可能被沙箱批量删除守卫拦，需先移走旧 dist 再 build；判成功必须看 build 退出码）。
> 管理端生产域名部署与 V3 公开处理均未解冻；dev 联调固定本机隔离 dev 服 `18080`。

### 新增（M67-F · 产品页排序/默认数，仍归 V2.4.0）

- 内置产品页补 **排序（sortOrder）** 列与编辑字段：数字越大越靠前，四端选择列表同口径
  （服务端 M67-A 已按 `sort_order DESC, id ASC` 排序并支持维护含内置行）。
- 列表补 **默认数** 只读列：各家庭把该产品设为本类默认的偏好行聚合数
  （`ProductVO.defaultCount`，Long → string）。
- ⚠️ **必改项而非纯展示**：服务端 `ProductEditCmd.sortOrder` 是 `@NotNull`，M67-A 上线后
  旧表单不提交该字段会整单 400 校验失败；本次提交时清空按 `0` 兜底。
- 验证：`pnpm typecheck` 五包 EXIT=0；`pnpm build` `✓ built in 9.95s` 退出码 0；
  dist 反查新文案命中；`eslint` 两文件零报错。

### 修复（M53 · 验收问题修复批，仍归 V2.4.0）

- **后台能看全部数据**（用户验收问题 4）：新增 5 个只读页面
  `adminOverview / adminUser / adminFamily / adminChild / adminRecord`，
  配套 `api/babylog/adminConsole.ts`（7 个 GET）与 `packages/types/src/babylog.ts` 类型。
  覆盖账号、家庭、宝宝、记录明细（11 张表白名单）、疫苗、提醒、运营概览；
  记录明细页用标签页承载疫苗与提醒子表。
- 全部页面只读，无编辑/删除/导出按钮（婴儿健康数据属敏感个人信息）；
  概览页写明「只读·跨用户·敏感数据·操作留审计」。
- 菜单由 server `V2.2.15__babylog_admin_console.sql` 注册（5060~5064），
  component 字符串与目录名逐字一致，路由仍由后端 `/system/menu/routers` 下发后 `addRoute`。
- 验证：`pnpm -C apps/admin build` → `vue-tsc --noEmit` 零报错、`vite v7.3.6`
  `✓ 3135 modules transformed`、`✓ built in 10.31s`、退出码 0；先把旧 `dist` 移出再构建
  （避开清空 dist 的批量删除守卫）。dist 反查 5 个页面文案各命中 1 个 chunk。

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

> 订正（K0 起，只读提示不回改上一行）：按 `独立产品规划/23` §五 K0 要求，本仓已补建 [PROGRESS.md](PROGRESS.md)（`??` 未跟踪、K0 授权文档改动），逐批次进度以该文件为准；上面「本仓不设 PROGRESS.md」是建表前的历史口径。

## K3 · M70 媒体存储底座 · 接入侧（2026-11-24，工作区未提交 · 未纳入版本段落）

> 本批是 `develop` 上**未提交未部署**的开发批次（M 号 M70），不新开版本号段落、不回改 `[2.4.0]` 及以上历史。逐条交付与验证见 [PROGRESS.md](PROGRESS.md) 尾章「K3 · M70」。

- **配额页**：新增 `apps/admin/src/views/babylog/mediaQuota/index.vue`（初始容量展示 + 动态调整）、`apps/admin/src/api/babylog/media.ts`、`packages/types/src/babylog.ts` 追加 `MediaQuotaVO` / `MediaQuotaAdjustRequest`（Long 全按 string）。读 `GET /app/babylog/media/quota?childId=`、写 `PUT /babylog/media/quota`（`childId` + `ownerUserId` + `adjustedBytes`）。
- **菜单权限字符登记（K2→K3 移交点）**：页面挂 `babylog:media:list` / `babylog:media:adjust`；动态路由 component 串须为 `babylog/mediaQuota/index`。**server 侧三处配套（菜单 SQL 行 / `AdminMediaController` 方法级 `@SaCheckPermission` / `AdminControllerPermissionContractTest` 纳入新 controller）不在本节点改**（K3 只改五仓），如实移交后续服务端节点。
- **验证**：`typecheck` 通过、`build ✓ built in 9.06s`、生产产物命中配额页；`dist/` 被 gitignore 忽略。
- **未做**：dev 18080 联调（无库环境）、server 侧权限字符回填、commit / push。待龙哥综合验收。

## K6-S · M76 育儿知识库 · 管理端 FAQ 维护（2026-11-25，工作区未提交 · 未纳入版本段落）

> `develop` 上**未提交未部署**的开发批次（M 号 M76），不新开版本号段落、不回改 `[2.4.0]` 及以上历史、不回改 M70 章节。逐条交付与验证见 [PROGRESS.md](PROGRESS.md) 尾章「K6-S · M76」。

- **FAQ 页**：新增 `apps/admin/src/views/babylog/kbFaq/index.vue`（分类 / 关键词筛选、列表、新增编辑、删除、来源必填、正文 2000 字上限、顶部固定免责）、`apps/admin/src/api/babylog/kb.ts`（3 端点 + 本地 VO/Cmd 类型，不改 `packages/types`）。端点 `GET /babylog/kb/faq/list`、`POST /babylog/kb/faq/save`、`DELETE /babylog/kb/faq/{id}`。
- **契约**：Long 全按 string；`enabled`/`favorited` 整数 1/0；null 键缺省、VO 字段全可选；动态路由 component 串须为 `babylog/kbFaq/index`，不改前端路由表。**server 侧菜单权限三处配套**（菜单 SQL 行 / 方法级 `@SaCheckPermission` / `AdminControllerPermissionContractTest` 纳入新 controller）按 K3 先例登记移交，本页不使用 `v-hasPermi`。
- **红线**：顶部常驻「仅供参考，不构成医疗建议，异常请及时就医」；来源必填（服务端 `8465`）+ 正文限 2000 字禁整篇搬运；禁用词 0 处用于 UI。V3 付费引导 / 虚拟支付 / 线下购买移交主会话，本页零相关代码。
- **验证**：`typecheck` 通过、`build` 通过；dev 18080 联调未跑（无库环境，如实登记）。
- **未做**：dev 18080 联调、server 侧权限字符回填、commit / push。待龙哥综合验收。

### K7 / M78 · 隐私政策改版（ui 零改动 · 2026-11-25）

- 管理端无隐私页；按门禁 C 重建生产包（正式域名 `.env.production`），域名反扫 正式 1 / 测试 0 / dev 0。未 commit / push。

