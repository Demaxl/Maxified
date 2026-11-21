import { surveyStartSchema } from '#shared/schemas/survey'

export default defineEventHandler(async (event) => {
  const { id } = await readValidatedJson(event, surveyStartSchema)

  try {
    await recordSurveyStart(id)
  } catch (error) {
    throw persistenceError(error)
  }

  return { ok: true }
})
