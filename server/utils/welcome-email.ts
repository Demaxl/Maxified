import type { H3Event } from 'h3'
import { surveyStepCount } from '#shared/survey'
import type { SubscriberPayload } from './email'

export type WelcomeEmailContent = {
  subject: string
  html: string
  text: string
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&#39;')
}

/**
 * The copy only repeats what the site itself promises: launch news, the launch discount
 * (amount confirmed later) and occasional updates. Edit it here; plain text and HTML are
 * built from the same paragraphs so the two never drift apart.
 */
export function buildWelcomeEmail(event: H3Event, { email, firstName, source }: SubscriberPayload): WelcomeEmailContent {
  const { brand } = useAppConfig()
  const siteUrl = useRuntimeConfig(event).public.siteUrl.replace(/\/$/, '')
  const surveyUrl = `${siteUrl}/survey`
  const host = new URL(siteUrl).host

  const subject = `You're on the ${brand.name} list`
  const preview = 'I\'ll email you when the guide is ready, along with your launch discount.'
  const greeting = firstName ? `Hi ${firstName},` : 'Hi there,'

  const paragraphs = [
    `Thanks for joining the early-access list for the ${brand.name} guide. You're in.`,
    'When the guide is ready, I\'ll email you, along with your exclusive launch discount. The amount is confirmed closer to launch.',
    'Until then, I\'ll only email you about this guide: launch news and the occasional progress update.'
  ]
  const survey = source === 'survey'
    ? { text: 'Thanks for answering the survey too. Your answers go straight into deciding what the guide covers.' }
    : {
        text: `Do you want your input in what goes into it? The research survey is ${surveyStepCount} questions and no email is needed:`,
        link: surveyUrl
      }
  const footer = `You're receiving this because ${email} was added to the ${brand.name} waitlist at ${host}. Didn't sign up, or want to come off the list? Reply to this email and I'll remove you.`

  const text = [
    greeting,
    ...paragraphs,
    survey.link ? `${survey.text} ${survey.link}` : survey.text,
    `Stay active,\nMaxi`,
    '—',
    footer
  ].join('\n\n')

  const p = (content: string) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#1c1917;">${content}</p>`
  const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#f5f1ea;">
<div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preview)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f1ea;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;font-family:Inter,Helvetica,Arial,sans-serif;">
<tr><td style="padding:28px 32px;background:#1c1917;color:#f5f1ea;font-size:22px;font-weight:800;letter-spacing:0.08em;">${escapeHtml(brand.name)}</td></tr>
<tr><td style="padding:32px;">
${p(escapeHtml(greeting))}
${paragraphs.map(paragraph => p(escapeHtml(paragraph))).join('\n')}
${p(survey.link
  ? `${escapeHtml(survey.text)} <a href="${escapeHtml(survey.link)}" style="color:#1c1917;font-weight:600;">Take the survey</a>`
  : escapeHtml(survey.text))}
${p(`Speak soon,<br>${escapeHtml(brand.name)}`)}
</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #e7e0d5;font-size:13px;line-height:1.6;color:#57534e;">${escapeHtml(footer)}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`

  return { subject, html, text }
}
