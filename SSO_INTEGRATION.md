# SSO 单点登录对接文档

本文档说明如何使用 OpsHub SSO 系统对接 OA 系统的单点登录功能。

## 🔑 核心配置

SSO 系统使用与 OA 系统相同的加密密钥：

```javascript
SYS_KEY = 'vjDPXzvbQmI5GPv'
SALT = 'hWiqER1nLeAtQrN'
```

## 📡 API 接口

### 1. 生成 SSO 登录链接

**接口**: `POST /api/sso/generate-url`

**权限**: 需要管理员登录

**请求头**:
```
Authorization: Bearer <your_jwt_token>
```

**请求体**:
```json
{
  "target_url": "https://www.zxmr168.com/api.php",
  "username": "admin"
}
```

**响应**:
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

**cURL 示例**:
```bash
curl -X POST http://localhost:3000/api/sso/generate-url \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "target_url": "https://www.zxmr168.com/api.php",
    "username": "admin"
  }'
```

### 2. SSO 登录接口（接收外部请求）

**接口**: `GET /api/sso/login`

**权限**: 无需认证（公开接口）

**查询参数**:
- `op`: 操作类型，必须为 `syn_login`
- `auth`: 认证签名（MD5）
- `u`: 加密的用户名

**示例 URL**:
```
http://localhost:3000/api/sso/login?op=syn_login&auth=2b8f28eba254cf8b92d11feda8b0472c&u=9b27VQ5TVA0CAg1SBFZQXQhVBgFUAANUBVpQUg%2BAiq%2FdgeaNgOo
```

**响应**:
- 成功：返回 HTML 页面，自动设置 token 并跳转到首页
- 失败：返回错误消息，格式：`ERR: 错误描述`

**错误码**:
- `ERR: 操作类型错误` - op 参数不正确
- `ERR: 参数不能为空` - 缺少 auth 或 u 参数
- `ERR: 用户解码失败` - 加密的用户名解码失败
- `ERR: auth认证失败` - 签名验证失败
- `ERR: 没有查找到用户` - 用户不存在
- `ERR: 用户账户已被禁用` - 用户状态不是 active

### 3. 测试加密接口（仅开发环境）

**接口**: `GET /api/sso/test-encrypt`

**权限**: 无需认证

**查询参数**:
- `username`: 要测试的用户名

**示例**:
```bash
curl "http://localhost:3000/api/sso/test-encrypt?username=admin"
```

**响应**:
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

## 🔐 加密算法说明

### URL 参数生成过程

1. **auth 签名生成**:
```javascript
step1 = md5(SALT + username + SYS_KEY)
auth = md5(step1 + User-Agent)
```

2. **用户名加密**:
使用 `sys_auth_old` 算法加密用户名，这是一个 XOR 加密算法，兼容 PHP 的实现。

### 示例

假设用户名为 `admin`，User-Agent 为 `Mozilla/5.0`:

```javascript
// Step 1: 生成 auth
step1 = md5('hWiqER1nLeAtQrN' + 'admin' + 'vjDPXzvbQmI5GPv')
auth = md5(step1 + 'Mozilla/5.0')

// Step 2: 加密用户名
encryptedUsername = sysAuthOld('admin', 'ENCODE', 'vjDPXzvbQmI5GPv')

// Step 3: 构建 URL
url = "https://www.zxmr168.com/api.php?op=syn_login&auth=" + auth + "&u=" + encodeURIComponent(encryptedUsername)
```

## 🧪 测试流程

### 1. 启动服务器

```bash
cd backend
npm install
npm start
```

### 2. 登录获取 Token

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "your_password"}'
```

### 3. 生成 SSO 链接

```bash
curl -X POST http://localhost:3000/api/sso/generate-url \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "target_url": "https://www.zxmr168.com/api.php",
    "username": "admin"
  }'
```

### 4. 使用生成的 SSO 链接

将返回的 `sso_url` 复制到浏览器中访问，系统会自动验证并登录用户。

## 📝 注意事项

1. **User-Agent 匹配**：auth 签名包含 User-Agent，因此生成链接和使用链接时的 UA 必须一致
2. **HTTPS 推荐**：生产环境建议使用 HTTPS 确保传输安全
3. **时效性**：加密的用户名包含时间戳，建议及时使用生成的链接
4. **权限控制**：
   - 生成 SSO 链接需要管理员权限
   - SSO 登录接口是公开的，但有严格的签名验证
5. **审计日志**：所有 SSO 操作都会记录到审计日志中

## 🔄 集成流程

### 场景1：从 OpsHub 跳转到 OA 系统

1. 用户在 OpsHub 中点击"访问 OA 系统"
2. 前端调用 `/api/sso/generate-url` 生成 SSO 链接
3. 前端将用户重定向到生成的 SSO 链接
4. OA 系统接收请求，验证签名并自动登录用户

### 场景2：从 OA 系统跳转到 OpsHub

1. OA 系统生成符合规范的 SSO 链接
2. 用户点击链接访问 `http://your-domain/api/sso/login?op=syn_login&auth=xxx&u=xxx`
3. OpsHub 验证签名并自动登录用户
4. 跳转到 OpsHub 首页

## 🛠️ 故障排查

### 问题1：auth 认证失败

**原因**：User-Agent 不匹配或密钥配置错误

**解决**：
- 确保生成链接和使用链接时的 User-Agent 一致
- 检查 SYS_KEY 和 SALT 配置是否正确

### 问题2：用户解码失败

**原因**：加密算法实现不正确或密钥错误

**解决**：
- 检查 SYS_KEY 配置
- 使用测试接口验证加密功能

### 问题3：没有查找到用户

**原因**：用户名在数据库中不存在

**解决**：
- 确保用户已在系统中创建
- 检查用户名拼写是否正确

## 📚 相关文件

- `backend/src/utils/ssoAuth.js` - SSO 加密工具
- `backend/src/routes/sso.js` - SSO API 路由
- `backend/src/app.js` - 路由挂载
- `syn_login.php` - OA 系统 SSO 登录文件（参考）

## 🎯 下一步

1. 根据实际需求调整密钥配置
2. 实现前端 SSO 跳转按钮
3. 配置生产环境的域名和 HTTPS
4. 完善错误处理和日志记录
