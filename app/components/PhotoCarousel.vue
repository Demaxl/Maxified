<script setup lang="ts">
import type { PhotoEntry } from './EditorialPhoto.vue'

const props = defineProps<{
  slides: PhotoEntry[]
  /** Accessible name for the carousel, e.g. "Photos from when I started". */
  label: string
  /** Text and colour classes for the tag pinned to the top corner of the frame. */
  tag: { text: string, class: string }
}>()

const slides = computed(() => props.slides)

const track = useTemplateRef<HTMLElement>('track')
const active = ref(0)
const atStart = ref(true)
const atEnd = ref(false)

function slideElements() {
  return Array.from(track.value?.children ?? []) as HTMLElement[]
}

/** Swiping and the buttons both move the track, so state is read back from scroll position. */
function sync() {
  const el = track.value

  if (!el) {
    return
  }

  const maxScroll = el.scrollWidth - el.clientWidth
  atStart.value = el.scrollLeft <= 2
  atEnd.value = el.scrollLeft >= maxScroll - 2

  if (atEnd.value) {
    active.value = slides.value.length - 1
    return
  }

  const offsets = slideElements().map(slide => Math.abs(slide.offsetLeft - el.scrollLeft))
  active.value = offsets.indexOf(Math.min(...offsets))
}

function goTo(index: number) {
  const el = track.value
  const slide = slideElements()[index]

  if (!el || !slide) {
    return
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollTo({
    left: slide.offsetLeft,
    behavior: reduceMotion ? 'auto' : 'smooth'
  })
}

/** aria-disabled rather than disabled, so focus stays on the button at either end. */
function step(direction: -1 | 1) {
  if ((direction < 0 && atStart.value) || (direction > 0 && atEnd.value)) {
    return
  }

  goTo(active.value + direction)
}

useEventListener(track, 'scroll', useThrottleFn(sync, 80, true), { passive: true })
useResizeObserver(track, sync)

const counter = computed(() =>
  `${String(active.value + 1).padStart(2, '0')} / ${String(slides.value.length).padStart(2, '0')}`
)
</script>

<template>
  <section
    aria-roledescription="carousel"
    :aria-label="label"
    class="min-w-0"
  >
    <div class="relative">
      <div
        ref="track"
        class="relative flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain [scrollbar-width:none] sm:gap-4 [&::-webkit-scrollbar]:hidden"
      >
        <div
          v-for="(slide, index) in slides"
          :key="slide.title"
          role="group"
          aria-roledescription="slide"
          :aria-label="`${index + 1} of ${slides.length}: ${slide.title}`"
          class="w-[82%] shrink-0 snap-start sm:w-[72%]"
        >
          <EditorialPhoto
            :photo="slide"
            compact
            class="aspect-4/5 w-full"
          />
        </div>
      </div>

      <p
        aria-hidden="true"
        class="pointer-events-none absolute top-3 left-3 px-2.5 py-1.5 font-display text-xl leading-none font-bold uppercase sm:top-4 sm:left-4 sm:px-3 sm:py-2 sm:text-2xl"
        :class="tag.class"
      >
        {{ tag.text }}
      </p>
    </div>

    <div class="mt-4 flex items-center justify-between gap-4 border-t border-sand-950/15 pt-3">
      <p
        class="min-w-0 text-sm text-sand-800"
        aria-live="polite"
        aria-atomic="true"
      >
        <span class="mr-3 text-label font-semibold text-sand-700 tabular-nums">{{ counter }}</span>
        <span class="font-display text-lg font-bold text-sand-950 uppercase">{{ slides[active]?.title }}</span>
      </p>

      <div class="flex shrink-0 gap-2">
        <button
          type="button"
          class="inline-flex size-11 items-center justify-center rounded-[3px] border border-sand-950/30 text-sand-950 transition-colors hover:border-sand-950 aria-disabled:cursor-default aria-disabled:border-sand-950/15 aria-disabled:text-sand-400"
          :aria-label="`Previous: ${label}`"
          :aria-disabled="atStart || undefined"
          @click="step(-1)"
        >
          <UIcon
            name="i-lucide-arrow-left"
            class="size-4"
          />
        </button>
        <button
          type="button"
          class="inline-flex size-11 items-center justify-center rounded-[3px] border border-sand-950/30 text-sand-950 transition-colors hover:border-sand-950 aria-disabled:cursor-default aria-disabled:border-sand-950/15 aria-disabled:text-sand-400"
          :aria-label="`Next: ${label}`"
          :aria-disabled="atEnd || undefined"
          @click="step(1)"
        >
          <UIcon
            name="i-lucide-arrow-right"
            class="size-4"
          />
        </button>
      </div>
    </div>
  </section>
</template>
