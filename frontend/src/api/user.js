/**
 * 用户管理相关API
 */
import request from '../utils/request.js';

/**
 * 获取用户列表
 * @returns {Promise}
 */
export function getUserList() {
  return request.get('/users');
}

/**
 * 获取单个用户详情
 * @param {number} id - 用户ID
 * @returns {Promise}
 */
export function getUserById(id) {
  return request.get(`/users/${id}`);
}

/**
 * 创建新用户
 * @param {object} data - 用户数据
 * @returns {Promise}
 */
export function createUser(data) {
  return request.post('/users', data);
}

/**
 * 更新用户信息
 * @param {number} id - 用户ID
 * @param {object} data - 用户数据
 * @returns {Promise}
 */
export function updateUser(id, data) {
  return request.put(`/users/${id}`, data);
}

/**
 * 删除用户
 * @param {number} id - 用户ID
 * @returns {Promise}
 */
export function deleteUser(id) {
  return request.delete(`/users/${id}`);
}

/**
 * 获取用户已授权的系统列表
 * @param {number} id - 用户ID
 * @returns {Promise}
 */
export function getUserSystems(id) {
  return request.get(`/users/${id}/systems`);
}

/**
 * 授权用户访问系统
 * @param {number} id - 用户ID
 * @param {array} systemIds - 系统ID数组
 * @returns {Promise}
 */
export function grantSystemAccess(id, systemIds) {
  return request.post(`/users/${id}/systems`, { system_ids: systemIds });
}

/**
 * 撤销用户系统访问权限
 * @param {number} userId - 用户ID
 * @param {number} systemId - 系统ID
 * @returns {Promise}
 */
export function revokeSystemAccess(userId, systemId) {
  return request.delete(`/users/${userId}/systems/${systemId}`);
}

/**
 * 获取用户操作审计日志
 * @param {number} id - 用户ID
 * @param {object} params - 查询参数 { limit, offset }
 * @returns {Promise}
 */
export function getUserAuditLogs(id, params = {}) {
  return request.get(`/users/${id}/audit-logs`, { params });
}

export default {
  getUserList,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserSystems,
  grantSystemAccess,
  revokeSystemAccess,
  getUserAuditLogs
};
