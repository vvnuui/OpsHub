/**
 * 认证路由 - 处理登录、登出、令牌刷新等
 */
import express from 'express';
import { body, validationResult } from 'express-validator';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { generateAccessToken, generateRefreshToken, verifyToken, getTokenExpiry } from '../utils/jwt.js';
import { authenticate } from '../middleware/auth.js';
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
 * POST /api/auth/login
 * 用户登录（账号密码）
 */
router.post(
  '/login',
  [
    body('username').trim().notEmpty().withMessage('用户名不能为空'),
    body('password').notEmpty().withMessage('密码不能为空')
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

      const { username, password } = req.body;
      const db = getDB();

      // 查询用户
      const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

      if (!user) {
        return res.status(401).json({
          code: 401,
          message: '用户名或密码错误'
        });
      }

      // 检查账户状态
      if (user.status !== 'active') {
        return res.status(403).json({
          code: 403,
          message: '账户已被禁用，请联系管理员'
        });
      }

      // 验证密码
      const isPasswordValid = await verifyPassword(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          code: 401,
          message: '用户名或密码错误'
        });
      }

      // 生成JWT令牌
      const tokenPayload = {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email
      };

      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      // 保存会话到数据库
      const now = getCurrentTimestamp();
      const expiresAt = getTokenExpiry('access');

      db.prepare(`
        INSERT INTO sessions (user_id, access_token, refresh_token, expires_at, ip_address, user_agent, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        user.id,
        accessToken,
        refreshToken,
        expiresAt,
        req.ip || req.connection.remoteAddress,
        req.get('user-agent'),
        now
      );

      // 更新用户最后登录时间
      db.prepare('UPDATE users SET last_login_time = ? WHERE id = ?').run(now, user.id);

      // 记录审计日志
      logAudit(user.id, user.username, 'login', 'user', user.id, { method: 'password' }, req);

      // 返回用户信息和令牌
      res.json({
        code: 200,
        message: '登录成功',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            last_login_time: formatDateTimeForAPI(new Date(now * 1000))
          },
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: 7200  // 2小时（秒）
        }
      });
    } catch (error) {
      console.error('登录失败:', error);
      res.status(500).json({
        code: 500,
        message: '登录失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * POST /api/auth/logout
 * 用户登出
 */
router.post('/logout', authenticate, (req, res) => {
  try {
    const db = getDB();

    // 从请求头获取令牌
    const authHeader = req.headers.authorization;
    const token = authHeader.split(' ')[1];

    // 删除会话
    db.prepare('DELETE FROM sessions WHERE access_token = ?').run(token);

    // 记录审计日志
    logAudit(req.user.id, req.user.username, 'logout', 'user', req.user.id, null, req);

    res.json({
      code: 200,
      message: '登出成功'
    });
  } catch (error) {
    console.error('登出失败:', error);
    res.status(500).json({
      code: 500,
      message: '登出失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/auth/refresh
 * 刷新访问令牌
 */
router.post('/refresh', (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        code: 400,
        message: '缺少刷新令牌'
      });
    }

    // 验证刷新令牌
    const decoded = verifyToken(refresh_token);

    if (!decoded) {
      return res.status(401).json({
        code: 401,
        message: '刷新令牌无效或已过期'
      });
    }

    const db = getDB();

    // 检查会话是否存在
    const session = db.prepare('SELECT * FROM sessions WHERE refresh_token = ?').get(refresh_token);

    if (!session) {
      return res.status(401).json({
        code: 401,
        message: '会话不存在或已过期'
      });
    }

    // 生成新的访问令牌
    const tokenPayload = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
      email: decoded.email
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newExpiresAt = getTokenExpiry('access');

    // 更新会话中的访问令牌
    db.prepare(`
      UPDATE sessions
      SET access_token = ?, expires_at = ?
      WHERE refresh_token = ?
    `).run(newAccessToken, newExpiresAt, refresh_token);

    res.json({
      code: 200,
      message: '令牌刷新成功',
      data: {
        access_token: newAccessToken,
        expires_in: 7200  // 2小时（秒）
      }
    });
  } catch (error) {
    console.error('令牌刷新失败:', error);
    res.status(500).json({
      code: 500,
      message: '令牌刷新失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/auth/profile
 * 获取当前用户信息
 */
router.get('/profile', authenticate, (req, res) => {
  try {
    const db = getDB();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    res.json({
      code: 200,
      message: '获取用户信息成功',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        status: user.status,
        last_login_time: user.last_login_time ? formatDateTimeForAPI(new Date(user.last_login_time * 1000)) : null,
        created_at: formatDateTimeForAPI(new Date(user.created_at * 1000))
      }
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

export default router;
