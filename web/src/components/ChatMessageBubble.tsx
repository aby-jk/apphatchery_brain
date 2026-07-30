import { Link } from 'react-router-dom'
import { Sparkles, AlertCircle, Search } from 'lucide-react'
import { getItem } from '../data/mockData'
import { SourceBadge } from './SourceBadge'
import { ItemCard } from '../components/ItemCard'
import type { ChatMessage } from '../types'

export const NO_ANSWER_SENTINEL = '__NO_ANSWER__'

function AnswerText({ text, citationIds }: { text: string; citationIds: string[] }) {
  const parts = text.split(/(\[\d+\])/g)
  const citedItems = citationIds.map((id) => getItem(id)).filter(Boolean)

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13.5px] leading-relaxed text-slate-800">
        {parts.map((part, i) => {
          const m = part.match(/^\[(\d+)\]$/)
          if (m) {
            const idx = Number(m[1]) - 1
            const item = citedItems[idx]
            return (
              <a
                key={i}
                href={`#cite-${idx}`}
                className="mx-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded bg-orange-100 px-1 align-super text-[9px] font-semibold text-brand-navy no-underline hover:bg-orange-200"
                title={item?.title}
              >
                {m[1]}
              </a>
            )
          }
          return <span key={i}>{part}</span>
        })}
      </p>

      {citedItems.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {citedItems.map((item, i) =>
            item ? (
              <Link
                key={item.id}
                id={`cite-${i}`}
                to={`/p/${item.projectId}/item/${item.id}`}
                className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-white p-2.5 transition hover:border-slate-300 hover:bg-slate-50 scroll-mt-4"
              >
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded bg-slate-100 text-[10px] font-semibold text-slate-500">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <SourceBadge source={item.source} />
                    <span className="truncate text-[13px] font-medium text-slate-800">{item.title}</span>
                  </div>
                  <p className="line-clamp-1 text-[12px] text-slate-500">{item.snippet}</p>
                </div>
              </Link>
            ) : null,
          )}
        </div>
      )}
    </div>
  )
}

export function ChatMessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-brand-navy px-4 py-2.5 text-[13.5px] leading-relaxed text-white">
          {message.text}
        </div>
      </div>
    )
  }

  const searchResults = (message.searchResultIds ?? []).map((id) => getItem(id)).filter(Boolean)

  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-orange to-brand-navy">
        <Sparkles size={13} className="text-white" />
      </div>
      <div className="min-w-0 max-w-[85%] flex-1">
        {message.text === NO_ANSWER_SENTINEL ? (
          <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertCircle size={15} className="mt-0.5 shrink-0 text-amber-600" />
            <div>
              <p className="font-medium">No grounded answer found</p>
              <p className="mt-1 text-[13px] text-amber-800/80">
                Nothing in the connected sources is clearly related to this question. Try rephrasing, or switch to
                Search mode to browse loosely related items.
              </p>
            </div>
          </div>
        ) : message.mode === 'search' ? (
          <div className="flex flex-col gap-2">
            <p className="flex items-center gap-1.5 text-[13px] text-slate-500">
              <Search size={12} />
              {message.text}
            </p>
            <div className="flex flex-col gap-2">
              {searchResults.map((item) => (
                <ItemCard key={item!.id} item={item!} />
              ))}
              {searchResults.length === 0 && (
                <p className="text-[13px] text-slate-400">No matches. Try different keywords.</p>
              )}
            </div>
          </div>
        ) : (
          <AnswerText text={message.text} citationIds={message.citationIds ?? []} />
        )}
      </div>
    </div>
  )
}
