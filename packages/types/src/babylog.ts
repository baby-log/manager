import type { Emptyable, PageQuery } from './common';

/**
 * BabyLog 管理端契约类型（对齐 babylog-plugin-biz M10 端点，路由 /babylog/**）。
 *
 * 序列化口径：后端项目全局 Long → String（防 JS 大数精度丢失），
 * 雪花 id / version / 毫秒时间戳一律按 string 解析；Integer 枚举开关保持 number。
 * 枚举一律存 name 字符串（FORMULA / PENDING …），绝不存序号。
 */

/* ================= 内置产品库（/babylog/product） ================= */

/** 内置产品行（对齐 ProductVO；本页固定 is_builtin=1，id 落 1~99 预留段） */
export interface ProductVO {
  id: string;
  /** 分类：FORMULA 奶粉 / SUPPLEMENT 补剂 / MEDICINE 药品 / DIAPER 纸尿裤 */
  category: string;
  brand: string;
  name: string;
  spec?: string;
  defaultDose?: string;
  note?: string;
  /** 图标（plugin-file 的 file_id） */
  iconPath?: string;
  /** 上架开关：1 在售 0 下架 */
  enabled: number;
  /** 内置标记（本页恒为 1，仅展示用） */
  isBuiltin?: number;
  /** App 端最后使用时刻（epoch millis，字符串） */
  lastUsedAt?: string;
  /** 同步版本号（每次维护 +1，App 端 base 通道据此增量下发） */
  version?: string;
  /** 服务端最后维护时刻（epoch millis，字符串） */
  serverUpdatedAt?: string;
}

/** 内置产品分页查询（对齐 ProductPageQuery） */
export interface ProductQuery extends PageQuery {
  category?: string;
  brand?: string;
  name?: string;
  /** 上架状态：1 在售 0 下架 */
  enabled?: Emptyable<number>;
}

/** 内置产品编辑请求（对齐 ProductEditCmd；无新增——内置行只由服务端 seed 产生） */
export interface ProductEditRequest {
  category: string;
  brand: string;
  name: string;
  spec?: string;
  defaultDose?: string;
  note?: string;
  iconPath?: string;
  /** 上架开关：1 在售 0 下架 */
  enabled: number;
}

/* ================= 设备查看（/babylog/device） ================= */

/** 账号下的一台已登记设备（对齐 DeviceVO） */
export interface DeviceVO {
  /** 设备行 id（踢出端点用） */
  id: string;
  deviceUuid: string;
  deviceName?: string;
  /** ANDROID / IOS */
  platform?: string;
  appVersion?: string;
  /** ACTIVE 活跃 / KICKED 已被移除 */
  status: string;
  /** 设备级雪花 workerId（0-1023） */
  workerId?: number;
  /** 最后活跃时刻（epoch millis，字符串） */
  lastActiveAt?: string;
}

/** 账号设备总览（对齐 AdminDeviceOverviewVO；account = 用户名或邮箱） */
export interface AdminDeviceOverviewVO {
  userId: string;
  username: string;
  nickname?: string;
  email?: string;
  /** 账号状态：0 正常 1 停用 */
  status?: number;
  /** 该账号全部设备（含 KICKED，按最后活跃倒序） */
  devices: DeviceVO[];
}

/* ================= 版本公告（/babylog/version） ================= */

/** App 版本与公告行（对齐 AppVersionVO；versionCode 是 Integer，保持 number） */
export interface AppVersionVO {
  id: string;
  /** ANDROID / IOS */
  platform: string;
  versionCode: number;
  versionName: string;
  /** 强制更新：0 否 1 是 */
  forceUpdate: number;
  downloadUrl?: string;
  /** 更新说明/公告 */
  notice?: string;
  /** DRAFT 草稿 / PUBLISHED 已发布（单向，发布后锁定） */
  status: string;
  createTime?: string;
  updateTime?: string;
}

/** 版本分页查询（对齐 AppVersionPageQuery） */
export interface AppVersionQuery extends PageQuery {
  platform?: string;
  status?: string;
}

/** 版本新增/编辑请求（对齐 AppVersionSaveCmd；id 为空为新增，落 DRAFT） */
export interface AppVersionSaveRequest {
  platform: string;
  versionCode: number;
  versionName: string;
  forceUpdate: number;
  downloadUrl?: string;
  notice?: string;
}

