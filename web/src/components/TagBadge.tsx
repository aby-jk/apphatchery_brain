import type { ItemTag } from '../types'

export const TAG_META: Record<ItemTag, { label: string; classes: string }> = {
  delivery: {
    label: 'Delivery',
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  feature: {
    label: 'New Feature',
    classes: 'bg-violet-50 text-violet-700 border-violet-200',
  },
  issue: {
    label: 'Issue',
    classes: 'bg-red-50 text-red-700 border-red-200',
  },
  milestone: {
    label: 'Milestone',
    classes: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  update: {
    label: 'Update',
    classes: 'bg-slate-100 text-slate-600 border-slate-300',
  },
}

export const TAG_HEX: Record<ItemTag, string> = {
  delivery: '#10b981',
  feature: '#8b5cf6',
  issue: '#ef4444',
  milestone: '#f59e0b',
  update: '#64748b',
}

export function TagBadge({ tag, size = 'sm' }: { tag: ItemTag; size?: 'sm' | 'md' }) {
  const meta = TAG_META[tag]
  const pad = size === 'sm' ? 'text-[11px] px-1.5 py-0.5' : 'text-xs px-2 py-1'
  return (
    <span className={`inline-flex items-center rounded-md border font-medium ${pad} ${meta.classes}`}>
      {meta.label}
    </span>
  )
}
