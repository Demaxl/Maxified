<script setup lang="ts">
const { brand } = useAppConfig()
const { joined, restore } = useWaitlistState()

const {
  answers,
  question,
  stepIndex,
  stepNumber,
  stepCount,
  progress,
  phase,
  isLastStep,
  isBusy,
  isSubmitting,
  announcement,
  showValidation,
  errorMessage,
  next,
  back
} = useSurvey()

const questionCard = useTemplateRef<{ focus: () => void }>('questionCard')
const questionRegion = useTemplateRef<HTMLElement>('questionRegion')
const completeHeading = useTemplateRef<HTMLElement>('completeHeading')

// Snapshotted when the survey completes so signing up here doesn't rewrite the message.
const wasAlreadySubscribed = ref(false)

function prefersReducedMotion() {
  return import.meta.client && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Keyboard focus and the viewport both follow the new question, so the next thing
 * you read and the next thing you Tab into are the same thing.
 */
async function settleOnQuestion() {
  await nextTick()

  questionRegion.value?.scrollIntoView({
    block: 'start',
    behavior: prefersReducedMotion() ? 'auto' : 'smooth'
  })

  questionCard.value?.focus()
}

/** Keeps a rejected step's message clear of the controls pinned to the bottom. */
async function revealValidation() {
  await nextTick()

  const alert = questionRegion.value?.querySelector('[role="alert"]')

  alert?.scrollIntoView({
    block: 'nearest',
    behavior: prefersReducedMotion() ? 'auto' : 'smooth'
  })
}

async function goNext() {
  const from = stepIndex.value
  await next()

  if (stepIndex.value !== from) {
    await settleOnQuestion()
    return
  }

  if (showValidation.value) {
    await revealValidation()
  }
}

async function goBack() {
  const from = stepIndex.value
  back()

  if (stepIndex.value !== from) {
    await settleOnQuestion()
  }
}

watch(phase, async (value) => {
  if (value !== 'complete') {
    return
  }

  wasAlreadySubscribed.value = Boolean(joined.value)

  await nextTick()
  window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  completeHeading.value?.focus()
})

useSeoMeta({
  title: 'The short survey',
  description: `Eight quick questions about where you are in your fitness journey and what you'd want from the ${brand.name} guide.`,
  robots: 'noindex'
})

onMounted(restore)
</script>

<template>
  <div class="flex min-h-svh flex-col bg-sand-100">
    <p
      aria-live="polite"
      aria-atomic="true"
      class="sr-only"
    >
      {{ announcement }}
    </p>

    <div
      v-if="phase === 'complete'"
      class="shell max-w-2xl flex-1 pt-28 pb-20 sm:pt-32"
    >
      <SlashLabel :parts="['Survey', 'Complete']" />
      <h1
        ref="completeHeading"
        tabindex="-1"
        class="mt-5 rounded-[2px] font-display text-headline font-bold text-balance text-sand-950 uppercase"
      >
        Thanks — that genuinely helps.
      </h1>
      <p class="mt-6 text-base leading-relaxed text-sand-800 sm:text-lg">
        Your answers go straight into how I plan the guide. If enough people flag the same
        problem, it gets proper space inside.
      </p>

      <div class="mt-10 border-t-2 border-sand-950 pt-8">
        <div v-if="wasAlreadySubscribed && joined">
          <span
            aria-hidden="true"
            class="inline-flex size-10 items-center justify-center rounded-[3px] bg-lime-400"
          >
            <UIcon
              name="i-lucide-check"
              class="size-5 text-sand-950"
            />
          </span>
          <p class="mt-5 font-display text-3xl leading-none font-bold text-sand-950 uppercase">
            You're already on the waitlist{{ joined.firstName ? `, ${joined.firstName}` : '' }}.
          </p>
          <p class="mt-3 text-base leading-relaxed text-sand-800">
            Nothing else to do. I'll email you when the guide is ready, along with your exclusive
            launch discount.
          </p>
          <AppButton
            to="/"
            variant="outline"
            class="mt-6"
          >
            Back to the site
          </AppButton>
        </div>

        <div v-else>
          <p class="font-display text-3xl leading-none font-bold text-sand-950 uppercase">
            One last thing — want early access?
          </p>
          <p class="mt-3 mb-7 text-base leading-relaxed text-sand-800">
            Join the waitlist and you'll get the guide first, plus an exclusive launch discount
            when it's ready.
          </p>
          <WaitlistForm
            source="survey"
            :show-survey-link="false"
          />
        </div>
      </div>
    </div>

    <form
      v-else
      novalidate
      class="flex flex-1 flex-col"
      @submit.prevent="goNext()"
    >
      <div
        class="shell max-w-2xl flex-1 pb-12"
        :class="stepIndex === 0 ? 'pt-24 sm:pt-28' : 'pt-20 sm:pt-24'"
      >
        <h1 class="sr-only">
          Help shape {{ brand.name }}
        </h1>

        <header v-if="stepIndex === 0">
          <SlashLabel :parts="['Help Shape', brand.name]" />
          <p
            aria-hidden="true"
            class="mt-4 font-display text-title font-bold text-sand-950 uppercase"
          >
            Tell me what you're actually struggling with.
          </p>
          <p class="mt-3 text-sm leading-relaxed text-sand-700">
            8 quick questions, no email needed. Anything marked optional can be left blank.
          </p>
        </header>

        <div
          class="mb-8"
          :class="stepIndex === 0 ? 'mt-8' : 'mt-2'"
        >
          <div class="mb-3 flex items-baseline justify-between gap-4">
            <span class="text-label font-semibold text-sand-700 uppercase tabular-nums">
              Question {{ stepNumber }} <span class="text-lime-800">/</span> {{ stepCount }}
            </span>
            <span
              v-if="question.optional"
              class="text-xs text-sand-700"
            >Optional</span>
          </div>
          <div
            class="h-1 w-full overflow-hidden bg-sand-300"
            role="progressbar"
            :aria-valuenow="stepNumber"
            aria-valuemin="1"
            :aria-valuemax="stepCount"
            :aria-valuetext="`Question ${stepNumber} of ${stepCount}`"
          >
            <div
              class="h-full bg-sand-950 transition-[width] duration-300 ease-out motion-reduce:transition-none"
              :style="{ width: `${progress}%` }"
            />
          </div>
        </div>

        <div
          ref="questionRegion"
          class="scroll-mt-24"
        >
          <SurveyQuestion
            ref="questionCard"
            :key="question.id"
            v-model="answers"
            :question="question"
            :invalid="showValidation"
          />
        </div>

        <p
          v-if="errorMessage"
          class="mt-6 flex items-start gap-2 text-sm text-red-700"
          role="alert"
        >
          <UIcon
            name="i-lucide-circle-alert"
            class="mt-0.5 size-4 shrink-0"
          />
          {{ errorMessage }}
        </p>

        <p
          v-if="isLastStep"
          class="mt-10 border-t border-sand-950/15 pt-6 text-sm leading-relaxed text-sand-700"
        >
          I don't ask for your email in this survey. If you've already joined the waitlist in this
          browser, your email is saved alongside your answers so I can follow up — otherwise the
          response has no email attached.
          <NuxtLink
            to="/privacy"
            class="rounded-[2px] text-sand-950 underline decoration-sand-400 underline-offset-2 transition-colors hover:decoration-sand-950"
          >
            How I handle your details
          </NuxtLink>
        </p>
      </div>

      <div class="sticky bottom-0 border-t border-sand-950/15 bg-sand-100">
        <div class="shell flex max-w-2xl items-center gap-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <AppButton
            variant="outline"
            :disabled="stepIndex === 0 || isBusy"
            @click="goBack()"
          >
            <UIcon
              name="i-lucide-arrow-left"
              class="size-4"
            />
            Back
          </AppButton>

          <AppButton
            type="submit"
            block
            :loading="isSubmitting"
            :disabled="isBusy"
          >
            {{ isLastStep ? 'Submit answers' : 'Next' }}
            <template #trailing>
              <UIcon
                :name="isLastStep ? 'i-lucide-check' : 'i-lucide-arrow-right'"
                class="size-4"
              />
            </template>
          </AppButton>
        </div>
      </div>
    </form>
  </div>
</template>
