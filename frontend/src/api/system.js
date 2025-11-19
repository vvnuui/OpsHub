import request from '../utils/request.js'

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
