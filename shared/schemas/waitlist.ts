import { z } from 'zod'

export const waitlistSources = ['hero', 'waitlist_section', 'final_cta', 'survey'] as const

export type WaitlistSource = (typeof waitlistSources)[number]

export const emailField = z
  .string({ error: 'Please enter your email address' })
  .trim()
  .toLowerCase()
  .pipe(z.email('Please enter a valid email address'))
  .pipe(z.string().max(254, 'That email address is too long'))

/**
 * Optional: the only thing a signup genuinely needs is an email. An empty string
 * normalises to `undefined` so storage records "not given" rather than a blank name.
 */
export const firstNameField = z
  .string()
  .trim()
  .max(60, 'That name is a little too long')
  .transform(value => value || undefined)
  .optional()

export const waitlistInputSchema = z.object({
  firstName: firstNameField,
  email: emailField,
  source: z.enum(waitlistSources).default('waitlist_section')
})

export type WaitlistInput = z.input<typeof waitlistInputSchema>

export type WaitlistResult = {
  ok: true
  status: 'created' | 'already_subscribed'
  firstName?: string
}
