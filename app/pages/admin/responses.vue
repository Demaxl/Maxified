<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { ResponseListData, ResponseListItem } from '#shared/analytics/types'
import { parseAnswerMatch } from '#shared/analytics/filters'
import { labelFor, titleForKey } from '#shared/survey-catalog'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'All responses' })

const route = useRoute()
const { update, activeSegmentCount } = useAdminFilters()

type SortField = 'date' | 'physique' | 'goal' | 'experience'

const first = (value: unknown) => [value ?? []].flat().find((item): item is string => typeof item === 'string') ?? ''

const page = computed(() => Math.max(1, Number.parseInt(first(route.query.page), 10) || 1))
const sort = computed<SortField>(() => (['date', 'physique', 'goal', 'experience'] as const).find(field => field === first(route.query.sort)) ?? 'date')
const direction = computed<'asc' | 'desc'>(() => first(route.query.dir) === 'asc' ? 'asc' : 'desc')
const answerFilters = computed(() => [route.query.answer ?? []].flat().filter((item): item is string => typeof item === 'string'))
const selectedId = computed(() => first(route.query.response) || null)

const PAGE_SIZE = 25

const search = ref(first(route.query.q))
const debouncedSearch = refDebounced(search, 350)

watch(debouncedSearch, (value) => {
  if (value !== first(route.query.q)) {
    update({ q: value.trim() || undefined })
  }
})

const extra = computed(() => ({
  q: first(route.query.q) || undefined,
  sort: sort.value,
  dir: direction.value,
  page: page.value,
  pageSize: PAGE_SIZE,
  answer: answerFilters.value
}))

const { data, error, pending, refresh } = useAdminData<ResponseListData>('/api/admin/responses', extra)

function setSort(field: SortField) {
  const nextDirection = sort.value === field && direction.value === 'desc' ? 'asc' : 'desc'
  update({ sort: field === 'date' ? undefined : field, dir: nextDirection === 'desc' ? undefined : nextDirection })
}

function setPage(value: number) {
  return navigateTo({ query: { ...route.query, page: value > 1 ? String(value) : undefined } }, { replace: true })
}

function openResponse(id: string | null) {
  return navigateTo({ query: { ...route.query, response: id ?? undefined } }, { replace: true })
}

function answerChipLabel(raw: string) {
  const match = parseAnswerMatch(raw)
  return match ? `${titleForKey(match.questionId)} → ${labelFor(match.questionId, match.value)}` : raw
}

function removeAnswerFilter(raw: string) {
  update({ answer: answerFilters.value.filter(item => item !== raw) })
}

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Lagos' })

const sortable: Record<string, SortField> = { createdAt: 'date', physique: 'physique', goal: 'goal', experience: 'experience' }

const columns: TableColumn<ResponseListItem>[] = [
  { accessorKey: 'createdAt', header: 'Submitted' },
  { accessorKey: 'physique', header: 'Physique' },
  { accessorKey: 'goal', header: 'Main goal' },
  { accessorKey: 'experience', header: 'Experience' },
  { accessorKey: 'struggles', header: 'Struggles' },
  { accessorKey: 'onWaitlist', header: 'Waitlist' }
]

const rangeLabel = computed(() => {
  if (!data.value?.total) {
    return ''
  }

  const start = (data.value.page - 1) * data.value.pageSize + 1
  const end = Math.min(data.value.total, start + data.value.items.length - 1)
  return `${formatNumber(start)}–${formatNumber(end)} of ${formatNumber(data.value.total)}`
})
</script>

