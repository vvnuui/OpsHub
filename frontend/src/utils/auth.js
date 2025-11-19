/**
 * 认证工具函数 - Token存储管理
 */
import Cookies from 'js-cookie';

const TOKEN_KEY = 'opshub_token';
const REFRESH_TOKEN_KEY = 'opshub_refresh_token';
const USER_KEY = 'opshub_user';

// Token过期时间配置
const TOKEN_EXPIRES = 2 / 24; // 2小时（天为单位）
const REFRESH_TOKEN_EXPIRES = 7; // 7天

/**
 * 保存访问令牌
 * @param {string} token - 访问令牌
 * @param {boolean} remember - 是否记住登录（使用Cookie持久化）
 */
export function setToken(token, remember = false) {
  if (remember) {
    // 使用Cookie存储，可以跨会话保持
    Cookies.set(TOKEN_KEY, token, { expires: TOKEN_EXPIRES });
  } else {
    // 使用sessionStorage，浏览器关闭后失效
    sessionStorage.setItem(TOKEN_KEY, token);
  }
}

/**
 * 获取访问令牌
 * @returns {string|null} 访问令牌
 */
export function getToken() {
  // 优先从sessionStorage获取
  let token = sessionStorage.getItem(TOKEN_KEY);

  // 如果sessionStorage没有，从Cookie获取
  if (!token) {
    token = Cookies.get(TOKEN_KEY);
  }

  return token;
}

/**
 * 移除访问令牌
 */
export function removeToken() {
  sessionStorage.removeItem(TOKEN_KEY);
  Cookies.remove(TOKEN_KEY);
}

/**
 * 保存刷新令牌
 * @param {string} refreshToken - 刷新令牌
 * @param {boolean} remember - 是否记住登录
 */
export function setRefreshToken(refreshToken, remember = false) {
  if (remember) {
    Cookies.set(REFRESH_TOKEN_KEY, refreshToken, { expires: REFRESH_TOKEN_EXPIRES });
  } else {
    sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

/**
 * 获取刷新令牌
 * @returns {string|null} 刷新令牌
 */
export function getRefreshToken() {
  let token = sessionStorage.getItem(REFRESH_TOKEN_KEY);

  if (!token) {
    token = Cookies.get(REFRESH_TOKEN_KEY);
  }

  return token;
}

/**
 * 移除刷新令牌
 */
export function removeRefreshToken() {
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  Cookies.remove(REFRESH_TOKEN_KEY);
}

/**
 * 保存用户信息
 * @param {object} user - 用户信息对象
 * @param {boolean} remember - 是否记住登录
 */
export function setUser(user, remember = false) {
  const userStr = JSON.stringify(user);

  if (remember) {
    Cookies.set(USER_KEY, userStr, { expires: REFRESH_TOKEN_EXPIRES });
  } else {
    sessionStorage.setItem(USER_KEY, userStr);
  }
}

/**
 * 获取用户信息
 * @returns {object|null} 用户信息对象
 */
export function getUser() {
  let userStr = sessionStorage.getItem(USER_KEY);

  if (!userStr) {
    userStr = Cookies.get(USER_KEY);
  }

  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('解析用户信息失败:', error);
      return null;
    }
  }

  return null;
}

/**
 * 移除用户信息
 */
export function removeUser() {
  sessionStorage.removeItem(USER_KEY);
  Cookies.remove(USER_KEY);
}

/**
 * 清除所有认证信息
 */
export function clearAuth() {
  removeToken();
  removeRefreshToken();
  removeUser();
}
