import { and, asc, count, desc, eq, gte, inArray, lt, min, sql } from 'drizzle-orm'
import type { AnyColumn, SQL } from 'drizzle-orm'
import { isDatabaseConfigured, schema, useDatabase } from './db'
import { readFallback } from './store'
import type { SurveyRecord, SurveyStartRecord, WaitlistRecord } from './store'
import { isInRange, rangeInstants } from '#shared/analytics/dates'
import type { DateRange } from '#shared/analytics/dates'
import { matchesAnswers, matchesFilters, matchesSearch, segmentFields } from '#shared/analytics/filters'
import type { AnalyticsFilters, AnswerMatch, SegmentField } from '#shared/analytics/filters'
import type { AnalyticsRow } from '#shared/analytics/types'
import type { SurveyAnswers } from '#shared/survey'

/**
 * The only place the dashboard reads survey data. Postgres does the filtering; the local
 * Nitro storage fallback applies the same filters in memory so development matches.
 */

const responses = schema.surveyResponses
const subscribers = schema.waitlistSubscribers
const starts = schema.surveyStarts

export const responseSortFields = ['date', 'physique', 'goal', 'experience'] as const
export type ResponseSortField = (typeof responseSortFields)[number]

export type ResponseQuery = {
  filters: AnalyticsFilters
  answers: AnswerMatch[]
  search: string
  sort: ResponseSortField
  direction: 'asc' | 'desc'
  page: number
  pageSize: number
}

const onWaitlistSql = sql<boolean | null>`case
  when ${responses.waitlistId} is not null
    or exists (select 1 from ${subscribers} where ${subscribers.email} = ${responses.email}) then true
  when ${responses.startId} is not null then false
  else null
end`

function dateConditions(column: AnyColumn, range: Partial<DateRange>) {
  const { start, end } = rangeInstants(range)
  return [start ? gte(column, start) : undefined, end ? lt(column, end) : undefined]
}

function responseConditions(filters: AnalyticsFilters, search = '', answers: AnswerMatch[] = []) {
  const conditions: (SQL | undefined)[] = dateConditions(responses.createdAt, filters)

  for (const [field, questionId] of Object.entries(segmentFields) as [SegmentField, string][]) {
    if (filters[field].length) {
      conditions.push(inArray(sql`${responses.answers}->>${questionId}`, filters[field]))
    }
  }

  // jsonb containment matches a string answer and a value inside an array answer alike.
  for (const { questionId, value } of answers) {
    conditions.push(sql`${responses.answers}->${questionId} @> to_jsonb(${value}::text)`)
  }

  const needle = search.trim()

  if (needle) {
    const pattern = `%${needle.replace(/[\\%_]/g, match => `\\${match}`)}%`
    conditions.push(sql`${responses.answers}::text ilike ${pattern}`)
  }

  return and(...conditions)
}

function toIso(value: Date | string) {
  return typeof value === 'string' ? new Date(value).toISOString() : value.toISOString()
}

function fallbackOnWaitlist(record: SurveyRecord, emails: Set<string>) {
  if (record.waitlistId || (record.email && emails.has(record.email))) {
    return true
  }

  return record.startId ? false : null
}

async function fallbackRows() {
  const [records, waitlist] = await Promise.all([
    readFallback<SurveyRecord>('survey'),
    readFallback<WaitlistRecord>('waitlist')
  ])
  const emails = new Set(waitlist.map(item => item.email))

  return records.map<AnalyticsRow>(record => ({
    id: record.id,
    createdAt: record.createdAt,
    answers: record.answers ?? {},
    onWaitlist: fallbackOnWaitlist(record, emails),
    startId: record.startId ?? null
  }))
}

export async function loadResponseRows(filters: AnalyticsFilters): Promise<AnalyticsRow[]> {
  if (!isDatabaseConfigured()) {
    return (await fallbackRows()).filter(row => matchesFilters(row, filters))
  }

  const rows = await useDatabase()
    .select({
      id: responses.id,
      createdAt: responses.createdAt,
      answers: responses.answers,
      onWaitlist: onWaitlistSql,
      startId: responses.startId
    })
    .from(responses)
    .where(responseConditions(filters))
    .orderBy(asc(responses.createdAt))

  return rows.map(row => ({
    id: row.id,
    createdAt: toIso(row.createdAt),
    answers: (row.answers ?? {}) as SurveyAnswers,
    onWaitlist: row.onWaitlist,
    startId: row.startId
  }))
}

/** Signup timestamps only: the dashboard never needs subscriber names or emails. */
export async function loadWaitlistDates(range: Partial<DateRange>) {
  if (!isDatabaseConfigured()) {
    const records = await readFallback<WaitlistRecord>('waitlist')
    return records.filter(record => isInRange(record.createdAt, range)).map(record => record.createdAt)
  }

  const rows = await useDatabase()
    .select({ createdAt: subscribers.createdAt })
    .from(subscribers)
    .where(and(...dateConditions(subscribers.createdAt, range)))

  return rows.map(row => toIso(row.createdAt))
}

