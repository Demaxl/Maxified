<script setup lang="ts">
import type { BreakdownData } from '#shared/analytics/types'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Struggles & goals' })

const { data, error, pending, refresh } = useAdminData<BreakdownData>('/api/admin/breakdown', {
  questions: 'goal,blockers,consistency_breakers,most_confusing,obstacles'
})
const { activeSegmentCount } = useAdminFilters()

const get = (id: string) => data.value?.breakdowns[id] ?? null
</script>

<template>
  <AdminPage
    title="Struggles & Goals"
    description="What respondents are trying to achieve and what is stopping them. Click any bar to read the responses behind it."
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
        class="xl:col-span-2"
        title="Biggest fitness struggles"
        info="Everything respondents said is stopping them from getting the physique they want. Each respondent could choose several."
        :breakdown="get('blockers')"
        :loading="pending"
        :error="error"
        :limit="13"
        @retry="refresh"
      />
      <AdminBreakdownCard
        title="Primary fitness goals"
        info="Each respondent's single main goal right now."
        :breakdown="get('goal')"
        :loading="pending"
        :error="error"
        @retry="refresh"
      />
      <AdminBreakdownCard
        title="Consistency challenges"
        info="The one thing that usually makes respondents stop being consistent."
        :breakdown="get('consistency_breakers')"
        :loading="pending"
        :error="error"
        @retry="refresh"
      />
      <AdminBreakdownCard
        title="Most confusing area of fitness"
        info="The single part of fitness each respondent finds most confusing."
        :breakdown="get('most_confusing')"
        :loading="pending"
        :error="error"
        @retry="refresh"
      />
      <AdminBreakdownCard
        v-if="get('obstacles')?.answered"
        title="Biggest obstacles (v1 survey)"
        info="The first survey's version of the struggles question: different options and a limit of two, so it's shown on its own rather than merged."
        :breakdown="get('obstacles')"
        @retry="refresh"
      />
    </div>
  </AdminPage>
</template>