/* ================= 意见反馈（/babylog/feedback） ================= */

/** 反馈行（对齐 FeedbackVO；匿名提交 userId 为 null） */
export interface FeedbackVO {
  id: string;
  userId?: string | null;
  /** 联系方式（可空） */
  contact?: string;
  content: string;
  /** PENDING 待处理 / REPLIED 已回复 / CLOSED 已关闭 */
  status: string;
  reply?: string;
  replyTime?: string;
  createTime?: string;
}

/** 反馈分页查询（对齐 FeedbackPageQuery） */
export interface FeedbackQuery extends PageQuery {
  status?: string;
}

/** 反馈回复请求（对齐 FeedbackReplyCmd，5-1000 字） */
export interface FeedbackReplyRequest {
  reply: string;
}

/* ================= 记录类型规则（/babylog/record-type-rule，M41） ================= */

/**
 * 记录类型云端规则行（对齐 RecordTypeRuleVO）。
 * 边界：只能调已有类型的参数，无新增端点（防膨胀成动态表单引擎）。
 * enabled/startAgeDays/endAgeDays 为 null = 「该项不覆盖，回落客户端代码默认」。
 */
export interface RecordTypeRuleVO {
  id: string;
  /** 记录类型标识（与 App 端 RecordType 枚举 name 逐字一致） */
  recordType: string;
  /** 分类：FEEDING 喂养 / CARE 护理 / HEALTH 健康 / MEDICAL 医疗 */
  category: string;
  /** 默认开关：null=回落代码默认，0=默认关，1=默认开 */
  enabled?: number | null;
  /** 起始月龄（天）：null=回落代码默认 */
  startAgeDays?: number | null;
  /** 截止月龄（天）：null=回落代码默认 */
  endAgeDays?: number | null;
  /** 记录页类内排序（小的在前） */
  sortOrder?: number;
  /** 类内分组键：null/空=默认不分组 */
  groupKey?: string | null;
  /** 显示文案：null/空=回落代码默认文案 */
  displayLabel?: string | null;
}

/** 规则分页查询（对齐 RecordTypeRulePageQuery） */
export interface RecordTypeRuleQuery extends PageQuery {
  category?: string;
  recordType?: string;
}

/** 规则编辑请求（对齐 RecordTypeRuleEditCmd；recordType 走路径不可改） */
export interface RecordTypeRuleEditRequest {
  /** 默认开关：null=回落代码默认，0=默认关，1=默认开 */
  enabled?: number | null;
  /** 起始月龄（天）：null=回落代码默认 */
  startAgeDays?: number | null;
  /** 截止月龄（天）：null=回落代码默认 */
  endAgeDays?: number | null;
  /** 记录页类内排序（小的在前） */
  sortOrder?: number;
  /** 类内分组键：null/空=默认不分组 */
  groupKey?: string | null;
  /** 显示文案：null/空=回落代码默认文案 */
  displayLabel?: string | null;
}

/* ================= 后台只读总览（/babylog/admin，M53） ================= */

/**
 * BabyLog 后台管理端「所有人 / 家庭 / 宝宝 / 全部记录」只读查询契约（M53）。
 * 统一前缀 /babylog/admin，与既有 5 个 babylog 管理页同一套 sys-admin 鉴权。
 *
 * 口径：全部只读（无编辑 / 删除 / 导出）；跨用户、涉及婴儿健康敏感数据，查看操作留审计。
 * 数值口径：后端 Long 全局序列化为 String、Integer 保持 number，故计数 / id 一律
 * 用 `AdminScalar` 承接，展示时只做字符串化，绝不做数值运算（防 NaN）。
 */

/** 计数 / 状态等可能为 Long(String) 或 Integer(number) 的标量 */
export type AdminScalar = string | number;

/** 总览 7 项计数（对齐 /babylog/admin/overview，非分页） */
export interface AdminOverviewVO {
  /** 注册用户数 */
  userCount: AdminScalar;
  /** 家庭数 */
  familyCount: AdminScalar;
  /** 宝宝数 */
  childCount: AdminScalar;
  /** 喂养记录数 */
  feedingCount: AdminScalar;
  /** 疫苗接种记录数 */
  vaccinationCount: AdminScalar;
  /** 提醒数 */
  reminderCount: AdminScalar;
  /** 今日新增记录数 */
  todayRecordCount: AdminScalar;
}