/** Survey attempts in range, each marked with whether a response completed it. */
export async function loadSurveyStarts(range: Partial<DateRange>) {
  if (!isDatabaseConfigured()) {
    const [records, surveys] = await Promise.all([
      readFallback<SurveyStartRecord>('survey-starts'),
      readFallback<SurveyRecord>('survey')
    ])
    const completed = new Set(surveys.map(survey => survey.startId).filter(Boolean))

    return records
      .filter(record => isInRange(record.createdAt, range))
      .map(record => ({ createdAt: record.createdAt, completed: completed.has(record.id) }))
  }

  const rows = await useDatabase()
    .select({
      createdAt: starts.createdAt,
      completed: sql<boolean>`exists (select 1 from ${responses} where ${responses.startId} = ${starts.id})`
    })
    .from(starts)
    .where(and(...dateConditions(starts.createdAt, range)))

  return rows.map(row => ({ createdAt: toIso(row.createdAt), completed: Boolean(row.completed) }))
}

/** When server-side start tracking began, or null if no attempt has been recorded yet. */
export async function trackingStartedAt() {
  if (!isDatabaseConfigured()) {
    const records = await readFallback<SurveyStartRecord>('survey-starts')
    return records.map(record => record.createdAt).sort()[0] ?? null
  }

  const [row] = await useDatabase().select({ first: min(starts.createdAt) }).from(starts)

  return row?.first ? toIso(row.first) : null
}

export async function countAll() {
  if (!isDatabaseConfigured()) {
    const [surveys, waitlist] = await Promise.all([
      readFallback<SurveyRecord>('survey'),
      readFallback<WaitlistRecord>('waitlist')
    ])
    return { responses: surveys.length, waitlist: waitlist.length }
  }

  const db = useDatabase()
  const [[surveyCount], [waitlistCount]] = await Promise.all([
    db.select({ value: count() }).from(responses),
    db.select({ value: count() }).from(subscribers)
  ])

  return { responses: surveyCount?.value ?? 0, waitlist: waitlistCount?.value ?? 0 }
}

function sortKey(row: AnalyticsRow, sort: ResponseSortField) {
  if (sort === 'date') {
    return row.createdAt
  }

  const value = row.answers[sort]
  return typeof value === 'string' ? value : ''
}

export async function listResponseRows(query: ResponseQuery) {
  const offset = (query.page - 1) * query.pageSize

  if (!isDatabaseConfigured()) {
    const direction = query.direction === 'asc' ? 1 : -1
    const rows = (await fallbackRows())
      .filter(row =>
        matchesFilters(row, query.filters)
        && matchesAnswers(row.answers, query.answers)
        && matchesSearch(row.answers, query.search))
      .sort((a, b) => direction * sortKey(a, query.sort).localeCompare(sortKey(b, query.sort)) || b.createdAt.localeCompare(a.createdAt))

    return { total: rows.length, rows: rows.slice(offset, offset + query.pageSize) }
  }

  const db = useDatabase()
  const where = responseConditions(query.filters, query.search, query.answers)
  const order = query.direction === 'asc' ? asc : desc
  const sortColumn = query.sort === 'date' ? responses.createdAt : sql`${responses.answers}->>${query.sort}`

  const [rows, [total]] = await Promise.all([
    db
      .select({
        id: responses.id,
        createdAt: responses.createdAt,
        answers: responses.answers,
        onWaitlist: onWaitlistSql,
        startId: responses.startId
      })
      .from(responses)
      .where(where)
      .orderBy(order(sortColumn), desc(responses.createdAt))
      .limit(query.pageSize)
      .offset(offset),
    db.select({ value: count() }).from(responses).where(where)
  ])

  return {
    total: total?.value ?? 0,
    rows: rows.map<AnalyticsRow>(row => ({
      id: row.id,
      createdAt: toIso(row.createdAt),
      answers: (row.answers ?? {}) as SurveyAnswers,
      onWaitlist: row.onWaitlist,
      startId: row.startId
    }))
  }
}

export async function getResponseRow(id: string) {
  if (!isDatabaseConfigured()) {
    return (await fallbackRows()).find(row => row.id === id) ?? null
  }

  const [row] = await useDatabase()
    .select({
      id: responses.id,
      createdAt: responses.createdAt,
      answers: responses.answers,
      onWaitlist: onWaitlistSql,
      startId: responses.startId
    })
    .from(responses)
    .where(eq(responses.id, id))
    .limit(1)

  return row
    ? {
      id: row.id,
      createdAt: toIso(row.createdAt),
      answers: (row.answers ?? {}) as SurveyAnswers,
      onWaitlist: row.onWaitlist,
      startId: row.startId
    } satisfies AnalyticsRow
    : null
}
