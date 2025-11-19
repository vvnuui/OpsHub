<template>
  <div id="app">
    <el-container class="app-container">
      <!-- 顶部导航栏（仅登录后显示） -->
      <el-header v-if="authStore.isLoggedIn" class="app-header">
        <div class="header-content">
          <div class="logo" @click="handleLogoClick">
            <div class="logo-icon-wrapper">
              <el-icon :size="32"><Platform /></el-icon>
            </div>
            <div class="logo-text">
              <span class="title">OpsHub</span>
              <span class="subtitle">运维统一门户</span>
            </div>
          </div>

          <div class="header-right">
            <!-- 导航菜单 -->
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
              <el-menu-item v-if="authStore.isAdmin" index="/manage">
                <el-icon><Setting /></el-icon>
                <span>系统管理</span>
              </el-menu-item>
              <el-menu-item v-if="authStore.isAdmin" index="/users">
                <el-icon><User /></el-icon>
                <span>用户管理</span>
              </el-menu-item>
              <el-menu-item v-if="authStore.isAdmin || authStore.isAuditor" index="/audit-logs">
                <el-icon><Document /></el-icon>
                <span>审计日志</span>
              </el-menu-item>
              <el-menu-item v-if="authStore.isAdmin" index="/oauth-config">
                <el-icon><Key /></el-icon>
                <span>OAuth配置</span>
              </el-menu-item>
            </el-menu>

            <!-- 用户菜单 -->
            <el-dropdown @command="handleUserCommand" class="user-dropdown">
              <div class="user-info">
                <el-avatar :size="36" class="user-avatar">
                  {{ userInitial }}
                </el-avatar>
                <div class="user-details">
                  <span class="username">{{ authStore.user?.username }}</span>
                  <span class="user-role">{{ roleLabel }}</span>
                </div>
                <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="logout">
                    <el-icon><SwitchButton /></el-icon>
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </el-header>

      <!-- 主内容区域 -->
      <el-main class="app-main" :class="{ 'no-header': !authStore.isLoggedIn }">
        <router-view />
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from './stores/auth.js'
import {
  Platform,
  HomeFilled,
  Setting,
  User,
  SwitchButton,
  ArrowDown,
  Document,
  Key
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const activeMenu = ref(route.path)

watch(() => route.path, (newPath) => {
  activeMenu.value = newPath
})

// 用户名首字母（用于头像显示）
const userInitial = computed(() => {
  const username = authStore.user?.username || ''
  return username.charAt(0).toUpperCase()
})

// 角色标签
const roleLabel = computed(() => {
  const roleMap = {
    'admin': '管理员',
    'auditor': '审计员',
    'user': '普通用户'
  }
  return roleMap[authStore.user?.role] || '用户'
})

// Logo点击事件
const handleLogoClick = () => {
  router.push('/')
}

// 菜单选择事件
const handleMenuSelect = (index) => {
  router.push(index)
}

// 用户菜单命令处理
const handleUserCommand = async (command) => {
  if (command === 'logout') {
    // 登出确认
    try {
      await ElMessageBox.confirm(
        '确定要退出登录吗？',
        '退出登录',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      // 执行登出
      await authStore.logout()
      ElMessage.success('已退出登录')

      // 跳转到登录页
      router.push('/login')
    } catch (error) {
      // 用户取消登出
      if (error !== 'cancel') {
        console.error('登出失败:', error)
        ElMessage.error('登出失败')
      }
    }
  }
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

.header-right {
  display: flex;
  align-items: center;
  gap: 24px;
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

.app-main.no-header {
  padding: 0;
}

/* 用户下拉菜单 */
.user-dropdown {
  cursor: pointer;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 12px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.user-info:hover {
  background: #f3e8ff;
}

.user-avatar {
  background: linear-gradient(135deg, #b224ef 0%, #7579ff 100%);
  color: white;
  font-weight: 600;
}

.user-details {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.username {
  font-size: 14px;
  font-weight: 500;
  color: #0f172a;
}

.user-role {
  font-size: 12px;
  color: #64748b;
}

.dropdown-icon {
  color: #94a3b8;
  transition: transform 0.2s;
}

.user-info:hover .dropdown-icon {
  transform: translateY(2px);
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
