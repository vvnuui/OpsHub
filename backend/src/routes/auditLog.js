/**
 * 审计日志路由 - 管理员和审计员功能
 */
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getDB, formatDateTimeForAPI } from '../db/database.js';

const router = express.Router();

/**
 * GET /api/audit-logs
 * 获取全局审计日志（管理员和审计员）
 */
router.get('/', authenticate, (req, res) => {
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
