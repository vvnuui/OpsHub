/**
 * 认证相关API
 */
import request from '../utils/request.js';

/**
 * 用户登录
 * @param {object} credentials - 登录凭证 { username, password }
 * @returns {Promise}
 */
export function login(credentials) {
  return request.post('/auth/login', credentials);
}

/**
 * 用户登出
 * @param {string} token - 访问令牌
 * @returns {Promise}
 */
export function logout(token) {
  return request.post('/auth/logout', {}, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
}

/**
 * 刷新访问令牌
 * @param {string} refreshToken - 刷新令牌
 * @returns {Promise}
 */
export function refreshToken(refreshToken) {
  return request.post('/auth/refresh', { refresh_token: refreshToken });
}

/**
 * 获取当前用户信息
 * @param {string} token - 访问令牌
 * @returns {Promise}
 */
export function getProfile(token) {
  return request.get('/auth/profile', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
}

export default {
  login,
  logout,
  refreshToken,
  getProfile
};
