import { addDays, dayKey, eachDay } from './dates'
import { findQuestion, hasAnswer, labelFor, optionsFor, titleForKey } from '../survey-catalog'
import { asList, asText } from '../survey'
import type { AnalyticsRow, Breakdown, BreakdownItem, TopAnswer, TopicTrend } from './types'

function ratio(count: number, total: number) {
  return total ? count / total : 0
}

/**
 * Counts one question across rows. Percentages use the respondents who answered it as the
 * denominator, so optional and newer questions aren't diluted by people never asked. A
 * multi-choice value counts once per respondent even if it was somehow stored twice.
 */
export function breakdown(rows: AnalyticsRow[], questionId: string): Breakdown {
  const question = findQuestion(questionId)
  const multi = question?.type === 'multi'
  const counts = new Map<string, number>()
  let answered = 0

  for (const row of rows) {
    const value = row.answers[questionId]

    if (!hasAnswer(value)) {
      continue
    }

    answered++
    const choices = multi ? new Set(asList(value)) : new Set([asText(value)])

    for (const choice of choices) {
      counts.set(choice, (counts.get(choice) ?? 0) + 1)
    }
  }

  // Old-version values only appear when someone actually chose them.
  const items: BreakdownItem[] = optionsFor(questionId, { includeLegacy: false })
    .map(option => ({ value: option.value, label: option.label, count: counts.get(option.value) ?? 0, pct: 0 }))

  for (const [value, count] of counts) {
    if (!items.some(item => item.value === value)) {
      items.push({ value, label: labelFor(questionId, value), count, pct: 0 })
    }
  }

  for (const item of items) {
    item.pct = ratio(item.count, answered)
  }

  return {
    questionId,
    title: titleForKey(questionId),
    multi,
    total: rows.length,
    answered,
    unanswered: rows.length - answered,
    items
  }
}

export function ranked(items: BreakdownItem[]) {
  return [...items].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

export function topAnswer(data: Breakdown): TopAnswer {
  const [first, ...rest] = ranked(data.items).filter(item => item.count > 0)

  return {
    questionId: data.questionId,
    title: data.title,
    label: first?.label ?? null,
    count: first?.count ?? 0,
    pct: first?.pct ?? 0,
    answered: data.answered,
    tiedWith: first ? rest.filter(item => item.count === first.count).map(item => item.label) : []
  }
}

export function dailySeries(days: string[], responseDates: string[], waitlistDates: string[]) {
  const tally = (dates: string[]) => {
    const counts = new Map<string, number>()

    for (const date of dates) {
      const key = dayKey(date)
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }

    return counts
  }

  const responses = tally(responseDates)
  const waitlist = tally(waitlistDates)

  return days.map(day => ({ day, responses: responses.get(day) ?? 0, waitlist: waitlist.get(day) ?? 0 }))
}

/** The days a chart should span: the selected range, or the data's own span for "all time". */
export function seriesDays(range: { from?: string, to?: string }, dates: string[], todayKey: string) {
  const keys = dates.map(date => dayKey(date)).sort()
  const from = range.from ?? keys[0] ?? todayKey
  const to = range.to ?? todayKey

  return from <= to ? eachDay(from, to) : []
}

export const TREND_WINDOW_DAYS = 30
export const TREND_MIN_RESPONDENTS = 20

/**
 * Compares each value's share over the last 30 days with the 30 before. Both windows need
 * enough respondents to the question, otherwise the change is noise and is not reported.
 */
export function shareTrends(rows: AnalyticsRow[], questionId: string, todayKey: string) {
  const recentFrom = addDays(todayKey, -(TREND_WINDOW_DAYS - 1))
  const previousFrom = addDays(recentFrom, -TREND_WINDOW_DAYS)
  const previousTo = addDays(recentFrom, -1)

  const recentRows = rows.filter((row) => {
    const key = dayKey(row.createdAt)
    return key >= recentFrom && key <= todayKey
  })
  const previousRows = rows.filter((row) => {
    const key = dayKey(row.createdAt)
    return key >= previousFrom && key <= previousTo
  })

  const recent = breakdown(recentRows, questionId)
  const previous = breakdown(previousRows, questionId)
  const enough = recent.answered >= TREND_MIN_RESPONDENTS && previous.answered >= TREND_MIN_RESPONDENTS

  const trendFor = (value: string): TopicTrend => {
    if (!enough) {
      return { available: false, reason: `Needs at least ${TREND_MIN_RESPONDENTS} respondents in each 30-day window` }
    }

    const recentShare = recent.items.find(item => item.value === value)?.pct ?? 0
    const previousShare = previous.items.find(item => item.value === value)?.pct ?? 0

    return { available: true, recentShare, previousShare, change: recentShare - previousShare }
  }

  return {
    trendFor,
    window: {
      recent: `${recentFrom} to ${todayKey}`,
      previous: `${previousFrom} to ${previousTo}`,
      recentN: recent.answered,
      previousN: previous.answered,
      minimum: TREND_MIN_RESPONDENTS
    }
  }
}
