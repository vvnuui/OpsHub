# 环境变量配置说明

本文档详细说明 OpsHub 运维统一门户系统的环境变量配置。

## 快速开始

### 1. 复制模板文件

```bash
cd backend
cp .env.example .env
```

### 2. 编辑配置

根据实际环境修改 `.env` 文件中的配置项。

### 3. 启动服务

```bash
npm start
```

---

## 配置项详细说明

### 服务器配置

#### `PORT`
- **类型**: 整数
- **默认值**: `3000`
- **说明**: 后端服务监听的端口号
- **示例**: `PORT=8080`

#### `NODE_ENV`
- **类型**: 字符串
- **默认值**: `development`
- **可选值**: `development` | `production`
- **说明**: 运行环境，影响日志级别和错误提示详细程度
- **示例**: `NODE_ENV=production`

---

### 安全配置

#### `JWT_SECRET`
- **类型**: 字符串
- **默认值**: `opshub-jwt-secret-key-change-in-production`
- **说明**: JWT 令牌签名密钥
- **⚠️ 重要**: 生产环境必须修改为复杂的随机字符串！
- **生成建议**: 使用至少 32 位的随机字符串
- **生成命令**:
  ```bash
  # Linux/Mac
  openssl rand -base64 32

  # Node.js
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```
- **示例**: `JWT_SECRET=a9f8h3j2k4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9A0B1C2D3E4F5G6H7`

#### `JWT_ACCESS_EXPIRES_IN`
- **类型**: 整数（秒）
- **默认值**: `7200` (2 小时)
- **说明**: JWT 访问令牌的有效期
- **示例**: `JWT_ACCESS_EXPIRES_IN=3600` (1 小时)

#### `JWT_REFRESH_EXPIRES_IN`
- **类型**: 整数（秒）
- **默认值**: `604800` (7 天)
- **说明**: JWT 刷新令牌的有效期
- **示例**: `JWT_REFRESH_EXPIRES_IN=1209600` (14 天)

#### `BCRYPT_SALT_ROUNDS`
- **类型**: 整数
- **默认值**: `10`
- **说明**: bcrypt 密码加密的成本因子（轮数）
- **范围**: 推荐值 10-12，值越大越安全但速度越慢
- **示例**: `BCRYPT_SALT_ROUNDS=12`

---

### SSO 单点登录配置

#### `SSO_SYS_KEY`
- **类型**: 字符串
- **默认值**: `vjDPXzvbQmI5GPv`
- **说明**: SSO 加密密钥，需要与 OA 系统保持一致
- **⚠️ 重要**: 必须与对接的 OA 系统使用相同的密钥！
- **示例**: `SSO_SYS_KEY=your-oa-system-key`

#### `SSO_SALT`
- **类型**: 字符串
- **默认值**: `hWiqER1nLeAtQrN`
- **说明**: SSO 加密盐值，需要与 OA 系统保持一致
- **⚠️ 重要**: 必须与对接的 OA 系统使用相同的盐值！
- **示例**: `SSO_SALT=your-oa-system-salt`

> **SSO 配置注意事项**:
> - `SSO_SYS_KEY` 和 `SSO_SALT` 必须与对接的 OA 系统完全一致
> - 这些值通常可以从 OA 系统的配置文件中获取（如 `syn_login.php`）
> - 修改这些值会导致 SSO 登录失败

---

### 数据库配置

#### `DATABASE_PATH`
- **类型**: 字符串（文件路径）
- **默认值**: `./data/opshub.db`
- **说明**: SQLite 数据库文件的路径（相对于 backend 目录）
- **示例**:
  ```bash
  # 相对路径
  DATABASE_PATH=./data/opshub.db

  # 绝对路径
  DATABASE_PATH=/var/lib/opshub/opshub.db
  ```

---

### 前端配置

#### `FRONTEND_DIST_PATH`
- **类型**: 字符串（目录路径）
- **默认值**: `../../frontend/dist`
- **说明**: 前端构建产物的路径（相对于 backend/src 目录）
- **示例**: `FRONTEND_DIST_PATH=../../frontend/dist`

---

### 健康检查配置

#### `HEALTH_CHECK_INTERVAL`
- **类型**: 整数（毫秒）
- **默认值**: `30000` (30 秒)
- **说明**: 系统健康检查的间隔时间
- **示例**: `HEALTH_CHECK_INTERVAL=60000` (60 秒)

#### `HEALTH_CHECK_TIMEOUT`
- **类型**: 整数（毫秒）
- **默认值**: `5000` (5 秒)
- **说明**: 健康检查请求的超时时间
- **示例**: `HEALTH_CHECK_TIMEOUT=10000` (10 秒)

---

### 初始管理员账户

#### `DEFAULT_ADMIN_USERNAME`
- **类型**: 字符串
- **默认值**: `admin`
- **说明**: 首次运行时创建的默认管理员用户名
- **⚠️ 注意**: 仅在数据库为空时生效
- **示例**: `DEFAULT_ADMIN_USERNAME=sysadmin`

