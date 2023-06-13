<template>
  <section class="page flex all-s">
    <LeftSideNav></LeftSideNav>
    <div class="chat-nav-wrap p24">
      <div class="chat-nav-scroll">
        <el-scrollbar>
          <div class="flex all-t pt6">
            <h2 class="f22 flex-1 txt-elips2l"><b>MySQL</b></h2>
            <span
              class="icon icon-add f18 mt6 ml20 pointer"
              @click.prevent.stop="handlerEditConnection(true)"
            ></span>
            <span
              class="icon icon-bianji f18 mt6 ml20 pointer"
              @click.prevent.stop="handlerEditConnection(false)"
            ></span>
          </div>
          <div class="pt24">
            <h3 class="f12 c-secondary pb10">选择数据库</h3>
            <el-select
              class="w100"
              placeholder="Select"
              :model-value="curConnectionId"
              @change="handlerConnectionChange"
            >
              <el-option
                v-for="connection in connectionList"
                :key="connection.id"
                :label="connection.database"
                :value="connection.id"
              />
            </el-select>
          </div>
          <div class="pt24">
            <h3 class="f12 c-secondary pb10">选择数据表</h3>
            <el-select
              class="w100"
              placeholder="请选择库表"
              v-loading="tableLoading"
              loading-text="加载中..."
              multiple
              collapse-tags
              collapse-tags-tooltip
              v-model="selectedTableList"
            >
              <el-option
                v-for="item in dbTables"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>
          <div class="pt24">
            <h3 class="f12 c-secondary pb10">对话</h3>
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
          @click.prevent.stop="handlerCreateConversation"
          type="primary"
          class="w100 border-radius-8 new-chat-btn"
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

    <!-- 修改数据库连接属性弹窗    -->
    <ConnectionEditDialog
      v-model="showConnectionEditDialog"
      :editConnectionId="editConnectionId"
    ></ConnectionEditDialog>

    <!-- 右侧弹出执行窗口 -->
    <SqlExecDrawer v-model="showExecSqlDrawer" :execSqlContent="execSqlContent"></SqlExecDrawer>
  </section>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import {
  generateUUID,
  CreatorRole,
  countTextTokens,
  sqlBot,
  MessageStatus,
  sendMessagesToAzureAi,
  safetyParseJson
} from '@/utils'

import LeftSideNav from '@/components/LeftSideNav.vue'
import ConnectionEditDialog from '@/components/ConnectionEditDialog.vue'
import Message from '@/components/Message.vue'
import SqlExecDrawer from '@/components/SqlExecDrawer.vue'

import { storeToRefs } from 'pinia'
import { useConnectionStore, useSqlConversationStore, useSqlMessageStore } from '@/store'
import { useCopyCode } from '@/hooks/useCopyCode'
import { useExecCode } from '@/hooks/useExecCode'

const MAX_TOKENS = 4000

const showConnectionEditDialog = ref(false)
const showExecSqlDrawer = ref(false)

const dbTables = reactive([])

const inputPrompt = ref('')
const inputPromptRef = ref(null)
const promptSending = ref(false)

const messageScrollbarRef = ref(null)
const editConnectionId = ref('')

const tableLoading = ref(false)
const selectedTableList = ref([])

const execSqlContent = ref('')

const connectionStore = useConnectionStore()
const { setCurConnectionById, updateTableName, getTableStructureBatch } = connectionStore
const { curConnectionId, connectionList } = storeToRefs(connectionStore)

const conversationStore = useSqlConversationStore()
const { createConversation, setCurConversationById, delConversationById, updateConversation } =
  conversationStore
const { conversationList, curConversationId, curConversation } = storeToRefs(conversationStore)

const messageStore = useSqlMessageStore()
const { addMessage, updateMessage, delMessageByConversationId } = messageStore
const { messageList } = storeToRefs(messageStore)

const conversationMessageList = computed(() => {
  return messageList.value.filter((message) => message.conversationId === curConversationId.value)
})

const handlerExecSql = async ({ sql }) => {
  execSqlContent.value = sql
  showExecSqlDrawer.value = true
}

useCopyCode()
useExecCode(handlerExecSql)
onMounted(() => {
  scrollToMessageListBottom()
})

watch(
  curConnectionId,
  async (newValue) => {
    dbTables.splice(0, dbTables.length)
    if (newValue) {
      tableLoading.value = true
      const tables = await updateTableName(newValue)

      dbTables.push(
        ...tables.map((table) => {
          return {
            value: table.table_name,
            label: table.table_name
          }
        })
      )

      tableLoading.value = false
    }
  },
  { immediate: true }
)

const scrollToMessageListBottom = () => {
  const scrollbar_view = messageScrollbarRef.value.$el.querySelector('.el-scrollbar__view')
  if (scrollbar_view.scrollHeight > 800) {
    messageScrollbarRef.value.setScrollTop(scrollbar_view.scrollHeight)
  }
}

const handlerEditConnection = (isNew) => {
  if (isNew) {
    editConnectionId.value = ''
    showConnectionEditDialog.value = true
  } else {
    if (curConnectionId.value) {
      editConnectionId.value = curConnectionId.value
      showConnectionEditDialog.value = true
    } else {
      ElMessage({
        message: '请选择一个数据库.',
        type: 'warning'
      })
    }
  }
}

const handlerCreateConversation = () => {
  if (!curConnectionId.value) {
    ElMessage({
      message: '请选择一个数据库.',
      type: 'warning'
    })
    return
  }
  createConversation('New Conversation')
}

const handlerConnectionChange = (value) => {
  setCurConnectionById(value)
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

  if (!curConnectionId.value) {
    ElMessage({
      message: '请选择一个数据库.',
      type: 'warning'
    })
    return
  }
  inputPromptRef.value.blur()
  promptSending.value = true

  if (selectedTableList.value.length === 0) {
    ElMessage({
      message: '在库表较多情况下，未选择指定库表，可能导致响应内容不精确.',
      type: 'warning'
    })
  }

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

  const tableNameList = []
  let systemPrompt = sqlBot.getPrompt()
  if (selectedTableList.value.length === 0) {
    tableNameList.push(...dbTables.map((table) => table.value))
  } else {
    tableNameList.push(...selectedTableList.value)
  }
  if (tableNameList.length) {
    const tableSchemaList = await getTableStructureBatch({
      connectionId: curConnectionId.value,
      tableNameList
    })
    let schema = ''
    if (tableSchemaList && tableSchemaList.length) {
      for (const table of tableSchemaList) {
        if (tokens < MAX_TOKENS / 2) {
          tokens += countTextTokens(schema + table)
          schema += table.structure
        }
      }
      systemPrompt = sqlBot.getPrompt(schema)
    }
  }

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
    const responseData = await sendMessagesToAzureAi(formatedMessageList)

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
  height: calc(100vh - 182px);
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
