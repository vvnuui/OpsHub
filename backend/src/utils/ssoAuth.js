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

  if (operation === 'ENCODE') {
    const expiryStr = (expiry ? expiry + Math.floor(Date.now() / 1000) : 0).toString().padStart(10, '0');
    const stringMd5 = crypto.createHash('md5').update(string + egisKeys).digest('hex').substr(0, 16);
    const processString = expiryStr + stringMd5 + string;

    // XOR 加密
    let result = '';
    for (let i = 0; i < processString.length; i++) {
      result += String.fromCharCode(
        processString.charCodeAt(i) ^ keys.charCodeAt(i % 32)
      );
    }

    return runtoKey + Buffer.from(result, 'binary').toString('base64').replace(/=/g, '');
  } else {
    // 解码 - 使用Buffer正确处理二进制数据
    const base64Part = string.substr(keyLength);
    const decodedBuffer = Buffer.from(base64Part, 'base64');

    // XOR 解密
    const resultBuffer = Buffer.alloc(decodedBuffer.length);
    for (let i = 0; i < decodedBuffer.length; i++) {
      resultBuffer[i] = decodedBuffer[i] ^ keys.charCodeAt(i % 32);
    }

    // 提取各部分
    const expiryPart = resultBuffer.slice(0, 10).toString('ascii');
    const hashPart = resultBuffer.slice(10, 26).toString('ascii');
    const originalBuffer = resultBuffer.slice(26);

    const expiryTime = parseInt(expiryPart) || 0;
    const verifyHash = crypto.createHash('md5')
      .update(Buffer.concat([originalBuffer, Buffer.from(egisKeys)]))
      .digest('hex').substr(0, 16);

    if ((expiryTime === 0 || expiryTime - Math.floor(Date.now() / 1000) > 0) && hashPart === verifyHash) {
      // 返回UTF-8解码的字符串
      return originalBuffer.toString('utf8');
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
 * 注意：根据PHP的syn_login.php实现，auth验证使用的是加密后的用户名
 * @param {string} auth - 认证签名
 * @param {string} encryptedUsername - 加密的用户名
 * @param {string} userAgent - User-Agent 字符串
 * @returns {object} { success: boolean, username?: string, error?: string }
 */
export function parseSSORequest(auth, encryptedUsername, userAgent) {
  try {
    // 先验证auth签名（使用加密后的用户名，与PHP一致）
    // PHP: $my_auth = md5(md5(SALT . $this->username . SYS_KEY) . $_SERVER['HTTP_USER_AGENT']);
    // 其中 $this->username 是 $_GET['u']，即加密后的用户名
    const step1 = crypto.createHash('md5').update(SALT + encryptedUsername + SYS_KEY).digest('hex');
    const expectedAuth = crypto.createHash('md5').update(step1 + userAgent).digest('hex');

    if (auth !== expectedAuth) {
      return { success: false, error: 'auth认证失败' };
    }

    // 解密用户名
    const username = sysAuthOld(encryptedUsername, 'DECODE', SYS_KEY);

    if (!username) {
      return { success: false, error: '用户解码失败' };
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
