type JoinedState = {
  firstName?: string
  email: string
} | null

const STORAGE_KEY = 'maxi-fitness:waitlist'

/**
 * Remembers that this visitor already joined the waitlist so the survey can link
 * their response and skip a second signup prompt.
 */
export function useWaitlistState() {
  const joined = useState<JoinedState>('waitlist-joined', () => null)

  function restore() {
    if (import.meta.server || joined.value) {
      return
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      joined.value = raw ? (JSON.parse(raw) as JoinedState) : null
    } catch {
      joined.value = null
    }
  }

  function remember(email: string, firstName?: string) {
    joined.value = { email, firstName }

    if (import.meta.client) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(joined.value))
      } catch {
        // Private browsing can reject writes; the signup itself already succeeded.
      }
    }
  }

  return { joined, restore, remember }
}
