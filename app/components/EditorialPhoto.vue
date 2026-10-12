<script setup lang="ts">
export interface PhotoEntry {
  src: string
  alt: string
  position: string
  title: string
  brief: string
}

withDefaults(defineProps<{
  photo: PhotoEntry
  /** Above-the-fold images load eagerly with high fetch priority. */
  priority?: boolean
  /**
   * For frames that carry their own label in the top corner: the placeholder text
   * gathers at the bottom, and the shoot brief is dropped on narrow screens.
   */
  compact?: boolean
}>(), {
  priority: false,
  compact: false
})
</script>

<template>
  <div class="relative overflow-hidden bg-sand-200">
    <img
      v-if="photo.src"
      :src="photo.src"
      :alt="photo.alt"
      width="1200"
      height="1500"
      :loading="priority ? 'eager' : 'lazy'"
      :fetchpriority="priority ? 'high' : undefined"
      decoding="async"
      draggable="false"
      class="absolute inset-0 size-full object-cover"
      :style="{ objectPosition: photo.position }"
    >

    <div
      v-else
      role="img"
      :aria-label="`Placeholder: ${photo.title.toLowerCase()} to come`"
      class="absolute inset-0 flex flex-col ring-1 ring-sand-950/10 ring-inset sm:p-6"
      :class="compact ? 'justify-end gap-3 p-3' : 'justify-between p-4'"
    >
      <p
        class="flex items-center gap-2 font-semibold whitespace-nowrap text-sand-700 uppercase"
        :class="compact ? 'text-[0.6875rem] tracking-[0.1em] sm:text-label' : 'text-label'"
      >
        <span class="size-2 bg-lime-400 ring-1 ring-sand-950/20" />
        Photo to come
      </p>

      <div>
        <p class="font-display text-xl leading-none font-bold text-sand-950 uppercase sm:text-2xl">
          {{ photo.title }}
        </p>
        <p
          class="mt-2 max-w-xs text-xs leading-relaxed text-sand-700 sm:text-sm"
          :class="compact ? 'hidden sm:block' : ''"
        >
          {{ photo.brief }}
        </p>
      </div>
    </div>
  </div>
</template>
