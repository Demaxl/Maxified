<script setup lang="ts">
import type { ContentData, ContentTopic, PriorityTier } from '#shared/analytics/types'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Content demand' })

const route = useRoute()
const { data: meta } = useAdminMeta()
const { activeSegmentCount, sharedQuery, update } = useAdminFilters()

const comparisonKeys = ['aPhysique', 'aExperience', 'bPhysique', 'bExperience'] as const
type ComparisonKey = (typeof comparisonKeys)[number]

const comparison = computed(() => Object.fromEntries(comparisonKeys.map(key => [
  key,
  [route.query[key] ?? []].flat().filter((value): value is string => typeof value === 'string')
])) as Record<ComparisonKey, string[]>)

const { data, error, pending, refresh } = useAdminData<ContentData>('/api/admin/content', comparison)

const beginnerLevels = ['haven_t_started', 'less_than_3_months', '3_6_months']

function compareBeginners() {
  update({ aPhysique: ['skinny'], aExperience: beginnerLevels, bPhysique: ['skinny_fat'], bExperience: beginnerLevels })
}

function clearComparison() {
  update(Object.fromEntries(comparisonKeys.map(key => [key, undefined])))
}

const hasComparison = computed(() => comparisonKeys.some(key => comparison.value[key].length))

const tiers: Record<PriorityTier, { label: string, class: string, description: string }> = {
  core: { label: 'Core chapter', class: 'bg-sand-950 text-white', description: 'Strong, broad demand. A candidate for its own chapter.' },
  supporting: { label: 'Supporting section', class: 'bg-lime-300 text-sand-950', description: 'Clear demand. Worth a dedicated section.' },
  optional: { label: 'Optional', class: 'bg-sand-200 text-sand-900', description: 'Some interest, or not enough data to say more.' },
  low_signal: { label: 'Low signal', class: 'bg-white text-sand-700 ring-1 ring-sand-300', description: 'Few respondents asked for it.' }
}

function trendText(topic: ContentTopic) {
  if (!topic.trend.available) {
    return null
  }

  const points = Math.round(topic.trend.change * 1000) / 10
  return `${points > 0 ? '+' : ''}${points} pts`
}

function scoreBreakdown(topic: ContentTopic) {
  const { demand, struggle, breadth } = topic.priority.components
  const parts = [
    `Demand ${formatPercent(demand)} of the top topic`,
    struggle === null ? 'struggle signal n/a' : `struggle signal ${formatPercent(struggle)}`,
    breadth === null ? 'breadth n/a' : `in the top list for ${formatPercent(breadth)} of physique segments`
  ]
  const related = topic.priority.relatedStruggles.length
    ? `Addresses: ${topic.priority.relatedStruggles.map(item => `${item.label} (${formatPercent(item.pct)})`).join('; ')}.`
    : ''

  return [`Score ${topic.priority.score.toFixed(2)}: ${parts.join(', ')}.`, related, ...topic.priority.reasons].filter(Boolean).join(' ')
}
</script>

