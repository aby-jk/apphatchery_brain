export type SourceId = 'github' | 'zulip' | 'figma' | 'notion'

export interface Project {
  id: string
  name: string
  description: string
  color: string
  initial: string
}

export interface KBItem {
  id: string
  projectId: string
  source: SourceId
  type: string
  title: string
  body: string
  snippet: string
  author: string
  createdAt: string
  updatedAt: string
  url: string
  space: string
  parentId?: string
  relatedIds?: string[]
  topicIds?: string[]
}

export interface Topic {
  id: string
  projectId: string
  title: string
  description: string
  itemIds: string[]
}

export type ConnectorStatus = 'connected' | 'syncing' | 'error'

export interface SourceConnector {
  id: SourceId
  projectId: string
  name: string
  status: ConnectorStatus
  scope: string
  lastSync: string
  itemCount: number
  error?: string
}

export type ChatMode = 'ask' | 'search'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  mode: ChatMode
  text: string
  citationIds?: string[]
  searchResultIds?: string[]
  createdAt: string
}

export interface Conversation {
  id: string
  projectId: string
  title: string
  createdAt: string
  updatedAt: string
  messages: ChatMessage[]
}
