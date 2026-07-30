import { items } from '../data/mockData'
import type { KBItem, Persona } from '../types'

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
  thinking: string[]
}

interface Canned {
  match: RegExp
  citationIds: string[]
  thinking: string[]
  developer: string
  designer: string
}

const FABLA_CANNED: Canned[] = [
  {
    match: /apple\s?pay/i,
    citationIds: ['zulip-2', 'notion-2', 'github-issue-210', 'github-pr-482', 'figma-2'],
    thinking: [
      'Searching connected sources for "Apple Pay"…',
      'Found a decision thread in Zulip and Notion about Stripe vs. Braintree, plus GitHub issue #210 and PR #482.',
      'Cross-referencing a Figma comment about button placement — same feature, design side.',
      'Synthesizing into one grounded answer with citations.',
    ],
    developer:
      "Apple Pay shipped in PR #482 on top of GitHub issue #210, adding both Apple Pay and Google Pay wallet support [3][4]. The team picked Stripe over Braintree for the checkout rewrite specifically for its better out-of-the-box Apple Pay support and lower per-transaction fees [1][2]. The Apple Pay button was also moved above the card form based on usability data [5].",
    designer:
      "The Apple Pay button was moved above the card form after usability testing showed roughly 30% of mobile users are on iOS [5]. That sits alongside the decision to build on Stripe over Braintree for the checkout redesign, chosen for stronger native Apple Pay support and lower fees [1][2]. Apple Pay and Google Pay wallet support shipped together via PR #482, tracked from issue #210 [3][4].",
  },
  {
    match: /stripe|payment provider|braintree/i,
    citationIds: ['notion-2', 'zulip-2', 'notion-3'],
    thinking: [
      'Searching for the payment provider decision…',
      'Found the comparison doc in Notion and the decision message in Zulip from Dan Ohara.',
      "Checking the running decision log to confirm this is still the current call.",
    ],
    developer:
      "Stripe, Braintree, and Adyen were evaluated for the checkout rewrite; Stripe won on API ergonomics, Apple Pay support, and lower fees at their transaction volume [1]. Dan Ohara made the call, confirmed by Priya Nair in Zulip [2], and it's logged in the project's decision log [3].",
    designer:
      "For the checkout redesign, Stripe was picked over Braintree and Adyen largely because it gave the smoothest native Apple Pay experience and kept fees down at their transaction volume [1]. Dan Ohara made the call, confirmed by Priya Nair in Zulip [2], with the full reasoning captured in the decision log [3].",
  },
  {
    match: /checkout.*(status|progress|launch)|status.*checkout/i,
    citationIds: ['zulip-3', 'github-pr-482', 'figma-1', 'notion-4'],
    thinking: [
      'Looking for the latest status on the checkout redesign…',
      'Found a recent Zulip status update, the linked PR #482, and the Figma v3 frames.',
      'Checking the Q3 roadmap doc to confirm priority and target date.',
    ],
    developer:
      "Per the latest Zulip status update, PR #482 (Stripe migration) was in review and targeting merge the following week [1][2]. The v3 design frames were finalized [3], and the Q3 roadmap has the checkout redesign launch as the top priority for an Aug 15, 2026 target [4].",
    designer:
      "The v3 design frames for checkout were finalized [3], with the Stripe migration PR in review and on track to merge the following week [1][2]. It's the top item on the Q3 roadmap, targeting an Aug 15, 2026 launch [4].",
  },
  {
    match: /incident|500s|outage|postmortem/i,
    citationIds: ['zulip-5', 'zulip-6', 'github-issue-198', 'github-commit-9f2'],
    thinking: [
      'Searching for recent incidents or elevated error rates…',
      'Found two Zulip threads about a July 19 incident, plus a GitHub issue and commit for a related fix.',
      "Separating the root cause (a skipped canary stage) from the adjacent discount-rounding bug so they don't get conflated.",
    ],
    developer:
      "On July 19, a discount-service deploy skipped its canary stage due to a CI config gap, causing elevated 500s on /api/cart [1]. It was rolled back, and the postmortem added a required canary stage to prevent a repeat [2][3]. A related rounding bug in discount-code stacking was also fixed around the same time [4].",
    designer:
      "There was a rough patch around July 19 where checkout errored out for a chunk of users — a deploy skipped a safety check and had to be rolled back [1][2]. That check is now mandatory going forward [3]. A related issue with stacked discount codes rounding incorrectly was fixed around the same time [4].",
  },
  {
    match: /button|design system|design token/i,
    citationIds: ['figma-3', 'zulip-4', 'github-pr-501', 'figma-4'],
    thinking: [
      'Searching design system and component sources…',
      'Found the button spec in Figma (Marcus Webb) and the PR that syncs tokens into the npm package.',
      'Checking for any recent accessibility fixes tied to this component.',
    ],
    developer:
      "Button component specs (primary, secondary, ghost, destructive, all interaction states) live in Figma, maintained by Marcus Webb [1]. Token updates there get synced into the design-tokens npm package via PR #501 [2][3]. A recent fix also corrected a contrast issue on the destructive variant to meet AA accessibility [4].",
    designer:
      "Marcus Webb maintains the button component in Figma — primary, secondary, ghost, and destructive variants, each with full interaction states [1]. Those tokens flow into the design-tokens package that engineering consumes [2][3]. The destructive variant's contrast was recently fixed to meet AA accessibility [4].",
  },
]

