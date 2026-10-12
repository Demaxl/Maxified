import { z } from 'zod'
import { emailField, firstNameField } from './waitlist'
import { isQuestionAnswered, surveyAnswerKeys, surveyQuestions } from '../survey'
import type { SurveyAnswers } from '../survey'

const answerValueSchema = z.union([
  z.string().max(2000, 'That answer is too long'),
  z.array(z.string().max(120)).max(25)
])

const answersSchema = z
  .record(z.string(), answerValueSchema)
  .refine(
    answers => Object.keys(answers).every(key => surveyAnswerKeys.includes(key)),
    'Unexpected survey answer'
  )
  .refine(
    answers => surveyQuestions.every(question => isQuestionAnswered(question, answers as SurveyAnswers)),
    'Please answer every required question'
  )
  .refine(
    (answers) => {
      return surveyQuestions.every((question) => {
        if (question.type !== 'multi' || !question.maxSelections) {
          return true
        }

        const value = answers[question.id]

        return !Array.isArray(value) || value.length <= question.maxSelections
      })
    },
    'Too many options selected'
  )

export const surveyInputSchema = z.object({
  answers: answersSchema,
  joinWaitlist: z.boolean().default(false),
  firstName: firstNameField,
  email: emailField.optional()
}).refine(
  input => !input.joinWaitlist || Boolean(input.email),
  { message: 'An email address is required to join the waitlist', path: ['email'] }
)

export type SurveyInput = z.input<typeof surveyInputSchema>

export type SurveyResult = {
  ok: true
  waitlist: 'created' | 'already_subscribed' | 'skipped'
}
