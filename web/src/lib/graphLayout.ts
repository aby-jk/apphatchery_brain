import type { KBItem, Topic, SourceId } from '../types'

export interface GraphNode {
  id: string
  kind: 'hub' | 'item'
  x: number
  y: number
  label: string
  source?: SourceId
  itemId?: string
  step: number
}

export interface GraphEdge {
  id: string
  x1: number
  y1: number
  x2: number
  y2: number
  kind: 'hub' | 'related'
  step: number
}

export interface Graph {
  nodes: GraphNode[]
  edges: GraphEdge[]
  width: number
  height: number
}

const WIDTH = 640
const HEIGHT = 520
const CENTER = { x: WIDTH / 2, y: HEIGHT / 2 }
const HUB_RADIUS = 165
const ITEM_RADIUS = 70

export function buildGraph(items: KBItem[], topics: Topic[], stepOf: Map<string, number>): Graph {
  const groupKey = (item: KBItem) => item.topicIds?.[0] ?? 'other'

  const groupOrder = [...topics.map((t) => t.id), 'other']
  const groups = new Map<string, KBItem[]>()
  for (const item of items) {
    const key = groupKey(item)
    if (!groupOrder.includes(key)) continue
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(item)
  }
  const activeGroups = groupOrder.filter((k) => groups.has(k))

  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []
  const positions = new Map<string, { x: number; y: number }>()

  const angleStep = (2 * Math.PI) / Math.max(activeGroups.length, 1)

  activeGroups.forEach((key, gi) => {
    const groupItems = groups.get(key)!.sort((a, b) => stepOf.get(a.id)! - stepOf.get(b.id)!)
    const hubAngle = -Math.PI / 2 + gi * angleStep
    const isOther = key === 'other'
    const hubPos = {
      x: CENTER.x + HUB_RADIUS * Math.cos(hubAngle),
      y: CENTER.y + HUB_RADIUS * Math.sin(hubAngle),
    }
    const hubStep = Math.min(...groupItems.map((i) => stepOf.get(i.id)!))

    if (!isOther) {
      const topic = topics.find((t) => t.id === key)!
      nodes.push({
        id: `hub-${key}`,
        kind: 'hub',
        x: hubPos.x,
        y: hubPos.y,
        label: topic.title,
        step: hubStep,
      })
      positions.set(`hub-${key}`, hubPos)
    }

    const spread = Math.min((Math.PI / 180) * 34, (Math.PI / 180) * (200 / Math.max(groupItems.length, 1)))
    groupItems.forEach((item, ii) => {
      const offset = (ii - (groupItems.length - 1) / 2) * spread
      const itemAngle = hubAngle + offset
      const radius = isOther ? HUB_RADIUS + 25 : HUB_RADIUS + ITEM_RADIUS
      const pos = {
        x: CENTER.x + radius * Math.cos(itemAngle),
        y: CENTER.y + radius * Math.sin(itemAngle),
      }
      const step = stepOf.get(item.id)!
      nodes.push({
        id: item.id,
        kind: 'item',
        x: pos.x,
        y: pos.y,
        label: item.title,
        source: item.source,
        itemId: item.id,
        step,
      })
      positions.set(item.id, pos)

      if (!isOther) {
        edges.push({
          id: `hub-${key}-${item.id}`,
          x1: hubPos.x,
          y1: hubPos.y,
          x2: pos.x,
          y2: pos.y,
          kind: 'hub',
          step,
        })
      }
    })
  })

  const seenRelated = new Set<string>()
  for (const item of items) {
    for (const relId of item.relatedIds ?? []) {
      if (!positions.has(relId) || !positions.has(item.id)) continue
      const pairKey = [item.id, relId].sort().join('::')
      if (seenRelated.has(pairKey)) continue
      seenRelated.add(pairKey)
      const a = positions.get(item.id)!
      const b = positions.get(relId)!
      const step = Math.max(stepOf.get(item.id)!, stepOf.get(relId)!)
      edges.push({ id: `rel-${pairKey}`, x1: a.x, y1: a.y, x2: b.x, y2: b.y, kind: 'related', step })
    }
  }

  return { nodes, edges, width: WIDTH, height: HEIGHT }
}
