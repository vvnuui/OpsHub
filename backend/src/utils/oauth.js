/**
 * OAuth 2.0 工具函数
 */
import axios from 'axios';

/**
 * 构建OAuth授权URL
 * @param {object} provider - OAuth提供商配置
 * @param {string} redirectUri - 回调地址
 * @param {string} state - 状态参数（防CSRF）
 * @returns {string} - 授权URL
 */
export function buildAuthorizeUrl(provider, redirectUri, state) {
  const params = new URLSearchParams({
    client_id: provider.client_id,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: provider.scope || 'openid profile email',
    state: state
  });

  return `${provider.authorize_url}?${params.toString()}`;
}

/**
 * 使用授权码换取访问令牌
 * @param {object} provider - OAuth提供商配置
 * @param {string} code - 授权码
 * @param {string} redirectUri - 回调地址
 * @returns {Promise<object>} - 令牌响应 { access_token, refresh_token, expires_in, ... }
 */
export async function exchangeCodeForToken(provider, code, redirectUri) {
  try {
    const response = await axios.post(
      provider.token_url,
      {
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: provider.client_id,
        client_secret: provider.client_secret
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('OAuth令牌交换失败:', error.response?.data || error.message);
    throw new Error('OAuth令牌交换失败');
  }
}

/**
 * 获取OAuth用户信息
 * @param {object} provider - OAuth提供商配置
 * @param {string} accessToken - 访问令牌
 * @returns {Promise<object>} - 用户信息 { sub, email, name, ... }
 */
export async function fetchOAuthUserInfo(provider, accessToken) {
  try {
    const response = await axios.get(provider.user_info_url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    return response.data;
  } catch (error) {
    console.error('获取OAuth用户信息失败:', error.response?.data || error.message);
    throw new Error('获取OAuth用户信息失败');
  }
}

/**
 * 生成随机state参数（防CSRF攻击）
 * @returns {string} - 随机字符串
 */
export function generateState() {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

/**
 * 规范化OAuth用户信息（不同提供商返回的字段可能不同）
 * @param {object} userInfo - OAuth提供商返回的用户信息
 * @param {string} providerName - 提供商名称
 * @returns {object} - 规范化后的用户信息 { username, email, full_name }
 */
export function normalizeOAuthUserInfo(userInfo, providerName) {
  // 不同提供商的字段映射
  const normalized = {
    username: '',
    email: '',
    full_name: ''
  };

  // 根据不同的提供商进行字段映射
  switch (providerName) {
    case 'google':
      normalized.username = userInfo.email?.split('@')[0] || userInfo.sub;
      normalized.email = userInfo.email;
      normalized.full_name = userInfo.name;
      break;

    case 'github':
      normalized.username = userInfo.login;
      normalized.email = userInfo.email;
      normalized.full_name = userInfo.name;
      break;

    case 'microsoft':
      normalized.username = userInfo.userPrincipalName?.split('@')[0] || userInfo.id;
      normalized.email = userInfo.userPrincipalName || userInfo.mail;
      normalized.full_name = userInfo.displayName;
      break;

    default:
      // 通用OIDC标准字段
      normalized.username = userInfo.preferred_username || userInfo.email?.split('@')[0] || userInfo.sub;
      normalized.email = userInfo.email;
      normalized.full_name = userInfo.name;
      break;
  }

  return normalized;
}
