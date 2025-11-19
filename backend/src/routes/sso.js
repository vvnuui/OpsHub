/**
 * SSO 单点登录路由
 * 实现与 OA 系统的 SSO 对接
 */
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getDB, formatDateTimeForAPI } from '../db/database.js';
import { generateToken } from '../utils/jwt.js';
import { generateSSOUrl, parseSSORequest } from '../utils/ssoAuth.js';

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
 * POST /api/sso/generate-url
 * 生成 SSO 登录链接（需要管理员权限）
 *
 * Body:
 * {
 *   "target_url": "https://www.zxmr168.com/api.php",
 *   "username": "admin"
 * }
 */
router.post('/generate-url', authenticate, (req, res) => {
  try {
    const { target_url, username } = req.body;

    // 验证参数
    if (!target_url || !username) {
      return res.status(400).json({
        code: 400,
        message: '目标URL和用户名不能为空'
      });
    }

    // 验证用户是否存在
    const db = getDB();
    const user = db.prepare('SELECT id, username, role, status FROM users WHERE username = ?').get(username);

    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        code: 403,
        message: '用户账户已被禁用'
      });
    }

    // 生成 SSO 登录 URL
    const userAgent = req.get('user-agent') || 'Mozilla/5.0';
    const ssoUrl = generateSSOUrl(target_url, username, userAgent);

    // 记录审计日志
    logAudit(
      req.user.id,
      req.user.username,
      'generate_sso_url',
      'sso',
      user.id,
      { target_username: username, target_url },
      req
    );

    res.json({
      code: 200,
      message: 'SSO 链接生成成功',
      data: {
        sso_url: ssoUrl,
        username: username,
        target_url: target_url
      }
    });
  } catch (error) {
    console.error('生成 SSO 链接失败:', error);
    res.status(500).json({
      code: 500,
      message: '生成 SSO 链接失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/sso/login
 * SSO 登录接口（接收来自外部系统的 SSO 请求）
 *
 * Query参数:
 * - op: 操作类型，必须为 'syn_login'
 * - auth: 认证签名
 * - u: 加密的用户名
 */
router.get('/login', (req, res) => {
  try {
    const { op, auth, u: encryptedUsername } = req.query;

    // 验证操作类型
    if (op !== 'syn_login') {
      return res.status(400).send('ERR: 操作类型错误');
    }

    // 验证参数
    if (!auth || !encryptedUsername) {
      return res.status(400).send('ERR: 参数不能为空');
    }

    // 获取 User-Agent
    const userAgent = req.get('user-agent') || '';

    // 解析并验证 SSO 请求
    const parseResult = parseSSORequest(auth, encryptedUsername, userAgent);

    if (!parseResult.success) {
      return res.status(401).send('ERR: ' + parseResult.error);
    }

    const username = parseResult.username;
    const db = getDB();

    // 查询用户信息
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

    if (!user) {
      return res.status(404).send('ERR: 没有查找到用户');
    }

    if (user.status !== 'active') {
      return res.status(403).send('ERR: 用户账户已被禁用');
    }

    // 更新最后登录时间和 IP
    const now = getCurrentTimestamp();
    db.prepare('UPDATE users SET last_login_time = ? WHERE id = ?').run(now, user.id);

    // 生成 JWT token
    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role,
      email: user.email
    });

    // 记录审计日志
    logAudit(
      user.id,
      user.username,
      'login',
      'user',
      user.id,
      { method: 'sso', source: req.get('referer') },
      req
    );

    // 返回 HTML 页面，自动跳转并设置 token
    const redirectUrl = `${req.protocol}://${req.get('host')}`;

    res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>SSO 登录中...</title>
</head>
<body>
  <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
    <h2>登录成功！</h2>
    <p>正在跳转到系统首页...</p>
  </div>
  <script>
    // 保存 token 到 localStorage
    localStorage.setItem('token', '${token}');
    localStorage.setItem('user', JSON.stringify({
      id: ${user.id},
      username: '${user.username}',
      role: '${user.role}',
      email: '${user.email || ''}'
    }));

    // 跳转到首页
    setTimeout(function() {
      window.location.href = '${redirectUrl}';
    }, 1000);
  </script>
</body>
</html>
    `);
  } catch (error) {
    console.error('SSO 登录失败:', error);
    res.status(500).send('ERR: 服务器内部错误');
  }
});

/**
 * GET /api/sso/test-encrypt
 * 测试加密功能（仅开发环境）
 */
if (process.env.NODE_ENV === 'development') {
  router.get('/test-encrypt', (req, res) => {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({
        code: 400,
        message: '请提供 username 参数'
      });
    }

    const userAgent = req.get('user-agent') || 'Mozilla/5.0';
    const ssoUrl = generateSSOUrl('https://www.zxmr168.com/api.php', username, userAgent);

    res.json({
      code: 200,
      message: '加密测试',
      data: {
        username,
        sso_url: ssoUrl,
        user_agent: userAgent
      }
    });
  });
}

export default router;
