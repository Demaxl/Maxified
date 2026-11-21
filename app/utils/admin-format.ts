import type { LocationQueryRaw } from 'vue-router'
import { segmentFields } from '#shared/analytics/filters'
import type { SegmentField } from '#shared/analytics/filters'

const percentFormat = new Intl.NumberFormat('en-GB', { style: 'percent', maximumFractionDigits: 1 })
const numberFormat = new Intl.NumberFormat('en-GB')

export function formatPercent(value: number) {
  return percentFormat.format(value)
}

export function formatNumber(value: number) {
  return numberFormat.format(value)
}

/** Below this, segment results are flagged as too small to rely on. */
export const MIN_RELIABLE_SAMPLE = 30

const fieldByQuestion = Object.fromEntries(
  (Object.entries(segmentFields) as [SegmentField, string][]).map(([field, questionId]) => [questionId, field])
) as Record<string, SegmentField>

/**
 * The All Responses link for one chart category, keeping the current filters. Segment
 * questions use their filter; any other choice question uses an answer match.
 */
export function responsesLink(questionId: string, value: string, sharedQuery: LocationQueryRaw) {
  const field = fieldByQuestion[questionId]
  const query: LocationQueryRaw = { ...sharedQuery }

  if (field) {
    query[field] = value
  } else {
    query.answer = `${questionId}:${value}`
  }

  return { path: '/admin/responses', query }
}
