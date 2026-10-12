<script setup lang="ts">
const { track } = useAnalytics()
</script>

<template>
  <section class="flex flex-col bg-sand-100 pt-16 [--split:0.4] lg:split-bleed">
    <div class="shell pt-8 pb-12 sm:pt-12 sm:pb-16 lg:col-start-2 lg:mx-0 lg:max-w-none lg:self-center lg:px-0 lg:py-16 lg:pr-12 xl:pr-14">
      <p class="text-label font-semibold text-sand-700 uppercase">
        A downloadable fitness guide by Maxi
      </p>

      <h1 class="mt-4 font-display text-display font-bold text-sand-950 uppercase sm:mt-6 lg:text-[clamp(3.5rem,6vw,5.5rem)]">
        <span class="block">Built from</span>
        <span class="block">experience.</span>
      </h1>

      <p class="mt-5 max-w-md text-lg leading-relaxed text-sand-800 sm:mt-7">
        Five years of training, nutrition, mistakes, and lessons—everything I wish I knew when I
        started.
      </p>

      <div class="mt-7 flex flex-wrap items-center gap-x-7 gap-y-4">
        <AppButton
          to="/#waitlist"
          size="lg"
          @click="track('waitlist_cta_click', { from: 'hero' })"
        >
          Join the Waitlist
          <template #trailing>
            <UIcon
              name="i-lucide-arrow-right"
              class="size-4"
            />
          </template>
        </AppButton>

        <NuxtLink
          to="/#story"
          class="rounded-[2px] py-2 text-sm font-medium text-sand-800 underline decoration-sand-400 underline-offset-[6px] transition-colors hover:text-sand-950 hover:decoration-sand-950"
        >
          Explore My Story
        </NuxtLink>
      </div>

      <p class="mt-6 max-w-sm text-sm leading-relaxed text-sand-700">
        In development. The waitlist gets early access and a launch discount.
      </p>
    </div>

    <TransformationPair
      priority
      class="order-first lg:order-none lg:col-span-2 lg:col-start-3 lg:self-start"
    />
  </section>
</template>
