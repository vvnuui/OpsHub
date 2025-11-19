# SSO 系统测试指南

本文档提供详细的 SSO 系统测试步骤，包括自动化测试脚本和手动测试方法。

## 📋 测试前准备

### 1. 环境要求
- Node.js >= 14.x
- 已安装项目依赖
- 后端服务正在运行（端口 3000）

### 2. 启动后端服务

```bash
cd backend
npm install
npm start
```

服务启动后应该看到：
```
🚀 运维SSO后端服务启动成功！
📡 服务地址: http://localhost:3000
```

### 3. 确认默认管理员账号

默认管理员账号（在首次初始化时自动创建）：
- **用户名**: `admin`
- **密码**: `admin123`

---

## 🤖 方法一：自动化测试（推荐）

### 运行自动化测试脚本

```bash
# 在项目根目录执行
node test-sso.js
```

### 测试脚本会执行以下步骤：

1. ✅ **登录获取 Token** - 使用管理员账号登录
2. ✅ **创建测试用户** - 创建名为 `testuser` 的测试账号
3. ✅ **测试加密功能** - 验证 SSO 加密算法
4. ✅ **生成 SSO 链接** - 生成完整的 SSO 登录 URL
5. ✅ **测试 SSO 登录** - 验证 SSO 登录接口
6. ✅ **查看审计日志** - 确认所有操作已记录

### 预期输出示例：

```
╔════════════════════════════════════════════════════════════╗
║                  SSO 系统集成测试                          ║
╚════════════════════════════════════════════════════════════╝

============================================================
步骤1: 测试登录获取 Token
============================================================

✓ 登录成功
Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSw...
用户: admin
角色: admin

============================================================
步骤2: 创建测试用户
============================================================

✓ 测试用户创建成功: testuser
用户ID: 2

============================================================
步骤3: 测试加密功能
============================================================

✓ 加密测试成功
用户名: testuser
User-Agent: Mozilla/5.0

SSO URL:
https://www.zxmr168.com/api.php?op=syn_login&auth=abc123...&u=xyz456...

============================================================
步骤4: 生成 SSO 登录链接
============================================================

✓ SSO 链接生成成功
目标用户: testuser
目标URL: https://www.zxmr168.com/api.php

SSO 登录链接:
https://www.zxmr168.com/api.php?op=syn_login&auth=...&u=...

============================================================
步骤5: 测试 SSO 登录
============================================================

ℹ 正在测试本地 SSO 登录接口...

测试 URL: http://localhost:3000/api/sso/login?op=syn_login&auth=...&u=...

✓ SSO 登录接口响应正常
✓ SSO 登录页面返回成功

返回内容包含: 登录成功、正在跳转到系统首页...
✓ 成功提取到 JWT Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

============================================================
步骤6: 查看审计日志
============================================================

✓ 审计日志获取成功

最近的 SSO 相关操作:

1. [2025-01-19 10:30:45] admin - generate_sso_url
   详情: {"target_username":"testuser","target_url":"https://www.zxmr168.com/api.php"}
2. [2025-01-19 10:30:46] testuser - login
   详情: {"method":"sso","source":"..."}

============================================================
测试总结
============================================================

✓ 所有测试步骤已完成！

下一步操作建议：
1. 在浏览器中访问生成的 SSO URL 测试自动登录
2. 检查审计日志确认操作已记录
3. 验证用户权限和系统访问控制
```

---

## 🛠️ 方法二：手动测试

### 步骤1：登录获取 Token

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

**预期响应**:
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "role": "admin"
    }
  }
}
```

**保存 Token** 到环境变量：
```bash
# Windows CMD
set TOKEN=your_token_here

# Windows PowerShell
$TOKEN="your_token_here"

# Linux/Mac
export TOKEN="your_token_here"
```

---

### 步骤2：创建测试用户（可选）

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer %TOKEN%" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"testuser\", \"password\": \"test123456\", \"full_name\": \"测试用户\", \"role\": \"user\", \"status\": \"active\"}"
```

**预期响应**:
```json
{
  "code": 200,
  "message": "创建成功",
  "data": {
    "id": 2
  }
}
```

---

### 步骤3：测试加密功能（开发环境）

```bash
curl "http://localhost:3000/api/sso/test-encrypt?username=admin"
```

**预期响应**:
```json
{
  "code": 200,
  "message": "加密测试",
  "data": {
    "username": "admin",
    "sso_url": "https://www.zxmr168.com/api.php?op=syn_login&auth=xxx&u=xxx",
    "user_agent": "Mozilla/5.0"
  }
}
```

---

### 步骤4：生成 SSO 登录链接

```bash
curl -X POST http://localhost:3000/api/sso/generate-url \
  -H "Authorization: Bearer %TOKEN%" \
  -H "Content-Type: application/json" \
  -d "{\"target_url\": \"https://www.zxmr168.com/api.php\", \"username\": \"admin\"}"
```

**预期响应**:
```json
{
  "code": 200,
  "message": "SSO 链接生成成功",
  "data": {
    "sso_url": "https://www.zxmr168.com/api.php?op=syn_login&auth=2b8f28eba254cf8b92d11feda8b0472c&u=9b27VQ5TVA0CAg1SBFZQXQhVBgFUAANUBVpQUg%2BAiq%2FdgeaNgOo",
    "username": "admin",
    "target_url": "https://www.zxmr168.com/api.php"
  }
}
```

---

### 步骤5：在浏览器中测试 SSO 登录

1. **复制生成的 SSO URL**
2. **修改域名为本地测试**：
   ```
   原始: https://www.zxmr168.com/api.php?op=syn_login&auth=xxx&u=xxx
   修改: http://localhost:3000/api/sso/login?op=syn_login&auth=xxx&u=xxx
   ```

