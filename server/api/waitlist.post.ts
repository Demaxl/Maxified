import { waitlistInputSchema } from '#shared/schemas/waitlist'
import type { WaitlistResult } from '#shared/schemas/waitlist'

export default defineEventHandler(async (event): Promise<WaitlistResult> => {
  const { surveyResponseId, ...input } = await readValidatedJson(event, waitlistInputSchema)

  let result

  try {
    result = await addWaitlistSubscriber(input)
  } catch (error) {
    throw persistenceError(error)
  }

  if (surveyResponseId) {
    // Analytics only: the signup has already succeeded, so a failed link must not fail it.
    await linkSurveyResponse(surveyResponseId, result.id).catch((error) => {
      console.error('[maxi-fitness] could not link survey response', error)
    })
  }

  if (result.status === 'created') {
    await syncSubscriber(event, input, result.id)
  }

  return {
    ok: true,
    status: result.status,
    firstName: input.firstName
  }
})