<template>
  <AdminPage
    title="All Responses"
    :generated-at="data?.generatedAt"
    :loading="pending"
    @refresh="refresh"
  >
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Search answers, e.g. “keto” or “legs”"
        aria-label="Search responses"
        class="w-full sm:max-w-sm"
        :ui="{ trailing: 'pe-1' }"
      >
        <template
          v-if="search"
          #trailing
        >
          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="link"
            size="sm"
            aria-label="Clear search"
            @click="search = ''"
          />
        </template>
      </UInput>
      <span
        class="text-sm text-sand-700"
        aria-live="polite"
      >{{ rangeLabel }}</span>
    </div>

    <div
      v-if="answerFilters.length"
      class="flex flex-wrap items-center gap-2"
    >
      <span class="text-xs text-sand-600">Showing responses where</span>
      <UBadge
        v-for="raw in answerFilters"
        :key="raw"
        color="neutral"
        variant="subtle"
        class="max-w-full gap-1"
      >
        <span class="truncate">{{ answerChipLabel(raw) }}</span>
        <button
          type="button"
          class="-me-0.5 rounded-sm p-0.5 hover:bg-sand-200"
          :aria-label="`Remove filter ${answerChipLabel(raw)}`"
          @click="removeAnswerFilter(raw)"
        >
          <UIcon
            name="i-lucide-x"
            class="size-3"
          />
        </button>
      </UBadge>
    </div>

    <div class="overflow-hidden rounded-lg border border-sand-200 bg-white">
      <div
        v-if="error && !data"
        class="flex flex-col items-start gap-2 p-6 text-sm text-sand-800"
        role="alert"
      >
        <span class="font-medium">Couldn't load responses.</span>
        <span class="text-sand-700">{{ error }}</span>
        <UButton
          label="Try again"
          color="neutral"
          variant="outline"
          size="xs"
          @click="refresh"
        />
      </div>

      <UTable
        v-else
        :data="data?.items ?? []"
        :columns="columns"
        :loading="pending"
        loading-color="neutral"
        :empty="activeSegmentCount || answerFilters.length || first(route.query.q) ? 'No responses match these filters.' : 'No survey responses yet.'"
        :ui="{
          th: 'text-xs font-medium text-sand-600 whitespace-nowrap',
          td: 'text-sm text-sand-900 align-top',
          tr: 'cursor-pointer hover:bg-sand-50 data-[selected=true]:bg-sand-50'
        }"
        @select="(_event, row) => openResponse(row.original.id)"
      >
        <template
          v-for="(field, key) in sortable"
          :key="key"
          #[`${key}-header`]="{ column }"
        >
          <button
            type="button"
            class="-mx-1 inline-flex items-center gap-1 rounded px-1 hover:text-sand-950"
            :aria-label="`Sort by ${String(column.columnDef.header).toLowerCase()}`"
            @click.stop="setSort(field)"
          >
            {{ column.columnDef.header }}
            <UIcon
              :name="sort === field ? (direction === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down') : 'i-lucide-arrow-up-down'"
              class="size-3.5"
              :class="sort === field ? 'text-sand-950' : 'text-sand-400'"
            />
          </button>
        </template>

        <template #createdAt-cell="{ row }">
          <span class="whitespace-nowrap">{{ dateFormat.format(new Date(row.original.createdAt)) }}</span>
          <UBadge
            v-if="row.original.version === 'v1'"
            label="v1"
            color="neutral"
            variant="outline"
            size="sm"
            class="ml-1.5"
            title="Answered the first, 8-question survey"
          />
        </template>

        <template
          v-for="key in ['physique', 'goal', 'experience'] as const"
          :key="key"
          #[`${key}-cell`]="{ row }"
        >
          <span v-if="row.original[key]">{{ row.original[key] }}</span>
          <span
            v-else
            class="text-sand-600"
          >—</span>
        </template>

        <template #struggles-cell="{ row }">
          <span
            v-if="row.original.struggles.length"
            class="line-clamp-2 max-w-72"
            :title="row.original.struggles.join('; ')"
          >
            {{ row.original.struggles[0] }}<template v-if="row.original.struggles.length > 1">
              <span class="text-sand-600"> +{{ row.original.struggles.length - 1 }} more</span>
            </template>
          </span>
          <span
            v-else
            class="text-sand-600"
          >—</span>
        </template>

        <template #onWaitlist-cell="{ row }">
          <span
            v-if="row.original.onWaitlist === true"
            class="inline-flex items-center gap-1 text-sand-950"
          >
            <UIcon
              name="i-lucide-check"
              class="size-4"
            />Yes
          </span>
          <span
            v-else-if="row.original.onWaitlist === false"
            class="text-sand-700"
          >No</span>
          <span
            v-else
            class="text-sand-600"
            title="Saved before waitlist linking was tracked, and no matching email was found."
          >Unknown</span>
        </template>
      </UTable>
    </div>

    <div
      v-if="data && data.total > data.pageSize"
      class="flex justify-center sm:justify-end"
    >
      <UPagination
        :page="page"
        :total="data.total"
        :items-per-page="data.pageSize"
        color="neutral"
        active-color="neutral"
        size="sm"
        @update:page="setPage"
      />
    </div>

    <AdminResponseDetail
      :response-id="selectedId"
      @close="openResponse(null)"
    />
  </AdminPage>
</template>
