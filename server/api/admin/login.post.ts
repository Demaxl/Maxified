import { z } from 'zod'

const loginSchema = z.object({
  password: z.string({ error: 'Please enter the password' }).min(1, 'Please enter the password').max(200)
})

/** Slows down guessing; there's no shared store on Cloudflare for a per-IP counter. */
const FAILURE_DELAY_MS = 1200

export default defineEventHandler(async (event) => {
  const { password } = await readValidatedJson(event, loginSchema)
  const expected = useRuntimeConfig(event).adminPassword || process.env.NUXT_ADMIN_PASSWORD || ''

  if (!expected) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Admin access is not configured',
      data: { message: 'Set NUXT_ADMIN_PASSWORD to enable the dashboard.' }
    })
  }

  if (!(await passwordMatches(password, expected))) {
    await new Promise(resolve => setTimeout(resolve, FAILURE_DELAY_MS))
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      data: { message: 'That password isn\'t right.' }
    })
  }

  await setUserSession(event, {
    user: { role: 'admin' },
    loggedInAt: new Date().toISOString()
  })

  return { ok: true }
})
