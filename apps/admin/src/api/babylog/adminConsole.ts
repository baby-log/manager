import type {
  AdminChildQuery,
  AdminChildVO,
  AdminFamilyQuery,
  AdminFamilyVO,
  AdminOverviewVO,
  AdminRecordQuery,
  AdminRecordVO,
  AdminReminderQuery,
  AdminReminderVO,
  AdminUserQuery,
  AdminUserVO,
  AdminVaccinationQuery,
  AdminVaccinationVO,
  PageResult,
} from '@pivotos/types';
import { formatDate } from '@pivotos/core';
import { request } from '../request';

/**
 * BabyLog 后台管理端只读查询（/babylog/admin，M53 契约，sys-admin 鉴权）。
 *
 * 全部只读：跨用户、涉及婴儿健康敏感数据，本批只提供查看，任何查看操作留审计；
 * 不提供编辑 / 删除 / 导出端点。统一 R<T> 包装（code=0 时 data 有效），
 * 分页参数 pageNum / pageSize，分页体按框架 PageResult（list / total / pageNum / pageSize）承接。
 *
 * 路径口径：request 实例（@/api/request）已把 apiBase 设为 baseURL——代理模式 '/api'、
 * 生产直连由 VITE_API_URL 指定域名。故与 product.ts 一致一律用相对路径，不硬编码
 * '/api' 或域名；若显式再拼 `${apiBase}` 会在代理模式产生 /api/api/... 双前缀。
 */

/** 7 个端点集中定义：页面 useTablePage 直接取 url，函数也复用同一处 */
const ADMIN = '/babylog/admin';

export const ADMIN_API = {
  overview: `${ADMIN}/overview`,
  userPage: `${ADMIN}/user/page`,
  familyPage: `${ADMIN}/family/page`,
  childPage: `${ADMIN}/child/page`,
  recordPage: `${ADMIN}/record/page`,
  vaccinationPage: `${ADMIN}/vaccination/page`,
  reminderPage: `${ADMIN}/reminder/page`,
} as const;

/** 总览 7 项计数（非分页） */
export function getAdminOverview(): Promise<AdminOverviewVO> {
  return request.get<unknown, AdminOverviewVO>(ADMIN_API.overview);
}

/** 所有人：用户分页 */
export function pageAdminUser(params: AdminUserQuery): Promise<PageResult<AdminUserVO>> {
  return request.get<unknown, PageResult<AdminUserVO>>(ADMIN_API.userPage, { params });
}

/** 家庭：分页 */
export function pageAdminFamily(params: AdminFamilyQuery): Promise<PageResult<AdminFamilyVO>> {
  return request.get<unknown, PageResult<AdminFamilyVO>>(ADMIN_API.familyPage, { params });
}

/** 宝宝：分页 */
export function pageAdminChild(params: AdminChildQuery): Promise<PageResult<AdminChildVO>> {
  return request.get<unknown, PageResult<AdminChildVO>>(ADMIN_API.childPage, { params });
}

/** 全部记录：跨表分页（table 走服务端白名单） */
export function pageAdminRecord(params: AdminRecordQuery): Promise<PageResult<AdminRecordVO>> {
  return request.get<unknown, PageResult<AdminRecordVO>>(ADMIN_API.recordPage, { params });
}

/** 疫苗：分页 */
export function pageAdminVaccination(
  params: AdminVaccinationQuery,
): Promise<PageResult<AdminVaccinationVO>> {
  return request.get<unknown, PageResult<AdminVaccinationVO>>(ADMIN_API.vaccinationPage, { params });
}

/** 提醒：分页 */
export function pageAdminReminder(params: AdminReminderQuery): Promise<PageResult<AdminReminderVO>> {
  return request.get<unknown, PageResult<AdminReminderVO>>(ADMIN_API.reminderPage, { params });
}

/* ============ M53 页面共用展示辅助（本模块唯一的 ts 文件，避免 5 页重复） ============ */

/**
 * 时间字段：兼容「Long 毫秒/秒时间戳字符串」与「服务端已格式化日期串」两种口径。
 * 非纯数字串原样展示，绝不对格式化串做 Number() → NaN。
 */
export function formatAdminTime(value?: string | null): string {
  if (value == null || value === '') return '—';
  const text = String(value);
  if (/^\d{10}$/.test(text)) return formatDate(Number(text) * 1000);
  if (/^\d{13}$/.test(text)) return formatDate(Number(text));
  return text;
}

/** 布尔 / 0-1 开关：Long、Integer、boolean、字符串都兼容，未知值原样 */
export function formatAdminBool(value?: string | number | boolean | null): string {
  if (value === true || value === 1 || value === '1' || value === 'true') return '是';
  if (value === false || value === 0 || value === '0' || value === 'false' || value == null || value === '') {
    return '否';
  }
  return String(value);
}
