/**
 * Every day boundary in the dashboard is a Lagos calendar day: "last 7 days", the
 * daily chart buckets and custom ranges all agree, wherever the admin is browsing from.
 */
export const ANALYTICS_TIME_ZONE = 'Africa/Lagos'

const dayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: ANALYTICS_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
})

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: ANALYTICS_TIME_ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric'
})

export const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/** `YYYY-MM-DD` of the Lagos calendar day containing `date`. */
export function dayKey(date: Date | string) {
  return dayFormatter.format(typeof date === 'string' ? new Date(date) : date)
}

function zoneOffsetMs(instant: number) {
  const parts = Object.fromEntries(partsFormatter.formatToParts(new Date(instant)).map(part => [part.type, part.value]))
  const asUtc = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second))

  return asUtc - Math.floor(instant / 1000) * 1000
}

/** The instant a Lagos calendar day begins. */
export function startOfDay(day: string) {
  const [year, month, date] = day.split('-').map(Number)
  const guess = Date.UTC(year!, month! - 1, date!)

  return new Date(guess - zoneOffsetMs(guess))
}

export function addDays(day: string, amount: number) {
  const [year, month, date] = day.split('-').map(Number)
  const next = new Date(Date.UTC(year!, month! - 1, date! + amount))

  return next.toISOString().slice(0, 10)
}

export function today(now = new Date()) {
  return dayKey(now)
}

/** Inclusive on both ends, as days; `end` is the exclusive instant after `to`. */
export type DateRange = { from: string, to: string }

export function rangeInstants(range: Partial<DateRange>) {
  return {
    start: range.from ? startOfDay(range.from) : undefined,
    end: range.to ? startOfDay(addDays(range.to, 1)) : undefined
  }
}

export function isInRange(date: Date | string, range: Partial<DateRange>) {
  const key = dayKey(date)
  return (!range.from || key >= range.from) && (!range.to || key <= range.to)
}

export function eachDay(from: string, to: string) {
  const days: string[] = []

  for (let day = from; day <= to; day = addDays(day, 1)) {
    days.push(day)
  }

  return days
}

export type DatePreset = '7d' | '30d' | '90d' | 'all'

/** The last N days include today. */
export function presetRange(preset: DatePreset, now = new Date()): Partial<DateRange> {
  if (preset === 'all') {
    return {}
  }

  const days = Number.parseInt(preset, 10)
  const to = today(now)

  return { from: addDays(to, -(days - 1)), to }
}
