/**
 * 密码加密和验证工具
 */
import bcrypt from 'bcryptjs';

// bcrypt 加密轮数（从环境变量读取，推荐值：10-12）
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

/**
 * 加密密码
 * @param {string} password - 明文密码
 * @returns {Promise<string>} - 加密后的密码哈希
 */
export async function hashPassword(password) {
  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    return hash;
  } catch (error) {
    console.error('密码加密失败:', error);
    throw new Error('密码加密失败');
  }
}

/**
 * 验证密码
 * @param {string} password - 明文密码
 * @param {string} hash - 密码哈希
 * @returns {Promise<boolean>} - 密码是否匹配
 */
export async function verifyPassword(password, hash) {
  try {
    const isMatch = await bcrypt.compare(password, hash);
    return isMatch;
  } catch (error) {
    console.error('密码验证失败:', error);
    throw new Error('密码验证失败');
  }
}
