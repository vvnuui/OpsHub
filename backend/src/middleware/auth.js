/**
 * 认证中间件 - 验证JWT令牌
 */
import { verifyToken } from '../utils/jwt.js';

/**
 * 认证中间件 - 验证用户是否已登录
 * 从请求头Authorization中提取JWT令牌并验证
 * 验证成功后将用户信息附加到req.user
 */
export function authenticate(req, res, next) {
  try {
    // 从请求头获取Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        code: 401,
        message: '未提供认证令牌'
      });
    }

    // 检查格式是否为 "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        code: 401,
        message: '认证令牌格式错误'
      });
    }

    const token = parts[1];

    // 验证JWT令牌
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        code: 401,
        message: '认证令牌无效或已过期'
      });
    }

    // 将用户信息附加到请求对象
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
      email: decoded.email
    };

    next();
  } catch (error) {
    console.error('认证中间件错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
}

/**
 * 可选认证中间件 - 如果有令牌则验证，没有令牌则继续
 * 用于某些页面既允许匿名访问，也允许登录用户访问的场景
 */
export function optionalAuthenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      // 没有令牌，继续处理（作为匿名用户）
      req.user = null;
      return next();
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      // 令牌格式错误，继续处理（作为匿名用户）
      req.user = null;
      return next();
    }

    const token = parts[1];
    const decoded = verifyToken(token);

    if (decoded) {
      // 令牌有效，附加用户信息
      req.user = {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role,
        email: decoded.email
      };
    } else {
      // 令牌无效，继续处理（作为匿名用户）
      req.user = null;
    }

    next();
  } catch (error) {
    console.error('可选认证中间件错误:', error);
    req.user = null;
    next();
  }
}
