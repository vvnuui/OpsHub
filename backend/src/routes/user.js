/**
 * 用户管理路由 - 管理员功能
 */
import express from 'express';
import { body, validationResult } from 'express-validator';
import { hashPassword } from '../utils/password.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin, requireAdminOrAuditor, requireAdminUsername } from '../middleware/permission.js';
import { getDB, formatDateTimeForAPI } from '../db/database.js';

const router = express.Router();

/**
 * 获取当前 Unix 时间戳（秒）
 */
function getCurrentTimestamp() {
  return Math.floor(Date.now() / 1000);
}

/**
 * 记录审计日志
 */
function logAudit(userId, username, action, resourceType, resourceId, details, req) {
  try {
    const db = getDB();
    const now = getCurrentTimestamp();

    db.prepare(`
      INSERT INTO audit_logs (user_id, username, action, resource_type, resource_id, details, ip_address, user_agent, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      username,
      action,
      resourceType,
      resourceId,
      details ? JSON.stringify(details) : null,
      req.ip || req.connection.remoteAddress,
      req.get('user-agent'),
      now
    );
  } catch (error) {
    console.error('记录审计日志失败:', error);
  }
}

/**
 * GET /api/users
 * 获取用户列表（仅admin用户）
 */
router.get('/', authenticate, requireAdminUsername, (req, res) => {
  try {
    const db = getDB();
    const users = db.prepare(`
      SELECT id, username, email, full_name, role, status, last_login_time, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `).all();

    // 格式化时间
    const formattedUsers = users.map(user => ({
      ...user,
      last_login_time: user.last_login_time ? formatDateTimeForAPI(new Date(user.last_login_time * 1000)) : null,
      created_at: formatDateTimeForAPI(new Date(user.created_at * 1000)),
      updated_at: formatDateTimeForAPI(new Date(user.updated_at * 1000))
    }));

    res.json({
      code: 200,
      message: '获取用户列表成功',
      data: formattedUsers
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取用户列表失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/users/:id
 * 获取单个用户详情（仅admin用户）
 */
router.get('/:id', authenticate, requireAdminUsername, (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    const user = db.prepare(`
      SELECT id, username, email, full_name, role, status, last_login_time, created_at, updated_at
      FROM users
      WHERE id = ?
    `).get(parseInt(id));

    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    // 格式化时间
    const formattedUser = {
      ...user,
      last_login_time: user.last_login_time ? formatDateTimeForAPI(new Date(user.last_login_time * 1000)) : null,
      created_at: formatDateTimeForAPI(new Date(user.created_at * 1000)),
      updated_at: formatDateTimeForAPI(new Date(user.updated_at * 1000))
    };

    res.json({
      code: 200,
      message: '获取用户信息成功',
      data: formattedUser
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取用户信息失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/users
 * 创建新用户（仅admin用户）
 */
router.post(
  '/',
  authenticate,
  requireAdminUsername,
  [
    body('username').trim().notEmpty().withMessage('用户名不能为空')
      .isLength({ min: 2, max: 50 }).withMessage('用户名长度在 2 到 50 个字符'),
    body('password').notEmpty().withMessage('密码不能为空')
      .isLength({ min: 6, max: 50 }).withMessage('密码长度在 6 到 50 个字符'),
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('邮箱格式不正确'),
    body('full_name').optional().trim(),
    body('role').isIn(['admin', 'user', 'auditor']).withMessage('角色必须是 admin、user 或 auditor'),
    body('status').optional().isIn(['active', 'disabled']).withMessage('状态必须是 active 或 disabled')
  ],
  async (req, res) => {
    try {
      // 验证请求参数
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          code: 400,
          message: '参数验证失败',
          errors: errors.array()
        });
      }

      const { username, password, email, full_name, role, status } = req.body;
      const db = getDB();

      // 检查用户名是否已存在
      const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
      if (existingUser) {
        return res.status(400).json({
          code: 400,
          message: '用户名已存在'
        });
      }

      // 加密密码
      const hashedPassword = await hashPassword(password);
      const now = getCurrentTimestamp();

      // 创建用户
      const result = db.prepare(`
        INSERT INTO users (username, password, email, full_name, role, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        username,
        hashedPassword,
        email || null,
        full_name || null,
        role,
        status || 'active',
        now,
        now
      );

      // 记录审计日志
      logAudit(
        req.user.id,
        req.user.username,
        'create',
        'user',
        result.lastInsertRowid,
        { username, role },
        req
      );

      res.json({
        code: 200,
        message: '创建用户成功',
        data: {
          id: result.lastInsertRowid,
          username,
          email,
          full_name,
          role,
          status: status || 'active'
        }
      });
    } catch (error) {
      console.error('创建用户失败:', error);
      res.status(500).json({
        code: 500,
        message: '创建用户失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * PUT /api/users/:id
 * 更新用户信息（仅admin用户）
 */
router.put(
  '/:id',
  authenticate,
  requireAdminUsername,
  [
    body('username').optional().trim().notEmpty().withMessage('用户名不能为空')
      .isLength({ min: 2, max: 50 }).withMessage('用户名长度在 2 到 50 个字符'),
    body('password').optional().notEmpty().withMessage('密码不能为空')
      .isLength({ min: 6, max: 50 }).withMessage('密码长度在 6 到 50 个字符'),
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('邮箱格式不正确'),
    body('full_name').optional().trim(),
    body('role').optional().isIn(['admin', 'user', 'auditor']).withMessage('角色必须是 admin、user 或 auditor'),
    body('status').optional().isIn(['active', 'disabled']).withMessage('状态必须是 active 或 disabled')
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          code: 400,
          message: '参数验证失败',
          errors: errors.array()
        });
      }

      const db = getDB();
      const userId = parseInt(id);

      // 检查用户是否存在
      const existingUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
      if (!existingUser) {
        return res.status(404).json({
          code: 404,
          message: '用户不存在'
        });
      }

      const { username, password, email, full_name, role, status } = req.body;
      const updateFields = [];
      const updateValues = [];

      if (username !== undefined) {
        // 检查用户名是否与其他用户冲突
        const conflict = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username, userId);
        if (conflict) {
          return res.status(400).json({
            code: 400,
            message: '用户名已被其他用户使用'
          });
        }
        updateFields.push('username = ?');
        updateValues.push(username);
      }

      if (password !== undefined) {
        const hashedPassword = await hashPassword(password);
        updateFields.push('password = ?');
        updateValues.push(hashedPassword);
      }

      if (email !== undefined) {
        updateFields.push('email = ?');
        updateValues.push(email || null);
      }

      if (full_name !== undefined) {
        updateFields.push('full_name = ?');
        updateValues.push(full_name || null);
      }

      if (role !== undefined) {
        updateFields.push('role = ?');
        updateValues.push(role);
      }

      if (status !== undefined) {
        updateFields.push('status = ?');
        updateValues.push(status);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          code: 400,
          message: '没有需要更新的字段'
        });
      }

      const now = getCurrentTimestamp();
      updateFields.push('updated_at = ?');
      updateValues.push(now);
      updateValues.push(userId);

      // 更新用户
      db.prepare(`
        UPDATE users
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `).run(...updateValues);

      // 记录审计日志
      logAudit(
        req.user.id,
        req.user.username,
        'update',
        'user',
        userId,
        { username, role, status },
        req
      );

      res.json({
        code: 200,
        message: '更新用户成功'
      });
    } catch (error) {
      console.error('更新用户失败:', error);
      res.status(500).json({
        code: 500,
        message: '更新用户失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * DELETE /api/users/:id
 * 删除用户（仅admin用户）
 */
router.delete('/:id', authenticate, requireAdminUsername, (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    const userId = parseInt(id);

    // 检查用户是否存在
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    // 禁止删除自己
    if (userId === req.user.id) {
      return res.status(400).json({
        code: 400,
        message: '不能删除自己的账户'
      });
    }

    // 删除用户（会级联删除相关的sessions和user_system_access）
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);

    // 记录审计日志
    logAudit(
      req.user.id,
      req.user.username,
      'delete',
      'user',
      userId,
      { username: user.username },
      req
    );

    res.json({
      code: 200,
      message: '删除用户成功'
    });
  } catch (error) {
    console.error('删除用户失败:', error);
    res.status(500).json({
      code: 500,
      message: '删除用户失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/users/:id/systems
 * 获取用户已授权的系统列表（仅admin用户）
 */
router.get('/:id/systems', authenticate, requireAdminUsername, (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    const userId = parseInt(id);

    // 检查用户是否存在
    const user = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    // 如果是管理员或审计员，返回所有系统
    if (user.role === 'admin' || user.role === 'auditor') {
      const allSystems = db.prepare('SELECT id, name FROM systems ORDER BY order_num').all();
      return res.json({
        code: 200,
        message: '获取用户系统权限成功',
        data: {
          user_id: userId,
          username: user.username,
          role: user.role,
          has_all_access: true,
          systems: allSystems
        }
      });
    }

    // 普通用户，查询已授权的系统
    const systems = db.prepare(`
      SELECT s.id, s.name, usa.granted_at, u.username as granted_by_name
      FROM user_system_access usa
      JOIN systems s ON usa.system_id = s.id
      LEFT JOIN users u ON usa.granted_by = u.id
      WHERE usa.user_id = ?
      ORDER BY s.order_num
    `).all(userId);

    // 格式化时间
    const formattedSystems = systems.map(sys => ({
      ...sys,
      granted_at: formatDateTimeForAPI(new Date(sys.granted_at * 1000))
    }));

    res.json({
      code: 200,
      message: '获取用户系统权限成功',
      data: {
        user_id: userId,
        username: user.username,
        role: user.role,
        has_all_access: false,
        systems: formattedSystems
      }
    });
  } catch (error) {
    console.error('获取用户系统权限失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取用户系统权限失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/users/:id/systems
 * 授权用户访问系统（仅admin用户）
 */
router.post(
  '/:id/systems',
  authenticate,
  requireAdminUsername,
  [
    body('system_ids').isArray({ min: 1 }).withMessage('system_ids 必须是非空数组')
  ],
  (req, res) => {
    try {
      const { id } = req.params;
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          code: 400,
          message: '参数验证失败',
          errors: errors.array()
        });
      }

      const { system_ids } = req.body;
      const db = getDB();
      const userId = parseInt(id);

      // 检查用户是否存在
      const user = db.prepare('SELECT id, role FROM users WHERE id = ?').get(userId);
      if (!user) {
        return res.status(404).json({
          code: 404,
          message: '用户不存在'
        });
      }

      // 管理员和审计员不需要单独授权
      if (user.role === 'admin' || user.role === 'auditor') {
        return res.status(400).json({
          code: 400,
          message: '管理员和审计员默认拥有所有系统访问权限，无需单独授权'
        });
      }

      const now = getCurrentTimestamp();

      // 批量插入授权记录（使用事务）
      const insertAccess = db.prepare(`
        INSERT OR IGNORE INTO user_system_access (user_id, system_id, granted_at, granted_by)
        VALUES (?, ?, ?, ?)
      `);

      const grantAccess = db.transaction((systemIds) => {
        for (const systemId of systemIds) {
          insertAccess.run(userId, systemId, now, req.user.id);
        }
      });

      grantAccess(system_ids);

      // 记录审计日志
      logAudit(
        req.user.id,
        req.user.username,
        'grant_access',
        'user_system_access',
        userId,
        { system_ids },
        req
      );

      res.json({
        code: 200,
        message: '授权成功'
      });
    } catch (error) {
      console.error('授权失败:', error);
      res.status(500).json({
        code: 500,
        message: '授权失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * DELETE /api/users/:id/systems/:systemId
 * 撤销用户系统访问权限（仅admin用户）
 */
router.delete('/:id/systems/:systemId', authenticate, requireAdminUsername, (req, res) => {
  try {
    const { id, systemId } = req.params;
    const db = getDB();
    const userId = parseInt(id);
    const sysId = parseInt(systemId);

    // 删除授权记录
    const result = db.prepare(`
      DELETE FROM user_system_access
      WHERE user_id = ? AND system_id = ?
    `).run(userId, sysId);

    if (result.changes === 0) {
      return res.status(404).json({
        code: 404,
        message: '授权记录不存在'
      });
    }

    // 记录审计日志
    logAudit(
      req.user.id,
      req.user.username,
      'revoke_access',
      'user_system_access',
      userId,
      { system_id: sysId },
      req
    );

    res.json({
      code: 200,
      message: '撤销授权成功'
    });
  } catch (error) {
    console.error('撤销授权失败:', error);
    res.status(500).json({
      code: 500,
      message: '撤销授权失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/users/:id/audit-logs
 * 获取用户操作审计日志（管理员和审计员）
 */
router.get('/:id/audit-logs', authenticate, (req, res) => {
  try {
    // 检查权限（管理员或审计员）
    if (req.user.role !== 'admin' && req.user.role !== 'auditor') {
      return res.status(403).json({
        code: 403,
        message: '权限不足，只有管理员和审计员可以查看审计日志'
      });
    }

    const { id } = req.params;
    const { limit = 100, offset = 0 } = req.query;
    const db = getDB();
    const userId = parseInt(id);

    // 获取审计日志
    const logs = db.prepare(`
      SELECT *
      FROM audit_logs
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(userId, parseInt(limit), parseInt(offset));

    // 格式化时间和details
    const formattedLogs = logs.map(log => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null,
      created_at: formatDateTimeForAPI(new Date(log.created_at * 1000))
    }));

    res.json({
      code: 200,
      message: '获取审计日志成功',
      data: formattedLogs
    });
  } catch (error) {
    console.error('获取审计日志失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取审计日志失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/audit-logs
 * 获取全局审计日志（管理员和审计员）
 */
router.get('/audit-logs', authenticate, (req, res) => {
  try {
    // 检查权限（管理员或审计员）
    if (req.user.role !== 'admin' && req.user.role !== 'auditor') {
      return res.status(403).json({
        code: 403,
        message: '权限不足，只有管理员和审计员可以查看审计日志'
      });
    }

    const { limit = 100, offset = 0 } = req.query;
    const db = getDB();

    // 获取全局审计日志
    const logs = db.prepare(`
      SELECT *
      FROM audit_logs
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(parseInt(limit), parseInt(offset));

    // 格式化时间和details
    const formattedLogs = logs.map(log => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null,
      created_at: formatDateTimeForAPI(new Date(log.created_at * 1000))
    }));

    res.json({
      code: 200,
      message: '获取审计日志成功',
      data: formattedLogs
    });
  } catch (error) {
    console.error('获取审计日志失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取审计日志失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
