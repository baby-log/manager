import type { MediaQuotaAdjustRequest, MediaQuotaVO } from '@pivotos/types';
import { request } from '../request';

/**
 * BabyLog 媒体容量配额（K3 / M70 接入侧；服务端底座见 K2/M69 `docs/media-endpoints-M69.md` §二）。
 *
 * 两个端点前缀不同，逐字对齐端点签名、不得漂移：
 * - 读：`GET /app/babylog/media/quota?childId=`（App 端前缀，类级 app-user 鉴权，端点 #7）
 * - 写：`PUT /babylog/media/quota`（管理端前缀，类级 sys 鉴权，端点 #8）
 *
 * ⚠️ 契约张力（登记到「遗留与移交」，本节点不改 server 仓）：读端点挂在 app-user 鉴权下，
 * 而管理端页面通常持 sys-admin 登录态，两端登录类型不同。本节点按给定签名原样接线，
 * 不擅自新增/改路径；若联调发现读不通，需由服务端节点决定是否补一个管理端读端点或放开鉴权。
 *
 * 全局契约坑：所有 Long 出/入站是**字符串**（雪花 id / 字节数），adjustedBytes 可空缺键要容忍；
 * `user_id` 服务端按 token 盖章，写侧 `ownerUserId` 仅在「行尚不存在」时用于建行，已存在行保留原值。
 * 错误码：8424 配额已满、8425 参数非法（adjustedBytes < 0）。
 *
 * 边界：V3 前零画面数据；配额页只读写容量，不承载任何媒体文件/画面数据。
 */

/** 读宝宝配额（初始 / 调整后 / 已用 / 剩余）。 */
export function getMediaQuota(childId: string): Promise<MediaQuotaVO> {
  return request.get<unknown, MediaQuotaVO>('/app/babylog/media/quota', {
    params: { childId },
  });
}

/** 后台动态调整容量（只写 adjustedBytes；已存在行保留原 user_id）。 */
export function adjustMediaQuota(body: MediaQuotaAdjustRequest): Promise<MediaQuotaVO> {
  return request.put<unknown, MediaQuotaVO>('/babylog/media/quota', body);
}
