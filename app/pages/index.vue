<script setup lang="ts">
const { brand } = useAppConfig()
const { siteUrl } = useRuntimeConfig().public

const description = `${brand.name} is a downloadable fitness guide by Maxi: four years of training, nutrition, mistakes and lessons. It's in development — join the waitlist for early access and an exclusive launch discount.`

useSeoMeta({
  title: brand.tagline,
  description,
  ogTitle: `${brand.name} — ${brand.tagline}`,
  ogDescription: description,
  ogType: 'website',
  ogUrl: siteUrl,
  ogImage: `${siteUrl}/images/og.jpg`,
  twitterCard: 'summary_large_image'
})

useHead({
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      'name': brand.name,
      'url': siteUrl,
      'logo': `${siteUrl}${brand.logo.png}`
    })
  }]
})
</script>

<template>
  <div>
    <LandingTheHero />
    <LandingTheTransformation />
    <LandingTheGuide />
    <LandingTheWaitlist />
    <LandingTheCommunity />
  </div>
</template>
