import { hasKnownChoices, isQuestionAnswered, surveyAnswerKeys, surveyQuestions, surveyStepCount } from '#shared/survey'
import type { SurveyAnswers } from '#shared/survey'
import type { SurveyResult } from '#shared/schemas/survey'

const DRAFT_KEY = 'maxi-fitness:survey-draft'

/** Long enough to swallow a double-click, short enough to stay responsive. */
const STEP_LOCK_MS = 300

type Draft = {
  answers: SurveyAnswers
  stepIndex: number
}

export function useSurvey() {
  const { track } = useAnalytics()
  const { joined } = useWaitlistState()

  const answers = ref<SurveyAnswers>({})
  const stepIndex = ref(0)
  const phase = ref<'questions' | 'submitting' | 'complete'>('questions')
  const errorMessage = ref('')
  const result = ref<SurveyResult | null>(null)
  const showValidation = ref(false)
  /** Blocks a second activation from skipping a question before the step settles. */
  const isChangingStep = ref(false)

  let lockTimer: ReturnType<typeof setTimeout> | undefined

  const question = computed(() => surveyQuestions[stepIndex.value]!)
  const stepNumber = computed(() => stepIndex.value + 1)
  const progress = computed(() => Math.round((stepNumber.value / surveyStepCount) * 100))
  const isLastStep = computed(() => stepIndex.value === surveyStepCount - 1)
  const isAnswered = computed(() => isQuestionAnswered(question.value, answers.value))
  const isSubmitting = computed(() => phase.value === 'submitting')
  const isBusy = computed(() => isChangingStep.value || isSubmitting.value)

  /** Read by an aria-live region so the step change is spoken, not just rendered. */
  const announcement = computed(() =>
    phase.value === 'complete'
      ? 'Survey complete. Thank you.'
      : `Question ${stepNumber.value} of ${surveyStepCount}. ${question.value.title}`
  )

  function lockStep() {
    isChangingStep.value = true
    clearTimeout(lockTimer)
    lockTimer = setTimeout(() => {
      isChangingStep.value = false
    }, STEP_LOCK_MS)
  }

  /**
   * A draft saved before the questions changed can hold keys or choices the server no
   * longer accepts, which would fail validation on submit with nothing the visitor can
   * do about it. Anything outside the current question set is dropped on load.
   */
  function sanitise(answers: SurveyAnswers = {}): SurveyAnswers {
    const kept: SurveyAnswers = Object.fromEntries(
      Object.entries(answers).filter(([key]) => surveyAnswerKeys.includes(key))
    )
    const invalid = new Set(
      surveyQuestions.filter(question => !hasKnownChoices(question, kept)).map(question => question.id)
    )

    return Object.fromEntries(Object.entries(kept).filter(([key]) => !invalid.has(key)))
  }

  function readDraft() {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY)

      if (!raw) {
        return
      }

      const draft = JSON.parse(raw) as Draft

      answers.value = sanitise(draft.answers)

      // Resume no later than the first unanswered question, in case the draft's step
      // now sits past a question that was added or reset.
      const savedStep = Math.min(Math.max(draft.stepIndex ?? 0, 0), surveyStepCount - 1)
      const firstGap = surveyQuestions.findIndex(question => !isQuestionAnswered(question, answers.value))
      stepIndex.value = firstGap === -1 ? savedStep : Math.min(savedStep, firstGap)
    } catch {
      window.localStorage.removeItem(DRAFT_KEY)
    }
  }

  function writeDraft() {
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ answers: answers.value, stepIndex: stepIndex.value }))
    } catch {
      // Storage may be unavailable; the draft is a convenience only.
    }
  }

  function clearDraft() {
    try {
      window.localStorage.removeItem(DRAFT_KEY)
    } catch {
      // Nothing to clean up.
    }
  }

  function back() {
    if (stepIndex.value === 0 || isBusy.value) {
      return
    }

    lockStep()
    showValidation.value = false
    errorMessage.value = ''
    stepIndex.value -= 1
  }

  async function next() {
    if (isBusy.value) {
      return
    }

    if (!isAnswered.value) {
      showValidation.value = true
      return
    }

    showValidation.value = false

    if (!isLastStep.value) {
      lockStep()
      stepIndex.value += 1
      track('survey_step', { step: stepNumber.value })
      return
    }

    await submit()
  }

  async function submit() {
    if (phase.value === 'submitting') {
      return
    }

    phase.value = 'submitting'
    errorMessage.value = ''
    track('survey_submit')

    try {
      result.value = await $fetch<SurveyResult>('/api/survey', {
        method: 'POST',
        body: {
          answers: answers.value,
          joinWaitlist: false,
          firstName: joined.value?.firstName,
          email: joined.value?.email
        }
      })

      phase.value = 'complete'
      clearDraft()
      track('survey_success')
    } catch (error) {
      const data = (error as { data?: { data?: { message?: string } } }).data?.data

      errorMessage.value = data?.message ?? 'I couldn\'t save your answers. Please try again in a moment.'
      phase.value = 'questions'
      track('survey_error')
    }
  }

  onMounted(() => {
    readDraft()
    track('survey_start', { from: 'survey_page' })
  })

  onScopeDispose(() => clearTimeout(lockTimer))

  watch([answers, stepIndex], () => {
    if (phase.value === 'questions') {
      writeDraft()
    }
  }, { deep: true })

  return {
    answers,
    question,
    stepIndex,
    stepNumber,
    stepCount: surveyStepCount,
    progress,
    phase,
    isLastStep,
    isAnswered,
    isBusy,
    isSubmitting,
    announcement,
    showValidation,
    errorMessage,
    result,
    next,
    back,
    submit
  }
}
