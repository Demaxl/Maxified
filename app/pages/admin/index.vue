<script setup lang="ts">
import type { OverviewData, TopAnswer } from '#shared/analytics/types'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Survey overview' })

const { data, error, pending, refresh } = useAdminData<OverviewData>('/api/admin/overview')
const { sharedQuery } = useAdminFilters()

const kpis = computed(() => {
  const values = data.value?.kpis

  return [
    { label: 'Survey responses', metric: values?.responses, info: 'Submitted surveys in the selected dates and segment.' },
    { label: 'Waitlist signups', metric: values?.waitlist, info: 'New waitlist subscribers in the selected dates, from every signup form.' },
    { label: 'Completion rate', metric: values?.completionRate, info: 'Share of survey attempts that were submitted. An attempt starts when someone answers the first question; tracked server-side from the date shown.' },
    { label: 'Survey → waitlist', metric: values?.conversionRate, info: 'Share of tracked respondents who are on the waitlist, whether they joined before the survey or on its thank-you screen.' },
    { label: 'Responses, last 7 days', metric: values?.responsesLast7, info: 'Submitted surveys in the last 7 Lagos calendar days, including today. Segment filters apply.' },
    { label: 'Waitlist, last 7 days', metric: values?.waitlistLast7, info: 'New waitlist subscribers in the last 7 Lagos calendar days, including today.' }
  ]
})

const summaryMeta: Record<string, { heading: string, to: string }> = {
  physique: { heading: 'Most common physique', to: '/admin/audience' },
  goal: { heading: 'Most common goal', to: '/admin/struggles' },
  blockers: { heading: 'Biggest reported struggle', to: '/admin/struggles' },
  guide_wishlist: { heading: 'Most requested guide topic', to: '/admin/content' }
}

function summaryDetail(top: TopAnswer) {
  if (!top.label) {
    return 'No answers yet'
  }

  const base = `${formatPercent(top.pct)} · ${formatNumber(top.count)} of ${formatNumber(top.answered)} who answered`
  return top.tiedWith.length ? `${base} · tied with ${top.tiedWith.join(', ')}` : base
}
</script>

<template>
  <AdminPage
    title="Overview"
    :generated-at="data?.generatedAt"
    :loading="pending"
    @refresh="refresh"
  >
    <AdminSampleSizeNotice
      v-if="data?.segmented"
      :n="data.n"
      segmented
    />

    <div
      v-if="error && !data"
      class="rounded-lg border border-sand-200 bg-white p-6 text-sm text-sand-800"
      role="alert"
    >
      <p class="font-medium">
        The overview couldn't be loaded.
      </p>
      <p class="mt-1 text-sand-700">
        {{ error }}
      </p>
      <UButton
        class="mt-3"
        label="Try again"
        color="neutral"
        variant="outline"
        size="sm"
        @click="refresh"
      />
    </div>

    <div class="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:grid-cols-3 2xl:grid-cols-6">
      <AdminStatCard
        v-for="kpi in kpis"
        :key="kpi.label"
        :label="kpi.label"
        :info="kpi.info"
        :metric="kpi.metric"
        :loading="pending && !data"
      />
    </div>

    <AdminChartCard
      title="Responses and signups over time"
      info="Daily counts in Lagos time. Waitlist signups use the date filter only, because signups have no survey answers."
      :loading="pending && !data"
      :error="!data ? error : null"
      :empty="Boolean(data && !data.series.some(point => point.responses || point.waitlist))"
      empty-text="No responses or signups in these dates."
      :skeleton-rows="6"
      @retry="refresh"
    >
      <AdminTrendChart
        v-if="data"
        :series="data.series"
      />
    </AdminChartCard>

    <section aria-labelledby="summary-heading">
      <h2
        id="summary-heading"
        class="mb-3 text-sm font-semibold text-sand-950"
      >
        At a glance
      </h2>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <template v-if="data">
          <NuxtLink
            v-for="top in data.top"
            :key="top.questionId"
            :to="{ path: summaryMeta[top.questionId]!.to, query: sharedQuery }"
            class="group flex flex-col gap-1.5 rounded-lg border border-sand-200 bg-white p-4 hover:border-sand-400"
          >
            <span class="text-xs font-medium text-sand-600">{{ summaryMeta[top.questionId]!.heading }}</span>
            <span class="text-base/snug font-semibold text-sand-950 group-hover:underline">{{ top.label ?? '—' }}</span>
            <span class="text-xs text-sand-700">{{ summaryDetail(top) }}</span>
          </NuxtLink>
        </template>
        <template v-else>
          <USkeleton
            v-for="index in 4"
            :key="index"
            class="h-24 rounded-lg"
          />
        </template>
      </div>
    </section>
  </AdminPage>
</template>
