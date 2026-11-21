<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  description?: string
  /** Explains how the metric is calculated; shown in a tooltip beside the title. */
  info?: string
  loading?: boolean
  error?: string | null
  empty?: boolean
  emptyText?: string
  /** Footnote such as the denominator, shown under the content. */
  footnote?: string
  /** Marks multi-choice charts, whose percentages can add up to more than 100%. */
  multi?: boolean
  skeletonRows?: number
}>(), {
  description: undefined,
  info: undefined,
  loading: false,
  error: null,
  empty: false,
  emptyText: 'No responses match these filters yet.',
  footnote: undefined,
  multi: false,
  skeletonRows: 5
})

defineEmits<{ retry: [] }>()
</script>

<template>
  <section class="flex min-w-0 flex-col rounded-lg border border-sand-200 bg-white">
    <header class="flex items-start justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
      <div class="min-w-0">
        <div class="flex items-center gap-1.5">
          <h2 class="text-sm font-semibold text-sand-950">
            {{ title }}
          </h2>
          <UTooltip
            v-if="info"
            :text="info"
            :content="{ side: 'top' }"
            :ui="{ content: 'h-auto max-w-72 py-2', text: 'whitespace-normal' }"
          >
            <UButton
              icon="i-lucide-info"
              color="neutral"
              variant="link"
              size="xs"
              class="p-0 text-sand-500 hover:text-sand-800"
              :aria-label="`About ${title}: ${info}`"
            />
          </UTooltip>
        </div>
        <p
          v-if="description"
          class="mt-0.5 text-xs text-sand-600"
        >
          {{ description }}
        </p>
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <UBadge
          v-if="multi"
          label="Multi-select"
          color="neutral"
          variant="subtle"
          size="sm"
          title="Respondents could pick several options, so percentages can add up to more than 100%."
        />
        <slot name="actions" />
      </div>
    </header>

    <div class="flex-1 px-4 py-4 sm:px-5">
      <div
        v-if="loading"
        class="flex flex-col gap-3"
        aria-busy="true"
        aria-label="Loading"
      >
        <USkeleton
          v-for="index in skeletonRows"
          :key="index"
          class="h-6"
          :style="{ width: `${100 - index * 11}%` }"
        />
      </div>

      <div
        v-else-if="error"
        class="flex flex-col items-start gap-2 rounded-md bg-sand-100 p-4 text-sm text-sand-800"
        role="alert"
      >
        <span class="flex items-center gap-2 font-medium">
          <UIcon
            name="i-lucide-circle-alert"
            class="size-4"
          />
          Couldn't load this chart
        </span>
        <span class="text-sand-700">{{ error }}</span>
        <UButton
          label="Try again"
          color="neutral"
          variant="outline"
          size="xs"
          @click="$emit('retry')"
        />
      </div>

      <div
        v-else-if="empty"
        class="flex flex-col items-center justify-center gap-2 py-8 text-center text-sm text-sand-600"
      >
        <UIcon
          name="i-lucide-inbox"
          class="size-5 text-sand-400"
        />
        {{ emptyText }}
      </div>

      <slot v-else />
    </div>

    <footer
      v-if="(footnote || multi) && !loading && !error && !empty"
      class="border-t border-sand-100 px-4 py-2.5 text-xs text-sand-600 sm:px-5"
    >
      {{ footnote }}<template v-if="footnote && multi">
        ·
      </template><template v-if="multi">
        Respondents could pick several options, so percentages can add up to more than 100%.
      </template>
    </footer>
  </section>
</template>
