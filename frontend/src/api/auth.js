/**
 * 认证相关API
 */
import axios from 'axios';

// 创建axios实例
const request = axios.create({
  baseURL: '/api/auth',
  timeout: 10000
});

// 响应拦截器
request.interceptors.response.use(
  response => {
    return response.data;
  },
  error => {
    return Promise.reject(error);
  }
);

/**
 * 用户登录
 * @param {object} credentials - 登录凭证 { username, password }
 * @returns {Promise}
 */
export function login(credentials) {
  return request.post('/login', credentials);
}

/**
 * 用户登出
 * @param {string} token - 访问令牌
 * @returns {Promise}
 */
export function logout(token) {
  return request.post('/logout', {}, {
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
  return request.post('/refresh', { refresh_token: refreshToken });
}

/**
 * 获取当前用户信息
 * @param {string} token - 访问令牌
 * @returns {Promise}
 */
export function getProfile(token) {
  return request.get('/profile', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
}

/**
 * 获取可用的OAuth提供商列表
 * @returns {Promise}
 */
export function getOAuthProviders() {
  return request.get('/oauth/providers');
}

export default {
  login,
  logout,
  refreshToken,
  getProfile,
  getOAuthProviders
};
