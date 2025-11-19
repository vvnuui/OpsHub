import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { hashPassword } from '../utils/password.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 数据库文件路径
const dbPath = path.join(__dirname, '../../data/opshub.db');
const schemaPath = path.join(__dirname, 'schema.sql');

// 确保 data 目录存在
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 创建数据库连接
let db = null;

/**
 * 获取数据库连接
 */
export function getDB() {
  if (!db) {
    db = new Database(dbPath);
    // 启用外键约束
    db.pragma('foreign_keys = ON');
  }
  return db;
}

/**
 * 获取当前 Unix 时间戳（秒）
 */
function getCurrentTimestamp() {
  return Math.floor(Date.now() / 1000);
}

/**
 * 将 Unix 时间戳（秒）转换为 YYYY-MM-DD HH:mm:ss 格式（用于前端显示）
 */
function timestampToDateTime(timestamp) {
  if (!timestamp) return null;
  const date = new Date(timestamp * 1000);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 将 Date 对象或时间戳（毫秒）转换为 YYYY-MM-DD HH:mm:ss 格式（用于 API 响应）
 */
export function formatDateTimeForAPI(date) {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 将系统数据的时间戳转换为 YYYY-MM-DD HH:mm:ss 格式（用于 API 响应）
 */
function formatSystemForAPI(system) {
  if (!system) return null;
  return {
    ...system,
    created_at: timestampToDateTime(system.created_at),
    updated_at: timestampToDateTime(system.updated_at),
    last_check_time: timestampToDateTime(system.last_check_time)
  };
}

// 初始化数据库
export async function initDatabase() {
  const database = getDB();

  try {
    // 读取并执行 schema.sql
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    database.exec(schema);

    const now = getCurrentTimestamp();

    // 初始化用户数据
    const userCount = database.prepare('SELECT COUNT(*) as count FROM users').get();

    if (userCount.count === 0) {
      // 创建默认管理员账户
      // 默认密码: admin123 (生产环境应该修改)
      const hashedPassword = await hashPassword('admin123');

      database.prepare(`
        INSERT INTO users (username, password, email, full_name, role, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'admin',
        hashedPassword,
        'admin@opshub.local',
        '系统管理员',
        'admin',
        'active',
        now,
        now
      );

      console.log('✅ 创建默认管理员账户完成');
      console.log('   用户名: admin');
      console.log('   密码: admin123');
      console.log('   ⚠️  请在生产环境中立即修改默认密码！');
    }

    // 初始化系统数据
    const systemCount = database.prepare('SELECT COUNT(*) as count FROM systems').get();

    if (systemCount.count === 0) {
      // 插入初始数据
      const initialSystems = [
        {
          name: 'WG监控系统',
          url: 'http://localhost:8001',
          icon: 'Monitor',
          description: 'WireGuard VPN监控管理系统',
          order_num: 1,
          status: 'active'
        },
        {
          name: 'Mwan3系统',
          url: 'http://localhost:8002',
          icon: 'Connection',
          description: 'Mwan3多线路负载均衡系统',
          order_num: 2,
          status: 'active'
        },
        {
          name: 'FRP系统',
          url: 'http://localhost:8003',
          icon: 'Share',
          description: 'FRP内网穿透管理系统',
          order_num: 3,
          status: 'active'
        },
        {
          name: 'Google Youtube监控',
          url: 'http://localhost:8004',
          icon: 'VideoCamera',
          description: 'Google Youtube服务监控系统',
          order_num: 4,
          status: 'active'
        },
        {
          name: '仓库管理系统',
          url: 'http://localhost:8005',
          icon: 'Box',
          description: '物资仓库管理系统',
          order_num: 5,
          status: 'active'
        },
        {
          name: '虚拟机申请系统',
          url: 'http://localhost:8006',
          icon: 'Cpu',
          description: '虚拟机资源申请与管理系统',
          order_num: 6,
          status: 'active'
        },
        {
          name: 'AI服务器监控',
          url: 'http://localhost:8007',
          icon: 'DataAnalysis',
          description: 'AI服务器性能监控系统',
          order_num: 7,
          status: 'active'
        }
      ];

      const insert = database.prepare(`
        INSERT INTO systems (name, url, icon, description, order_num, status, created_at, updated_at)
        VALUES (@name, @url, @icon, @description, @order_num, @status, @created_at, @updated_at)
      `);

      const insertMany = database.transaction((systems) => {
        for (const system of systems) {
          insert.run({
            ...system,
            created_at: now,
            updated_at: now
          });
        }
      });

      insertMany(initialSystems);
      console.log('✅ 初始化 7 个系统数据完成');
    }

    if (userCount.count === 0 || systemCount.count === 0) {
      console.log('✅ 数据库初始化完成');
    } else {
      console.log('✅ 数据库已存在，跳过初始化');
    }
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    throw error;
  }
}

// 系统配置 CRUD 操作
export const systemsDB = {
  // 获取所有系统
  getAll: () => {
    const database = getDB();
    const stmt = database.prepare('SELECT * FROM systems ORDER BY order_num ASC');
    const systems = stmt.all();
    // 将时间戳转换为 ISO 格式返回给前端
    return systems.map(formatSystemForAPI);
  },

  // 根据 ID 获取系统
  getById: (id) => {
    const database = getDB();
    const stmt = database.prepare('SELECT * FROM systems WHERE id = ?');
    const system = stmt.get(parseInt(id));
    return formatSystemForAPI(system);
  },

  // 创建新系统
  create: (systemData) => {
    const database = getDB();
    const now = getCurrentTimestamp();

    const stmt = database.prepare(`
      INSERT INTO systems (name, url, icon, description, order_num, status, created_at, updated_at)
      VALUES (@name, @url, @icon, @description, @order_num, @status, @created_at, @updated_at)
    `);

    const result = stmt.run({
      name: systemData.name,
      url: systemData.url,
      icon: systemData.icon || 'Monitor',
      description: systemData.description || '',
      order_num: systemData.order_num || 0,
      status: systemData.status || 'active',
      created_at: now,
      updated_at: now
    });

    return result.lastInsertRowid;
  },

  // 更新系统
  update: (id, systemData) => {
    const database = getDB();
    const now = getCurrentTimestamp();

    const stmt = database.prepare(`
      UPDATE systems
      SET name = @name,
          url = @url,
          icon = @icon,
          description = @description,
          order_num = @order_num,
          status = @status,
          updated_at = @updated_at
      WHERE id = @id
    `);

    const result = stmt.run({
      id: parseInt(id),
      name: systemData.name,
      url: systemData.url,
      icon: systemData.icon,
      description: systemData.description,
      order_num: systemData.order_num,
      status: systemData.status,
      updated_at: now
    });

    return result.changes;
  },

  // 删除系统
  delete: (id) => {
    const database = getDB();
    const stmt = database.prepare('DELETE FROM systems WHERE id = ?');
    const result = stmt.run(parseInt(id));
    return result.changes;
  },

  // 更新系统健康状态
  updateHealthStatus: (id, healthStatus, responseTime) => {
    const database = getDB();
    const now = getCurrentTimestamp();

    const stmt = database.prepare(`
      UPDATE systems
      SET health_status = @health_status,
          response_time = @response_time,
          last_check_time = @last_check_time
      WHERE id = @id
    `);

    const result = stmt.run({
      id: parseInt(id),
      health_status: healthStatus,
      response_time: responseTime,
      last_check_time: now
    });

    return result.changes;
  }
};

// 进程退出时关闭数据库连接
process.on('exit', () => {
  if (db) {
    db.close();
  }
});

process.on('SIGINT', () => {
  if (db) {
    db.close();
  }
  process.exit(0);
});
