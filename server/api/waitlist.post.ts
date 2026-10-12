import { waitlistInputSchema } from '#shared/schemas/waitlist'
import type { WaitlistResult } from '#shared/schemas/waitlist'

export default defineEventHandler(async (event): Promise<WaitlistResult> => {
  const input = await readValidatedJson(event, waitlistInputSchema)

  let result

  try {
    result = await addWaitlistSubscriber(input)
  } catch (error) {
    throw persistenceError(error)
  }

  if (result.status === 'created') {
    await syncSubscriber(input, result.id)
  }

  return {
    ok: true,
    status: result.status,
    firstName: input.firstName
  }
})
