<script setup lang="ts">
defineProps<{
  phase: string
  title: string
  body: string
}>()
</script>

<template>
  <div class="flex max-w-2xl flex-col items-start gap-3 rounded-lg border border-dashed border-sand-300 bg-white p-6 sm:p-8">
    <UBadge
      :label="phase"
      color="neutral"
      variant="subtle"
    />
    <h2 class="text-lg font-semibold text-sand-950">
      {{ title }}
    </h2>
    <p class="text-sm/relaxed text-sand-700">
      {{ body }}
    </p>
    <UButton
      to="/admin/responses"
      label="Browse all responses"
      color="neutral"
      variant="outline"
      size="sm"
      trailing-icon="i-lucide-arrow-right"
    />
  </div>
</template>
