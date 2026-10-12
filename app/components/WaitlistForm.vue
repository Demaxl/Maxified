<script setup lang="ts">
import type { WaitlistSource } from '#shared/schemas/waitlist'

const props = withDefaults(defineProps<{
  source: WaitlistSource
  /** Hides the survey link on screens that already lead into the survey. */
  showSurveyLink?: boolean
  /** Match the surface the form sits on; there is no card behind it. */
  tone?: 'light' | 'dark'
}>(), {
  showSurveyLink: true,
  tone: 'light'
})

const {
  firstName,
  email,
  fieldErrors,
  formError,
  result,
  isSubmitting,
  isSuccess,
  submit,
  reset,
  clearFieldError
} = useWaitlistForm(props.source)

const emailField = useTemplateRef('emailField')
const firstNameField = useTemplateRef('firstNameField')

/** A visitor who submits from the button never sees a field error unless we take them to it. */
async function submitAndReportErrors() {
  await submit()
  await nextTick()

  if (fieldErrors.value.email) {
    emailField.value?.focus()
  } else if (fieldErrors.value.firstName) {
    firstNameField.value?.focus()
  }
}

const isDuplicate = computed(() => result.value?.status === 'already_subscribed')

const heading = computed(() => {
  const name = result.value?.firstName

  if (isDuplicate.value) {
    return name ? `You're already on the list, ${name}.` : 'You\'re already on the list.'
  }

  return name ? `You're on the list, ${name}.` : 'You\'re on the list.'
})

const message = computed(() =>
  isDuplicate.value
    ? 'No need to sign up twice. I\'ll email you when the guide is ready, along with your exclusive launch discount.'
    : 'I\'ll email you when the guide is ready, along with your exclusive launch discount.'
)

const tones = {
  light: {
    heading: 'text-sand-950',
    body: 'text-sand-800',
    fine: 'text-sand-700',
    link: 'text-sand-950 decoration-sand-400 hover:decoration-sand-950',
    error: 'text-red-700',
    secondary: 'outline' as const
  },
  dark: {
    heading: 'text-sand-50',
    body: 'text-sand-200',
    fine: 'text-sand-400',
    link: 'text-sand-100 decoration-sand-500 hover:decoration-sand-100',
    error: 'text-red-300',
    secondary: 'outlineCream' as const
  }
}

const t = computed(() => tones[props.tone])
</script>

<template>
  <div>
    <div v-if="isSuccess">
      <span
        aria-hidden="true"
        class="inline-flex size-10 items-center justify-center rounded-[3px] bg-lime-400"
      >
        <UIcon
          name="i-lucide-check"
          class="size-5 text-sand-950"
        />
      </span>

      <p
        class="mt-5 font-display text-3xl leading-none font-bold uppercase"
        :class="t.heading"
        role="status"
      >
        {{ heading }}
      </p>
      <p
        class="mt-3 max-w-md text-base leading-relaxed"
        :class="t.body"
      >
        {{ message }}
      </p>

      <div class="mt-7 flex flex-col items-start gap-4">
        <AppButton
          v-if="showSurveyLink"
          to="/survey"
          :variant="t.secondary"
        >
          Help shape it — take the survey
          <template #trailing>
            <UIcon
              name="i-lucide-arrow-right"
              class="size-4"
            />
          </template>
        </AppButton>

        <button
          type="button"
          class="rounded-[2px] py-1 text-sm underline underline-offset-4 transition-colors"
          :class="t.link"
          @click="reset()"
        >
          Add another email
        </button>
      </div>
    </div>

    <form
      v-else
      novalidate
      @submit.prevent="submitAndReportErrors()"
    >
      <div class="grid gap-4 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <AppField
          ref="emailField"
          v-model="email"
          label="Email address"
          name="email"
          type="email"
          autocomplete="email"
          placeholder="you@email.com"
          :tone="tone"
          :error="fieldErrors.email"
          @update:model-value="clearFieldError('email')"
        />
        <AppField
          ref="firstNameField"
          v-model="firstName"
          label="First name"
          name="firstName"
          autocomplete="given-name"
          placeholder="Alex"
          optional
          :tone="tone"
          :error="fieldErrors.firstName"
          @update:model-value="clearFieldError('firstName')"
        />
      </div>

      <p
        v-if="formError"
        class="mt-4 flex items-start gap-2 text-sm"
        :class="t.error"
        role="alert"
      >
        <UIcon
          name="i-lucide-circle-alert"
          class="mt-0.5 size-4 shrink-0"
        />
        {{ formError }}
      </p>

      <AppButton
        type="submit"
        size="lg"
        class="mt-6 w-full sm:w-auto"
        :loading="isSubmitting"
      >
        {{ isSubmitting ? 'Adding you' : 'Join the Waitlist' }}
        <template #trailing>
          <UIcon
            name="i-lucide-arrow-right"
            class="size-4"
          />
        </template>
      </AppButton>

      <p
        class="mt-5 max-w-md text-sm leading-relaxed"
        :class="t.fine"
      >
        I'll only email you about this guide — launch news and the occasional progress update.
        <NuxtLink
          to="/privacy"
          class="rounded-[2px] underline underline-offset-2 transition-colors"
          :class="t.link"
        >
          How I handle your details
        </NuxtLink>
      </p>
    </form>
  </div>
</template>
