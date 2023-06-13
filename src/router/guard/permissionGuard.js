import { useUserStore } from '@/store'
import NProgress from 'nprogress'

import 'nprogress/nprogress.css'

export function createPermissionGuard(router) {
  const userStore = useUserStore()
  router.beforeEach(async (to, from, next) => {
    NProgress.start()
    await userStore.getSession()
    const token = userStore.userToken
    console.log('token', token)
    console.log('to.path', to.path)
    if (token && to.path === '/login') {
      next('/chat')
      return
    }

    // token does not exist
    if (!token) {
      if (!to.meta.requiresAuth) {
        next()
        return
      }

      // redirect login page
      const redirectData = {
        path: '/login',
        replace: true
      }
      if (to.path) {
        redirectData.query = {
          ...redirectData.query,
          redirect: to.path
        }
      }
      next(redirectData)
      return
    }

    const redirectPath = from.query.redirect ?? ''
    const redirect = redirectPath ?? decodeURIComponent(redirectPath)
    if (redirect && redirect !== to.path) {
      next(redirect)
      return
    }
    next()
  })

  router.afterEach(() => {
    // 进度条
    NProgress.done()
  })
}
