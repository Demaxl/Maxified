<script setup lang="ts">
import type { BreakdownItem } from '#shared/analytics/types'

const props = withDefaults(defineProps<{
  items: BreakdownItem[]
  /** The question these bars count, for the click-through to matching responses. */
  questionId?: string
  /** Sort by count; off keeps the survey's own option order (e.g. experience levels). */
  sorted?: boolean
  /** Rows shown before "Show all". */
  limit?: number
  hideZero?: boolean
}>(), {
  questionId: undefined,
  sorted: true,
  limit: 12,
  hideZero: false
})

const { sharedQuery } = useAdminFilters()
const NuxtLink = resolveComponent('NuxtLink')
const expanded = ref(false)

const rows = computed(() => {
  const list = props.hideZero ? props.items.filter(item => item.count > 0) : [...props.items]
  return props.sorted ? list.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)) : list
})

const visible = computed(() => expanded.value ? rows.value : rows.value.slice(0, props.limit))
</script>

<template>
  <div>
    <ol class="flex flex-col gap-1">
      <li
        v-for="item in visible"
        :key="item.value"
      >
        <component
          :is="questionId && item.count ? NuxtLink : 'div'"
          :to="questionId && item.count ? responsesLink(questionId, item.value, sharedQuery) : undefined"
          class="group -mx-2 block rounded-md px-2 py-1.5"
          :class="questionId && item.count ? 'hover:bg-sand-50 focus-visible:bg-sand-50' : ''"
          :title="questionId && item.count ? `View the ${item.count} responses that chose “${item.label}”` : undefined"
        >
          <div class="flex items-baseline justify-between gap-3 text-sm">
            <span class="min-w-0 text-sand-900 group-hover:underline">{{ item.label }}</span>
            <span class="shrink-0 text-sand-700 tabular-nums">
              <span class="font-semibold text-sand-950">{{ formatPercent(item.pct) }}</span>
              <span class="ml-1.5 text-xs">{{ formatNumber(item.count) }}</span>
            </span>
          </div>
          <div
            class="mt-1 h-2 overflow-hidden rounded-full bg-sand-100"
            aria-hidden="true"
          >
            <div
              class="h-full rounded-full bg-sand-900"
              :style="{ width: `${Math.max(item.pct * 100, item.count ? 1 : 0)}%` }"
            />
          </div>
        </component>
      </li>
    </ol>

    <UButton
      v-if="rows.length > limit"
      :label="expanded ? 'Show fewer' : `Show all ${rows.length}`"
      color="neutral"
      variant="link"
      size="xs"
      class="mt-2 px-0"
      @click="expanded = !expanded"
    />
  </div>
</template>
