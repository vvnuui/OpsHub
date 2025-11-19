<template>
  <div class="audit-logs-container">
    <div class="page-header">
      <h1>审计日志</h1>
      <div class="header-actions">
        <el-select
          v-model="selectedUserId"
          placeholder="选择用户"
          clearable
          filterable
          style="width: 200px; margin-right: 12px;"
          @change="handleUserChange"
        >
          <el-option
            v-for="user in userList"
            :key="user.id"
            :label="user.username"
            :value="user.id"
          >
            <span>{{ user.username }}</span>
            <span style="float: right; color: #8492a6; font-size: 13px;">
              {{ getRoleLabel(user.role) }}
            </span>
          </el-option>
        </el-select>
        <el-button @click="loadLogs" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon login">
            <el-icon><User /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.loginCount }}</div>
            <div class="stat-label">登录次数</div>
          </div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon create">
            <el-icon><Plus /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.createCount }}</div>
            <div class="stat-label">创建操作</div>
          </div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon update">
            <el-icon><Edit /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.updateCount }}</div>
            <div class="stat-label">更新操作</div>
          </div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon delete">
            <el-icon><Delete /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.deleteCount }}</div>
            <div class="stat-label">删除操作</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 日志列表 -->
    <el-table
      :data="logList"
      v-loading="loading"
      class="log-table"
      stripe
    >
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="username" label="用户" width="150" />
      <el-table-column prop="action" label="操作" width="120">
        <template #default="{ row }">
          <el-tag :type="getActionType(row.action)">
            {{ getActionLabel(row.action) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="resource_type" label="资源类型" width="150" />
      <el-table-column prop="resource_id" label="资源ID" width="100" />
      <el-table-column prop="details" label="详情" min-width="300">
        <template #default="{ row }">
          <div v-if="row.details" class="details-text">
            {{ formatDetailsToText(row) }}
          </div>
          <span v-else style="color: #999;">无详细信息</span>
        </template>
      </el-table-column>
      <el-table-column prop="ip_address" label="IP地址" width="150" />
      <el-table-column prop="created_at" label="操作时间" width="180" />
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[20, 50, 100, 200]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Refresh, User, Plus, Edit, Delete } from '@element-plus/icons-vue';
import { useAuthStore } from '../stores/auth.js';
import { getUserList } from '../api/user.js';
import axios from 'axios';
import { getToken } from '../utils/auth.js';

const authStore = useAuthStore();

// 用户列表
const userList = ref([]);
const selectedUserId = ref(null);

// 日志列表
const logList = ref([]);
const loading = ref(false);

// 分页
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);

// 统计数据
const stats = computed(() => {
  const loginCount = logList.value.filter(log => log.action === 'login').length;
  const createCount = logList.value.filter(log => log.action === 'create').length;
  const updateCount = logList.value.filter(log => log.action === 'update').length;
  const deleteCount = logList.value.filter(log => log.action === 'delete').length;

  return {
    loginCount,
    createCount,
    updateCount,
    deleteCount
  };
});

// 角色标签
const getRoleLabel = (role) => {
  const labelMap = {
    'admin': '管理员',
    'auditor': '审计员',
    'user': '普通用户'
  };
  return labelMap[role] || role;
};

// 操作类型标签
const getActionType = (action) => {
  const typeMap = {
    'login': 'success',
    'logout': 'info',
    'create': 'primary',
    'update': 'warning',
    'delete': 'danger',
    'grant_access': 'success',
    'revoke_access': 'warning'
  };
  return typeMap[action] || '';
};

// 操作标签文本
const getActionLabel = (action) => {
  const labelMap = {
    'login': '登录',
    'logout': '登出',
    'create': '创建',
    'update': '更新',
    'delete': '删除',
    'grant_access': '授权',
    'revoke_access': '撤销授权',
    'access': '访问'
  };
  return labelMap[action] || action;
};

