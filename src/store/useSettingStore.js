import { ref, reactive } from 'vue'
import { defineStore } from 'pinia'

export const useSettingStore = defineStore(
  'setting-store',
  () => {
    const modelName = ref('gpt-3.5-turbo')
    const modelList = reactive([
      ({
        value: 'gpt-3.5-turbo',
        label: 'gpt-3.5-turbo'
      },
      {
        value: 'gpt-4',
        label: 'gpt-4'
      })
    ])
    return { modelName, modelList }
  },
  {
    persist: true
  }
)
