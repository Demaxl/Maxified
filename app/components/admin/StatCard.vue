<script setup lang="ts">
import type { CountMetric, RateMetric } from '#shared/analytics/types'

const props = defineProps<{
  label: string
  info: string
  metric?: CountMetric | RateMetric | null
  loading?: boolean
}>()

const percent = new Intl.NumberFormat('en-GB', { style: 'percent', maximumFractionDigits: 1 })
const number = new Intl.NumberFormat('en-GB')

const display = computed(() => {
  const metric = props.metric

  if (!metric) {
    return null
  }

  if ('available' in metric) {
    return metric.available
      ? {
          value: percent.format(metric.value),
          detail: `${number.format(metric.numerator)} of ${number.format(metric.denominator)} · since ${metric.since}`,
          note: metric.note
        }
      : { value: null, detail: metric.reason, note: undefined }
  }

  return { value: number.format(metric.value), detail: undefined, note: metric.note }
})
</script>

<template>
  <div class="flex min-w-0 flex-col gap-2 rounded-lg border border-sand-200 bg-white p-4">
    <div class="flex items-center gap-1.5">
      <span class="text-xs font-medium text-sand-600">{{ label }}</span>
      <UTooltip
        :text="info"
        :ui="{ content: 'h-auto max-w-72 py-2', text: 'whitespace-normal' }"
      >
        <UButton
          icon="i-lucide-info"
          color="neutral"
          variant="link"
          size="xs"
          class="p-0 text-sand-500 hover:text-sand-800"
          :aria-label="`About ${label}: ${info}`"
        />
      </UTooltip>
    </div>

    <USkeleton
      v-if="loading || !display"
      class="h-8 w-20"
    />
    <template v-else>
      <span
        v-if="display.value !== null"
        class="text-2xl font-semibold tracking-tight text-sand-950 tabular-nums"
      >
        {{ display.value }}
      </span>
      <span
        v-else
        class="flex items-center gap-1.5 text-sm font-medium text-sand-600"
      >
        <UIcon
          name="i-lucide-circle-dashed"
          class="size-4"
        />
        Unavailable
      </span>
      <span
        v-if="display.detail"
        class="text-xs/snug text-sand-600"
      >
        {{ display.detail }}
      </span>
      <span
        v-if="display.note"
        class="text-xs/snug text-sand-600"
      >
        {{ display.note }}
      </span>
    </template>
  </div>
</template>
