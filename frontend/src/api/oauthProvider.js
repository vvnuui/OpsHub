/**
 * OAuth提供商管理API
 */
import request from './system.js';

/**
 * 获取所有OAuth提供商列表（包括禁用的）
 */
export function getOAuthProviders() {
  return request.get('/oauth-providers');
}

/**
 * 创建OAuth提供商
 */
export function createOAuthProvider(data) {
  return request.post('/oauth-providers', data);
}

/**
 * 更新OAuth提供商
 */
export function updateOAuthProvider(id, data) {
  return request.put(`/oauth-providers/${id}`, data);
}

/**
 * 删除OAuth提供商
 */
export function deleteOAuthProvider(id) {
  return request.delete(`/oauth-providers/${id}`);
}

/**
 * 切换OAuth提供商启用状态
 */
export function toggleOAuthProvider(id) {
  return request.put(`/oauth-providers/${id}/toggle`);
}
