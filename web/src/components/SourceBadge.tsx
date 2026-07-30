import { GitBranch, MessageCircle, Frame, FileText } from 'lucide-react'
import type { SourceId } from '../types'

export const SOURCE_META: Record<
  SourceId,
  { label: string; icon: typeof GitBranch; classes: string }
> = {
  github: {
    label: 'GitHub',
    icon: GitBranch,
    classes: 'bg-slate-100 text-slate-700 border-slate-300',
  },
  zulip: {
    label: 'Zulip',
    icon: MessageCircle,
    classes: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  figma: {
    label: 'Figma',
    icon: Frame,
    classes: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  },
  notion: {
    label: 'Notion',
    icon: FileText,
    classes: 'bg-neutral-100 text-neutral-700 border-neutral-300',
  },
}

export const SOURCE_HEX: Record<SourceId, string> = {
  github: '#64748b',
  zulip: '#3b82f6',
  figma: '#d946ef',
  notion: '#737373',
}

export function SourceBadge({ source, size = 'sm' }: { source: SourceId; size?: 'sm' | 'md' }) {
  const meta = SOURCE_META[source]
  const Icon = meta.icon
  const pad = size === 'sm' ? 'text-[11px] px-1.5 py-0.5 gap-1' : 'text-xs px-2 py-1 gap-1.5'
  return (
    <span
      className={`inline-flex items-center rounded-md border font-medium ${pad} ${meta.classes}`}
    >
      <Icon size={size === 'sm' ? 11 : 13} />
      {meta.label}
    </span>
  )
}
