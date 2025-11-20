import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import Home from '../views/Home.vue'
import SystemManage from '../views/SystemManage.vue'
import UserManage from '../views/UserManage.vue'
import AuditLogs from '../views/AuditLogs.vue'
import Login from '../views/Login.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      title: '登录',
      requiresAuth: false
    }
  },
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: {
      title: '系统导航',
      requiresAuth: true
    }
  },
  {
    path: '/manage',
    name: 'SystemManage',
    component: SystemManage,
    meta: {
      title: '系统管理',
      requiresAuth: true,
      roles: ['admin'] // 只有管理员可以访问
    }
  },
  {
    path: '/users',
    name: 'UserManage',
    component: UserManage,
    meta: {
      title: '用户管理',
      requiresAuth: true,
      roles: ['admin'] // 只有管理员可以访问
    }
  },
  {
    path: '/audit-logs',
    name: 'AuditLogs',
    component: AuditLogs,
    meta: {
      title: '审计日志',
      requiresAuth: true,
      roles: ['admin', 'auditor'] // 管理员和审计员可以访问
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title || '运维统一门户'

  // 检查路由是否需要认证
  const requiresAuth = to.meta.requiresAuth !== false // 默认需要认证

  if (requiresAuth) {
    const authStore = useAuthStore()

    // 检查是否已登录
    if (!authStore.isLoggedIn) {
      // 尝试从本地存储恢复登录状态
      const restored = authStore.checkAuth()

      if (!restored) {
        // 未登录，重定向到登录页
        next({
          path: '/login',
          query: { redirect: to.fullPath } // 保存目标路径，登录后可以跳转回来
        })
        return
      }
    }

    // 检查角色权限
    if (to.meta.roles && to.meta.roles.length > 0) {
      const userRole = authStore.userRole

      if (!to.meta.roles.includes(userRole)) {
        // 权限不足，返回首页或显示403页面
        next({ path: '/' })
        return
      }
    }
  }

  // 如果已登录且访问登录页，重定向到首页
  if (to.path === '/login') {
    const authStore = useAuthStore()
    if (authStore.isLoggedIn) {
      next({ path: '/' })
      return
    }
  }

  next()
})

export default router