<template>
  <AdminPage
    title="Content Demand"
    description="What respondents want in the guide, ranked by how many asked for it, with a suggested priority that also weighs the struggles each topic addresses."
    :generated-at="data?.generatedAt"
    :loading="pending"
    @refresh="refresh"
  >
    <AdminSampleSizeNotice
      v-if="data"
      :n="data.answered"
      noun="respondents answered the topic question"
      :segmented="activeSegmentCount > 0"
    />

    <AdminChartCard
      title="Requested guide topics"
      info="From “What would you most want included in a fitness guide?” (up to 5 choices). Percentages are of respondents who answered it. Trend compares each topic's share in the last 30 days with the 30 days before."
      multi
      :loading="pending && !data"
      :error="!data ? error : null"
      :empty="Boolean(data && !data.answered)"
      :footnote="data ? `Trend windows: ${data.trendWindow.recent} (${data.trendWindow.recentN} respondents) vs ${data.trendWindow.previous} (${data.trendWindow.previousN}); shown only when both have ${data.trendWindow.minimum}+.` : undefined"
      :skeleton-rows="8"
      @retry="refresh"
    >
      <div
        v-if="data"
        class="-mx-4 overflow-x-auto sm:-mx-5"
      >
        <table class="w-full min-w-xl text-sm">
          <thead>
            <tr class="border-b border-sand-200 text-left text-xs text-sand-600">
              <th
                scope="col"
                class="w-10 py-2 pr-2 pl-4 font-medium sm:pl-5"
              >
                #
              </th>
              <th
                scope="col"
                class="py-2 pr-4 font-medium"
              >
                Topic
              </th>
              <th
                scope="col"
                class="py-2 pr-4 text-right font-medium"
              >
                Respondents
              </th>
              <th
                scope="col"
                class="py-2 pr-4 text-right font-medium"
              >
                Share
              </th>
              <th
                scope="col"
                class="py-2 pr-4 text-right font-medium"
              >
                30-day trend
              </th>
              <th
                scope="col"
                class="py-2 pr-4 font-medium sm:pr-5"
              >
                Suggested priority
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="topic in data.topics"
              :key="topic.value"
              class="border-b border-sand-100 last:border-0"
            >
              <td class="py-2.5 pr-2 pl-4 text-sand-600 tabular-nums sm:pl-5">
                {{ topic.rank }}
              </td>
              <td class="py-2.5 pr-4">
                <NuxtLink
                  v-if="topic.count"
                  :to="responsesLink('guide_wishlist', topic.value, sharedQuery)"
                  class="text-sand-950 hover:underline"
                >
                  {{ topic.label }}
                </NuxtLink>
                <span
                  v-else
                  class="text-sand-700"
                >{{ topic.label }}</span>
                <div
                  class="mt-1 h-1.5 max-w-60 overflow-hidden rounded-full bg-sand-100"
                  aria-hidden="true"
                >
                  <div
                    class="h-full rounded-full bg-sand-900"
                    :style="{ width: `${topic.pct * 100}%` }"
                  />
                </div>
              </td>
              <td class="py-2.5 pr-4 text-right text-sand-900 tabular-nums">
                {{ formatNumber(topic.count) }}
              </td>
              <td class="py-2.5 pr-4 text-right font-semibold text-sand-950 tabular-nums">
                {{ formatPercent(topic.pct) }}
              </td>
              <td class="py-2.5 pr-4 text-right text-xs tabular-nums">
                <span
                  v-if="trendText(topic)"
                  class="text-sand-900"
                >{{ trendText(topic) }}</span>
                <span
                  v-else
                  class="text-sand-600"
                  :title="topic.trend.available ? undefined : topic.trend.reason"
                >Not enough data</span>
              </td>
              <td class="py-2.5 pr-4 sm:pr-5">
                <UTooltip
                  :text="scoreBreakdown(topic)"
                  :ui="{ content: 'h-auto max-w-80 py-2', text: 'whitespace-normal' }"
                >
                  <button
                    type="button"
                    class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap"
                    :class="tiers[topic.priority.tier].class"
                    :aria-label="`${tiers[topic.priority.tier].label}. ${scoreBreakdown(topic)}`"
                  >
                    {{ tiers[topic.priority.tier].label }}
                  </button>
                </UTooltip>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AdminChartCard>

    <div class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <AdminChartCard
        title="Compare two audience segments"
        info="Topic shares within each segment, among respondents who answered the topic question. Segments also respect the filters above."
        multi
        :loading="pending && !data"
        :error="!data ? error : null"
        @retry="refresh"
      >
        <template #actions>
          <UButton
            v-if="hasComparison"
            label="Clear"
            color="neutral"
            variant="ghost"
            size="xs"
            @click="clearComparison"
          />
        </template>

        <div class="flex flex-col gap-5">
          <div
            v-if="meta"
            class="grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            <fieldset
              v-for="side in (['a', 'b'] as const)"
              :key="side"
              class="flex min-w-0 flex-col gap-2"
            >
              <legend class="mb-1 text-xs font-medium text-sand-600">
                Segment {{ side.toUpperCase() }}
              </legend>
              <USelectMenu
                :model-value="comparison[`${side}Physique`]"
                :items="meta.filterOptions.physique.options"
                value-key="value"
                label-key="label"
                multiple
                size="sm"
                :search-input="false"
                placeholder="Any physique"
                :aria-label="`Segment ${side.toUpperCase()} physique`"
                class="w-full"
                @update:model-value="update({ [`${side}Physique`]: $event as string[] })"
              />
              <USelectMenu
                :model-value="comparison[`${side}Experience`]"
                :items="meta.filterOptions.experience.options"
                value-key="value"
                label-key="label"
                multiple
                size="sm"
                :search-input="false"
                placeholder="Any experience"
                :aria-label="`Segment ${side.toUpperCase()} experience`"
                class="w-full"
                @update:model-value="update({ [`${side}Experience`]: $event as string[] })"
              />
            </fieldset>
          </div>

          <AdminSegmentComparison
            v-if="data?.comparison"
            :a="data.comparison.a"
            :b="data.comparison.b"
          />
          <div
            v-else
            class="flex flex-col items-start gap-2 rounded-md bg-sand-50 p-4 text-sm text-sand-700"
          >
            Choose a physique or experience level for each segment, or start with a common comparison.
            <UButton
              label="Skinny beginners vs skinny-fat beginners"
              color="neutral"
              variant="outline"
              size="xs"
              @click="compareBeginners"
            />
            <span class="text-xs text-sand-600">Beginners: not started, under 3 months, or 3–6 months of training.</span>
          </div>
        </div>
      </AdminChartCard>

      <AdminChartCard
        title="How the suggested priority works"
        info="A transparent rule of thumb, not a verdict. Edit the weights and thresholds in shared/analytics/priority.ts."
        :loading="pending && !data"
        :error="!data ? error : null"
        @retry="refresh"
      >
        <div
          v-if="data"
          class="flex flex-col gap-4 text-sm text-sand-800"
        >
          <UBadge
            label="Suggestion, not a survey statistic"
            color="neutral"
            variant="outline"
            class="self-start"
          />
          <p>Each topic gets a score from 0 to 1, a weighted mix of:</p>
          <ul class="flex flex-col gap-2">
            <li>
              <strong>Demand ({{ formatPercent(data.priorityConfig.weights.demand!) }})</strong> —
              its share relative to the most requested topic.
            </li>
            <li>
              <strong>Struggle fit ({{ formatPercent(data.priorityConfig.weights.struggle!) }})</strong> —
              how common the struggles it addresses are, relative to the most common struggle.
            </li>
            <li>
              <strong>Breadth ({{ formatPercent(data.priorityConfig.weights.breadth!) }})</strong> —
              how many physique segments ({{ data.priorityConfig.minSegmentSize }}+ respondents) have it in their top {{ data.priorityConfig.topN }}.
            </li>
          </ul>
          <p class="text-xs text-sand-700">
            Signals without enough data are left out and the rest re-weighted. Below {{ data.priorityConfig.minSample }} respondents, no topic is rated above “Optional”.
          </p>
          <ul class="flex flex-col gap-1.5">
            <li
              v-for="(tier, key) in tiers"
              :key="key"
              class="flex items-start gap-2 text-xs"
            >
              <span
                class="inline-flex shrink-0 rounded-full px-2 py-0.5 font-medium"
                :class="tier.class"
              >{{ tier.label }}</span>
              <span class="pt-0.5 text-sand-700">
                {{ key === 'low_signal' ? `Below ${data.priorityConfig.thresholds.optional}` : `${data.priorityConfig.thresholds[key]}+` }} · {{ tier.description }}
              </span>
            </li>
          </ul>
        </div>
      </AdminChartCard>
    </div>

    <AdminBreakdownCard
      v-if="data?.legacy"
      title="Program wishlist (v1 survey)"
      info="The first survey asked a differently worded topic question with different options (up to 3), so it isn't merged into the ranking above."
      :breakdown="data.legacy"
    />
  </AdminPage>
</template>
