import type { AppVersionSaveRequest, AppVersionVO } from '@pivotos/types';
import { request } from '../request';

/**
 * BabyLog 版本公告（/babylog/version，M10 契约）。
 * 状态机 DRAFT → PUBLISHED 单向：已发布行改/删/再发布一律 8391（要改内容就发新 versionCode）。
 */

/** 版本详情（8390 不存在） */
export function getVersion(id: string): Promise<AppVersionVO> {
  return request.get<unknown, AppVersionVO>(`/babylog/version/${id}`);
}

/** 新增版本（落 DRAFT，发布走独立端点；返回新记录 id） */
export function createVersion(body: AppVersionSaveRequest): Promise<string> {
  return request.post<unknown, string>('/babylog/version', body);
}

/** 编辑版本（仅 DRAFT，8391 拒绝已发布行） */
export function updateVersion(id: string, body: AppVersionSaveRequest): Promise<void> {
  return request.put<unknown, void>(`/babylog/version/${id}`, body);
}

/** 发布版本（DRAFT → PUBLISHED，单向锁定） */
export function publishVersion(id: string): Promise<void> {
  return request.post<unknown, void>(`/babylog/version/${id}/publish`);
}

/** 删除版本（仅 DRAFT，逻辑删除） */
export function removeVersion(id: string): Promise<void> {
  return request.delete<unknown, void>(`/babylog/version/${id}`);
}
