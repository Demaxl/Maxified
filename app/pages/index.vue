<script setup lang="ts">
const { brand } = useAppConfig()
const { siteUrl } = useRuntimeConfig().public

// Search results show ~155 characters; social cards ~125, so the card gets its own shorter line.
const description = `${brand.name} is a downloadable fitness guide by Maxi: four years of training, nutrition and lessons. Join the waitlist for early access and a launch discount.`
const shareDescription = 'Four years of training, nutrition and lessons in one guide. Join the waitlist for early access and a launch discount.'

useSeoMeta({
  title: brand.tagline,
  description,
  ogTitle: `${brand.name} — ${brand.tagline}`,
  ogDescription: shareDescription,
  ogType: 'website',
  ogUrl: siteUrl,
  twitterTitle: `${brand.name} — ${brand.tagline}`,
  twitterDescription: shareDescription
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
