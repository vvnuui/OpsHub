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
  margin-bottom: 32px;
  padding: 28px 32px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(226, 232, 240, 0.6);
}

.header-content {
  flex: 1;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 6px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  letter-spacing: -0.02em;
}

.title-icon {
  font-size: 28px;
  color: #b224ef;
}

.page-subtitle {
  font-size: 15px;
  color: #475569;
  margin: 0;
  line-height: 1.5;
}

.page-header :deep(.el-button) {
  height: 40px;
  padding: 0 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  background: linear-gradient(135deg, #b224ef 0%, #7579ff 100%);
  border: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px rgba(178, 36, 239, 0.3);
}

.page-header :deep(.el-button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(178, 36, 239, 0.4);
}

.page-header :deep(.el-button:active) {
  transform: translateY(0);
}

.loading-container {
  padding: 80px 40px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(226, 232, 240, 0.6);
}

.empty-container {
  padding: 100px 40px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(226, 232, 240, 0.6);
  text-align: center;
}

.systems-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

@media (max-width: 1024px) {
  .systems-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .systems-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
    padding: 24px;
  }

  .page-title {
    font-size: 22px;
  }
}
</style>
