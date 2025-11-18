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
  transition: all 0.3s ease;
  height: 100%;
}

.system-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 10px;
  position: relative;
}

.icon-wrapper {
  margin-bottom: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #e6f4ff 0%, #bae0ff 100%);
  border-radius: 12px;
}

.system-icon {
  color: #1890ff;
}

.system-info {
  text-align: center;
  width: 100%;
}

.system-name {
  font-size: 18px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.health-indicator {
  font-size: 12px;
  line-height: 1;
}

.health-indicator.health-online {
  color: #52c41a;
  animation: pulse 2s ease-in-out infinite;
}

.health-indicator.health-offline {
  color: #ff4d4f;
}

.health-indicator.health-unknown {
  color: #d9d9d9;
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
  color: #8c8c8c;
  line-height: 1.5;
  margin: 0 0 8px 0;
  min-height: 42px;
}

.health-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
}

.health-text {
  font-weight: 500;
}

.health-text.health-online {
  color: #52c41a;
}

.health-text.health-offline {
  color: #ff4d4f;
}

.health-text.health-unknown {
  color: #8c8c8c;
}

.response-time {
  color: #8c8c8c;
}

.icon-wrapper.health-online {
  background: linear-gradient(135deg, #d9f7be 0%, #b7eb8f 100%);
}

.icon-wrapper.health-online .system-icon {
  color: #52c41a;
}

.icon-wrapper.health-offline {
  background: linear-gradient(135deg, #ffccc7 0%, #ffa39e 100%);
}

.icon-wrapper.health-offline .system-icon {
  color: #ff4d4f;
}

.icon-wrapper.health-unknown {
  background: linear-gradient(135deg, #e6f4ff 0%, #bae0ff 100%);
}

.icon-wrapper.health-unknown .system-icon {
  color: #1890ff;
}

.status-badge {
  position: absolute;
  top: 10px;
  right: 10px;
}
</style>
