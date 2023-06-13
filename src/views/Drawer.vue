<template>
  <section class="page flex all-s">
    <LeftSideNav></LeftSideNav>
    <div class="chat-nav-wrap p24">
      <div class="chat-nav-scroll">
        <el-scrollbar>
          <div class="flex all-t pt6">
            <h2 class="f22 flex-1 txt-elips2l"><b>Drawer</b></h2>
          </div>
          <div class="pt24">
            <div class="chat-list-wrap">
              <div
                class="flex all-t"
                v-for="conversation in conversationList"
                :key="conversation.id"
                :class="{ on: conversation.id === curConversationId }"
                @click.prevent.stop="setCurConversationById(conversation.id)"
              >
                <span
                  class="icon"
                  :class="{
                    'icon-chat-on': conversation.id === curConversationId,
                    'icon-pinglun': conversation.id !== curConversationId
                  }"
                ></span>
                <span class="flex-1 ml10">{{ conversation.title.substring(0, 30) }}</span>
                <el-dropdown>
                  <span class="icon icon-more pointer mt4"> </span>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item
                        ><span class="icon icon-bianji"></span>
                        <span class="pl6">编辑</span></el-dropdown-item
                      >
                      <el-dropdown-item
                        @click.prevent.stop="handlerDelConversation(conversation.id)"
                        ><span class="icon icon-shanchu"></span>
                        <span class="pl6">删除</span></el-dropdown-item
                      >
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
          </div>
        </el-scrollbar>
      </div>
      <div class="pt24">
        <el-button
          type="primary"
          class="w100 border-radius-8 new-chat-btn"
          @click.prevent.stop="handlerCreateConversation"
          >新对话</el-button
        >
      </div>
    </div>
    <div class="pt20 pb20 pr20 flex-1">
      <div class="chat-body">
        <div class="flex all-c h50p pl24 pr24 bd-b1 space-b">
          <h4 class="f18">{{ curConversation && curConversation.title }}</h4>
          <span class="icon icon-shezhi f18 pointer" @click="this.$router.push('/setting')"></span>
        </div>
        <div class="chat-content pt30 pb30">
          <el-scrollbar ref="messageScrollbarRef">
            <template v-for="message in conversationMessageList" :key="message.id">
              <Message
                :message="message"
                :conversation="curConversation"
                @actionImage="handlerActionImage"
              ></Message>
            </template>
          </el-scrollbar>
        </div>
        <div class="chat-input-wrap mb30 flex all-c">
          <el-input
            v-model="inputPrompt"
            ref="inputPromptRef"
            class="flex-1"
            type="textarea"
            placeholder="请输入你的问题..."
            clearable
            :readonly="promptSending"
            @keyup.enter="handlerSubmit"
          />
          <el-popover :visible="drawerPopupVisible" trigger="click" placement="top" :width="520">
            <div class="pl10 pr10">
              <h3 class="f14"><b>设置</b></h3>
              <h4 class="f14 mt20 mb10">模型</h4>
              <div>
                <el-check-tag checked class="mr10 txt-c">通用</el-check-tag>
                <el-check-tag class="mr10 txt-c">二次元</el-check-tag>
              </div>
              <h4 class="f14 mt30 mb10">图片比例</h4>
              <div>
                <el-check-tag
                  :checked="drawerOptions.aspect === option.value"
                  class="mr10 txt-c"
                  v-for="option in aspectOptions"
                  :key="option.value"
                  @click.prevent.stop="drawerOptions.aspect = option.value"
                >
                  <p>{{ option.value }}</p>
                  <p class="f12 mt6">{{ option.label }}</p>
                </el-check-tag>
              </div>
              <h4 class="f14 mt30 mb10">离谱程度</h4>
              <div class="pl10 pr10">
                <el-slider
                  v-model="drawerOptions.chaos"
                  :min="0"
                  :max="100"
                  :step="10"
                  show-stops
                  :marks="chaosMarks"
                />
              </div>
              <h4 class="f14 mt30 mb10">艺术性</h4>
              <div class="pl10 pr10">
                <el-slider
                  v-model="drawerOptions.stylize"
                  :min="0"
                  :max="1000"
                  :step="10"
                  show-stops
                  :marks="stylizeMarks"
                />
              </div>
              <div class="mt40 mb10">
                <el-button type="primary" class="w100">确认</el-button>
              </div>
            </div>
            <template #reference>
              <span
                @click="drawerPopupVisible = true"
                class="icon icon-shezhi f18 ml10 mr10 pointer"
              ></span>
            </template>
          </el-popover>
          <el-tooltip class="box-item" effect="dark" content="重新生成" placement="top">
            <span class="icon icon-shuaxin f18 ml10 mr10 pointer"></span>
          </el-tooltip>
          <el-tooltip class="box-item" effect="dark" content="清除输入" placement="top">
            <span
              class="icon icon-qingchu f18 ml10 mr10 pointer"
              @click.prevent.stop="inputPrompt = ''"
            ></span>
          </el-tooltip>
          <span
            class="icon icon-back pointer f20 ml10 mr6"
            @click.prevent.stop="handlerSubmit"
          ></span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

import { generateUUID, CreatorRole, MessageStatus, sendMessagesToDrawer } from '@/utils'
import LeftSideNav from '@/components/LeftSideNav.vue'
import Message from '@/components/Message.vue'
import { storeToRefs } from 'pinia'
import { useDrawerConversationStore, useDrawerMessageStore } from '@/store'

const drawerPopupVisible = ref(false)

