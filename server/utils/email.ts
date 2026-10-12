import type { WaitlistSource } from '#shared/schemas/waitlist'

export type SubscriberPayload = {
  email: string
  firstName?: string
  source: WaitlistSource
}

/**
 * Contract for an email marketing service. Implement `subscribe` against Resend,
 * Loops, Mailchimp or ConvertKit and register it in `resolveProvider` — nothing
 * else in the app needs to change.
 */
export type EmailProvider = {
  name: string
  subscribe: (payload: SubscriberPayload) => Promise<void>
}

const noopProvider: EmailProvider = {
  name: 'none',
  async subscribe() {}
}

/** Signups wait on this request, so a slow Resend response must not hold them up for long. */
const RESEND_TIMEOUT_MS = 5000

/**
 * Adds the subscriber as a Resend contact in the configured segment
 * (`NUXT_EMAIL_AUDIENCE_ID` holds the segment ID — Resend renamed audiences to segments).
 */
function createResendProvider(apiKey: string, segmentId: string): EmailProvider {
  const resend = $fetch.create({
    baseURL: 'https://api.resend.com',
    headers: { Authorization: `Bearer ${apiKey}` },
    timeout: RESEND_TIMEOUT_MS
  })

  return {
    name: 'resend',
    async subscribe({ email, firstName }) {
      if (!apiKey || !segmentId) {
        throw new Error('NUXT_EMAIL_API_KEY and NUXT_EMAIL_AUDIENCE_ID must both be set for Resend')
      }

      try {
        await resend('/contacts', {
          method: 'POST',
          body: { email, first_name: firstName, segments: [{ id: segmentId }] }
        })
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode

        // Auth, rate-limit and server errors would fail the fallback the same way.
        if (!status || status === 401 || status === 403 || status === 429 || status >= 500) {
          throw error
        }

        // Resend doesn't document its duplicate-contact response, so any other rejection
        // is retried as "add the existing contact to the segment". That only succeeds if
        // the contact exists; otherwise the original error is the useful one.
        await resend(`/contacts/${encodeURIComponent(email)}/segments/${segmentId}`, {
          method: 'POST'
        }).catch(() => {
          throw error
        })
      }
    }
  }
}

function resolveProvider(): EmailProvider {
  const { emailProvider, emailApiKey, emailAudienceId } = useRuntimeConfig()

  switch (emailProvider) {
    case 'resend':
      return createResendProvider(emailApiKey, emailAudienceId)
    default:
      return noopProvider
  }
}

export function useEmailProvider() {
  return resolveProvider()
}

/**
 * Sync failures must never block a signup that is already persisted, so the
 * error is logged and swallowed.
 */
export async function syncSubscriber(payload: SubscriberPayload, subscriberId: string) {
  const provider = useEmailProvider()

  if (provider.name === 'none') {
    return
  }

  try {
    await provider.subscribe(payload)
    await markWaitlistSubscriberSynced(subscriberId)
  } catch (error) {
    console.error(`[maxi-fitness] failed to sync ${payload.email} with ${provider.name}`, error)
  }
}
