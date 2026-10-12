/** Display names for the supported `NUXT_EMAIL_PROVIDER` values, used in the privacy policy. */
export const emailProviderNames: Record<string, string> = {
  resend: 'Resend'
}

type EmailSettings = {
  emailProvider: string
  emailFrom: string
  contactEmail: string
}

/**
 * The welcome email goes out only when it can be sent from a verified address and
 * replies reach a real inbox — "reply and I'll remove you" is its only way off the list.
 */
export function isWelcomeEmailConfigured({ emailProvider, emailFrom, contactEmail }: EmailSettings) {
  return emailProvider in emailProviderNames && Boolean(emailFrom) && Boolean(contactEmail)
}