const chaosMarks = reactive({
  0: '0',
  20: '20',
  40: '20',
  60: '20',
  80: '20',
  100: '100'
})

const stylizeMarks = reactive({
  0: '0',
  100: '100',
  200: '200',
  300: '300',
  400: '400',
  500: '500',
  600: '600',
  700: '700',
  800: '800',
  900: '900',
  1000: '1000'
})

const aspectOptions = [
  { label: '默认', value: '1:1' },
  { label: '电脑壁纸', value: '16:9' },
  { label: '手机壁纸', value: '9:16' },
  { label: '长手机壁纸', value: '9:18' }
]

const drawerOptions = reactive({
  version: 5,
  aspect: '1:1',
  chaos: 0,
  stylize: 100,
  quality: 1
})

const inputPrompt = ref('')
const inputPromptRef = ref(null)
const promptSending = ref(false)

const messageScrollbarRef = ref(null)

const conversationStore = useDrawerConversationStore()
const { createConversation, setCurConversationById, delConversationById, updateConversation } =
  conversationStore
const { conversationList, curConversationId, curConversation } = storeToRefs(conversationStore)

const messageStore = useDrawerMessageStore()
const { addMessage, updateMessage, delMessageByConversationId } = messageStore
const { messageList } = storeToRefs(messageStore)

const conversationMessageList = computed(() => {
  return messageList.value.filter((message) => message.conversationId === curConversationId.value)
})

onMounted(() => {
  scrollToMessageListBottom()
})

const scrollToMessageListBottom = () => {
  const scrollbar_view = messageScrollbarRef.value.$el.querySelector('.el-scrollbar__view')
  if (scrollbar_view.scrollHeight > 800) {
    messageScrollbarRef.value.setScrollTop(scrollbar_view.scrollHeight)
  }
}

const handlerCreateConversation = () => {
  createConversation('New Conversation')
}

const handlerDelConversation = (conversationId) => {
  delConversationById(conversationId)
  delMessageByConversationId(conversationId)
}

const handlerActionImage = async ({ imageId, action }) => {
  const assistantMessage = {
    id: generateUUID(),
    conversationId: curConversationId,
    creatorRole: CreatorRole.Assistant,
    createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    content: '图片生成中，请耐心等待...',
    imageData: {
      task_id: '',
      image_id: '',
      image_url: '',
      actions: []
    },
    status: 'LOADING',
    isWrong: false
  }
  addMessage(assistantMessage)
  nextTick(() => {
    scrollToMessageListBottom()
  })

  try {
    const responseData = await sendMessagesToDrawer({
      action: action,
      image_id: imageId
    })
    console.log(responseData)
    updateMessage(assistantMessage.id, {
      status: 'DONE',
      content: `${imageId} ${action}`,
      imageData: responseData
    })
  } catch (error) {
    updateMessage(assistantMessage.id, {
      content: error.message,
      status: 'DONE',
      isWrong: true
    })
  } finally {
    promptSending.value = false
    nextTick(() => {
      scrollToMessageListBottom()
    })
  }
}

const handlerSubmit = async () => {
  if (!inputPrompt.value) {
    ElMessage({
      message: '请输入你的问题.',
      type: 'warning'
    })
    return
  }
  inputPromptRef.value.blur()
  promptSending.value = true
  let curConversationId = ''
  if (!curConversation.value) {
    curConversationId = createConversation(inputPrompt.value)
  } else {
    curConversationId = curConversation.value.id
    updateConversation(curConversation.value.id, { title: inputPrompt.value })
  }

  const userMessage = {
    id: generateUUID(),
    conversationId: curConversationId,
    creatorRole: CreatorRole.User,
    createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    content: inputPrompt.value,
    status: MessageStatus.DONE
  }

  addMessage(userMessage)

  inputPrompt.value = ''
  const assistantMessage = {
    id: generateUUID(),
    conversationId: curConversationId,
    creatorRole: CreatorRole.Assistant,
    createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    content: '图片生成中，请耐心等待...',
    imageData: {
      task_id: '',
      image_id: '',
      image_url: '',
      actions: []
    },
    status: 'LOADING',
    isWrong: false
  }
  addMessage(assistantMessage)
  nextTick(() => {
    scrollToMessageListBottom()
  })

  try {
    const responseData = await sendMessagesToDrawer({
      action: 'generate',
      prompt: userMessage.content,
      ...drawerOptions
    })
    console.log(responseData)
    updateMessage(assistantMessage.id, {
      status: 'DONE',
      content: userMessage.content,
      imageData: responseData
    })
  } catch (error) {
    updateMessage(assistantMessage.id, {
      content: error.message,
      status: 'DONE',
      isWrong: true
    })
  } finally {
    promptSending.value = false
    nextTick(() => {
      scrollToMessageListBottom()
    })
  }
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
.chat-content {
  height: calc(100vh - 170px);
  max-width: 76%;
  margin: 0 auto;
  overflow: hidden;
  box-sizing: border-box;
}

.chat-input-wrap :deep(.el-input__wrapper) {
  background: transparent;
  border: 0;
  box-shadow: none;
}
.chat-input-wrap :deep(.el-input__inner) {
  background: transparent;
  border: 0;
}
.chat-input-wrap .icon-back {
  width: 40px;
  height: 40px;
  color: #fff;
  line-height: 40px;
  text-align: center;
  background: linear-gradient(180deg, #a337fc 0%, #5e15f0 100%);
  border-radius: 8px;
}
:deep(.el-check-tag) {
  font-weight: normal;
  min-width: 80px;
}
:deep(.el-slider__marks-text) {
  font-size: 12px;
}
</style>