/** 用户行（/babylog/admin/user/page） */
export interface AdminUserVO {
  userId: string;
  username: string;
  nickname?: string;
  email?: string;
  /** 账号状态：0 正常 1 停用（枚举未定死，未知值原样展示） */
  status?: AdminScalar;
  createTime?: string;
  childCount?: AdminScalar;
  deviceCount?: AdminScalar;
}

/** 用户分页查询 */
export interface AdminUserQuery extends PageQuery {
  /** 用户名 / 昵称 / 邮箱模糊 */
  keyword?: string;
}

/** 家庭行（/babylog/admin/family/page） */
export interface AdminFamilyVO {
  familyId: string;
  familyName: string;
  ownerUserId?: string;
  ownerName?: string;
  memberCount?: AdminScalar;
  childCount?: AdminScalar;
  createTime?: string;
}

/** 家庭分页查询 */
export interface AdminFamilyQuery extends PageQuery {
  /** 家庭名 / 户主模糊 */
  keyword?: string;
}

/** 宝宝行（/babylog/admin/child/page） */
export interface AdminChildVO {
  id: string;
  name: string;
  /** 性别：MALE / FEMALE / UNKNOWN 或数字枚举，未知值原样展示 */
  gender?: AdminScalar;
  birthday?: string;
  isPremature?: AdminScalar | boolean;
  archived?: AdminScalar | boolean;
  ownerUserId?: string;
  familyId?: string;
  createdAt?: string;
}

/** 宝宝分页查询 */
export interface AdminChildQuery extends PageQuery {
  userId?: string;
  familyId?: string;
  /** 宝宝姓名模糊 */
  keyword?: string;
}

/**
 * 记录明细表名白名单（/babylog/admin/record/page 的 table 参数，服务端据此限流防注入）。
 * 前端下拉直接用这份做 value，顺序与服务端约定一致。
 */
export const ADMIN_RECORD_TABLES = [
  'feedings',
  'diapers',
  'sleeps',
  'baths',
  'spits',
  'pump_sessions',
  'measurements',
  'medications',
  'vaccinations',
  'follow_ups',
  'visits',
] as const;

/** 记录明细表名 */
export type AdminRecordTable = (typeof ADMIN_RECORD_TABLES)[number];

/** 记录明细分行（跨表归一；summary 是服务端拼好的中文摘要，前端不二次加工） */
export interface AdminRecordVO {
  id: string;
  /** 归属表名（ADMIN_RECORD_TABLES 之一） */
  table: string;
  childId?: string;
  userId?: string;
  /** 记录子类型 */
  type?: string;
  /** 服务端拼好的中文摘要 */
  summary?: string;
  startedAt?: string;
  createdAt?: string;
  /** 逻辑删除标记：0/1 或 boolean */
  deleted?: AdminScalar | boolean;
}

/** 记录明细分页查询 */
export interface AdminRecordQuery extends PageQuery {
  /** 表名白名单值，'' = 全部表 */
  table?: AdminRecordTable | '';
  userId?: string;
  familyId?: string;
  childId?: string;
  /** 起始日期 YYYY-MM-DD */
  from?: string;
  /** 截止日期 YYYY-MM-DD */
  to?: string;
}

/** 疫苗行（/babylog/admin/vaccination/page） */
export interface AdminVaccinationVO {
  id: string;
  childId?: string;
  childName?: string;
  vaccineName?: string;
  doseNo?: AdminScalar;
  scheduledAt?: string;
  doneAt?: string;
  status?: AdminScalar;
}

/** 疫苗分页查询 */
export interface AdminVaccinationQuery extends PageQuery {
  userId?: string;
  childId?: string;
  status?: string;
}

/** 提醒行（/babylog/admin/reminder/page） */
export interface AdminReminderVO {
  id: string;
  childId?: string;
  childName?: string;
  kind?: string;
  title?: string;
  dueAt?: string;
  level?: AdminScalar;
}

/** 提醒分页查询 */
export interface AdminReminderQuery extends PageQuery {
  userId?: string;
  childId?: string;
}
