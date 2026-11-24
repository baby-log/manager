import type { RecordTypeRuleEditRequest, RecordTypeRuleVO } from '@pivotos/types';
import { request } from '../request';

/**
 * BabyLog 记录类型云端规则（/babylog/record-type-rule，M41 契约）。
 * 边界写死：只有分页/详情/编辑，没有新增——云端只能调已有类型的默认开关、
 * 起止月龄、排序、分组、显示文案；新增记录类型永远走发版。
 */

/** 规则详情（8392 不存在） */
export function getRecordTypeRule(id: string): Promise<RecordTypeRuleVO> {
  return request.get<unknown, RecordTypeRuleVO>(`/babylog/record-type-rule/${id}`);
}

/** 编辑规则（改动经 base 通道增量下发 App；recordType 不可改） */
export function updateRecordTypeRule(id: string, body: RecordTypeRuleEditRequest): Promise<void> {
  return request.put<unknown, void>(`/babylog/record-type-rule/${id}`, body);
}
