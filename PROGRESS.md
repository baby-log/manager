# ui · PROGRESS

> 本仓此前无 `PROGRESS.md`（批次流水散见 `CHANGELOG.md` 与工作区日志）。按 `独立产品规划/23` §五 K0 要求，自本节点起建立进度台账，首条即基线锚点。

## K0 · 基线锚点（2026-11-23 · 节点制起点）

- 本地基线 tag `babylog-v2.4.1` → `c6112fb`（当前 HEAD / `develop`）；六仓同名、仅本地、未 push、不占 M 批次；上游 `v2.5~v3.2` 框架历史 tag 未动。本行属 K0 授权文档改动，未 commit。

## K3 · M70 媒体存储底座 · 接入侧（2026-11-24，工作区未提交）

- **节点 / 范围**：K3，M 号 **M70**（写前 grep 六仓 PROGRESS `M70` 占用 0）。只改 Android/iOS/Mini/TV/ui 五仓，**server 仓不动**（底座 K2 已验收 `43a35e4`）。
- **交付（ui）**：新增配额页 `apps/admin/src/views/babylog/mediaQuota/index.vue`（每宝宝**初始容量展示** + 后台**动态调整**）、API `apps/admin/src/api/babylog/media.ts`、类型 `packages/types/src/babylog.ts` 追加 `MediaQuotaVO` / `MediaQuotaAdjustRequest`（Long 全按 string）。
- **端点**（逐字对齐 `docs/media-endpoints-M69.md`）：读 `GET /app/babylog/media/quota?childId=`、写 `PUT /babylog/media/quota`（字段 `childId` + `ownerUserId` + `adjustedBytes`；已存在行服务端保留原 `user_id`）。不硬编码 `/api` 或域名（沿用 `request` 实例 `apiBase`）。组件显式 import Element Plus（`ElDialog` 等），不依赖全局自动注册。
- **动态路由**：`import.meta.glob('../views/**/*.vue')` 按 `component` 字符串装载 ⇒ 后端菜单 component 必须是 **`babylog/mediaQuota/index`**（与目录逐字一致），新增页面无需改前端路由表。

### 管理端菜单权限字符登记（K2→K3 移交点）
- 配额页按钮挂 `v-hasPermi` 权限字符 **`babylog:media:list`**（查询）/ **`babylog:media:adjust`**（调整），这是 K3 在 ui 侧登记的**字面量常量**。
- **server 侧三处配套不在本节点改（红线：K3 只改五仓）**，如实移交后续服务端节点：① `V2.2.15__babylog_admin_console.sql` 风格菜单行（component=`babylog/mediaQuota/index`、perms 用上面字符）；② `AdminMediaController` 目前是类级 `@SaCheckLogin(type=StpSysUtil.TYPE)`，**无方法级 `@SaCheckPermission`**；③ `AdminControllerPermissionContractTest` 硬编码只遍历 5 个历史 controller（`AdminProductController`/`AdminDeviceController`/`AdminAppVersionController`/`AdminFeedbackController`/`AdminRecordTypeRuleController`），**不含 `AdminMediaController`**，新增权限字符后需把它纳入遍历清单。

### 验证
- `pnpm --filter @pivotos/admin typecheck` **通过**；`pnpm --filter @pivotos/admin build` **`✓ built in 9.06s`**；生产产物 `dist/assets/*.js` 命中 `babylog:media:adjust` / `/babylog/media/quota`，证明配额页被 `import.meta.glob` 收进 bundle。`dist/` 被 `.gitignore` 忽略、未跟踪，工作区无生成物残留。

### 边界
- 未做：dev 18080 联调（本机 18080/3306 无监听）、菜单 SQL / 注解 / 契约测试回填（server 侧，见上）、真机点按。**未 commit / 未 push**，报告后即停待龙哥综合验收。

## K6-S · M76 育儿知识库 · 管理端 FAQ 维护（2026-11-25，工作区未提交）

- **节点 / 范围**：K6-S（服务端 KB/RAG 底座节点；ui 侧只做管理端 FAQ 维护页），M 号 **M76**（写前 grep 六仓 PROGRESS `M76` 占用 0、全局上限 M75）。只改 ui 仓；基线 HEAD `7fb174e`（本会话实测）。
- **交付**：新增 `apps/admin/src/views/babylog/kbFaq/index.vue`（分类 / 关键词筛选、列表、新增编辑、删除、来源必填、正文 2000 字上限、顶部固定免责）+ `apps/admin/src/api/babylog/kb.ts`（`listKbFaq` / `saveKbFaq` / `deleteKbFaq` + 本地 `KbFaqVO` / `KbFaqSaveCmd` 类型）。**不改 `packages/types`**，增量只落 `views/babylog/` 与 `api/babylog/`。
- **端点**（逐字对齐 `server/babylog-plugins/babylog-plugin-biz/docs/kb-endpoints-M76.md`）：`GET /babylog/kb/faq/list`、`POST /babylog/kb/faq/save`、`DELETE /babylog/kb/faq/{id}`；类级 `@SaCheckLogin(type=StpSysUtil.TYPE)`，沿用管理端登录态。不硬编码 `/api` 或域名（沿用 `request` 实例 `apiBase`）；Element Plus 组件全部显式 import。
- **全局契约**：所有 Long（id）字符串；`enabled` / `favorited` 整数 1/0 绝不发 true/false；null 键缺省、VO 字段全可选；`source` 必填（服务端 `8465`）。
- **红线（`10` §4.1）**：页面顶部常驻固定免责「仅供参考，不构成医疗建议，异常请及时就医」（与服务端问答响应同一句）；来源必填 + 正文限 2000 字禁整篇搬运；禁用词 0 处用于 UI。
- **动态路由**：后端菜单 component 串必须逐字为 **`babylog/kbFaq/index`**（`permission.ts` 用 `import.meta.glob` 装配），本页不改前端路由表。菜单行 / 方法级 `@SaCheckPermission` / `AdminControllerPermissionContractTest` 三处配套按 K3 先例登记到「遗留与移交」，本页**不使用 `v-hasPermi`**（靠菜单可见性控制访问）。
- **额度参数**：`KB_QA` 免费次数不在本页维护，走「系统工具 - 参数设置」的 `babylog.ai.quota.kb_qa.limit`（`sys_config`），改完实时生效。V3 购买引导 / 虚拟支付 / 线下购买**移交主会话**，本页零相关代码。
- **验证**：`pnpm -C ui run typecheck` **通过**、`pnpm -C ui run build` **通过**（生产产物含 FAQ 页）；dev 18080 联调**未跑**（本机 18080/3306 无监听，如实登记、不伪造）。
- **边界**：未做 dev 18080 联调、server 侧菜单权限三处配套回填；**未 commit / 未 push**，报告后即停待龙哥综合验收。

### K7 / M78 · 隐私政策改版（ui 源码零改动 · 2026-11-25）

- 管理端无隐私政策页面；按门禁 C 从干净 worktree 重建生产包（补 `.env.production` 的 `VITE_API_URL=https://baby-api.293242.com`，构建期本地文件不落仓）：`UI_EXIT=0`、`✓ built in 30.29s`。
- dist 221 文件、域名反扫：正式 1 / 测试 0 / dev 0。产物 `发布包/K7-M78-隐私政策改版/ui/babylog-admin-ui-2.5.1-K7-M78.tar.gz`。
- **未 commit / 未 push**；部署归龙哥。

