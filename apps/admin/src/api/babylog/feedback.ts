import type { FeedbackReplyRequest } from '@pivotos/types';
import { request } from '../request';

/**
 * BabyLog 意见反馈（/babylog/feedback，M10 契约）。
 * App 端匿名提交（POST /app/babylog/feedback，不在本模块），管理端查看 / 回复。
 */

/** 回复反馈（PENDING → REPLIED，盖回复时间；对已回复行再次回复 = 覆盖旧回复） */
export function replyFeedback(id: string, body: FeedbackReplyRequest): Promise<void> {
  return request.put<unknown, void>(`/babylog/feedback/${id}/reply`, body);
}
