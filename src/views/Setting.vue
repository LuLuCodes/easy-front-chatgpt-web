<template>
  <section class="page flex all-s">
    <div class="chat-nav-wrap p24">
      <div class="chat-nav-scroll">
        <el-scrollbar>
          <div class="flex all-t pt6">
            <span class="f0"><img src="@/assets/images/common/logo.png" width="45" alt="" /></span>
            <h1 class="f22 flex-1 ml4"><b>设置</b></h1>
          </div>
          <div class="pt24">
            <div class="chat-list-wrap">
              <div class="flex all-t" @click="router.go(-1)">
                <span class="icon icon-shangyiye"></span>
                <span class="flex-1 ml10">返回首页</span>
              </div>
              <div class="flex all-t on">
                <span class="icon icon-shezhi"></span>
                <span class="flex-1 ml10">通用设置</span>
              </div>
            </div>
          </div>
        </el-scrollbar>
      </div>
    </div>
    <div class="pt20 pb20 pr20 flex-1">
      <div class="chat-body">
        <div class="flex all-c h50p pl24 pr24 bd-b1 space-b">
          <h4 class="f18">通用设置</h4>
        </div>
        <div class="setting-content pt30 pb30">
          <el-scrollbar>
            <el-form class="" label-position="left" label-width="300px">
              <el-form-item label="语言模型">
                <el-select placeholder="" v-model="modelName">
                  <el-option
                    v-for="item in modelList"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="清除所有数据">
                <el-popconfirm
                  width="250"
                  confirm-button-text="确认"
                  cancel-button-text="取消"
                  :icon="InfoFilled"
                  icon-color="#626AEF"
                  title="是否确认清除数据？"
                  @confirm="handleConfirmClear"
                >
                  <template #reference>
                    <el-button type="danger" class="w100p">清除</el-button>
                  </template>
                </el-popconfirm>
              </el-form-item>
            </el-form>
          </el-scrollbar>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
// import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useSettingStore } from '@/store'

const router = useRouter()

const settingStore = useSettingStore()
const { modelName } = storeToRefs(settingStore)

const modelList = [
  {
    value: 'gpt-3.5-turbo',
    label: 'gpt-3.5-turbo'
  },
  {
    value: 'gpt-4',
    label: 'gpt-4'
  }
]

const handleConfirmClear = () => {
  window.localStorage.clear()
  ElMessage({
    message: 'Data cleared. The page will be reloaded.',
    type: 'success'
  })
  setTimeout(() => {
    window.location.reload()
  }, 500)
}
</script>
<style lang="scss" scoped>
.chat-nav-wrap {
  width: 260px;
  box-sizing: border-box;
}
.chat-nav-wrap h2 {
  max-height: 62px;
  overflow: hidden;
}
.chat-nav-scroll {
  height: calc(100vh - 108px);
  overflow: hidden;
}
.chat-list-wrap > div {
  padding: 10px 16px;
  border-radius: 4px;
  margin-bottom: 6px;
  cursor: pointer;
}
.chat-list-wrap > div .icon-more {
  visibility: hidden;
}
.chat-list-wrap > div:hover .icon-more {
  visibility: visible;
}
.setting-content {
  height: calc(100vh - 90px);
  max-width: 830px;
  margin: 0 auto;
  overflow: hidden;
  box-sizing: border-box;
}
.setting-content :deep(.el-form-item__content) {
  justify-content: flex-end;
}
</style>
