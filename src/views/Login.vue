<template>
  <section class="page login flex-col">
    <div class="login-header flex all-c space-b pl36 pr36">
      <p class="f0">
        <!-- <img v-show="!isDark" src="@/assets/images/common/myun.png" width="280" alt="">
            <img v-show="isDark" src="@/assets/images/common/myun-dark.png" width="280" alt=""> -->
      </p>
      <div class="switch-light pointer" @click="toggleTheme()">
        <p class="flex all-c" v-show="!isDark">
          <span class="icon txt-c icon-day-fill f18"></span> <span class="ml6">亮色</span>
        </p>
        <p class="flex all-c" v-show="isDark">
          <span class="icon txt-c icon-night-fill f18"></span> <span class="ml6">暗色</span>
        </p>
      </div>
    </div>
    <div class="flex-1 flex all-c pb60">
      <div class="login-content mb30 flex all-s">
        <div class="pt40">
          <p class="login-logo"><img src="@/assets/images/common/logo1.png" width="73" alt="" /></p>
          <h2 class="f22"><b>Code GPT</b></h2>
          <div class="pt50">
            <div class="flex all-t mb34">
              <span class="icon icon-ie-ChatGPT f24 c-secondary"></span>
              <div class="flex-1 ml12">
                <h3 class="f16"><b>工作助手</b></h3>
                <p>工作遇到麻烦？来问一问吧</p>
              </div>
            </div>
            <div class="flex all-t mb34">
              <span class="icon icon-image1 f24 c-secondary"></span>
              <div class="flex-1 ml12">
                <h3 class="f16"><b>AI绘画</b></h3>
                <p>一键生成你的设计内容</p>
              </div>
            </div>
            <div class="flex all-t mb34">
              <span class="icon icon-SQLServer f24 c-secondary"></span>
              <div class="flex-1 ml12">
                <h3 class="f16"><b>数据库代码问题</b></h3>
                <p>个性化辅助服务，提高编程效率</p>
              </div>
            </div>
          </div>
        </div>
        <div class="flex-1 login-box">
          <h2 class="f24 txt-c pb44"><b>账号登录</b></h2>
          <el-form
            v-loading="loginLoading"
            element-loading-text="登录中..."
            :model="loginForm"
            ref="loginFormRef"
            :rules="loginFormRules"
            label-width="120px"
            size="large"
            label-position="top"
          >
            <el-form-item label="用户名" prop="account">
              <el-input v-model="loginForm.account" placeholder="请输入手机或邮箱" clearable />
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="请输入登录密码"
                show-password
                clearable
              />
            </el-form-item>
            <el-form-item>
              <el-checkbox label="30天内免登录" name="type" />
            </el-form-item>
            <el-button
              type="primary"
              size="large"
              class="w100 border-radius-8 mb30 new-chat-btn"
              @click.prevent.stop="handlerLogin(loginFormRef)"
              >登录</el-button
            >
            <div class="txt-c">
              <span class="pointer">忘记密码</span> <el-divider direction="vertical" />
              <span class="pointer">注册新账号</span>
            </div>
          </el-form>
        </div>
      </div>
    </div>
    <!-- <p class="login-footer pb22 pt22 txt-c f12">
      嘉兴麦云信息科技有限公司版权所有 ©{{ currentYear }}
    </p> -->
  </section>
</template>

<script setup>
import { ref, reactive } from 'vue'

import { useToggle } from '@vueuse/shared'
import { useDark } from '@vueuse/core'
import { useUserStore } from '@/store'

const userStore = useUserStore()
const { login } = userStore

const loginForm = ref({
  account: '',
  password: ''
})

const loginFormRef = ref(null)

const loginFormRules = reactive({
  account: [
    {
      required: true,
      message: '请填写登录账号',
      trigger: 'blur'
    }
  ],
  password: [
    {
      required: true,
      message: '请填写登录密码',
      trigger: 'blur'
    }
  ]
})

const loginLoading = ref(false)

const isDark = useDark({
  // 存储到localStorage/sessionStorage中的Key 根据自己的需求更改
  storageKey: 'useDarkKey',
  // 暗黑class名字
  valueDark: 'dark',
  // 高亮class名字
  valueLight: 'light'
})

const toggleTheme = useToggle(isDark)

const handlerLogin = async (formEl) => {
  if (!formEl) {
    return
  }
  await formEl.validate(async (valid) => {
    if (valid) {
      loginLoading.value = true
      await login({ ...loginForm.value })
      loginLoading.value = false
    }
  })
}
</script>
<style lang="scss" scoped>
.login-header {
  height: 70px;
}
.login-footer {
  opacity: 0.5;
}
.login-content {
  width: 900px;
  background: url('../assets/images/common/bg-login.png') no-repeat bottom center;
  background-size: auto 312px;
  min-height: 312px;
}
.dark .login-content {
  background: url('../assets/images/common/bg-login-dark.png') no-repeat bottom center;
  background-size: auto 312px;
}
.login-content .pt40 {
  padding-right: 246px;
}
.login-content .pt20 .icon-SQLServer {
  font-size: 26px !important;
}
.login-logo {
  position: relative;
  left: -6px;
  bottom: -10px;
}

.page.login .new-chat-btn {
  height: 42px;
  line-height: 42px;
  font-size: 16px;
  font-weight: bold;
}
</style>
