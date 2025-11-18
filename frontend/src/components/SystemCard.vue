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
  transition: all 0.2s ease;
  height: 100%;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  position: relative;
}

.system-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: #cbd5e1;
}

.card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 20px;
  position: relative;
}

.icon-wrapper {
  margin-bottom: 16px;
  padding: 18px;
  background: #3b82f6;
  border-radius: 10px;
  transition: background 0.2s ease;
}

.system-card:hover .icon-wrapper {
  background: #2563eb;
}

.system-icon {
  color: white;
  transition: transform 0.2s ease;
}

.system-card:hover .system-icon {
  transform: scale(1.05);
}

.system-info {
  text-align: center;
  width: 100%;
}

.system-name {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.health-indicator {
  font-size: 8px;
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
  color: #94a3b8;
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
  color: #64748b;
  line-height: 1.5;
  margin: 0 0 12px 0;
  min-height: 42px;
}

.health-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 12px;
  padding: 6px 12px;
  background: #f8fafc;
  border-radius: 6px;
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
  color: #64748b;
}

.response-time {
  color: #94a3b8;
  font-weight: 500;
}

.icon-wrapper.health-online {
  background: #10b981;
}

.system-card:hover .icon-wrapper.health-online {
  background: #059669;
}

.icon-wrapper.health-offline {
  background: #ef4444;
}

.system-card:hover .icon-wrapper.health-offline {
  background: #dc2626;
}

.icon-wrapper.health-unknown {
  background: #3b82f6;
}

.system-card:hover .icon-wrapper.health-unknown {
  background: #2563eb;
}

.status-badge {
  position: absolute;
  top: 12px;
  right: 12px;
}

.status-badge :deep(.el-tag) {
  border-radius: 4px;
  font-weight: 500;
  padding: 2px 8px;
  font-size: 12px;
}
</style>
