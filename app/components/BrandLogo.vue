<script setup lang="ts">
const { brand } = useAppConfig()
</script>

<template>
  <img
    :src="brand.logo.svg"
    alt=""
    :width="brand.logo.width"
    :height="brand.logo.height"
    decoding="async"
    class="block w-auto"
  >
</template>
