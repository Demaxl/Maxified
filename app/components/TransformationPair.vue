<script setup lang="ts">
withDefaults(defineProps<{
  /** Set when the pair is the first thing on the page. */
  priority?: boolean
}>(), {
  priority: false
})

const { photos } = useAppConfig()
const { track } = useAnalytics()

const frames = computed(() => [
  { label: 'Then', photo: photos.then, tag: 'bg-sand-950 text-sand-50', toggle: 'bg-sand-50 text-sand-950' },
  { label: 'Now', photo: photos.now, tag: 'bg-lime-400 text-sand-950', toggle: 'bg-lime-400 text-sand-950' }
])

const hasRealPhotos = computed(() => Boolean(photos.then.src && photos.now.src))

const zoomOpen = ref(false)
const zoomIndex = ref(0)
const zoomItems = computed(() => frames.value.map(frame => ({
  photo: frame.photo,
  label: frame.label,
  detail: frame.photo.taken
})))

function openZoom(index: number) {
  zoomIndex.value = index
  zoomOpen.value = true
  track('photo_zoom', { photo: frames.value[index]?.label.toLowerCase() ?? '' })
}
</script>

<template>
  <figure class="min-w-0">
    <div class="relative grid grid-cols-2 gap-1 sm:gap-1.5">
      <div
        v-for="(frame, index) in frames"
        :key="frame.label"
        class="relative min-w-0"
      >
        <EditorialPhoto
          :photo="frame.photo"
          :priority="priority"
          compact
          class="aspect-4/5 w-full sm:aspect-3/4 lg:aspect-2/3"
        />
        <p
          class="absolute top-3 left-3 flex items-baseline gap-2 px-2.5 py-1.5 sm:top-4 sm:left-4 sm:px-3 sm:py-2"
          :class="frame.tag"
        >
          <span class="font-display text-xl leading-none font-bold uppercase sm:text-3xl">
            {{ frame.label }}
          </span>
          <span
            v-if="frame.photo.taken"
            class="text-xs font-medium tabular-nums"
          >
            {{ frame.photo.taken }}
          </span>
        </p>

        <button
          type="button"
          class="absolute inset-0 flex cursor-zoom-in items-start justify-end p-2.5 focus-visible:-outline-offset-2 sm:p-4"
          :aria-label="`Enlarge the ${frame.label.toLowerCase()} photo`"
          @click="openZoom(index)"
        >
          <span
            aria-hidden="true"
            class="flex size-8 items-center justify-center bg-sand-50/90 text-sand-950 ring-1 ring-sand-950/15 sm:size-10"
          >
            <UIcon
              name="i-lucide-maximize-2"
              class="size-4"
            />
          </span>
        </button>
      </div>

      <span
        aria-hidden="true"
        class="pointer-events-none absolute top-1/2 left-1/2 flex size-10 -translate-1/2 items-center justify-center bg-lime-400 text-sand-950 ring-4 ring-sand-100 sm:size-14"
      >
        <UIcon
          name="i-lucide-arrow-right"
          class="size-5 sm:size-6"
        />
      </span>
    </div>

    <figcaption
      v-if="hasRealPhotos"
      class="mt-3 text-xs leading-relaxed text-sand-700"
    >
      My own progress photos. Individual results vary.
    </figcaption>

    <PhotoLightbox
      v-model:open="zoomOpen"
      v-model:index="zoomIndex"
      :items="zoomItems"
      title="Before and after"
    >
      <template #controls>
        <div
          role="group"
          aria-label="Choose a photo"
          class="flex gap-1 bg-sand-900 p-1"
        >
          <button
            v-for="(frame, index) in frames"
            :key="frame.label"
            type="button"
            class="min-w-20 px-4 py-2 font-display text-xl leading-none font-bold uppercase transition-colors"
            :class="zoomIndex === index ? frame.toggle : 'text-sand-300 hover:text-sand-50'"
            :aria-pressed="zoomIndex === index"
            @click="zoomIndex = index"
          >
            {{ frame.label }}
          </button>
        </div>
      </template>
    </PhotoLightbox>
  </figure>
</template>
