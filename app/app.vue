<script setup lang="ts">
const { brand } = useAppConfig()
const { siteUrl } = useRuntimeConfig().public

/**
 * Site-wide share card, so links to any page get the image. `og.jpg` must stay 1200 × 630
 * and under 1 MB; bump `v` when replacing it, since platforms cache cards by URL.
 */
const shareImage = `${siteUrl}/images/og.jpg?v=2`

useSeoMeta({
  ogSiteName: brand.name,
  ogImage: shareImage,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageType: 'image/jpeg',
  ogImageAlt: `${brand.name} wordmark and "${brand.tagline}" beside Maxi, shirtless, in warm side light`,
  twitterCard: 'summary_large_image',
  twitterImage: shareImage
})

useHead({
  titleTemplate: title => (title ? `${title} — ${brand.name}` : brand.name),
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'theme-color', content: '#F4F1E8' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
    { rel: 'manifest', href: '/site.webmanifest' },
    { rel: 'canonical', href: siteUrl }
  ],
  htmlAttrs: {
    lang: 'en',
    class: 'font-sans antialiased'
  },
  bodyAttrs: {
    class: 'bg-sand-100 text-sand-950'
  }
})
</script>

<template>
  <UApp>
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:rounded-[3px] focus:bg-lime-400 focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-sand-950"
    >
      Skip to content
    </a>

    <SiteHeader />

    <main id="main">
      <NuxtPage />
    </main>

    <SiteFooter />
  </UApp>
</template>
