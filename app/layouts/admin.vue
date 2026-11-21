<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const { sharedQuery } = useAdminFilters()
const { clear } = useUserSession()

const sections = [
  { label: 'Overview', icon: 'i-lucide-layout-dashboard', path: '/admin', exact: true },
  { label: 'Audience', icon: 'i-lucide-users', path: '/admin/audience' },
  { label: 'Struggles & Goals', icon: 'i-lucide-target', path: '/admin/struggles' },
  { label: 'Content Demand', icon: 'i-lucide-book-open', path: '/admin/content' },
  { label: 'Pricing Insights', icon: 'i-lucide-banknote', path: '/admin/pricing', badge: 'Soon' },
  { label: 'Response Insights', icon: 'i-lucide-sparkles', path: '/admin/insights', badge: 'Soon' },
  { label: 'All Responses', icon: 'i-lucide-table-properties', path: '/admin/responses' }
]

const items = computed<NavigationMenuItem[]>(() => sections.map(section => ({
  label: section.label,
  icon: section.icon,
  exact: section.exact,
  to: { path: section.path, query: sharedQuery.value },
  badge: section.badge ? { label: section.badge, color: 'neutral', variant: 'subtle', size: 'sm' } : undefined
})))

const signingOut = ref(false)

async function signOut() {
  signingOut.value = true
  await $fetch('/api/admin/logout', { method: 'POST' }).catch(() => {})
  await clear()
  await navigateTo('/admin/login')
}

useHead({
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
  bodyAttrs: { class: 'bg-sand-50' }
})
</script>

<template>
  <UDashboardGroup
    unit="rem"
    class="bg-sand-50"
  >
    <UDashboardSidebar
      :default-size="15"
      :min-size="15"
      :max-size="15"
      :ui="{ root: 'bg-white border-sand-200', footer: 'border-t border-sand-200' }"
    >
      <template #header>
        <NuxtLink
          to="/admin"
          class="flex items-center gap-2"
          aria-label="Dashboard overview"
        >
          <BrandLogo class="h-4" />
          <span class="text-label font-semibold text-sand-600 uppercase">Insights</span>
        </NuxtLink>
      </template>

      <UNavigationMenu
        :items="items"
        orientation="vertical"
        color="neutral"
        :ui="{ link: 'text-sm' }"
      />

      <template #footer>
        <div class="flex w-full flex-col gap-1">
          <UButton
            to="/"
            target="_blank"
            label="View site"
            icon="i-lucide-external-link"
            color="neutral"
            variant="ghost"
            size="sm"
            block
            class="justify-start"
          />
          <UButton
            label="Sign out"
            icon="i-lucide-log-out"
            color="neutral"
            variant="ghost"
            size="sm"
            block
            class="justify-start"
            :loading="signingOut"
            @click="signOut"
          />
        </div>
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>
