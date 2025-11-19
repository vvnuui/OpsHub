/**
 * 系统访问权限验证中间件
 * 检查用户是否有权限访问特定系统
 */
import { getDB } from '../db/database.js';

/**
 * 验证用户是否有权限访问指定系统
 * 管理员和审计员可以访问所有系统
 * 普通用户只能访问已授权的系统
 * @param {Function} systemIdGetter - 获取系统ID的函数，参数为req
 * @returns {Function} Express中间件函数
 */
export function checkSystemAccess(systemIdGetter) {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          code: 401,
          message: '未登录或认证已过期'
        });
      }

      // 管理员和审计员可以访问所有系统
      if (req.user.role === 'admin' || req.user.role === 'auditor') {
        return next();
      }

      // 获取要访问的系统ID
      const systemId = systemIdGetter(req);

      if (!systemId) {
        return res.status(400).json({
          code: 400,
          message: '缺少系统ID参数'
        });
      }

      // 查询用户是否有权限访问该系统
      const db = getDB();
      const access = db.prepare(`
        SELECT * FROM user_system_access
        WHERE user_id = ? AND system_id = ?
      `).get(req.user.id, systemId);

      if (!access) {
        return res.status(403).json({
          code: 403,
          message: '您没有权限访问此系统'
        });
      }

      next();
    } catch (error) {
      console.error('系统访问权限验证错误:', error);
      return res.status(500).json({
        code: 500,
        message: '服务器内部错误'
      });
    }
  };
}

/**
 * 获取用户可访问的系统ID列表
 * 管理员和审计员返回所有系统，普通用户返回已授权系统
 * @param {number} userId - 用户ID
 * @param {string} role - 用户角色
 * @returns {Array<number>} 系统ID数组
 */
export function getUserAccessibleSystems(userId, role) {
  try {
    const db = getDB();

    // 管理员和审计员可以访问所有系统
    if (role === 'admin' || role === 'auditor') {
      const systems = db.prepare('SELECT id FROM systems').all();
      return systems.map(s => s.id);
    }

    // 普通用户只能访问已授权的系统
    const access = db.prepare(`
      SELECT system_id FROM user_system_access
      WHERE user_id = ?
    `).all(userId);

    return access.map(a => a.system_id);
  } catch (error) {
    console.error('获取用户可访问系统列表失败:', error);
    return [];
  }
}
