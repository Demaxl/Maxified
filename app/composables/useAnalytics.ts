type AnalyticsEvent
  = | 'waitlist_view'
    | 'waitlist_cta_click'
    | 'waitlist_submit'
    | 'waitlist_success'
    | 'waitlist_duplicate'
    | 'waitlist_error'
    | 'survey_start'
    | 'survey_step'
    | 'survey_submit'
    | 'survey_success'
    | 'survey_error'
    | 'photo_zoom'

type AnalyticsProps = Record<string, string | number | boolean>

declare global {
  interface Window {
    dataLayer?: unknown[]
    plausible?: (event: string, options?: { props?: AnalyticsProps }) => void
  }
}

/**
 * Single funnel for page events. Everything is pushed to `dataLayer` so any tag
 * manager can pick it up, and forwarded to Plausible when it is loaded.
 */
export function useAnalytics() {
  function track(event: AnalyticsEvent, props: AnalyticsProps = {}) {
    if (import.meta.server) {
      return
    }

    window.dataLayer = window.dataLayer ?? []
    window.dataLayer.push({ event, ...props })
    window.plausible?.(event, Object.keys(props).length ? { props } : undefined)
  }

  return { track }
}
