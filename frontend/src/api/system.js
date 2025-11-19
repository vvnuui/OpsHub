import axios from 'axios'
import { getToken } from '../utils/auth.js'

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

// 响应拦截器
request.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    console.error('请求失败:', error)
    return Promise.reject(error)
  }
)

// 系统管理API
export const systemAPI = {
  // 获取所有系统
  getAll() {
    return request.get('/systems')
  },

  // 根据ID获取系统
  getById(id) {
    return request.get(`/systems/${id}`)
  },

  // 创建系统
  create(data) {
    return request.post('/systems', data)
  },

  // 更新系统
  update(id, data) {
    return request.put(`/systems/${id}`, data)
  },

  // 删除系统
  delete(id) {
    return request.delete(`/systems/${id}`)
  }
}

// 默认导出axios实例，供其他API文件使用
export default request
