const PLACEHOLDER_PATTERN = /yourhandle|yourdomain|example\.(com|org)|changeme/i

/**
 * Social and contact details are environment-provided and unset until launch.
 * Anything missing — or still carrying the sample values from `.env.example` —
 * is withheld so the public UI never links somewhere that doesn't exist.
 */
function realValue(value: string | undefined) {
  if (!value) {
    return undefined
  }

  const trimmed = value.trim().replace(/\/+$/, '')

  if (!trimmed || PLACEHOLDER_PATTERN.test(trimmed)) {
    return undefined
  }

  // A bare origin such as `https://instagram.com` points at no particular account.
  try {
    if (/^https?:\/\//.test(trimmed) && !new URL(trimmed).pathname.replace(/\/+$/, '')) {
      return undefined
    }
  } catch {
    return undefined
  }

  return trimmed
}

export function useSiteLinks() {
  const { instagramUrl, tiktokUrl, twitterUrl, contactEmail } = useRuntimeConfig().public

  const socials = computed(() =>
    [
      { label: 'Instagram', icon: 'i-simple-icons-instagram', href: realValue(instagramUrl) },
      { label: 'TikTok', icon: 'i-simple-icons-tiktok', href: realValue(tiktokUrl) },
      { label: 'X', icon: 'i-simple-icons-x', href: realValue(twitterUrl) }
    ].filter((link): link is { label: string, icon: string, href: string } => Boolean(link.href))
  )

  const contact = computed(() => {
    const email = contactEmail?.trim()

    return email && !PLACEHOLDER_PATTERN.test(email) ? email : undefined
  })

  return { socials, contact }
}
