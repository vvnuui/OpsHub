/**
 * OAuth提供商管理路由 - 管理员配置OAuth提供商
 */
import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/permission.js';
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
 * GET /api/oauth-providers
 * 获取所有OAuth提供商（包括禁用的）- 管理员专用
 */
router.get('/', authenticate, requireAdmin, (req, res) => {
  try {
    const db = getDB();
    const providers = db.prepare(`
      SELECT
        id, name, display_name, client_id, client_secret,
        authorize_url, token_url, user_info_url, scope, enabled,
        created_at, updated_at
      FROM oauth_providers
      ORDER BY id
    `).all();

    // 格式化时间
    const formattedProviders = providers.map(provider => ({
      ...provider,
      enabled: provider.enabled === 1,
      created_at: formatDateTimeForAPI(new Date(provider.created_at * 1000)),
      updated_at: formatDateTimeForAPI(new Date(provider.updated_at * 1000))
    }));

    res.json({
      code: 200,
      message: '获取OAuth提供商列表成功',
      data: formattedProviders
    });
  } catch (error) {
    console.error('获取OAuth提供商列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取OAuth提供商列表失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/oauth-providers
 * 创建新的OAuth提供商
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  [
    body('name').trim().notEmpty().withMessage('名称不能为空'),
    body('display_name').trim().notEmpty().withMessage('显示名称不能为空'),
    body('client_id').trim().notEmpty().withMessage('Client ID不能为空'),
    body('client_secret').trim().notEmpty().withMessage('Client Secret不能为空'),
    body('authorize_url').trim().isURL().withMessage('授权URL格式不正确'),
    body('token_url').trim().isURL().withMessage('令牌URL格式不正确'),
    body('user_info_url').trim().isURL().withMessage('用户信息URL格式不正确'),
    body('scope').optional().trim()
  ],
  (req, res) => {
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

      const {
        name,
        display_name,
        client_id,
        client_secret,
        authorize_url,
        token_url,
        user_info_url,
        scope
      } = req.body;

      const db = getDB();

      // 检查名称是否已存在
      const existingProvider = db.prepare('SELECT id FROM oauth_providers WHERE name = ?').get(name);
      if (existingProvider) {
        return res.status(400).json({
          code: 400,
          message: '该OAuth提供商名称已存在'
        });
      }

      // 创建OAuth提供商
      const now = getCurrentTimestamp();
      const result = db.prepare(`
        INSERT INTO oauth_providers (
          name, display_name, client_id, client_secret,
          authorize_url, token_url, user_info_url, scope,
          enabled, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        name,
        display_name,
        client_id,
        client_secret,
        authorize_url,
        token_url,
        user_info_url,
        scope || 'openid profile email',
        1, // 默认启用
        now,
        now
      );

      // 记录审计日志
      logAudit(
        req.user.id,
        req.user.username,
        'create',
        'oauth_provider',
        result.lastInsertRowid,
        { name, display_name },
        req
      );

      // 获取创建的提供商信息
      const newProvider = db.prepare('SELECT * FROM oauth_providers WHERE id = ?').get(result.lastInsertRowid);

      res.json({
        code: 200,
        message: 'OAuth提供商创建成功',
        data: {
          ...newProvider,
          enabled: newProvider.enabled === 1,
          created_at: formatDateTimeForAPI(new Date(newProvider.created_at * 1000)),
          updated_at: formatDateTimeForAPI(new Date(newProvider.updated_at * 1000))
        }
      });
    } catch (error) {
      console.error('创建OAuth提供商失败:', error);
      res.status(500).json({
        code: 500,
        message: '创建OAuth提供商失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * PUT /api/oauth-providers/:id
 * 更新OAuth提供商信息
 */
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  [
    body('display_name').optional().trim().notEmpty().withMessage('显示名称不能为空'),
    body('client_id').optional().trim().notEmpty().withMessage('Client ID不能为空'),
    body('client_secret').optional().trim().notEmpty().withMessage('Client Secret不能为空'),
    body('authorize_url').optional().trim().isURL().withMessage('授权URL格式不正确'),
    body('token_url').optional().trim().isURL().withMessage('令牌URL格式不正确'),
    body('user_info_url').optional().trim().isURL().withMessage('用户信息URL格式不正确'),
    body('scope').optional().trim()
  ],
  (req, res) => {
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

      const { id } = req.params;
      const db = getDB();

      // 检查OAuth提供商是否存在
      const provider = db.prepare('SELECT * FROM oauth_providers WHERE id = ?').get(id);
      if (!provider) {
        return res.status(404).json({
          code: 404,
          message: 'OAuth提供商不存在'
        });
      }

      // 构建更新语句
      const updates = [];
      const values = [];

      const updatableFields = [
        'display_name',
        'client_id',
        'client_secret',
        'authorize_url',
        'token_url',
        'user_info_url',
        'scope'
      ];

      updatableFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updates.push(`${field} = ?`);
          values.push(req.body[field]);
        }
      });

      if (updates.length === 0) {
        return res.status(400).json({
          code: 400,
          message: '没有需要更新的字段'
        });
      }

      // 添加更新时间
      updates.push('updated_at = ?');
      values.push(getCurrentTimestamp());
      values.push(id);

      // 执行更新
      db.prepare(`
        UPDATE oauth_providers
        SET ${updates.join(', ')}
        WHERE id = ?
      `).run(...values);

      // 记录审计日志
      logAudit(
        req.user.id,
        req.user.username,
        'update',
        'oauth_provider',
        id,
        { updated_fields: updatableFields.filter(f => req.body[f] !== undefined) },
        req
      );

      // 获取更新后的信息
      const updatedProvider = db.prepare('SELECT * FROM oauth_providers WHERE id = ?').get(id);

      res.json({
        code: 200,
        message: 'OAuth提供商更新成功',
        data: {
          ...updatedProvider,
          enabled: updatedProvider.enabled === 1,
          created_at: formatDateTimeForAPI(new Date(updatedProvider.created_at * 1000)),
          updated_at: formatDateTimeForAPI(new Date(updatedProvider.updated_at * 1000))
        }
      });
    } catch (error) {
      console.error('更新OAuth提供商失败:', error);
      res.status(500).json({
        code: 500,
        message: '更新OAuth提供商失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * PUT /api/oauth-providers/:id/toggle
 * 启用/禁用OAuth提供商
 */
router.put('/:id/toggle', authenticate, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    // 检查OAuth提供商是否存在
    const provider = db.prepare('SELECT * FROM oauth_providers WHERE id = ?').get(id);
    if (!provider) {
      return res.status(404).json({
        code: 404,
        message: 'OAuth提供商不存在'
      });
    }

    // 切换启用状态
    const newEnabled = provider.enabled === 1 ? 0 : 1;
    const now = getCurrentTimestamp();

    db.prepare(`
      UPDATE oauth_providers
      SET enabled = ?, updated_at = ?
      WHERE id = ?
    `).run(newEnabled, now, id);

    // 记录审计日志
    logAudit(
      req.user.id,
      req.user.username,
      'update',
      'oauth_provider',
      id,
      { action: newEnabled ? 'enabled' : 'disabled', name: provider.name },
      req
    );

    res.json({
      code: 200,
      message: `OAuth提供商已${newEnabled ? '启用' : '禁用'}`,
      data: {
        id: parseInt(id),
        enabled: newEnabled === 1
      }
    });
  } catch (error) {
    console.error('切换OAuth提供商状态失败:', error);
    res.status(500).json({
      code: 500,
      message: '切换OAuth提供商状态失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * DELETE /api/oauth-providers/:id
 * 删除OAuth提供商
 */
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    // 检查OAuth提供商是否存在
    const provider = db.prepare('SELECT * FROM oauth_providers WHERE id = ?').get(id);
    if (!provider) {
      return res.status(404).json({
        code: 404,
        message: 'OAuth提供商不存在'
      });
    }

    // 删除OAuth提供商
    db.prepare('DELETE FROM oauth_providers WHERE id = ?').run(id);

    // 记录审计日志
    logAudit(
      req.user.id,
      req.user.username,
      'delete',
      'oauth_provider',
      id,
      { name: provider.name, display_name: provider.display_name },
      req
    );

    res.json({
      code: 200,
      message: 'OAuth提供商删除成功'
    });
  } catch (error) {
    console.error('删除OAuth提供商失败:', error);
    res.status(500).json({
      code: 500,
      message: '删除OAuth提供商失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
