import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Network, SlidersHorizontal } from 'lucide-react'
import { itemsForProject, topicsForProject } from '../data/mockData'
import { buildGraph } from '../lib/graphLayout'
import { SOURCE_HEX } from '../components/SourceBadge'
import { ItemCard } from '../components/ItemCard'
import { absoluteTime, relativeTime } from '../lib/time'
import type { SourceId } from '../types'

const LEGEND: { source: SourceId; label: string }[] = [
  { source: 'github', label: 'GitHub' },
  { source: 'zulip', label: 'Zulip' },
  { source: 'figma', label: 'Figma' },
  { source: 'notion', label: 'Notion' },
]

export function MemoryPage() {
  const navigate = useNavigate()
  const { projectId = '' } = useParams()

  const projectItems = useMemo(() => itemsForProject(projectId), [projectId])
  const projectTopics = useMemo(() => topicsForProject(projectId), [projectId])

  const chronological = useMemo(
    () => [...projectItems].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)),
    [projectItems],
  )
  const stepOf = useMemo(() => {
    const m = new Map<string, number>()
    chronological.forEach((item, i) => m.set(item.id, i + 1))
    return m
  }, [chronological])

  const total = chronological.length
  const [step, setStep] = useState(total)

  const graph = useMemo(() => buildGraph(projectItems, projectTopics, stepOf), [projectItems, projectTopics, stepOf])

  const currentItem = chronological[Math.max(step - 1, 0)]
  const visibleTimeline = chronological.slice(0, step).slice().reverse()

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-1.5">
          <Network size={15} className="text-brand-orange" />
          <h1 className="text-lg font-semibold">Memory</h1>
        </div>
        <p className="mt-0.5 text-sm text-slate-400">
          A map of how ingested items connect, and the timeline of milestones that built it.
        </p>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <div className="absolute left-4 top-4 z-10 flex items-center gap-3 rounded-md border border-slate-200 bg-[#F7F8FB]/80 px-3 py-1.5 backdrop-blur">
            {LEGEND.map((l) => (
              <span key={l.source} className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: SOURCE_HEX[l.source] }} />
                {l.label}
              </span>
            ))}
            <span className="flex items-center gap-1.5 border-l border-slate-200 pl-3 text-[11px] text-slate-500">
              <span className="h-2.5 w-2.5 rounded-full bg-brand-navy" />
              Topic
            </span>
          </div>

          <svg viewBox={`0 0 ${graph.width} ${graph.height}`} className="h-full w-full">
            {graph.edges.map((e) => {
              const visible = e.step <= step
              return (
                <line
                  key={e.id}
                  x1={e.x1}
                  y1={e.y1}
                  x2={e.x2}
                  y2={e.y2}
                  stroke={e.kind === 'related' ? '#f5921e' : '#1b4c82'}
                  strokeOpacity={visible ? (e.kind === 'related' ? 0.5 : 0.2) : 0}
                  strokeDasharray={e.kind === 'related' ? '3 3' : undefined}
                  strokeWidth={1}
                  style={{ transition: 'stroke-opacity 400ms' }}
                />
              )
            })}

            {graph.nodes.map((n) => {
              const visible = n.step <= step
              if (n.kind === 'hub') {
                return (
                  <g key={n.id} style={{ opacity: visible ? 1 : 0, transition: 'opacity 400ms' }}>
                    <circle cx={n.x} cy={n.y} r={8} fill="#1b4c82" stroke="#3b6ba6" strokeWidth={1} />
                    <text
                      x={n.x}
                      y={n.y - 14}
                      textAnchor="middle"
                      fontSize={11}
                      fontWeight={600}
                      fill="#1b4c82"
                    >
                      {n.label}
                    </text>
                  </g>
                )
              }
              return (
                <g
                  key={n.id}
                  style={{ opacity: visible ? 1 : 0, transition: 'opacity 400ms', pointerEvents: visible ? 'auto' : 'none' }}
                  className="cursor-pointer"
                  onClick={() => n.itemId && navigate(`/p/${projectId}/item/${n.itemId}`)}
                >
                  <circle cx={n.x} cy={n.y} r={5} fill={n.source ? SOURCE_HEX[n.source] : '#94a3b8'} stroke="#ffffff" strokeWidth={1.5}>
                    <title>{n.label}</title>
                  </circle>
                </g>
              )
            })}
          </svg>
        </div>

        <div className="flex w-80 shrink-0 flex-col border-l border-slate-200">
          <div className="border-b border-slate-200 px-4 py-3 text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Timeline — milestones & deliverables
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            <div className="relative flex flex-col gap-3 border-l border-slate-200 pl-4">
              {visibleTimeline.map((item) => (
                <div key={item.id} className="relative">
                  <span className="absolute -left-[19px] top-3 h-1.5 w-1.5 rounded-full bg-brand-orange" />
                  <ItemCard item={item} />
                </div>
              ))}
              {visibleTimeline.length === 0 && (
                <p className="text-xs text-slate-400">No items revealed yet — move the slider below.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-slate-200 px-6 py-4">
        <div className="mb-1.5 flex items-center gap-2">
          <SlidersHorizontal size={13} className="text-slate-400" />
          <span className="text-xs font-medium text-slate-600">
            Step {step} of {total}
          </span>
          {currentItem && (
            <span className="text-xs text-slate-400" title={absoluteTime(currentItem.createdAt)}>
              — {currentItem.title} ({relativeTime(currentItem.createdAt)})
            </span>
          )}
        </div>
        <input
          type="range"
          min={total > 0 ? 1 : 0}
          max={total}
          value={step}
          onChange={(e) => setStep(Number(e.target.value))}
          className="w-full accent-brand-orange"
        />
      </div>
    </div>
  )
}
