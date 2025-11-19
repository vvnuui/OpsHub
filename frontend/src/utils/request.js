/**
 * Axios 统一请求配置
 * 包含请求拦截器和响应拦截器
 */
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { getToken, removeToken } from './auth.js'
import router from '../router/index.js'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 请求拦截器 - 自动添加认证令牌
request.interceptors.request.use(
  config => {
    // 获取存储的Token
    const token = getToken()

    // 如果有Token，添加到请求头
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 统一处理错误
request.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    // 处理 401 未授权错误
    if (error.response && error.response.status === 401) {
      // 清除本地token
      removeToken()

      // 提示用户
      ElMessage.warning('登录已过期，请重新登录')

      // 跳转到登录页，并保存当前路径用于登录后跳转
      router.push({
        path: '/login',
        query: { redirect: router.currentRoute.value.fullPath }
      })

      return Promise.reject(new Error('登录已过期'))
    }

    // 其他错误
    console.error('请求失败:', error)
    return Promise.reject(error)
  }
)

export default request
