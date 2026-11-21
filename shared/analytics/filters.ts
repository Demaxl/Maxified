import { z } from 'zod'
import { DAY_PATTERN, isInRange } from './dates'
import { asList, asText } from '../survey'
import type { SurveyAnswers } from '../survey'

/** Each segment filter and the question whose single answer it matches. */
export const segmentFields = {
  physique: 'physique',
  experience: 'experience',
  goal: 'goal',
  days: 'days_per_week',
  location: 'usual_training_location'
} as const

export type SegmentField = keyof typeof segmentFields

export const segmentFieldLabels: Record<SegmentField, string> = {
  physique: 'Physique',
  experience: 'Experience',
  goal: 'Main goal',
  days: 'Days per week',
  location: 'Training location'
}

const list = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform(value => (value === undefined ? [] : [value].flat()).filter(Boolean).slice(0, 25))
  .pipe(z.array(z.string().max(120)))

const day = z.string().regex(DAY_PATTERN, 'Use YYYY-MM-DD').optional().or(z.literal('').transform(() => undefined))

export const filtersSchema = z.object({
  from: day,
  to: day,
  physique: list,
  experience: list,
  goal: list,
  days: list,
  location: list
}).refine(value => !value.from || !value.to || value.from <= value.to, { message: 'The start date must be before the end date', path: ['from'] })

export type AnalyticsFilters = z.output<typeof filtersSchema>

export function hasSegmentFilters(filters: AnalyticsFilters) {
  return (Object.keys(segmentFields) as SegmentField[]).some(field => filters[field].length > 0)
}

export function matchesSegment(answers: SurveyAnswers, filters: Pick<AnalyticsFilters, SegmentField>) {
  return (Object.entries(segmentFields) as [SegmentField, string][]).every(([field, questionId]) => {
    const wanted = filters[field]
    return !wanted?.length || wanted.includes(asText(answers[questionId]))
  })
}

export function matchesFilters(row: { createdAt: string, answers: SurveyAnswers }, filters: AnalyticsFilters) {
  return isInRange(row.createdAt, filters) && matchesSegment(row.answers, filters)
}

/** "This answer includes this value", for any choice question; used when a chart bar is clicked. */
export type AnswerMatch = { questionId: string, value: string }

export function parseAnswerMatch(raw: string): AnswerMatch | null {
  const separator = raw.indexOf(':')

  if (separator < 1 || separator === raw.length - 1) {
    return null
  }

  return { questionId: raw.slice(0, separator), value: raw.slice(separator + 1) }
}

export function matchesAnswers(answers: SurveyAnswers, matches: AnswerMatch[]) {
  return matches.every(({ questionId, value }) => {
    const stored = answers[questionId]
    return Array.isArray(stored) ? stored.includes(value) : stored === value
  })
}

/** Free-text search over every stored answer value, choices included. */
export function matchesSearch(answers: SurveyAnswers, query: string) {
  const needle = query.trim().toLowerCase()

  if (!needle) {
    return true
  }

  return Object.values(answers).some(value =>
    (Array.isArray(value) ? asList(value) : [asText(value)]).some(item => item.toLowerCase().includes(needle))
  )
}
