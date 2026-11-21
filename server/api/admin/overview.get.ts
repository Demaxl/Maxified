import { breakdown, dailySeries, seriesDays, topAnswer } from '#shared/analytics/aggregate'
import { dayKey, presetRange, today } from '#shared/analytics/dates'
import { hasSegmentFilters } from '#shared/analytics/filters'
import type { AnalyticsFilters } from '#shared/analytics/filters'
import type { AnalyticsRow, OverviewData, RateMetric } from '#shared/analytics/types'

async function completionRate(filters: AnalyticsFilters, trackingStart: string | null, todayKey: string): Promise<RateMetric> {
  if (!trackingStart) {
    return { available: false, reason: 'No survey attempts have been tracked yet. Tracking starts once the updated survey is live.' }
  }

  if (hasSegmentFilters(filters)) {
    return { available: false, reason: 'Attempts are recorded before any answers, so completion can\'t be split by segment. Clear the segment filters to see it.' }
  }

  const trackedFrom = dayKey(trackingStart)
  const from = filters.from && filters.from > trackedFrom ? filters.from : trackedFrom
  const to = filters.to ?? todayKey

  if (from > to) {
    return { available: false, reason: `Tracking began on ${trackedFrom}, after the selected dates.` }
  }

  const attempts = await loadSurveyStarts({ from, to })

  if (!attempts.length) {
    return { available: false, reason: 'No survey attempts were tracked in this period.' }
  }

  const completed = attempts.filter(attempt => attempt.completed).length

  return {
    available: true,
    value: completed / attempts.length,
    numerator: completed,
    denominator: attempts.length,
    since: from,
    note: 'Attempts begin when someone answers the first question.'
  }
}

function conversionRate(rows: AnalyticsRow[], trackingStart: string | null): RateMetric {
  if (!trackingStart) {
    return { available: false, reason: 'Responses are only linked to waitlist signups from when tracking starts.' }
  }

  // Before tracking, a respondent who joined on the thank-you screen wasn't linked, so
  // those responses would undercount; only tracked responses are used.
  const tracked = rows.filter(row => row.createdAt >= trackingStart && row.onWaitlist !== null)

  if (!tracked.length) {
    return { available: false, reason: 'No tracked responses in this selection yet.' }
  }

  const joined = tracked.filter(row => row.onWaitlist).length

  return {
    available: true,
    value: joined / tracked.length,
    numerator: joined,
    denominator: tracked.length,
    since: dayKey(trackingStart),
    note: 'Respondents on the waitlist, including anyone who joined before taking the survey.'
  }
}

export default defineAdminHandler(async (event): Promise<OverviewData> => {
  const filters = readAdminFilters(event)
  const todayKey = today()
  const last7 = presetRange('7d')

  const [rows, waitlistDates, trackingStart, recentRows, recentWaitlist] = await Promise.all([
    loadResponseRows(filters),
    loadWaitlistDates(filters),
    trackingStartedAt(),
    loadResponseRows({ ...filters, ...last7 }),
    loadWaitlistDates(last7)
  ])

  const segmented = hasSegmentFilters(filters)
  const waitlistNote = segmented ? 'Not segmented: signups have no survey answers.' : undefined
  const days = seriesDays(filters, [...rows.map(row => row.createdAt), ...waitlistDates], todayKey)

  return {
    generatedAt: new Date().toISOString(),
    n: rows.length,
    segmented,
    range: { from: filters.from ?? null, to: filters.to ?? null },
    trackingStartedAt: trackingStart,
    kpis: {
      responses: { value: rows.length },
      waitlist: { value: waitlistDates.length, note: waitlistNote },
      completionRate: await completionRate(filters, trackingStart, todayKey),
      conversionRate: conversionRate(rows, trackingStart),
      responsesLast7: { value: recentRows.length, note: 'Always the last 7 days, whatever dates are selected.' },
      waitlistLast7: { value: recentWaitlist.length, note: waitlistNote ?? 'Always the last 7 days, whatever dates are selected.' }
    },
    series: dailySeries(days, rows.map(row => row.createdAt), waitlistDates),
    top: ['physique', 'goal', 'blockers', 'guide_wishlist'].map(questionId => topAnswer(breakdown(rows, questionId)))
  }
})
