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

function resolveProvider(): EmailProvider {
  const { emailProvider } = useRuntimeConfig()

  switch (emailProvider) {
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
