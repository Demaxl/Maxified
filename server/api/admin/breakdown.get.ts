import { z } from 'zod'
import { breakdown } from '#shared/analytics/aggregate'
import type { BreakdownData } from '#shared/analytics/types'
import { findQuestion } from '#shared/survey-catalog'

const questionsSchema = z.object({
  questions: z
    .string({ error: 'Choose at least one question' })
    .transform(value => [...new Set(value.split(',').map(item => item.trim()).filter(Boolean))])
    .pipe(z
      .array(z.string().refine((id) => {
        const question = findQuestion(id)
        return Boolean(question && question.type !== 'text')
      }, 'Unknown or free-text question'))
      .min(1, 'Choose at least one question')
      .max(12))
})

export default defineAdminHandler(async (event): Promise<BreakdownData> => {
  const filters = readAdminFilters(event)
  const { questions } = readAdminQuery(event, questionsSchema)
  const rows = await loadResponseRows(filters)

  return {
    generatedAt: new Date().toISOString(),
    n: rows.length,
    breakdowns: Object.fromEntries(questions.map(id => [id, breakdown(rows, id)]))
  }
})
