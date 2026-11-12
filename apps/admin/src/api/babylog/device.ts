import type { AdminDeviceOverviewVO } from '@pivotos/types';
import { request } from '../request';

/**
 * BabyLog 设备查看（/babylog/device，M10 契约）。
 * account 可传用户名或邮箱（服务端先按用户名精确查、再按邮箱兜底，都 miss 报 8362）。
 */

/** 按账号查设备总览（含 KICKED，按最后活跃倒序） */
export function getDeviceOverview(account: string): Promise<AdminDeviceOverviewVO> {
  return request.get<unknown, AdminDeviceOverviewVO>('/babylog/device/overview', {
    params: { account },
  });
}

/** 踢出设备（与本人移除同语义：拦 refresh；重新登录可复活，workerId 不回收） */
export function kickDevice(id: string): Promise<void> {
  return request.post<unknown, void>(`/babylog/device/${id}/kick`);
}
