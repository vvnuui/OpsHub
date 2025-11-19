/**
 * SSO 系统测试脚本
 * 使用方法：node test-sso.js
 */
import axios from 'axios';

const BASE_URL = 'http://localhost:3000';
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

let token = '';
let testUsername = 'testuser';

// 打印分隔线
function printSeparator(title) {
  console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}${title}${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
}

// 打印成功消息
function printSuccess(message) {
  console.log(`${colors.green}✓ ${message}${colors.reset}`);
}

// 打印错误消息
function printError(message) {
  console.log(`${colors.red}✗ ${message}${colors.reset}`);
}

// 打印信息
function printInfo(message) {
  console.log(`${colors.yellow}ℹ ${message}${colors.reset}`);
}

// 步骤1: 测试登录获取 Token
async function testLogin() {
  printSeparator('步骤1: 测试登录获取 Token');

  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });

    if (response.data.code === 200) {
      token = response.data.data.token;
      printSuccess('登录成功');
      console.log(`Token: ${token.substring(0, 50)}...`);
      console.log(`用户: ${response.data.data.user.username}`);
      console.log(`角色: ${response.data.data.user.role}`);
      return true;
    } else {
      printError(`登录失败: ${response.data.message}`);
      return false;
    }
  } catch (error) {
    printError(`登录请求失败: ${error.message}`);
    if (error.response) {
      console.log(`响应状态: ${error.response.status}`);
      console.log(`响应数据:`, error.response.data);
    }
    return false;
  }
}

