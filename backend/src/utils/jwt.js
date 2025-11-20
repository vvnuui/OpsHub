/**
 * JWT 令牌生成和验证工具
 */
import jwt from 'jsonwebtoken';

// JWT 密钥（从环境变量读取）
const JWT_SECRET = process.env.JWT_SECRET || 'opshub-jwt-secret-key-change-in-production';

// JWT 令牌过期时间（从环境变量读取，单位：秒）
const ACCESS_TOKEN_EXPIRES_IN = parseInt(process.env.JWT_ACCESS_EXPIRES_IN || '7200', 10);    // 默认 2 小时
const REFRESH_TOKEN_EXPIRES_IN = parseInt(process.env.JWT_REFRESH_EXPIRES_IN || '604800', 10); // 默认 7 天

// JWT 令牌配置
const JWT_CONFIG = {
  accessTokenExpiry: ACCESS_TOKEN_EXPIRES_IN,    // 访问令牌有效期（秒）
  refreshTokenExpiry: REFRESH_TOKEN_EXPIRES_IN   // 刷新令牌有效期（秒）
};

/**
 * 生成访问令牌（Access Token）
 * @param {object} payload - 令牌载荷（用户信息）
 * @returns {string} - JWT 访问令牌
 */
export function generateAccessToken(payload) {
  try {
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_CONFIG.accessTokenExpiry
    });
    return token;
  } catch (error) {
    console.error('生成访问令牌失败:', error);
    throw new Error('生成访问令牌失败');
  }
}

/**
 * 生成刷新令牌（Refresh Token）
 * @param {object} payload - 令牌载荷（用户信息）
 * @returns {string} - JWT 刷新令牌
 */
export function generateRefreshToken(payload) {
  try {
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_CONFIG.refreshTokenExpiry
    });
    return token;
  } catch (error) {
    console.error('生成刷新令牌失败:', error);
    throw new Error('生成刷新令牌失败');
  }
}

/**
 * 验证令牌
 * @param {string} token - JWT 令牌
 * @returns {object|null} - 解码后的载荷，验证失败返回 null
 */
export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      console.log('令牌已过期');
    } else if (error.name === 'JsonWebTokenError') {
      console.log('令牌无效');
    } else {
      console.error('令牌验证失败:', error);
    }
    return null;
  }
}

/**
 * 解码令牌（不验证签名）
 * @param {string} token - JWT 令牌
 * @returns {object|null} - 解码后的载荷
 */
export function decodeToken(token) {
  try {
    const decoded = jwt.decode(token);
    return decoded;
  } catch (error) {
    console.error('令牌解码失败:', error);
    return null;
  }
}

/**
 * 获取令牌过期时间戳（秒）
 * @param {string} tokenType - 令牌类型：'access' 或 'refresh'
 * @returns {number} - Unix 时间戳（秒）
 */
export function getTokenExpiry(tokenType = 'access') {
  const now = Math.floor(Date.now() / 1000);

  if (tokenType === 'refresh') {
    return now + REFRESH_TOKEN_EXPIRES_IN;
  } else {
    return now + ACCESS_TOKEN_EXPIRES_IN;
  }
}
