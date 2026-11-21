<script setup lang="ts">
import { VisAxis, VisCrosshair, VisLine, VisTooltip, VisXYContainer } from '@unovis/vue'

type Point = { day: string, responses: number, waitlist: number }

const props = defineProps<{
  series: Point[]
}>()

const lines = [
  { key: 'responses' as const, label: 'Survey responses', color: '#111111' },
  { key: 'waitlist' as const, label: 'Waitlist signups', color: '#5D8F0F' }
]

/** Long ranges are grouped by week so the line stays readable. */
const grouped = computed(() => {
  if (props.series.length <= 120) {
    return props.series
  }

  const weeks: Point[] = []

  props.series.forEach((point, index) => {
    if (index % 7 === 0) {
      weeks.push({ ...point })
    } else {
      const week = weeks[weeks.length - 1]!
      week.responses += point.responses
      week.waitlist += point.waitlist
    }
  })

  return weeks
})

const isWeekly = computed(() => grouped.value !== props.series)

const dayFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })

function formatDay(day: string) {
  return dayFormat.format(new Date(`${day}T00:00:00Z`))
}

const x = (_: Point, index: number) => index
const y = lines.map(line => (point: Point) => point[line.key])
const colors = lines.map(line => line.color)

function tickFormat(tick: number | Date) {
  const point = grouped.value[Math.round(Number(tick))]
  return point ? formatDay(point.day) : ''
}

const tickCount = computed(() => Math.min(grouped.value.length, 6))

function tooltip(point: Point) {
  const heading = isWeekly.value ? `Week of ${formatDay(point.day)}` : formatDay(point.day)
  const rows = lines
    .map(line => `<div style="display:flex;gap:8px;align-items:center"><span style="width:8px;height:8px;border-radius:9999px;background:${line.color}"></span>${line.label}: <strong>${point[line.key]}</strong></div>`)
    .join('')

  return `<div style="font-size:12px;line-height:1.5"><div style="font-weight:600;margin-bottom:2px">${heading}</div>${rows}</div>`
}

const chartTheme = {
  '--vis-axis-tick-label-color': 'var(--color-sand-600)',
  '--vis-axis-grid-color': 'var(--color-sand-200)',
  '--vis-axis-domain-color': 'var(--color-sand-300)',
  '--vis-axis-tick-label-font-size': '11px',
  '--vis-font-family': 'var(--font-sans)'
}

const totals = computed(() => lines.map(line => ({
  ...line,
  total: props.series.reduce((sum, point) => sum + point[line.key], 0)
})))
</script>

<template>
  <div
    class="flex flex-col gap-3"
    :style="chartTheme"
  >
    <ul class="flex flex-wrap gap-x-5 gap-y-1 text-xs text-sand-700">
      <li
        v-for="line in totals"
        :key="line.key"
        class="flex items-center gap-2"
      >
        <span
          class="h-0.5 w-4 rounded-full"
          :style="{ backgroundColor: line.color }"
          aria-hidden="true"
        />
        {{ line.label }} <strong class="text-sand-950 tabular-nums">{{ formatNumber(line.total) }}</strong>
      </li>
      <li v-if="isWeekly">
        Grouped by week
      </li>
    </ul>

    <div
      role="img"
      :aria-label="`Line chart of ${totals.map(line => `${line.label.toLowerCase()} (${line.total} in total)`).join(' and ')} over ${grouped.length} ${isWeekly ? 'weeks' : 'days'}.`"
    >
      <VisXYContainer
        :data="grouped"
        :height="240"
        :margin="{ top: 8, right: 8 }"
        :y-domain-min-constraint="[0, 0]"
      >
        <VisLine
          :x="x"
          :y="y"
          :color="colors"
          :line-width="2"
          curve-type="linear"
        />
        <VisAxis
          type="x"
          :tick-format="tickFormat"
          :num-ticks="tickCount"
          :grid-line="false"
          :tick-line="false"
        />
        <VisAxis
          type="y"
          :num-ticks="4"
          :tick-format="(tick: number) => Number.isInteger(tick) ? String(tick) : ''"
          :domain-line="false"
          :tick-line="false"
        />
        <VisCrosshair
          :template="tooltip"
          :color="colors"
        />
        <VisTooltip />
      </VisXYContainer>
    </div>
  </div>
</template>
