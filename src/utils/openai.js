import { encode } from 'gpt-tokenizer'
import api from '@/api'

export const MessageStatus = {
  LOADING: 'LOADING',
  DONE: 'DONE',
  FAILED: 'FAILED'
}

export const MessageType = {
  General: 'General',
  Sql: 'Sql'
}

export const CreatorRole = {
  System: 'system',
  User: 'user',
  Assistant: 'assistant'
}

export const countTextTokens = (text) => {
  return encode(text).length
}

export const generalBot = {
  id: 'general-bot',
  name: 'General bot',
  description: 'A general prompt of Chat.',
  avatar: '',
  getPrompt: () => {
    const basicPrompt = `Please be careful to return only key information, and try not to make it too long.`
    return basicPrompt
  }
}

export const sqlBot = {
  id: 'sql-chat-bot',
  name: 'SQL Chat bot',
  description: 'The wonderful SQL Chat bot.',
  avatar: '',
  getPrompt: (schema) => {
    const generalPrompt = generalBot.getPrompt()
    const basicPrompt = `Please follow the instructions to answer the questions:
1. Set the language to the markdown code block for each code block. For example, \`SELECT * FROM table\` is SQL.`
    return `${generalPrompt}\nThis is my database schema"${schema}". You will see the tables and columns in the database. And please answer the following questions about the database.\n${basicPrompt}`
  }
}

export const sendMessagesToAzureAi = async (messages) => {
  const rawRes = await fetch(
    `${import.meta.env.VITE_APP_BASE_API}/api/azure-gpt/chat-message-by-stream`,
    {
      method: 'POST',
      body: JSON.stringify({
        messages
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )

  const data = rawRes.body
  if (!data) {
    throw new Error('no data')
  }

  return data
}

export const sendMessagesToOpenAi = async (messages) => {
  const rawRes = await fetch(
    `${import.meta.env.VITE_APP_BASE_API}/api/chat-gpt/chat-message-by-stream`,
    {
      method: 'POST',
      body: JSON.stringify({
        messages
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )

  const data = rawRes.body
  if (!data) {
    throw new Error('no data')
  }

  return data
}

export const sendMessagesToDrawer = async (params) => {
  return await api.post({
    data: params,
    url: '/api/drawer/create-image',
    timeout: 600000
  })
}
