# PivotOS UI / BabyLog 管理端（pivotos-ui）

> 筱筱框架（PivotOS）「一码三端」企业管理平台 —— PC 管理端（pnpm workspace Monorepo）。
> 本仓是上游 `pivotos-ui` 的 fork，**未全量改名**：框架部分沿用原包名与目录，BabyLog 增量只落
> `views/babylog/` 等少数几处，不要全局替换名称。
>
> 📖 在线文档：[pivotos-doc.293242.com](https://pivotos-doc.293242.com) ｜ 🖥️ 在线演示：[pivotos-pc.293242.com](https://pivotos-pc.293242.com)（账号 `admin / admin123`）

## 当前状态（V2 固定版 V2.4.0，2026-11-19）

| 项 | 结果 |
|---|---|
| 版本 | **产品版本 `V2.4.0`**；`package.json` 的 `3.2.0` 是 PivotOS 框架版本，双轨保留不改 |
| 业务范围 | BabyLog 管理端增量：内置产品、记录类型规则、设备管理、版本管理、意见反馈；框架侧系统管理 / 消息 / 工作流 / AI 等能力沿用上游 |
| 类型门禁 | `pnpm typecheck`（`vue-tsc --noEmit`）**EXIT=0 零报错** |
| dev 联调 | `VITE_API_BASE_URL=http://127.0.0.1:18080 pnpm dev`；超管 `admin / admin123` |
| 仓库 | `develop` 分支（**不是 `master`**，推送时别写错）；gitee（`origin`）+ GitHub 双推；V2 收官 HEAD `6084610` |
| 未解冻 | 管理端生产域名部署、V3 公开处理；按发布节奏 V3 完成前不做任何公开处理 |

> 本仓不设 `PROGRESS.md` / `ACCEPTANCE.md`：管理端的逐批次进度统一在
> [19-V2收口执行档案](../独立产品规划/19-V2收口执行档案-2026-11-18.md) 与服务端
> [README](../server/README.md)，不补写历史台账。

## 技术栈

Vue 3 + TypeScript 5.8 + Vite 7 + Element Plus + UnoCSS + Pinia + vue-router 4 + vue-i18n + ECharts + wangeditor

## Monorepo 结构

按「类型定义 → 核心能力 → 通用 UI → 业务组件 → 应用」五层组织：

```
pivotos-ui
├── packages/
│   ├── types/        # @pivotos/types       与后端 DTO 一一对应的全量 TS 类型声明
│   ├── core/         # @pivotos/core        Axios 封装 / 权限校验 / 指令 / hooks（字典/分页/下载），无框架依赖
│   ├── ui/           # @pivotos/ui          Element Plus 二次封装：YTable / YForm / YDialog / YSearchForm + 主题系统
│   └── components/   # @pivotos/components  业务组件：字典回显 / 部门树 / 用户选择 / 图标选择 / 文件上传
└── apps/admin/       # @pivotos/admin       管理端应用（布局 / 动态路由 / Pinia / 系统管理 / 消息 / AI / 工作流…）
    └── src/views/babylog/   # ★ BabyLog 增量：device / feedback / product / recordTypeRule / version
```

**关键约定**：

- 业务页面只允许引用 `@pivotos/ui` 导出组件（`<YTable>` / `<YForm>`），禁止直接 import Element Plus
- 所有 API 调用集中于 `api/{域}/*.ts`，禁止组件内裸调 axios
- 单文件组件 ≤ 400 行；按钮级权限 `v-hasPermi`，角色判断 `v-hasRole`
- 请求统一 `/api` 前缀：开发经 Vite 代理、生产经 Nginx 反代剥离前缀，三环境零 CORS

## 功能模块

系统管理（用户/角色/菜单/部门/岗位/字典/参数/公告/日志/在线用户）· 消息中心 · 文件管理 · 工作流（流程定义/发起/待办/已办）· AI 对话（SSE 流式 + RAG 引用联动）· AI Coding · AI 知识库（解析预览/分块/检索评测）· AI 配置（供应商/多 Key）· 代码生成器 · 监控（服务/缓存/运营看板）· 认证与个人中心

**BabyLog 增量**：内置产品（id 1~99 只从 base 通道拉、客户端拒推 8345）· 记录类型云端规则 · 设备与绑定管理 · 客户端版本 · 意见反馈。改内置产品时必须**置空 `serverUpdatedAt` 再 `updateById`**，否则 base 游标失效（与服务端 M10 口径一致）。

## 开发调试

环境要求：Node ≥ 20、pnpm 9.x

```bash
git clone https://github.com/pivotos-inc/pivotos-ui.git
cd pivotos-ui
pnpm install

cp apps/admin/.env.example apps/admin/.env.development   # 按需修改后端地址（默认 http://localhost:8080）

pnpm dev            # 启动管理端 http://localhost:5173（/api 代理到后端）
pnpm typecheck      # 类型门禁（全 5 包），V2 收官实测 EXIT=0
pnpm build          # 构建门禁（产物 apps/admin/dist/）
```

**BabyLog dev 联调固定本机隔离 dev 服**（正式域名版本落后，不要直连正式服）：

```bash
VITE_API_BASE_URL=http://127.0.0.1:18080 pnpm dev
```

dev 服起法见 [server README](../server/README.md)「日常验证命令」；超管 `admin / admin123`。

## 生产部署

`pnpm build` 后将 `apps/admin/dist/` 部署至 Nginx（样例见 framework 仓 `deploy/nginx-pivotos.conf`）：静态文件 + `location /api/` 反代后端并剥离 `/api` 前缀。详见在线文档《部署指南》与 [13-D1正服部署执行手册](../独立产品规划/13-D1正服部署执行手册.md)。

## 相关仓库与文档

| 仓库 / 文档 | 说明 |
| --- | --- |
| [server](../server/README.md) | 后端（Spring Boot 4.x + JDK 25，本仓的 API 提供方） |
| [BabyLog-Android](../BabyLog-Android/README.md) · [BabyLog-iOS](../BabyLog-iOS/README.md) · [BabyLog-Mini](../BabyLog-Mini/README.md) · [BabyLog-TV](../BabyLog-TV/README.md) | 四端客户端 |
| [独立产品规划/README](../独立产品规划/README.md) | 本地规划文档索引（00~19） |
| [19-V2收口执行档案](../独立产品规划/19-V2收口执行档案-2026-11-18.md) | V2 台账与实测证据 |

上游：[pivotos-framework](https://github.com/pivotos-inc/pivotos-framework)（后端）· [pivotos-app](https://github.com/pivotos-inc/pivotos-app)（uni-app 一码三端）· [pivotos-docs](https://github.com/pivotos-inc/pivotos-docs)（项目文档库）。

## 维护约定

> 新增页面 / 业务模块或 packages 包时，须同步更新本 README 的「Monorepo 结构」「功能模块」两节及在线文档对应章节；
> 改 BabyLog 增量时同步更新 [CHANGELOG.md](CHANGELOG.md)。`origin` 挂双 push URL，
> 提交后 `git push origin develop` 一次推两边。
