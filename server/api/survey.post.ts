import { surveyInputSchema } from '#shared/schemas/survey'
import type { SurveyResult } from '#shared/schemas/survey'
import type { SurveyAnswers } from '#shared/survey'

export default defineEventHandler(async (event): Promise<SurveyResult> => {
  const input = await readValidatedJson(event, surveyInputSchema)
  const shouldJoinWaitlist = input.joinWaitlist && Boolean(input.email)

  let waitlist: SurveyResult['waitlist'] = 'skipped'
  let waitlistId: string | undefined

  try {
    if (shouldJoinWaitlist) {
      const subscriber = await addWaitlistSubscriber({
        firstName: input.firstName,
        email: input.email!,
        source: 'survey'
      })

      waitlist = subscriber.status
      waitlistId = subscriber.id
    }

    await saveSurveyResponse({
      answers: input.answers as SurveyAnswers,
      email: input.email,
      waitlistId
    })
  } catch (error) {
    throw persistenceError(error)
  }

  if (shouldJoinWaitlist && waitlist === 'created' && waitlistId) {
    await syncSubscriber(
      event,
      { firstName: input.firstName, email: input.email!, source: 'survey' },
      waitlistId
    )
  }

  return { ok: true, waitlist }
})
