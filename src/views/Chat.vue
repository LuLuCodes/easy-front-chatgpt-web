<template>
  <section class="page flex all-s">
    <LeftSideNav></LeftSideNav>
    <div class="chat-nav-wrap p24">
      <div class="chat-nav-scroll">
        <el-scrollbar>
          <div class="flex all-t pt6">
            <h2 class="f22 flex-1 txt-elips2l"><b>Chat</b></h2>
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
              <Message :message="message" :conversation="curConversation"></Message>
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
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

import {
  generateUUID,
  CreatorRole,
  countTextTokens,
  generalBot,
  MessageStatus,
  sendMessagesToOpenAi,
  safetyParseJson
} from '@/utils'
import LeftSideNav from '@/components/LeftSideNav.vue'
import Message from '@/components/Message.vue'
import { storeToRefs } from 'pinia'
import { useGeneralConversationStore, useGeneralMessageStore } from '@/store'
import { useCopyCode } from '@/hooks/useCopyCode'

const MAX_TOKENS = 4000

const inputPrompt = ref('')
const inputPromptRef = ref(null)
const promptSending = ref(false)

const messageScrollbarRef = ref(null)

const conversationStore = useGeneralConversationStore()
const { createConversation, setCurConversationById, delConversationById, updateConversation } =
  conversationStore
const { conversationList, curConversationId, curConversation } = storeToRefs(conversationStore)

const messageStore = useGeneralMessageStore()
const { addMessage, updateMessage, delMessageByConversationId } = messageStore
const { messageList } = storeToRefs(messageStore)

const conversationMessageList = computed(() => {
  return messageList.value.filter((message) => message.conversationId === curConversationId.value)
})

useCopyCode()
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

  let tokens = countTextTokens(inputPrompt.value)

  // let usageMessageList = []
  const formatedMessageList = []
  for (let i = conversationMessageList.value.length - 1; i >= 0; i--) {
    const message = conversationMessageList.value[i]
    if (message.status === MessageStatus.DONE && message.content && !message.isWrong) {
      if (tokens < MAX_TOKENS) {
        tokens += countTextTokens(message.content)
        formatedMessageList.unshift({
          role: message.creatorRole,
          content: message.content
        })
      }
    }
  }
  addMessage(userMessage)
  const systemPrompt = generalBot.getPrompt()

  // Add the db prompt as the first context.
  formatedMessageList.unshift({
    role: CreatorRole.System,
    content: systemPrompt
  })
  // Add the user prompt as the last context.
  formatedMessageList.push({
    role: CreatorRole.User,
    content: inputPrompt.value
  })
  inputPrompt.value = ''
  const assistantMessage = {
    id: generateUUID(),
    conversationId: curConversationId,
    creatorRole: CreatorRole.Assistant,
    createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    content: '',
    status: 'LOADING',
    isWrong: false
  }
  addMessage(assistantMessage)
  nextTick(() => {
    scrollToMessageListBottom()
  })

  try {
    const responseData = await sendMessagesToOpenAi(formatedMessageList)

    const reader = responseData.getReader()
    const decoder = new TextDecoder('utf-8')
    let done = false
    let reader_content = ''
    let message = ''
    let parsed = null
    while (!done) {
      const { value, done: readerDone } = await reader.read()
      if (value) {
        const data = decoder.decode(value)
        const lines = data
          .toString()
          .split('\n')
          .filter((line) => line.trim() !== '')

        for (const line of lines) {
          message += line.replace(/^data: /, '')
          if (message === '[DONE]') {
            break
          }
          parsed = safetyParseJson(message)
          if (parsed) {
            const { delta, finish_reason } = parsed.choices[0]
            if (finish_reason === 'stop') {
              break
            }
            const { content } = delta
            if (content) {
              reader_content = reader_content + content
              updateMessage(assistantMessage.id, {
                content: reader_content
              })
            }
            parsed = null
            message = ''
          }
          nextTick(() => {
            scrollToMessageListBottom()
          })
        }
      }
      done = readerDone
    }
    updateMessage(assistantMessage.id, {
      status: 'DONE'
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
</style>
