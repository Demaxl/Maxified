<script setup lang="ts">
import { OTHER_VALUE, asList, asText, otherKey } from '#shared/survey'
import type { SurveyAnswerValue, SurveyQuestion } from '#shared/survey'

const props = defineProps<{
  question: SurveyQuestion
  invalid?: boolean
}>()

const answers = defineModel<Record<string, SurveyAnswerValue>>({ required: true })

const groupName = useId()
const titleId = useId()
const helperId = useId()

const heading = useTemplateRef<HTMLElement>('heading')

const options = computed(() => {
  if (props.question.type === 'text') {
    return []
  }

  return props.question.allowOther
    ? [...props.question.options, { value: OTHER_VALUE, label: 'Other' }]
    : props.question.options
})

const selected = computed(() => answers.value[props.question.id])
const selectedList = computed(() => asList(selected.value))

const maxSelections = computed(() =>
  props.question.type === 'multi' ? props.question.maxSelections : undefined
)

const atLimit = computed(() =>
  Boolean(maxSelections.value && selectedList.value.length >= maxSelections.value)
)

const showOtherInput = computed(() =>
  props.question.type === 'single'
    ? selected.value === OTHER_VALUE
    : selectedList.value.includes(OTHER_VALUE)
)

const followUp = computed(() =>
  props.question.type === 'single'
  && props.question.followUp
  && selected.value === props.question.followUp.when
    ? props.question.followUp
    : undefined
)

/**
 * The model is written once per interaction: emitting twice in a tick would build
 * the second object from the stale prop value.
 */
function patch(changes: Record<string, SurveyAnswerValue | undefined>) {
  const merged = { ...answers.value, ...changes }

  answers.value = Object.fromEntries(
    Object.entries(merged).filter(([, value]) => value !== undefined)
  ) as Record<string, SurveyAnswerValue>
}

function setAnswer(key: string, value: SurveyAnswerValue) {
  patch({ [key]: value })
}

function isChecked(value: string) {
  return props.question.type === 'multi'
    ? selectedList.value.includes(value)
    : selected.value === value
}

function choose(value: string) {
  const question = props.question
  const other = otherKey(question.id)

  if (question.type === 'multi') {
    const current = selectedList.value

    if (current.includes(value)) {
      patch({
        [question.id]: current.filter(item => item !== value),
        ...(value === OTHER_VALUE ? { [other]: undefined } : {})
      })

      return
    }

    if (atLimit.value) {
      return
    }

    patch({ [question.id]: [...current, value] })
    return
  }

  const followUpId = question.type === 'single' ? question.followUp?.id : undefined
  const keepFollowUp = question.type === 'single' && question.followUp?.when === value

  patch({
    [question.id]: value,
    ...(value === OTHER_VALUE ? {} : { [other]: undefined }),
    ...(followUpId && !keepFollowUp ? { [followUpId]: undefined } : {})
  })
}

const otherValue = computed({
  get: () => asText(answers.value[otherKey(props.question.id)]),
  set: value => setAnswer(otherKey(props.question.id), value)
})

const textValue = computed({
  get: () => asText(answers.value[props.question.id]),
  set: value => setAnswer(props.question.id, value)
})

const followUpValue = computed({
  get: () => (followUp.value ? asText(answers.value[followUp.value.id]) : ''),
  set: (value) => {
    if (followUp.value) {
      setAnswer(followUp.value.id, value)
    }
  }
})

const remaining = computed(() =>
  maxSelections.value ? maxSelections.value - selectedList.value.length : 0
)

// The question helper already states the cap, so this only reports progress against it.
const selectionHint = computed(() => {
  if (!maxSelections.value || !selectedList.value.length) {
    return ''
  }

  return remaining.value > 0
    ? `${selectedList.value.length} of ${maxSelections.value} chosen — you can pick ${remaining.value} more`
    : `${selectedList.value.length} of ${maxSelections.value} chosen — deselect one to change your answer`
})

