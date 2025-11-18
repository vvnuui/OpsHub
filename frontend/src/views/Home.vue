<template>
  <div class="home-container">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <el-icon class="title-icon"><Grid /></el-icon>
          系统导航
        </h1>
        <p class="page-subtitle">点击卡片快速访问各个系统</p>
      </div>
      <el-button type="primary" @click="refreshSystems" :loading="loading">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </div>

    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="3" animated />
    </div>

    <div v-else-if="systems.length === 0" class="empty-container">
      <el-empty description="暂无系统数据">
        <el-button type="primary" @click="$router.push('/manage')">
          去添加系统
        </el-button>
      </el-empty>
    </div>

    <div v-else class="systems-grid">
      <SystemCard
        v-for="system in systems"
        :key="system.id"
        :system="system"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Grid, Refresh } from '@element-plus/icons-vue'
import SystemCard from '../components/SystemCard.vue'
import { systemAPI } from '../api/system'

const systems = ref([])
const loading = ref(false)
let refreshTimer = null

const fetchSystems = async (silent = false) => {
  if (!silent) {
    loading.value = true
  }
  try {
    const response = await systemAPI.getAll()
    if (response.code === 200) {
      systems.value = response.data
    }
  } catch (error) {
    console.error('获取系统列表失败:', error)
    if (!silent) {
      ElMessage.error('获取系统列表失败，请检查后端服务是否启动')
    }
  } finally {
    if (!silent) {
      loading.value = false
    }
  }
}

const refreshSystems = async () => {
  await fetchSystems()
  ElMessage.success('刷新成功')
}

// 启动自动刷新（每30秒刷新一次）
const startAutoRefresh = () => {
  refreshTimer = setInterval(() => {
    fetchSystems(true) // 静默刷新，不显示loading
  }, 30000)
}

// 停止自动刷新
const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

onMounted(() => {
  fetchSystems()
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.home-container {
  max-width: 1400px;
  margin: 0 auto;
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding: 28px 32px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.header-content {
  flex: 1;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 12px;
  letter-spacing: -0.5px;
}

.title-icon {
  font-size: 36px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-subtitle {
  font-size: 15px;
  color: #64748b;
  margin: 0;
  font-weight: 500;
}

.page-header :deep(.el-button) {
  height: 42px;
  padding: 0 24px;
  border-radius: 12px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
}

.page-header :deep(.el-button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.loading-container {
  padding: 60px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.12);
}

.empty-container {
  padding: 80px 20px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.12);
}

.systems-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 28px;
  animation: slideUp 0.6s ease-out 0.2s both;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .systems-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
    padding: 24px;
  }

  .page-title {
    font-size: 26px;
  }
}
</style>
