import { eq } from 'drizzle-orm'
import { isDatabaseConfigured, schema, useDatabase, warnAboutMissingDatabase } from './db'
import type { SurveyAnswers } from '#shared/survey'
import type { WaitlistSource } from '#shared/schemas/waitlist'

type WaitlistRecord = {
  id: string
  firstName: string | null
  email: string
  source: WaitlistSource
  createdAt: string
}

type SurveyRecord = {
  id: string
  waitlistId: string | null
  email: string | null
  answers: SurveyAnswers
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
}

// `data:` is Nitro's persistent mount, so local submissions survive a restart.
function fallbackStorage<T>(collection: string) {
  return useStorage<T[]>(`data:maxi-fitness:${collection}`)
}

async function readFallback<T>(collection: string) {
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

export async function saveSurveyResponse(input: SaveSurveyInput) {
  if (!isDatabaseConfigured()) {
    warnAboutMissingDatabase()

    const records = await readFallback<SurveyRecord>('survey')
    const record: SurveyRecord = {
      id: crypto.randomUUID(),
      waitlistId: input.waitlistId ?? null,
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
      waitlistId: input.waitlistId ?? null
    })
    .returning({ id: schema.surveyResponses.id })

  return { id: created!.id }
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
