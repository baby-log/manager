import type { ProductEditRequest, ProductVO } from '@pivotos/types';
import { request } from '../request';

/**
 * BabyLog 内置产品库（/babylog/product，M10 契约）。
 * 无新增端点：内置行（id 1~99）只由服务端 seed 产生，管理端仅查 / 改（含上下架）/ 软删。
 * 改动经 App 端 base 通道增量下发（server_updated_at / version 语义，服务端盖章）。
 */

/** 内置产品详情（墓碑行按不存在处理，8348） */
export function getProduct(id: string): Promise<ProductVO> {
  return request.get<unknown, ProductVO>(`/babylog/product/${id}`);
}

/** 编辑内置产品（含上下架；8349 拒绝非内置行） */
export function updateProduct(id: string, body: ProductEditRequest): Promise<void> {
  return request.put<unknown, void>(`/babylog/product/${id}`, body);
}

/** 软删内置产品（置墓碑，App 端隐藏，不可恢复） */
export function removeProduct(id: string): Promise<void> {
  return request.delete<unknown, void>(`/babylog/product/${id}`);
}
