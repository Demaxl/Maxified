import type { SurveyAnswers } from '../survey'

/** One stored survey submission, as the aggregations see it. */
export type AnalyticsRow = {
  id: string
  createdAt: string
  answers: SurveyAnswers
  /**
   * Whether this respondent is on the waitlist: `true` when linked by id or email,
   * `false` only when the response was tracked and never linked, `null` when unknown.
   */
  onWaitlist: boolean | null
  startId: string | null
}

export type BreakdownItem = {
  value: string
  label: string
  count: number
  /** Share of respondents who answered this question, 0–1. */
  pct: number
}

export type Breakdown = {
  questionId: string
  title: string
  multi: boolean
  /** Rows in scope, answered or not. */
  total: number
  /** The denominator for every percentage. */
  answered: number
  unanswered: number
  items: BreakdownItem[]
}

export type Unavailable = { available: false, reason: string }

export type RateMetric = Unavailable | {
  available: true
  value: number
  numerator: number
  denominator: number
  /** The first day the metric covers, when tracking began after the selected start. */
  since: string
  note?: string
}

export type CountMetric = { value: number, note?: string }

export type TopAnswer = {
  questionId: string
  title: string
  label: string | null
  count: number
  pct: number
  answered: number
  /** Other answers with the same count, so a tie is never presented as a clear winner. */
  tiedWith: string[]
}

export type OverviewData = {
  generatedAt: string
  n: number
  segmented: boolean
  range: { from: string | null, to: string | null }
  trackingStartedAt: string | null
  kpis: {
    responses: CountMetric
    waitlist: CountMetric
    completionRate: RateMetric
    conversionRate: RateMetric
    responsesLast7: CountMetric
    waitlistLast7: CountMetric
  }
  series: { day: string, responses: number, waitlist: number }[]
  top: TopAnswer[]
}

export type BreakdownData = {
  generatedAt: string
  n: number
  breakdowns: Record<string, Breakdown>
}

export type TopicTrend = Unavailable | {
  available: true
  recentShare: number
  previousShare: number
  /** Percentage-point change in share, recent minus previous. */
  change: number
}

export type PriorityTier = 'core' | 'supporting' | 'optional' | 'low_signal'

export type TopicPriority = {
  tier: PriorityTier
  score: number
  components: {
    demand: number
    struggle: number | null
    breadth: number | null
  }
  relatedStruggles: { value: string, label: string, pct: number }[]
  reasons: string[]
}

export type ContentTopic = BreakdownItem & {
  rank: number
  trend: TopicTrend
  priority: TopicPriority
}

export type SegmentSummary = {
  label: string
  n: number
  answered: number
  items: BreakdownItem[]
}

export type ContentData = {
  generatedAt: string
  n: number
  answered: number
  unanswered: number
  topics: ContentTopic[]
  trendWindow: { recent: string, previous: string, recentN: number, previousN: number, minimum: number }
  comparison: { a: SegmentSummary, b: SegmentSummary } | null
  legacy: Breakdown | null
  priorityConfig: {
    weights: Record<string, number>
    thresholds: Record<string, number>
    minSample: number
    topN: number
    minSegmentSize: number
  }
}

export type ResponseListItem = {
  id: string
  createdAt: string
  version: 'v1' | 'v2'
  physique: string | null
  goal: string | null
  experience: string | null
  struggles: string[]
  onWaitlist: boolean | null
}

export type ResponseListData = {
  generatedAt: string
  total: number
  page: number
  pageSize: number
  items: ResponseListItem[]
}
