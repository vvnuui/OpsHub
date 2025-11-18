import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './db/database.js';
import systemRouter from './routes/system.js';
import { startHealthCheck } from './services/healthCheck.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 初始化数据库
initDatabase();

// 启动健康检查服务
startHealthCheck();

// 中间件
app.use(cors()); // 允许跨域
app.use(express.json()); // 解析JSON请求体
app.use(express.urlencoded({ extended: true })); // 解析URL编码的请求体

// 日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// API路由
app.use('/api', systemRouter);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 静态文件服务（提供前端构建产物）
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath));

// SPA路由支持 - 所有非API请求都返回index.html
app.get('*', (req, res) => {
  // 如果请求的是API路径，返回404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      code: 404,
      message: 'API路径不存在'
    });
  }

  // 其他所有请求返回前端index.html（支持前端路由）
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    code: 500,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 运维SSO后端服务启动成功！`);
  console.log(`📡 服务地址: http://localhost:${PORT}`);
  console.log(`📋 API文档: http://localhost:${PORT}/api/systems`);
});
