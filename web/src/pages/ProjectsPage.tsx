import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { projects, itemsForProject, connectorsForProject } from '../data/mockData'
import { SourceBadge } from '../components/SourceBadge'
import { relativeTime } from '../lib/time'
import type { SourceId } from '../types'

export function ProjectsPage() {
  return (
    <div className="mx-auto min-h-screen max-w-4xl px-6 py-16">
      <div className="mb-10">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-brand-orange to-brand-navy text-sm font-bold text-white">
            A
          </div>
          <span className="text-sm font-semibold text-slate-600">Apphatchery Brain</span>
        </div>
        <h1 className="text-2xl font-semibold text-slate-900">Projects</h1>
        <p className="mt-1 text-sm text-slate-500">Pick a project to search and ask questions across its connected sources.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {projects.map((project) => {
          const projectItems = itemsForProject(project.id)
          const projectConnectors = connectorsForProject(project.id)
          const sources = Array.from(new Set(projectItems.map((i) => i.source))) as SourceId[]
          const latest = projectItems.reduce((max, i) => (i.updatedAt > max ? i.updatedAt : max), '0')

          return (
            <Link
              key={project.id}
              to={`/p/${project.id}`}
              className="group flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${project.color} text-base font-bold text-white`}
                >
                  {project.initial}
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-slate-900">{project.name}</h2>
                  <p className="text-xs text-slate-400">updated {relativeTime(latest)}</p>
                </div>
                <ArrowRight
                  size={16}
                  className="ml-auto shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500"
                />
              </div>

              <p className="text-[13px] leading-snug text-slate-500">{project.description}</p>

              <div className="mt-auto flex items-center gap-2 border-t border-slate-100 pt-3">
                {sources.map((s) => (
                  <SourceBadge key={s} source={s} />
                ))}
                <span className="ml-auto text-[11px] text-slate-400">
                  {projectItems.length} items · {projectConnectors.length} sources connected
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
