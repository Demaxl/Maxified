import { and, eq, gt, isNull } from 'drizzle-orm'
import { isDatabaseConfigured, schema, useDatabase, warnAboutMissingDatabase } from './db'
import type { SurveyAnswers } from '#shared/survey'
import type { WaitlistSource } from '#shared/schemas/waitlist'

export type WaitlistRecord = {
  id: string
  firstName: string | null
  email: string
  source: WaitlistSource
  createdAt: string
}

export type SurveyRecord = {
  id: string
  waitlistId: string | null
  /** Absent on records saved before start tracking existed. */
  startId?: string | null
  email: string | null
  answers: SurveyAnswers
  createdAt: string
}

export type SurveyStartRecord = {
  id: string
  createdAt: string
}

type AddSubscriberInput = {
  firstName?: string
  email: string
  source: WaitlistSource
}

type AddSubscriberResult = {
  id: string
  status: 'created' | 'already_subscribed'
}

type SaveSurveyInput = {
  answers: SurveyAnswers
  email?: string
  waitlistId?: string
  startId?: string
}

/** A post-survey signup can only claim a response this recent, and only once. */
const LINK_WINDOW_MS = 24 * 60 * 60 * 1000

// `data:` is Nitro's persistent mount, so local submissions survive a restart.
function fallbackStorage<T>(collection: string) {
  return useStorage<T[]>(`data:maxi-fitness:${collection}`)
}

export async function readFallback<T>(collection: string) {
  return (await fallbackStorage<T>(collection).getItem('records')) ?? []
}

async function writeFallback<T>(collection: string, records: T[]) {
  await fallbackStorage<T>(collection).setItem('records', records)
}

export async function addWaitlistSubscriber(input: AddSubscriberInput): Promise<AddSubscriberResult> {
  if (!isDatabaseConfigured()) {
    warnAboutMissingDatabase()

    const records = await readFallback<WaitlistRecord>('waitlist')
    const existing = records.find(record => record.email === input.email)

    if (existing) {
      return { id: existing.id, status: 'already_subscribed' }
    }

    const record: WaitlistRecord = {
      id: crypto.randomUUID(),
      firstName: input.firstName ?? null,
      email: input.email,
      source: input.source,
      createdAt: new Date().toISOString()
    }

    await writeFallback('waitlist', [...records, record])

    return { id: record.id, status: 'created' }
  }

  const db = useDatabase()

  const [created] = await db
    .insert(schema.waitlistSubscribers)
    .values({ ...input, firstName: input.firstName ?? null })
    .onConflictDoNothing({ target: schema.waitlistSubscribers.email })
    .returning({ id: schema.waitlistSubscribers.id })

  if (created) {
    return { id: created.id, status: 'created' }
  }

  const [existing] = await db
    .select({ id: schema.waitlistSubscribers.id })
    .from(schema.waitlistSubscribers)
    .where(eq(schema.waitlistSubscribers.email, input.email))
    .limit(1)

  return { id: existing!.id, status: 'already_subscribed' }
}

async function findSubscriberIdByEmail(email: string) {
  if (!isDatabaseConfigured()) {
    const records = await readFallback<WaitlistRecord>('waitlist')
    return records.find(record => record.email === email)?.id
  }

  const [existing] = await useDatabase()
    .select({ id: schema.waitlistSubscribers.id })
    .from(schema.waitlistSubscribers)
    .where(eq(schema.waitlistSubscribers.email, email))
    .limit(1)

  return existing?.id
}

/** Idempotent: the client may send the same attempt id more than once. */
export async function recordSurveyStart(id: string) {
  if (!isDatabaseConfigured()) {
    warnAboutMissingDatabase()

    const records = await readFallback<SurveyStartRecord>('survey-starts')

    if (!records.some(record => record.id === id)) {
      await writeFallback('survey-starts', [...records, { id, createdAt: new Date().toISOString() }])
    }

    return
  }

  await useDatabase()
    .insert(schema.surveyStarts)
    .values({ id })
    .onConflictDoNothing({ target: schema.surveyStarts.id })
}

export async function saveSurveyResponse(input: SaveSurveyInput) {
  // The start request can fail on a flaky connection; the attempt still happened, and the
  // response must never be lost to a missing parent row.
  if (input.startId) {
    await recordSurveyStart(input.startId)
  }

  const waitlistId = input.waitlistId ?? (input.email ? await findSubscriberIdByEmail(input.email) : undefined)

  if (!isDatabaseConfigured()) {
    warnAboutMissingDatabase()

    const records = await readFallback<SurveyRecord>('survey')
    const record: SurveyRecord = {
      id: crypto.randomUUID(),
      waitlistId: waitlistId ?? null,
      startId: input.startId ?? null,
      email: input.email ?? null,
      answers: input.answers,
      createdAt: new Date().toISOString()
    }

    await writeFallback('survey', [...records, record])

    return { id: record.id }
  }

  const db = useDatabase()

  const [created] = await db
    .insert(schema.surveyResponses)
    .values({
      answers: input.answers,
      email: input.email ?? null,
      waitlistId: waitlistId ?? null,
      startId: input.startId ?? null
    })
    .returning({ id: schema.surveyResponses.id })

  return { id: created!.id }
}

/** Links a just-submitted response to the signup made on the survey's thank-you screen. */
export async function linkSurveyResponse(responseId: string, waitlistId: string) {
  const cutoff = new Date(Date.now() - LINK_WINDOW_MS)

  if (!isDatabaseConfigured()) {
    const records = await readFallback<SurveyRecord>('survey')
    const record = records.find(item => item.id === responseId)

    if (record && !record.waitlistId && new Date(record.createdAt) > cutoff) {
      record.waitlistId = waitlistId
      await writeFallback('survey', records)
    }

    return
  }

  await useDatabase()
    .update(schema.surveyResponses)
    .set({ waitlistId })
    .where(and(
      eq(schema.surveyResponses.id, responseId),
      isNull(schema.surveyResponses.waitlistId),
      gt(schema.surveyResponses.createdAt, cutoff)
    ))
}

export async function markWaitlistSubscriberSynced(id: string) {
  if (!isDatabaseConfigured()) {
    return
  }

  await useDatabase()
    .update(schema.waitlistSubscribers)
    .set({ syncedAt: new Date() })
    .where(eq(schema.waitlistSubscribers.id, id))
}
