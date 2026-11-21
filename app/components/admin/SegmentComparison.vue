<script setup lang="ts">
import type { SegmentSummary } from '#shared/analytics/types'

const props = defineProps<{
  a: SegmentSummary
  b: SegmentSummary
}>()

const colors = { a: '#111111', b: '#5D8F0F' }

/** Topics either segment picked, ordered by combined share. */
const rows = computed(() => {
  const byValue = new Map<string, { label: string, a: number, b: number, aCount: number, bCount: number }>()

  for (const item of props.a.items) {
    byValue.set(item.value, { label: item.label, a: item.pct, b: 0, aCount: item.count, bCount: 0 })
  }

  for (const item of props.b.items) {
    const row = byValue.get(item.value) ?? { label: item.label, a: 0, b: 0, aCount: 0, bCount: 0 }
    row.b = item.pct
    row.bCount = item.count
    byValue.set(item.value, row)
  }

  return [...byValue.entries()]
    .map(([value, row]) => ({ value, ...row }))
    .filter(row => row.aCount || row.bCount)
    .sort((x, y) => (y.a + y.b) - (x.a + x.b))
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <div
        v-for="(segment, key) in { a, b }"
        :key="key"
        class="flex items-start gap-2.5 rounded-md bg-sand-50 px-3 py-2.5 text-sm"
      >
        <span
          class="mt-1.5 size-2.5 shrink-0 rounded-full"
          :style="{ backgroundColor: colors[key] }"
          aria-hidden="true"
        />
        <div class="min-w-0">
          <p class="font-medium text-sand-950">
            {{ segment.label }}
          </p>
          <p class="text-xs text-sand-700">
            {{ formatNumber(segment.answered) }} answered the topic question
            <span
              v-if="segment.answered < MIN_RELIABLE_SAMPLE"
              class="font-medium text-amber-800"
            > · small sample</span>
          </p>
        </div>
      </div>
    </div>

    <p
      v-if="!rows.length"
      class="py-6 text-center text-sm text-sand-600"
    >
      Neither segment has answered the topic question yet.
    </p>

    <ol
      v-else
      class="flex flex-col gap-3"
    >
      <li
        v-for="row in rows"
        :key="row.value"
        class="grid grid-cols-1 gap-1 sm:grid-cols-[minmax(0,14rem)_1fr] sm:gap-4"
      >
        <span class="text-sm text-sand-900">{{ row.label }}</span>
        <div class="flex flex-col gap-1">
          <div
            v-for="side in (['a', 'b'] as const)"
            :key="side"
            class="flex items-center gap-2"
          >
            <div
              class="h-2 flex-1 overflow-hidden rounded-full bg-sand-100"
              aria-hidden="true"
            >
              <div
                class="h-full rounded-full"
                :style="{ width: `${row[side] * 100}%`, backgroundColor: colors[side] }"
              />
            </div>
            <span class="w-24 shrink-0 text-right text-xs text-sand-700 tabular-nums">
              <span class="sr-only">{{ side === 'a' ? a.label : b.label }}: </span>
              <strong class="text-sand-950">{{ formatPercent(row[side]) }}</strong>
              ({{ side === 'a' ? row.aCount : row.bCount }})
            </span>
          </div>
        </div>
      </li>
    </ol>
  </div>
</template>
