<script setup lang="ts">
const { track } = useAnalytics()
const section = useTemplateRef<HTMLElement>('section')

useIntersectionObserver(section, ([entry]) => {
  if (entry?.isIntersecting) {
    track('waitlist_view')
  }
}, { threshold: 0.3 })
</script>

<template>
  <section
    id="waitlist"
    ref="section"
    class="surface-dark bg-sand-950 py-16 text-sand-100 sm:py-20 lg:py-28"
  >
    <div class="shell grid gap-10 lg:grid-cols-12 lg:gap-x-10">
      <div class="min-w-0 lg:col-span-5">
        <SlashLabel
          :parts="['Early Access']"
          tone="cream"
        />
        <h2 class="mt-5 font-display text-headline font-bold text-balance text-sand-50 uppercase">
          Be first to get MAXIFIED.
        </h2>
        <p class="mt-6 max-w-sm text-base leading-relaxed text-sand-300 sm:text-lg">
          Join the early-access list and get an exclusive launch discount when the guide drops.
          The amount is confirmed closer to launch.
        </p>
      </div>

      <div class="min-w-0 border-t border-sand-100/15 pt-8 lg:col-span-6 lg:col-start-7 lg:self-end lg:pt-10">
        <WaitlistForm
          source="waitlist_section"
          tone="dark"
        />
      </div>
    </div>
  </section>
</template>