3. **在浏览器中访问修改后的 URL**

4. **预期效果**：
   - 显示"登录成功！正在跳转到系统首页..."
   - 自动保存 Token 到 localStorage
   - 1秒后自动跳转到系统首页
   - 用户已登录状态

---

### 步骤6：验证登录状态

打开浏览器控制台（F12），执行：
```javascript
// 查看保存的 token
console.log(localStorage.getItem('token'));

// 查看用户信息
console.log(JSON.parse(localStorage.getItem('user')));
```

**预期输出**:
```javascript
// token
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

// user
{
  id: 1,
  username: "admin",
  role: "admin",
  email: ""
}
```

---

### 步骤7：查看审计日志

```bash
curl "http://localhost:3000/api/audit-logs?limit=10" \
  -H "Authorization: Bearer %TOKEN%"
```

**预期响应** - 应包含 SSO 相关操作：
```json
{
  "code": 200,
  "message": "获取审计日志成功",
  "data": [
    {
      "id": 15,
      "user_id": 1,
      "username": "admin",
      "action": "generate_sso_url",
      "resource_type": "sso",
      "resource_id": 1,
      "details": {
        "target_username": "admin",
        "target_url": "https://www.zxmr168.com/api.php"
      },
      "created_at": "2025-01-19 10:30:45"
    },
    {
      "id": 16,
      "user_id": 1,
      "username": "admin",
      "action": "login",
      "resource_type": "user",
      "resource_id": 1,
      "details": {
        "method": "sso",
        "source": "http://localhost:3000"
      },
      "created_at": "2025-01-19 10:30:46"
    }
  ]
}
```

---

## 🧪 高级测试场景

### 测试1：无效的认证签名

```bash
curl "http://localhost:3000/api/sso/login?op=syn_login&auth=invalid_auth&u=test"
```

**预期结果**: `ERR: auth认证失败`

---

### 测试2：无效的加密用户名

```bash
curl "http://localhost:3000/api/sso/login?op=syn_login&auth=xxx&u=invalid_encrypted_username"
```

**预期结果**: `ERR: 用户解码失败`

---

### 测试3：不存在的用户

生成一个不存在的用户名的 SSO 链接：
```bash
curl -X POST http://localhost:3000/api/sso/generate-url \
  -H "Authorization: Bearer %TOKEN%" \
  -H "Content-Type: application/json" \
  -d "{\"target_url\": \"https://www.zxmr168.com/api.php\", \"username\": \"nonexistent\"}"
```

**预期结果**: `404 - 用户不存在`

---

### 测试4：禁用的用户

1. **创建用户并禁用**：
```bash
# 创建用户
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer %TOKEN%" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"disabled_user\", \"password\": \"test123\", \"role\": \"user\", \"status\": \"disabled\"}"

# 生成 SSO 链接
curl -X POST http://localhost:3000/api/sso/generate-url \
  -H "Authorization: Bearer %TOKEN%" \
  -H "Content-Type: application/json" \
  -d "{\"target_url\": \"https://www.zxmr168.com/api.php\", \"username\": \"disabled_user\"}"
```

**预期结果**: `403 - 用户账户已被禁用`

---

## 🔍 故障排查

### 问题1：测试脚本连接失败

**错误信息**: `ECONNREFUSED`

**解决方案**:
1. 确认后端服务已启动：`netstat -ano | findstr :3000`
2. 检查防火墙设置
3. 确认端口 3000 未被占用

---

### 问题2：401 未授权错误

**错误信息**: `401 Unauthorized`

**解决方案**:
1. 确认 Token 有效且未过期（默认2小时）
2. 检查 Token 格式：`Bearer <token>`
3. 重新登录获取新 Token

---

### 问题3：加密测试接口 404

**错误信息**: `404 Not Found`

**原因**: 测试接口仅在开发环境可用

**解决方案**:
```bash
# 设置开发环境
# Windows
set NODE_ENV=development

# Linux/Mac
export NODE_ENV=development

# 重启服务
npm start
```

---

### 问题4：SSO 登录后无法跳转

**可能原因**:
1. 前端未运行
2. Token 未正确保存到 localStorage
3. 浏览器阻止了跨域请求

**解决方案**:
1. 启动前端服务
2. 检查浏览器控制台是否有错误
3. 使用浏览器开发工具查看 localStorage

---

## 📊 测试报告示例

完成测试后，建议记录以下信息：

```markdown
## SSO 系统测试报告

### 测试环境
- 日期: 2025-01-19
- 服务器: http://localhost:3000
- 测试用户: admin, testuser

### 测试结果
- [✓] 登录功能
- [✓] 创建用户
- [✓] 加密算法
- [✓] SSO 链接生成
- [✓] SSO 登录验证
- [✓] 审计日志记录

### 发现的问题
- 无

### 建议
1. 生产环境部署前更换密钥
2. 启用 HTTPS
3. 配置日志清理策略
```

---

## 🎯 下一步

测试通过后，可以进行：

1. **前端集成** - 在系统页面添加 SSO 跳转按钮
2. **生产部署** - 配置正式环境的域名和密钥
3. **OA 系统对接** - 与实际 OA 系统进行联调
4. **安全加固** - 实施 IP 白名单、频率限制等

---

## 📞 支持

如遇到问题，请检查：
1. 后端日志：查看控制台输出
2. 审计日志：`GET /api/audit-logs`
3. 数据库文件：`backend/data/sso.db`

更多信息请参考：
- `SSO_INTEGRATION.md` - SSO 集成文档
- `README.md` - 项目说明
