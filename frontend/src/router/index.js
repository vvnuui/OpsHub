import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import SystemManage from '../views/SystemManage.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { title: '系统导航' }
  },
  {
    path: '/manage',
    name: 'SystemManage',
    component: SystemManage,
    meta: { title: '系统管理' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title || '运维统一门户'
  next()
})

export default router
