<script setup lang="ts">
import type { PhotoEntry } from './EditorialPhoto.vue'

const props = defineProps<{
  slides: PhotoEntry[]
  /** Accessible name for the carousel, e.g. "Photos from when I started". */
  label: string
  /**
   * Text and colour classes for the tag pinned to the top corner of the frame.
   * `onDark` replaces the colours in the full-screen viewer, if they'd vanish there.
   */
  tag: { text: string, class: string, onDark?: string }
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

/*
 * Touch and trackpads scroll the track natively. A mouse has no horizontal swipe, so
 * dragging is handled here, with snapping paused until the pointer is released and
 * the track then settling on the nearest slide.
 */
const dragging = ref(false)
let dragStartX = 0
let dragStartScroll = 0
let dragMoved = false

function onPointerDown(event: PointerEvent) {
  if (event.pointerType !== 'mouse' || event.button !== 0 || !track.value) {
    return
  }

  dragStartX = event.clientX
  dragStartScroll = track.value.scrollLeft
  dragMoved = false
  dragging.value = true
}

function onPointerMove(event: PointerEvent) {
  const el = track.value

  if (!dragging.value || !el) {
    return
  }

  const distance = event.clientX - dragStartX

  if (!dragMoved && Math.abs(distance) > 6) {
    dragMoved = true
    el.setPointerCapture(event.pointerId)
    // Set inline rather than via a class: the class lands a render later, and until
    // then mandatory snapping pulls every scrollLeft write back to the current slide.
    el.style.scrollSnapType = 'none'
  }

  if (dragMoved) {
    el.scrollLeft = dragStartScroll - distance
  }
}

function onPointerUp() {
  if (!dragging.value) {
    return
  }

  dragging.value = false

  if (dragMoved && track.value) {
    sync()
    track.value.style.scrollSnapType = ''
    goTo(active.value)
  }
}

/** A drag ends with a click on whichever slide is under the pointer; it shouldn't open the viewer. */
function onClickCapture(event: MouseEvent) {
  if (dragMoved) {
    event.preventDefault()
    event.stopPropagation()
    dragMoved = false
  }
}

const { track: trackEvent } = useAnalytics()
const zoomOpen = ref(false)
const zoomIndex = ref(0)
const zoomItems = computed(() => slides.value.map(slide => ({ photo: slide, label: slide.title })))

/** Titles are optional, so screen-reader names fall back to the alt text. */
function slideName(slide: PhotoEntry) {
  return slide.title || slide.alt
}

function openZoom(index: number) {
  zoomIndex.value = index
  zoomOpen.value = true
  trackEvent('photo_zoom', { photo: index + 1, from: props.label })
}

watch(zoomOpen, (isOpen) => {
  if (!isOpen) {
    goTo(zoomIndex.value)
  }
})
</script>

<template>
  <section
    aria-roledescription="carousel"
    :aria-label="label"
    class="min-w-0"
    @keydown.left="step(-1)"
    @keydown.right="step(1)"
  >
    <div class="relative">
      <div
        ref="track"
        class="relative flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain [scrollbar-width:none] sm:gap-4 [&::-webkit-scrollbar]:hidden"
        :class="{ 'cursor-grabbing select-none': dragging }"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
        @click.capture="onClickCapture"
      >
        <div
          v-for="(slide, index) in slides"
          :key="index"
          role="group"
          aria-roledescription="slide"
          :aria-label="`${index + 1} of ${slides.length}: ${slideName(slide)}`"
          class="w-[82%] shrink-0 snap-start sm:w-[72%]"
        >
          <button
            type="button"
            class="relative block w-full cursor-zoom-in focus-visible:-outline-offset-2"
            :aria-label="`Enlarge photo ${index + 1}: ${slideName(slide)}`"
            @click="openZoom(index)"
          >
            <EditorialPhoto
              :photo="slide"
              compact
              class="aspect-4/5 w-full"
            />
            <span
              aria-hidden="true"
              class="absolute top-3 right-3 flex size-9 items-center justify-center bg-sand-50/90 text-sand-950 ring-1 ring-sand-950/15 sm:top-4 sm:right-4 sm:size-10"
            >
              <UIcon
                name="i-lucide-maximize-2"
                class="size-4"
              />
            </span>
          </button>
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
        <span class="font-semibold text-sand-950">{{ slides[active]?.title }}</span>
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

    <PhotoLightbox
      v-model:open="zoomOpen"
      v-model:index="zoomIndex"
      :items="zoomItems"
      :title="label"
    >
      <template #controls="{ counter: zoomCounter }">
        <p class="flex items-center gap-3">
          <span
            class="px-2.5 py-1.5 font-display text-xl leading-none font-bold uppercase"
            :class="tag.onDark ?? tag.class"
          >
            {{ tag.text }}
          </span>
          <span class="text-label font-semibold text-sand-300 uppercase tabular-nums">{{ zoomCounter }}</span>
        </p>
      </template>
    </PhotoLightbox>
  </section>
</template>
