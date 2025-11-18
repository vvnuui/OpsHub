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
#app {
  height: 100vh;
  background: #f8fafc;
}

.app-container {
  height: 100%;
}

.app-header {
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  padding: 0;
  height: 64px !important;
  line-height: 64px;
  border-bottom: 1px solid #e2e8f0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 32px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.logo:hover {
  opacity: 0.8;
}

.logo-icon-wrapper {
  width: 40px;
  height: 40px;
  background: #3b82f6;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: background 0.2s ease;
}

.logo:hover .logo-icon-wrapper {
  background: #2563eb;
}

.logo-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.title {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  letter-spacing: -0.3px;
}

.subtitle {
  font-size: 12px;
  color: #64748b;
  font-weight: 400;
  margin-top: 2px;
}

.header-menu {
  border-bottom: none;
  background: transparent;
}

.header-menu :deep(.el-menu-item) {
  border-radius: 6px;
  margin: 0 4px;
  transition: all 0.2s ease;
  color: #64748b;
}

.header-menu :deep(.el-menu-item:hover) {
  background: #f1f5f9 !important;
  color: #1e293b !important;
}

.header-menu :deep(.el-menu-item.is-active) {
  background: #3b82f6 !important;
  color: white !important;
  border-bottom: none !important;
}

.app-main {
  padding: 24px;
  overflow-y: auto;
  background: #f8fafc;
}

.app-main::-webkit-scrollbar {
  width: 6px;
}

.app-main::-webkit-scrollbar-track {
  background: transparent;
}

.app-main::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.app-main::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>
