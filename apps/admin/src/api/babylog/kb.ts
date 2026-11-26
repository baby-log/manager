import { request } from '../request';

/**
 * BabyLog 育儿知识库 FAQ 维护（K6-S / M76，管理端前缀 /babylog/kb/faq）。
 *
 * 契约要点：
 * - 所有 Long（id）**入站/出站都是字符串**（全局 fastjson2 WriteLongAsString）；
 * - enabled / favorited 是整数 1/0，绝不发 true/false（TINYINT 布尔契约）；
 * - null 键缺省，前端容忍缺键（VO 字段一律可选）；
 * - 服务端类级 @SaCheckLogin(type = StpSysUtil.TYPE)，沿用管理端登录态；
 * - 红线一：source 必填（空来源服务端 8465 拒绝）；正文限 2000 字，禁整篇搬运；
 * - 红线二：免责文案「仅供参考，不构成医疗建议，异常请及时就医」由服务端在问答响应下发，
 *   本管理页在页面顶部同样展示（10 号 §4.1）。
 *
 * KB_QA 免费额度不在这里维护：走「系统工具 - 参数设置」页的
 * babylog.ai.quota.kb_qa.limit（sys_config），改完实时生效、无需重启。
 */

/** 知识库条目（字段全可选：NON_NULL 契约下 null 键缺省） */
export interface KbFaqVO {
  id?: string;
  category?: string;
  title?: string;
  content?: string;
  source?: string;
  sourceUrl?: string;
  enabled?: number;
  sortOrder?: number;
  favorited?: number;
}

/** 新增 / 编辑入参；id 为空 = 新增 */
export interface KbFaqSaveCmd {
  id?: string;
  category: string;
  title: string;
  content: string;
  source: string;
  sourceUrl?: string;
  enabled?: number;
  sortOrder?: number;
}

/** 管理端列表（含下架条目；category / keyword 可选） */
export function listKbFaq(category?: string, keyword?: string): Promise<KbFaqVO[]> {
  return request.get<unknown, KbFaqVO[]>('/babylog/kb/faq/list', {
    params: { category: category || undefined, keyword: keyword || undefined },
  });
}

/** 新增 / 编辑（来源必填，正文限 2000 字） */
export function saveKbFaq(body: KbFaqSaveCmd): Promise<KbFaqVO> {
  return request.post<unknown, KbFaqVO>('/babylog/kb/faq/save', body);
}

/** 删除（逻辑删条目 + 物理清收藏关联） */
export function deleteKbFaq(id: string): Promise<void> {
  return request.delete<unknown, void>(`/babylog/kb/faq/${encodeURIComponent(id)}`);
}
