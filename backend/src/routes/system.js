import express from 'express';
import { systemsDB } from '../db/database.js';
import { triggerHealthCheck } from '../services/healthCheck.js';

const router = express.Router();

// 获取所有系统
router.get('/systems', (req, res) => {
  try {
    const systems = systemsDB.getAll();
    res.json({
      code: 200,
      message: 'success',
      data: systems
    });
  } catch (error) {
    console.error('获取系统列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取系统列表失败',
      error: error.message
    });
  }
});

// 根据ID获取系统
router.get('/systems/:id', (req, res) => {
  try {
    const { id } = req.params;
    const system = systemsDB.getById(id);

    if (!system) {
      return res.status(404).json({
        code: 404,
        message: '系统不存在'
      });
    }

    res.json({
      code: 200,
      message: 'success',
      data: system
    });
  } catch (error) {
    console.error('获取系统详情失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取系统详情失败',
      error: error.message
    });
  }
});

// 创建新系统
router.post('/systems', (req, res) => {
  try {
    const { name, url, icon, description, order_num, status } = req.body;

    if (!name || !url) {
      return res.status(400).json({
        code: 400,
        message: '系统名称和URL不能为空'
      });
    }

    const id = systemsDB.create({ name, url, icon, description, order_num, status });

    res.json({
      code: 200,
      message: '创建成功',
      data: { id }
    });
  } catch (error) {
    console.error('创建系统失败:', error);
    res.status(500).json({
      code: 500,
      message: '创建系统失败',
      error: error.message
    });
  }
});

// 更新系统
router.put('/systems/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, url, icon, description, order_num, status } = req.body;

    if (!name || !url) {
      return res.status(400).json({
        code: 400,
        message: '系统名称和URL不能为空'
      });
    }

    const changes = systemsDB.update(id, { name, url, icon, description, order_num, status });

    if (changes === 0) {
      return res.status(404).json({
        code: 404,
        message: '系统不存在'
      });
    }

    res.json({
      code: 200,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新系统失败:', error);
    res.status(500).json({
      code: 500,
      message: '更新系统失败',
      error: error.message
    });
  }
});

// 删除系统
router.delete('/systems/:id', (req, res) => {
  try {
    const { id } = req.params;
    const changes = systemsDB.delete(id);

    if (changes === 0) {
      return res.status(404).json({
        code: 404,
        message: '系统不存在'
      });
    }

    res.json({
      code: 200,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除系统失败:', error);
    res.status(500).json({
      code: 500,
      message: '删除系统失败',
      error: error.message
    });
  }
});

// 手动触发健康检查
router.post('/systems/health-check', async (req, res) => {
  try {
    console.log('🔄 收到手动健康检查请求');
    const results = await triggerHealthCheck();

    res.json({
      code: 200,
      message: '健康检查完成',
      data: results
    });
  } catch (error) {
    console.error('健康检查失败:', error);
    res.status(500).json({
      code: 500,
      message: '健康检查失败',
      error: error.message
    });
  }
});

export default router;