#### `DEFAULT_ADMIN_PASSWORD`
- **类型**: 字符串
- **默认值**: `admin123`
- **说明**: 首次运行时创建的默认管理员密码
- **⚠️ 重要**: 首次登录后请立即修改密码！
- **⚠️ 注意**: 仅在数据库为空时生效
- **示例**: `DEFAULT_ADMIN_PASSWORD=StrongP@ssw0rd!`

#### `DEFAULT_ADMIN_EMAIL`
- **类型**: 字符串（邮箱格式）
- **默认值**: `admin@opshub.local`
- **说明**: 首次运行时创建的默认管理员邮箱
- **⚠️ 注意**: 仅在数据库为空时生效
- **示例**: `DEFAULT_ADMIN_EMAIL=admin@example.com`

---

## 配置示例

### 开发环境配置

```bash
# 开发环境 .env
PORT=3000
NODE_ENV=development

JWT_SECRET=dev-secret-key-not-for-production
JWT_ACCESS_EXPIRES_IN=7200
JWT_REFRESH_EXPIRES_IN=604800
BCRYPT_SALT_ROUNDS=10

SSO_SYS_KEY=vjDPXzvbQmI5GPv
SSO_SALT=hWiqER1nLeAtQrN

DATABASE_PATH=./data/opshub.db
FRONTEND_DIST_PATH=../../frontend/dist

HEALTH_CHECK_INTERVAL=30000
HEALTH_CHECK_TIMEOUT=5000

DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=admin123
DEFAULT_ADMIN_EMAIL=admin@opshub.local
```

### 生产环境配置

```bash
# 生产环境 .env
PORT=8080
NODE_ENV=production

# 🔒 使用强密钥（必须修改）
JWT_SECRET=a9f8h3j2k4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9A0B1C2D3E4F5G6H7
JWT_ACCESS_EXPIRES_IN=3600
JWT_REFRESH_EXPIRES_IN=1209600
BCRYPT_SALT_ROUNDS=12

# 📡 与 OA 系统保持一致
SSO_SYS_KEY=your-production-oa-key
SSO_SALT=your-production-oa-salt

# 💾 使用绝对路径
DATABASE_PATH=/var/lib/opshub/opshub.db
FRONTEND_DIST_PATH=/var/www/opshub/dist

HEALTH_CHECK_INTERVAL=60000
HEALTH_CHECK_TIMEOUT=10000

# 👤 强密码（首次运行后立即登录修改）
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=Str0ng!P@ssw0rd#2024
DEFAULT_ADMIN_EMAIL=admin@yourcompany.com
```

---

## 安全建议

### 1. 密钥管理
- ✅ 生产环境必须修改所有默认密钥
- ✅ 使用强随机密钥（至少 32 位）
- ✅ 不要在代码仓库中提交 `.env` 文件
- ✅ 定期轮换密钥（建议每季度一次）

### 2. 密码策略
- ✅ 默认管理员密码仅用于首次登录
- ✅ 登录后立即修改为强密码
- ✅ 强密码要求：至少 12 位，包含大小写字母、数字和特殊字符

### 3. SSO 配置
- ✅ 确保 SSO 密钥与 OA 系统完全一致
- ✅ 定期检查 SSO 配置的同步性
- ✅ 记录 SSO 密钥的来源和更新历史

### 4. 文件权限
- ✅ `.env` 文件权限应设置为 600 (仅所有者可读写)
  ```bash
  chmod 600 backend/.env
  ```
- ✅ 确保 `.env` 文件不被 web 服务器直接访问

---

## 故障排查

### 问题：JWT 令牌验证失败
**可能原因**:
- JWT_SECRET 配置错误或被修改
- 令牌已过期
- 系统时间不同步

**解决方案**:
1. 检查 `JWT_SECRET` 配置是否正确
2. 检查令牌有效期配置
3. 同步系统时间
4. 清除旧令牌，重新登录

### 问题：SSO 登录失败
**可能原因**:
- SSO 密钥与 OA 系统不一致
- User-Agent 不匹配
- 时间戳过期

**解决方案**:
1. 确认 `SSO_SYS_KEY` 和 `SSO_SALT` 与 OA 系统一致
2. 检查网络连接和防火墙配置
3. 查看审计日志中的详细错误信息

### 问题：数据库无法访问
**可能原因**:
- 数据库路径配置错误
- 文件权限不足
- 磁盘空间不足

**解决方案**:
1. 检查 `DATABASE_PATH` 配置
2. 确保目录存在且有读写权限
3. 检查磁盘空间

---

## 环境变量加载顺序

1. 系统环境变量
2. `.env` 文件
3. 代码中的默认值

**注意**: 系统环境变量优先级最高，可以覆盖 `.env` 文件中的配置。

---

## 相关文档

- [部署文档](../README.md)
- [API 文档](../API.md)
- [SSO 对接文档](../SSO_INTEGRATION.md)

---

## 技术支持

如有问题，请联系：
- 项目仓库: [https://github.com/your-org/yunwei_sso](https://github.com/your-org/yunwei_sso)
- 问题反馈: [Issues](https://github.com/your-org/yunwei_sso/issues)
