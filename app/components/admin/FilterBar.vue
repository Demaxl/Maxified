<script setup lang="ts">
import type { SegmentField } from '#shared/analytics/filters'
import type { DateChoice } from '~/composables/useAdminFilters'

const props = withDefaults(defineProps<{
  fields?: SegmentField[]
  showDates?: boolean
}>(), {
  fields: () => ['physique', 'experience', 'goal', 'days', 'location'],
  showDates: true
})

const { data: meta } = useAdminMeta()
const { dateChoice, customRange, segments, activeSegmentCount, update, setDateChoice, setSegment, clearSegments } = useAdminFilters()

const dateItems: { label: string, value: DateChoice }[] = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'All time', value: 'all' },
  { label: 'Custom range', value: 'custom' }
]

const showSegments = ref(false)

// A filter set on another page still applies here, so it must stay visible and removable.
const visibleFields = computed(() => segmentFieldKeys
  .filter(field => props.fields.includes(field) || segments.value[field].length)
  .filter(field => meta.value?.filterOptions[field]))

const hasActiveFilters = computed(() => activeSegmentCount.value > 0)

function onCustomDate(key: 'from' | 'to', value: string) {
  update({ range: 'custom', [key]: value || undefined })
}
</script>

<template>
  <div class="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
    <div
      v-if="showDates"
      class="flex flex-wrap items-center gap-2"
    >
      <USelect
        :model-value="dateChoice"
        :items="dateItems"
        aria-label="Date range"
        size="sm"
        class="w-40"
        icon="i-lucide-calendar"
        @update:model-value="setDateChoice($event as DateChoice)"
      />
      <template v-if="dateChoice === 'custom'">
        <UInput
          type="date"
          size="sm"
          aria-label="From date"
          :model-value="customRange.from"
          :max="customRange.to || undefined"
          class="w-38"
          @update:model-value="onCustomDate('from', String($event ?? ''))"
        />
        <span class="text-xs text-sand-600">to</span>
        <UInput
          type="date"
          size="sm"
          aria-label="To date"
          :model-value="customRange.to"
          :min="customRange.from || undefined"
          class="w-38"
          @update:model-value="onCustomDate('to', String($event ?? ''))"
        />
      </template>
    </div>

    <template v-if="visibleFields.length">
      <UButton
        class="self-start lg:hidden"
        color="neutral"
        variant="outline"
        size="sm"
        icon="i-lucide-sliders-horizontal"
        :label="activeSegmentCount ? `Segment filters (${activeSegmentCount})` : 'Segment filters'"
        :aria-expanded="showSegments"
        aria-controls="segment-filters"
        @click="showSegments = !showSegments"
      />

      <div
        id="segment-filters"
        class="flex-wrap items-center gap-2 lg:flex"
        :class="showSegments ? 'flex' : 'hidden'"
      >
        <USelectMenu
          v-for="field in visibleFields"
          :key="field"
          :model-value="segments[field]"
          :items="meta!.filterOptions[field].options"
          value-key="value"
          label-key="label"
          multiple
          size="sm"
          :search-input="false"
          :placeholder="meta!.filterOptions[field].label"
          :aria-label="`Filter by ${meta!.filterOptions[field].label.toLowerCase()}`"
          class="w-full sm:w-44"
          :ui="{ base: segments[field].length ? 'ring-sand-950' : '' }"
          @update:model-value="setSegment(field, $event as string[])"
        >
          <template
            v-if="segments[field].length"
            #default
          >
            <span class="truncate">
              {{ meta!.filterOptions[field].label }}: {{ segments[field].length === 1 ? meta!.filterOptions[field].options.find(option => option.value === segments[field][0])?.label ?? segments[field][0] : `${segments[field].length} selected` }}
            </span>
          </template>
        </USelectMenu>

        <UButton
          v-if="hasActiveFilters"
          label="Clear"
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          size="sm"
          @click="clearSegments"
        />
      </div>
    </template>
  </div>
</template>
