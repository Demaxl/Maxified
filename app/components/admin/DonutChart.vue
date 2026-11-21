<script setup lang="ts">
import { VisDonut, VisSingleContainer } from '@unovis/vue'
import type { BreakdownItem } from '#shared/analytics/types'

const props = defineProps<{
  items: BreakdownItem[]
  answered: number
  questionId?: string
  label: string
}>()

const { sharedQuery } = useAdminFilters()
const NuxtLink = resolveComponent('NuxtLink')

/** Alternating dark and light steps, so neighbouring segments stay distinguishable. */
const palette = ['#111111', '#7CBD0E', '#6B6B64', '#C9FF66', '#B3AE9D', '#3E5D14', '#E8E4D6']

const segments = computed(() => props.items.map((item, index) => ({ ...item, color: palette[index % palette.length]! })))

const visibleSegments = computed(() => segments.value.filter(item => item.count > 0))

const value = (item: BreakdownItem) => item.count
const color = (item: BreakdownItem & { color: string }) => item.color
</script>

<template>
  <div class="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
    <div
      class="relative size-44 shrink-0"
      role="img"
      :aria-label="`${label}: ${visibleSegments.map(item => `${item.label} ${formatPercent(item.pct)}`).join(', ')}`"
    >
      <VisSingleContainer
        :data="visibleSegments"
        :height="176"
        :width="176"
      >
        <VisDonut
          :value="value"
          :color="color"
          :arc-width="26"
          :pad-angle="0.015"
          :corner-radius="2"
        />
      </VisSingleContainer>
      <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span class="text-2xl font-semibold text-sand-950 tabular-nums">{{ formatNumber(answered) }}</span>
        <span class="text-xs text-sand-600">answered</span>
      </div>
    </div>

    <ul class="flex w-full min-w-0 flex-col gap-0.5">
      <li
        v-for="item in segments"
        :key="item.value"
      >
        <component
          :is="questionId && item.count ? NuxtLink : 'div'"
          :to="questionId && item.count ? responsesLink(questionId, item.value, sharedQuery) : undefined"
          class="group -mx-2 flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm"
          :class="questionId && item.count ? 'hover:bg-sand-50' : ''"
        >
          <span
            class="size-2.5 shrink-0 rounded-full ring-1 ring-sand-950/10"
            :style="{ backgroundColor: item.color }"
            aria-hidden="true"
          />
          <span class="min-w-0 flex-1 truncate text-sand-900 group-hover:underline">{{ item.label }}</span>
          <span class="shrink-0 font-semibold text-sand-950 tabular-nums">{{ formatPercent(item.pct) }}</span>
          <span class="w-8 shrink-0 text-right text-xs text-sand-700 tabular-nums">{{ formatNumber(item.count) }}</span>
        </component>
      </li>
    </ul>
  </div>
</template>
