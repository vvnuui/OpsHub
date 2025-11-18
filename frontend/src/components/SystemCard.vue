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
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  height: 100%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  overflow: hidden;
  position: relative;
}

.system-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.system-card:hover::before {
  opacity: 1;
}

.system-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 60px rgba(102, 126, 234, 0.25);
  border-color: rgba(102, 126, 234, 0.3);
}

.card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 24px;
  position: relative;
  z-index: 1;
}

.icon-wrapper {
  margin-bottom: 20px;
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.icon-wrapper::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.system-card:hover .icon-wrapper::before {
  opacity: 1;
}

.system-card:hover .icon-wrapper {
  transform: rotateY(10deg) rotateX(5deg);
  box-shadow: 0 12px 32px rgba(102, 126, 234, 0.4);
}

.system-icon {
  color: white;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
  transition: transform 0.4s ease;
}

.system-card:hover .system-icon {
  transform: scale(1.1) rotate(5deg);
}

.system-info {
  text-align: center;
  width: 100%;
}

.system-name {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  letter-spacing: -0.3px;
}

.health-indicator {
  font-size: 10px;
  line-height: 1;
}

.health-indicator.health-online {
  color: #10b981;
  animation: pulse 2s ease-in-out infinite;
  filter: drop-shadow(0 0 4px rgba(16, 185, 129, 0.5));
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
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.2);
  }
}

.system-desc {
  font-size: 14px;
  color: #64748b;
  line-height: 1.6;
  margin: 0 0 16px 0;
  min-height: 44px;
  font-weight: 500;
}

.health-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 13px;
  padding: 10px 16px;
  background: rgba(248, 250, 252, 0.8);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.health-text {
  font-weight: 600;
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
  font-weight: 600;
}

.icon-wrapper.health-online {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.35);
}

.icon-wrapper.health-offline {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  box-shadow: 0 8px 24px rgba(239, 68, 68, 0.35);
}

.icon-wrapper.health-unknown {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
}

.status-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 2;
}

.status-badge :deep(.el-tag) {
  border-radius: 8px;
  font-weight: 600;
  padding: 4px 12px;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
