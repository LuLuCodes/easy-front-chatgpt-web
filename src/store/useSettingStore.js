import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useSettingStore = defineStore(
  'setting-store',
  () => {
    const modelName = ref('gpt-3.5-turbo')
    return { modelName }
  },
  {
    persist: true
  }
)
