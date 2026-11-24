import { ElNotification } from 'element-plus';
import { createRequest } from '@pivotos/core';
import { apiBase } from './base';

/**
 * 全局请求实例。
 * - baseURL = apiBase（见 ./base.ts）：代理模式默认 '/api'（开发经 Vite 代理、生产可由
 *   Nginx 反代剥离前缀）；直连模式由 .env.production 的 VITE_API_URL 指定 API 域名，
 *   后端 babylog.cors 已放行跨域。
 * - 接口加密拦截器（enableCrypto）默认关闭，联调链路通后再开启（见《04》第五节）。
 * - 错误提示使用 ElNotification：支持多行长文本、可复制，hover 可查看完整内容。
 */
export const request = createRequest({
  baseURL: apiBase,
  timeout: 15_000,
  onError: (msg) => ElNotification({ title: '请求失败', message: msg, type: 'error', duration: 5000 }),
});
