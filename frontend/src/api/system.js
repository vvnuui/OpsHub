import axios from 'axios'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 请求拦截器
request.interceptors.request.use(
  config => {
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
