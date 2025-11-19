/**
 * 权限检查工具函数
 */

/**
 * 检查用户是否有指定角色
 * @param {object} user - 用户对象
 * @param {string|string[]} roles - 角色或角色数组
 * @returns {boolean} 是否有权限
 */
export function hasRole(user, roles) {
  if (!user || !user.role) {
    return false;
  }

  if (Array.isArray(roles)) {
    return roles.includes(user.role);
  }

  return user.role === roles;
}

/**
 * 检查用户是否为管理员
 * @param {object} user - 用户对象
 * @returns {boolean} 是否为管理员
 */
export function isAdmin(user) {
  return hasRole(user, 'admin');
}

/**
 * 检查用户是否为审计员
 * @param {object} user - 用户对象
 * @returns {boolean} 是否为审计员
 */
export function isAuditor(user) {
  return hasRole(user, 'auditor');
}

/**
 * 检查用户是否为普通用户
 * @param {object} user - 用户对象
 * @returns {boolean} 是否为普通用户
 */
export function isUser(user) {
  return hasRole(user, 'user');
}

/**
 * 检查用户是否可以管理系统（管理员权限）
 * @param {object} user - 用户对象
 * @returns {boolean} 是否可以管理系统
 */
export function canManageSystems(user) {
  return isAdmin(user);
}

/**
 * 检查用户是否可以管理用户（管理员权限）
 * @param {object} user - 用户对象
 * @returns {boolean} 是否可以管理用户
 */
export function canManageUsers(user) {
  return isAdmin(user);
}

/**
 * 检查用户是否可以查看审计日志（管理员或审计员权限）
 * @param {object} user - 用户对象
 * @returns {boolean} 是否可以查看审计日志
 */
export function canViewAuditLogs(user) {
  return hasRole(user, ['admin', 'auditor']);
}

/**
 * 检查用户是否可以访问所有系统（管理员或审计员权限）
 * @param {object} user - 用户对象
 * @returns {boolean} 是否可以访问所有系统
 */
export function canAccessAllSystems(user) {
  return hasRole(user, ['admin', 'auditor']);
}
