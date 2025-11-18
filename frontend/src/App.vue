<template>
  <div id="app">
    <el-container class="app-container">
      <el-header class="app-header">
        <div class="header-content">
          <div class="logo">
            <div class="logo-icon-wrapper">
              <el-icon :size="32"><Platform /></el-icon>
            </div>
            <div class="logo-text">
              <span class="title">OpsHub</span>
              <span class="subtitle">运维统一门户</span>
            </div>
          </div>
          <el-menu
            :default-active="activeMenu"
            mode="horizontal"
            @select="handleMenuSelect"
            class="header-menu"
          >
            <el-menu-item index="/">
              <el-icon><HomeFilled /></el-icon>
              <span>系统导航</span>
            </el-menu-item>
            <el-menu-item index="/manage">
              <el-icon><Setting /></el-icon>
              <span>系统管理</span>
            </el-menu-item>
          </el-menu>
        </div>
      </el-header>
      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Platform, HomeFilled, Setting } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const activeMenu = ref(route.path)

watch(() => route.path, (newPath) => {
  activeMenu.value = newPath
})

const handleMenuSelect = (index) => {
  router.push(index)
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  height: 100vh;
  background: linear-gradient(180deg, #faf5ff 0%, #f0e7ff 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
}

.app-container {
  height: 100%;
}

.app-header {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1);
  padding: 0;
  height: 72px !important;
  line-height: 72px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 32px;
  max-width: 1400px;
  margin: 0 auto;
}

.logo {
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.logo:hover {
  transform: translateY(-1px);
}

.logo-icon-wrapper {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #b224ef 0%, #7579ff 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 6px rgba(178, 36, 239, 0.3);
}

.logo:hover .logo-icon-wrapper {
  box-shadow: 0 6px 12px rgba(178, 36, 239, 0.4);
  transform: scale(1.05);
}

.logo-text {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.title {
  font-size: 20px;
  font-weight: 600;
  color: #0f172a;
  letter-spacing: -0.02em;
}

.subtitle {
  font-size: 13px;
  color: #475569;
  margin-top: 2px;
  font-weight: 400;
}

.header-menu {
  border-bottom: none;
  background: transparent;
}

.header-menu :deep(.el-menu-item) {
  margin: 0 6px;
  padding: 0 16px;
  border-radius: 8px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  color: #475569;
  font-weight: 500;
  font-size: 15px;
}

.header-menu :deep(.el-menu-item:hover) {
  color: #b224ef !important;
  background: #f3e8ff !important;
}

.header-menu :deep(.el-menu-item.is-active) {
  color: #b224ef !important;
  background: #f3e8ff !important;
  border-bottom: none !important;
}

.app-main {
  padding: 32px;
  overflow-y: auto;
}

.app-main::-webkit-scrollbar {
  width: 8px;
}

.app-main::-webkit-scrollbar-track {
  background: transparent;
}

.app-main::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
  border: 2px solid transparent;
  background-clip: padding-box;
}

.app-main::-webkit-scrollbar-thumb:hover {
  background: #a1a1aa;
}
</style>
