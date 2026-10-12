import { emailProviderNames, isWelcomeEmailConfigured } from '#shared/email'

/** What the privacy policy needs to describe the email setup truthfully. No secrets. */
export default defineEventHandler(() => {
  const { emailProvider, emailFrom, public: { contactEmail } } = useRuntimeConfig()

  return {
    provider: emailProviderNames[emailProvider] ?? null,
    welcomeEmail: isWelcomeEmailConfigured({ emailProvider, emailFrom, contactEmail })
  }
})
