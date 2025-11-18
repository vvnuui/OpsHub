import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 数据库文件路径
const dbPath = path.join(__dirname, '../../data/systems.json');

// 确保data目录存在
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 初始数据
const initialData = {
  systems: [
    {
      id: 1,
      name: 'WG监控系统',
      url: 'http://localhost:8001',
      icon: 'Monitor',
      description: 'WireGuard VPN监控管理系统',
      order_num: 1,
      status: 'active',
      health_status: 'unknown',
      response_time: null,
      last_check_time: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      name: 'Mwan3系统',
      url: 'http://localhost:8002',
      icon: 'Connection',
      description: 'Mwan3多线路负载均衡系统',
      order_num: 2,
      status: 'active',
      health_status: 'unknown',
      response_time: null,
      last_check_time: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 3,
      name: 'FRP系统',
      url: 'http://localhost:8003',
      icon: 'Share',
      description: 'FRP内网穿透管理系统',
      order_num: 3,
      status: 'active',
      health_status: 'unknown',
      response_time: null,
      last_check_time: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 4,
      name: 'Google Youtube监控',
      url: 'http://localhost:8004',
      icon: 'VideoCamera',
      description: 'Google Youtube服务监控系统',
      order_num: 4,
      status: 'active',
      health_status: 'unknown',
      response_time: null,
      last_check_time: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 5,
      name: '仓库管理系统',
      url: 'http://localhost:8005',
      icon: 'Box',
      description: '物资仓库管理系统',
      order_num: 5,
      status: 'active',
      health_status: 'unknown',
      response_time: null,
      last_check_time: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 6,
      name: '虚拟机申请系统',
      url: 'http://localhost:8006',
      icon: 'Cpu',
      description: '虚拟机资源申请与管理系统',
      order_num: 6,
      status: 'active',
      health_status: 'unknown',
      response_time: null,
      last_check_time: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 7,
      name: 'AI服务器监控',
      url: 'http://localhost:8007',
      icon: 'DataAnalysis',
      description: 'AI服务器性能监控系统',
      order_num: 7,
      status: 'active',
      health_status: 'unknown',
      response_time: null,
      last_check_time: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  nextId: 8
};

// 读取数据库
function readDB() {
  try {
    if (!fs.existsSync(dbPath)) {
      return null;
    }
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('读取数据库失败:', error);
    return null;
  }
}

// 写入数据库
function writeDB(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('写入数据库失败:', error);
    return false;
  }
}

// 初始化数据库
export function initDatabase() {
  const data = readDB();

  if (!data) {
    // 如果数据库文件不存在，创建初始数据
    writeDB(initialData);
    console.log('✅ 初始化7个系统数据完成');
  } else {
    console.log('✅ 数据库已存在，跳过初始化');
  }
}

// 系统配置 CRUD 操作
export const systemsDB = {
  // 获取所有系统
  getAll: () => {
    const data = readDB();
    if (!data) return [];
    return data.systems.sort((a, b) => a.order_num - b.order_num);
  },

  // 根据ID获取系统
  getById: (id) => {
    const data = readDB();
    if (!data) return null;
    return data.systems.find(s => s.id === parseInt(id));
  },

  // 创建新系统
  create: (systemData) => {
    const data = readDB() || { systems: [], nextId: 1 };

    const newSystem = {
      id: data.nextId,
      name: systemData.name,
      url: systemData.url,
      icon: systemData.icon || 'Monitor',
      description: systemData.description || '',
      order_num: systemData.order_num || 0,
      status: systemData.status || 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    data.systems.push(newSystem);
    data.nextId++;

    writeDB(data);
    return newSystem.id;
  },

  // 更新系统
  update: (id, systemData) => {
    const data = readDB();
    if (!data) return 0;

    const index = data.systems.findIndex(s => s.id === parseInt(id));
    if (index === -1) return 0;

    data.systems[index] = {
      ...data.systems[index],
      name: systemData.name,
      url: systemData.url,
      icon: systemData.icon,
      description: systemData.description,
      order_num: systemData.order_num,
      status: systemData.status,
      updated_at: new Date().toISOString()
    };

    writeDB(data);
    return 1;
  },

  // 删除系统
  delete: (id) => {
    const data = readDB();
    if (!data) return 0;

    const initialLength = data.systems.length;
    data.systems = data.systems.filter(s => s.id !== parseInt(id));

    if (data.systems.length < initialLength) {
      writeDB(data);
      return 1;
    }

    return 0;
  },

  // 更新系统健康状态
  updateHealthStatus: (id, healthStatus, responseTime) => {
    const data = readDB();
    if (!data) return 0;

    const index = data.systems.findIndex(s => s.id === parseInt(id));
    if (index === -1) return 0;

    data.systems[index].health_status = healthStatus;
    data.systems[index].response_time = responseTime;
    data.systems[index].last_check_time = new Date().toISOString();

    writeDB(data);
    return 1;
  }
};
