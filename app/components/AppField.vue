<script setup lang="ts">
const props = withDefaults(defineProps<{
  label: string
  name: string
  type?: 'text' | 'email'
  autocomplete?: string
  placeholder?: string
  error?: string
  multiline?: boolean
  rows?: number
  optional?: boolean
  /** `dark` sits directly on a near-black band with no card behind it. */
  tone?: 'light' | 'dark'
}>(), {
  type: 'text',
  rows: 4,
  tone: 'light'
})

const model = defineModel<string>({ default: '' })

const id = useId()
const errorId = computed(() => `${id}-error`)

const tones = {
  light: {
    field: 'bg-white text-sand-950 placeholder:text-sand-600',
    idle: 'border-sand-300 hover:border-sand-500 focus:border-sand-950',
    invalid: 'border-red-700 focus:border-red-700',
    label: 'text-sand-950',
    optional: 'text-sand-600',
    error: 'text-red-700'
  },
  dark: {
    field: 'bg-sand-900 text-sand-50 placeholder:text-sand-400',
    idle: 'border-sand-100/25 hover:border-sand-100/50 focus:border-sand-50',
    invalid: 'border-red-300 focus:border-red-300',
    label: 'text-sand-100',
    optional: 'text-sand-400',
    error: 'text-red-300'
  }
}

const fieldClass = computed(() => [
  'w-full rounded-[3px] border px-4 py-3.5 text-base transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2',
  tones[props.tone].field,
  props.error ? tones[props.tone].invalid : tones[props.tone].idle
])

defineExpose({
  focus: () => {
    document.getElementById(id)?.focus()
  }
})
</script>

<template>
  <div>
    <label
      :for="id"
      class="mb-2 flex items-baseline justify-between gap-3 text-sm font-medium"
      :class="tones[tone].label"
    >
      <span>{{ label }}</span>
      <span
        v-if="optional"
        class="text-xs font-normal"
        :class="tones[tone].optional"
      >Optional</span>
    </label>

    <textarea
      v-if="multiline"
      :id="id"
      v-model="model"
      :name="name"
      :rows="rows"
      :placeholder="placeholder"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="error ? errorId : undefined"
      class="min-h-28 resize-y"
      :class="fieldClass"
    />
    <input
      v-else
      :id="id"
      v-model="model"
      :name="name"
      :type="type"
      :autocomplete="autocomplete"
      :placeholder="placeholder"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="error ? errorId : undefined"
      :class="fieldClass"
    >

    <p
      v-if="error"
      :id="errorId"
      role="alert"
      class="mt-2 flex items-center gap-1.5 text-sm"
      :class="tones[tone].error"
    >
      <UIcon
        name="i-lucide-circle-alert"
        class="size-4 shrink-0"
      />
      {{ error }}
    </p>
  </div>
</template>
