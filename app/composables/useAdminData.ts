type QueryValue = string | number | string[] | undefined

/**
 * Loads one admin endpoint with the active filters (plus any extra params) and reloads
 * whenever they change. The dashboard is client-rendered, so there's no SSR payload to
 * share; each call owns its own state, and a stale response never overwrites a newer one.
 */
export function useAdminData<T>(path: string, extra: MaybeRefOrGetter<Record<string, QueryValue>> = {}) {
  const { apiQuery } = useAdminFilters()
  const route = useRoute()

  const data = shallowRef<T | null>(null)
  const error = ref<string | null>(null)
  const status = ref<'idle' | 'pending' | 'success' | 'error'>('idle')
  let latest = 0

  const query = computed(() => ({ ...apiQuery.value, ...toValue(extra) }))

  async function refresh() {
    const request = ++latest
    status.value = 'pending'
    error.value = null

    try {
      const result = await $fetch<T>(path, { query: query.value })

      if (request === latest) {
        data.value = result
        status.value = 'success'
      }
    } catch (failure) {
      if (request !== latest) {
        return
      }

      const response = failure as { statusCode?: number, data?: { data?: { message?: string }, message?: string } }

      if (response.statusCode === 401) {
        await navigateTo({ path: '/admin/login', query: { next: route.fullPath } })
        return
      }

      error.value = response.data?.data?.message ?? response.data?.message ?? 'Something went wrong loading this data.'
      status.value = 'error'
    }
  }

  // Compared by value: unrelated URL changes rebuild the object without changing it.
  watch(() => JSON.stringify(query.value), refresh, { immediate: true })

  return {
    data,
    error,
    status,
    pending: computed(() => status.value === 'pending' || status.value === 'idle'),
    refresh
  }
}
