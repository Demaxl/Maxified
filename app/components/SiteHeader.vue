<script setup lang="ts">
const route = useRoute()

const links = computed(() => [
  { label: 'Story', to: '/#story' },
  { label: 'The Guide', to: '/#inside' },
  ...(route.path === '/survey' ? [] : [{ label: 'Survey', to: '/survey' }])
])
</script>

<template>
  <header class="fixed inset-x-0 top-0 z-50 border-b border-sand-950/10 bg-sand-100">
    <div class="shell flex h-16 items-center justify-between gap-4">
      <NuxtLink
        to="/"
        class="rounded-[2px] py-2 transition-opacity hover:opacity-65"
      >
        <span class="sr-only">MAXIFIED — home</span>
        <BrandLogo class="h-5 sm:h-6" />
      </NuxtLink>

      <div class="flex items-center gap-1 sm:gap-2">
        <nav
          aria-label="Primary"
          class="hidden items-center md:flex"
        >
          <NuxtLink
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            class="rounded-[2px] px-3.5 py-2.5 text-sm text-sand-700 transition-colors hover:text-sand-950"
          >
            {{ link.label }}
          </NuxtLink>
        </nav>
        <AppButton
          to="/#waitlist"
          class="ml-2 h-10 px-4"
        >
          Join the Waitlist
        </AppButton>
      </div>
    </div>
  </header>
</template>
