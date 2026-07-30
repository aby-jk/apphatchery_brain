import type { Conversation } from '../types'

const storageKey = (projectId: string) => `kb.chats.${projectId}`

export function loadConversations(projectId: string): Conversation[] {
  try {
    const raw = localStorage.getItem(storageKey(projectId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveConversations(projectId: string, conversations: Conversation[]) {
  try {
    localStorage.setItem(storageKey(projectId), JSON.stringify(conversations))
  } catch {
    // storage unavailable (private browsing, quota) — history just won't persist
  }
}
