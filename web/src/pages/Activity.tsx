import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import { itemsForProject, topicsForProject, getItem } from '../data/mockData'
import { SOURCE_META, SourceBadge } from '../components/SourceBadge'
import { ItemCard } from '../components/ItemCard'
import { relativeTime } from '../lib/time'
import type { SourceId } from '../types'

const SOURCES: SourceId[] = ['github', 'zulip', 'figma', 'notion']

type Tab = 'all' | 'topics'

export function Activity() {
  const { projectId = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const tab: Tab = params.get('tab') === 'topics' ? 'topics' : 'all'

  const [active, setActive] = useState<Set<SourceId>>(new Set(SOURCES))

  const toggle = (s: SourceId) => {
    setActive((prev) => {
      const next = new Set(prev)
      if (next.has(s)) next.delete(s)
      else next.add(s)
      return next
    })
  }

  const feed = itemsForProject(projectId)
    .filter((i) => active.has(i.source))
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))

  const topics = topicsForProject(projectId)

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="mb-1 text-lg font-semibold">Activity</h1>
      <p className="mb-5 text-sm text-slate-500">
        Everything ingested, in sequence, or clustered into topics.
      </p>

      <div className="mb-5 flex items-center gap-1 border-b border-slate-200">
        <button
          onClick={() => setParams({ tab: 'all' })}
          className={`border-b-2 px-3 py-2 text-sm font-medium transition ${
            tab === 'all' ? 'border-brand-orange text-brand-navy' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setParams({ tab: 'topics' })}
          className={`border-b-2 px-3 py-2 text-sm font-medium transition ${
            tab === 'topics' ? 'border-brand-orange text-brand-navy' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Topics
        </button>
      </div>

      {tab === 'all' ? (
        <>
          <div className="mb-5 flex flex-wrap gap-2">
            {SOURCES.map((s) => {
              const on = active.has(s)
              const meta = SOURCE_META[s]
              const Icon = meta.icon
              return (
                <button
                  key={s}
                  onClick={() => toggle(s)}
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition ${
                    on
                      ? 'border-brand-orange/50 bg-orange-50 text-brand-navy'
                      : 'border-slate-200 text-slate-400 hover:text-slate-500'
                  }`}
                >
                  <Icon size={12} />
                  {meta.label}
                </button>
              )
            })}
          </div>

          <div className="flex flex-col gap-2">
            {feed.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
            {feed.length === 0 && (
              <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-400">
                No sources selected.
              </p>
            )}
          </div>
        </>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {topics.map((topic) => {
            const topicItems = topic.itemIds.map(getItem).filter(Boolean)
            const sources = Array.from(new Set(topicItems.map((i) => i!.source))) as SourceId[]
            const latest = topicItems.reduce(
              (max, i) => (i && i.updatedAt > max ? i.updatedAt : max),
              '0',
            )
            return (
              <Link
                key={topic.id}
                to={`/p/${projectId}/topics/${topic.id}`}
                className="flex flex-col gap-2.5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex items-center gap-2">
                  <BookOpen size={15} className="text-brand-orange" />
                  <h2 className="text-sm font-semibold text-slate-800">{topic.title}</h2>
                </div>
                <p className="text-[13px] leading-snug text-slate-500">{topic.description}</p>
                <div className="mt-1 flex items-center gap-2">
                  {sources.map((s) => (
                    <SourceBadge key={s} source={s} />
                  ))}
                  <span className="ml-auto text-[11px] text-slate-400">
                    {topicItems.length} items · updated {relativeTime(latest)}
                  </span>
                </div>
              </Link>
            )
          })}
          {topics.length === 0 && (
            <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-400">
              No topics detected yet for this project.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
