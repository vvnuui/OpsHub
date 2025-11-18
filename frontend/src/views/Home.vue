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
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px 24px;
  background: #ffffff;
  border-radius: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09);
}

.header-content {
  flex: 1;
}

.page-title {
  font-size: 20px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
  margin: 0 0 4px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  font-size: 24px;
  color: #1890ff;
}

.page-subtitle {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
  margin: 0;
}

.page-header :deep(.el-button) {
  height: 32px;
  padding: 0 15px;
  border-radius: 2px;
  font-size: 14px;
  background: #1890ff;
  border: none;
  transition: all 0.3s;
}

.page-header :deep(.el-button:hover) {
  background: #40a9ff;
}

.loading-container {
  padding: 60px;
  background: #ffffff;
  border-radius: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09);
}

.empty-container {
  padding: 80px 20px;
  background: #ffffff;
  border-radius: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09);
}

.systems-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

@media (max-width: 768px) {
  .systems-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    padding: 16px;
  }
}
</style>
