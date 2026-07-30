import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, MessageSquare, Trash2, ArrowRight, Sparkles, Search } from 'lucide-react'
import { generateAnswer } from '../lib/engine'
import { itemsForProject } from '../data/mockData'
import { loadConversations, saveConversations } from '../lib/chatStore'
import { uid } from '../lib/id'
import { ChatMessageBubble, NO_ANSWER_SENTINEL } from '../components/ChatMessageBubble'
import type { ChatMessage, Conversation } from '../types'

const SUGGESTIONS: Record<string, string[]> = {
  fabla: [
    'Why did we choose Stripe over Braintree?',
    "What's the status of the checkout redesign?",
    'Who decided to add Apple Pay support?',
    'What caused the cart 500 errors?',
    'What changed in the button design system?',
  ],
  typeu: [
    'What changed in the onboarding redesign?',
    'Why was account creation deferred?',
    'What was wrong with the WPM calculation?',
    'What caused the /api/sessions latency incident?',
  ],
}

export function AskPage() {
  const { projectId = '' } = useParams()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string>(() => uid())
  const [input, setInput] = useState('')
  const [historyQuery, setHistoryQuery] = useState('')

  const bottomRef = useRef<HTMLDivElement>(null)

  const projectItems = useMemo(() => itemsForProject(projectId), [projectId])
  const suggestions = SUGGESTIONS[projectId] ?? []

  // load this project's chat history when the project changes
  useEffect(() => {
    setConversations(loadConversations(projectId))
    setActiveId(uid())
  }, [projectId])

  const activeConversation = conversations.find((c) => c.id === activeId)
  const messages = activeConversation?.messages ?? []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length])

  const persist = (next: Conversation[]) => {
    setConversations(next)
    saveConversations(projectId, next)
  }

  const send = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || !projectId) return

    const now = new Date().toISOString()
    const userMsg: ChatMessage = { id: uid(), role: 'user', mode: 'ask', text: trimmed, createdAt: now }

    const answer = generateAnswer(trimmed, projectItems, projectId)
    const assistantMsg: ChatMessage = answer
      ? {
          id: uid(),
          role: 'assistant',
          mode: 'ask',
          text: answer.text,
          citationIds: answer.citationIds,
          createdAt: new Date().toISOString(),
        }
      : { id: uid(), role: 'assistant', mode: 'ask', text: NO_ANSWER_SENTINEL, createdAt: new Date().toISOString() }

    setConversations((prev) => {
      const existing = prev.find((c) => c.id === activeId)
      let next: Conversation[]
      if (existing) {
        const updated: Conversation = {
          ...existing,
          messages: [...existing.messages, userMsg, assistantMsg],
          updatedAt: assistantMsg.createdAt,
        }
        next = prev.map((c) => (c.id === existing.id ? updated : c))
      } else {
        const newConvo: Conversation = {
          id: activeId,
          projectId,
          title: trimmed.slice(0, 60),
          createdAt: now,
          updatedAt: assistantMsg.createdAt,
          messages: [userMsg, assistantMsg],
        }
        next = [newConvo, ...prev]
      }
      saveConversations(projectId, next)
      return next
    })
  }

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim()) return
    send(input)
    setInput('')
  }

  const newChat = () => {
    setActiveId(uid())
    setInput('')
  }

  const sortedConversations = [...conversations].sort(
    (a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt),
  )

  const filteredConversations = (() => {
    const q = historyQuery.trim().toLowerCase()
    if (!q) return sortedConversations
    return sortedConversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.messages.some((m) => m.text.toLowerCase().includes(q)),
    )
  })()

  const deleteConversation = (id: string) => {
    const next = conversations.filter((c) => c.id !== id)
    persist(next)
    if (id === activeId) newChat()
  }

  return (
    <div className="flex h-full">
      <div className="flex w-64 shrink-0 flex-col border-r border-slate-200">
        <div className="flex flex-col gap-2 p-3">
          <button
            onClick={newChat}
            className="flex w-full items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <Plus size={14} />
            New chat
          </button>
          <div className="relative">
            <Search
              size={13}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={historyQuery}
              onChange={(e) => setHistoryQuery(e.target.value)}
              placeholder="Search chat history…"
              className="w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 pl-7 pr-2 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-brand-orange focus:bg-white"
            />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
          {filteredConversations.length === 0 && (
            <p className="px-2.5 py-4 text-xs text-slate-400">
              {historyQuery ? 'No matching conversations.' : 'No conversations yet.'}
            </p>
          )}
          <div className="flex flex-col gap-0.5">
            {filteredConversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs transition ${
                  c.id === activeId ? 'bg-orange-50 font-medium text-brand-navy' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <MessageSquare size={13} className="shrink-0 opacity-50" />
                <span className="min-w-0 flex-1 truncate">{c.title}</span>
                <span
                  role="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteConversation(c.id)
                  }}
                  className="shrink-0 rounded p-0.5 text-transparent hover:text-red-400 group-hover:text-slate-400 hover:group-hover:text-red-400"
                >
                  <Trash2 size={12} />
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          {messages.length === 0 ? (
            <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center gap-6 text-center">
              <div className="flex items-center gap-1.5">
                <Sparkles size={16} className="text-brand-orange" />
                <h1 className="text-lg font-semibold">Ask your knowledge base</h1>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500 shadow-sm transition hover:border-brand-orange/60 hover:text-slate-800"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto flex max-w-3xl flex-col gap-5">
              {messages.map((m) => (
                <ChatMessageBubble key={m.id} message={m} />
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 px-6 py-4">
          <form onSubmit={submit} className="mx-auto max-w-3xl">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1.5">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder='Ask a question, e.g. "why did we pick Stripe?"'
                className="flex-1 bg-transparent px-2.5 text-sm outline-none placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="flex items-center gap-1 rounded-md bg-brand-navy px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-navy-dark disabled:opacity-40"
                disabled={!input.trim()}
              >
                Ask
                <ArrowRight size={13} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
