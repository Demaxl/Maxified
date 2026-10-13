import type { H3Event } from 'h3'
import type { WaitlistSource } from '#shared/schemas/waitlist'
import { isWelcomeEmailConfigured } from '#shared/email'

export type SubscriberPayload = {
  email: string
  firstName?: string
  source: WaitlistSource
}

export type OutgoingEmail = {
  from: string
  to: string
  replyTo: string
  subject: string
  html: string
  text: string
  /** Lets the provider drop a duplicate send if the same signup is processed twice. */
  idempotencyKey: string
}

/**
 * Contract for an email service. Implement `subscribe` (and `send`, if the service
 * delivers individual emails) against Loops, Mailchimp or Kit and register it in
 * `resolveProvider` — nothing else in the app needs to change.
 */
export type EmailProvider = {
  name: string
  subscribe: (payload: SubscriberPayload) => Promise<void>
  /** Without it, no welcome email is sent. */
  send?: (email: OutgoingEmail) => Promise<void>
}

const noopProvider: EmailProvider = {
  name: 'none',
  async subscribe() {}
}

/** Signups wait on these requests, so a slow Resend response must not hold them up for long. */
const RESEND_TIMEOUT_MS = 5000

/**
 * Adds the subscriber as a Resend contact in the configured segment
 * (`NUXT_EMAIL_AUDIENCE_ID` holds the segment ID — Resend renamed audiences to segments)
 * and sends individual emails through Resend's email API.
 */
function createResendProvider(apiKey: string, segmentId: string): EmailProvider {
  const resend = $fetch.create({
    baseURL: 'https://api.resend.com',
    headers: { Authorization: `Bearer ${apiKey}` },
    timeout: RESEND_TIMEOUT_MS
  })

  function requireApiKey() {
    if (!apiKey) {
      throw new Error('NUXT_EMAIL_API_KEY must be set for Resend')
    }
  }

  return {
    name: 'resend',
    async subscribe({ email, firstName }) {
      requireApiKey()

      if (!segmentId) {
        throw new Error('NUXT_EMAIL_AUDIENCE_ID must be set to a Resend segment ID')
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
    },
    async send({ from, to, replyTo, subject, html, text, idempotencyKey }) {
      requireApiKey()

      await resend('/emails', {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
        body: {
          from,
          to: [to],
          reply_to: replyTo,
          subject,
          html,
          text,
          tags: [{ name: 'category', value: 'welcome' }]
        }
      })
    }
  }
}

/**
 * Config is read per request: on Cloudflare, environment variables only exist once a
 * request arrives, so `useRuntimeConfig()` without the event would never see them.
 */
export function useEmailProvider(event: H3Event): EmailProvider {
  const { emailProvider, emailApiKey, emailAudienceId } = useRuntimeConfig(event)

  switch (emailProvider) {
    case 'resend':
      return createResendProvider(emailApiKey, emailAudienceId)
    default:
      return noopProvider
  }
}

async function addContact(provider: EmailProvider, payload: SubscriberPayload, subscriberId: string) {
  try {
    await provider.subscribe(payload)
    await markWaitlistSubscriberSynced(subscriberId)
  } catch (error) {
    console.error(`[maxi-fitness] failed to sync ${payload.email} with ${provider.name}`, error)
  }
}

let warnedWelcomeDisabled = false

async function sendWelcomeEmail(event: H3Event, provider: EmailProvider, payload: SubscriberPayload, subscriberId: string) {
  const { emailProvider, emailFrom, public: { contactEmail } } = useRuntimeConfig(event)

  if (!provider.send || !isWelcomeEmailConfigured({ emailProvider, emailFrom, contactEmail })) {
    if (!warnedWelcomeDisabled) {
      warnedWelcomeDisabled = true
      console.warn('[maxi-fitness] welcome emails are off: set NUXT_EMAIL_FROM and NUXT_PUBLIC_CONTACT_EMAIL to send them')
    }
    return
  }

  try {
    await provider.send({
      ...buildWelcomeEmail(event, payload),
      from: emailFrom,
      to: payload.email,
      replyTo: contactEmail,
      idempotencyKey: `welcome-${subscriberId}`
    })
  } catch (error) {
    console.error(`[maxi-fitness] failed to send the welcome email to ${payload.email} via ${provider.name}`, error)
  }
}

/**
 * Adds a new subscriber to the email service and sends their welcome email, side by
 * side. Failures must never block a signup that is already persisted, so each one is
 * logged and swallowed.
 */
export async function syncSubscriber(event: H3Event, payload: SubscriberPayload, subscriberId: string) {
  const provider = useEmailProvider(event)

  if (provider.name === 'none') {
    return
  }

  await Promise.all([
    addContact(provider, payload, subscriberId),
    sendWelcomeEmail(event, provider, payload, subscriberId)
  ])
}
