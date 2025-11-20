-- OpsHub 系统管理数据库表结构
-- 使用 SQLite 数据库
-- 时间字段采用秒级 Unix 时间戳存储

CREATE TABLE IF NOT EXISTS systems (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT DEFAULT 'Monitor',
  description TEXT,
  order_num INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  health_status TEXT DEFAULT 'unknown',
  response_time INTEGER,
  last_check_time INTEGER,  -- Unix 时间戳（秒）
  created_at INTEGER NOT NULL,  -- Unix 时间戳（秒）
  updated_at INTEGER NOT NULL   -- Unix 时间戳（秒）
);

-- 创建索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_systems_status ON systems(status);
CREATE INDEX IF NOT EXISTS idx_systems_health_status ON systems(health_status);
CREATE INDEX IF NOT EXISTS idx_systems_order_num ON systems(order_num);

-- ==================== 用户认证和权限管理表 ====================

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,              -- bcrypt哈希密码
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'user',            -- 用户角色: admin/user/auditor
  status TEXT DEFAULT 'active',        -- 账户状态: active/disabled
  last_login_time INTEGER,             -- 最后登录时间（Unix时间戳，秒）
  created_at INTEGER NOT NULL,         -- Unix 时间戳（秒）
  updated_at INTEGER NOT NULL          -- Unix 时间戳（秒）
);

-- 会话管理表
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  access_token TEXT UNIQUE NOT NULL,   -- JWT访问令牌
  refresh_token TEXT,                  -- 刷新令牌
  expires_at INTEGER NOT NULL,         -- 过期时间（Unix时间戳，秒）
  ip_address TEXT,                     -- 登录IP地址
  user_agent TEXT,                     -- 用户代理字符串
  created_at INTEGER NOT NULL,         -- Unix 时间戳（秒）
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 用户系统访问权限表
CREATE TABLE IF NOT EXISTS user_system_access (
  user_id INTEGER NOT NULL,
  system_id INTEGER NOT NULL,
  granted_at INTEGER NOT NULL,         -- 授权时间（Unix时间戳，秒）
  granted_by INTEGER,                  -- 授权人ID
  PRIMARY KEY (user_id, system_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (system_id) REFERENCES systems(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 操作审计日志表
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  username TEXT,                       -- 冗余存储用户名，防止用户删除后无法追溯
  action TEXT NOT NULL,                -- 操作类型: login/logout/create/update/delete/access
  resource_type TEXT,                  -- 资源类型: system/user/session等
  resource_id INTEGER,                 -- 资源ID
  details TEXT,                        -- 操作详情（JSON格式）
  ip_address TEXT,                     -- 操作IP地址
  user_agent TEXT,                     -- 用户代理字符串
  created_at INTEGER NOT NULL,         -- Unix 时间戳（秒）
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 创建索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_access_token ON sessions(access_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_user_system_access_user_id ON user_system_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_system_access_system_id ON user_system_access(system_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
