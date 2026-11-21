<script setup lang="ts">
const props = withDefaults(defineProps<{
  n: number
  /** What is being counted, e.g. "respondents in this segment". */
  noun?: string
  segmented?: boolean
}>(), {
  noun: 'respondents',
  segmented: false
})

const tooSmall = computed(() => props.n > 0 && props.n < MIN_RELIABLE_SAMPLE)
</script>

<template>
  <div
    class="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border px-4 py-3 text-sm"
    :class="tooSmall ? 'border-amber-300 bg-amber-50 text-amber-950' : 'border-sand-200 bg-white text-sand-800'"
    :role="tooSmall ? 'status' : undefined"
  >
    <span class="flex items-center gap-2">
      <UIcon
        :name="tooSmall ? 'i-lucide-triangle-alert' : 'i-lucide-users'"
        class="size-4 shrink-0"
      />
      <span>
        <strong class="tabular-nums">{{ formatNumber(n) }}</strong> {{ noun }}{{ segmented ? ' match the current filters' : '' }}.
      </span>
    </span>
    <span
      v-if="tooSmall"
      class="text-amber-900"
    >
      Fewer than {{ MIN_RELIABLE_SAMPLE }} — treat the patterns below as early signals, not conclusions.
    </span>
  </div>
</template>
