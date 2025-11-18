import { systemsDB } from '../db/database.js';
import http from 'http';
import https from 'https';
import { URL } from 'url';

// 健康检查配置
const HEALTH_CHECK_CONFIG = {
  timeout: 5000,        // 超时时间：5秒
  interval: 30000,      // 检查间隔：30秒
  userAgent: 'Yunwei-SSO-HealthChecker/1.0'
};

// 检查单个系统的健康状态
async function checkSystemHealth(system, method = 'GET') {
  const startTime = Date.now();

  try {
    const urlObj = new URL(system.url);
    const protocol = urlObj.protocol === 'https:' ? https : http;

    return await new Promise((resolve) => {
      const req = protocol.request(
        {
          hostname: urlObj.hostname,
          port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
          path: urlObj.pathname + urlObj.search,
          method: method,
          timeout: HEALTH_CHECK_CONFIG.timeout,
          headers: {
            'User-Agent': HEALTH_CHECK_CONFIG.userAgent
          }
        },
        (res) => {
          const responseTime = Date.now() - startTime;

          // 检查HTTP状态码
          if (res.statusCode >= 200 && res.statusCode < 400) {
            console.log(`✅ ${system.name} - 在线 (${responseTime}ms) [${res.statusCode}]`);
            resolve({
              id: system.id,
              health_status: 'online',
              response_time: responseTime
            });
          } else if (res.statusCode === 405 && method === 'HEAD') {
            // HEAD方法不支持，尝试GET
            console.log(`⚠️  ${system.name} - HEAD不支持，尝试GET...`);
            res.resume();
            resolve(checkSystemHealth(system, 'GET'));
            return;
          } else {
            console.log(`⚠️  ${system.name} - HTTP ${res.statusCode} (${responseTime}ms)`);
            resolve({
              id: system.id,
              health_status: 'offline',
              response_time: responseTime
            });
          }

          // 清理响应数据
          res.resume();
        }
      );

      req.on('timeout', () => {
        req.destroy();
        const responseTime = Date.now() - startTime;
        console.log(`⏱️  ${system.name} - 超时 (${responseTime}ms)`);
        resolve({
          id: system.id,
          health_status: 'offline',
          response_time: responseTime
        });
      });

      req.on('error', (error) => {
        const responseTime = Date.now() - startTime;
        console.log(`❌ ${system.name} - 离线 (${error.message})`);
        resolve({
          id: system.id,
          health_status: 'offline',
          response_time: responseTime
        });
      });

      req.end();
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.log(`❌ ${system.name} - 离线 (${error.message})`);
    return {
      id: system.id,
      health_status: 'offline',
      response_time: responseTime
    };
  }
}

// 检查所有系统
async function checkAllSystems() {
  console.log('\n🔍 开始健康检查...');
  const systems = systemsDB.getAll();

  // 只检查状态为active的系统
  const activeSystems = systems.filter(s => s.status === 'active');

  if (activeSystems.length === 0) {
    console.log('⚠️  没有需要检查的系统');
    return [];
  }

  // 并发检查所有系统
  const healthChecks = activeSystems.map(system => checkSystemHealth(system));
  const results = await Promise.all(healthChecks);

  // 更新数据库中的健康状态
  results.forEach(result => {
    systemsDB.updateHealthStatus(result.id, result.health_status, result.response_time);
  });

  console.log(`✅ 健康检查完成，共检查 ${results.length} 个系统\n`);
  return results;
}

// 启动定时健康检查
let healthCheckInterval = null;

function startHealthCheck() {
  if (healthCheckInterval) {
    console.log('⚠️  健康检查已在运行中');
    return;
  }

  console.log(`🚀 启动健康检查服务 (间隔: ${HEALTH_CHECK_CONFIG.interval / 1000}秒)`);

  // 立即执行一次
  checkAllSystems();

  // 设置定时任务
  healthCheckInterval = setInterval(() => {
    checkAllSystems();
  }, HEALTH_CHECK_CONFIG.interval);
}

function stopHealthCheck() {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
    console.log('🛑 健康检查服务已停止');
  }
}

// 手动触发健康检查
function triggerHealthCheck() {
  return checkAllSystems();
}

export {
  startHealthCheck,
  stopHealthCheck,
  triggerHealthCheck,
  checkSystemHealth,
  HEALTH_CHECK_CONFIG
};