// 步骤2: 创建测试用户
async function createTestUser() {
  printSeparator('步骤2: 创建测试用户');

  try {
    const response = await axios.post(
      `${BASE_URL}/api/users`,
      {
        username: testUsername,
        password: 'test123456',
        full_name: 'SSO测试用户',
        email: 'test@example.com',
        role: 'user',
        status: 'active'
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (response.data.code === 200) {
      printSuccess(`测试用户创建成功: ${testUsername}`);
      console.log(`用户ID: ${response.data.data.id}`);
      return true;
    } else {
      printError(`创建用户失败: ${response.data.message}`);
      return false;
    }
  } catch (error) {
    if (error.response && error.response.status === 400) {
      printInfo(`用户 ${testUsername} 已存在，跳过创建`);
      return true;
    }
    printError(`创建用户请求失败: ${error.message}`);
    return false;
  }
}

// 步骤3: 测试加密功能
async function testEncryption() {
  printSeparator('步骤3: 测试加密功能');

  try {
    const response = await axios.get(`${BASE_URL}/api/sso/test-encrypt`, {
      params: { username: testUsername }
    });

    if (response.data.code === 200) {
      printSuccess('加密测试成功');
      console.log(`用户名: ${response.data.data.username}`);
      console.log(`User-Agent: ${response.data.data.user_agent}`);
      console.log(`\nSSO URL:`);
      console.log(`${colors.cyan}${response.data.data.sso_url}${colors.reset}`);
      return response.data.data.sso_url;
    } else {
      printError(`加密测试失败: ${response.data.message}`);
      return null;
    }
  } catch (error) {
    printError(`加密测试请求失败: ${error.message}`);
    return null;
  }
}

// 步骤4: 生成 SSO 登录链接
async function generateSSOUrl() {
  printSeparator('步骤4: 生成 SSO 登录链接');

  try {
    const response = await axios.post(
      `${BASE_URL}/api/sso/generate-url`,
      {
        target_url: 'https://www.zxmr168.com/api.php',
        username: testUsername
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (response.data.code === 200) {
      printSuccess('SSO 链接生成成功');
      console.log(`目标用户: ${response.data.data.username}`);
      console.log(`目标URL: ${response.data.data.target_url}`);
      console.log(`\nSSO 登录链接:`);
      console.log(`${colors.cyan}${response.data.data.sso_url}${colors.reset}`);

      // 提取 auth 和 u 参数用于下一步测试
      const url = new URL(response.data.data.sso_url);
      return {
        ssoUrl: response.data.data.sso_url,
        auth: url.searchParams.get('auth'),
        u: url.searchParams.get('u')
      };
    } else {
      printError(`生成 SSO 链接失败: ${response.data.message}`);
      return null;
    }
  } catch (error) {
    printError(`生成 SSO 链接请求失败: ${error.message}`);
    if (error.response) {
      console.log(`响应状态: ${error.response.status}`);
      console.log(`响应数据:`, error.response.data);
    }
    return null;
  }
}

// 步骤5: 测试 SSO 登录
async function testSSOLogin(auth, u) {
  printSeparator('步骤5: 测试 SSO 登录');

  try {
    printInfo('正在测试本地 SSO 登录接口...');

    // 构建本地 SSO 登录 URL
    const localSSOUrl = `${BASE_URL}/api/sso/login?op=syn_login&auth=${auth}&u=${encodeURIComponent(u)}`;
    console.log(`\n测试 URL: ${localSSOUrl}\n`);

    const response = await axios.get(localSSOUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      },
      maxRedirects: 0,
      validateStatus: (status) => status < 500 // 接受所有 < 500 的状态码
    });

    if (response.status === 200) {
      printSuccess('SSO 登录接口响应正常');

      // 检查响应内容
      if (response.data.includes('登录成功')) {
        printSuccess('SSO 登录页面返回成功');
        console.log(`\n返回内容包含: 登录成功、正在跳转到系统首页...`);

        // 尝试从HTML中提取token（用于验证）
        const tokenMatch = response.data.match(/localStorage\.setItem\('token',\s*'([^']+)'/);
        if (tokenMatch) {
          printSuccess(`成功提取到 JWT Token: ${tokenMatch[1].substring(0, 50)}...`);
        }

        return true;
      } else {
        printError('SSO 登录页面返回异常');
        console.log('响应内容:', response.data.substring(0, 200));
        return false;
      }
    } else if (response.status >= 400) {
      printError(`SSO 登录失败: HTTP ${response.status}`);
      console.log('错误信息:', response.data);
      return false;
    }
  } catch (error) {
    printError(`SSO 登录测试失败: ${error.message}`);
    if (error.response) {
      console.log(`响应状态: ${error.response.status}`);
      console.log(`响应内容:`, error.response.data);
    }
    return false;
  }
}

// 步骤6: 查看审计日志
async function checkAuditLogs() {
  printSeparator('步骤6: 查看审计日志');

  try {
    const response = await axios.get(`${BASE_URL}/api/audit-logs`, {
      params: {
        limit: 10,
        offset: 0
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.data.code === 200) {
      printSuccess('审计日志获取成功');
      console.log(`\n最近的 SSO 相关操作:\n`);

      const ssoLogs = response.data.data.filter(log =>
        log.action === 'generate_sso_url' || log.action === 'login'
      ).slice(0, 5);

      if (ssoLogs.length > 0) {
        ssoLogs.forEach((log, index) => {
          console.log(`${index + 1}. [${log.created_at}] ${log.username} - ${log.action}`);
          if (log.details) {
            const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
            console.log(`   详情: ${JSON.stringify(details)}`);
          }
        });
      } else {
        printInfo('暂无 SSO 相关的审计日志');
      }

      return true;
    } else {
      printError(`获取审计日志失败: ${response.data.message}`);
      return false;
    }
  } catch (error) {
    printError(`获取审计日志请求失败: ${error.message}`);
    return false;
  }
}

// 主测试流程
async function runTests() {
  console.log(`${colors.bold}${colors.cyan}`);
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                  SSO 系统集成测试                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);

  printInfo(`测试目标: ${BASE_URL}`);
  printInfo(`测试用户: ${testUsername}`);

  // 执行测试步骤
  const loginSuccess = await testLogin();
  if (!loginSuccess) {
    printError('\n测试中止：登录失败');
    process.exit(1);
  }

  await createTestUser();
  await testEncryption();

  const ssoData = await generateSSOUrl();
  if (ssoData) {
    await testSSOLogin(ssoData.auth, ssoData.u);
  }

  await checkAuditLogs();

  // 测试总结
  printSeparator('测试总结');
  printSuccess('所有测试步骤已完成！');
  console.log(`\n${colors.yellow}下一步操作建议：${colors.reset}`);
  console.log('1. 在浏览器中访问生成的 SSO URL 测试自动登录');
  console.log('2. 检查审计日志确认操作已记录');
  console.log('3. 验证用户权限和系统访问控制');
  console.log('\n');
}

// 运行测试
runTests().catch(error => {
  console.error(`${colors.red}测试执行失败:${colors.reset}`, error);
  process.exit(1);
});
