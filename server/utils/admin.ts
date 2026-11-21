import type { H3Event } from 'h3'
import type { ZodType } from 'zod'
import { filtersSchema } from '#shared/analytics/filters'

/** Parses query parameters, answering 422 with the first problem instead of guessing. */
export function readAdminQuery<T>(event: H3Event, schema: ZodType<T>) {
  const result = schema.safeParse(getQuery(event))

  if (!result.success) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Invalid query',
      data: { message: result.error.issues[0]?.message ?? 'Invalid filters' }
    })
  }

  return result.data
}

export function readAdminFilters(event: H3Event) {
  return readAdminQuery(event, filtersSchema)
}

/** Every /api/admin handler calls this first; nothing private is read before it passes. */
export async function requireAdmin(event: H3Event) {
  const session = await getUserSession(event)

  if (session.user?.role !== 'admin') {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  return session
}

/** An admin-only handler: checks the session first and reports storage failures as 503. */
export function defineAdminHandler<T>(handler: (event: H3Event) => Promise<T>) {
  return defineEventHandler(async (event) => {
    await requireAdmin(event)

    try {
      return await handler(event)
    } catch (error) {
      if (isError(error)) {
        throw error
      }

      console.error('[maxi-fitness] admin data error', error)
      throw createError({
        statusCode: 503,
        statusMessage: 'Data unavailable',
        data: { message: 'The survey data couldn\'t be loaded. Check the database connection and try again.' }
      })
    }
  })
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return new Uint8Array(digest)
}

/** Hashing first gives both sides the same length, so the comparison time doesn't leak it. */
export async function passwordMatches(candidate: string, expected: string) {
  const [a, b] = await Promise.all([sha256(candidate), sha256(expected)])
  let difference = 0

  for (let index = 0; index < a.length; index++) {
    difference |= a[index]! ^ b[index]!
  }

  return difference === 0
}
