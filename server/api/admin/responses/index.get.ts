import { z } from 'zod'
import { filtersSchema, parseAnswerMatch } from '#shared/analytics/filters'
import type { AnswerMatch } from '#shared/analytics/filters'
import type { ResponseListData, ResponseListItem } from '#shared/analytics/types'
import { findQuestion, labelFor, versionOf } from '#shared/survey-catalog'
import { OTHER_VALUE, asList, asText, otherKey } from '#shared/survey'
import type { SurveyAnswers } from '#shared/survey'

const listSchema = z.object({
  q: z.string().max(200).optional().default(''),
  sort: z.enum(responseSortFields).optional().default('date'),
  dir: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(5).max(100).optional().default(25),
  answer: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((value, context) => {
      const matches: AnswerMatch[] = []

      for (const raw of (value === undefined ? [] : [value].flat()).slice(0, 10)) {
        const match = parseAnswerMatch(raw)
        const question = match && findQuestion(match.questionId)

        if (!match || !question || question.type === 'text' || match.value.length > 120) {
          context.addIssue({ code: 'custom', message: 'Unknown answer filter' })
          return z.NEVER
        }

        matches.push(match)
      }

      return matches
    })
})

function single(answers: SurveyAnswers, questionId: string) {
  const value = asText(answers[questionId])

  if (!value) {
    return null
  }

  const other = asText(answers[otherKey(questionId)]).trim()
  return value === OTHER_VALUE && other ? `Other: ${other}` : labelFor(questionId, value)
}

function struggles(answers: SurveyAnswers) {
  const questionId = 'blockers' in answers ? 'blockers' : 'obstacles'
  return asList(answers[questionId]).map(value => labelFor(questionId, value))
}

export default defineAdminHandler(async (event): Promise<ResponseListData> => {
  const filters = readAdminQuery(event, filtersSchema)
  const query = readAdminQuery(event, listSchema)

  const { total, rows } = await listResponseRows({
    filters,
    answers: query.answer,
    search: query.q,
    sort: query.sort,
    direction: query.dir,
    page: query.page,
    pageSize: query.pageSize
  })

  return {
    generatedAt: new Date().toISOString(),
    total,
    page: query.page,
    pageSize: query.pageSize,
    items: rows.map<ResponseListItem>(row => ({
      id: row.id,
      createdAt: row.createdAt,
      version: versionOf(row.answers),
      physique: single(row.answers, 'physique'),
      goal: single(row.answers, 'goal'),
      experience: single(row.answers, 'experience'),
      struggles: struggles(row.answers),
      onWaitlist: row.onWaitlist
    }))
  }
})
