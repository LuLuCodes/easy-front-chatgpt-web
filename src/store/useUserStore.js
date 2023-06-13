import { ref, reactive } from 'vue'
import { defineStore } from 'pinia'
import router from '@/router/index'
import UaParser from 'ua-parser-js'
import api from '@/api'
import { ElMessage } from 'element-plus'

export const useUserStore = defineStore(
  'user-store',
  () => {
    const userInfo = reactive({})
    const userToken = ref('')
    const userUa = new UaParser().getResult()

    const login = async (params) => {
      try {
        const { account, password } = params
        const loginRes = await api.post({
          data: {
            account,
            password
          },
          url: '/api/user/login'
        })
        // save token
        if (loginRes) {
          const { userId, username, realname, avatar, token } = loginRes
          userToken.value = token
          userInfo.value = { userId, username, realname, avatar }
          ElMessage({
            message: '登录成功.',
            type: 'success'
          })
          await router.replace('/chat')
        }
      } catch (error) {
        ElMessage({
          message: error.message,
          type: 'error'
        })
      }
    }

    const logout = async () => {
      if (userToken.value) {
        try {
          await api.post({
            data: {},
            url: '/api/user/logout'
          })
        } catch (error) {
          throw new Error(error.message)
        }
      }
      userToken.value = ''
      userInfo.value = {}
      await router.replace('/login')
    }

    const getSession = async () => {
      try {
        const sessionRes = await api.post({
          data: {},
          url: '/api/user/get-session'
        })

        console.log(sessionRes)
        if (sessionRes) {
          const { userId, username, realname, avatar, token } = sessionRes
          userToken.value = token
          userInfo.value = { userId, username, realname, avatar }
        } else {
          userToken.value = ''
          userInfo.value = {}
        }
      } catch (error) {
        ElMessage({
          message: error.message,
          type: 'error'
        })
      }
    }
    return {
      userInfo,
      userToken,
      userUa,
      login,
      logout,
      getSession
    }
  },
  {
    persist: {
      paths: ['userToken', 'userUa'],
      afterRestore: (ctx) => {
        const storageCache = window.localStorage.getItem('user-info')
        if (storageCache) {
          ctx.store.userInfo = JSON.parse(storageCache)
        }
      }
    }
  }
)
