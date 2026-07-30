import { useEffect, useMemo, useRef, useState } from 'react'
import { useOutletContext, useParams } from 'react-router-dom'
import { Sparkles, Code2, Palette, Layers } from 'lucide-react'
import { Button } from '@astryxdesign/core/Button'
import { Icon } from '@astryxdesign/core/Icon'
import { Heading } from '@astryxdesign/core/Heading'
import { HStack } from '@astryxdesign/core/Layout'
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl'
import { DropdownMenu } from '@astryxdesign/core/DropdownMenu'
import { MultiSelector } from '@astryxdesign/core/MultiSelector'
import { ChatComposer, ChatComposerInput } from '@astryxdesign/core/Chat'
import { generateAnswer, noAnswerThinking } from '../lib/engine'
import { itemsForProject, getProject } from '../data/mockData'
import { uid } from '../lib/id'
import { ChatMessageBubble, NO_ANSWER_SENTINEL } from '../components/ChatMessageBubble'
import { ShaderBackground } from '../components/ShaderBackground'
import { SOURCE_META } from '../components/SourceBadge'
import type { ChatHistoryContext } from '../components/Layout'
import type { ChatMessage, Conversation, Persona, SourceId } from '../types'

const MODEL_GROUPS = [
  { title: 'Claude', models: ['Claude Opus 5', 'Claude Sonnet 5', 'Claude Haiku 4.5'] },
  { title: 'ChatGPT', models: ['GPT-5', 'GPT-5 mini', 'GPT-4o'] },
]
const DEFAULT_MODEL = 'Claude Sonnet 5'

const SOURCES: SourceId[] = ['github', 'zulip', 'figma', 'notion']
const SOURCE_OPTIONS = SOURCES.map((s) => ({
  value: s,
  label: SOURCE_META[s].label,
  icon: SOURCE_META[s].icon,
}))

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
  const { conversations, activeId, persist, persona, setPersona } = useOutletContext<ChatHistoryContext>()
  const [input, setInput] = useState('')
  const [model, setModel] = useState(DEFAULT_MODEL)
  const [activeSources, setActiveSources] = useState<string[]>(SOURCES)

  const bottomRef = useRef<HTMLDivElement>(null)

  const project = getProject(projectId)
  const projectItems = useMemo(() => itemsForProject(projectId), [projectId])
  const filteredItems = useMemo(
    () => projectItems.filter((i) => activeSources.includes(i.source)),
    [projectItems, activeSources],
  )
  const suggestions = SUGGESTIONS[projectId] ?? []

  const sourceFilter = (
    <MultiSelector
      label="Sources to search"
      isLabelHidden
      options={SOURCE_OPTIONS}
      value={activeSources}
      onChange={setActiveSources}
      startIcon={Layers}
      size="sm"
      triggerDisplay="count"
      placeholder="All sources"
      hasSelectAll
    />
  )

  const activeConversation = conversations.find((c) => c.id === activeId)
  const messages = activeConversation?.messages ?? []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length])

  const send = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || !projectId) return

    const now = new Date().toISOString()
    const userMsg: ChatMessage = { id: uid(), role: 'user', mode: 'ask', text: trimmed, createdAt: now }

    const answer = generateAnswer(trimmed, filteredItems, projectId, persona)
    const assistantMsg: ChatMessage = answer
      ? {
          id: uid(),
          role: 'assistant',
          mode: 'ask',
          text: answer.text,
          citationIds: answer.citationIds,
          thinking: answer.thinking,
          createdAt: new Date().toISOString(),
        }
      : {
          id: uid(),
          role: 'assistant',
          mode: 'ask',
          text: NO_ANSWER_SENTINEL,
          thinking: noAnswerThinking(trimmed),
          createdAt: new Date().toISOString(),
        }

    const existing = conversations.find((c) => c.id === activeId)
    let next: Conversation[]
    if (existing) {
      const updated: Conversation = {
        ...existing,
        messages: [...existing.messages, userMsg, assistantMsg],
        updatedAt: assistantMsg.createdAt,
      }
      next = conversations.map((c) => (c.id === existing.id ? updated : c))
    } else {
      const newConvo: Conversation = {
        id: activeId,
        projectId,
        title: trimmed.slice(0, 60),
        createdAt: now,
        updatedAt: assistantMsg.createdAt,
        messages: [userMsg, assistantMsg],
      }
      next = [newConvo, ...conversations]
    }
    persist(next)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        {messages.length === 0 ? (
          <div className="relative -m-6 flex h-[calc(100%+3rem)] w-[calc(100%+3rem)] flex-col items-center justify-center overflow-hidden rounded-none">
            <ShaderBackground />
            <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center justify-center gap-8 px-6">
            <HStack gap={3} vAlign="center">
              <Icon icon={Sparkles} size="lg" color="accent" />
              <Heading level={1} type="display-2">
                I can help you learn more about {project?.name ?? 'this project'}
              </Heading>
            </HStack>

            <div className="w-full">
              <ChatComposer
                value={input}
                onChange={setInput}
                onSubmit={send}
                placeholder="How can I help you today?"
                density="spacious"
                input={<ChatComposerInput style={{ minHeight: '96px' }} />}
                footerActions={
                  <HStack gap={2} vAlign="center">
                    <SegmentedControl
                      label="Response style"
                      value={persona}
                      onChange={(v) => setPersona(v as Persona)}
                      size="sm"
                    >
                      <SegmentedControlItem value="developer" label="Developer" icon={<Icon icon={Code2} size="sm" />} />
                      <SegmentedControlItem value="designer" label="Designer" icon={<Icon icon={Palette} size="sm" />} />
                    </SegmentedControl>
                    {sourceFilter}
                  </HStack>
                }
                sendActions={
                  <DropdownMenu
                    button={{ label: model, variant: 'ghost', size: 'sm' }}
                    hasChevron
                    items={MODEL_GROUPS.map((group) => ({
                      type: 'section' as const,
                      title: group.title,
                      items: group.models.map((m) => ({ label: m, onClick: () => setModel(m) })),
                    }))}
                  />
                }
              />
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <Button
                  key={s}
                  label={s}
                  variant="secondary"
                  size="sm"
                  className="font-normal"
                  onClick={() => send(s)}
                />
              ))}
            </div>
            </div>
          </div>
        ) : (
          <div className="ask-fade-in mx-auto flex min-h-full max-w-5xl flex-col justify-end gap-5">
            {messages.map((m) => (
              <ChatMessageBubble key={m.id} message={m} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {messages.length > 0 && (
        <div className="ask-fade-in px-6 py-4">
          <div className="mx-auto max-w-5xl">
            <ChatComposer
              value={input}
              onChange={setInput}
              onSubmit={send}
              placeholder='Ask a question, e.g. "why did we pick Stripe?"'
              density="balanced"
              elevation="none"
              footerActions={sourceFilter}
            />
          </div>
        </div>
      )}
    </div>
  )
}
