<script setup lang="ts">
withDefaults(defineProps<{
  /** Set when the pair is the first thing on the page. */
  priority?: boolean
}>(), {
  priority: false
})

const { photos } = useAppConfig()

const frames = computed(() => [
  { label: 'Then', photo: photos.then, tag: 'bg-sand-950 text-sand-50' },
  { label: 'Now', photo: photos.now, tag: 'bg-lime-400 text-sand-950' }
])

const hasRealPhotos = computed(() => Boolean(photos.then.src && photos.now.src))
</script>

<template>
  <figure class="min-w-0">
    <div class="relative grid grid-cols-2 gap-1 sm:gap-1.5">
      <div
        v-for="frame in frames"
        :key="frame.label"
        class="relative min-w-0"
      >
        <EditorialPhoto
          :photo="frame.photo"
          :priority="priority"
          compact
          class="aspect-2/3 w-full sm:aspect-3/4 lg:aspect-2/3"
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
      </div>

      <span
        aria-hidden="true"
        class="absolute top-1/2 left-1/2 flex size-10 -translate-1/2 items-center justify-center bg-lime-400 text-sand-950 ring-4 ring-sand-100 sm:size-14"
      >
        <UIcon
          name="i-lucide-arrow-right"
          class="size-5 sm:size-6"
        />
      </span>
    </div>

    <figcaption
      v-if="hasRealPhotos"
      class="mt-3 px-(--gutter) text-xs leading-relaxed text-sand-700 lg:px-0"
    >
      My own progress photos. Individual results vary.
    </figcaption>
  </figure>
</template>
