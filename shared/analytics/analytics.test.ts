import { describe, expect, it } from 'vitest'
import { breakdown, dailySeries, shareTrends, topAnswer } from './aggregate'
import { addDays, dayKey, presetRange, rangeInstants, startOfDay } from './dates'
import { filtersSchema, matchesFilters, matchesSearch } from './filters'
import { prioritiseTopics, priorityConfig } from './priority'
import { answerEntries, labelFor, optionsFor, versionOf } from '../survey-catalog'
import { surveyQuestions } from '../survey'
import type { SurveyAnswers } from '../survey'
import type { AnalyticsRow } from './types'

let nextId = 0

function row(answers: SurveyAnswers, createdAt = '2026-10-10T12:00:00.000Z'): AnalyticsRow {
  return { id: String(nextId++), createdAt, answers, onWaitlist: null, startId: null }
}

describe('breakdown', () => {
  it('uses respondents who answered as the denominator for single choice', () => {
    const rows = [row({ physique: 'skinny' }), row({ physique: 'skinny' }), row({ physique: 'average' }), row({})]
    const result = breakdown(rows, 'physique')

    expect(result.answered).toBe(3)
    expect(result.unanswered).toBe(1)
    expect(result.items.find(item => item.value === 'skinny')).toMatchObject({ count: 2, pct: 2 / 3 })
    expect(result.items.find(item => item.value === 'overweight')?.count).toBe(0)
  })

  it('counts multi-choice values per respondent and lets shares exceed 100% in total', () => {
    const rows = [
      row({ blockers: ['i_struggle_with_consistency', 'i_struggle_with_consistency', 'i_don_t_have_enough_time'] }),
      row({ blockers: ['i_struggle_with_consistency'] }),
      row({ blockers: [] })
    ]
    const result = breakdown(rows, 'blockers')

    expect(result.multi).toBe(true)
    expect(result.answered).toBe(2)
    expect(result.items.find(item => item.value === 'i_struggle_with_consistency')).toMatchObject({ count: 2, pct: 1 })
    expect(result.items.reduce((sum, item) => sum + item.pct, 0)).toBeGreaterThan(1)
  })

  it('keeps old-version and unknown values as their own buckets', () => {
    const result = breakdown([row({ experience: 'more_than_a_year' }), row({ experience: 'mystery_value' })], 'experience')

    expect(result.items.find(item => item.value === 'more_than_a_year')?.label).toBe('More than a year (v1 survey)')
    expect(result.items.find(item => item.value === 'mystery_value')?.label).toBe('Mystery value')
  })

  it('reports ties instead of a single winner', () => {
    const top = topAnswer(breakdown([row({ goal: 'lose_fat' }), row({ goal: 'build_muscle' })], 'goal'))

    expect(top.count).toBe(1)
    expect(top.tiedWith).toHaveLength(1)
  })
})

describe('dates', () => {
  it('buckets by Lagos calendar day', () => {
    // 23:30 UTC is 00:30 the next day in Lagos (UTC+1).
    expect(dayKey('2026-10-10T23:30:00.000Z')).toBe('2026-10-11')
    expect(startOfDay('2026-10-11').toISOString()).toBe('2026-10-10T23:00:00.000Z')
  })

  it('treats ranges as inclusive days', () => {
    const { start, end } = rangeInstants({ from: '2026-10-01', to: '2026-10-07' })

    expect(start?.toISOString()).toBe('2026-09-30T23:00:00.000Z')
    expect(end?.toISOString()).toBe('2026-10-07T23:00:00.000Z')
    expect(presetRange('7d', new Date('2026-10-19T12:00:00Z'))).toEqual({ from: '2026-10-13', to: '2026-10-19' })
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
  })

  it('fills every day in a series', () => {
    const series = dailySeries(['2026-10-10', '2026-10-11'], ['2026-10-10T08:00:00Z'], ['2026-10-11T08:00:00Z', '2026-10-11T09:00:00Z'])

    expect(series).toEqual([
      { day: '2026-10-10', responses: 1, waitlist: 0 },
      { day: '2026-10-11', responses: 0, waitlist: 2 }
    ])
  })
})

