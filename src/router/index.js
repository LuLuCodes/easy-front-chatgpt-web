import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: { name: 'chat' }
  },
  {
    path: '/mysql',
    name: 'mysql',
    meta: { requiresAuth: true },
    component: () => import('@/views/MySql.vue')
  },
  {
    path: '/setting',
    name: 'setting',
    meta: { requiresAuth: true },
    component: () => import('@/views/Setting.vue')
  },
  {
    path: '/chat',
    name: 'chat',
    meta: { requiresAuth: true },
    component: () => import('@/views/Chat.vue')
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/drawer',
    name: 'drawer',
    component: () => import('@/views/Drawer.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})
export default router
