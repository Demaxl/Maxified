<script setup lang="ts">
const { brand } = useAppConfig()
const { socials, contact } = useSiteLinks()

const year = new Date().getFullYear()
</script>

<template>
  <footer class="bg-sand-100 text-sand-800">
    <div class="shell">
      <div class="flex flex-col gap-8 border-t border-sand-950/15 pt-10 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div class="min-w-0">
          <NuxtLink
            to="/"
            class="inline-block rounded-[2px] transition-opacity hover:opacity-65"
          >
            <span class="sr-only">MAXIFIED — home</span>
            <BrandLogo
              loading="lazy"
              class="h-8 sm:h-10"
            />
          </NuxtLink>
          <p class="mt-3 text-sm text-sand-700">
            {{ brand.tagline }}
          </p>
        </div>

        <nav
          aria-label="Footer"
          class="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm"
        >
          <a
            v-for="social in socials"
            :key="social.label"
            :href="social.href"
            target="_blank"
            rel="noopener noreferrer"
            class="rounded-[2px] py-1.5 transition-colors hover:text-sand-950"
          >
            {{ social.label }}
          </a>
          <a
            v-if="contact"
            :href="`mailto:${contact}`"
            class="rounded-[2px] py-1.5 transition-colors hover:text-sand-950"
          >
            Contact
          </a>
          <NuxtLink
            to="/privacy"
            class="rounded-[2px] py-1.5 transition-colors hover:text-sand-950"
          >
            Privacy Policy
          </NuxtLink>
        </nav>
      </div>

      <div class="flex flex-col gap-4 border-t border-sand-950/10 py-8 text-xs leading-relaxed text-sand-700 sm:flex-row sm:items-start sm:justify-between sm:gap-10">
        <p class="max-w-2xl">
          I'm not a certified trainer, dietitian or medical professional. Everything here comes from
          my own experience and general fitness principles — it's educational, not individualised
          medical or nutritional advice. Check with a qualified professional before making big
          changes to your training or diet.
        </p>
        <SlashLabel
          :parts="[brand.name, String(year)]"
          tone="muted"
          class="shrink-0"
        />
      </div>
    </div>
  </footer>
</template>
