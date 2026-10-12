<script setup lang="ts">
withDefaults(defineProps<{
  /** Segments joined by the brand slash, e.g. ['TRAIN', 'EAT', 'GROW']. */
  parts: string[]
  tone?: 'ink' | 'cream' | 'muted' | 'dim'
}>(), {
  tone: 'ink'
})

/*
 * Bright lime reads on near-black but washes out on cream, so the slash follows the
 * surface. The light-surface slash uses lime-800 to clear 4.5:1 on both cream tints.
 */
const tones = {
  ink: { text: 'text-sand-950', slash: 'text-lime-800' },
  cream: { text: 'text-sand-100', slash: 'text-lime-400' },
  muted: { text: 'text-sand-600', slash: 'text-lime-800' },
  dim: { text: 'text-sand-400', slash: 'text-lime-600' }
}
</script>

<template>
  <p
    class="flex flex-wrap items-center gap-x-2 gap-y-1 text-label font-semibold uppercase"
    :class="tones[tone].text"
  >
    <template
      v-for="(part, index) in parts"
      :key="part"
    >
      <span
        v-if="index > 0"
        aria-hidden="true"
        :class="tones[tone].slash"
      >/</span>
      <span>{{ part }}</span>
    </template>
  </p>
</template>
