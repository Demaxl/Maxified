<script setup lang="ts">
import type { PhotoEntry } from './EditorialPhoto.vue'

export interface LightboxItem {
  photo: PhotoEntry
  /** Short name shown in the caption, e.g. "Then" or "Back". */
  label: string
  /** Optional detail after the label, such as the date taken. */
  detail?: string
}

const props = defineProps<{
  items: LightboxItem[]
  /** Accessible name for the dialog. */
  title: string
}>()

const open = defineModel<boolean>('open', { default: false })
const index = defineModel<number>('index', { default: 0 })

const current = computed(() => props.items[index.value] ?? props.items[0])
const atStart = computed(() => index.value <= 0)
const atEnd = computed(() => index.value >= props.items.length - 1)

const counter = computed(() =>
  `${String(index.value + 1).padStart(2, '0')} / ${String(props.items.length).padStart(2, '0')}`
)

function step(direction: -1 | 1) {
  const next = index.value + direction

  if (next >= 0 && next < props.items.length) {
    index.value = next
  }
}

const stage = useTemplateRef<HTMLElement>('stage')

usePointerSwipe(stage, {
  onSwipeEnd(_event, direction) {
    if (direction === 'left') {
      step(1)
    } else if (direction === 'right') {
      step(-1)
    }
  }
})
</script>

<template>
  <UModal
    v-model:open="open"
    fullscreen
    :title="title"
    description="Swipe, or use the arrow buttons or arrow keys, to move between photos."
    :ui="{ content: 'surface-dark divide-y-0 bg-sand-950 text-sand-50 ring-0' }"
  >
    <template #content="{ close }">
      <div
        class="flex h-full flex-col"
        @keydown.left.prevent="step(-1)"
        @keydown.right.prevent="step(1)"
      >
        <div class="flex min-h-17 items-center justify-between gap-4 px-(--gutter) py-3">
          <slot
            name="controls"
            :counter="counter"
          >
            <p class="text-label font-semibold text-sand-300 uppercase tabular-nums">
              {{ counter }}
            </p>
          </slot>

          <button
            type="button"
            class="inline-flex size-11 shrink-0 items-center justify-center rounded-[3px] text-sand-50 transition-colors hover:bg-sand-900"
            aria-label="Close"
            @click="close"
          >
            <UIcon
              name="i-lucide-x"
              class="size-6"
            />
          </button>
        </div>

        <div
          ref="stage"
          class="relative min-h-0 flex-1 px-(--gutter) pb-4 select-none"
        >
          <EditorialPhoto
            v-if="current"
            :key="index"
            :photo="current.photo"
            priority
            contain
            class="size-full"
          />

          <template v-if="items.length > 1">
            <button
              type="button"
              class="absolute top-1/2 left-[calc(var(--gutter)+0.5rem)] inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-[3px] bg-sand-950/75 text-sand-50 transition-colors hover:bg-sand-950 aria-disabled:cursor-default aria-disabled:opacity-30"
              aria-label="Previous photo"
              :aria-disabled="atStart || undefined"
              @click="step(-1)"
            >
              <UIcon
                name="i-lucide-arrow-left"
                class="size-5"
              />
            </button>
            <button
              type="button"
              class="absolute top-1/2 right-[calc(var(--gutter)+0.5rem)] inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-[3px] bg-sand-950/75 text-sand-50 transition-colors hover:bg-sand-950 aria-disabled:cursor-default aria-disabled:opacity-30"
              aria-label="Next photo"
              :aria-disabled="atEnd || undefined"
              @click="step(1)"
            >
              <UIcon
                name="i-lucide-arrow-right"
                class="size-5"
              />
            </button>
          </template>
        </div>

        <p
          class="sr-only"
          aria-live="polite"
        >
          Photo {{ index + 1 }} of {{ items.length }}{{ current?.label ? `: ${current.label}` : '' }}
        </p>

        <p
          v-if="current?.label"
          aria-hidden="true"
          class="px-(--gutter) pb-4 text-sm text-sand-300"
        >
          <span class="font-semibold text-sand-50">{{ current.label }}</span>
          <template v-if="current.detail">
            · {{ current.detail }}
          </template>
        </p>
      </div>
    </template>
  </UModal>
</template>
