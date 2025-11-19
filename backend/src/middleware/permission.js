/**
 * 权限验证中间件 - 基于角色的访问控制（RBAC）
 */

/**
 * 角色权限验证中间件
 * 检查用户是否具有指定的角色权限
 * @param  {...string} allowedRoles - 允许访问的角色列表
 * @returns {Function} Express中间件函数
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    try {
      // 检查是否已通过认证（authenticate中间件应该先执行）
      if (!req.user) {
        return res.status(401).json({
          code: 401,
          message: '未登录或认证已过期'
        });
      }

      // 检查用户角色是否在允许列表中
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          code: 403,
          message: '权限不足，无法访问此资源'
        });
      }

      next();
    } catch (error) {
      console.error('权限验证中间件错误:', error);
      return res.status(500).json({
        code: 500,
        message: '服务器内部错误'
      });
    }
  };
}

/**
 * 管理员权限验证中间件
 * 只允许管理员访问
 */
export function requireAdmin(req, res, next) {
  return requireRole('admin')(req, res, next);
}

/**
 * 管理员或审计员权限验证中间件
 * 允许管理员和审计员访问
 */
export function requireAdminOrAuditor(req, res, next) {
  return requireRole('admin', 'auditor')(req, res, next);
}

/**
 * 检查用户是否可以访问指定资源
 * 例如：用户只能修改自己的信息，除非是管理员
 * @param {Function} resourceOwnerGetter - 获取资源拥有者ID的函数
 * @returns {Function} Express中间件函数
 */
export function requireOwnerOrAdmin(resourceOwnerGetter) {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          code: 401,
          message: '未登录或认证已过期'
        });
      }

      // 管理员可以访问所有资源
      if (req.user.role === 'admin') {
        return next();
      }

      // 获取资源拥有者ID
      const ownerId = resourceOwnerGetter(req);

      // 检查是否为资源拥有者
      if (req.user.id !== ownerId) {
        return res.status(403).json({
          code: 403,
          message: '权限不足，只能操作自己的资源'
        });
      }

      next();
    } catch (error) {
      console.error('资源权限验证中间件错误:', error);
      return res.status(500).json({
        code: 500,
        message: '服务器内部错误'
      });
    }
  };
}
