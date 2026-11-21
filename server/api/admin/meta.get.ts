import { ANALYTICS_TIME_ZONE } from '#shared/analytics/dates'
import { segmentFieldLabels, segmentFields } from '#shared/analytics/filters'
import type { SegmentField } from '#shared/analytics/filters'
import { optionsFor } from '#shared/survey-catalog'

export default defineAdminHandler(async () => {
  const [totals, trackingStart] = await Promise.all([countAll(), trackingStartedAt()])

  const filterOptions = Object.fromEntries(
    (Object.entries(segmentFields) as [SegmentField, string][]).map(([field, questionId]) => [
      field,
      { label: segmentFieldLabels[field], questionId, options: optionsFor(questionId) }
    ])
  ) as Record<SegmentField, { label: string, questionId: string, options: { value: string, label: string }[] }>

  return {
    generatedAt: new Date().toISOString(),
    timeZone: ANALYTICS_TIME_ZONE,
    trackingStartedAt: trackingStart,
    totals,
    filterOptions
  }
})
