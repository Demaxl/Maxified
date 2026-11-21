import { z } from 'zod'
import { TREND_WINDOW_DAYS, breakdown, ranked, shareTrends } from '#shared/analytics/aggregate'
import { addDays, today } from '#shared/analytics/dates'
import { matchesSegment } from '#shared/analytics/filters'
import { TOPIC_QUESTION, prioritiseTopics, priorityConfig } from '#shared/analytics/priority'
import type { AnalyticsRow, ContentData, SegmentSummary } from '#shared/analytics/types'
import { labelFor } from '#shared/survey-catalog'

const list = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform(value => (value === undefined ? [] : [value].flat()).filter(Boolean).slice(0, 25))

const comparisonSchema = z.object({
  aPhysique: list,
  aExperience: list,
  bPhysique: list,
  bExperience: list
})

function segmentLabel(physique: string[], experience: string[]) {
  const describe = (questionId: string, values: string[], all: string) =>
    values.length ? values.map(value => labelFor(questionId, value)).join(' or ') : all

  return `${describe('physique', physique, 'Any physique')} · ${describe('experience', experience, 'any experience')}`
}

function summarise(rows: AnalyticsRow[], physique: string[], experience: string[]): SegmentSummary {
  const segmentRows = rows.filter(row => matchesSegment(row.answers, { physique, experience, goal: [], days: [], location: [] }))
  const topics = breakdown(segmentRows, TOPIC_QUESTION)

  return { label: segmentLabel(physique, experience), n: segmentRows.length, answered: topics.answered, items: topics.items }
}

export default defineAdminHandler(async (event): Promise<ContentData> => {
  const filters = readAdminFilters(event)
  const segments = readAdminQuery(event, comparisonSchema)
  const todayKey = today()

  // The trend always looks at the last two 30-day windows, within the same segment filters.
  const [rows, trendRows] = await Promise.all([
    loadResponseRows(filters),
    loadResponseRows({ ...filters, from: addDays(todayKey, -(TREND_WINDOW_DAYS * 2 - 1)), to: todayKey })
  ])

  const { topics, priorities } = prioritiseTopics(rows)
  const trends = shareTrends(trendRows, TOPIC_QUESTION, todayKey)
  const legacy = breakdown(rows, 'program_wishlist')
  const hasComparison = [segments.aPhysique, segments.aExperience, segments.bPhysique, segments.bExperience].some(value => value.length)

  return {
    generatedAt: new Date().toISOString(),
    n: rows.length,
    answered: topics.answered,
    unanswered: topics.unanswered,
    topics: ranked(topics.items).map((item, index) => ({
      ...item,
      rank: index + 1,
      trend: trends.trendFor(item.value),
      priority: priorities.get(item.value)!
    })),
    trendWindow: trends.window,
    comparison: hasComparison
      ? {
          a: summarise(rows, segments.aPhysique, segments.aExperience),
          b: summarise(rows, segments.bPhysique, segments.bExperience)
        }
      : null,
    legacy: legacy.answered ? legacy : null,
    priorityConfig: {
      weights: priorityConfig.weights,
      thresholds: priorityConfig.thresholds,
      minSample: priorityConfig.minSample,
      topN: priorityConfig.topN,
      minSegmentSize: priorityConfig.minSegmentSize
    }
  }
})
