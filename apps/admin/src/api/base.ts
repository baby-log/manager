/**
 * API 基址（axios baseURL 与原生 fetch 前缀的统一出口）。
 *
 * - 代理模式（默认、开发）：`'/api'`——axios baseURL='/api'，经 Vite proxy / Nginx 反代
 *   剥离前缀转发后端，浏览器侧同源零 CORS（见 vite.config.ts、deploy/nginx-pivotos.conf）。
 * - 直连模式（生产）：构建期由 `.env.production` 的 `VITE_API_URL=https://baby-api.293242.com`
 *   覆盖——前端直接跨域访问 API 域名，后端 `babylog.cors` 全局放行。
 *
 * 注意：直连模式下 axios 请求路径不含 `/api` 前缀（baseURL 无路径段时 url 按原样拼接）；
 * 原生 fetch（SSE 流/文件导入导出）须显式用 `${apiBase}/xxx` 拼前缀。
 */
export const apiBase: string = import.meta.env.VITE_API_URL || '/api';
