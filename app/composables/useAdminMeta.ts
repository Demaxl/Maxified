import type { SegmentField } from '#shared/analytics/filters'

export type AdminMeta = {
  generatedAt: string
  timeZone: string
  trackingStartedAt: string | null
  totals: { responses: number, waitlist: number }
  filterOptions: Record<SegmentField, { label: string, questionId: string, options: { value: string, label: string }[] }>
}

/** Filter options and tracking status, loaded once and shared by every dashboard page. */
export function useAdminMeta() {
  return useAsyncData('admin-meta', () => $fetch<AdminMeta>('/api/admin/meta'), { server: false })
}