const TYPEU_CANNED: Canned[] = [
  {
    match: /onboarding/i,
    citationIds: ['tu-notion-1', 'github-tu-issue-88', 'notion-tu-2', 'github-tu-pr-112', 'zulip-tu-2'],
    thinking: [
      'Searching for onboarding redesign context…',
      'Found the PRD in Notion, the GitHub issue and PR, and a Zulip note on rollout percentage.',
      'Ordering by decision → implementation → rollout status.',
    ],
    developer:
      "The onboarding redesign shipped via PR #112 [4], rolling out as a 50% A/B test ahead of full launch [5]. The key implementation decision was deferring account creation until after the first typing test — results are stored locally and merged into the account on signup [2][3]. Target, per Jae Lin's PRD, was getting new users typing within 30 seconds of landing [1].",
    designer:
      "Jae Lin's PRD set the bar at getting new users typing within 30 seconds of landing [1]. To hit that, account creation was pushed until after the first typing test, so people can try the product before committing [2][3]. It's rolling out as a 50% A/B test before full launch [4][5].",
  },
  {
    match: /sign\s?up|account creation/i,
    citationIds: ['github-tu-issue-88', 'notion-tu-2'],
    thinking: [
      'Searching for account creation / sign-up flow changes…',
      'Found the GitHub issue proposing the change and the Notion doc explaining the rationale.',
    ],
    developer:
      "Account creation moved to after the first typing test — results are captured anonymously and merged into the account on signup once the user converts [1][2].",
    designer:
      "Signing up got pushed past the first typing test, since account creation was the biggest drop-off point — now people try it first, and results carry over once they do sign up [1][2].",
  },
  {
    match: /wpm|words per minute|typing (speed|accuracy)/i,
    citationIds: ['github-tu-issue-95', 'github-tu-commit-4a1'],
    thinking: [
      'Searching for WPM calculation issues…',
      'Found the GitHub issue describing the bug and the commit that fixed it.',
    ],
    developer:
      "WPM was inflated for users who backspace a lot, since corrected characters still counted toward gross output [1]. Fixed by computing WPM from net correct characters instead, matching the standard typing-test definition [2].",
    designer:
      "Heavy backspacers were seeing inflated WPM scores because corrections still counted toward the total [1]. The calculation now uses net correct characters, so the number reflects what actually landed on screen [2].",
  },
  {
    match: /latency|incident|outage|500s|slow/i,
    citationIds: ['zulip-tu-3'],
    thinking: [
      'Searching for latency or performance incidents…',
      'Found a single Zulip thread describing the /api/sessions p95 spike and its fix.',
    ],
    developer:
      "p95 latency on /api/sessions spiked to 4s due to a missing index on the new streak-tracking query. Identified and fixed same-day [1].",
    designer:
      "/api/sessions got noticeably slow for a bit — a missing database index on the streak-tracking query. Caught and fixed the same morning [1].",
  },
]

const CANNED_BY_PROJECT: Record<string, Canned[]> = {
  fabla: FABLA_CANNED,
  typeu: TYPEU_CANNED,
}

export function generateAnswer(
  query: string,
  pool: KBItem[] = items,
  projectId?: string,
  persona: Persona = 'developer',
): Answer | null {
  const poolIds = new Set(pool.map((i) => i.id))
  const canned = projectId ? CANNED_BY_PROJECT[projectId] ?? [] : [...FABLA_CANNED, ...TYPEU_CANNED]
  for (const c of canned) {
    if (!c.match.test(query)) continue
    if (!c.citationIds.every((id) => poolIds.has(id))) continue
    return { text: c[persona], citationIds: c.citationIds, thinking: c.thinking }
  }

  const results = searchItems(query, pool).slice(0, 4)
  if (results.length === 0) return null

  const top = results.map((r) => r.item)
  const sourceCount = new Set(top.map((t) => t.source)).size
  const summary = top.map((item, i) => `${item.title} (${item.source}) [${i + 1}]`).join(', ')

  const text =
    persona === 'developer'
      ? `Based on ${top.length} related item${top.length > 1 ? 's' : ''} across ${sourceCount} source${sourceCount > 1 ? 's' : ''}, here's what's most relevant: ${summary}. Open a citation below for the full context and a link back to the original source.`
      : `Here's what's most relevant across ${sourceCount} connected source${sourceCount > 1 ? 's' : ''}: ${summary}. Click through to see the full context.`

  const thinking = [
    `Searching connected sources for "${query.trim()}"…`,
    `Found ${top.length} related item${top.length > 1 ? 's' : ''} across ${sourceCount} source${sourceCount > 1 ? 's' : ''}.`,
    'Ranking by keyword relevance and recency.',
  ]

  return { text, citationIds: top.map((i) => i.id), thinking }
}

export function noAnswerThinking(query: string): string[] {
  return [
    `Searching connected sources for "${query.trim()}"…`,
    'No items scored high enough relevance to confidently cite.',
  ]
}
