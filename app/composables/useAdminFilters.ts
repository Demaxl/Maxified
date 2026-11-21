import type { LocationQuery, LocationQueryRaw } from 'vue-router'
import { DAY_PATTERN, presetRange } from '#shared/analytics/dates'
import type { DatePreset } from '#shared/analytics/dates'
import { segmentFields } from '#shared/analytics/filters'
import type { SegmentField } from '#shared/analytics/filters'

export type DateChoice = DatePreset | 'custom'

export const segmentFieldKeys = Object.keys(segmentFields) as SegmentField[]

/** Query keys shared by every dashboard page, so filters follow you between sections. */
export const sharedFilterKeys = ['range', 'from', 'to', ...segmentFieldKeys] as const

function asArray(value: LocationQuery[string] | undefined) {
  return [value ?? []].flat().filter((item): item is string => typeof item === 'string' && item !== '')
}

function asString(value: LocationQuery[string] | undefined) {
  const first = asArray(value)[0]
  return first ?? ''
}

/**
 * The active dashboard filters, stored in the URL so they survive navigation and reloads
 * and a filtered view can be bookmarked or shared.
 */
export function useAdminFilters() {
  const route = useRoute()
  const router = useRouter()

  const dateChoice = computed<DateChoice>(() => {
    const value = asString(route.query.range)
    return (['7d', '30d', '90d', 'all', 'custom'] as const).includes(value as DateChoice) ? value as DateChoice : 'all'
  })

  const customRange = computed(() => {
    const from = asString(route.query.from)
    const to = asString(route.query.to)

    return { from: DAY_PATTERN.test(from) ? from : '', to: DAY_PATTERN.test(to) ? to : '' }
  })

  const segments = computed(() => Object.fromEntries(
    segmentFieldKeys.map(field => [field, asArray(route.query[field])])
  ) as Record<SegmentField, string[]>)

  const dateRange = computed(() => {
    if (dateChoice.value === 'custom') {
      return { from: customRange.value.from || undefined, to: customRange.value.to || undefined }
    }

    return presetRange(dateChoice.value)
  })

  /** What the analytics endpoints receive. */
  const apiQuery = computed(() => ({ ...dateRange.value, ...segments.value }))

  const activeSegmentCount = computed(() => segmentFieldKeys.filter(field => segments.value[field].length).length)

  /** The shared filter params from the current URL, for links to other dashboard pages. */
  const sharedQuery = computed<LocationQueryRaw>(() => Object.fromEntries(
    sharedFilterKeys.filter(key => route.query[key] !== undefined).map(key => [key, route.query[key]])
  ))

  function update(patch: Record<string, string | string[] | undefined>) {
    // Any filter change invalidates the current page of results.
    const query: LocationQueryRaw = Object.fromEntries(
      Object.entries({ ...route.query, ...patch }).filter(([key, value]) =>
        key !== 'page' && value !== undefined && value !== '' && !(Array.isArray(value) && !value.length))
    )

    return router.replace({ query })
  }

  function setDateChoice(choice: DateChoice) {
    return update(choice === 'custom'
      ? { range: 'custom', from: customRange.value.from || dateRange.value.from, to: customRange.value.to || dateRange.value.to }
      : { range: choice === 'all' ? undefined : choice, from: undefined, to: undefined })
  }

  function setSegment(field: SegmentField, values: string[]) {
    return update({ [field]: values })
  }

  function clearSegments() {
    return update(Object.fromEntries(segmentFieldKeys.map(field => [field, undefined])))
  }

  return {
    dateChoice,
    customRange,
    dateRange,
    segments,
    apiQuery,
    activeSegmentCount,
    sharedQuery,
    update,
    setDateChoice,
    setSegment,
    clearSegments
  }
}
