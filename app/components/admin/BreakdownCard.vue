<script setup lang="ts">
import type { Breakdown } from '#shared/analytics/types'

const props = withDefaults(defineProps<{
  title: string
  info?: string
  breakdown?: Breakdown | null
  loading?: boolean
  error?: string | null
  /** Keep the survey's option order, for ordered scales such as experience. */
  ordered?: boolean
  chart?: 'bars' | 'donut'
  limit?: number
}>(), {
  info: undefined,
  breakdown: null,
  loading: false,
  error: null,
  ordered: false,
  chart: 'bars',
  limit: 12
})

defineEmits<{ retry: [] }>()

const footnote = computed(() => {
  const data = props.breakdown

  if (!data) {
    return undefined
  }

  const base = `Percentages of the ${formatNumber(data.answered)} respondents who answered`
  return data.unanswered ? `${base}; ${formatNumber(data.unanswered)} didn't (or weren't asked).` : `${base}.`
})
</script>

<template>
  <AdminChartCard
    :title="title"
    :description="breakdown?.title"
    :info="info"
    :loading="loading && !breakdown"
    :error="!breakdown ? error : null"
    :empty="Boolean(breakdown && !breakdown.answered)"
    :multi="breakdown?.multi"
    :footnote="footnote"
    @retry="$emit('retry')"
  >
    <template v-if="breakdown">
      <AdminDonutChart
        v-if="chart === 'donut'"
        :items="breakdown.items"
        :answered="breakdown.answered"
        :question-id="breakdown.questionId"
        :label="title"
      />
      <AdminBarList
        v-else
        :items="breakdown.items"
        :question-id="breakdown.questionId"
        :sorted="!ordered"
        :limit="limit"
      />
    </template>
  </AdminChartCard>
</template>
