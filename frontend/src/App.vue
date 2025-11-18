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
  background: #f0f2f5;
}

.app-container {
  height: 100%;
}

.app-header {
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 0;
  height: 64px !important;
  line-height: 64px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 24px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.logo-icon-wrapper {
  width: 40px;
  height: 40px;
  background: #1890ff;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: all 0.3s;
}

.logo:hover .logo-icon-wrapper {
  background: #40a9ff;
}

.logo-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.title {
  font-size: 20px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
}

.subtitle {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  margin-top: 2px;
}

.header-menu {
  border-bottom: none;
  background: transparent;
}

.header-menu :deep(.el-menu-item) {
  margin: 0 4px;
  transition: all 0.3s;
  color: rgba(0, 0, 0, 0.65);
}

.header-menu :deep(.el-menu-item:hover) {
  color: #1890ff !important;
}

.header-menu :deep(.el-menu-item.is-active) {
  color: #1890ff !important;
  border-bottom: 2px solid #1890ff !important;
}

.app-main {
  padding: 24px;
  overflow-y: auto;
}

.app-main::-webkit-scrollbar {
  width: 6px;
}

.app-main::-webkit-scrollbar-track {
  background: transparent;
}

.app-main::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 3px;
}

.app-main::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.25);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>
