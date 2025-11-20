/**
 * 认证状态管理 - Pinia Store
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  setToken,
  getToken,
  setRefreshToken,
  getRefreshToken,
  setUser,
  getUser,
  clearAuth
} from '../utils/auth.js';
import axios from 'axios';

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const token = ref(getToken());
  const refreshToken = ref(getRefreshToken());
  const user = ref(getUser());
  const isLoading = ref(false);

  // 计算属性
  const isLoggedIn = computed(() => {
    return !!token.value && !!user.value;
  });

  const userRole = computed(() => {
    return user.value?.role || null;
  });

  const isAdmin = computed(() => {
    return userRole.value === 'admin';
  });

  const isAuditor = computed(() => {
    return userRole.value === 'auditor';
  });

  const isUser = computed(() => {
    return userRole.value === 'user';
  });

  // 方法：登录
  const login = async (credentials, remember = false) => {
    isLoading.value = true;

    try {
      const response = await axios.post('/api/auth/login', {
        username: credentials.username,
        password: credentials.password
      });

      if (response.data.code === 200) {
        const { access_token, refresh_token, user: userData } = response.data.data;

        // 保存令牌和用户信息
        token.value = access_token;
        refreshToken.value = refresh_token;
        user.value = userData;

        setToken(access_token, remember);
        setRefreshToken(refresh_token, remember);
        setUser(userData, remember);

        return { success: true, message: '登录成功' };
      } else {
        return { success: false, message: response.data.message || '登录失败' };
      }
    } catch (error) {
      console.error('登录失败:', error);
      return {
        success: false,
        message: error.response?.data?.message || '登录失败，请检查网络连接'
      };
    } finally {
      isLoading.value = false;
    }
  };

  // 方法：登出
  const logout = async () => {
    try {
      // 调用后端登出API
      if (token.value) {
        await axios.post('/api/auth/logout', {}, {
          headers: {
            'Authorization': `Bearer ${token.value}`
          }
        });
      }
    } catch (error) {
      console.error('登出API调用失败:', error);
    } finally {
      // 无论API调用是否成功，都清除本地状态
      token.value = null;
      refreshToken.value = null;
      user.value = null;

      clearAuth();
    }
  };

  // 方法：刷新令牌
  const refreshAccessToken = async () => {
    if (!refreshToken.value) {
      return { success: false, message: '没有刷新令牌' };
    }

    try {
      const response = await axios.post('/api/auth/refresh', {
        refresh_token: refreshToken.value
      });

      if (response.data.code === 200) {
        const { access_token } = response.data.data;

        token.value = access_token;
        setToken(access_token, !!getRefreshToken()); // 保持原有的remember状态

        return { success: true, message: '令牌刷新成功' };
      } else {
        return { success: false, message: response.data.message || '令牌刷新失败' };
      }
    } catch (error) {
      console.error('令牌刷新失败:', error);

      // 刷新失败，清除所有认证信息
      await logout();

      return {
        success: false,
        message: error.response?.data?.message || '令牌刷新失败，请重新登录'
      };
    }
  };

  // 方法：获取用户资料
  const fetchUserProfile = async () => {
    if (!token.value) {
      return { success: false, message: '未登录' };
    }

    try {
      const response = await axios.get('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token.value}`
        }
      });

      if (response.data.code === 200) {
        user.value = response.data.data;
        setUser(response.data.data, !!getRefreshToken());

        return { success: true, data: response.data.data };
      } else {
        return { success: false, message: response.data.message || '获取用户信息失败' };
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return {
        success: false,
        message: error.response?.data?.message || '获取用户信息失败'
      };
    }
  };

  // 方法：检查登录状态
  const checkAuth = () => {
    const storedToken = getToken();
    const storedUser = getUser();

    if (storedToken && storedUser) {
      token.value = storedToken;
      user.value = storedUser;
      return true;
    }

    return false;
  };

  return {
    // 状态
    token,
    refreshToken,
    user,
    isLoading,
    // 计算属性
    isLoggedIn,
    userRole,
    isAdmin,
    isAuditor,
    isUser,
    // 方法
    login,
    logout,
    refreshAccessToken,
    fetchUserProfile,
    checkAuth
  };
});
