import { items } from '../data/mockData'
import type { KBItem } from '../types'

const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'to', 'of', 'in', 'on', 'for',
  'and', 'or', 'why', 'what', 'who', 'when', 'how', 'did', 'do', 'does',
  'we', 'our', 'it', 'this', 'that', 'with', 'about', 'us',
])

const tokenize = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w))

export interface ScoredItem {
  item: KBItem
  score: number
}

export function searchItems(query: string, pool: KBItem[] = items): ScoredItem[] {
  const qWords = tokenize(query)
  if (qWords.length === 0) return []

  const scored = pool.map((item) => {
    const haystack = tokenize(`${item.title} ${item.body} ${item.type} ${item.source} ${item.space}`)
    let score = 0
    for (const w of qWords) {
      const titleHits = tokenize(item.title).filter((t) => t === w).length
      const bodyHits = haystack.filter((t) => t === w).length
      score += titleHits * 3 + bodyHits
    }
    return { item, score }
  })

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || +new Date(b.item.updatedAt) - +new Date(a.item.updatedAt))
}

export interface Answer {
  text: string
  citationIds: string[]
}

interface Canned {
  match: RegExp
  build: () => Answer
}

const FABLA_CANNED: Canned[] = [
  {
    match: /apple\s?pay/i,
    build: () => ({
      text:
        "Apple Pay support was added as part of the checkout redesign. The team chose Stripe over Braintree specifically because it had better out-of-the-box Apple Pay support and lower per-transaction fees [1][2]. Implementation is tracked in GitHub issue #210 and shipped via PR #482, which adds both Apple Pay and Google Pay wallet support [3][4]. On the design side, the Apple Pay button was moved above the card form based on usability testing showing ~30% of mobile users are on iOS [5].",
      citationIds: ['zulip-2', 'notion-2', 'github-issue-210', 'github-pr-482', 'figma-2'],
    }),
  },
  {
    match: /stripe|payment provider|braintree/i,
    build: () => ({
      text:
        "The team evaluated Stripe, Braintree, and Adyen for the checkout redesign and decided on Stripe [1]. The decision, made by Dan Ohara and confirmed by Priya Nair in Zulip, cited better Apple Pay support and lower fees at their transaction volume [2]. This is also recorded in the project's decision log [3].",
      citationIds: ['notion-2', 'zulip-2', 'notion-3'],
    }),
  },
  {
    match: /checkout.*(status|progress|launch)|status.*checkout/i,
    build: () => ({
      text:
        "As of the latest status update in Zulip, the Stripe migration PR (#482) was in review and targeting merge the following week, the v3 design frames were finalized, and the team was on track for an Aug 15, 2026 launch [1][2][3]. The Q3 roadmap also lists the checkout redesign launch as the top priority [4].",
      citationIds: ['zulip-3', 'github-pr-482', 'figma-1', 'notion-4'],
    }),
  },
  {
    match: /incident|500s|outage|postmortem/i,
    build: () => ({
      text:
        "There was an incident on July 19 with elevated 500 errors on /api/cart, caused by a discount-service deploy that skipped its canary stage due to a CI configuration gap [1]. It was rolled back, and the postmortem notes a required canary stage is being added [2]. Separately, a related rounding bug in discount-code stacking was fixed around the same time [3][4].",
      citationIds: ['zulip-5', 'zulip-6', 'github-issue-198', 'github-commit-9f2'],
    }),
  },
  {
    match: /button|design system|design token/i,
    build: () => ({
      text:
        "The design system's button component specs (primary, secondary, ghost, destructive, with all interaction states) live in a Figma file maintained by Marcus Webb [1]. When tokens are updated there, engineering syncs them into the design-tokens npm package [2][3]. A recent update also fixed a contrast issue on the destructive variant to meet AA accessibility [4].",
      citationIds: ['figma-3', 'zulip-4', 'github-pr-501', 'figma-4'],
    }),
  },
]

const TYPEU_CANNED: Canned[] = [
  {
    match: /onboarding/i,
    build: () => ({
      text:
        "The onboarding redesign aims to get new users typing within 30 seconds of landing, per Jae Lin's PRD [1]. The key decision was to defer account creation until after the first typing test, storing results locally and merging them into the account on signup [2][3]. It shipped via PR #112 and is rolling out as a 50% A/B test before full launch [4][5].",
      citationIds: ['tu-notion-1', 'github-tu-issue-88', 'notion-tu-2', 'github-tu-pr-112', 'zulip-tu-2'],
    }),
  },
  {
    match: /sign\s?up|account creation/i,
    build: () => ({
      text:
        "Account creation was moved to after the first typing test as part of the onboarding redesign — anonymous results are stored locally and merged into the account on signup, reducing friction at what was the highest drop-off step [1][2].",
      citationIds: ['github-tu-issue-88', 'notion-tu-2'],
    }),
  },
  {
    match: /wpm|words per minute|typing (speed|accuracy)/i,
    build: () => ({
      text:
        "There was a bug where WPM was inflated for users who backspace a lot, because corrected characters were still counted toward gross output [1]. It was fixed by computing WPM from net correct characters instead, matching the standard typing-test definition [2].",
      citationIds: ['github-tu-issue-95', 'github-tu-commit-4a1'],
    }),
  },
  {
    match: /latency|incident|outage|500s|slow/i,
    build: () => ({
      text:
        "There was a latency incident on /api/sessions where p95 spiked to 4s, caused by a missing index on the new streak-tracking query. It was identified and fixed the same morning [1].",
      citationIds: ['zulip-tu-3'],
    }),
  },
]

const CANNED_BY_PROJECT: Record<string, Canned[]> = {
  fabla: FABLA_CANNED,
  typeu: TYPEU_CANNED,
}

export function generateAnswer(query: string, pool: KBItem[] = items, projectId?: string): Answer | null {
  const canned = projectId ? CANNED_BY_PROJECT[projectId] ?? [] : [...FABLA_CANNED, ...TYPEU_CANNED]
  for (const c of canned) {
    if (c.match.test(query)) return c.build()
  }

  const results = searchItems(query, pool).slice(0, 4)
  if (results.length === 0) return null

  const top = results.map((r) => r.item)
  const summary = top
    .map((item, i) => `${item.title} (${item.source}) [${i + 1}]`)
    .join(', ')

  return {
    text: `Based on ${top.length} related item${top.length > 1 ? 's' : ''} across ${new Set(top.map((t) => t.source)).size} source${new Set(top.map((t) => t.source)).size > 1 ? 's' : ''}, here's what's most relevant: ${summary}. Open a citation below for the full context and a link back to the original source.`,
    citationIds: top.map((i) => i.id),
  }
}
