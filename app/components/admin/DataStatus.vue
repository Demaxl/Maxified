<script setup lang="ts">
const props = defineProps<{
  generatedAt?: string | null
  loading?: boolean
}>()

const emit = defineEmits<{ refresh: [] }>()

const timeFormatter = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

const updated = computed(() => props.generatedAt ? timeFormatter.format(new Date(props.generatedAt)) : null)
</script>

<template>
  <div class="flex items-center gap-2">
    <span
      v-if="updated"
      class="hidden text-xs text-sand-600 sm:inline"
      aria-live="polite"
    >
      Updated {{ updated }}
    </span>
    <UButton
      icon="i-lucide-refresh-cw"
      color="neutral"
      variant="outline"
      size="sm"
      :loading="loading"
      :label="loading ? 'Refreshing' : 'Refresh'"
      :ui="{ label: 'hidden sm:inline' }"
      :aria-label="loading ? 'Refreshing data' : 'Refresh data'"
      @click="emit('refresh')"
    />
  </div>
</template>
