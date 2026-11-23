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