describe('filters', () => {
  it('parses repeated and single query values', () => {
    const filters = filtersSchema.parse({ physique: 'skinny', experience: ['less_than_3_months', '3_6_months'], from: '2026-10-01' })

    expect(filters.physique).toEqual(['skinny'])
    expect(filters.experience).toHaveLength(2)
    expect(filters.goal).toEqual([])
  })

  it('combines filters with AND across fields and OR within a field', () => {
    const filters = filtersSchema.parse({ physique: ['skinny', 'skinny_fat'], days: '3' })

    expect(matchesFilters(row({ physique: 'skinny_fat', days_per_week: '3' }), filters)).toBe(true)
    expect(matchesFilters(row({ physique: 'skinny_fat', days_per_week: '4' }), filters)).toBe(false)
    expect(matchesFilters(row({ physique: 'average', days_per_week: '3' }), filters)).toBe(false)
  })

  it('searches free text case-insensitively', () => {
    expect(matchesSearch({ already_tried: 'Keto diet' }, 'keto')).toBe(true)
    expect(matchesSearch({ already_tried: 'Keto diet' }, 'vegan')).toBe(false)
  })
})

describe('catalog', () => {
  it('detects survey versions and keeps v1 wording', () => {
    const v1 = { goal: 'lose_fat', obstacles: ['consistency'] }

    expect(versionOf(v1)).toBe('v1')
    expect(versionOf({ physique: 'skinny' })).toBe('v2')
    expect(labelFor('obstacles', 'consistency')).toBe('Consistency')

    const entries = answerEntries(v1)
    expect(entries.find(entry => entry.key === 'goal')?.title).toBe('What is your main fitness goal?')
    expect(entries.find(entry => entry.key === 'burning_question')?.value).toBeNull()
  })

  it('lists every current question for v2 responses, including unanswered ones', () => {
    const entries = answerEntries({ physique: 'other', physique__other: 'Lean', unexpected_key: 'kept' })

    for (const question of surveyQuestions) {
      expect(entries.some(entry => entry.key === question.id)).toBe(true)
    }

    expect(entries.find(entry => entry.key === 'physique__other')?.value).toEqual(['Lean'])
    expect(entries.find(entry => entry.key === 'unexpected_key')?.value).toEqual(['kept'])
  })
})

describe('priority', () => {
  it('only maps topics and struggles that exist in the survey', () => {
    const values = (id: string) => new Set(optionsFor(id).map(option => option.value))
    const topicValues = values('guide_wishlist')
    const struggleValues = values('blockers')

    for (const [topic, struggles] of Object.entries(priorityConfig.topicStruggles)) {
      expect(topicValues.has(topic), topic).toBe(true)

      for (const struggle of struggles) {
        expect(struggleValues.has(struggle), struggle).toBe(true)
      }
    }
  })

  it('never marks a topic core on a tiny sample', () => {
    const rows = Array.from({ length: 5 }, () => row({ physique: 'skinny', guide_wishlist: ['meal_plans'], blockers: ['i_don_t_know_how_to_eat_for_my_goal'] }))
    const { priorities } = prioritiseTopics(rows)

    expect(priorities.get('meal_plans')?.tier).toBe('optional')
    expect(priorities.get('supplements')?.tier).toBe('low_signal')
  })
})

describe('trends', () => {
  it('withholds trends without enough respondents in both windows', () => {
    const { trendFor } = shareTrends([row({ guide_wishlist: ['meal_plans'] }, '2026-10-18T12:00:00Z')], 'guide_wishlist', '2026-10-19')

    expect(trendFor('meal_plans').available).toBe(false)
  })

  it('reports the change in share when both windows are large enough', () => {
    const recent = Array.from({ length: 20 }, (_, index) => row({ guide_wishlist: index < 10 ? ['meal_plans'] : ['supplements'] }, '2026-10-15T12:00:00Z'))
    const previous = Array.from({ length: 20 }, (_, index) => row({ guide_wishlist: index < 5 ? ['meal_plans'] : ['supplements'] }, '2026-09-10T12:00:00Z'))
    const trend = shareTrends([...recent, ...previous], 'guide_wishlist', '2026-10-19').trendFor('meal_plans')

    expect(trend).toMatchObject({ available: true, recentShare: 0.5, previousShare: 0.25 })
  })
})
