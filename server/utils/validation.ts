import type { H3Event } from 'h3'
import type { ZodType } from 'zod'

export async function readValidatedJson<T>(event: H3Event, schema: ZodType<T>) {
  const body = await readBody(event).catch(() => null)
  const result = schema.safeParse(body)

  if (!result.success) {
    const fields: Record<string, string> = {}

    for (const issue of result.error.issues) {
      const field = issue.path.join('.') || 'form'

      if (!fields[field]) {
        fields[field] = issue.message
      }
    }

    throw createError({
      statusCode: 422,
      statusMessage: 'Validation failed',
      data: {
        message: Object.values(fields)[0] ?? 'Please check your details and try again.',
        fields
      }
    })
  }

  return result.data
}

export function persistenceError(error: unknown) {
  console.error('[maxi-fitness] persistence error', error)

  return createError({
    statusCode: 503,
    statusMessage: 'Storage unavailable',
    data: {
      message: 'Something went wrong on my end. Please try again in a moment.'
    }
  })
}
