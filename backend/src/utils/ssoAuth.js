/**
 * SSO 认证加密工具
 * 兼容 OA 系统的 sys_auth_old 加密算法
 */
import crypto from 'crypto';

// OA 系统的密钥配置（从环境变量读取，需要与 OA 系统保持一致）
const SYS_KEY = process.env.SSO_SYS_KEY || 'vjDPXzvbQmI5GPv';
const SALT = process.env.SSO_SALT || 'hWiqER1nLeAtQrN';

/**
 * PHP sys_auth_old 算法的 Node.js 实现
 * @param {string} string - 要加密/解密的字符串
 * @param {string} operation - 操作类型 'ENCODE' 或 'DECODE'
 * @param {string} key - 密钥
 * @param {number} expiry - 过期时间（秒）
 * @returns {string} 加密/解密后的字符串
 */
export function sysAuthOld(string, operation = 'ENCODE', key = '', expiry = 0) {
  const keyLength = 4;
  key = key || SYS_KEY;

  // 生成密钥
  const md5Key = crypto.createHash('md5').update(key).digest('hex');
  const fixedKey = crypto.createHash('md5').update(md5Key).digest('hex');
  const egisKeys = crypto.createHash('md5').update(fixedKey.substr(16, 16)).digest('hex');

  let runtoKey = '';
  if (keyLength) {
    if (operation === 'ENCODE') {
      // 生成随机密钥
      const microtime = Date.now() / 1000;
      const microtimeMd5 = crypto.createHash('md5').update(microtime.toString()).digest('hex');
      runtoKey = microtimeMd5.substr(-keyLength);
    } else {
      runtoKey = string.substr(0, keyLength);
    }
  }

  const keys = crypto.createHash('md5')
    .update(runtoKey.substr(0, 16) + fixedKey.substr(0, 16) + runtoKey.substr(16) + fixedKey.substr(16))
    .digest('hex');

  let processString = '';
  if (operation === 'ENCODE') {
    const expiryStr = (expiry ? expiry + Math.floor(Date.now() / 1000) : 0).toString().padStart(10, '0');
    const stringMd5 = crypto.createHash('md5').update(string + egisKeys).digest('hex').substr(0, 16);
    processString = expiryStr + stringMd5 + string;
  } else {
    processString = Buffer.from(string.substr(keyLength), 'base64').toString('binary');
  }

  // XOR 加密/解密
  let result = '';
  for (let i = 0; i < processString.length; i++) {
    result += String.fromCharCode(
      processString.charCodeAt(i) ^ keys.charCodeAt(i % 32)
    );
  }

  if (operation === 'ENCODE') {
    return runtoKey + Buffer.from(result, 'binary').toString('base64').replace(/=/g, '');
  } else {
    // 验证解密结果
    const expiryTime = parseInt(result.substr(0, 10));
    const hash = result.substr(10, 16);
    const originalString = result.substr(26);
    const verifyHash = crypto.createHash('md5').update(originalString + egisKeys).digest('hex').substr(0, 16);

    if ((expiryTime === 0 || expiryTime - Math.floor(Date.now() / 1000) > 0) && hash === verifyHash) {
      return originalString;
    } else {
      return '';
    }
  }
}

/**
 * 生成 SSO 认证签名
 * @param {string} username - 用户名
 * @param {string} userAgent - User-Agent 字符串
 * @returns {string} auth 签名
 */
export function generateSSOAuth(username, userAgent) {
  // auth = md5(md5(SALT + username + SYS_KEY) + User-Agent)
  const step1 = crypto.createHash('md5').update(SALT + username + SYS_KEY).digest('hex');
  const auth = crypto.createHash('md5').update(step1 + userAgent).digest('hex');
  return auth;
}

/**
 * 验证 SSO 认证签名
 * @param {string} auth - 待验证的签名
 * @param {string} username - 用户名
 * @param {string} userAgent - User-Agent 字符串
 * @returns {boolean} 验证结果
 */
export function verifySSOAuth(auth, username, userAgent) {
  const expectedAuth = generateSSOAuth(username, userAgent);
  return auth === expectedAuth;
}

/**
 * 生成 SSO 登录 URL
 * @param {string} targetUrl - 目标系统 URL
 * @param {string} username - 用户名
 * @param {string} userAgent - User-Agent（可选，默认使用标准 UA）
 * @returns {string} 完整的 SSO 登录 URL
 */
export function generateSSOUrl(targetUrl, username, userAgent = 'Mozilla/5.0') {
  // 加密用户名
  const encryptedUsername = sysAuthOld(username, 'ENCODE', SYS_KEY);

  // 生成认证签名
  const auth = generateSSOAuth(username, userAgent);

  // 构建 URL
  const url = new URL(targetUrl);
  url.searchParams.set('op', 'syn_login');
  url.searchParams.set('auth', auth);
  url.searchParams.set('u', encryptedUsername);

  return url.toString();
}

/**
 * 解析并验证 SSO 登录请求
 * @param {string} auth - 认证签名
 * @param {string} encryptedUsername - 加密的用户名
 * @param {string} userAgent - User-Agent 字符串
 * @returns {object} { success: boolean, username?: string, error?: string }
 */
export function parseSSORequest(auth, encryptedUsername, userAgent) {
  try {
    // 解密用户名
    const username = sysAuthOld(encryptedUsername, 'DECODE', SYS_KEY);

    if (!username) {
      return { success: false, error: '用户解码失败' };
    }

    // 验证签名
    if (!verifySSOAuth(auth, username, userAgent)) {
      return { success: false, error: 'auth认证失败' };
    }

    return { success: true, username };
  } catch (error) {
    return { success: false, error: '解析失败: ' + error.message };
  }
}

export default {
  sysAuthOld,
  generateSSOAuth,
  verifySSOAuth,
  generateSSOUrl,
  parseSSORequest,
  SYS_KEY,
  SALT
};
