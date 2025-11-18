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
  transition: all 0.3s;
  height: 100%;
  background: #ffffff;
  border-radius: 2px;
  border: 1px solid #f0f0f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09);
  overflow: hidden;
  position: relative;
}

.system-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  position: relative;
}

.icon-wrapper {
  margin-bottom: 16px;
  padding: 20px;
  background: #e6f7ff;
  border-radius: 4px;
  transition: all 0.3s;
}

.system-card:hover .icon-wrapper {
  background: #bae7ff;
}

.system-icon {
  color: #1890ff;
}

.system-info {
  text-align: center;
  width: 100%;
}

.system-name {
  font-size: 16px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
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
  color: #52c41a;
  animation: pulse 2s ease-in-out infinite;
}

.health-indicator.health-offline {
  color: #f5222d;
}

.health-indicator.health-unknown {
  color: rgba(0, 0, 0, 0.25);
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
  color: rgba(0, 0, 0, 0.45);
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
  padding: 4px 12px;
  background: #fafafa;
  border-radius: 2px;
}

.health-text {
  font-weight: normal;
}

.health-text.health-online {
  color: #52c41a;
}

.health-text.health-offline {
  color: #f5222d;
}

.health-text.health-unknown {
  color: rgba(0, 0, 0, 0.45);
}

.response-time {
  color: rgba(0, 0, 0, 0.45);
}

.icon-wrapper.health-online {
  background: #f6ffed;
}

.system-card:hover .icon-wrapper.health-online {
  background: #d9f7be;
}

.icon-wrapper.health-online .system-icon {
  color: #52c41a;
}

.icon-wrapper.health-offline {
  background: #fff1f0;
}

.system-card:hover .icon-wrapper.health-offline {
  background: #ffccc7;
}

.icon-wrapper.health-offline .system-icon {
  color: #f5222d;
}

.icon-wrapper.health-unknown {
  background: #e6f7ff;
}

.system-card:hover .icon-wrapper.health-unknown {
  background: #bae7ff;
}

.icon-wrapper.health-unknown .system-icon {
  color: #1890ff;
}

.status-badge {
  position: absolute;
  top: 12px;
  right: 12px;
}

.status-badge :deep(.el-tag) {
  border-radius: 2px;
  font-size: 12px;
}
</style>