const validationMessage = computed(() => {
  if (!props.invalid) {
    return ''
  }

  if (props.question.type === 'multi') {
    return selectedList.value.length
      ? 'Add a short note for "Other" so I know what you mean.'
      : 'Pick at least one option to continue.'
  }

  if (props.question.type === 'single') {
    return selected.value === OTHER_VALUE
      ? 'Add a short note for "Other" so I know what you mean.'
      : 'Pick an option to continue.'
  }

  return 'Please answer this one to continue.'
})

defineExpose({
  focus: () => heading.value?.focus()
})
</script>

<template>
  <div>
    <div
      class="min-w-0"
      :role="question.type === 'text' ? undefined : 'group'"
      :aria-labelledby="titleId"
      :aria-describedby="question.helper ? helperId : undefined"
    >
      <h2
        :id="titleId"
        ref="heading"
        tabindex="-1"
        class="rounded-[2px] text-2xl leading-tight font-semibold tracking-[-0.015em] text-balance text-sand-950 sm:text-[1.75rem]"
      >
        {{ question.title }}
      </h2>

      <p
        v-if="question.helper"
        :id="helperId"
        class="mt-3 text-sm leading-relaxed text-sand-700"
      >
        {{ question.helper }}
      </p>

      <div
        v-if="question.type === 'text'"
        class="mt-6"
      >
        <AppField
          v-model="textValue"
          :label="question.title"
          :name="question.id"
          :placeholder="question.placeholder"
          :multiline="question.multiline"
          :optional="question.optional"
          class="[&>label]:sr-only"
        />
      </div>

      <div
        v-else
        class="mt-5 grid gap-2"
      >
        <label
          v-for="option in options"
          :key="option.value"
          class="flex min-h-12 cursor-pointer items-center gap-3.5 rounded-[3px] border px-4 py-3 transition-colors duration-150 select-none has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-sand-950"
          :class="isChecked(option.value)
            ? 'border-sand-950 bg-white text-sand-950 ring-1 ring-sand-950 ring-inset'
            : atLimit && question.type === 'multi'
              ? 'border-sand-200 bg-white text-sand-600'
              : 'border-sand-300 bg-white text-sand-950 hover:border-sand-500'"
        >
          <input
            :type="question.type === 'multi' ? 'checkbox' : 'radio'"
            :name="groupName"
            :value="option.value"
            :checked="isChecked(option.value)"
            :disabled="question.type === 'multi' && atLimit && !isChecked(option.value)"
            class="sr-only"
            @change="choose(option.value)"
          >

          <span
            aria-hidden="true"
            class="flex size-5 shrink-0 items-center justify-center border-2 transition-colors duration-150"
            :class="[
              question.type === 'multi' ? 'rounded-[2px]' : 'rounded-full',
              isChecked(option.value) ? 'border-sand-950 bg-lime-400' : 'border-sand-400'
            ]"
          >
            <UIcon
              v-if="isChecked(option.value)"
              name="i-lucide-check"
              class="size-3.5 text-sand-950"
            />
          </span>

          <span class="min-w-0 text-base leading-snug">{{ option.label }}</span>
        </label>

        <p
          v-if="selectionHint"
          class="mt-1 text-sm text-sand-700"
          aria-live="polite"
        >
          {{ selectionHint }}
        </p>
      </div>

      <div
        v-if="showOtherInput"
        class="mt-4"
      >
        <AppField
          v-model="otherValue"
          label="Tell me more"
          :name="otherKey(question.id)"
          placeholder="Your answer"
        />
      </div>

      <div
        v-if="followUp"
        class="mt-5"
      >
        <AppField
          v-model="followUpValue"
          :label="followUp.title"
          :name="followUp.id"
          :placeholder="followUp.placeholder"
          multiline
          optional
          :rows="3"
        />
      </div>
    </div>

    <p
      v-if="validationMessage"
      class="mt-4 flex scroll-mb-28 items-center gap-1.5 text-sm text-red-700"
      role="alert"
    >
      <UIcon
        name="i-lucide-circle-alert"
        class="size-4 shrink-0"
      />
      {{ validationMessage }}
    </p>
  </div>
</template>
