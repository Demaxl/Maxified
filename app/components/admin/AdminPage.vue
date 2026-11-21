<script setup lang="ts">
import type { SegmentField } from '#shared/analytics/filters'

withDefaults(defineProps<{
  title: string
  description?: string
  /** Which segment filters the page offers; `false` hides the filter bar entirely. */
  filters?: SegmentField[] | false
  showDates?: boolean
  generatedAt?: string | null
  loading?: boolean
}>(), {
  description: undefined,
  filters: () => ['physique', 'experience', 'goal', 'days', 'location'],
  showDates: true,
  generatedAt: null,
  loading: false
})

const emit = defineEmits<{ refresh: [] }>()
</script>

<template>
  <UDashboardPanel :ui="{ body: 'gap-6 sm:gap-8 sm:p-6 lg:p-8' }">
    <template #header>
      <UDashboardNavbar
        :title="title"
        :ui="{ root: 'border-sand-200 bg-white', title: 'text-base font-semibold text-sand-950' }"
      >
        <template #right>
          <AdminDataStatus
            :generated-at="generatedAt"
            :loading="loading"
            @refresh="emit('refresh')"
          />
        </template>
      </UDashboardNavbar>

      <div
        v-if="filters !== false"
        class="border-b border-sand-200 bg-white px-4 py-3 sm:px-6"
      >
        <AdminFilterBar
          :fields="filters"
          :show-dates="showDates"
        />
      </div>
    </template>

    <template #body>
      <p
        v-if="description"
        class="max-w-3xl text-sm text-sand-700"
      >
        {{ description }}
      </p>
      <slot />
    </template>
  </UDashboardPanel>
</template>
