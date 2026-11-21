<script setup lang="ts">
import type { BreakdownData } from '#shared/analytics/types'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Audience' })

const { data, error, pending, refresh } = useAdminData<BreakdownData>('/api/admin/breakdown', {
  questions: 'physique,experience,days_per_week,usual_training_location,training_location'
})
const { activeSegmentCount } = useAdminFilters()

const get = (id: string) => data.value?.breakdowns[id] ?? null
</script>

<template>
  <AdminPage
    title="Audience"
    description="Who is interested in MAXIFIED: their starting point, how long they've trained, and what time and equipment they realistically have."
    :filters="['physique', 'experience']"
    :generated-at="data?.generatedAt"
    :loading="pending"
    @refresh="refresh"
  >
    <AdminSampleSizeNotice
      v-if="data"
      :n="data.n"
      :segmented="activeSegmentCount > 0"
    />

    <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <AdminBreakdownCard
        title="Current physique"
        info="How respondents describe their physique today. The v1 survey didn't ask this, so its responses count as not asked."
        chart="donut"
        :breakdown="get('physique')"
        :loading="pending"
        :error="error"
        @retry="refresh"
      />
      <AdminBreakdownCard
        title="Training experience"
        info="How long respondents have trained consistently. “More than a year” is a v1 answer kept separate, since it overlaps two of today's options."
        ordered
        :breakdown="get('experience')"
        :loading="pending"
        :error="error"
        @retry="refresh"
      />
      <AdminBreakdownCard
        title="Workout availability"
        info="Days per week respondents say they could realistically train."
        ordered
        :breakdown="get('days_per_week')"
        :loading="pending"
        :error="error"
        @retry="refresh"
      />
      <AdminBreakdownCard
        title="Training environment"
        info="Where respondents usually train today. Asked from survey v2 onward."
        ordered
        :breakdown="get('usual_training_location')"
        :loading="pending"
        :error="error"
        @retry="refresh"
      />
      <AdminBreakdownCard
        v-if="get('training_location')?.answered"
        title="Where they'd train (v1 survey)"
        info="The first survey asked where people would train, not where they train now, so these answers are kept apart from the chart above."
        ordered
        :breakdown="get('training_location')"
        @retry="refresh"
      />
    </div>
  </AdminPage>
</template>
