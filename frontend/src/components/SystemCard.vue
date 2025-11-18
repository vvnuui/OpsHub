<template>
  <el-card class="system-card" shadow="hover" @click="handleClick">
    <div class="card-content">
      <div class="icon-wrapper" :class="'health-' + system.health_status">
        <el-icon :size="48" class="system-icon">
          <component :is="iconComponent" />
        </el-icon>
      </div>
      <div class="system-info">
        <h3 class="system-name">
          {{ system.name }}
          <span class="health-indicator" :class="'health-' + system.health_status">
            ●
          </span>
        </h3>
        <p class="system-desc">{{ system.description }}</p>
        <div class="health-info">
          <span class="health-text" :class="'health-' + system.health_status">
            {{ healthStatusText }}
          </span>
          <span v-if="system.response_time" class="response-time">
            {{ system.response_time }}ms
          </span>
        </div>
      </div>
      <div class="status-badge">
        <el-tag :type="system.status === 'active' ? 'success' : 'info'" size="small">
          {{ system.status === 'active' ? '启用' : '停用' }}
        </el-tag>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { computed } from 'vue'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  system: {
    type: Object,
    required: true
  }
})

const iconComponent = computed(() => {
  return ElementPlusIconsVue[props.system.icon] || ElementPlusIconsVue.Monitor
})

const healthStatusText = computed(() => {
  const statusMap = {
    'online': '在线',
    'offline': '离线',
    'unknown': '未知'
  }
  return statusMap[props.system.health_status] || '未知'
})

const handleClick = () => {
  if (props.system.status !== 'active') {
    ElMessage.warning('该系统已停用')
    return
  }

  if (props.system.health_status === 'offline') {
    ElMessage.warning('该系统当前离线')
    return
  }

  // 直接使用原始URL跳转
  // 注意：浏览器可能会自动将HTTP升级为HTTPS（HSTS策略）
  window.open(props.system.url, '_blank', 'noopener,noreferrer')
}
</script>

<style scoped>
.system-card {
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  height: 100%;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid rgba(226, 232, 240, 0.6);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  position: relative;
}

.system-card:hover {
  transform: translateY(-4px);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.08);
  border-color: rgba(203, 213, 225, 0.8);
}

.card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28px 24px 24px;
  position: relative;
}

.icon-wrapper {
  margin-bottom: 20px;
  padding: 22px;
  background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px rgba(178, 36, 239, 0.15);
}

.system-card:hover .icon-wrapper {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(178, 36, 239, 0.25);
}

.system-icon {
  color: #b224ef;
}

.system-info {
  text-align: center;
  width: 100%;
}

.system-name {
  font-size: 17px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  letter-spacing: -0.01em;
}

.health-indicator {
  font-size: 9px;
  line-height: 1;
}

.health-indicator.health-online {
  color: #10b981;
  animation: pulse 2s ease-in-out infinite;
}

.health-indicator.health-offline {
  color: #ef4444;
}

.health-indicator.health-unknown {
  color: #a1a1aa;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.system-desc {
  font-size: 14px;
  color: #475569;
  line-height: 1.6;
  margin: 0 0 16px 0;
  min-height: 44px;
}

.health-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 13px;
  padding: 6px 14px;
  background: #fafafa;
  border-radius: 8px;
  transition: background 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.system-card:hover .health-info {
  background: #f1f5f9;
}

.health-text {
  font-weight: 500;
}

.health-text.health-online {
  color: #10b981;
}

.health-text.health-offline {
  color: #ef4444;
}

.health-text.health-unknown {
  color: #475569;
}

.response-time {
  color: #a1a1aa;
  font-weight: 400;
}

.icon-wrapper.health-online {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.1);
}

.system-card:hover .icon-wrapper.health-online {
  box-shadow: 0 4px 8px rgba(16, 185, 129, 0.15);
}

.icon-wrapper.health-online .system-icon {
  color: #10b981;
}

.icon-wrapper.health-offline {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  box-shadow: 0 2px 4px rgba(239, 68, 68, 0.1);
}

.system-card:hover .icon-wrapper.health-offline {
  box-shadow: 0 4px 8px rgba(239, 68, 68, 0.15);
}

.icon-wrapper.health-offline .system-icon {
  color: #ef4444;
}

.icon-wrapper.health-unknown {
  background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
  box-shadow: 0 2px 4px rgba(178, 36, 239, 0.15);
}

.system-card:hover .icon-wrapper.health-unknown {
  box-shadow: 0 4px 8px rgba(178, 36, 239, 0.25);
}

.icon-wrapper.health-unknown .system-icon {
  color: #b224ef;
}

.status-badge {
  position: absolute;
  top: 14px;
  right: 14px;
}

.status-badge :deep(.el-tag) {
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  padding: 3px 10px;
}
</style>
