import { NavLink, Outlet, useParams, Link } from 'react-router-dom'
import {
  Sparkles,
  Rss,
  Settings2,
  ChevronDown,
  Network,
} from 'lucide-react'
import { connectorsForProject, getProject } from '../data/mockData'

function StatusDot({ status }: { status: string }) {
  const color =
    status === 'connected' ? 'bg-emerald-500' : status === 'syncing' ? 'bg-amber-500' : 'bg-red-500'
  return <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
}

export function Layout() {
  const { projectId = '' } = useParams()

  const project = getProject(projectId)
  const connectors = connectorsForProject(projectId)

  const navItems = [
    { to: `/p/${projectId}`, label: 'Ask', icon: Sparkles, end: true },
    { to: `/p/${projectId}/memory`, label: 'Memory', icon: Network, end: false },
    { to: `/p/${projectId}/activity`, label: 'Activity', icon: Rss, end: false },
    { to: `/p/${projectId}/admin`, label: 'Sources & Sync', icon: Settings2, end: false },
  ]

  return (
    <div className="flex h-screen w-full bg-white text-slate-800">
      <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-[#F7F8FB]">
        <Link
          to="/"
          className="flex items-center gap-2 px-4 py-4 transition hover:bg-slate-50"
        >
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br ${project?.color ?? 'from-brand-orange to-brand-navy'} text-sm font-bold text-white`}
          >
            {project?.initial ?? 'A'}
          </div>
          <div className="min-w-0">
            <span className="block truncate text-sm font-semibold">{project?.name ?? 'Apphatchery Brain'}</span>
          </div>
          <ChevronDown size={14} className="ml-auto shrink-0 text-slate-400" />
        </Link>
        <nav className="flex flex-col gap-0.5 px-2">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition ${
                  isActive
                    ? 'bg-orange-50 font-medium text-brand-navy'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`
              }
            >
              <Icon size={16} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t border-slate-200 px-3 py-3">
          <div className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Sources
          </div>
          <div className="flex flex-col gap-1.5">
            {connectors.map((c) => (
              <div key={c.id} className="flex items-center gap-2 px-1 text-[12px] text-slate-500">
                <StatusDot status={c.status} />
                {c.name}
              </div>
            ))}
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end border-b border-slate-200 px-5 py-3">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="rounded-full border border-slate-200 px-2 py-1">Internal preview</span>
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
