import { z } from 'zod'
import { answerEntries, versionOf } from '#shared/survey-catalog'

const idSchema = z.uuid('Unknown response')

export default defineAdminHandler(async (event) => {
  const parsed = idSchema.safeParse(getRouterParam(event, 'id'))

  if (!parsed.success) {
    throw createError({ statusCode: 404, statusMessage: 'Response not found' })
  }

  const row = await getResponseRow(parsed.data)

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Response not found' })
  }

  return {
    id: row.id,
    createdAt: row.createdAt,
    version: versionOf(row.answers),
    onWaitlist: row.onWaitlist,
    tracked: Boolean(row.startId),
    entries: answerEntries(row.answers)
  }
})
