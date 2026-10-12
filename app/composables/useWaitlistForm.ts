import { waitlistInputSchema } from '#shared/schemas/waitlist'
import type { WaitlistResult, WaitlistSource } from '#shared/schemas/waitlist'

type FormState = 'idle' | 'submitting' | 'success' | 'error'

export function useWaitlistForm(source: WaitlistSource) {
  const { track } = useAnalytics()
  const { remember } = useWaitlistState()

  const firstName = ref('')
  const email = ref('')
  const state = ref<FormState>('idle')
  const fieldErrors = ref<Record<string, string>>({})
  const formError = ref('')
  const result = ref<WaitlistResult | null>(null)

  const isSubmitting = computed(() => state.value === 'submitting')
  const isSuccess = computed(() => state.value === 'success')

  function reset() {
    state.value = 'idle'
    fieldErrors.value = {}
    formError.value = ''
    result.value = null
  }

  function clearFieldError(field: 'firstName' | 'email') {
    if (fieldErrors.value[field]) {
      const { [field]: _removed, ...rest } = fieldErrors.value
      fieldErrors.value = rest
    }
  }

  async function submit() {
    if (isSubmitting.value) {
      return
    }

    fieldErrors.value = {}
    formError.value = ''

    const parsed = waitlistInputSchema.safeParse({
      firstName: firstName.value,
      email: email.value,
      source
    })

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path.join('.') || 'form'

        if (!fieldErrors.value[field]) {
          fieldErrors.value[field] = issue.message
        }
      }

      state.value = 'error'
      return
    }

    state.value = 'submitting'
    track('waitlist_submit', { source })

    try {
      result.value = await $fetch<WaitlistResult>('/api/waitlist', {
        method: 'POST',
        body: parsed.data
      })

      state.value = 'success'
      remember(parsed.data.email, parsed.data.firstName)
      track(result.value.status === 'created' ? 'waitlist_success' : 'waitlist_duplicate', { source })
    } catch (error) {
      const data = (error as { data?: { data?: { message?: string, fields?: Record<string, string> } } }).data?.data

      fieldErrors.value = data?.fields ?? {}
      formError.value = data?.message ?? 'Something went wrong. Please try again in a moment.'
      state.value = 'error'
      track('waitlist_error', { source })
    }
  }

  return {
    firstName,
    email,
    state,
    fieldErrors,
    formError,
    result,
    isSubmitting,
    isSuccess,
    submit,
    reset,
    clearFieldError
  }
}