// 将详情转换为人类可读的文本
const formatDetailsToText = (log) => {
  if (!log.details) return '无详细信息';

  const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
  const action = log.action;
  const resourceType = log.resource_type;

  try {
    // 根据操作类型生成描述
    switch (action) {
      case 'login':
        if (details.method === 'password') {
          return '使用密码登录';
        } else if (details.method === 'oauth') {
          return `使用 ${details.provider} OAuth 登录`;
        }
        return '登录系统';

      case 'logout':
        return '退出登录';

      case 'create':
        if (resourceType === 'user') {
          return `创建用户 "${details.username}"，角色：${getRoleLabel(details.role)}`;
        } else if (resourceType === 'system') {
          return `创建系统 "${details.name || details.system_name || '未知'}"`;
        } else if (resourceType === 'oauth_provider') {
          return `创建 OAuth 提供商 "${details.name || details.provider_name || '未知'}"`;
        }
        return '创建资源';

      case 'update':
        if (resourceType === 'user') {
          const changes = [];
          if (details.username) changes.push(`用户名：${details.username}`);
          if (details.role) changes.push(`角色：${getRoleLabel(details.role)}`);
          if (details.status) changes.push(`状态：${details.status === 'active' ? '启用' : '禁用'}`);
          return changes.length > 0 ? `更新用户信息 (${changes.join('，')})` : '更新用户信息';
        } else if (resourceType === 'system') {
          return `更新系统配置`;
        } else if (resourceType === 'oauth_provider') {
          if (details.enabled !== undefined) {
            return details.enabled ? '启用 OAuth 提供商' : '禁用 OAuth 提供商';
          }
          return `更新 OAuth 提供商配置`;
        }
        return '更新资源';

      case 'delete':
        if (resourceType === 'user') {
          return `删除用户 (ID: ${log.resource_id})`;
        } else if (resourceType === 'system') {
          return `删除系统 (ID: ${log.resource_id})`;
        } else if (resourceType === 'oauth_provider') {
          return `删除 OAuth 提供商 (ID: ${log.resource_id})`;
        }
        return '删除资源';

      case 'grant_access':
        if (details.system_ids && Array.isArray(details.system_ids)) {
          return `授权访问 ${details.system_ids.length} 个系统`;
        }
        return '授权系统访问权限';

      case 'revoke_access':
        return `撤销系统访问权限 (系统 ID: ${details.system_id || log.resource_id})`;

      case 'access':
        if (resourceType === 'system') {
          return `访问系统 "${details.system_name || '未知系统'}"`;
        }
        return '访问资源';

      default:
        // 如果无法识别，显示原始JSON
        return Object.keys(details).map(key => `${key}: ${details[key]}`).join('，');
    }
  } catch (error) {
    console.error('格式化详情失败:', error);
    return '详情格式化失败';
  }
};

// 加载用户列表
const loadUserList = async () => {
  try {
    const response = await getUserList();
    if (response.code === 200) {
      userList.value = response.data;
    }
  } catch (error) {
    console.error('加载用户列表失败:', error);
  }
};

// 加载审计日志
const loadLogs = async () => {
  loading.value = true;

  try {
    let url = '/api/audit-logs';
    const params = {
      limit: pageSize.value,
      offset: (currentPage.value - 1) * pageSize.value
    };

    // 如果选择了特定用户，使用用户专属API
    if (selectedUserId.value) {
      url = `/api/users/${selectedUserId.value}/audit-logs`;
    }

    const response = await axios.get(url, {
      params,
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });

    if (response.data.code === 200) {
      logList.value = response.data.data;
      // SQLite没有返回总数，这里用返回的数据量估算
      total.value = response.data.data.length === pageSize.value
        ? (currentPage.value * pageSize.value) + 1
        : (currentPage.value - 1) * pageSize.value + response.data.data.length;
    }
  } catch (error) {
    console.error('加载审计日志失败:', error);
    ElMessage.error(error.response?.data?.message || '加载审计日志失败');
  } finally {
    loading.value = false;
  }
};

// 用户切换
const handleUserChange = () => {
  currentPage.value = 1;
  loadLogs();
};

// 分页大小改变
const handleSizeChange = () => {
  currentPage.value = 1;
  loadLogs();
};

// 页码改变
const handlePageChange = () => {
  loadLogs();
};

// 组件挂载时加载数据
onMounted(async () => {
  await loadUserList();
  loadLogs();
});
</script>

<style scoped>
.audit-logs-container {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
}

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
}

.stat-icon.login {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.create {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.update {
  background: linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%);
}

.stat-icon.delete {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
}

/* 日志表格 */
.log-table {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.details-text {
  font-size: 13px;
  color: #475569;
  line-height: 1.6;
}

.details-content {
  font-size: 12px;
  line-height: 1.6;
  margin: 0;
  max-height: 300px;
  overflow-y: auto;
}

/* 分页 */
.pagination-container {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
}
</style>
